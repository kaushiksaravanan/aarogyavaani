import { useState, useEffect } from 'react'
import { Clock, CheckCircle, Circle, Calendar, Download, Loader2, Heart, AlertTriangle } from 'lucide-react'
import { CONFIG } from '../lib/config'

const t = {
  espresso: 'hsl(28 45% 15%)',
  soft: 'hsl(45 21% 40%)',
  muted: 'hsl(45 21% 55%)',
  copper: 'hsl(28 45% 57%)',
  copperStrong: 'hsl(28 49% 49%)',
  pillBg: 'hsl(28 45% 57% / 0.12)',
  pillColor: 'hsl(28 49% 49%)',
  cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))',
  border: 'rgba(34, 22, 14, 0.08)',
  shadow: '0 26px 90px rgba(76, 46, 18, 0.08)',
  surface: '#fffdf9',
  success: '#00a544',
}
const serif = { fontFamily: '"Instrument Serif", Georgia, serif' }

function getUserId() {
  try {
    const profile = JSON.parse(localStorage.getItem('aarogyavaani_profile') || '{}')
    return profile.userId || profile.name || 'anonymous'
  } catch {
    return 'anonymous'
  }
}

function formatTimestamp(ts) {
  if (!ts) return 'Unknown date'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Today at ${time}`
  if (diffDays === 1) return `Yesterday at ${time}`
  if (diffDays < 7) return `${diffDays} days ago at ${time}`
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ` at ${time}`
}

function generateICS(tasks) {
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AarogyaVaani//Health Tasks//EN\n'
  const now = new Date()
  tasks.forEach((task, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() + (task.due_suggestion === 'today' ? 0 : task.due_suggestion === 'this week' ? 3 : 7))
    const dtstart = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    ics += `BEGIN:VEVENT\nSUMMARY:${task.task}\nDTSTART:${dtstart}\nDESCRIPTION:AarogyaVaani health task (${task.priority || 'normal'} priority)\nEND:VEVENT\n`
  })
  ics += 'END:VCALENDAR'
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'aarogyavaani-tasks.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export default function HistoryPage() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState({})
  const [completedTasks, setCompletedTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aarogyavaani_completed_tasks') || '{}') } catch { return {} }
  })
  const [generatingTasks, setGeneratingTasks] = useState({})

  const userId = getUserId()

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${CONFIG.API_BASE_URL}/call_history/${encodeURIComponent(userId)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load history (${r.status})`)
        return r.json()
      })
      .then(data => {
        setCalls(data.calls || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Something went wrong while loading your call history.')
        setLoading(false)
      })
  }, [userId])

  const toggleTask = (callIdx, taskIdx) => {
    const key = `${callIdx}-${taskIdx}`
    const next = { ...completedTasks, [key]: !completedTasks[key] }
    setCompletedTasks(next)
    localStorage.setItem('aarogyavaani_completed_tasks', JSON.stringify(next))
  }

  const generateTasksForCall = async (callIdx, summary) => {
    setGeneratingTasks(prev => ({ ...prev, [callIdx]: true }))
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/generate_tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, user_id: userId }),
      })
      if (!res.ok) throw new Error('Failed to generate tasks')
      const data = await res.json()
      setTasks(prev => ({ ...prev, [callIdx]: data.tasks || [] }))
    } catch {
      setTasks(prev => ({ ...prev, [callIdx]: [] }))
    }
    setGeneratingTasks(prev => ({ ...prev, [callIdx]: false }))
  }

  // --- Render ---

  return (
    <div style={{ background: t.surface, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '52rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ ...serif, fontSize: '2rem', color: t.espresso, letterSpacing: '-0.035em', lineHeight: 1.05 }}>
            Call History
          </h1>
          <p style={{ color: t.soft, fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Your past conversations and health tasks
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <Loader2
              className="animate-spin"
              style={{ width: 28, height: 28, color: t.copper, margin: '0 auto' }}
            />
            <p style={{ color: t.muted, marginTop: '1rem', fontSize: '0.875rem' }}>
              Loading your history...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: t.cardBg, border: `1px solid ${t.border}`,
            borderRadius: '1.4rem', boxShadow: t.shadow,
          }}>
            <AlertTriangle style={{ width: 36, height: 36, color: t.copper, margin: '0 auto 1rem' }} />
            <p style={{ ...serif, fontSize: '1.25rem', color: t.espresso, marginBottom: '0.5rem' }}>
              Something went wrong
            </p>
            <p style={{ color: t.soft, fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '24rem', margin: '0 auto' }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.25rem', padding: '0.5rem 1.25rem',
                borderRadius: '999px', border: `1px solid ${t.border}`,
                background: 'transparent', color: t.copper, fontSize: '0.85rem',
                fontWeight: 500, cursor: 'pointer', transition: 'all 180ms ease',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && calls.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: t.cardBg, border: `1px solid ${t.border}`,
            borderRadius: '1.4rem', boxShadow: t.shadow,
          }}>
            <Heart style={{ width: 48, height: 48, color: 'rgba(34,22,14,0.08)', margin: '0 auto 1.25rem' }} />
            <p style={{ ...serif, fontSize: '1.35rem', color: t.espresso, marginBottom: '0.5rem' }}>
              No calls yet
            </p>
            <p style={{ color: t.soft, fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '22rem', margin: '0 auto' }}>
              Start your first conversation with AarogyaVaani.
              <br />
              Your call history and health tasks will appear here.
            </p>
          </div>
        )}

        {/* Timeline */}
        {!loading && !error && calls.length > 0 && (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute', left: 15, top: 24, bottom: 24,
              width: 2, background: `linear-gradient(180deg, ${t.copper}, ${t.border})`,
              borderRadius: 1, opacity: 0.5,
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {calls.map((call, ci) => (
                <div key={ci} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: 32, minWidth: 32, height: 32,
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: t.surface, border: `2px solid ${t.copper}`, position: 'relative', zIndex: 1,
                    marginTop: 4,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.copper }} />
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1, background: t.cardBg,
                    border: `1px solid ${t.border}`, borderRadius: '1.4rem',
                    padding: '1.5rem', boxShadow: t.shadow,
                    transition: 'box-shadow 180ms ease, border-color 180ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 18px 42px rgba(76, 46, 18, 0.08)'
                    e.currentTarget.style.borderColor = 'rgba(158, 92, 31, 0.16)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = t.shadow
                    e.currentTarget.style.borderColor = t.border
                  }}
                  >
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock style={{ width: 15, height: 15, color: t.copper }} />
                        <span style={{ fontSize: '0.8rem', color: t.soft }}>
                          {formatTimestamp(call.timestamp)}
                        </span>
                      </div>
                      {call.language && (
                        <span style={{
                          fontSize: '0.72rem', color: t.copper, fontWeight: 500,
                          background: 'hsl(28 45% 57% / 0.1)',
                          padding: '0.2rem 0.6rem', borderRadius: '999px',
                        }}>
                          {call.language === 'hi' ? 'Hindi' : call.language === 'kn' ? 'Kannada' : 'English'}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <p style={{ fontSize: '0.9rem', color: t.espresso, lineHeight: 1.65, marginBottom: '0.75rem' }}>
                      {call.summary || 'No summary available'}
                    </p>

                    {/* Condition pills */}
                    {call.conditions?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {call.conditions.map(c => (
                          <span key={c} style={{
                            fontSize: '0.72rem', fontWeight: 500,
                            background: t.pillBg, color: t.pillColor,
                            padding: '0.25rem 0.6rem', borderRadius: '999px',
                          }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tasks section */}
                    {tasks[ci] && tasks[ci].length > 0 ? (
                      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: t.espresso }}>
                            Health Tasks
                          </p>
                          <button
                            onClick={() => generateICS(tasks[ci])}
                            title="Add all tasks to Calendar"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              background: 'transparent',
                              border: `1px solid ${t.copper}`,
                              borderRadius: '999px',
                              padding: '0.3rem 0.7rem',
                              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                              color: t.copper, transition: 'all 180ms ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'hsl(28 45% 57% / 0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <Calendar style={{ width: 13, height: 13 }} />
                            Add to Calendar
                          </button>
                        </div>
                        {tasks[ci].map((task, ti) => {
                          const done = completedTasks[`${ci}-${ti}`]
                          return (
                            <div key={ti} style={{
                              display: 'flex', alignItems: 'center', gap: '0.6rem',
                              padding: '0.45rem 0',
                              borderBottom: ti < tasks[ci].length - 1 ? `1px solid rgba(34,22,14,0.04)` : 'none',
                            }}>
                              <button
                                onClick={() => toggleTask(ci, ti)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  padding: 0, display: 'flex', flexShrink: 0,
                                }}
                                aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
                              >
                                {done
                                  ? <CheckCircle style={{ width: 18, height: 18, color: t.success }} />
                                  : <Circle style={{ width: 18, height: 18, color: t.copper }} />
                                }
                              </button>
                              <span style={{
                                fontSize: '0.85rem', flex: 1, lineHeight: 1.5,
                                color: done ? t.muted : t.espresso,
                                textDecoration: done ? 'line-through' : 'none',
                                transition: 'color 180ms ease',
                              }}>
                                {task.task}
                              </span>
                              {task.priority && (
                                <span style={{
                                  fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
                                  color: task.priority === 'high' ? 'hsl(0 62.8% 50%)' : task.priority === 'medium' ? t.copper : t.muted,
                                  letterSpacing: '0.04em',
                                }}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : tasks[ci] && tasks[ci].length === 0 ? (
                      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.82rem', color: t.muted, fontStyle: 'italic' }}>
                          No tasks could be generated for this conversation.
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateTasksForCall(ci, call.summary)}
                        disabled={generatingTasks[ci]}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: 'none',
                          border: `1px solid ${t.border}`,
                          borderRadius: '999px',
                          padding: '0.45rem 0.85rem',
                          cursor: generatingTasks[ci] ? 'wait' : 'pointer',
                          fontSize: '0.8rem', color: t.copper, fontWeight: 500,
                          marginTop: '0.5rem',
                          transition: 'all 180ms ease',
                          opacity: generatingTasks[ci] ? 0.7 : 1,
                        }}
                        onMouseEnter={e => { if (!generatingTasks[ci]) e.currentTarget.style.borderColor = t.copper }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = t.border }}
                      >
                        {generatingTasks[ci]
                          ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                          : <CheckCircle style={{ width: 14, height: 14 }} />
                        }
                        {generatingTasks[ci] ? 'Generating tasks...' : 'Generate Tasks'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
