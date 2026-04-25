"""
AarogyaVaani Multi-Agent Orchestration Engine.

Implements a tool-using agentic system with specialized health agents that can:
- Autonomously plan and execute multi-step health workflows
- Route queries to the right specialist agent
- Chain tool calls (RAG, reports, medications, emergency assessment)
- Maintain reasoning traces for transparency
- Collaborate via handoff when a query spans multiple domains
"""

import json
import logging
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

import httpx

from app.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger("aarogyavaani.agents")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"


# ---------------------------------------------------------------------------
# Agent tool definitions
# ---------------------------------------------------------------------------

class ToolName(str, Enum):
    SEARCH_KNOWLEDGE = "search_knowledge"
    SEARCH_MEMORY = "search_memory"
    GET_MEDICATIONS = "get_medications"
    GET_REPORTS = "get_reports"
    ASSESS_EMERGENCY = "assess_emergency"
    GENERATE_TASKS = "generate_tasks"
    GET_DOCTOR_BRIEF = "get_doctor_brief"
    COMPARE_REPORTS = "compare_reports"
    GET_HEALTH_REPORT = "get_health_report"
    GET_FAMILY_MEMBERS = "get_family_members"
    PROACTIVE_HEALTH_CHECK = "proactive_health_check"
    MATCH_SCHEMES = "match_schemes"
    DETECT_FAMILY_CONTEXT = "detect_family_context"
    SMART_SCAN_INFO = "smart_scan_info"


TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": ToolName.SEARCH_KNOWLEDGE,
            "description": "Search the verified health knowledge base for medical information, government schemes, symptoms, treatments, and preventive care advice.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The health topic or question to search for"},
                    "language": {"type": "string", "description": "Language code (hi, en, kn, etc.) or 'auto'", "default": "auto"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.SEARCH_MEMORY,
            "description": "Search the patient's personal health memory including past conversations, conditions discussed, and health history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "What to search for in patient history"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.GET_MEDICATIONS,
            "description": "Retrieve the patient's medication schedule extracted from their uploaded reports and conversations.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.GET_REPORTS,
            "description": "List the patient's uploaded medical reports with summaries, medicines, and conditions extracted from each.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.ASSESS_EMERGENCY,
            "description": "Perform a context-aware emergency/severity assessment for a symptom, checking against patient history to determine if it's recurring or new.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symptom_keyword": {"type": "string", "description": "The symptom or emergency concern"},
                    "transcript_text": {"type": "string", "description": "Additional context from the conversation"},
                },
                "required": ["symptom_keyword"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.GENERATE_TASKS,
            "description": "Generate actionable health follow-up tasks based on conversation context or health data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "context_summary": {"type": "string", "description": "Summary of health context to generate tasks from"},
                },
                "required": ["context_summary"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.GET_DOCTOR_BRIEF,
            "description": "Generate a comprehensive clinical summary for a doctor, aggregating all patient data.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.COMPARE_REPORTS,
            "description": "Compare two medical reports to identify changes, improvements, or deteriorations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "report_id_1": {"type": "string", "description": "ID of the older report"},
                    "report_id_2": {"type": "string", "description": "ID of the newer report"},
                },
                "required": ["report_id_1", "report_id_2"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.GET_HEALTH_REPORT,
            "description": "Generate an overall health report aggregating conditions, call history, and recommendations.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.GET_FAMILY_MEMBERS,
            "description": "List the patient's registered family members and their health conditions.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.PROACTIVE_HEALTH_CHECK,
            "description": "Run a proactive health analysis to identify missed follow-ups, medication gaps, overdue tests, and health trends from patient history.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.MATCH_SCHEMES,
            "description": "Match the patient to eligible Indian government health schemes (Ayushman Bharat, PMJAY, JSY, NPCDCS, etc.) based on their conditions, demographics, and income level.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {"type": "string", "description": "Indian state name (e.g., Karnataka, Bihar)"},
                    "conditions": {"type": "array", "items": {"type": "string"}, "description": "Patient's health conditions"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.DETECT_FAMILY_CONTEXT,
            "description": "Detect if the user is asking about a family member (e.g., 'my mother's report', 'my child has fever') and identify which member they mean. Used when the message might refer to a family member's health.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "The user's message to check for family context"},
                },
                "required": ["message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": ToolName.SMART_SCAN_INFO,
            "description": "Get information about the smart scan feature — what types of medical documents can be scanned (prescriptions, medicine labels, blister packs, lab reports, government scheme documents, handwritten notes).",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


# ---------------------------------------------------------------------------
# Agent types (specialized agents)
# ---------------------------------------------------------------------------

class AgentRole(str, Enum):
    ROUTER = "router"
    TRIAGE = "triage"
    KNOWLEDGE = "knowledge"
    MEDICATION = "medication"
    REPORT = "report"
    FOLLOWUP = "followup"
    PROACTIVE = "proactive"


AGENT_SYSTEM_PROMPTS = {
    AgentRole.ROUTER: (
        "You are the AarogyaVaani Agent Router. Your job is to understand the patient's query "
        "and decide which specialist agent(s) to involve, or handle simple queries directly.\n\n"
        "You have access to all tools. Use them proactively to gather information before answering.\n"
        "For complex queries, chain multiple tool calls to build a comprehensive answer.\n\n"
        "IMPORTANT RULES:\n"
        "- Always search the knowledge base and patient memory first before answering health questions\n"
        "- If a symptom sounds urgent, use assess_emergency before anything else\n"
        "- For medication questions, use get_medications\n"
        "- For report-related questions, use get_reports\n"
        "- Be warm, empathetic, and use simple language suitable for rural Indian patients\n"
        "- Never diagnose — only inform, guide, and recommend seeing a doctor when appropriate\n"
        "- When you have enough information, provide a clear, actionable response\n"
        "- Always cite your sources (knowledge base, patient history, reports)\n"
        "- Respond in the same language the patient uses"
    ),
    AgentRole.TRIAGE: (
        "You are the AarogyaVaani Triage Agent. You specialize in assessing symptom severity, "
        "identifying emergencies, and recommending appropriate action levels.\n\n"
        "WORKFLOW:\n"
        "1. Use assess_emergency to check severity against patient history\n"
        "2. Use search_memory to find relevant past events\n"
        "3. Use search_knowledge for medical guidance\n"
        "4. Provide clear severity assessment and recommended action\n\n"
        "Be calm and reassuring. Never cause panic. Always recommend professional help for serious symptoms."
    ),
    AgentRole.KNOWLEDGE: (
        "You are the AarogyaVaani Knowledge Agent. You specialize in finding and explaining "
        "health information from the verified knowledge base.\n\n"
        "WORKFLOW:\n"
        "1. Use search_knowledge to find relevant health information\n"
        "2. Use search_memory to check patient context\n"
        "3. Explain findings in simple, accessible language\n"
        "4. Suggest follow-up actions if appropriate\n\n"
        "Always cite the knowledge base sources. Use simple language. Explain medical terms."
    ),
    AgentRole.MEDICATION: (
        "You are the AarogyaVaani Medication Agent. You specialize in medication schedules, "
        "drug interactions, and prescription management.\n\n"
        "WORKFLOW:\n"
        "1. Use get_medications to retrieve current medication schedule\n"
        "2. Use get_reports to check prescription details\n"
        "3. Use search_knowledge for drug information\n"
        "4. Provide clear medication guidance\n\n"
        "Never change prescriptions. Always recommend consulting the doctor for dosage changes."
    ),
    AgentRole.REPORT: (
        "You are the AarogyaVaani Report Agent. You specialize in analyzing medical reports, "
        "comparing results over time, and extracting insights.\n\n"
        "WORKFLOW:\n"
        "1. Use get_reports to list available reports\n"
        "2. Use compare_reports to show changes if multiple reports exist\n"
        "3. Use search_knowledge for context on test results\n"
        "4. Explain findings in simple language\n\n"
        "Help patients understand their reports. Highlight important changes."
    ),
    AgentRole.FOLLOWUP: (
        "You are the AarogyaVaani Follow-up Agent. You specialize in creating actionable "
        "health tasks, tracking follow-ups, and ensuring care continuity.\n\n"
        "WORKFLOW:\n"
        "1. Use search_memory to understand patient history\n"
        "2. Use get_medications for medication adherence context\n"
        "3. Use generate_tasks to create actionable follow-ups\n"
        "4. Prioritize tasks by urgency and importance\n\n"
        "Create practical, achievable tasks. Consider the patient's context and capabilities."
    ),
    AgentRole.PROACTIVE: (
        "You are the AarogyaVaani Proactive Health Agent. You analyze patient data to identify "
        "health risks, missed follow-ups, and opportunities for preventive care.\n\n"
        "WORKFLOW:\n"
        "1. Use proactive_health_check for comprehensive analysis\n"
        "2. Use get_medications to check medication adherence\n"
        "3. Use get_reports to check for overdue tests\n"
        "4. Use search_knowledge for preventive care recommendations\n"
        "5. Generate prioritized health alerts\n\n"
        "Be proactive but not alarming. Focus on actionable insights."
    ),
}


# Map agent roles to the tools they can use
AGENT_TOOL_ACCESS = {
    AgentRole.ROUTER: list(ToolName),  # Router has access to all tools
    AgentRole.TRIAGE: [ToolName.ASSESS_EMERGENCY, ToolName.SEARCH_MEMORY, ToolName.SEARCH_KNOWLEDGE, ToolName.DETECT_FAMILY_CONTEXT],
    AgentRole.KNOWLEDGE: [ToolName.SEARCH_KNOWLEDGE, ToolName.SEARCH_MEMORY, ToolName.MATCH_SCHEMES],
    AgentRole.MEDICATION: [ToolName.GET_MEDICATIONS, ToolName.GET_REPORTS, ToolName.SEARCH_KNOWLEDGE],
    AgentRole.REPORT: [ToolName.GET_REPORTS, ToolName.COMPARE_REPORTS, ToolName.SEARCH_KNOWLEDGE, ToolName.SMART_SCAN_INFO],
    AgentRole.FOLLOWUP: [ToolName.SEARCH_MEMORY, ToolName.GET_MEDICATIONS, ToolName.GENERATE_TASKS, ToolName.MATCH_SCHEMES],
    AgentRole.PROACTIVE: [ToolName.PROACTIVE_HEALTH_CHECK, ToolName.GET_MEDICATIONS, ToolName.GET_REPORTS, ToolName.SEARCH_KNOWLEDGE, ToolName.SEARCH_MEMORY, ToolName.GET_FAMILY_MEMBERS, ToolName.MATCH_SCHEMES],
}


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class ToolCall:
    """Record of a tool invocation during agent execution."""
    tool_name: str
    arguments: dict
    result: Any = None
    error: Optional[str] = None
    duration_ms: int = 0

    def to_dict(self) -> dict:
        return {
            "tool_name": self.tool_name,
            "arguments": self.arguments,
            "result": self.result if not isinstance(self.result, str) or len(self.result) <= 500 else self.result[:500] + "...",
            "error": self.error,
            "duration_ms": self.duration_ms,
        }


@dataclass
class AgentStep:
    """A single step in the agent's reasoning chain."""
    step_number: int
    agent_role: str
    action: str  # "thinking", "tool_call", "handoff", "response"
    content: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return {
            "step_number": self.step_number,
            "agent_role": self.agent_role,
            "action": self.action,
            "content": self.content[:800] if self.content else "",
            "tool_calls": [tc.to_dict() for tc in self.tool_calls],
            "timestamp": self.timestamp,
        }


@dataclass
class AgentResult:
    """Final result from agent execution."""
    response: str
    steps: list[AgentStep] = field(default_factory=list)
    agents_used: list[str] = field(default_factory=list)
    tools_used: list[str] = field(default_factory=list)
    total_steps: int = 0
    conversation_id: str = field(default_factory=lambda: str(uuid4()))

    def to_dict(self) -> dict:
        return {
            "response": self.response,
            "steps": [s.to_dict() for s in self.steps],
            "agents_used": self.agents_used,
            "tools_used": list(set(self.tools_used)),
            "total_steps": self.total_steps,
            "conversation_id": self.conversation_id,
        }


# ---------------------------------------------------------------------------
# Tool executor — bridges agent tool calls to existing backend functions
# ---------------------------------------------------------------------------

class ToolExecutor:
    """
    Executes agent tool calls by delegating to the existing AarogyaVaani backend.
    Each tool maps to existing endpoint logic, reusing all the battle-tested code.
    """

    def __init__(self, user_id: str, http_client: httpx.AsyncClient, server_url: str):
        self.user_id = user_id
        self.client = http_client
        self.base_url = server_url.rstrip("/")

    async def execute(self, tool_name: str, arguments: dict) -> Any:
        """Execute a tool call and return the result."""
        handler = getattr(self, f"_exec_{tool_name}", None)
        if handler is None:
            return {"error": f"Unknown tool: {tool_name}"}
        try:
            return await handler(arguments)
        except Exception as exc:
            logger.error("Tool %s failed: %s", tool_name, exc)
            return {"error": str(exc)}

    async def _exec_search_knowledge(self, args: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/query_health_knowledge",
            json={
                "user_id": self.user_id,
                "query": args.get("query", ""),
                "language": args.get("language", "auto"),
            },
            timeout=25.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "context": data.get("context", ""),
            "references": data.get("references", [])[:5],
            "reasoning_summary": data.get("reasoning_summary", ""),
        }

    async def _exec_search_memory(self, args: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/query_health_knowledge",
            json={
                "user_id": self.user_id,
                "query": args.get("query", ""),
                "language": "auto",
            },
            timeout=25.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "memory_results": data.get("memory_results", [])[:5],
            "reasoning_summary": data.get("reasoning_summary", ""),
        }

    async def _exec_get_medications(self, args: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/medications/{self.user_id}",
            timeout=25.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_get_reports(self, args: dict) -> dict:
        resp = await self.client.get(
            f"{self.base_url}/medical_reports/{self.user_id}",
            timeout=20.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_assess_emergency(self, args: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/assess_emergency",
            json={
                "user_id": self.user_id,
                "symptom_keyword": args.get("symptom_keyword", ""),
                "transcript_text": args.get("transcript_text", ""),
            },
            timeout=25.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_generate_tasks(self, args: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/generate_tasks",
            json={
                "summary": args.get("context_summary", ""),
                "user_id": self.user_id,
            },
            timeout=20.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_get_doctor_brief(self, args: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/doctor_brief",
            json={"user_id": self.user_id, "language": "en"},
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_compare_reports(self, args: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/reports/compare",
            json={
                "user_id": self.user_id,
                "report_id_1": args.get("report_id_1", ""),
                "report_id_2": args.get("report_id_2", ""),
            },
            timeout=25.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_get_health_report(self, args: dict) -> dict:
        resp = await self.client.get(
            f"{self.base_url}/health_report/{self.user_id}",
            timeout=20.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_get_family_members(self, args: dict) -> dict:
        resp = await self.client.get(
            f"{self.base_url}/family_members/{self.user_id}",
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _exec_proactive_health_check(self, args: dict) -> dict:
        """
        Proactive check: aggregates medications, reports, memory, and family data
        to produce a comprehensive health status analysis.
        """
        results = {}
        try:
            med_resp = await self.client.post(
                f"{self.base_url}/medications/{self.user_id}", timeout=20.0
            )
            results["medications"] = med_resp.json() if med_resp.status_code == 200 else {}
        except Exception:
            results["medications"] = {}

        try:
            rep_resp = await self.client.get(
                f"{self.base_url}/medical_reports/{self.user_id}", timeout=20.0
            )
            results["reports"] = rep_resp.json() if rep_resp.status_code == 200 else {}
        except Exception:
            results["reports"] = {}

        try:
            health_resp = await self.client.get(
                f"{self.base_url}/health_report/{self.user_id}", timeout=20.0
            )
            results["health_report"] = health_resp.json() if health_resp.status_code == 200 else {}
        except Exception:
            results["health_report"] = {}

        try:
            fam_resp = await self.client.get(
                f"{self.base_url}/family_members/{self.user_id}", timeout=15.0
            )
            results["family"] = fam_resp.json() if fam_resp.status_code == 200 else {}
        except Exception:
            results["family"] = {}

        return results


# ---------------------------------------------------------------------------
# Agent Engine — the core agentic loop
# ---------------------------------------------------------------------------

class AgentEngine:
    """
    Multi-agent orchestration engine with autonomous tool-calling loop.

    The engine:
    1. Receives a user message
    2. Sends it to the LLM with available tools
    3. If the LLM responds with tool calls, executes them and feeds results back
    4. Repeats until the LLM produces a final text response
    5. Tracks all steps for transparency
    """

    MAX_ITERATIONS = 8  # Safety limit on tool-calling loops

    def __init__(
        self,
        user_id: str,
        tool_executor: ToolExecutor,
        agent_role: AgentRole = AgentRole.ROUTER,
        conversation_history: list[dict] | None = None,
    ):
        self.user_id = user_id
        self.tool_executor = tool_executor
        self.agent_role = agent_role
        self.conversation_history = conversation_history or []
        self.steps: list[AgentStep] = []
        self.tools_used: list[str] = []
        self.step_counter = 0

    def _get_tools_for_role(self) -> list[dict]:
        """Get the tool schemas available to this agent role."""
        allowed_tools = AGENT_TOOL_ACCESS.get(self.agent_role, [])
        return [
            schema for schema in TOOL_SCHEMAS
            if schema["function"]["name"] in allowed_tools
        ]

    def _add_step(self, action: str, content: str = "", tool_calls: list[ToolCall] | None = None) -> AgentStep:
        self.step_counter += 1
        step = AgentStep(
            step_number=self.step_counter,
            agent_role=self.agent_role.value,
            action=action,
            content=content,
            tool_calls=tool_calls or [],
        )
        self.steps.append(step)
        return step

    async def _llm_call(self, messages: list[dict], tools: list[dict]) -> dict:
        """
        Make an LLM call — Gemini API as primary, OpenRouter as fallback.
        Returns response in OpenAI-compatible format for consistent downstream handling.
        """
        # Try Gemini first
        if GEMINI_API_KEY:
            try:
                return await self._gemini_call(messages, tools)
            except Exception as exc:
                logger.warning("Gemini call failed, falling back to OpenRouter: %s", exc)

        # Fallback to OpenRouter
        return await self._openrouter_call(messages, tools)

    async def _gemini_call(self, messages: list[dict], tools: list[dict]) -> dict:
        """Call Google Gemini API with tool support, return OpenAI-compatible format."""
        # Convert messages to Gemini format
        gemini_contents = []
        system_instruction = None

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                system_instruction = content
                continue

            if role == "assistant":
                # Check if this message has tool_calls (from previous iteration)
                tool_calls = msg.get("tool_calls", [])
                if tool_calls:
                    parts = []
                    if content:
                        parts.append({"text": content})
                    for tc in tool_calls:
                        fn = tc.get("function", {})
                        try:
                            args = json.loads(fn.get("arguments", "{}"))
                        except json.JSONDecodeError:
                            args = {}
                        parts.append({
                            "functionCall": {
                                "name": fn.get("name", ""),
                                "args": args,
                            }
                        })
                    gemini_contents.append({"role": "model", "parts": parts})
                else:
                    gemini_contents.append({
                        "role": "model",
                        "parts": [{"text": content or ""}],
                    })

            elif role == "tool":
                # Tool result — Gemini expects functionResponse
                tool_call_id = msg.get("tool_call_id", "")
                # Find the function name from previous assistant message
                fn_name = tool_call_id  # fallback
                for prev_msg in reversed(messages):
                    if prev_msg.get("role") == "assistant":
                        for tc in prev_msg.get("tool_calls", []):
                            if tc.get("id", "") == tool_call_id:
                                fn_name = tc.get("function", {}).get("name", tool_call_id)
                                break
                        break

                try:
                    result_data = json.loads(content) if content else {}
                except (json.JSONDecodeError, TypeError):
                    result_data = {"result": content}

                gemini_contents.append({
                    "role": "function",
                    "parts": [{
                        "functionResponse": {
                            "name": fn_name,
                            "response": result_data,
                        }
                    }],
                })

            else:  # user
                if isinstance(content, list):
                    # Multimodal content (images, etc.)
                    parts = []
                    for item in content:
                        if item.get("type") == "text":
                            parts.append({"text": item["text"]})
                        elif item.get("type") == "image_url":
                            url = item["image_url"]["url"]
                            if url.startswith("data:"):
                                # Parse data URI
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

        # Convert OpenAI tool schemas to Gemini function declarations
        gemini_tools = []
        if tools:
            function_declarations = []
            for tool in tools:
                fn = tool.get("function", {})
                params = fn.get("parameters", {})
                # Clean parameters for Gemini (remove unsupported fields)
                clean_params = {
                    "type": params.get("type", "object"),
                    "properties": params.get("properties", {}),
                }
                if params.get("required"):
                    clean_params["required"] = params["required"]

                function_declarations.append({
                    "name": fn.get("name", ""),
                    "description": fn.get("description", ""),
                    "parameters": clean_params,
                })
            gemini_tools = [{"functionDeclarations": function_declarations}]

        # Build request
        model = GEMINI_MODEL
        url = f"{GEMINI_API_URL}/models/{model}:generateContent?key={GEMINI_API_KEY}"

        payload = {
            "contents": gemini_contents,
            "generationConfig": {
                "temperature": 0.25,
                "maxOutputTokens": 1200,
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
        if gemini_tools:
            payload["tools"] = gemini_tools

        resp = await self.tool_executor.client.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=45.0,
        )
        resp.raise_for_status()
        data = resp.json()

        # Convert Gemini response to OpenAI-compatible format
        return self._gemini_to_openai_response(data)

    @staticmethod
    def _gemini_to_openai_response(data: dict) -> dict:
        """Convert Gemini API response to OpenAI-compatible format."""
        candidates = data.get("candidates", [])
        if not candidates:
            return {"choices": [{"message": {"content": ""}, "finish_reason": "stop"}]}

        candidate = candidates[0]
        content_parts = candidate.get("content", {}).get("parts", [])

        # Check for function calls
        tool_calls = []
        text_content = ""

        for part in content_parts:
            if "functionCall" in part:
                fc = part["functionCall"]
                tool_calls.append({
                    "id": f"call_{fc['name']}_{id(part)}",
                    "type": "function",
                    "function": {
                        "name": fc["name"],
                        "arguments": json.dumps(fc.get("args", {})),
                    },
                })
            elif "text" in part:
                text_content += part["text"]

        message = {"content": text_content}
        finish_reason = "stop"

        if tool_calls:
            message["tool_calls"] = tool_calls
            finish_reason = "tool_calls"

        return {
            "choices": [{
                "message": message,
                "finish_reason": finish_reason,
            }],
            "model": GEMINI_MODEL,
            "provider": "gemini",
        }

    async def _openrouter_call(self, messages: list[dict], tools: list[dict]) -> dict:
        """Fallback: Make an LLM call via OpenRouter."""
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            raise RuntimeError("No LLM API key configured (neither Gemini nor OpenRouter)")

        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": messages,
            "temperature": 0.25,
            "max_tokens": 1200,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        resp = await self.tool_executor.client.post(
            OPENROUTER_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=45.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def run(self, user_message: str) -> AgentResult:
        """
        Execute the agentic loop for a user message.
        Returns the final response with full reasoning trace.
        """
        logger.info("Agent run | role=%s user=%s msg=%s", self.agent_role.value, self.user_id, user_message[:80])

        # Build initial messages
        system_prompt = AGENT_SYSTEM_PROMPTS[self.agent_role]
        messages = [
            {"role": "system", "content": system_prompt},
            *self.conversation_history,
            {"role": "user", "content": user_message},
        ]

        tools = self._get_tools_for_role()
        agents_used = [self.agent_role.value]

        # Agentic loop
        for iteration in range(self.MAX_ITERATIONS):
            self._add_step("thinking", f"Iteration {iteration + 1}: Analyzing and deciding next action...")

            try:
                llm_response = await self._llm_call(messages, tools)
            except Exception as exc:
                logger.error("LLM call failed: %s", exc)
                self._add_step("response", f"I apologize, I'm having trouble processing your request right now. Error: {str(exc)}")
                return AgentResult(
                    response="I'm sorry, I'm experiencing technical difficulties. Please try again or start a voice call for immediate assistance.",
                    steps=self.steps,
                    agents_used=agents_used,
                    tools_used=self.tools_used,
                    total_steps=self.step_counter,
                )

            choice = llm_response.get("choices", [{}])[0]
            message = choice.get("message", {})
            finish_reason = choice.get("finish_reason", "")

            # Check if the LLM wants to call tools
            tool_calls_data = message.get("tool_calls", [])

            if tool_calls_data:
                # Execute tool calls
                messages.append(message)  # Add assistant message with tool calls

                executed_calls = []
                for tc in tool_calls_data:
                    fn = tc.get("function", {})
                    tool_name = fn.get("name", "")
                    try:
                        tool_args = json.loads(fn.get("arguments", "{}"))
                    except json.JSONDecodeError:
                        tool_args = {}

                    logger.info("Agent tool call: %s(%s)", tool_name, list(tool_args.keys()))
                    self.tools_used.append(tool_name)

                    import time
                    start = time.monotonic()
                    result = await self.tool_executor.execute(tool_name, tool_args)
                    duration = int((time.monotonic() - start) * 1000)

                    call_record = ToolCall(
                        tool_name=tool_name,
                        arguments=tool_args,
                        result=result,
                        duration_ms=duration,
                    )
                    executed_calls.append(call_record)

                    # Serialize result for LLM consumption
                    result_str = json.dumps(result, default=str, ensure_ascii=False)
                    if len(result_str) > 3000:
                        result_str = result_str[:3000] + "\n...[truncated]"

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.get("id", ""),
                        "content": result_str,
                    })

                self._add_step("tool_call", f"Executed {len(executed_calls)} tool(s)", executed_calls)
                continue  # Loop back to let LLM process tool results

            # No tool calls — LLM produced a final response
            content = message.get("content", "").strip()
            if content:
                self._add_step("response", content)
                return AgentResult(
                    response=content,
                    steps=self.steps,
                    agents_used=agents_used,
                    tools_used=self.tools_used,
                    total_steps=self.step_counter,
                )

            # Edge case: empty content with no tool calls
            self._add_step("response", "I couldn't generate a response. Please try rephrasing your question.")
            break

        # Exceeded max iterations
        return AgentResult(
            response="I've gathered a lot of information but need to provide my answer now. Based on what I found, please try asking a more specific question so I can help you better.",
            steps=self.steps,
            agents_used=agents_used,
            tools_used=self.tools_used,
            total_steps=self.step_counter,
        )


# ---------------------------------------------------------------------------
# Agent Router — selects the right specialist agent
# ---------------------------------------------------------------------------

ROUTING_KEYWORDS = {
    AgentRole.TRIAGE: [
        "emergency", "urgent", "pain", "chest pain", "breathing", "bleeding",
        "unconscious", "severe", "dard", "takleef", "khatarnak", "emergency",
        "saans", "beholding", "khoon", "behosh",
    ],
    AgentRole.MEDICATION: [
        "medicine", "medication", "tablet", "dose", "dawai", "goli",
        "prescription", "drug", "schedule", "timing",
    ],
    AgentRole.REPORT: [
        "report", "test", "lab", "blood test", "x-ray", "scan",
        "result", "compare", "jaanch", "report",
    ],
    AgentRole.FOLLOWUP: [
        "follow up", "task", "reminder", "next step", "follow-up",
        "what should I do", "kya karna", "aage",
    ],
}


def route_to_agent(user_message: str) -> AgentRole:
    """
    Determine which specialist agent should handle this message.
    Falls back to ROUTER (general-purpose) if no specialist matches.
    """
    message_lower = user_message.lower()

    # Score each specialist
    scores: dict[AgentRole, int] = {}
    for role, keywords in ROUTING_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in message_lower)
        if score > 0:
            scores[role] = score

    if scores:
        best_role = max(scores, key=scores.get)
        logger.info("Routed to %s (score=%d)", best_role.value, scores[best_role])
        return best_role

    # Default to router (general-purpose agent with all tools)
    return AgentRole.ROUTER


# ---------------------------------------------------------------------------
# Proactive Health Analyzer
# ---------------------------------------------------------------------------

async def run_proactive_analysis(
    user_id: str,
    tool_executor: ToolExecutor,
) -> dict:
    """
    Run a proactive health analysis for a user.
    Checks for missed follow-ups, medication gaps, overdue tests, and health trends.
    Returns structured alerts.
    """
    engine = AgentEngine(
        user_id=user_id,
        tool_executor=tool_executor,
        agent_role=AgentRole.PROACTIVE,
    )

    proactive_prompt = (
        "Run a comprehensive proactive health check for this patient. "
        "Use all available tools to gather their medications, reports, health history, and family data. "
        "Then analyze the data to identify:\n"
        "1. URGENT: Any missed medications, critical follow-ups, or worsening trends\n"
        "2. IMPORTANT: Overdue tests, upcoming appointments, medication interactions\n"
        "3. PREVENTIVE: Vaccination reminders, lifestyle suggestions, screening recommendations\n"
        "4. FAMILY: Health risks based on family history\n\n"
        "Return your analysis as a structured response with clear categories and actionable items."
    )

    result = await engine.run(proactive_prompt)

    # Parse structured alerts from the response
    alerts = _parse_proactive_alerts(result.response)

    return {
        "user_id": user_id,
        "alerts": alerts,
        "analysis": result.response,
        "agents_used": result.agents_used,
        "tools_used": result.tools_used,
        "total_steps": result.total_steps,
        "steps": [s.to_dict() for s in result.steps],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _parse_proactive_alerts(analysis_text: str) -> list[dict]:
    """Parse the LLM analysis into structured alert objects."""
    alerts = []

    # Try to detect alert categories from the text
    categories = {
        "urgent": {"priority": "high", "icon": "alert-triangle"},
        "important": {"priority": "medium", "icon": "alert-circle"},
        "preventive": {"priority": "low", "icon": "shield"},
        "family": {"priority": "low", "icon": "users"},
    }

    lines = analysis_text.split("\n")
    current_category = "important"

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check if this line indicates a category
        line_lower = line.lower()
        for cat_key in categories:
            if cat_key in line_lower and (":" in line or line_lower.startswith(cat_key)):
                current_category = cat_key
                break

        # Check if this is an actionable item (starts with -, *, number, or bullet)
        if re.match(r'^[\-\*\d\.\•►]', line):
            clean_line = re.sub(r'^[\-\*\d\.\•►\s]+', '', line).strip()
            if clean_line and len(clean_line) > 10:
                cat_info = categories.get(current_category, categories["important"])
                alerts.append({
                    "id": str(uuid4())[:8],
                    "message": clean_line,
                    "priority": cat_info["priority"],
                    "category": current_category,
                    "icon": cat_info["icon"],
                })

    # If no structured alerts found, create one from the full text
    if not alerts and analysis_text.strip():
        alerts.append({
            "id": str(uuid4())[:8],
            "message": analysis_text[:200].strip(),
            "priority": "medium",
            "category": "important",
            "icon": "alert-circle",
        })

    return alerts[:10]  # Cap at 10 alerts


# ---------------------------------------------------------------------------
# Autonomous Health Workflow
# ---------------------------------------------------------------------------

async def run_health_workflow(
    user_id: str,
    workflow_type: str,
    tool_executor: ToolExecutor,
    params: dict | None = None,
) -> dict:
    """
    Execute a predefined autonomous health workflow.
    Workflows are multi-step agent tasks triggered by system events.
    """
    workflow_prompts = {
        "daily_check": (
            "Perform a daily health check for this patient:\n"
            "1. Check their medication schedule and flag any that might be missed today\n"
            "2. Review recent conversations for any unresolved concerns\n"
            "3. Check if any follow-up tasks are overdue\n"
            "4. Provide a brief daily health summary with 2-3 actionable items"
        ),
        "post_call_analysis": (
            f"A voice call just ended. Analyze the call and perform follow-up actions:\n"
            f"Call summary: {params.get('call_summary', 'Not available') if params else 'Not available'}\n\n"
            "1. Search knowledge base for any conditions mentioned\n"
            "2. Check patient history for recurring patterns\n"
            "3. Generate follow-up tasks\n"
            "4. Flag any emergency signs that need attention\n"
            "5. Provide a post-call summary with recommended next steps"
        ),
        "report_analysis": (
            f"A new medical report was uploaded. Analyze it comprehensively:\n"
            f"Report: {params.get('report_name', 'Unknown') if params else 'Unknown'}\n\n"
            "1. Get the patient's report list and compare with previous reports if available\n"
            "2. Check medications against the report findings\n"
            "3. Search knowledge base for conditions mentioned\n"
            "4. Generate follow-up tasks based on report findings\n"
            "5. Provide a clear summary of what the report shows and what to do next"
        ),
        "comprehensive_review": (
            "Perform a comprehensive health review for this patient:\n"
            "1. Get their complete health report\n"
            "2. Review all uploaded medical reports\n"
            "3. Check medication schedule and adherence\n"
            "4. Review family health history\n"
            "5. Run a proactive health analysis\n"
            "6. Generate a doctor brief\n"
            "7. Create prioritized health tasks\n"
            "8. Provide a comprehensive summary with key findings and recommendations"
        ),
    }

    prompt = workflow_prompts.get(workflow_type)
    if not prompt:
        return {
            "error": f"Unknown workflow type: {workflow_type}",
            "available_workflows": list(workflow_prompts.keys()),
        }

    engine = AgentEngine(
        user_id=user_id,
        tool_executor=tool_executor,
        agent_role=AgentRole.ROUTER,  # Router has all tools for workflows
    )

    result = await engine.run(prompt)

    return {
        "user_id": user_id,
        "workflow_type": workflow_type,
        "result": result.response,
        "steps": [s.to_dict() for s in result.steps],
        "agents_used": result.agents_used,
        "tools_used": result.tools_used,
        "total_steps": result.total_steps,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
