"""
AarogyaVaani — Voice AI agent backend for healthcare accessibility in India.
FastAPI server exposing tool endpoints for Vapi + Qdrant RAG pipeline.
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from qdrant_client import QdrantClient, models

from app.config import (
    APP_SERVICE_NAME,
    APP_VERSION,
    HF_API_TOKEN,
    HF_API_URL,
    KNOWLEDGE_COLLECTION,
    MEMORY_COLLECTION,
    QDRANT_API_KEY,
    QDRANT_URL,
    VAPI_SECRET,
    SERVER_URL,
)
from app.models import (
    ConversationSummary,
    HealthQueryRequest,
    HealthQueryResponse,
    HealthResponse,
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
# Global singletons — initialised once at startup
# ---------------------------------------------------------------------------
http_client: Optional[httpx.AsyncClient] = None
qdrant: Optional[QdrantClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, qdrant

    logger.info("Initialising httpx client for HuggingFace Inference API ...")
    http_client = httpx.AsyncClient(timeout=30.0)
    logger.info("httpx client ready (HF API URL: %s).", HF_API_URL)

    logger.info("Connecting to Qdrant at %s ...", QDRANT_URL)
    qdrant = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY if QDRANT_API_KEY else None,
        timeout=30,
    )
    logger.info("Qdrant client ready.")

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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def verify_vapi_secret(request: Request, call_next):
    """Verify x-vapi-secret header on webhook endpoints."""
    if request.url.path.startswith("/vapi/") and VAPI_SECRET:
        secret = request.headers.get("x-vapi-secret", "")
        if secret != VAPI_SECRET:
            logger.warning("Unauthorized webhook call from %s", request.client.host)
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return await call_next(request)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _embed_text(text: str) -> list[float]:
    """Call HuggingFace Inference API to get an embedding vector."""
    headers = {"Content-Type": "application/json"}
    if HF_API_TOKEN:
        headers["Authorization"] = f"Bearer {HF_API_TOKEN}"

    resp = await http_client.post(
        HF_API_URL,
        json={"inputs": text, "options": {"wait_for_model": True}},
        headers=headers,
    )
    resp.raise_for_status()
    vector = resp.json()

    # HF returns [[...]] for a single input
    if isinstance(vector[0], list):
        vector = vector[0]

    # L2-normalise
    norm = sum(x * x for x in vector) ** 0.5
    if norm > 0:
        vector = [x / norm for x in vector]

    return vector


async def _embed_query(text: str) -> list[float]:
    """Embed a search query. E5 models expect 'query: ' prefix for queries."""
    return await _embed_text(f"query: {text}")


async def _embed_passage(text: str) -> list[float]:
    """Embed a document/passage. E5 models expect 'passage: ' prefix."""
    return await _embed_text(f"passage: {text}")


def _search_knowledge(
    query_vec: list[float],
    language: str = "auto",
    top_k: int = 5,
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

    results = qdrant.query_points(
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
        results = qdrant.query_points(
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
            summary = payload.get("summary", "")
            ts = payload.get("timestamp", "")
            parts.append(f"[{i}] ({ts}) {summary}")

    if not parts:
        return "No relevant information found."

    return "\n".join(parts)


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
    """
    logger.info(
        "query_health_knowledge | user=%s lang=%s query=%s",
        req.user_id,
        req.language,
        req.query[:80],
    )

    try:
        query_vec = await _embed_query(req.query)
    except Exception as exc:
        logger.error("Embedding failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Embedding error: {exc}")

    knowledge = _search_knowledge(query_vec, language=req.language, top_k=req.top_k)
    memory = _search_memory(req.user_id, query_vec)
    context = _format_context(knowledge, memory)

    return HealthQueryResponse(
        context=context,
        knowledge_results=knowledge,
        memory_results=memory,
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
        logger.error("Embedding failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Embedding error: {exc}")

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
        qdrant.upsert(
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
        logger.error("Qdrant upsert failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Qdrant upsert error: {exc}")

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
            return {
                "results": [
                    {
                        "toolCallId": message.get("functionCall", {}).get("id", ""),
                        "result": resp.context,
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


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
