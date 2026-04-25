import { CONFIG } from './config'

const BASE = CONFIG.API_BASE_URL

export async function healthCheck() {
  try {
    const res = await fetch(`${BASE}/health`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Health check failed:', err)
    return { status: 'error', error: err.message }
  }
}

export async function getQdrantStats() {
  try {
    const res = await fetch(`${BASE}/qdrant_stats`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Qdrant stats failed:', err)
    return { status: 'error', knowledge_chunks: 0, memory_chunks: 0 }
  }
}

export async function queryKnowledge(userId, query, language = 'auto') {
  try {
    const res = await fetch(`${BASE}/query_health_knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, query, language }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Knowledge query failed:', err)
    return { status: 'error', error: err.message, context: '', knowledge_results: [], memory_results: [], references: [], reasoning_summary: '' }
  }
}

export async function getSupportedLanguages() {
  try {
    const res = await fetch(`${BASE}/supported_languages`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Supported languages fetch failed:', err)
    return { status: 'error', languages: [], total: 0 }
  }
}

export async function uploadMedicalReport({ userId, fileName, mimeType, contentBase64, language = 'auto' }) {
  try {
    const res = await fetch(`${BASE}/medical_reports/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        file_name: fileName,
        mime_type: mimeType,
        content_base64: contentBase64,
        language: language,
      }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    console.error('Report upload failed:', err)
    return { status: 'error', error: err.message }
  }
}

export async function getMedicalReports(userId) {
  try {
    const res = await fetch(`${BASE}/medical_reports/${encodeURIComponent(userId)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Reports fetch failed:', err)
    return { status: 'error', reports: [], total: 0 }
  }
}

export async function getMedicalReportChunks(userId, reportId) {
  try {
    const res = await fetch(`${BASE}/medical_reports/${encodeURIComponent(userId)}/${encodeURIComponent(reportId)}/chunks`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Report chunks fetch failed:', err)
    return { status: 'error', chunks: [], total: 0 }
  }
}

export async function getDoctorBrief(userId, language = 'en') {
  try {
    const res = await fetch(`${BASE}/doctor_brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, language }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Doctor brief failed:', err)
    return { status: 'error', error: err.message, brief: '', medicines: [], conditions: [] }
  }
}

export async function getCallHistory(userId, limit = 20) {
  try {
    const res = await fetch(`${BASE}/call_history/${encodeURIComponent(userId)}?limit=${limit}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Call history fetch failed:', err)
    return { status: 'error', calls: [], total: 0 }
  }
}

export async function getHealthReport(userId) {
  try {
    const res = await fetch(`${BASE}/health_report/${encodeURIComponent(userId)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Health report fetch failed:', err)
    return { status: 'error', error: err.message }
  }
}

export async function browseKnowledgeBase(offset = 0, limit = 20) {
  try {
    const res = await fetch(`${BASE}/knowledge_base/browse?offset=${offset}&limit=${limit}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Knowledge base browse failed:', err)
    return { status: 'error', chunks: [], total: 0 }
  }
}

export async function browseUserMemory(userId, limit = 50) {
  try {
    const res = await fetch(`${BASE}/user_memory/browse/${encodeURIComponent(userId)}?limit=${limit}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('User memory browse failed:', err)
    return { status: 'error', chunks: [], total: 0 }
  }
}

export async function generateTasks(summary, userId = 'anonymous') {
  try {
    const res = await fetch(`${BASE}/generate_tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, user_id: userId }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Task generation failed:', err)
    return { status: 'error', tasks: [] }
  }
}

export async function assessEmergency(userId, symptomKeyword, transcriptText = '') {
  try {
    const res = await fetch(`${BASE}/assess_emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        symptom_keyword: symptomKeyword,
        transcript_text: transcriptText,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Emergency assessment failed:', err)
    return {
      status: 'error',
      assessment: {
        severity: 'medium',
        is_recurring: false,
        recommended_action: 'call_doctor',
        message_to_patient: 'I\'m checking your situation. Would you like to speak with your doctor?',
        message_to_doctor: `Patient reports ${symptomKeyword}.`,
        reasoning: `Assessment error: ${err.message}`,
      },
    }
  }
}

export async function initiateEmergencyCall({ userId, contactType, contactPhone, contactName, symptomSummary, severity, patientName }) {
  try {
    const res = await fetch(`${BASE}/initiate_emergency_call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        contact_type: contactType,
        contact_phone: contactPhone || '',
        contact_name: contactName || '',
        symptom_summary: symptomSummary || '',
        severity: severity || 'medium',
        patient_name: patientName || '',
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Emergency call initiation failed:', err)
    return { status: 'error', error: err.message }
  }
}

// ---------------------------------------------------------------------------
// Agentic AI API Functions
// ---------------------------------------------------------------------------

export async function agentChat({ userId, message, conversationId = '', agentRole = 'auto', language = 'auto' }) {
  try {
    const res = await fetch(`${BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        message,
        conversation_id: conversationId,
        language,
        agent_role: agentRole,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Agent chat failed:', err)
    return {
      status: 'error',
      response: 'Unable to reach the agent. Please try again.',
      conversation_id: conversationId,
      agents_used: [],
      tools_used: [],
      steps: [],
      total_steps: 0,
    }
  }
}

export async function runProactiveCheck(userId) {
  try {
    const res = await fetch(`${BASE}/agent/proactive_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Proactive check failed:', err)
    return {
      status: 'error',
      user_id: userId,
      alerts: [{ message: 'Could not run proactive check. Please try again.', priority: 'low', category: 'important' }],
      analysis: '',
      agents_used: [],
      tools_used: [],
    }
  }
}

export async function runWorkflow({ userId, workflowType, params = {} }) {
  try {
    const res = await fetch(`${BASE}/agent/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        workflow_type: workflowType,
        params,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Workflow execution failed:', err)
    return {
      status: 'error',
      user_id: userId,
      workflow_type: workflowType,
      result: 'Workflow could not be executed. Please try again.',
      agents_used: [],
      tools_used: [],
      steps: [],
    }
  }
}

export async function getAgentCapabilities() {
  try {
    const res = await fetch(`${BASE}/agent/capabilities`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Agent capabilities fetch failed:', err)
    return { agents: [], workflows: [], tools_count: 0 }
  }
}

// ---------------------------------------------------------------------------
// USP Feature APIs — Scheme Matcher, Smart Scan, Family Context, Proactive
// ---------------------------------------------------------------------------

export async function matchSchemes({ userId, state = '', conditions = [], income = '', age = '', gender = '' }) {
  try {
    const res = await fetch(`${BASE}/schemes/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, state, conditions, income, age, gender }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Scheme matching failed:', err)
    return { status: 'error', error: err.message, matches: [], total_schemes_checked: 0 }
  }
}

export async function smartScan({ userId, imageBase64, mimeType = 'image/jpeg', scanType = 'auto', language = 'auto' }) {
  try {
    const res = await fetch(`${BASE}/smart_scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        image_base64: imageBase64,
        mime_type: mimeType,
        scan_type: scanType,
        language,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Smart scan failed:', err)
    return { status: 'error', error: err.message }
  }
}

export async function detectFamilyContext({ userId, message }) {
  try {
    const res = await fetch(`${BASE}/family/detect_context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, message }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Family context detection failed:', err)
    return { status: 'error', is_family_query: false }
  }
}

export async function getProactiveIntelligence(userId) {
  try {
    const res = await fetch(`${BASE}/proactive/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Proactive intelligence failed:', err)
    return {
      status: 'error',
      error: err.message,
      seasonal_risks: [],
      medication_gaps: [],
      overdue_tests: [],
      wellness_score: null,
    }
  }
}
