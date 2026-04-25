import { useState } from 'react'
import { CheckSquare, Loader2, AlertTriangle, Calendar, Pill, Stethoscope, Activity, RefreshCw, Clock } from 'lucide-react'
import { CONFIG } from '../lib/config'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, EmptyState, StatusBanner, Badge, appTheme } from '../components/AppPrimitives'

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

  const pendingTasks = tasks.filter((_, i) => !completed.has(i))
  const completedTasks = tasks.filter((_, i) => completed.has(i))

  return (
    <AppPage maxWidth="66rem">
      <PageHeader
        icon={CheckSquare}
        eyebrow="Follow-up planner"
        title="Smart follow-up tasks"
        subtitle="Turn conversation insights into medication reminders, appointments, tests, and next-step actions."
        actions={<PrimaryButton onClick={loadTasks} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}{loading ? 'Generating...' : 'Generate tasks'}</PrimaryButton>}
      />

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
                  return (
                    <button
                      key={index}
                      onClick={() => toggleComplete(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.8rem',
                        padding: '0.95rem',
                        borderRadius: '1rem',
                        border: `1px solid ${appTheme.border}`,
                        background: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${appTheme.copper}`, flexShrink: 0, marginTop: '0.05rem' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: appTheme.espresso }}>{task.title}</div>
                          {task.priority ? <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>{task.priority}</Badge> : null}
                        </div>
                        <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: appTheme.espressoSoft }}>{task.description}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                          <Badge tone={category.tone}><Icon className="w-3 h-3" />{task.category}</Badge>
                          {task.due ? <Badge>{task.due}</Badge> : null}
                        </div>
                      </div>
                    </button>
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
