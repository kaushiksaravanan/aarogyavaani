import { SecureStorage, getLocalEncryptionPassphrase } from './crypto'

const PROFILE_KEY = 'aarogyavaani_profile'
const SENSITIVE_KEY = 'profile_sensitive_v1'

function cleanSensitive(profile = {}) {
  return {
    conditions: Array.isArray(profile.conditions) ? profile.conditions : [],
    familyMembers: Array.isArray(profile.familyMembers) ? profile.familyMembers : [],
    emergencyContacts: Array.isArray(profile.emergencyContacts) ? profile.emergencyContacts : [],
  }
}

function getPassphrase(userId) {
  return getLocalEncryptionPassphrase(userId || 'anonymous', 'profile')
}

export function getProfileBase() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function getStoredUserId() {
  const base = getProfileBase()
  return base.userId || localStorage.getItem('aarogyavaani_user_id') || ''
}

export async function loadStoredProfile() {
  const base = getProfileBase()
  const userId = base.userId || localStorage.getItem('aarogyavaani_user_id') || ''
  let sensitive = null

  if (userId) {
    sensitive = await SecureStorage.getItem(SENSITIVE_KEY, getPassphrase(userId))
  }

  return {
    ...base,
    ...cleanSensitive(sensitive || base),
    userId,
  }
}

export async function saveStoredProfile(profile) {
  const userId = profile.userId || localStorage.getItem('aarogyavaani_user_id') || ''
  const sensitive = cleanSensitive(profile)
  const base = {
    ...profile,
    conditions: undefined,
    familyMembers: undefined,
    emergencyContacts: undefined,
  }

  delete base.conditions
  delete base.familyMembers
  delete base.emergencyContacts

  localStorage.setItem(PROFILE_KEY, JSON.stringify(base))
  if (userId) {
    localStorage.setItem('aarogyavaani_user_id', userId)
    await SecureStorage.setItem(SENSITIVE_KEY, sensitive, getPassphrase(userId))
  }

  return {
    ...base,
    ...sensitive,
    userId,
  }
}
