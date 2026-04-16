import Vapi from '@vapi-ai/web'
import { CONFIG } from './config'

let vapiInstance = null

export function getVapi() {
  if (!vapiInstance) {
    vapiInstance = new Vapi(CONFIG.VAPI_PUBLIC_KEY)
  }
  return vapiInstance
}

export function startCall() {
  const vapi = getVapi()
  return vapi.start(CONFIG.VAPI_ASSISTANT_ID)
}

export function endCall() {
  const vapi = getVapi()
  vapi.stop()
}

export function sendMessage(message) {
  const vapi = getVapi()
  vapi.send({ type: 'add-message', message: { role: 'user', content: message } })
}
