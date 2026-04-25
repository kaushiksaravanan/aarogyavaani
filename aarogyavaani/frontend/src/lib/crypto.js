// AarogyaVaani Client-Side Encryption Module
// All health data encrypted locally using AES-256-GCM + PBKDF2 key derivation

const SALT_KEY = 'aarogyavaani_salt'
const DEVICE_SECRET_KEY = 'aarogyavaani_device_secret'
const PBKDF2_ITERATIONS = 100000

function getOrCreateDeviceSecret() {
  let secret = localStorage.getItem(DEVICE_SECRET_KEY)
  if (!secret) {
    const arr = crypto.getRandomValues(new Uint8Array(32))
    secret = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(DEVICE_SECRET_KEY, secret)
  }
  return secret
}

export function getLocalEncryptionPassphrase(userId = 'anonymous', scope = 'default') {
  return `${scope}:${userId}:${getOrCreateDeviceSecret()}`
}

/**
 * Generate a random 16-byte salt and persist it in localStorage.
 * The salt is not sensitive — it prevents rainbow-table attacks on PBKDF2.
 * @returns {Uint8Array} 16-byte salt
 */
function getOrCreateSalt() {
  let salt = localStorage.getItem(SALT_KEY)
  if (!salt) {
    const arr = crypto.getRandomValues(new Uint8Array(16))
    salt = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(SALT_KEY, salt)
  }
  return new Uint8Array(salt.match(/.{2}/g).map(h => parseInt(h, 16)))
}

/**
 * Derive an AES-256-GCM CryptoKey from a user passphrase using PBKDF2.
 * @param {string} passphrase - User-provided passphrase
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(passphrase) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: getOrCreateSalt(),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a plaintext string. Returns a base64 string with the 12-byte IV
 * prepended to the ciphertext.
 * @param {string} plaintext
 * @param {string} passphrase
 * @returns {Promise<string>} base64-encoded IV + ciphertext
 */
export async function encrypt(plaintext, passphrase) {
  const key = await deriveKey(passphrase)
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
  const enc = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  )
  // Prepend IV to ciphertext so we can extract it during decryption
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a base64 ciphertext (with prepended IV) back to a plaintext string.
 * @param {string} ciphertext - base64-encoded IV + ciphertext
 * @param {string} passphrase
 * @returns {Promise<string>} decrypted plaintext
 */
export async function decrypt(ciphertext, passphrase) {
  const key = await deriveKey(passphrase)
  const raw = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const iv = raw.slice(0, 12)
  const data = raw.slice(12)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  return new TextDecoder().decode(decrypted)
}

/**
 * Secure localStorage wrapper — encrypts values before persisting.
 */
export const SecureStorage = {
  /**
   * Encrypt and store a value.
   * @param {string} key - localStorage key (prefixed automatically)
   * @param {*} value - Any JSON-serialisable value
   * @param {string} passphrase
   */
  async setItem(key, value, passphrase) {
    const json = JSON.stringify(value)
    const encrypted = await encrypt(json, passphrase)
    localStorage.setItem(`aarogyavaani_${key}`, encrypted)
  },

  /**
   * Retrieve and decrypt a stored value. Returns null if key missing or
   * decryption fails (wrong passphrase).
   * @param {string} key
   * @param {string} passphrase
   * @returns {Promise<*|null>}
   */
  async getItem(key, passphrase) {
    const encrypted = localStorage.getItem(`aarogyavaani_${key}`)
    if (!encrypted) return null
    try {
      const json = await decrypt(encrypted, passphrase)
      return JSON.parse(json)
    } catch {
      // Decryption failure — wrong passphrase or corrupted data
      return null
    }
  },

  /** Remove a single key. */
  removeItem(key) {
    localStorage.removeItem(`aarogyavaani_${key}`)
  },

  /** Wipe all AarogyaVaani data from localStorage. */
  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('aarogyavaani_'))
      .forEach(k => localStorage.removeItem(k))
  }
}

/**
 * Create a SHA-256 based audit hash for zero-knowledge logging.
 * The hash proves an action occurred at a given time without revealing
 * the action details to anyone without the original inputs.
 * @param {string} action - Description of the action (e.g. "viewed_report")
 * @param {string} [timestamp] - ISO timestamp; defaults to now
 * @returns {Promise<string>} hex-encoded SHA-256 hash
 */
export async function createAuditHash(action, timestamp) {
  const ts = timestamp || new Date().toISOString()
  const enc = new TextEncoder()
  const data = enc.encode(`aarogyavaani:${action}:${ts}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
