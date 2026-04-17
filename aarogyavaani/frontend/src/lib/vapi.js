import Vapi from '@vapi-ai/web'
import { CONFIG } from './config'

let vapiInstance = null

export function getVapi() {
  if (!vapiInstance) {
    console.log('[AV:vapi] Creating new Vapi instance with key:', CONFIG.VAPI_PUBLIC_KEY?.slice(0, 8) + '...')
    vapiInstance = new Vapi(CONFIG.VAPI_PUBLIC_KEY)
    console.log('[AV:vapi] Vapi instance created successfully')
  }
  return vapiInstance
}

export function destroyVapi() {
  if (vapiInstance) {
    console.log('[AV:vapi] Destroying Vapi instance')
    try { vapiInstance.stop() } catch (_) { /* ignore */ }
    vapiInstance = null
  }
}
