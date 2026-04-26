import { useEffect, useState } from 'react'
import { CheckSquare, Loader2, AlertTriangle, Calendar, Pill, Stethoscope, Activity, RefreshCw, Clock, Phone } from 'lucide-react'
import { CONFIG } from '../lib/config'
import { getReminders, scheduleReminder } from '../lib/api'
import { loadLocalReminders, upsertLocalReminder, emitReminderChange } from '../lib/reminderStore'
import { loadStoredProfile } from '../lib/profileStore'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, EmptyState, StatusBanner, Badge, appTheme } from '../components/AppPrimitives'

const CATEGORY_CONFIG = {
  medication: { icon: Pill, tone: 'violet' },
  appointment: { icon: Stethoscope, tone: 'info' },
  test: { icon: Activity, tone: 'warning' },
  lifestyle: { icon: RefreshCw, tone: 'success' },
  'follow-up': { icon: Calendar, tone: 'copper' },
}

export default function TasksPage() {
  const userId = (() => { try { const p = JSON.parse(localStorage.getItem('aarogyavaani_profile') || '{}'); return p.userId || localStorage.getItem('aarogyavaani_user_id') || '' } catch { return '' } })()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(new Set())
  const [scheduled, setScheduled] = useState({})
  const [savedReminders, setSavedReminders] = useState([])

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false

    async function syncSavedReminders() {
      const [serverData, localData] = await Promise.all([
        getReminders(userId, false),
        loadLocalReminders(userId),
      ])
      if (cancelled) return

      const merged = new Map()
      for (const reminder of localData) {
        merged.set(reminder.reminder_id, reminder)
      }
      for (const reminder of serverData.reminders || []) {
        merged.set(reminder.reminder_id, reminder)
      }

      setSavedReminders(
        Array.from(merged.values())
          .filter(reminder => reminder.status !== 'completed' && reminder.status !== 'dismissed')
          .sort((a, b) => (a.scheduled_for || '').localeCompare(b.scheduled_for || ''))
      )
    }

    syncSavedReminders().catch(() => {})
    const listener = () => { syncSavedReminders().catch(() => {}) }
    window.addEventListener('aarogyavaani-reminders-changed', listener)
    return () => {
      cancelled = true
      window.removeEventListener('aarogyavaani-reminders-changed', listener)
    }
  }, [userId])

  async function loadTasks() {
    setLoading(true)
    setError('')
    setTasks([])
    setCompleted(new Set())
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/follow_up_tasks/${encodeURIComponent(userId)}`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.message && (!data.tasks || data.tasks.length === 0)) {
        setError(data.message)
      } else {
        setTasks(data.tasks || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleComplete(index) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function scheduleTask(task, index, reminderType = 'reminder') {
    if (!userId || scheduled[index]?.loading) return
    setScheduled((prev) => ({ ...prev, [index]: { loading: true, kind: reminderType } }))

    try {
      const profile = await loadStoredProfile()
      const primaryContact = (profile.emergencyContacts || []).find(contact => contact.type === 'doctor')
      const isCall = reminderType === 'call'
      const response = await scheduleReminder({
        userId,
        title: task.title,
        description: task.description,
        priority: task.priority || 'medium',
        category: task.category || 'follow-up',
        dueSuggestion: task.due || 'this week',
        sourceSummary: task.description || task.title,
        reminderType,
        deliveryMode: isCall ? 'mock_incoming' : 'in_app',
        customerNumber: isCall ? (primaryContact?.phone || '') : '',
      })
      if (response.status === 'error' || !response.reminder) {
        throw new Error(response.error || 'Could not schedule reminder')
      }
      await upsertLocalReminder(userId, response.reminder)
      emitReminderChange()
      setScheduled((prev) => ({
        ...prev,
        [index]: {
          loading: false,
          kind: reminderType,
          success: isCall ? 'Check-in call scheduled' : 'Reminder saved to your follow-up list',
        },
      }))
    } catch (err) {
      setScheduled((prev) => ({
        ...prev,
        [index]: {
          loading: false,
          kind: reminderType,
          error: err.message,
        },
      }))
    }
  }

  const pendingTasks = tasks.filter((_, i) => !completed.has(i))
  const completedTasks = tasks.filter((_, i) => completed.has(i))

  return (
    <AppPage maxWidth="66rem">
      <PageHeader
        icon={CheckSquare}
        eyebrow="Follow-up planner"
        title="Smart follow-up tasks"
        subtitle="Turn conversation insights into saved follow-up reminders, scheduled mock check-in calls, appointments, tests, and next-step actions."
        actions={<PrimaryButton onClick={loadTasks} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}{loading ? 'Generating...' : 'Generate tasks'}</PrimaryButton>}
      />

      <StatusBanner
        icon={Calendar}
        title="Two scheduling modes"
        subtitle="Schedule reminder keeps the task in your follow-up list. Schedule check-in call triggers the incoming-call experience at the due time."
        tone="info"
        style={{ marginBottom: '1rem' }}
      />

      {savedReminders.length > 0 ? (
        <SurfaceCard title={`Scheduled follow-ups (${savedReminders.length})`} icon={Calendar} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {savedReminders.slice(0, 6).map((reminder) => {
              const category = CATEGORY_CONFIG[reminder.category] || CATEGORY_CONFIG['follow-up']
              const Icon = reminder.reminder_type === 'call' ? Phone : category.icon
              const dueLabel = reminder.scheduled_for
                ? new Date(reminder.scheduled_for).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                : reminder.due_suggestion || 'Scheduled soon'
              return (
                <div
                  key={reminder.reminder_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.8rem',
                    padding: '0.9rem 1rem',
                    borderRadius: '1rem',
                    border: `1px solid ${appTheme.border}`,
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                    <div style={{ width: '2.2rem', height: '2.2rem', borderRadius: '0.85rem', display: 'grid', placeItems: 'center', background: 'rgba(198,117,12,0.08)', color: appTheme.copperStrong, flexShrink: 0 }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: appTheme.espresso }}>{reminder.title}</div>
                      {reminder.description ? <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft, lineHeight: 1.6, marginTop: '0.2rem' }}>{reminder.description}</div> : null}
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.55rem' }}>
                        <Badge tone={reminder.reminder_type === 'call' ? 'info' : 'neutral'}>{reminder.reminder_type === 'call' ? 'check-in call' : 'saved reminder'}</Badge>
                        <Badge tone={category.tone}>{reminder.category || 'follow-up'}</Badge>
                        <Badge>{dueLabel}</Badge>
                      </div>
                    </div>
                  </div>
                  <Badge tone={reminder.status === 'ringing' ? 'warning' : reminder.priority === 'high' ? 'danger' : reminder.priority === 'medium' ? 'warning' : 'success'}>{reminder.status}</Badge>
                </div>
              )
            })}
          </div>
        </SurfaceCard>
      ) : null}

      {error ? <StatusBanner icon={AlertTriangle} title="Could not generate tasks" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} /> : null}

      {tasks.length > 0 ? (
        <div className="grid lg:grid-cols-[1.25fr_0.9fr] gap-4">
          <SurfaceCard title={`Pending tasks (${pendingTasks.length})`} icon={Clock}>
            {pendingTasks.length ? (
              <div style={{ display: 'grid', gap: '0.7rem' }}>
                {pendingTasks.map((task) => {
                  const index = tasks.indexOf(task)
                  const category = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG['follow-up']
                  const Icon = category.icon
                  const scheduleState = scheduled[index] || {}
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.8rem',
                        padding: '0.95rem',
                        borderRadius: '1rem',
                        border: `1px solid ${appTheme.border}`,
                        background: '#fff',
                      }}
                    >
                      <button
                        onClick={() => toggleComplete(index)}
                        style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${appTheme.copper}`, flexShrink: 0, marginTop: '0.05rem', background: 'transparent', cursor: 'pointer' }}
                        aria-label="Toggle task completion"
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: appTheme.espresso }}>{task.title}</div>
                          {task.priority ? <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>{task.priority}</Badge> : null}
                        </div>
                        <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: appTheme.espressoSoft }}>{task.description}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem', marginBottom: '0.8rem' }}>
                          <Badge tone={category.tone}><Icon className="w-3 h-3" />{task.category}</Badge>
                          {task.due ? <Badge>{task.due}</Badge> : null}
                        </div>

                        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                          <SecondaryButton onClick={() => scheduleTask(task, index, 'reminder')} disabled={scheduleState.loading} style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }}>
                            {scheduleState.loading && scheduleState.kind === 'reminder' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                            Schedule reminder
                          </SecondaryButton>
                          <PrimaryButton onClick={() => scheduleTask(task, index, 'call')} disabled={scheduleState.loading} style={{ padding: '0.58rem 0.95rem', fontSize: '0.8rem' }}>
                            {scheduleState.loading && scheduleState.kind === 'call' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                            Schedule check-in call
                          </PrimaryButton>
                        </div>

                        {scheduleState.success ? (
                          <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.55rem' }}>{scheduleState.success}</div>
                        ) : null}
                        {scheduleState.error ? (
                          <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.55rem' }}>{scheduleState.error}</div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={CheckSquare} title="All tasks completed" subtitle="You have cleared everything generated from recent conversations." />
            )}
          </SurfaceCard>

          <SurfaceCard title={`Completed (${completedTasks.length})`} icon={Calendar}>
            {completedTasks.length ? (
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {completedTasks.map((task) => {
                  const index = tasks.indexOf(task)
                  return (
                    <button
                      key={index}
                      onClick={() => toggleComplete(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        padding: '0.85rem',
                        borderRadius: '1rem',
                        border: `1px solid ${appTheme.border}`,
                        background: '#fafaf9',
                        cursor: 'pointer',
                        textAlign: 'left',
                        opacity: 0.72,
                      }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <div style={{ fontSize: '0.86rem', color: appTheme.espressoSoft, textDecoration: 'line-through' }}>{task.title}</div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={Calendar} title="Nothing completed yet" subtitle="Click a task on the left to mark it done." />
            )}
          </SurfaceCard>
        </div>
      ) : null}

      {tasks.length === 0 && !loading && !error ? (
        <SurfaceCard>
          <EmptyState icon={CheckSquare} title="No tasks yet" subtitle="Generate tasks to create actionable follow-ups from health conversations and uploaded reports." />
        </SurfaceCard>
      ) : null}
    </AppPage>
  )
}
