import { CONFIG } from './config'

const BASE = CONFIG.API_BASE_URL

export async function healthCheck() {
  const res = await fetch(`${BASE}/health`)
  return res.json()
}

export async function queryKnowledge(userId, query, language = 'auto') {
  const res = await fetch(`${BASE}/query_health_knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, query, language }),
  })
  return res.json()
}
