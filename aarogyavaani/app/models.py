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
    references: list = []
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


class MedicalReportChunkEntry(BaseModel):
    chunk_id: str
    report_id: str
    report_name: str = ""
    chunk_index: int = 0
    title: str = ""
    text: str = ""
    medicines: list[str] = []
    conditions: list[str] = []
    language: str = "auto"
    saved_at: str = ""
    source_label: str = ""


class MedicalReportChunksResponse(BaseModel):
    user_id: str
    report_id: str
    chunks: list[MedicalReportChunkEntry]
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


# ---------------------------------------------------------------------------
# Agentic AI Models
# ---------------------------------------------------------------------------


class AgentChatRequest(BaseModel):
    """Request to the agentic chat endpoint."""
    user_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: str = ""
    language: str = "auto"
    agent_role: str = Field(
        default="auto",
        description="Force a specific agent role (router, triage, knowledge, medication, report, followup) or 'auto' for automatic routing",
    )


class AgentToolCallTrace(BaseModel):
    """Record of a single tool call in the agent trace."""
    tool_name: str
    arguments: dict = {}
    result_summary: str = ""
    error: str = ""
    duration_ms: int = 0


class AgentStepTrace(BaseModel):
    """A single step in the agent's reasoning chain."""
    step_number: int
    agent_role: str
    action: str  # "thinking", "tool_call", "handoff", "response"
    content: str = ""
    tool_calls: list[AgentToolCallTrace] = []
    timestamp: str = ""


class AgentChatResponse(BaseModel):
    """Response from the agentic chat endpoint."""
    response: str
    conversation_id: str = ""
    agents_used: list[str] = []
    tools_used: list[str] = []
    total_steps: int = 0
    steps: list[AgentStepTrace] = []
    status: str = "ok"


class ProactiveAlert(BaseModel):
    """A single proactive health alert."""
    id: str = ""
    message: str
    priority: str = Field(default="medium", pattern=r"^(high|medium|low)$")
    category: str = "important"
    icon: str = "alert-circle"


class ProactiveCheckResponse(BaseModel):
    """Response from the proactive health check endpoint."""
    user_id: str
    alerts: list[ProactiveAlert] = []
    analysis: str = ""
    agents_used: list[str] = []
    tools_used: list[str] = []
    total_steps: int = 0
    generated_at: str = ""
    status: str = "ok"


class WorkflowRequest(BaseModel):
    """Request to run an autonomous health workflow."""
    user_id: str = Field(..., min_length=1, max_length=64)
    workflow_type: str = Field(
        ...,
        description="Type of workflow: daily_check, post_call_analysis, report_analysis, comprehensive_review",
    )
    params: dict = {}


class WorkflowResponse(BaseModel):
    """Response from an autonomous health workflow."""
    user_id: str
    workflow_type: str
    result: str = ""
    agents_used: list[str] = []
    tools_used: list[str] = []
    total_steps: int = 0
    steps: list[AgentStepTrace] = []
    completed_at: str = ""
    status: str = "ok"


# ---------------------------------------------------------------------------
# Government Scheme Matcher Models
# ---------------------------------------------------------------------------


class SchemeMatchRequest(BaseModel):
    """Request for government health scheme eligibility matching."""
    user_id: str = Field(..., min_length=1, max_length=64)
    state: str = Field(default="", description="Indian state name for state-specific schemes")
    annual_income: int = Field(default=0, description="Approximate annual household income in INR")
    family_size: int = Field(default=1, ge=1, le=20)
    age: int = Field(default=0, ge=0, le=120)
    gender: str = Field(default="", description="male, female, or other")
    conditions: list[str] = Field(default_factory=list, description="Known health conditions")
    is_pregnant: bool = False
    is_disabled: bool = False
    has_bpl_card: bool = False
    language: str = "auto"


class SchemeMatch(BaseModel):
    """A single government health scheme match."""
    scheme_name: str
    scheme_name_hindi: str = ""
    eligibility_score: float = Field(default=0.0, ge=0.0, le=1.0)
    category: str = Field(default="central", description="central, state, or district")
    coverage: str = ""
    benefits: list[str] = []
    how_to_apply: str = ""
    documents_needed: list[str] = []
    helpline: str = ""
    website: str = ""
    why_eligible: str = ""


class SchemeMatchResponse(BaseModel):
    """Response with matched government health schemes."""
    user_id: str
    matched_schemes: list[SchemeMatch] = []
    total_potential_coverage: str = ""
    patient_summary: str = ""
    gemini_analysis: str = ""
    generated_at: str = ""
    status: str = "ok"


# ---------------------------------------------------------------------------
# Smart Scan Models
# ---------------------------------------------------------------------------


class SmartScanRequest(BaseModel):
    """Request for Gemini-powered smart medical scan."""
    user_id: str = Field(..., min_length=1, max_length=64)
    file_name: str = Field(..., min_length=1, max_length=240)
    mime_type: str = Field(..., min_length=1, max_length=120)
    content_base64: str = Field(..., min_length=8)
    scan_type: str = Field(
        default="auto",
        description="auto, prescription, medicine_label, blister_pack, lab_report, government_document, handwritten_note",
    )
    language: str = "auto"


class SmartScanResponse(BaseModel):
    """Response from Gemini smart scan with structured extraction."""
    scan_id: str = ""
    scan_type_detected: str = ""
    extracted_text: str = ""
    summary: str = ""
    medicines: list[str] = []
    conditions: list[str] = []
    dosage_instructions: list[dict] = []
    doctor_name: str = ""
    hospital_name: str = ""
    date_on_document: str = ""
    scheme_references: list[str] = []
    warnings: list[str] = []
    confidence: float = 0.0
    language_detected: str = "auto"
    reasoning: str = ""
    gemini_model_used: str = ""
    status: str = "ok"


# ---------------------------------------------------------------------------
# Family Health Graph Models
# ---------------------------------------------------------------------------


class FamilyContextQuery(BaseModel):
    """Request that may refer to a family member."""
    user_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=5000)
    language: str = "auto"


class FamilyContextResult(BaseModel):
    """Gemini-detected family context from a message."""
    is_family_query: bool = False
    detected_member: str = ""
    detected_relation: str = ""
    confidence: float = 0.0
    rephrased_query: str = ""
    reasoning: str = ""


# ---------------------------------------------------------------------------
# Proactive Intelligence Models
# ---------------------------------------------------------------------------


class SeasonalRisk(BaseModel):
    """A seasonal health risk alert."""
    disease: str
    risk_level: str = "medium"
    season: str = ""
    region: str = ""
    prevention_tips: list[str] = []
    warning_signs: list[str] = []


class ProactiveIntelligenceResponse(BaseModel):
    """Enhanced proactive check with seasonal and medication intelligence."""
    user_id: str
    alerts: list[ProactiveAlert] = []
    seasonal_risks: list[SeasonalRisk] = []
    medication_gaps: list[dict] = []
    overdue_tests: list[str] = []
    wellness_score: int = Field(default=0, ge=0, le=100)
    wellness_breakdown: dict = {}
    next_actions: list[str] = []
    analysis: str = ""
    generated_at: str = ""
    status: str = "ok"
