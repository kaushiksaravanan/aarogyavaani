import { SecureStorage, getLocalEncryptionPassphrase } from './crypto'

const REMINDER_KEY = 'reminders_v1'
const ACTIVE_REMINDER_KEY = 'active_incoming_reminder_v1'

function getPassphrase(userId) {
  return getLocalEncryptionPassphrase(userId || 'anonymous', 'reminders')
}

function normalizeReminder(reminder = {}) {
  return {
    reminder_id: reminder.reminder_id || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: reminder.user_id || '',
    title: reminder.title || 'Follow-up reminder',
    description: reminder.description || '',
    priority: reminder.priority || 'medium',
    category: reminder.category || 'follow-up',
    scheduled_for: reminder.scheduled_for || '',
    due_suggestion: reminder.due_suggestion || '',
    status: reminder.status || 'scheduled',
    reminder_type: reminder.reminder_type || 'reminder',
    delivery_mode: reminder.delivery_mode || 'in_app',
    source_summary: reminder.source_summary || '',
    customer_number: reminder.customer_number || '',
    created_at: reminder.created_at || new Date().toISOString(),
    updated_at: reminder.updated_at || new Date().toISOString(),
    last_triggered_at: reminder.last_triggered_at || '',
    outbound_call_status: reminder.outbound_call_status || '',
    note: reminder.note || '',
  }
}

export async function loadLocalReminders(userId) {
  const reminders = await SecureStorage.getItem(REMINDER_KEY, getPassphrase(userId))
  return Array.isArray(reminders) ? reminders.map(normalizeReminder) : []
}

export async function saveLocalReminders(userId, reminders) {
  const normalized = Array.isArray(reminders) ? reminders.map(normalizeReminder) : []
  await SecureStorage.setItem(REMINDER_KEY, normalized, getPassphrase(userId))
  return normalized
}

export async function upsertLocalReminder(userId, reminder) {
  const existing = await loadLocalReminders(userId)
  const normalized = normalizeReminder(reminder)
  const next = existing.filter(item => item.reminder_id !== normalized.reminder_id)
  next.push(normalized)
  next.sort((a, b) => (a.scheduled_for || '').localeCompare(b.scheduled_for || ''))
  return saveLocalReminders(userId, next)
}

export async function updateLocalReminder(userId, reminderId, patch = {}) {
  const existing = await loadLocalReminders(userId)
  const current = existing.find(item => item.reminder_id === reminderId)
  if (!current) return null
  const updated = normalizeReminder({
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  })
  await upsertLocalReminder(userId, updated)
  return updated
}

export async function findFirstLocalReminder(userId, predicate) {
  const reminders = await loadLocalReminders(userId)
  return reminders.find(predicate) || null
}

export async function setActiveIncomingReminder(userId, reminder) {
  if (!reminder) {
    SecureStorage.removeItem(ACTIVE_REMINDER_KEY)
    return null
  }
  const normalized = normalizeReminder(reminder)
  await SecureStorage.setItem(ACTIVE_REMINDER_KEY, normalized, getPassphrase(userId))
  return normalized
}

export async function getActiveIncomingReminder(userId) {
  const reminder = await SecureStorage.getItem(ACTIVE_REMINDER_KEY, getPassphrase(userId))
  return reminder ? normalizeReminder(reminder) : null
}

export function subscribeToReminderEvents(listener) {
  const handler = (event) => {
    if (event.key && !event.key.includes('aarogyavaani_')) return
    listener()
  }
  window.addEventListener('storage', handler)
  window.addEventListener('aarogyavaani-reminders-changed', listener)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener('aarogyavaani-reminders-changed', listener)
  }
}

export function emitReminderChange() {
  window.dispatchEvent(new Event('aarogyavaani-reminders-changed'))
}
