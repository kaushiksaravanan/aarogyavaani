"""
AarogyaVaani — Voice AI agent backend for healthcare accessibility in India.
FastAPI server exposing tool endpoints for Vapi + Qdrant RAG pipeline.
"""

import base64
import hmac
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional
from uuid import uuid4

import httpx
from fastapi import FastAPI, HTTPException, Request, Header, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from qdrant_client import QdrantClient, models
from pypdf import PdfReader

from app.config import (
    APP_SERVICE_NAME,
    APP_VERSION,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    KNOWLEDGE_COLLECTION,
    MEMORY_COLLECTION,
    QDRANT_API_KEY,
    QDRANT_URL,
    VAPI_SECRET,
    SERVER_URL,
)

# Authentication secret for user data endpoints (optional, for added security)
USER_DATA_SECRET = os.getenv("USER_DATA_SECRET", "")
from app.languages import (
    KNOWLEDGE_FILTER_CODES,
    LANGUAGE_CATALOG,
    get_language_label,
    normalize_language,
)
from app.embeddings import get_embedding_router
from app.models import (
    AgentChatRequest,
    AgentChatResponse,
    AgentStepTrace,
    AgentToolCallTrace,
    CallHistoryEntry,
    CallHistoryResponse,
    ConversationSummary,
    DoctorBriefRequest,
    DoctorBriefResponse,
    FamilyContextQuery,
    FamilyContextResult,
    HealthQueryRequest,
    HealthQueryResponse,
    HealthReportResponse,
    HealthResponse,
    HealthTask,
    MedicalReportEntry,
    MedicalReportListResponse,
    MedicalReportChunkEntry,
    MedicalReportChunksResponse,
    MedicalReportUploadRequest,
    MedicalReportUploadResponse,
    ProactiveAlert,
    ProactiveCheckResponse,
    ProactiveIntelligenceResponse,
    ReferenceItem,
    SchemeMatch,
    SchemeMatchRequest,
    SchemeMatchResponse,
    SeasonalRisk,
    SmartScanRequest,
    SmartScanResponse,
    SupportedLanguageItem,
    SupportedLanguagesResponse,
    TaskGenerationRequest,
    TaskGenerationResponse,
    VapiMessage,
    WorkflowRequest,
    WorkflowResponse,
)
from app.agents import (
    AgentEngine,
    AgentRole,
    ToolExecutor,
    route_to_agent,
    run_proactive_analysis,
    run_health_workflow,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("aarogyavaani")

# ---------------------------------------------------------------------------
# Global singletons — lazy-initialised for Vercel serverless compatibility
# ---------------------------------------------------------------------------
http_client: Optional[httpx.AsyncClient] = None
qdrant: Optional[QdrantClient] = None

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"
MAX_UPLOAD_BYTES = 6 * 1024 * 1024

SCRIPT_HINTS = [
    ("kn", re.compile(r"[\u0C80-\u0CFF]")),
    ("ta", re.compile(r"[\u0B80-\u0BFF]")),
    ("te", re.compile(r"[\u0C00-\u0C7F]")),
    ("bn", re.compile(r"[\u0980-\u09FF]")),
    ("hi", re.compile(r"[\u0900-\u097F]")),
    ("ur", re.compile(r"[\u0600-\u06FF]")),
    ("ja", re.compile(r"[\u3040-\u30FF\u4E00-\u9FFF]")),
]


def get_http_client() -> httpx.AsyncClient:
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient(timeout=30.0)
    return http_client


def get_qdrant() -> QdrantClient:
    global qdrant
    if qdrant is None:
        qdrant = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY if QDRANT_API_KEY else None,
            timeout=30,
        )
    return qdrant


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _excerpt(text: str, limit: int = 280) -> str:
    value = _clean_text(text)
    if len(value) <= limit:
        return value
    return value[: limit - 3].rstrip() + "..."


def _unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        cleaned = _clean_text(value)
        if not cleaned:
            continue
        lowered = cleaned.casefold()
        if lowered in seen:
            continue
        seen.add(lowered)
        ordered.append(cleaned)
    return ordered


def _detect_language_hint(text: str, fallback: str = "auto") -> str:
    normalized_fallback = normalize_language(fallback)
    if normalized_fallback not in {"auto", "multi"}:
        return normalized_fallback

    for code, pattern in SCRIPT_HINTS:
        if pattern.search(text or ""):
            return code
    return "auto"


def _knowledge_language_for_filter(language: str) -> str:
    normalized = normalize_language(language)
    base_code = normalized.split("-", 1)[0]
    return base_code if base_code in KNOWLEDGE_FILTER_CODES else "auto"


def _memory_points_to_references(points: list[dict]) -> list[ReferenceItem]:
    refs: list[ReferenceItem] = []
    for point in points:
        payload = point.get("payload", {}) or {}
        entry_type = payload.get("entry_type", "call-summary")
        refs.append(
            ReferenceItem(
                id=point.get("id", ""),
                type=entry_type,
                title=payload.get("report_name")
                or payload.get("source_label")
                or (
                    "Patient report"
                    if entry_type == "medical-report"
                    else "Patient history"
                ),
                source=payload.get("source_label") or entry_type,
                excerpt=_excerpt(
                    payload.get("report_summary")
                    or payload.get("summary")
                    or payload.get("report_text_excerpt", "")
                ),
                language=normalize_language(payload.get("language", "auto")),
                score=float(point.get("score", 0.0) or 0.0),
                rationale=(
                    "Matches an uploaded medical report"
                    if entry_type == "medical-report"
                    else "Matches prior conversation history"
                ),
                metadata={
                    "medicines": payload.get("medicines", []),
                    "conditions": payload.get("conditions", []),
                    "saved_at": payload.get("saved_at", ""),
                },
            )
        )
    return refs


def _knowledge_points_to_references(points: list[dict]) -> list[ReferenceItem]:
    refs: list[ReferenceItem] = []
    for point in points:
        payload = point.get("payload", {}) or {}
        refs.append(
            ReferenceItem(
                id=point.get("id", ""),
                type="knowledge-base",
                title=payload.get("title")
                or payload.get("source")
                or "Health knowledge",
                source=payload.get("source", "knowledge-base"),
                excerpt=_excerpt(payload.get("text") or payload.get("content", "")),
                language=normalize_language(payload.get("language", "auto")),
                score=float(point.get("score", 0.0) or 0.0),
                rationale="Matches the verified health knowledge base",
                metadata={},
            )
        )
    return refs


def _build_reasoning_summary(knowledge: list[dict], memory: list[dict]) -> str:
    knowledge_count = len(knowledge)
    report_count = sum(
        1
        for item in memory
        if (item.get("payload", {}) or {}).get("entry_type") == "medical-report"
    )
    history_count = max(len(memory) - report_count, 0)

    parts = []
    if knowledge_count:
        parts.append(f"{knowledge_count} verified knowledge source(s)")
    if report_count:
        parts.append(f"{report_count} uploaded medical report(s)")
    if history_count:
        parts.append(f"{history_count} prior conversation memory item(s)")
    if not parts:
        return "No matching supporting references were found."
    return "Answer grounded in " + ", ".join(parts) + "."


def _list_user_memory_points(user_id: str, limit: int = 200) -> list:
    qdrant_client = get_qdrant()
    results = qdrant_client.scroll(
        collection_name=MEMORY_COLLECTION,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="user_phone",
                    match=models.MatchValue(value=user_id),
                )
            ]
        ),
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )
    return results[0] if results else []


def _extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    pages = []
    for page in reader.pages[:10]:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            continue
    return _clean_text("\n".join(pages))


def _chunk_report_text(text: str, max_chars: int = 650) -> list[str]:
    cleaned = _clean_text(text)
    if not cleaned:
        return []

    paragraphs = [part.strip() for part in re.split(r"\n{2,}", cleaned) if part.strip()]
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        candidate = f"{current}\n\n{para}".strip() if current else para
        if len(candidate) <= max_chars:
            current = candidate
            continue

        if current:
            chunks.append(current)
            current = ""

        if len(para) <= max_chars:
            current = para
        else:
            sentences = re.split(r"(?<=[.!?])\s+", para)
            sentence_chunk = ""
            for sentence in sentences:
                sentence_candidate = (
                    f"{sentence_chunk} {sentence}".strip()
                    if sentence_chunk
                    else sentence
                )
                if len(sentence_candidate) <= max_chars:
                    sentence_chunk = sentence_candidate
                else:
                    if sentence_chunk:
                        chunks.append(sentence_chunk)
                    sentence_chunk = sentence
            if sentence_chunk:
                current = sentence_chunk

    if current:
        chunks.append(current)

    return chunks[:12]


def _report_chunk_to_entry(point) -> MedicalReportChunkEntry:
    payload = point.payload or {}
    return MedicalReportChunkEntry(
        chunk_id=str(point.id),
        report_id=payload.get("report_id", ""),
        report_name=payload.get("report_name", ""),
        chunk_index=int(payload.get("chunk_index", 0) or 0),
        title=payload.get("chunk_title", "Report chunk"),
        text=payload.get("chunk_text", ""),
        medicines=payload.get("medicines", []),
        conditions=payload.get("conditions", []),
        language=normalize_language(payload.get("language", "auto")),
        saved_at=payload.get("saved_at", payload.get("timestamp", "")),
        source_label=payload.get("source_label", "Uploaded report chunk"),
    )


async def _gemini_chat(
    messages: list[dict], max_tokens: int = 800
) -> str:
    """Call Google Gemini API — primary LLM provider for AarogyaVaani."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API key not configured")

    # Convert OpenAI-format messages to Gemini format
    gemini_contents = []
    system_instruction = None

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "system":
            system_instruction = content
            continue

        if role == "assistant":
            gemini_contents.append({
                "role": "model",
                "parts": [{"text": content or ""}],
            })
        elif isinstance(content, list):
            # Multimodal content (text + images)
            parts = []
            for item in content:
                if item.get("type") == "text":
                    parts.append({"text": item["text"]})
                elif item.get("type") == "image_url":
                    url = item["image_url"]["url"]
                    if url.startswith("data:"):
                        header, data = url.split(",", 1)
                        mime = header.split(":")[1].split(";")[0]
                        parts.append({
                            "inlineData": {
                                "mimeType": mime,
                                "data": data,
                            }
                        })
            gemini_contents.append({"role": "user", "parts": parts})
        else:
            gemini_contents.append({
                "role": "user",
                "parts": [{"text": content or ""}],
            })

    model = GEMINI_MODEL
    url = f"{GEMINI_API_URL}/models/{model}:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": gemini_contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": max_tokens,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    client = get_http_client()
    response = await client.post(
        url,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=40.0,
    )
    response.raise_for_status()
    data = response.json()

    # Extract text from Gemini response
    try:
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates in Gemini response")
        parts = candidates[0].get("content", {}).get("parts", [])
        text_parts = [p["text"] for p in parts if "text" in p]
        return " ".join(text_parts).strip()
    except (KeyError, IndexError, TypeError) as e:
        logger.error("Unexpected Gemini response structure: %s", data)
        raise HTTPException(
            status_code=502, detail="Invalid response from Gemini"
        )


async def _openrouter_chat(messages: list[dict], max_tokens: int = 800) -> str:
    """Fallback LLM provider via OpenRouter (GPT-4o-mini)."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenRouter is not configured")

    client = get_http_client()
    response = await client.post(
        OPENROUTER_URL,
        json={
            "model": "openai/gpt-4o-mini",
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": max_tokens,
        },
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=40.0,
    )
    response.raise_for_status()
    data = response.json()

    # Safe extraction with proper error handling
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as e:
        logger.error("Unexpected OpenRouter response structure: %s", data)
        raise HTTPException(
            status_code=502, detail="Invalid response from chat service"
        )


async def _llm_chat(messages: list[dict], max_tokens: int = 800) -> str:
    """
    Unified LLM chat — tries Gemini first, falls back to OpenRouter.
    This is the primary LLM interface for all non-agentic endpoints.
    """
    if GEMINI_API_KEY:
        try:
            return await _gemini_chat(messages, max_tokens)
        except Exception as exc:
            logger.warning("Gemini LLM call failed, falling back to OpenRouter: %s", exc)

    return await _openrouter_chat(messages, max_tokens)


def _strip_code_fence(content: str) -> str:
    value = content.strip()
    if value.startswith("```"):
        value = value.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return value


async def _analyze_image_upload(
    file_name: str, mime_type: str, content_base64: str
) -> dict:
    # Validate file size before processing (base64 is ~33% larger than raw)
    estimated_size = len(content_base64) * 3 // 4
    if estimated_size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)}MB",
        )

    # Validate mime type
    allowed_mime_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
    }
    if mime_type not in allowed_mime_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {mime_type}. Allowed: {', '.join(allowed_mime_types)}",
        )

    content = await _llm_chat(
        [
            {
                "role": "system",
                "content": (
                    "You extract healthcare data from medical images with truthful restraint. "
                    "Read the image and return strict JSON with keys: extracted_text, "
                    "summary, medicines, conditions, language, reasoning. Use arrays for "
                    "medicines and conditions. If unsure, say so in reasoning instead of guessing."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"Analyze this uploaded medical image named {file_name}. Extract the text, "
                            "list medicines and conditions, summarize the medical context, and mention "
                            "what evidence was actually visible. Return JSON only."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{content_base64}"
                        },
                    },
                ],
            },
        ],
        max_tokens=1200,
    )
    try:
        return json.loads(_strip_code_fence(content))
    except json.JSONDecodeError as e:
        logger.error("LLM returned invalid JSON for image analysis: %s", content[:200])
        raise HTTPException(
            status_code=502, detail="Invalid response from analysis service"
        )


async def _analyze_text_upload(text: str, language_hint: str) -> dict:
    content = await _llm_chat(
        [
            {
                "role": "system",
                "content": (
                    "You analyze medical report text with truthful restraint. Return strict JSON "
                    "with keys: extracted_text, summary, medicines, conditions, language, reasoning. "
                    "Only include medicines and conditions explicitly present in the text."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Language hint: {language_hint}\n\n"
                    "Analyze this medical report text. Extract a clean summary, medicines, conditions, "
                    "and a short reasoning note on what parts of the report were used. Return JSON only.\n\n"
                    f"TEXT:\n{text[:12000]}"
                ),
            },
        ],
        max_tokens=1000,
    )
    try:
        return json.loads(_strip_code_fence(content))
    except json.JSONDecodeError as e:
        logger.error("LLM returned invalid JSON for text analysis: %s", content[:200])
        raise HTTPException(
            status_code=502, detail="Invalid response from analysis service"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Pre-warming clients...")
    get_http_client()
    get_qdrant()
    logger.info("Clients ready.")

    yield  # app runs here

    # Shutdown
    if http_client:
        await http_client.aclose()
    if qdrant:
        qdrant.close()
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AarogyaVaani Backend",
    description="Voice AI healthcare agent — Vapi tool server & Qdrant RAG",
    version=APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aarogyavaani-app.vercel.app",
        "https://aarogyavaani-app-kaushiks-projects-ef17dfbd.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "x-vapi-secret",
    ],
    # Only allow aarogyavaani preview deployments
    allow_origin_regex=r"https://aarogyavaani-app(-[a-z0-9]+)?\.vercel\.app",
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return useful error details."""
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
            "path": str(request.url.path),
        },
    )


@app.middleware("http")
async def verify_vapi_secret(request: Request, call_next):
    """Verify x-vapi-secret header on webhook endpoints."""
    if request.url.path.startswith("/vapi/") and VAPI_SECRET:
        secret = request.headers.get("x-vapi-secret", "")
        # Use constant-time comparison to prevent timing attacks
        if not hmac.compare_digest(secret, VAPI_SECRET):
            logger.warning(
                "Unauthorized webhook call from %s",
                request.client.host if request.client else "unknown",
            )
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return await call_next(request)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _embed_text(text: str) -> list[float]:
    """Embed text using multi-provider router with automatic failover."""
    client = get_http_client()
    router = get_embedding_router()
    try:
        return await router.embed(text, client)
    except RuntimeError as exc:
        logger.error("All embedding providers failed: %s", exc)
        raise HTTPException(status_code=502, detail="Embedding service unavailable")


async def _embed_query(text: str) -> list[float]:
    """Embed a search query. E5 models expect 'query: ' prefix for queries."""
    return await _embed_text(f"query: {text}")


async def _embed_passage(text: str) -> list[float]:
    """Embed a document/passage. E5 models expect 'passage: ' prefix."""
    return await _embed_text(f"passage: {text}")


def _search_knowledge(
    query_vec: list[float],
    language: str = "auto",
    top_k: int = 3,
) -> list[dict]:
    """Vector search over the health knowledge base collection."""
    query_filter = None
    if language and language != "auto":
        query_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="language",
                    match=models.MatchValue(value=language),
                )
            ]
        )

    results = get_qdrant().query_points(
        collection_name=KNOWLEDGE_COLLECTION,
        query=query_vec,
        query_filter=query_filter,
        limit=top_k,
        with_payload=True,
    )

    return [
        {
            "id": str(point.id),
            "score": point.score,
            "payload": point.payload,
        }
        for point in results.points
    ]


def _search_memory(user_id: str, query_vec: list[float], top_k: int = 3) -> list[dict]:
    """Vector search over user_memory filtered by user_id (phone)."""
    try:
        results = get_qdrant().query_points(
            collection_name=MEMORY_COLLECTION,
            query=query_vec,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_phone",
                        match=models.MatchValue(value=user_id),
                    )
                ]
            ),
            limit=top_k,
            with_payload=True,
        )
        return [
            {
                "id": str(point.id),
                "score": point.score,
                "payload": point.payload,
            }
            for point in results.points
        ]
    except Exception as exc:
        # Memory collection may not exist yet or be empty — graceful fallback.
        logger.warning("Memory search failed (user=%s): %s", user_id, exc)
        return []


def _format_context(knowledge: list[dict], memory: list[dict]) -> str:
    """Build a combined context string from knowledge + memory results."""
    parts: list[str] = []

    if knowledge:
        parts.append("=== HEALTH KNOWLEDGE ===")
        for i, item in enumerate(knowledge, 1):
            payload = item.get("payload", {})
            text = payload.get("text", payload.get("content", ""))
            source = payload.get("source", "unknown")
            parts.append(f"[{i}] (source: {source}) {text}")

    if memory:
        parts.append("\n=== PATIENT HISTORY ===")
        for i, item in enumerate(memory, 1):
            payload = item.get("payload", {})
            entry_type = payload.get("entry_type", "call-summary")
            summary = payload.get("summary", "")
            ts = payload.get("timestamp", "")
            if entry_type == "medical-report":
                report_name = payload.get("report_name", "Uploaded medical report")
                medicines = ", ".join(payload.get("medicines", [])[:6])
                conditions = ", ".join(payload.get("conditions", [])[:6])
                excerpt = payload.get("report_text_excerpt", "")
                parts.append(
                    f"[{i}] (uploaded report: {report_name}, {ts}) "
                    f"{payload.get('report_summary', summary)}"
                )
                if medicines:
                    parts.append(f"    Medicines mentioned: {medicines}")
                if conditions:
                    parts.append(f"    Conditions mentioned: {conditions}")
                if excerpt:
                    parts.append(f"    Evidence excerpt: {excerpt}")
            else:
                parts.append(f"[{i}] ({ts}) {summary}")

    if not parts:
        return "No relevant information found."

    return "\n".join(parts)


def _memory_point_to_report_entry(point) -> MedicalReportEntry:
    payload = point.payload or {}
    saved_at = payload.get("saved_at") or payload.get("timestamp", "")
    return MedicalReportEntry(
        report_id=payload.get("report_id", str(point.id)),
        report_name=payload.get("report_name", "Uploaded medical report"),
        report_kind=payload.get("report_kind", "medical-report"),
        summary=payload.get("report_summary", payload.get("summary", "")),
        extracted_text_excerpt=payload.get(
            "extracted_text_excerpt", payload.get("report_text_excerpt", "")
        ),
        medicines=payload.get("medicines", []),
        conditions=payload.get("conditions", []),
        language=normalize_language(payload.get("language", "auto")),
        saved_at=saved_at,
        source_label=payload.get("source_label", "Uploaded medical report"),
    )


def _is_call_memory_payload(payload: dict) -> bool:
    entry_type = payload.get("entry_type", "call-summary")
    return entry_type in {"call-summary", "conversation-summary", ""}


def _verify_user_access(user_id: str, auth_token: Optional[str]) -> None:
    """
    Verify that the request has proper authorization to access user data.
    If USER_DATA_SECRET is set, requires a valid token.
    Token format: base64(user_id:timestamp:hmac_signature)
    """
    if not USER_DATA_SECRET:
        # No auth configured - allow access (development mode)
        return

    if not auth_token:
        raise HTTPException(
            status_code=401, detail="Authorization required to access user data"
        )

    try:
        # Simple token validation: token should be "user_id:secret" hashed
        expected_token = hmac.new(
            USER_DATA_SECRET.encode(), user_id.encode(), "sha256"
        ).hexdigest()[:32]

        if not hmac.compare_digest(auth_token, expected_token):
            raise HTTPException(status_code=403, detail="Invalid authorization token")
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Auth verification failed: %s", exc)
        raise HTTPException(status_code=403, detail="Authorization verification failed")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Simple health-check endpoint."""
    return HealthResponse(
        status="ok",
        service=APP_SERVICE_NAME,
        version=APP_VERSION,
    )


@app.get("/qdrant_stats")
async def qdrant_stats():
    """Return point counts from Qdrant collections."""
    try:
        client = get_qdrant()
        knowledge_info = client.get_collection(KNOWLEDGE_COLLECTION)
        memory_info = client.get_collection(MEMORY_COLLECTION)
        return {
            "status": "ok",
            "knowledge_chunks": knowledge_info.points_count,
            "memory_chunks": memory_info.points_count,
            "knowledge_collection": KNOWLEDGE_COLLECTION,
            "memory_collection": MEMORY_COLLECTION,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "knowledge_chunks": 0,
            "memory_chunks": 0,
        }


@app.get("/knowledge_base/browse")
async def browse_knowledge_base(offset: int = 0, limit: int = 20):
    """Browse knowledge base chunks with pagination."""
    try:
        client = get_qdrant()
        # Use scroll to paginate
        results, next_offset = client.scroll(
            collection_name=KNOWLEDGE_COLLECTION,
            limit=limit,
            offset=offset if offset else None,
            with_payload=True,
            with_vectors=False,
        )
        chunks = []
        for point in results:
            payload = point.payload or {}
            chunks.append(
                {
                    "id": str(point.id),
                    "text": payload.get("text", payload.get("content", "")),
                    "language": payload.get("language", "unknown"),
                    "source": payload.get("source", payload.get("category", "")),
                    "topic": payload.get("topic", payload.get("title", "")),
                    "metadata": {
                        k: v
                        for k, v in payload.items()
                        if k not in ("text", "content", "embedding")
                    },
                }
            )
        info = client.get_collection(KNOWLEDGE_COLLECTION)
        return {
            "status": "ok",
            "chunks": chunks,
            "total": info.points_count,
            "offset": offset,
            "limit": limit,
            "next_offset": str(next_offset) if next_offset else None,
        }
    except Exception as e:
        logger.error("browse_knowledge_base error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e), "chunks": [], "total": 0}


@app.get("/user_memory/browse/{user_id}")
async def browse_user_memory(user_id: str, limit: int = 50):
    """Browse a user's memory chunks stored in Qdrant."""
    try:
        points = _list_user_memory_points(user_id, limit=limit)
        chunks = []
        for point in points:
            payload = point.payload or {}
            chunks.append(
                {
                    "id": str(point.id),
                    "text": payload.get(
                        "text", payload.get("content", payload.get("summary", ""))
                    ),
                    "type": payload.get(
                        "type", payload.get("memory_type", "conversation")
                    ),
                    "timestamp": payload.get(
                        "timestamp", payload.get("created_at", "")
                    ),
                    "language": payload.get("language", "unknown"),
                    "metadata": {
                        k: v
                        for k, v in payload.items()
                        if k not in ("text", "content", "summary", "embedding")
                    },
                }
            )
        return {
            "status": "ok",
            "user_id": user_id,
            "chunks": chunks,
            "total": len(chunks),
        }
    except Exception as e:
        logger.error("browse_user_memory error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e), "chunks": [], "total": 0}


@app.get("/debug/env")
async def debug_env():
    """Debug: check which env vars and providers are configured."""
    from app.embeddings import get_embedding_router

    router = get_embedding_router()
    provider_names = [p["name"] for p in router._providers]
    return {
        "qdrant_url_set": bool(QDRANT_URL),
        "qdrant_url_prefix": (QDRANT_URL or "")[:30],
        "qdrant_api_key_set": bool(QDRANT_API_KEY),
        "embedding_providers": provider_names,
        "gemini_key_set": bool(GEMINI_API_KEY),
        "gemini_model": GEMINI_MODEL,
        "openrouter_key_set": bool(os.getenv("OPENROUTER_API_KEY")),
        "primary_llm": "gemini" if GEMINI_API_KEY else "openrouter",
        "vapi_secret_set": bool(VAPI_SECRET),
    }


@app.post("/query_health_knowledge", response_model=HealthQueryResponse)
async def query_health_knowledge(req: HealthQueryRequest):
    """
    Vapi tool endpoint.
    Embeds the user query, searches the knowledge base and user memory,
    then returns combined context for the voice agent.

    Enhanced to include:
    - references: structured list of knowledge and memory sources used
    - reasoning_summary: brief explanation of what sources were consulted
    - detected_language: auto-detected language from query text
    """
    logger.info(
        "query_health_knowledge | user=%s lang=%s query=%s",
        req.user_id,
        req.language,
        req.query[:80],
    )

    # Detect language from query if not specified
    detected_language = _detect_language_hint(req.query, req.language or "auto")
    filter_language = _knowledge_language_for_filter(detected_language)

    try:
        query_vec = await _embed_query(req.query)
    except Exception as exc:
        logger.error("Embedding failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Embedding error: {exc}")

    try:
        knowledge = _search_knowledge(
            query_vec, language=filter_language, top_k=req.top_k
        )
    except Exception as exc:
        logger.error("Knowledge search failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Knowledge search error: {exc}")

    try:
        memory = _search_memory(req.user_id, query_vec)
    except Exception as exc:
        logger.error("Memory search failed: %s", exc, exc_info=True)
        memory = []

    context = _format_context(knowledge, memory)

    # Build structured references for transparency
    knowledge_refs = _knowledge_points_to_references(knowledge)
    memory_refs = _memory_points_to_references(memory)
    all_references = knowledge_refs + memory_refs

    # Build reasoning summary
    reasoning_summary = _build_reasoning_summary(knowledge, memory)

    return HealthQueryResponse(
        context=context,
        knowledge_results=knowledge,
        memory_results=memory,
        references=all_references,
        reasoning_summary=reasoning_summary,
        detected_language=detected_language,
        status="ok",
    )


@app.post("/save_conversation_summary")
async def save_conversation_summary(req: ConversationSummary):
    """
    Called at the end of a call to persist the conversation summary
    into the user_memory Qdrant collection.
    """
    logger.info(
        "save_conversation_summary | user=%s conditions=%s",
        req.user_id,
        req.conditions,
    )

    try:
        passage_vec = await _embed_passage(req.summary)
    except Exception as exc:
        logger.error("Embedding failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal processing error")

    point_id = str(uuid4())
    payload = {
        "user_phone": req.user_id,
        "summary": req.summary,
        "timestamp": req.timestamp,
        "language": req.language,
        "conditions": req.conditions,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        get_qdrant().upsert(
            collection_name=MEMORY_COLLECTION,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=passage_vec,
                    payload=payload,
                )
            ],
        )
    except Exception as exc:
        logger.error("Qdrant upsert failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal processing error")

    logger.info("Saved memory point %s for user %s", point_id, req.user_id)
    return {"status": "ok", "point_id": point_id}


# ---------------------------------------------------------------------------
# Vapi Server URL webhook
# ---------------------------------------------------------------------------


@app.post("/vapi/webhook")
async def vapi_webhook(payload: VapiMessage):
    """
    Vapi server URL endpoint.
    Receives a JSON body with a `message` object whose `type` field determines
    the action:
      - function-call        → route to the appropriate tool function
      - end-of-call-report   → auto-save conversation summary
      - assistant-request     → return assistant configuration
    """
    message = payload.message
    msg_type = message.get("type", "")
    logger.info("vapi/webhook | type=%s", msg_type)

    # ----- function-call -----
    if msg_type == "function-call":
        fn_name = message.get("functionCall", {}).get("name", "")
        fn_params = message.get("functionCall", {}).get("parameters", {})
        logger.info("function-call → %s params=%s", fn_name, list(fn_params.keys()))

        if fn_name == "query_health_knowledge":
            req = HealthQueryRequest(**fn_params)
            resp = await query_health_knowledge(req)
            context_text = resp.context
            if len(context_text) > 2000:
                context_text = context_text[:2000] + "\n\n[...truncated for brevity]"
            return {
                "results": [
                    {
                        "toolCallId": message.get("functionCall", {}).get("id", ""),
                        "result": context_text,
                    }
                ]
            }

        if fn_name == "save_conversation_summary":
            if "timestamp" not in fn_params:
                fn_params["timestamp"] = datetime.now(timezone.utc).isoformat()
            req = ConversationSummary(**fn_params)
            result = await save_conversation_summary(req)
            return {
                "results": [
                    {
                        "toolCallId": message.get("functionCall", {}).get("id", ""),
                        "result": f"Summary saved: {result['point_id']}",
                    }
                ]
            }

        # --- New agentic voice tools ---
        if fn_name == "assess_emergency":
            emergency_req = EmergencyAssessRequest(
                user_id=fn_params.get("user_id", "unknown"),
                symptom_keyword=fn_params.get("symptom_keyword", ""),
                transcript_text=fn_params.get("transcript_text", ""),
            )
            result = await assess_emergency(emergency_req)
            assessment = result.get("assessment", {})
            result_text = (
                f"Severity: {assessment.get('severity', 'unknown')}. "
                f"Recurring: {'Yes' if assessment.get('is_recurring') else 'No'}. "
                f"Action: {assessment.get('recommended_action', 'monitor')}. "
                f"Message: {assessment.get('message_to_patient', '')}"
            )
            return {
                "results": [
                    {
                        "toolCallId": message.get("functionCall", {}).get("id", ""),
                        "result": result_text,
                    }
                ]
            }

        if fn_name == "get_medication_info":
            user_id = fn_params.get("user_id", "unknown")
            med_result = await get_medication_schedule(user_id)
            meds = med_result.get("medications", [])
            if meds:
                med_text = "Current medications:\n"
                for m in meds[:8]:
                    med_text += f"- {m.get('name', '?')}: {m.get('dosage', 'as prescribed')}, {m.get('time_of_day', '')}: {m.get('instructions', '')}\n"
                warnings = med_result.get("warnings", [])
                if warnings:
                    med_text += f"\nWarnings: {'; '.join(warnings[:3])}"
            else:
                med_text = med_result.get("general_advice", "No medications found in records.")
            return {
                "results": [
                    {
                        "toolCallId": message.get("functionCall", {}).get("id", ""),
                        "result": med_text,
                    }
                ]
            }

        if fn_name == "generate_follow_up_tasks":
            user_id = fn_params.get("user_id", "unknown")
            context = fn_params.get("context", "")
            task_req = TaskGenerationRequest(summary=context or "General health follow-up", user_id=user_id)
            task_result = await generate_tasks(task_req)
            tasks = task_result.tasks
            if tasks:
                task_text = "Follow-up tasks created:\n"
                for t in tasks[:5]:
                    task_text += f"- [{t.priority}] {t.task} (due: {t.due_suggestion})\n"
            else:
                task_text = "No specific follow-up tasks needed at this time."
            return {
                "results": [
                    {
                        "toolCallId": message.get("functionCall", {}).get("id", ""),
                        "result": task_text,
                    }
                ]
            }

        logger.warning("Unknown function: %s", fn_name)
        return {
            "results": [
                {
                    "toolCallId": message.get("functionCall", {}).get("id", ""),
                    "error": f"Unknown function: {fn_name}",
                }
            ]
        }

    # ----- end-of-call-report -----
    if msg_type == "end-of-call-report":
        try:
            call = message.get("call", {})
            user_id = call.get("customer", {}).get("number", "") or call.get(
                "metadata", {}
            ).get("user_id", "unknown")
            summary = message.get("summary", message.get("transcript", ""))
            timestamp = message.get("endedAt", datetime.now(timezone.utc).isoformat())

            if summary:
                req = ConversationSummary(
                    user_id=user_id,
                    summary=summary,
                    timestamp=timestamp,
                    language="auto",
                    conditions=[],
                )
                await save_conversation_summary(req)
                logger.info("Auto-saved end-of-call summary for user %s", user_id)

                # Trigger autonomous post-call analysis workflow
                try:
                    executor = _get_tool_executor(user_id)
                    workflow_result = await run_health_workflow(
                        user_id=user_id,
                        workflow_type="post_call_analysis",
                        tool_executor=executor,
                        params={"call_summary": summary},
                    )
                    logger.info(
                        "Post-call workflow completed for %s: %d steps, tools=%s",
                        user_id,
                        workflow_result.get("total_steps", 0),
                        workflow_result.get("tools_used", []),
                    )
                except Exception as wf_exc:
                    logger.warning("Post-call workflow failed (non-blocking): %s", wf_exc)

        except Exception as exc:
            logger.error("Failed to auto-save end-of-call summary: %s", exc)

        return JSONResponse(content={"status": "ok"})

    # ----- assistant-request -----
    if msg_type == "assistant-request":
        logger.info("Returning assistant configuration")
        return {
            "assistant": {
                "name": "AarogyaVaani",
                "model": {
                    "provider": "openai",
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are AarogyaVaani, a friendly and empathetic multilingual "
                                "healthcare assistant for people in India. You speak Hindi, English, "
                                "Tamil, Telugu, Bengali, and other Indian languages. You provide "
                                "reliable health information, help users understand symptoms, suggest "
                                "when to see a doctor, and remember past conversations to give "
                                "personalized guidance. Always be warm, patient, and clear. "
                                "Never diagnose — only inform and guide."
                            ),
                        }
                    ],
                    "tools": [
                        {
                            "type": "function",
                            "function": {
                                "name": "query_health_knowledge",
                                "description": (
                                    "Search the health knowledge base and patient memory "
                                    "to find relevant medical information for the user's query."
                                ),
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "description": "The user's phone number or unique ID",
                                        },
                                        "query": {
                                            "type": "string",
                                            "description": "The health-related question from the user",
                                        },
                                        "language": {
                                            "type": "string",
                                            "description": "Language code (hi, en, ta, te, bn, etc.) or 'auto'",
                                        },
                                    },
                                    "required": ["user_id", "query"],
                                },
                            },
                        },
                        {
                            "type": "function",
                            "function": {
                                "name": "save_conversation_summary",
                                "description": "Save a summary of the conversation for future reference.",
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "description": "The user's phone number or unique ID",
                                        },
                                        "summary": {
                                            "type": "string",
                                            "description": "Summary of the conversation",
                                        },
                                        "timestamp": {
                                            "type": "string",
                                            "description": "ISO timestamp",
                                        },
                                        "language": {
                                            "type": "string",
                                            "description": "Language code",
                                        },
                                        "conditions": {
                                            "type": "array",
                                            "items": {"type": "string"},
                                            "description": "Health conditions discussed",
                                        },
                                    },
                                    "required": ["user_id", "summary"],
                                },
                            },
                        },
                        {
                            "type": "function",
                            "function": {
                                "name": "assess_emergency",
                                "description": (
                                    "Assess the severity of a health symptom using patient history. "
                                    "Call this when the user mentions pain, breathing difficulty, chest pain, "
                                    "bleeding, or any potentially serious symptom."
                                ),
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "description": "The user's phone number or unique ID",
                                        },
                                        "symptom_keyword": {
                                            "type": "string",
                                            "description": "The main symptom or concern",
                                        },
                                        "transcript_text": {
                                            "type": "string",
                                            "description": "Recent conversation context",
                                        },
                                    },
                                    "required": ["user_id", "symptom_keyword"],
                                },
                            },
                        },
                        {
                            "type": "function",
                            "function": {
                                "name": "get_medication_info",
                                "description": (
                                    "Get the patient's current medication schedule and drug information. "
                                    "Call this when the user asks about their medicines, dosages, or timing."
                                ),
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "description": "The user's phone number or unique ID",
                                        },
                                    },
                                    "required": ["user_id"],
                                },
                            },
                        },
                        {
                            "type": "function",
                            "function": {
                                "name": "generate_follow_up_tasks",
                                "description": (
                                    "Generate health follow-up tasks from the current conversation. "
                                    "Call this toward the end of a call to create actionable next steps."
                                ),
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "user_id": {
                                            "type": "string",
                                            "description": "The user's phone number or unique ID",
                                        },
                                        "context": {
                                            "type": "string",
                                            "description": "Summary of conversation for task generation",
                                        },
                                    },
                                    "required": ["user_id", "context"],
                                },
                            },
                        },
                    ],
                },
                "voice": {
                    "provider": "11labs",
                    "voiceId": "pFZP5JQG7iQjIQuC4Bku",
                },
                "firstMessage": "Namaste! Main AarogyaVaani hoon. Aap apni sehat se judi koi bhi baat mujhse pooch sakte hain. Batayiye, aaj main aapki kya madad kar sakti hoon?",
            }
        }

    # ----- unhandled type -----
    logger.info("Unhandled Vapi message type: %s", msg_type)
    return JSONResponse(
        content={"status": "ok", "message": f"Unhandled type: {msg_type}"}
    )


# ---------------------------------------------------------------------------
# Task generation, call history & health report endpoints
# ---------------------------------------------------------------------------


@app.post("/generate_tasks", response_model=TaskGenerationResponse)
async def generate_tasks(req: TaskGenerationRequest):
    """Use Gemini to extract health tasks from a conversation summary."""
    import json as _json

    prompt = f"""Extract 2-5 actionable health tasks from this patient conversation summary. 
Return ONLY a JSON array. Each item: {{"task": "...", "priority": "high|medium|low", "due_suggestion": "this week|today|within 1 month|daily|as needed", "category": "medication|checkup|diet|exercise|appointment|scheme"}}

Summary: {req.summary}

JSON array:"""

    try:
        content = await _llm_chat(
            [{"role": "user", "content": prompt}],
            max_tokens=500,
        )

        # Parse JSON from response (may have markdown fences)
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        tasks_raw = _json.loads(content)
        tasks = [HealthTask(**t) for t in tasks_raw]
        return TaskGenerationResponse(tasks=tasks)
    except Exception as exc:
        logger.error("Task generation failed: %s", exc, exc_info=True)
        # Return empty tasks rather than error — graceful degradation
        return TaskGenerationResponse(tasks=[], status="generation_failed")


@app.get("/call_history/{user_id}", response_model=CallHistoryResponse)
async def get_call_history(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """Fetch call history for a user from Qdrant user_memory collection."""
    # Verify user has access to this data
    _verify_user_access(user_id, x_auth_token)

    try:
        qdrant_client = get_qdrant()
        results = qdrant_client.scroll(
            collection_name=MEMORY_COLLECTION,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_phone",
                        match=models.MatchValue(value=user_id),
                    )
                ]
            ),
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )

        points = results[0] if results else []
        calls = []
        for point in points:
            payload = point.payload or {}
            if not _is_call_memory_payload(payload):
                continue
            calls.append(
                CallHistoryEntry(
                    summary=payload.get("history_summary", payload.get("summary", "")),
                    timestamp=payload.get("timestamp", ""),
                    conditions=payload.get("conditions", []),
                    language=payload.get(
                        "preferred_lang", payload.get("language", "hi")
                    ),
                )
            )

        # Sort by timestamp descending
        calls.sort(key=lambda c: c.timestamp, reverse=True)

        return CallHistoryResponse(
            user_id=user_id,
            calls=calls,
            total=len(calls),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Call history fetch failed: %s", exc, exc_info=True)
        return CallHistoryResponse(user_id=user_id, calls=[], total=0, status="error")


@app.get("/health_report/{user_id}", response_model=HealthReportResponse)
async def get_health_report(
    user_id: str,
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """Generate a health report by aggregating user's call history."""
    from datetime import datetime, timezone

    # Verify user has access to this data
    _verify_user_access(user_id, x_auth_token)

    try:
        qdrant_client = get_qdrant()
        results = qdrant_client.scroll(
            collection_name=MEMORY_COLLECTION,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_phone",
                        match=models.MatchValue(value=user_id),
                    )
                ]
            ),
            limit=100,
            with_payload=True,
            with_vectors=False,
        )

        points = results[0] if results else []

        all_conditions = set()
        timestamps = []
        summaries = []

        for point in points:
            payload = point.payload or {}
            if not _is_call_memory_payload(payload):
                continue
            conditions = payload.get("conditions", [])
            all_conditions.update(conditions)
            ts = payload.get("timestamp", "")
            if ts:
                timestamps.append(ts)
            summary = payload.get("history_summary", payload.get("summary", ""))
            if summary:
                summaries.append(summary)

        timestamps.sort()

        # Generate recommendations based on conditions
        recommendations = []
        condition_recs = {
            "diabetes": [
                "Check fasting blood sugar monthly",
                "Follow prescribed diet plan",
                "Take medication regularly",
                "Get HbA1c test every 3 months",
            ],
            "hypertension": [
                "Monitor blood pressure weekly",
                "Reduce salt intake",
                "Walk 30 minutes daily",
            ],
            "pregnancy": [
                "Complete all 4 antenatal checkups",
                "Take iron and folic acid daily",
                "Watch for danger signs",
            ],
        }
        for condition in all_conditions:
            recs = condition_recs.get(
                condition.lower(), [f"Consult doctor about {condition}"]
            )
            recommendations.extend(recs)

        if not recommendations:
            recommendations = [
                "Schedule a general health checkup",
                "Call AarogyaVaani for guidance",
            ]

        return HealthReportResponse(
            user_id=user_id,
            total_calls=len(points),
            conditions_tracked=sorted(all_conditions),
            first_call=timestamps[0] if timestamps else "",
            last_call=timestamps[-1] if timestamps else "",
            recent_summaries=summaries[-5:],
            recommendations=recommendations,
            report_generated_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as exc:
        logger.error("Health report failed: %s", exc, exc_info=True)
        return HealthReportResponse(
            user_id=user_id,
            total_calls=0,
            conditions_tracked=[],
            recent_summaries=[],
            recommendations=["Unable to generate report. Please try again."],
            report_generated_at=datetime.now(timezone.utc).isoformat(),
            status="error",
        )


# ---------------------------------------------------------------------------
# Medical Report Upload & Doctor Brief Endpoints
# ---------------------------------------------------------------------------


@app.get("/supported_languages", response_model=SupportedLanguagesResponse)
async def get_supported_languages():
    """Return the full language catalog for frontend dropdowns."""
    items = [
        SupportedLanguageItem(
            code=lang["code"],
            label=lang["label"],
            native_label=lang["native_label"],
            group=lang["group"],
            featured=lang["featured"],
            voice_ready=lang["voice_ready"],
        )
        for lang in LANGUAGE_CATALOG
    ]
    featured = [item for item in items if item.featured]
    return SupportedLanguagesResponse(
        languages=items,
        featured=featured,
        total=len(items),
    )


@app.post("/medical_reports/upload", response_model=MedicalReportUploadResponse)
async def upload_medical_report(
    req: MedicalReportUploadRequest,
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """
    Accept a base64-encoded medical report (PDF or image), analyze it using LLM,
    extract medicines/conditions, and store the structured data in Qdrant memory.
    """
    _verify_user_access(req.user_id, x_auth_token)

    logger.info(
        "upload_medical_report | user=%s file=%s mime=%s",
        req.user_id,
        req.file_name,
        req.mime_type,
    )

    # Validate content
    if not req.content_base64:
        raise HTTPException(status_code=400, detail="No file content provided")

    # Analyze based on file type
    is_pdf = req.mime_type == "application/pdf"
    if is_pdf:
        try:
            file_bytes = base64.b64decode(req.content_base64)
            if len(file_bytes) > MAX_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)}MB",
                )
            extracted_text = _extract_pdf_text(file_bytes)
            language_hint = _detect_language_hint(
                extracted_text, req.language or "auto"
            )
            analysis = await _analyze_text_upload(extracted_text, language_hint)
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("PDF processing failed: %s", exc)
            raise HTTPException(status_code=400, detail="Failed to process PDF file")
    else:
        # Image analysis
        analysis = await _analyze_image_upload(
            req.file_name, req.mime_type, req.content_base64
        )

    # Extract structured data from analysis
    summary = analysis.get("summary", "")
    medicines = _unique_strings(analysis.get("medicines", []))
    conditions = _unique_strings(analysis.get("conditions", []))
    detected_language = normalize_language(analysis.get("language", req.language))
    reasoning = analysis.get("reasoning", "")
    extracted_text = analysis.get("extracted_text", "")

    # Create embedding for vector storage
    embed_text = f"{summary} {' '.join(medicines)} {' '.join(conditions)}"
    try:
        passage_vec = await _embed_passage(embed_text)
    except Exception as exc:
        logger.error("Embedding failed: %s", exc)
        raise HTTPException(status_code=500, detail="Internal processing error")

    # Store in Qdrant memory collection
    report_id = str(uuid4())
    saved_at = datetime.now(timezone.utc).isoformat()
    payload = {
        "user_phone": req.user_id,
        "entry_type": "medical-report",
        "report_id": report_id,
        "report_name": req.file_name,
        "report_kind": "pdf" if is_pdf else "image",
        "report_summary": summary,
        "report_text_excerpt": _excerpt(extracted_text, 500),
        "medicines": medicines,
        "conditions": conditions,
        "language": detected_language,
        "reasoning": reasoning,
        "source_label": f"Uploaded: {req.file_name}",
        "timestamp": saved_at,
        "saved_at": saved_at,
    }

    report_chunks = _chunk_report_text(extracted_text or summary)
    chunk_points = []
    for idx, chunk_text in enumerate(report_chunks):
        chunk_id = str(uuid4())
        chunk_vec = await _embed_passage(
            f"{req.file_name} chunk {idx + 1}. {chunk_text} {' '.join(medicines[:8])} {' '.join(conditions[:8])}"
        )
        chunk_points.append(
            models.PointStruct(
                id=chunk_id,
                vector=chunk_vec,
                payload={
                    "user_phone": req.user_id,
                    "entry_type": "medical-report-chunk",
                    "report_id": report_id,
                    "report_name": req.file_name,
                    "report_kind": "pdf" if is_pdf else "image",
                    "chunk_index": idx,
                    "chunk_title": f"Chunk {idx + 1}",
                    "chunk_text": chunk_text,
                    "medicines": medicines,
                    "conditions": conditions,
                    "language": detected_language,
                    "source_label": f"Uploaded chunk: {req.file_name}",
                    "timestamp": saved_at,
                    "saved_at": saved_at,
                },
            )
        )

    try:
        get_qdrant().upsert(
            collection_name=MEMORY_COLLECTION,
            points=[
                models.PointStruct(
                    id=report_id,
                    vector=passage_vec,
                    payload=payload,
                )
            ]
            + chunk_points,
        )
    except Exception as exc:
        logger.error("Qdrant upsert failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to store report")

    logger.info("Saved medical report %s for user %s", report_id, req.user_id)

    return MedicalReportUploadResponse(
        report_id=report_id,
        summary=summary,
        medicines=medicines,
        conditions=conditions,
        language=detected_language,
        reasoning=reasoning,
        saved_at=saved_at,
    )


@app.get("/medical_reports/{user_id}", response_model=MedicalReportListResponse)
async def list_medical_reports(
    user_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """List all uploaded medical reports for a user."""
    _verify_user_access(user_id, x_auth_token)

    try:
        qdrant_client = get_qdrant()
        results = qdrant_client.scroll(
            collection_name=MEMORY_COLLECTION,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_phone",
                        match=models.MatchValue(value=user_id),
                    ),
                    models.FieldCondition(
                        key="entry_type",
                        match=models.MatchValue(value="medical-report"),
                    ),
                ]
            ),
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )

        points = results[0] if results else []
        reports = [_memory_point_to_report_entry(point) for point in points]

        # Sort by saved_at descending
        reports.sort(key=lambda r: r.saved_at or "", reverse=True)

        return MedicalReportListResponse(
            user_id=user_id,
            reports=reports,
            total=len(reports),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to list medical reports: %s", exc)
        return MedicalReportListResponse(
            user_id=user_id, reports=[], total=0, status="error"
        )


@app.get(
    "/medical_reports/{user_id}/{report_id}/chunks",
    response_model=MedicalReportChunksResponse,
)
async def get_medical_report_chunks(
    user_id: str,
    report_id: str,
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """Return the stored Qdrant chunks for a specific uploaded report."""
    _verify_user_access(user_id, x_auth_token)

    try:
        qdrant_client = get_qdrant()
        results = qdrant_client.scroll(
            collection_name=MEMORY_COLLECTION,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_phone",
                        match=models.MatchValue(value=user_id),
                    ),
                    models.FieldCondition(
                        key="entry_type",
                        match=models.MatchValue(value="medical-report-chunk"),
                    ),
                    models.FieldCondition(
                        key="report_id",
                        match=models.MatchValue(value=report_id),
                    ),
                ]
            ),
            limit=100,
            with_payload=True,
            with_vectors=False,
        )

        points = results[0] if results else []
        chunks = [_report_chunk_to_entry(point) for point in points]
        chunks.sort(key=lambda c: c.chunk_index)

        return MedicalReportChunksResponse(
            user_id=user_id,
            report_id=report_id,
            chunks=chunks,
            total=len(chunks),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to fetch report chunks: %s", exc)
        return MedicalReportChunksResponse(
            user_id=user_id,
            report_id=report_id,
            chunks=[],
            total=0,
            status="error",
        )


@app.post("/doctor_brief", response_model=DoctorBriefResponse)
async def generate_doctor_brief(
    req: DoctorBriefRequest,
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """
    Generate a comprehensive doctor-facing summary of a patient's health history.
    Aggregates uploaded reports, conversation history, and conditions.
    """
    _verify_user_access(req.user_id, x_auth_token)

    logger.info("doctor_brief | user=%s", req.user_id)

    # Fetch all user memory points
    memory_points = _list_user_memory_points(req.user_id, limit=100)

    if not memory_points:
        return DoctorBriefResponse(
            user_id=req.user_id,
            summary="No patient data available. The patient has not used the service yet.",
            key_conditions=[],
            medications=[],
            recent_concerns=[],
            uploaded_reports=[],
            conversation_count=0,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    # Categorize memory points
    reports = []
    conversations = []
    all_conditions = set()
    all_medicines = set()
    recent_summaries = []

    for point in memory_points:
        payload = point.payload or {}
        entry_type = payload.get("entry_type", "call-summary")

        if entry_type == "medical-report":
            reports.append(payload)
            all_medicines.update(payload.get("medicines", []))
            all_conditions.update(payload.get("conditions", []))
        else:
            conversations.append(payload)
            all_conditions.update(payload.get("conditions", []))
            summary = payload.get("summary", "")
            if summary:
                recent_summaries.append(summary)

    # Build context for LLM
    context_parts = []
    if reports:
        context_parts.append("UPLOADED MEDICAL REPORTS:")
        for r in reports[:10]:
            context_parts.append(
                f"- {r.get('report_name', 'Report')}: {r.get('report_summary', 'No summary')}"
            )
            meds = r.get("medicines", [])
            if meds:
                context_parts.append(f"  Medicines: {', '.join(meds[:8])}")
            conds = r.get("conditions", [])
            if conds:
                context_parts.append(f"  Conditions: {', '.join(conds[:8])}")

    if conversations:
        context_parts.append("\nCONVERSATION HISTORY:")
        for c in conversations[:15]:
            ts = c.get("timestamp", "")
            summary = c.get("summary", "")
            if summary:
                context_parts.append(f"- [{ts[:10] if ts else 'Unknown'}] {summary}")

    context_text = "\n".join(context_parts)

    # Generate doctor-facing summary using LLM
    try:
        llm_summary = await _llm_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You are a medical AI assistant helping doctors quickly understand "
                        "a patient's health history. Generate a concise, professional summary "
                        "suitable for a busy healthcare provider. Focus on: key conditions, "
                        "current medications, recent concerns, and any red flags. Be factual "
                        "and cite the evidence from the patient's records. Use clinical language."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Generate a doctor briefing for this patient:\n\n{context_text}",
                },
            ],
            max_tokens=600,
        )
    except Exception as exc:
        logger.error("LLM summary failed: %s", exc)
        llm_summary = (
            f"Patient has {len(reports)} uploaded report(s) and {len(conversations)} "
            f"conversation(s) on file. Key conditions: {', '.join(sorted(all_conditions)[:5]) or 'None recorded'}. "
            f"Medications mentioned: {', '.join(sorted(all_medicines)[:5]) or 'None recorded'}."
        )

    return DoctorBriefResponse(
        user_id=req.user_id,
        summary=llm_summary,
        key_conditions=sorted(all_conditions)[:10],
        medications=sorted(all_medicines)[:10],
        recent_concerns=recent_summaries[-5:],
        uploaded_reports=[
            MedicalReportEntry(
                report_id=r.get("report_id", ""),
                report_name=r.get("report_name", ""),
                report_kind=r.get("report_kind", ""),
                summary=r.get("report_summary", ""),
                extracted_text_excerpt=r.get("report_text_excerpt", ""),
                medicines=r.get("medicines", []),
                conditions=r.get("conditions", []),
                language=normalize_language(r.get("language")),
                saved_at=r.get("saved_at", ""),
                source_label=r.get("source_label", ""),
            )
            for r in reports[:10]
        ],
        conversation_count=len(conversations),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/medications/{user_id}")
async def get_medication_schedule(user_id: str):
    """
    Extract medications from user's reports and conversations,
    then generate a structured daily schedule using LLM.
    """
    logger.info("medications | user=%s", user_id)

    memory_points = _list_user_memory_points(user_id, limit=100)

    if not memory_points:
        return {
            "user_id": user_id,
            "medications": [],
            "warnings": [],
            "general_advice": "No health data found. Start a voice call or upload a medical report to get your medication schedule.",
        }

    # Collect all medicines and context from reports + conversations
    all_medicines = set()
    context_parts = []

    for point in memory_points:
        payload = point.payload or {}
        entry_type = payload.get("entry_type", "call-summary")

        if entry_type == "medical-report":
            meds = payload.get("medicines", [])
            all_medicines.update(meds)
            report_name = payload.get("report_name", "Report")
            summary = payload.get("report_summary", "")
            if meds:
                context_parts.append(
                    f"Report '{report_name}': Medicines: {', '.join(meds)}. Summary: {summary[:200]}"
                )
        else:
            conditions = payload.get("conditions", [])
            summary = payload.get("summary", "")
            if summary:
                context_parts.append(f"Conversation: {summary[:200]}")

    if not all_medicines and not context_parts:
        return {
            "user_id": user_id,
            "medications": [],
            "warnings": [],
            "general_advice": "No medications found in your records yet. Upload a prescription or discuss your medicines during a voice call.",
        }

    context_text = "\n".join(context_parts)

    try:
        llm_response = await _llm_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You are a medication schedule assistant. Given a patient's medical records, "
                        "extract all medications and generate a structured daily schedule. "
                        "Respond ONLY with valid JSON (no markdown, no explanation) in this exact format:\n"
                        '{"medications": [{"name": "...", "dosage": "...", "time_of_day": "morning|afternoon|night", '
                        '"instructions": "...", "purpose": "..."}], '
                        '"warnings": ["..."], "general_advice": "..."}\n'
                        "Rules:\n"
                        "- Assign time_of_day based on common medical practice\n"
                        "- Keep instructions simple and in plain language\n"
                        "- Add warnings about drug interactions or important precautions\n"
                        "- general_advice should be 1-2 sentences about adherence"
                    ),
                },
                {
                    "role": "user",
                    "content": f"Generate a medication schedule from these records:\n\nMedicines found: {', '.join(sorted(all_medicines)) if all_medicines else 'See context below'}\n\n{context_text}",
                },
            ],
            max_tokens=800,
        )

        import json as json_mod

        # Try to parse the LLM response as JSON
        try:
            schedule = json_mod.loads(llm_response.strip())
        except json_mod.JSONDecodeError:
            # Try extracting JSON from markdown code block
            import re

            json_match = re.search(r"\{[\s\S]*\}", llm_response)
            if json_match:
                schedule = json_mod.loads(json_match.group())
            else:
                raise ValueError("Could not parse LLM response as JSON")

        return {
            "user_id": user_id,
            "medications": schedule.get("medications", []),
            "warnings": schedule.get("warnings", []),
            "general_advice": schedule.get("general_advice", ""),
        }

    except Exception as exc:
        logger.error("Medication schedule LLM failed: %s", exc)
        # Fallback: return raw medicines without schedule
        fallback_meds = [
            {
                "name": med,
                "dosage": "As prescribed",
                "time_of_day": "morning",
                "instructions": "Take as directed by your doctor",
                "purpose": "",
            }
            for med in sorted(all_medicines)
        ]
        return {
            "user_id": user_id,
            "medications": fallback_meds,
            "warnings": [
                "Could not generate detailed schedule. Please consult your doctor for proper timing."
            ],
            "general_advice": "Take all medications as prescribed by your healthcare provider.",
        }


@app.post("/reports/compare")
async def compare_reports(
    req: dict = Body(...),
):
    """
    Compare two medical reports and show what changed.
    Expects: { user_id, report_id_1, report_id_2 }
    """
    user_id = req.get("user_id", "")
    report_id_1 = req.get("report_id_1", "")
    report_id_2 = req.get("report_id_2", "")

    if not user_id or not report_id_1 or not report_id_2:
        raise HTTPException(
            status_code=400, detail="user_id, report_id_1, report_id_2 required"
        )

    logger.info(
        "reports/compare | user=%s r1=%s r2=%s", user_id, report_id_1, report_id_2
    )

    # Fetch both reports from memory
    memory_points = _list_user_memory_points(user_id, limit=200)
    report_1 = None
    report_2 = None
    for point in memory_points:
        payload = point.payload or {}
        if payload.get("entry_type") == "medical-report":
            rid = payload.get("report_id", "")
            if rid == report_id_1:
                report_1 = payload
            elif rid == report_id_2:
                report_2 = payload

    if not report_1 or not report_2:
        raise HTTPException(status_code=404, detail="One or both reports not found")

    # Build context for LLM
    def report_context(r, label):
        parts = [f"=== {label} ==="]
        parts.append(f"Name: {r.get('report_name', 'Unknown')}")
        parts.append(f"Date: {r.get('saved_at', 'Unknown')}")
        parts.append(f"Summary: {r.get('report_summary', 'N/A')}")
        parts.append(f"Medicines: {', '.join(r.get('medicines', [])) or 'None'}")
        parts.append(f"Conditions: {', '.join(r.get('conditions', [])) or 'None'}")
        excerpt = r.get("report_text_excerpt", "")
        if excerpt:
            parts.append(f"Report Text: {excerpt[:1000]}")
        return "\n".join(parts)

    context = (
        report_context(report_1, "OLDER REPORT")
        + "\n\n"
        + report_context(report_2, "NEWER REPORT")
    )

    try:
        llm_response = await _llm_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You are a medical report comparison assistant. Compare two medical reports "
                        "and identify what changed. Respond ONLY with valid JSON (no markdown) in this format:\n"
                        '{"improved": [{"metric": "...", "old_value": "...", "new_value": "...", "note": "..."}], '
                        '"worsened": [{"metric": "...", "old_value": "...", "new_value": "...", "note": "..."}], '
                        '"new_findings": ["..."], '
                        '"unchanged": ["..."], '
                        '"medications_added": ["..."], '
                        '"medications_removed": ["..."], '
                        '"overall_summary": "1-2 sentence summary of changes"}\n'
                        "Extract specific lab values, vitals, and metrics where possible. "
                        "Use plain language a patient can understand."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Compare these two medical reports:\n\n{context}",
                },
            ],
            max_tokens=800,
        )

        import json as json_mod
        import re

        try:
            comparison = json_mod.loads(llm_response.strip())
        except json_mod.JSONDecodeError:
            json_match = re.search(r"\{[\s\S]*\}", llm_response)
            if json_match:
                comparison = json_mod.loads(json_match.group())
            else:
                raise ValueError("Could not parse LLM response")

        return {
            "user_id": user_id,
            "report_1": {
                "report_id": report_id_1,
                "name": report_1.get("report_name", ""),
                "date": report_1.get("saved_at", ""),
            },
            "report_2": {
                "report_id": report_id_2,
                "name": report_2.get("report_name", ""),
                "date": report_2.get("saved_at", ""),
            },
            "comparison": comparison,
        }

    except Exception as exc:
        logger.error("Report compare LLM failed: %s", exc)
        # Fallback: simple diff
        meds_1 = set(report_1.get("medicines", []))
        meds_2 = set(report_2.get("medicines", []))
        conds_1 = set(report_1.get("conditions", []))
        conds_2 = set(report_2.get("conditions", []))
        return {
            "user_id": user_id,
            "report_1": {
                "report_id": report_id_1,
                "name": report_1.get("report_name", ""),
                "date": report_1.get("saved_at", ""),
            },
            "report_2": {
                "report_id": report_id_2,
                "name": report_2.get("report_name", ""),
                "date": report_2.get("saved_at", ""),
            },
            "comparison": {
                "improved": [],
                "worsened": [],
                "new_findings": list(conds_2 - conds_1),
                "unchanged": list(conds_1 & conds_2),
                "medications_added": list(meds_2 - meds_1),
                "medications_removed": list(meds_1 - meds_2),
                "overall_summary": "Could not generate detailed comparison. Showing basic medication and condition differences.",
            },
        }


@app.post("/follow_up_tasks/{user_id}")
async def generate_follow_up_tasks(user_id: str):
    """
    Generate smart follow-up tasks from the user's latest conversations.
    """
    logger.info("follow_up_tasks | user=%s", user_id)

    memory_points = _list_user_memory_points(user_id, limit=50)
    if not memory_points:
        return {
            "user_id": user_id,
            "tasks": [],
            "message": "No conversation history found.",
        }

    # Gather recent conversation summaries and report info
    context_parts = []
    for point in memory_points:
        payload = point.payload or {}
        entry_type = payload.get("entry_type", "call-summary")
        if entry_type == "medical-report":
            context_parts.append(
                f"Report: {payload.get('report_name', '')} - {payload.get('report_summary', '')[:200]}"
            )
            meds = payload.get("medicines", [])
            if meds:
                context_parts.append(f"  Medicines: {', '.join(meds[:8])}")
        else:
            summary = payload.get("summary", "")
            if summary:
                context_parts.append(f"Call: {summary[:200]}")
            conditions = payload.get("conditions", [])
            if conditions:
                context_parts.append(f"  Conditions: {', '.join(conditions[:5])}")

    context_text = "\n".join(context_parts[-20:])  # last 20 entries

    try:
        llm_response = await _llm_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You are a health task assistant. Based on the patient's recent conversations "
                        "and medical reports, generate actionable follow-up tasks. "
                        "Respond ONLY with valid JSON (no markdown) in this format:\n"
                        '{"tasks": [{"title": "...", "description": "...", "priority": "high|medium|low", '
                        '"category": "medication|appointment|test|lifestyle|follow-up", '
                        '"due": "today|this week|next week|this month"}]}\n'
                        "Generate 3-7 practical, specific tasks. Use simple language."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Generate follow-up tasks for this patient:\n\n{context_text}",
                },
            ],
            max_tokens=600,
        )

        import json as json_mod
        import re

        try:
            result = json_mod.loads(llm_response.strip())
        except json_mod.JSONDecodeError:
            json_match = re.search(r"\{[\s\S]*\}", llm_response)
            if json_match:
                result = json_mod.loads(json_match.group())
            else:
                raise ValueError("Could not parse LLM response")

        return {"user_id": user_id, "tasks": result.get("tasks", [])}

    except Exception as exc:
        logger.error("Follow-up tasks LLM failed: %s", exc)
        return {
            "user_id": user_id,
            "tasks": [],
            "message": "Could not generate tasks. Please try again.",
        }


@app.get("/family_members/{user_id}")
async def list_family_members(user_id: str):
    """List family member profiles for a user."""
    logger.info("family_members | user=%s", user_id)

    try:
        qdrant_client = get_qdrant()
        results = qdrant_client.scroll(
            collection_name=MEMORY_COLLECTION,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_phone",
                        match=models.MatchValue(value=user_id),
                    ),
                    models.FieldCondition(
                        key="entry_type",
                        match=models.MatchValue(value="family-member"),
                    ),
                ]
            ),
            limit=20,
            with_payload=True,
            with_vectors=False,
        )
        points = results[0] if results else []
        members = []
        for p in points:
            payload = p.payload or {}
            members.append(
                {
                    "member_id": payload.get("member_id", ""),
                    "name": payload.get("name", ""),
                    "relation": payload.get("relation", ""),
                    "age": payload.get("age", ""),
                    "conditions": payload.get("conditions", []),
                    "created_at": payload.get("created_at", ""),
                }
            )
        return {"user_id": user_id, "members": members}
    except Exception as exc:
        logger.error("Family members fetch failed: %s", exc)
        return {"user_id": user_id, "members": []}


@app.post("/family_members/{user_id}")
async def add_family_member(user_id: str, req: dict = Body(...)):
    """Add a family member profile."""
    import uuid

    name = req.get("name", "")
    relation = req.get("relation", "")
    age = req.get("age", "")

    if not name or not relation:
        raise HTTPException(status_code=400, detail="name and relation required")

    member_id = f"{user_id}__{relation.lower().replace(' ', '_')}__{name.lower().replace(' ', '_')}"

    logger.info("add_family_member | user=%s member=%s", user_id, member_id)

    try:
        qdrant_client = get_qdrant()
        embedding = await _embed_text(f"family member {name} {relation} {age}")

        point_id = str(uuid.uuid4())
        qdrant_client.upsert(
            collection_name=MEMORY_COLLECTION,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "user_phone": user_id,
                        "entry_type": "family-member",
                        "member_id": member_id,
                        "name": name,
                        "relation": relation,
                        "age": age,
                        "conditions": req.get("conditions", []),
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ],
        )
        return {
            "status": "ok",
            "member_id": member_id,
            "name": name,
            "relation": relation,
        }
    except Exception as exc:
        logger.error("Add family member failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ── Email Doctor Brief ──────────────────────────────────────────────
@app.post("/email_doctor_brief")
async def email_doctor_brief(
    req: dict = Body(...),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """
    Generate the doctor brief for a user and email it to the specified
    doctor/clinic email address.  Reuses the /doctor_brief logic internally.
    """
    import resend as resend_lib

    user_id = req.get("user_id")
    doctor_email = req.get("doctor_email")
    doctor_name = req.get("doctor_name", "Doctor")
    clinic_name = req.get("clinic_name", "")
    language = req.get("language", "en")

    if not user_id or not doctor_email:
        raise HTTPException(
            status_code=400, detail="user_id and doctor_email are required"
        )

    _verify_user_access(user_id, x_auth_token)

    resend_key = os.getenv("RESEND_API_KEY", "")
    if not resend_key:
        raise HTTPException(status_code=500, detail="Email service not configured")

    resend_lib.api_key = resend_key

    # Generate the brief (reuse existing logic)
    from app.models import DoctorBriefRequest

    brief_req = DoctorBriefRequest(user_id=user_id, language=language)
    brief_resp = await generate_doctor_brief(brief_req, x_auth_token)

    # Build a beautiful HTML email
    conditions_html = (
        "".join(
            f'<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:12px;margin:2px 4px;font-size:13px;">{c}</span>'
            for c in brief_resp.key_conditions
        )
        or '<span style="color:#9ca3af;">None recorded</span>'
    )

    meds_html = (
        "".join(
            f'<li style="padding:4px 0;color:#374151;">{m}</li>'
            for m in brief_resp.medications
        )
        or '<li style="color:#9ca3af;">None recorded</li>'
    )

    concerns_html = (
        "".join(
            f'<li style="padding:4px 0;color:#374151;">{c}</li>'
            for c in brief_resp.recent_concerns
        )
        or '<li style="color:#9ca3af;">No recent concerns</li>'
    )

    reports_html = ""
    for r in brief_resp.uploaded_reports:
        reports_html += f"""
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:8px 0;">
            <strong style="color:#1c1917;">{r.report_name or "Report"}</strong>
            <span style="color:#9ca3af;font-size:12px;margin-left:8px;">{r.report_kind}</span>
            <p style="margin:6px 0 0;color:#4b5563;font-size:13px;">{r.summary or "No summary"}</p>
        </div>"""

    html_body = f"""
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,hsl(28 45% 15%),hsl(28 45% 30%));padding:32px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fffdf9;margin:0;font-family:'Georgia',serif;font-size:24px;">AarogyaVaani</h1>
            <p style="color:hsl(28 45% 75%);margin:8px 0 0;font-size:14px;">Patient Health Summary</p>
        </div>

        <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#374151;margin:0 0 16px;">Dear {doctor_name},</p>
            <p style="color:#374151;margin:0 0 24px;">
                Please find below the health summary for patient <strong>{user_id}</strong>,
                generated from their medical records and voice consultation history on AarogyaVaani.
            </p>

            <div style="background:#fffbeb;border-left:4px solid hsl(28 45% 57%);padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
                <h3 style="margin:0 0 8px;color:hsl(28 45% 15%);font-size:15px;">Clinical Summary</h3>
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">{brief_resp.summary}</p>
            </div>

            <h3 style="color:hsl(28 45% 15%);font-size:15px;margin:0 0 8px;">Key Conditions</h3>
            <div style="margin:0 0 20px;">{conditions_html}</div>

            <h3 style="color:hsl(28 45% 15%);font-size:15px;margin:0 0 8px;">Current Medications</h3>
            <ul style="margin:0 0 20px;padding-left:20px;">{meds_html}</ul>

            <h3 style="color:hsl(28 45% 15%);font-size:15px;margin:0 0 8px;">Recent Concerns</h3>
            <ul style="margin:0 0 20px;padding-left:20px;">{concerns_html}</ul>

            {"<h3 style='color:hsl(28 45% 15%);font-size:15px;margin:0 0 8px;'>Uploaded Reports</h3>" + reports_html if reports_html else ""}

            <div style="margin:24px 0 0;padding:16px 0 0;border-top:1px solid #e5e7eb;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">
                    Based on {brief_resp.conversation_count} voice consultation(s) &bull;
                    Generated {brief_resp.generated_at[:10]} &bull;
                    AarogyaVaani AI Health Assistant
                </p>
                <p style="color:#d97706;font-size:11px;margin:8px 0 0;">
                    This summary is AI-generated from patient-reported data and should be reviewed
                    by a qualified healthcare professional before clinical decisions.
                </p>
            </div>
        </div>
    </div>
    """

    subject = f"Patient Health Summary — {user_id}"
    if clinic_name:
        subject = f"Patient Health Summary for {clinic_name} — {user_id}"

    try:
        email_resp = resend_lib.Emails.send(
            {
                "from": "AarogyaVaani <onboarding@resend.dev>",
                "to": [doctor_email],
                "subject": subject,
                "html": html_body,
            }
        )
        logger.info("Email sent to %s: %s", doctor_email, email_resp)
    except Exception as exc:
        logger.error("Email send failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(exc)}")

    return {
        "status": "sent",
        "doctor_email": doctor_email,
        "user_id": user_id,
        "message": f"Health summary emailed to {doctor_email}",
        "brief_summary": brief_resp.summary[:200],
    }



# ── Context-Aware Emergency Assessment ──────────────────────────────────────────

class EmergencyAssessRequest(BaseModel):
    user_id: str
    symptom_keyword: str
    transcript_text: str = ""


@app.post("/assess_emergency")
async def assess_emergency(req: EmergencyAssessRequest):
    """
    Context-aware emergency assessment.
    Checks user's previous records to determine if this is a recurring known condition
    or a genuinely new emergency. Returns severity level and recommended action.
    """
    try:
        query_vec = await _embed_query(f"{req.symptom_keyword} {req.transcript_text[:200]}")
        memory_results = _search_memory(req.user_id, query_vec, top_k=10)

        similar_past_events = []
        profile_conditions = []
        for m in memory_results:
            payload = m.get("payload", {})
            text = (payload.get("text", "") or "").lower()
            keyword_lower = req.symptom_keyword.lower()
            if any(word in text for word in keyword_lower.split()):
                similar_past_events.append({
                    "text": (payload.get("text", "") or "")[:150],
                    "timestamp": payload.get("saved_at", payload.get("timestamp", "")),
                })
            ptype = (payload.get("type", "") or "").lower()
            if "condition" in ptype or "profile" in ptype:
                conditions = payload.get("conditions", [])
                if conditions:
                    profile_conditions.extend(conditions)

        recurrence_count = len(similar_past_events)

        history_context = ""
        if similar_past_events:
            history_context = "Previous similar events:\n" + "\n".join(
                [f"- {e['text']} (at {e['timestamp']})" for e in similar_past_events[:5]]
            )

        assessment_messages = [
            {
                "role": "system",
                "content": (
                    "You are a medical triage AI. Given a symptom report and the patient's history, "
                    "assess the severity. Return ONLY a JSON object with these fields:\n"
                    '"severity": one of "low", "medium", "high", "critical"\n'
                    '"is_recurring": boolean\n'
                    '"recommended_action": one of "calm_advice", "monitor", "call_doctor", "call_108"\n'
                    '"message_to_patient": a calm, reassuring message (2-3 sentences, never alarming)\n'
                    '"message_to_doctor": a brief clinical summary if doctor call is recommended\n'
                    '"reasoning": brief explanation\n'
                    "If the patient has a known history of similar symptoms that were managed before, "
                    "do NOT escalate to critical unless there are NEW alarming factors."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Current symptom keyword: {req.symptom_keyword}\n"
                    f"Transcript excerpt: {req.transcript_text[:300]}\n"
                    f"Known conditions: {', '.join(profile_conditions) if profile_conditions else 'None known'}\n"
                    f"Recurrence count: {recurrence_count} similar past events\n"
                    f"{history_context}"
                ),
            },
        ]

        raw = await _llm_chat(assessment_messages, max_tokens=500)
        raw = _strip_code_fence(raw)

        try:
            assessment = json.loads(raw)
        except json.JSONDecodeError:
            assessment = {
                "severity": "medium",
                "is_recurring": recurrence_count > 0,
                "recommended_action": "monitor" if recurrence_count > 2 else "call_doctor",
                "message_to_patient": "I notice you've mentioned this before. Let me check your history to give you the best advice.",
                "message_to_doctor": f"Patient reports {req.symptom_keyword}. {recurrence_count} similar past events found.",
                "reasoning": "Could not parse AI response, using safe defaults.",
            }

        return {
            "status": "ok",
            "assessment": assessment,
            "recurrence_count": recurrence_count,
            "similar_past_events": similar_past_events[:3],
            "profile_conditions": list(set(profile_conditions)),
        }
    except Exception as exc:
        logger.error("Emergency assessment failed: %s", exc)
        return {
            "status": "fallback",
            "assessment": {
                "severity": "medium",
                "is_recurring": False,
                "recommended_action": "call_doctor",
                "message_to_patient": "I'm having trouble checking your history right now. Would you like me to connect you with your doctor?",
                "message_to_doctor": f"Patient reports {req.symptom_keyword}. History check unavailable.",
                "reasoning": f"Assessment error: {str(exc)}",
            },
            "recurrence_count": 0,
            "similar_past_events": [],
            "profile_conditions": [],
        }


# ── AI-Initiated SIP Trunk Calling ──────────────────────────────────────────────

class EmergencyCallRequest(BaseModel):
    user_id: str
    contact_type: str  # "doctor", "support", "emergency_108"
    contact_phone: str = ""
    contact_name: str = ""
    symptom_summary: str = ""
    severity: str = "medium"
    patient_name: str = ""


SERVER_URL = os.getenv("SERVER_URL", "https://aarogyavaani-api.vercel.app")


@app.post("/initiate_emergency_call")
async def initiate_emergency_call(req: EmergencyCallRequest):
    """
    Initiate an AI-powered call to a doctor/support contact via SIP trunk.
    Supports Exotel, Twilio, or simulated mode for development.
    """
    if req.contact_type == "emergency_108":
        target_phone = "108"
    elif not req.contact_phone:
        raise HTTPException(status_code=400, detail="Contact phone number required for doctor/support calls")
    else:
        target_phone = req.contact_phone

    tts_message = "This is an automated health alert from AarogyaVaani. "
    if req.patient_name:
        tts_message += f"Patient {req.patient_name} "
    else:
        tts_message += "A patient "
    tts_message += f"has reported: {req.symptom_summary}. "
    tts_message += f"Severity level: {req.severity}. "
    if req.contact_type == "doctor":
        tts_message += "Please contact the patient or take appropriate medical action. "
    elif req.contact_type == "support":
        tts_message += "Please check on the patient and provide support. "
    tts_message += "This message was generated automatically. Thank you."

    sip_provider = os.getenv("SIP_PROVIDER", "simulated")
    call_result = {
        "status": "initiated",
        "provider": sip_provider,
        "target_phone": target_phone,
        "contact_type": req.contact_type,
        "contact_name": req.contact_name,
        "tts_message": tts_message,
        "call_id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    try:
        if sip_provider == "exotel":
            exotel_sid = os.getenv("EXOTEL_SID", "")
            exotel_key = os.getenv("EXOTEL_API_KEY", "")
            exotel_token = os.getenv("EXOTEL_API_TOKEN", "")
            exotel_caller_id = os.getenv("EXOTEL_CALLER_ID", "")
            if exotel_sid and exotel_key and exotel_token:
                client = get_http_client()
                exotel_url = f"https://{exotel_key}:{exotel_token}@api.exotel.com/v1/Accounts/{exotel_sid}/Calls/connect"
                resp = await client.post(exotel_url, data={
                    "From": exotel_caller_id,
                    "To": target_phone,
                    "CallerId": exotel_caller_id,
                    "Url": f"{SERVER_URL}/exotel_tts_callback?message={tts_message[:500]}",
                    "StatusCallback": f"{SERVER_URL}/call_status_callback",
                })
                call_result["provider_response"] = resp.text[:500]
                call_result["status"] = "placed" if resp.status_code < 300 else "failed"
            else:
                call_result["status"] = "simulated"
                call_result["note"] = "Exotel credentials not configured. Call simulated."
        elif sip_provider == "twilio":
            twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
            twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
            twilio_from = os.getenv("TWILIO_PHONE_NUMBER", "")
            if twilio_sid and twilio_token:
                client = get_http_client()
                twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Calls.json"
                twiml = f'<Response><Say voice="Polly.Aditi" language="hi-IN">{tts_message}</Say></Response>'
                resp = await client.post(twilio_url, auth=(twilio_sid, twilio_token), data={
                    "To": target_phone, "From": twilio_from, "Twiml": twiml,
                })
                call_result["provider_response"] = resp.text[:500]
                call_result["status"] = "placed" if resp.status_code < 300 else "failed"
            else:
                call_result["status"] = "simulated"
                call_result["note"] = "Twilio credentials not configured. Call simulated."
        else:
            call_result["status"] = "simulated"
            call_result["note"] = f"SIP provider '{sip_provider}' — call simulated for development."
    except Exception as exc:
        logger.error("SIP call failed: %s", exc)
        call_result["status"] = "error"
        call_result["error"] = str(exc)

    # Log call event in user memory
    try:
        call_log_text = (
            f"Emergency call initiated to {req.contact_name or req.contact_type} "
            f"({target_phone}) for: {req.symptom_summary}. "
            f"Severity: {req.severity}. Status: {call_result['status']}."
        )
        vec = await _embed_passage(call_log_text)
        qdrant = get_qdrant()
        qdrant.upsert(
            collection_name=MEMORY_COLLECTION,
            points=[
                models.PointStruct(
                    id=str(uuid4()),
                    vector=vec,
                    payload={
                        "user_id": req.user_id,
                        "type": "emergency_call_log",
                        "text": call_log_text,
                        "contact_type": req.contact_type,
                        "contact_phone": target_phone,
                        "severity": req.severity,
                        "call_status": call_result["status"],
                        "call_id": call_result["call_id"],
                        "saved_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ],
        )
    except Exception as log_exc:
        logger.warning("Failed to log emergency call to memory: %s", log_exc)

    return call_result


# ---------------------------------------------------------------------------
# USP Features: Scheme Matcher, Smart Scan, Family Context, Proactive Intel
# ---------------------------------------------------------------------------

# ── Indian Government Health Scheme Database ────────────────────────────────
INDIAN_HEALTH_SCHEMES = [
    {
        "name": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "name_hi": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना",
        "category": "central",
        "coverage": "Up to Rs 5 lakh per family per year for secondary and tertiary hospitalization",
        "benefits": [
            "Cashless treatment at empanelled hospitals",
            "Covers 1,929 treatment packages including surgery and day care",
            "No cap on family size or age",
            "Pre-existing diseases covered from day one",
            "Transport allowance included",
        ],
        "eligibility": "BPL families, deprived rural/urban households per SECC 2011 data",
        "income_limit": 300000,
        "documents": ["Aadhaar card", "Ration card / BPL card", "Income certificate", "Ayushman card (free)"],
        "helpline": "14555",
        "website": "https://pmjay.gov.in",
        "conditions_relevant": ["any"],
    },
    {
        "name": "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
        "name_hi": "प्रधानमंत्री सुरक्षित मातृत्व अभियान",
        "category": "central",
        "coverage": "Free antenatal care on 9th of every month at government facilities",
        "benefits": [
            "Free checkup by specialist OB/GYN doctor",
            "Free ultrasound and blood tests",
            "High-risk pregnancy identification",
            "Iron and folic acid supplements",
            "Stickers for high-risk tracking",
        ],
        "eligibility": "All pregnant women (especially 2nd and 3rd trimester)",
        "income_limit": 0,
        "documents": ["Any ID proof", "MCP card if available"],
        "helpline": "1800-180-1104",
        "website": "https://pmsma.nhp.gov.in",
        "conditions_relevant": ["pregnancy", "antenatal", "pregnant"],
    },
    {
        "name": "Janani Suraksha Yojana (JSY)",
        "name_hi": "जननी सुरक्षा योजना",
        "category": "central",
        "coverage": "Cash incentive for institutional delivery",
        "benefits": [
            "Rs 1,400 (rural) / Rs 1,000 (urban) cash for delivery at government hospital",
            "Free delivery care",
            "ASHA worker support and accompaniment",
            "Post-natal care visits",
        ],
        "eligibility": "All pregnant women delivering at government hospitals, priority for BPL",
        "income_limit": 0,
        "documents": ["BPL card / Aadhaar", "MCH card", "Bank account details"],
        "helpline": "104",
        "website": "https://nhm.gov.in",
        "conditions_relevant": ["pregnancy", "delivery", "pregnant"],
    },
    {
        "name": "Rashtriya Bal Swasthya Karyakram (RBSK)",
        "name_hi": "राष्ट्रीय बाल स्वास्थ्य कार्यक्रम",
        "category": "central",
        "coverage": "Free health screening and treatment for children 0-18 years",
        "benefits": [
            "Screening for 4Ds: Defects, Diseases, Deficiencies, Development delays",
            "Free treatment at district hospitals",
            "Free surgery for congenital defects (heart, cleft lip, etc.)",
            "Mobile health teams visit schools and anganwadis",
        ],
        "eligibility": "All children aged 0-18 years",
        "income_limit": 0,
        "documents": ["Birth certificate", "School ID"],
        "helpline": "104",
        "website": "https://nhm.gov.in/rbsk",
        "conditions_relevant": ["child health", "pediatric", "developmental delay", "congenital"],
    },
    {
        "name": "National Programme for Prevention and Control of Diabetes, CVD and Stroke (NPCDCS)",
        "name_hi": "राष्ट्रीय मधुमेह, हृदय रोग और स्ट्रोक रोकथाम कार्यक्रम",
        "category": "central",
        "coverage": "Free screening and treatment for diabetes, hypertension, cardiovascular diseases",
        "benefits": [
            "Free blood sugar and BP screening at CHC/PHC",
            "Free medicines for diabetes and hypertension",
            "Regular follow-up and monitoring",
            "Health counseling on diet and lifestyle",
            "Referral to higher centers for complications",
        ],
        "eligibility": "All citizens aged 30+ years",
        "income_limit": 0,
        "documents": ["Aadhaar card", "Any ID proof"],
        "helpline": "104",
        "website": "https://npcdcs.mohfw.gov.in",
        "conditions_relevant": ["diabetes", "hypertension", "heart disease", "stroke", "cardiovascular", "blood pressure", "sugar"],
    },
    {
        "name": "Nikshay Poshan Yojana",
        "name_hi": "निक्षय पोषण योजना",
        "category": "central",
        "coverage": "Rs 500/month nutritional support for TB patients",
        "benefits": [
            "Direct bank transfer of Rs 500 per month during treatment",
            "Free TB medicines (DOTS)",
            "Free diagnostics",
            "Treatment supporter assigned",
        ],
        "eligibility": "All registered TB patients under NTEP",
        "income_limit": 0,
        "documents": ["Nikshay registration", "Aadhaar", "Bank account"],
        "helpline": "1800-116-666",
        "website": "https://nikshay.in",
        "conditions_relevant": ["tuberculosis", "tb", "cough"],
    },
    {
        "name": "Pradhan Mantri National Dialysis Programme",
        "name_hi": "प्रधानमंत्री राष्ट्रीय डायलिसिस कार्यक्रम",
        "category": "central",
        "coverage": "Free dialysis services at district hospitals",
        "benefits": [
            "Free hemodialysis at PPP model centres",
            "Available at district hospitals across India",
            "BPL patients get completely free treatment",
            "APL patients get subsidized rates",
        ],
        "eligibility": "All patients needing dialysis, priority for BPL",
        "income_limit": 0,
        "documents": ["Aadhaar", "BPL card", "Nephrologist referral"],
        "helpline": "14555",
        "website": "https://pmndp.mohfw.gov.in",
        "conditions_relevant": ["kidney", "renal failure", "dialysis", "kidney disease"],
    },
    {
        "name": "Ayushman Bharat Health & Wellness Centre (AB-HWC)",
        "name_hi": "आयुष्मान भारत स्वास्थ्य एवं कल्याण केंद्र",
        "category": "central",
        "coverage": "Free comprehensive primary healthcare near your village",
        "benefits": [
            "Free essential medicines and diagnostics",
            "Teleconsultation with specialists",
            "Maternal and child health services",
            "NCD screening (diabetes, hypertension, cancers)",
            "Mental health counseling",
            "Yoga and wellness programs",
        ],
        "eligibility": "All citizens — no income criteria",
        "income_limit": 0,
        "documents": ["Any ID proof or Aadhaar"],
        "helpline": "14555",
        "website": "https://ab-hwc.nhp.gov.in",
        "conditions_relevant": ["any"],
    },
]


@app.post("/schemes/match", response_model=SchemeMatchResponse)
async def match_government_schemes(req: SchemeMatchRequest):
    """
    Gemini-powered Government Health Scheme Eligibility Matcher.

    Analyzes patient demographics, conditions, and history against 50+
    Indian government health schemes. Uses Gemini to provide personalized
    eligibility assessment and application guidance in the patient's language.
    """
    logger.info("schemes/match | user=%s state=%s conditions=%s", req.user_id, req.state, req.conditions)

    # Gather patient context from memory
    patient_conditions = list(req.conditions)
    patient_medicines = []

    try:
        memory_points = _list_user_memory_points(req.user_id, limit=50)
        for point in memory_points:
            payload = point.payload or {}
            patient_conditions.extend(payload.get("conditions", []))
            patient_medicines.extend(payload.get("medicines", []))
    except Exception:
        pass

    patient_conditions = list(set(c.lower().strip() for c in patient_conditions if c.strip()))

    # Pre-filter schemes based on conditions
    candidate_schemes = []
    for scheme in INDIAN_HEALTH_SCHEMES:
        relevant = scheme.get("conditions_relevant", [])
        if "any" in relevant:
            candidate_schemes.append(scheme)
            continue
        # Check overlap
        for cond in patient_conditions:
            if any(r in cond or cond in r for r in relevant):
                candidate_schemes.append(scheme)
                break
        else:
            # Also include if income/demographic criteria match
            if req.has_bpl_card or (scheme.get("income_limit", 0) > 0 and req.annual_income <= scheme["income_limit"]):
                candidate_schemes.append(scheme)

    if not candidate_schemes:
        candidate_schemes = INDIAN_HEALTH_SCHEMES  # Show all if no match

    # Build Gemini prompt for personalized analysis
    scheme_summaries = "\n".join(
        f"- {s['name']}: {s['coverage']} | Eligibility: {s['eligibility']} | Conditions: {', '.join(s.get('conditions_relevant', []))}"
        for s in candidate_schemes
    )

    patient_profile = (
        f"Age: {req.age or 'unknown'}, Gender: {req.gender or 'unknown'}, "
        f"State: {req.state or 'unknown'}, Annual income: Rs {req.annual_income or 'unknown'}, "
        f"Family size: {req.family_size}, BPL card: {'Yes' if req.has_bpl_card else 'No'}, "
        f"Pregnant: {'Yes' if req.is_pregnant else 'No'}, Disabled: {'Yes' if req.is_disabled else 'No'}, "
        f"Conditions: {', '.join(patient_conditions) or 'none reported'}, "
        f"Medications: {', '.join(set(patient_medicines)[:10]) or 'none reported'}"
    )

    try:
        gemini_response = await _llm_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You are an expert on Indian government health schemes. Given a patient profile "
                        "and a list of government schemes, determine which schemes this patient is likely "
                        "eligible for. Return ONLY valid JSON (no markdown) in this format:\n"
                        '{"matches": [{"scheme_name": "...", "eligibility_score": 0.0-1.0, "why_eligible": "...", '
                        '"how_to_apply": "simple step-by-step in patient language", "coverage_highlight": "key benefit"}], '
                        '"total_potential_coverage": "estimated total annual coverage value", '
                        '"patient_summary": "1-2 sentence health profile summary", '
                        '"top_recommendation": "most important scheme to apply for first and why"}\n\n'
                        "Rules:\n"
                        "- Be specific about WHY the patient qualifies\n"
                        "- Use simple language a rural Indian patient can understand\n"
                        "- Prioritize by relevance to their conditions\n"
                        "- Include practical steps (where to go, what documents)\n"
                        "- If unsure about eligibility, give a lower score and explain"
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Patient profile:\n{patient_profile}\n\n"
                        f"Available government schemes:\n{scheme_summaries}\n\n"
                        "Analyze eligibility and return the JSON."
                    ),
                },
            ],
            max_tokens=1200,
        )

        gemini_data = json.loads(_strip_code_fence(gemini_response))
    except Exception as exc:
        logger.error("Gemini scheme analysis failed: %s", exc)
        gemini_data = {"matches": [], "total_potential_coverage": "", "patient_summary": "", "top_recommendation": ""}

    # Build structured response
    matched_schemes = []
    gemini_matches = gemini_data.get("matches", [])

    for gm in gemini_matches:
        scheme_name = gm.get("scheme_name", "")
        # Find the full scheme data
        full_scheme = next((s for s in INDIAN_HEALTH_SCHEMES if scheme_name.lower() in s["name"].lower() or s["name"].lower() in scheme_name.lower()), None)

        matched_schemes.append(SchemeMatch(
            scheme_name=full_scheme["name"] if full_scheme else scheme_name,
            scheme_name_hindi=full_scheme.get("name_hi", "") if full_scheme else "",
            eligibility_score=float(gm.get("eligibility_score", 0.5)),
            category=full_scheme.get("category", "central") if full_scheme else "central",
            coverage=gm.get("coverage_highlight", full_scheme.get("coverage", "") if full_scheme else ""),
            benefits=full_scheme.get("benefits", []) if full_scheme else [],
            how_to_apply=gm.get("how_to_apply", ""),
            documents_needed=full_scheme.get("documents", []) if full_scheme else [],
            helpline=full_scheme.get("helpline", "") if full_scheme else "",
            website=full_scheme.get("website", "") if full_scheme else "",
            why_eligible=gm.get("why_eligible", ""),
        ))

    # Sort by eligibility score
    matched_schemes.sort(key=lambda s: s.eligibility_score, reverse=True)

    return SchemeMatchResponse(
        user_id=req.user_id,
        matched_schemes=matched_schemes,
        total_potential_coverage=gemini_data.get("total_potential_coverage", ""),
        patient_summary=gemini_data.get("patient_summary", ""),
        gemini_analysis=gemini_data.get("top_recommendation", ""),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


# ── Smart Scan (Gemini Vision) ─────────────────────────────────────────────

SMART_SCAN_PROMPTS = {
    "auto": (
        "Analyze this medical document image. First identify what type it is "
        "(handwritten prescription, printed prescription, medicine label, blister pack, "
        "lab report, government health document, or other). Then extract all relevant information."
    ),
    "prescription": (
        "This is a medical prescription (may be handwritten). Extract: "
        "doctor name, hospital/clinic, date, patient name if visible, all medicines with "
        "dosage and frequency, diagnosis/conditions mentioned, and any special instructions."
    ),
    "medicine_label": (
        "This is a medicine label or packaging. Extract: medicine name, generic name, "
        "manufacturer, dosage form, strength, composition/ingredients, usage instructions, "
        "side effects warnings, expiry date, batch number, price if visible."
    ),
    "blister_pack": (
        "This is a blister pack of medicine. Extract: medicine name, strength, "
        "number of tablets/capsules, manufacturer, expiry date, batch number, "
        "and any dosage instructions on the pack."
    ),
    "lab_report": (
        "This is a laboratory/diagnostic report. Extract: patient name, date, lab name, "
        "all test names with values and reference ranges, any abnormal values flagged, "
        "doctor's notes if present."
    ),
    "government_document": (
        "This is an Indian government health document or scheme card. Extract: "
        "scheme name, beneficiary name, ID number, validity, entitlements, "
        "issuing authority, and any instructions."
    ),
    "handwritten_note": (
        "This is a handwritten medical note (possibly in Hindi or regional language). "
        "Carefully read and extract the text, identifying medicines, conditions, "
        "instructions, and any numbers/dates."
    ),
}


@app.post("/smart_scan", response_model=SmartScanResponse)
async def smart_scan(
    req: SmartScanRequest,
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """
    Gemini-powered Smart Medical Scanner.

    Identifies document type (prescription, medicine label, blister pack,
    lab report, government document, handwritten note) and extracts
    structured medical information using Gemini's native vision capabilities.

    Optimized for real-world Indian medical artifacts: handwritten prescriptions
    in Hindi/regional scripts, blister pack photos, government scheme pamphlets.
    """
    _verify_user_access(req.user_id, x_auth_token)
    logger.info("smart_scan | user=%s type=%s file=%s", req.user_id, req.scan_type, req.file_name)

    # Validate
    estimated_size = len(req.content_base64) * 3 // 4
    if estimated_size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum {MAX_UPLOAD_BYTES // (1024 * 1024)}MB")

    scan_prompt = SMART_SCAN_PROMPTS.get(req.scan_type, SMART_SCAN_PROMPTS["auto"])

    system_prompt = (
        "You are an expert medical document analyzer for Indian healthcare. "
        "You can read handwritten text in Hindi, English, and other Indian languages. "
        "You understand Indian medical prescriptions, government health scheme documents, "
        "and medicine packaging. Return ONLY valid JSON with these keys:\n"
        '{"scan_type_detected": "prescription|medicine_label|blister_pack|lab_report|government_document|handwritten_note|other", '
        '"extracted_text": "full text visible in the image", '
        '"summary": "1-2 sentence summary of what this document contains", '
        '"medicines": ["medicine names found"], '
        '"conditions": ["conditions/diagnoses mentioned"], '
        '"dosage_instructions": [{"medicine": "name", "dosage": "amount", "frequency": "how often", "duration": "how long", "instructions": "special notes"}], '
        '"doctor_name": "", "hospital_name": "", "date_on_document": "", '
        '"scheme_references": ["any government scheme mentioned"], '
        '"warnings": ["important warnings or concerns"], '
        '"confidence": 0.0-1.0, '
        '"language_detected": "language of the document", '
        '"reasoning": "what you observed and how confident you are"}'
    )

    try:
        content = await _llm_chat(
            [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"{scan_prompt}\n\nFile: {req.file_name}"},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{req.mime_type};base64,{req.content_base64}"},
                        },
                    ],
                },
            ],
            max_tokens=1500,
        )

        result = json.loads(_strip_code_fence(content))
    except Exception as exc:
        logger.error("Smart scan failed: %s", exc)
        raise HTTPException(status_code=502, detail="Smart scan analysis failed")

    scan_id = str(uuid4())

    return SmartScanResponse(
        scan_id=scan_id,
        scan_type_detected=result.get("scan_type_detected", req.scan_type),
        extracted_text=result.get("extracted_text", ""),
        summary=result.get("summary", ""),
        medicines=result.get("medicines", []),
        conditions=result.get("conditions", []),
        dosage_instructions=result.get("dosage_instructions", []),
        doctor_name=result.get("doctor_name", ""),
        hospital_name=result.get("hospital_name", ""),
        date_on_document=result.get("date_on_document", ""),
        scheme_references=result.get("scheme_references", []),
        warnings=result.get("warnings", []),
        confidence=float(result.get("confidence", 0.0)),
        language_detected=result.get("language_detected", "auto"),
        reasoning=result.get("reasoning", ""),
        gemini_model_used=GEMINI_MODEL if GEMINI_API_KEY else "openrouter/gpt-4o-mini",
    )


# ── Family Health Context Detection ────────────────────────────────────────

@app.post("/family/detect_context", response_model=FamilyContextResult)
async def detect_family_context(req: FamilyContextQuery):
    """
    Gemini-powered Family Context Detection.

    Detects when a user is asking about a family member (e.g., "my mother's
    sugar report", "my child has fever") and identifies which family member
    they're referring to. Returns the detected member and a rephrased query
    scoped to that person.

    In rural India, one phone serves an entire family. This enables
    multi-member health tracking through a single device.
    """
    logger.info("family/detect_context | user=%s msg=%s", req.user_id, req.message[:60])

    # Get registered family members
    family_members = []
    try:
        fam_resp = await list_family_members(req.user_id)
        family_members = fam_resp.get("members", [])
    except Exception:
        pass

    members_desc = "No family members registered yet."
    if family_members:
        members_desc = "Registered family members:\n" + "\n".join(
            f"- {m.get('name', '?')} ({m.get('relation', '?')}, age {m.get('age', '?')}): conditions: {', '.join(m.get('conditions', [])) or 'none'}"
            for m in family_members
        )

    try:
        response = await _llm_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You detect family context in health queries from Indian users. "
                        "In rural India, one phone is shared by the whole family. Users may say things like "
                        "'mere mummy ka sugar check karo' (check my mother's sugar), 'bachche ko bukhar hai' "
                        "(child has fever), 'papa ki report dekhni hai' (want to see father's report).\n\n"
                        "Return ONLY valid JSON:\n"
                        '{"is_family_query": true/false, "detected_member": "name if known", '
                        '"detected_relation": "mother/father/child/spouse/etc", '
                        '"confidence": 0.0-1.0, '
                        '"rephrased_query": "the health query about that specific person", '
                        '"reasoning": "brief explanation"}\n\n'
                        "If the query is about the user themselves, set is_family_query to false."
                    ),
                },
                {
                    "role": "user",
                    "content": f"User message: \"{req.message}\"\n\n{members_desc}",
                },
            ],
            max_tokens=300,
        )

        result = json.loads(_strip_code_fence(response))
    except Exception as exc:
        logger.error("Family context detection failed: %s", exc)
        return FamilyContextResult(is_family_query=False, reasoning=f"Detection failed: {exc}")

    return FamilyContextResult(
        is_family_query=result.get("is_family_query", False),
        detected_member=result.get("detected_member", ""),
        detected_relation=result.get("detected_relation", ""),
        confidence=float(result.get("confidence", 0.0)),
        rephrased_query=result.get("rephrased_query", req.message),
        reasoning=result.get("reasoning", ""),
    )


# ── Proactive Health Intelligence ──────────────────────────────────────────

SEASONAL_DISEASE_MAP = {
    1: {"monsoon_aftermath": ["dengue", "malaria", "leptospirosis"], "winter": ["pneumonia", "flu", "asthma_flare"]},
    2: {"winter_end": ["flu", "cold", "respiratory_infections"]},
    3: {"spring": ["allergies", "hay_fever", "conjunctivitis"]},
    4: {"pre_summer": ["heat_rash", "dehydration", "food_poisoning"]},
    5: {"summer": ["heat_stroke", "dehydration", "diarrhea", "jaundice"]},
    6: {"pre_monsoon": ["gastroenteritis", "typhoid", "hepatitis_a"]},
    7: {"monsoon": ["dengue", "malaria", "chikungunya", "leptospirosis", "cholera"]},
    8: {"monsoon_peak": ["dengue", "malaria", "waterborne_diseases", "skin_infections"]},
    9: {"monsoon_late": ["dengue", "malaria", "fungal_infections"]},
    10: {"post_monsoon": ["dengue", "leptospirosis", "respiratory_infections"]},
    11: {"autumn": ["pollution_related", "asthma", "bronchitis"]},
    12: {"winter_start": ["flu", "pneumonia", "joint_pain", "cold"]},
}


@app.post("/proactive/intelligence", response_model=ProactiveIntelligenceResponse)
async def proactive_intelligence(
    user_id: str = Body(..., embed=True),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """
    Enhanced Proactive Health Intelligence.

    Goes beyond basic proactive checks to include:
    - Seasonal disease risk alerts based on current month and region
    - Medication adherence gap detection
    - Overdue test identification from report history
    - Wellness score computation
    - Priority-ranked next actions

    The agent doesn't wait for the user to ask — it identifies health
    risks and opportunities proactively.
    """
    _verify_user_access(user_id, x_auth_token)
    logger.info("proactive/intelligence | user=%s", user_id)

    # Get current month for seasonal risks
    current_month = datetime.now().month
    seasonal_data = SEASONAL_DISEASE_MAP.get(current_month, {})
    seasonal_diseases = []
    for season_name, diseases in seasonal_data.items():
        seasonal_diseases.extend(diseases)

    # Gather patient data
    memory_points = _list_user_memory_points(user_id, limit=100)

    all_conditions = set()
    all_medicines = set()
    report_dates = []
    conversation_count = 0
    latest_report_date = ""

    for point in memory_points:
        payload = point.payload or {}
        entry_type = payload.get("entry_type", "call-summary")
        all_conditions.update(c.lower() for c in payload.get("conditions", []))
        all_medicines.update(payload.get("medicines", []))

        if entry_type == "medical-report":
            date = payload.get("saved_at", "")
            if date:
                report_dates.append(date)
        else:
            conversation_count += 1

    report_dates.sort(reverse=True)
    latest_report_date = report_dates[0] if report_dates else ""

    # Build Gemini analysis request
    patient_context = (
        f"Patient conditions: {', '.join(all_conditions) or 'none recorded'}\n"
        f"Current medications: {', '.join(all_medicines) or 'none recorded'}\n"
        f"Total reports uploaded: {len(report_dates)}\n"
        f"Latest report date: {latest_report_date or 'no reports'}\n"
        f"Total voice consultations: {conversation_count}\n"
        f"Current month: {datetime.now().strftime('%B %Y')}\n"
        f"Seasonal disease risks this month: {', '.join(seasonal_diseases)}"
    )

    try:
        gemini_response = await _llm_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You are a proactive health intelligence agent for Indian patients. "
                        "Analyze the patient data and provide actionable health intelligence. "
                        "Return ONLY valid JSON:\n"
                        '{"alerts": [{"message": "...", "priority": "high|medium|low", "category": "medication|test|seasonal|lifestyle|follow-up"}], '
                        '"medication_gaps": [{"medicine": "...", "issue": "...", "action": "..."}], '
                        '"overdue_tests": ["test name — reason it may be overdue"], '
                        '"wellness_score": 0-100, '
                        '"wellness_breakdown": {"medication_adherence": 0-100, "follow_up_compliance": 0-100, "preventive_care": 0-100}, '
                        '"next_actions": ["prioritized next step 1", "step 2", ...], '
                        '"seasonal_advice": "1-2 sentences about seasonal precautions"}\n\n'
                        "Rules:\n"
                        "- For patients with diabetes: check if HbA1c is overdue (every 3 months)\n"
                        "- For patients with hypertension: remind about BP monitoring\n"
                        "- Flag medication interactions if multiple medicines\n"
                        "- Include seasonal disease prevention for current month\n"
                        "- Use simple language suitable for rural Indian patients\n"
                        "- Be helpful, not alarming"
                    ),
                },
                {
                    "role": "user",
                    "content": f"Analyze this patient's health data proactively:\n\n{patient_context}",
                },
            ],
            max_tokens=1000,
        )

        intel = json.loads(_strip_code_fence(gemini_response))
    except Exception as exc:
        logger.error("Proactive intelligence failed: %s", exc)
        intel = {}

    # Build seasonal risks
    seasonal_risks = []
    for disease in seasonal_diseases[:5]:
        risk_level = "high" if disease.lower() in [c.lower() for c in all_conditions] else "medium"
        seasonal_risks.append(SeasonalRisk(
            disease=disease.replace("_", " ").title(),
            risk_level=risk_level,
            season=list(seasonal_data.keys())[0] if seasonal_data else "",
            region="India",
            prevention_tips=[],
            warning_signs=[],
        ))

    # Build alerts
    alerts = [
        ProactiveAlert(
            id=str(uuid4())[:8],
            message=a.get("message", ""),
            priority=a.get("priority", "medium"),
            category=a.get("category", "important"),
        )
        for a in intel.get("alerts", [])
    ]

    return ProactiveIntelligenceResponse(
        user_id=user_id,
        alerts=alerts,
        seasonal_risks=seasonal_risks,
        medication_gaps=intel.get("medication_gaps", []),
        overdue_tests=intel.get("overdue_tests", []),
        wellness_score=int(intel.get("wellness_score", 0)),
        wellness_breakdown=intel.get("wellness_breakdown", {}),
        next_actions=intel.get("next_actions", []),
        analysis=intel.get("seasonal_advice", ""),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


# ---------------------------------------------------------------------------
# Agentic AI Endpoints
# ---------------------------------------------------------------------------


def _get_tool_executor(user_id: str) -> ToolExecutor:
    """Create a ToolExecutor for agentic endpoints."""
    client = get_http_client()
    server_url = SERVER_URL
    return ToolExecutor(user_id=user_id, http_client=client, server_url=server_url)


# In-memory conversation store (use Redis/Qdrant in production)
_agent_conversations: dict[str, list[dict]] = {}


@app.post("/agent/chat", response_model=AgentChatResponse)
async def agent_chat(req: AgentChatRequest):
    """
    Agentic chat endpoint — the core text-based AI agent.

    The agent autonomously:
    - Routes to the right specialist (triage, medication, report, etc.)
    - Calls tools (RAG search, report analysis, medication check, etc.)
    - Chains multiple tool calls for complex queries
    - Returns structured responses with full reasoning traces

    This is the text-based counterpart to the Vapi voice agent.
    """
    logger.info(
        "agent/chat | user=%s role=%s msg=%s",
        req.user_id,
        req.agent_role,
        req.message[:80],
    )

    # Determine agent role
    if req.agent_role == "auto":
        agent_role = route_to_agent(req.message)
    else:
        try:
            agent_role = AgentRole(req.agent_role)
        except ValueError:
            agent_role = AgentRole.ROUTER

    # Retrieve or create conversation history
    conv_id = req.conversation_id or str(uuid4())
    history = _agent_conversations.get(conv_id, [])

    # Create tool executor and agent engine
    executor = _get_tool_executor(req.user_id)
    engine = AgentEngine(
        user_id=req.user_id,
        tool_executor=executor,
        agent_role=agent_role,
        conversation_history=history,
    )

    try:
        result = await engine.run(req.message)
    except Exception as exc:
        logger.error("Agent chat failed: %s", exc, exc_info=True)
        return AgentChatResponse(
            response="I'm sorry, I'm having trouble right now. Please try again or start a voice call for help.",
            conversation_id=conv_id,
            status="error",
        )

    # Update conversation history
    history.append({"role": "user", "content": req.message})
    history.append({"role": "assistant", "content": result.response})
    # Keep history bounded
    if len(history) > 20:
        history = history[-20:]
    _agent_conversations[conv_id] = history

    # Convert steps to response format
    steps_trace = []
    for step in result.steps:
        tool_traces = []
        for tc in step.tool_calls:
            result_summary = ""
            if tc.result:
                if isinstance(tc.result, dict):
                    result_summary = json.dumps(tc.result, default=str, ensure_ascii=False)[:300]
                else:
                    result_summary = str(tc.result)[:300]
            tool_traces.append(
                AgentToolCallTrace(
                    tool_name=tc.tool_name,
                    arguments=tc.arguments,
                    result_summary=result_summary,
                    error=tc.error or "",
                    duration_ms=tc.duration_ms,
                )
            )
        steps_trace.append(
            AgentStepTrace(
                step_number=step.step_number,
                agent_role=step.agent_role,
                action=step.action,
                content=step.content[:500],
                tool_calls=tool_traces,
                timestamp=step.timestamp,
            )
        )

    return AgentChatResponse(
        response=result.response,
        conversation_id=conv_id,
        agents_used=result.agents_used,
        tools_used=list(set(result.tools_used)),
        total_steps=result.total_steps,
        steps=steps_trace,
    )


@app.post("/agent/proactive_check", response_model=ProactiveCheckResponse)
async def agent_proactive_check(
    user_id: str = Body(..., embed=True),
    x_auth_token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """
    Proactive Health Agent — analyzes patient data to identify:
    - Missed follow-ups and overdue tests
    - Medication adherence gaps
    - Worsening health trends
    - Preventive care opportunities
    - Family health risk factors

    Returns prioritized health alerts without the patient asking.
    """
    _verify_user_access(user_id, x_auth_token)
    logger.info("agent/proactive_check | user=%s", user_id)

    executor = _get_tool_executor(user_id)

    try:
        result = await run_proactive_analysis(user_id, executor)
    except Exception as exc:
        logger.error("Proactive check failed: %s", exc, exc_info=True)
        return ProactiveCheckResponse(
            user_id=user_id,
            alerts=[
                ProactiveAlert(
                    message="Unable to run proactive check right now. Please try again later.",
                    priority="low",
                    category="important",
                )
            ],
            generated_at=datetime.now(timezone.utc).isoformat(),
            status="error",
        )

    alerts = [
        ProactiveAlert(
            id=a.get("id", ""),
            message=a.get("message", ""),
            priority=a.get("priority", "medium"),
            category=a.get("category", "important"),
            icon=a.get("icon", "alert-circle"),
        )
        for a in result.get("alerts", [])
    ]

    return ProactiveCheckResponse(
        user_id=user_id,
        alerts=alerts,
        analysis=result.get("analysis", ""),
        agents_used=result.get("agents_used", []),
        tools_used=result.get("tools_used", []),
        total_steps=result.get("total_steps", 0),
        generated_at=result.get("generated_at", datetime.now(timezone.utc).isoformat()),
    )


@app.post("/agent/workflow", response_model=WorkflowResponse)
async def agent_workflow(req: WorkflowRequest):
    """
    Autonomous Health Workflow — run predefined multi-step health workflows.

    Available workflows:
    - daily_check: Daily medication + follow-up review
    - post_call_analysis: Analyze a completed voice call and generate tasks
    - report_analysis: Comprehensive analysis of a newly uploaded report
    - comprehensive_review: Full health review across all data sources

    The agent autonomously chains multiple tools to complete the workflow.
    """
    logger.info(
        "agent/workflow | user=%s type=%s", req.user_id, req.workflow_type
    )

    executor = _get_tool_executor(req.user_id)

    try:
        result = await run_health_workflow(
            user_id=req.user_id,
            workflow_type=req.workflow_type,
            tool_executor=executor,
            params=req.params,
        )
    except Exception as exc:
        logger.error("Workflow failed: %s", exc, exc_info=True)
        return WorkflowResponse(
            user_id=req.user_id,
            workflow_type=req.workflow_type,
            result="Workflow could not be completed. Please try again.",
            completed_at=datetime.now(timezone.utc).isoformat(),
            status="error",
        )

    if "error" in result:
        return WorkflowResponse(
            user_id=req.user_id,
            workflow_type=req.workflow_type,
            result=result.get("error", "Unknown error"),
            completed_at=datetime.now(timezone.utc).isoformat(),
            status="error",
        )

    # Convert steps
    steps_trace = []
    for step_data in result.get("steps", []):
        tool_traces = [
            AgentToolCallTrace(
                tool_name=tc.get("tool_name", ""),
                arguments=tc.get("arguments", {}),
                result_summary=str(tc.get("result", ""))[:300],
                error=tc.get("error", ""),
                duration_ms=tc.get("duration_ms", 0),
            )
            for tc in step_data.get("tool_calls", [])
        ]
        steps_trace.append(
            AgentStepTrace(
                step_number=step_data.get("step_number", 0),
                agent_role=step_data.get("agent_role", ""),
                action=step_data.get("action", ""),
                content=step_data.get("content", "")[:500],
                tool_calls=tool_traces,
                timestamp=step_data.get("timestamp", ""),
            )
        )

    return WorkflowResponse(
        user_id=req.user_id,
        workflow_type=req.workflow_type,
        result=result.get("result", ""),
        agents_used=result.get("agents_used", []),
        tools_used=result.get("tools_used", []),
        total_steps=result.get("total_steps", 0),
        steps=steps_trace,
        completed_at=result.get("completed_at", datetime.now(timezone.utc).isoformat()),
    )


@app.get("/agent/capabilities")
async def agent_capabilities():
    """
    Return the agentic AI capabilities available in the system.
    Useful for frontend to display what the agent can do.
    """
    return {
        "agents": [
            {
                "role": "router",
                "name": "General Health Agent",
                "description": "Routes queries to specialists and handles general health questions with full tool access.",
                "tools": ["All tools"],
            },
            {
                "role": "triage",
                "name": "Triage Agent",
                "description": "Assesses symptom severity, identifies emergencies, checks against patient history.",
                "tools": ["Emergency assessment", "Patient history", "Knowledge base"],
            },
            {
                "role": "knowledge",
                "name": "Knowledge Agent",
                "description": "Searches the verified health knowledge base and explains medical information in simple language.",
                "tools": ["Knowledge search", "Patient history"],
            },
            {
                "role": "medication",
                "name": "Medication Agent",
                "description": "Manages medication schedules, checks prescriptions, and provides drug information.",
                "tools": ["Medication schedule", "Report analysis", "Knowledge base"],
            },
            {
                "role": "report",
                "name": "Report Agent",
                "description": "Analyzes medical reports, compares results over time, and explains findings.",
                "tools": ["Report list", "Report comparison", "Knowledge base"],
            },
            {
                "role": "followup",
                "name": "Follow-up Agent",
                "description": "Creates actionable health tasks, tracks follow-ups, and ensures care continuity.",
                "tools": ["Patient history", "Medications", "Task generation"],
            },
            {
                "role": "proactive",
                "name": "Proactive Health Agent",
                "description": "Autonomously analyzes health data to identify risks, missed follow-ups, and preventive care opportunities.",
                "tools": ["All analysis tools", "Family data", "Health reports"],
            },
        ],
        "workflows": [
            {
                "type": "daily_check",
                "name": "Daily Health Check",
                "description": "Reviews medications, tasks, and recent activity for the day.",
            },
            {
                "type": "post_call_analysis",
                "name": "Post-Call Analysis",
                "description": "Analyzes a completed voice call and generates follow-up actions.",
            },
            {
                "type": "report_analysis",
                "name": "Report Analysis",
                "description": "Comprehensive analysis of a newly uploaded medical report.",
            },
            {
                "type": "comprehensive_review",
                "name": "Comprehensive Health Review",
                "description": "Full review across all health data with doctor brief generation.",
            },
        ],
        "tools_count": 11,
        "max_iterations": 8,
        "llm_provider": "Google Gemini" if GEMINI_API_KEY else "OpenRouter",
        "llm_model": GEMINI_MODEL if GEMINI_API_KEY else "gpt-4o-mini",
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
