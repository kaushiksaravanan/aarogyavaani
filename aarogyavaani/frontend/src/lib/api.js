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
