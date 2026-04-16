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
    return { status: 'error', error: err.message, context: '', knowledge_results: [], memory_results: [] }
  }
}
