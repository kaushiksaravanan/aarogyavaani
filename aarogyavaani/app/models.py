"""
AarogyaVaani Pydantic models for request/response validation.
"""

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class HealthQueryRequest(BaseModel):
    user_id: str
    query: str
    language: str = "auto"
    top_k: int = Field(default=5, ge=1, le=20)


class HealthQueryResponse(BaseModel):
    context: str
    knowledge_results: list[dict] = []
    memory_results: list[dict] = []
    status: str = "ok"


class ConversationSummary(BaseModel):
    user_id: str
    summary: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    language: str = "hi"
    conditions: list[str] = []


class VapiMessage(BaseModel):
    """Generic wrapper for Vapi webhook payloads.
    Vapi sends a JSON body with a top-level `message` object that contains
    a `type` field indicating the message kind."""

    message: dict


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
