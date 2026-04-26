function trimTrailingSlash(value) {
  return (value || '').replace(/\/+$/, '')
}

const browserOrigin = typeof window !== 'undefined' ? window.location.origin : ''
const isLocalHost = /localhost|127\.0\.0\.1/i.test(browserOrigin)

export const CONFIG = {
  VAPI_PUBLIC_KEY: import.meta.env.VITE_VAPI_PUBLIC_KEY || '',
  VAPI_ASSISTANT_ID: import.meta.env.VITE_VAPI_ASSISTANT_ID || '',
  API_BASE_URL: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || (isLocalHost ? 'http://localhost:8000' : '')),
  APP_BASE_URL: trimTrailingSlash(import.meta.env.VITE_APP_BASE_URL || browserOrigin || 'http://localhost:5173'),
  APP_X_HANDLE: import.meta.env.VITE_APP_X_HANDLE || '@Kaushiks0',
  APP_NAME: 'AarogyaVaani',
  APP_TAGLINE: 'Voice AI Healthcare Assistant for Rural India',
  APP_DESCRIPTION: 'Accessible healthcare guidance in Hindi, English, and Kannada — just speak naturally.',
}
