"""
AarogyaVaani Pydantic models for request/response validation.
"""

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class HealthQueryRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    query: str = Field(..., min_length=1, max_length=5000)
    language: str = "auto"
    top_k: int = Field(default=3, ge=1, le=20)


class HealthQueryResponse(BaseModel):
    context: str
    knowledge_results: list[dict] = []
    memory_results: list[dict] = []
    references: list[dict] = []
    reasoning_summary: str = ""
    detected_language: str = "auto"
    status: str = "ok"


class ConversationSummary(BaseModel):
    user_id: str
    summary: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    language: str = "hi"
    conditions: list[str] = []


class ReferenceItem(BaseModel):
    id: str = ""
    type: str = ""
    title: str = ""
    source: str = ""
    excerpt: str = ""
    language: str = "auto"
    score: float = 0.0
    rationale: str = ""
    metadata: dict = {}


class VapiMessage(BaseModel):
    """Generic wrapper for Vapi webhook payloads.
    Vapi sends a JSON body with a top-level `message` object that contains
    a `type` field indicating the message kind."""

    message: dict


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class HealthTask(BaseModel):
    task: str
    priority: str = Field(default="medium", pattern=r"^(high|medium|low)$")
    due_suggestion: str = ""
    category: str = ""


class TaskGenerationRequest(BaseModel):
    summary: str = Field(..., min_length=5, max_length=5000)
    user_id: str = Field(default="anonymous", min_length=1, max_length=64)


class TaskGenerationResponse(BaseModel):
    tasks: list[HealthTask]
    status: str = "ok"


class CallHistoryEntry(BaseModel):
    summary: str
    timestamp: str
    conditions: list[str] = []
    language: str = "hi"
    score: float = 0.0


class CallHistoryResponse(BaseModel):
    user_id: str
    calls: list[CallHistoryEntry]
    total: int
    status: str = "ok"


class HealthReportResponse(BaseModel):
    user_id: str
    total_calls: int
    conditions_tracked: list[str]
    first_call: str = ""
    last_call: str = ""
    recent_summaries: list[str]
    recommendations: list[str]
    report_generated_at: str
    status: str = "ok"


class SupportedLanguageItem(BaseModel):
    code: str
    label: str
    native_label: str
    group: str = "Universal"
    featured: bool = False
    voice_ready: bool = False


class SupportedLanguagesResponse(BaseModel):
    total: int
    languages: list[SupportedLanguageItem]
    featured: list[SupportedLanguageItem] = []
    status: str = "ok"


class MedicalReportEntry(BaseModel):
    report_id: str
    report_name: str
    report_kind: str = "medical-report"
    summary: str = ""
    extracted_text_excerpt: str = ""
    medicines: list[str] = []
    conditions: list[str] = []
    language: str = "auto"
    saved_at: str = ""
    source_label: str = ""


class MedicalReportListResponse(BaseModel):
    user_id: str
    reports: list[MedicalReportEntry]
    total: int
    status: str = "ok"


class MedicalReportUploadResponse(BaseModel):
    report_id: str
    summary: str = ""
    medicines: list[str] = []
    conditions: list[str] = []
    language: str = "auto"
    reasoning: str = ""
    saved_at: str = ""
    status: str = "ok"


class MedicalReportUploadRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    file_name: str = Field(..., min_length=1, max_length=240)
    mime_type: str = Field(..., min_length=1, max_length=120)
    content_base64: str = Field(..., min_length=8)
    language: str = "auto"


class DoctorBriefRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    language: str = "en"


class DoctorBriefResponse(BaseModel):
    user_id: str
    summary: str
    key_conditions: list[str] = []
    medications: list[str] = []
    recent_concerns: list[str] = []
    uploaded_reports: list[MedicalReportEntry] = []
    conversation_count: int = 0
    generated_at: str
    status: str = "ok"
