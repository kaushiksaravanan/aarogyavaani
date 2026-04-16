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
from fastapi import FastAPI, HTTPException, Request, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from qdrant_client import QdrantClient, models
from pypdf import PdfReader

from app.config import (
    APP_SERVICE_NAME,
    APP_VERSION,
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
    CallHistoryEntry,
    CallHistoryResponse,
    ConversationSummary,
    DoctorBriefRequest,
    DoctorBriefResponse,
    HealthQueryRequest,
    HealthQueryResponse,
    HealthReportResponse,
    HealthResponse,
    HealthTask,
    MedicalReportEntry,
    MedicalReportListResponse,
    MedicalReportUploadRequest,
    MedicalReportUploadResponse,
    ReferenceItem,
    SupportedLanguageItem,
    SupportedLanguagesResponse,
    TaskGenerationRequest,
    TaskGenerationResponse,
    VapiMessage,
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


async def _openrouter_chat(messages: list[dict], max_tokens: int = 800) -> str:
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

    content = await _openrouter_chat(
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
    content = await _openrouter_chat(
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
        raise HTTPException(status_code=500, detail="Internal processing error")

    knowledge = _search_knowledge(query_vec, language=filter_language, top_k=req.top_k)
    memory = _search_memory(req.user_id, query_vec)
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
    """Use OpenRouter GPT-4o to extract health tasks from a conversation summary."""
    import json as _json

    client = get_http_client()
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    if not openrouter_key:
        raise HTTPException(status_code=503, detail="Task generation not configured")

    prompt = f"""Extract 2-5 actionable health tasks from this patient conversation summary. 
Return ONLY a JSON array. Each item: {{"task": "...", "priority": "high|medium|low", "due_suggestion": "this week|today|within 1 month|daily|as needed", "category": "medication|checkup|diet|exercise|appointment|scheme"}}

Summary: {req.summary}

JSON array:"""

    try:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 500,
            },
            headers={
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json",
            },
            timeout=20.0,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()

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

    try:
        get_qdrant().upsert(
            collection_name=MEMORY_COLLECTION,
            points=[
                models.PointStruct(
                    id=report_id,
                    vector=passage_vec,
                    payload=payload,
                )
            ],
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
        llm_summary = await _openrouter_chat(
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


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
