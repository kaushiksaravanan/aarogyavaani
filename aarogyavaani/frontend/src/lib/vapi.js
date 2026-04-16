import Vapi from '@vapi-ai/web'
import { CONFIG } from './config'

let vapiInstance = null

export function getVapi() {
  if (!vapiInstance) {
    vapiInstance = new Vapi(CONFIG.VAPI_PUBLIC_KEY)
  }
  return vapiInstance
}

export function destroyVapi() {
  if (vapiInstance) {
    try { vapiInstance.stop() } catch (_) { /* ignore */ }
    vapiInstance = null
  }
}
