import { useState, useEffect } from 'react'
import { Clock, CheckCircle, Circle, Calendar, Download, Loader2, Heart, AlertTriangle, Share2, FileText, History } from 'lucide-react'
import { CONFIG } from '../lib/config'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, EmptyState, StatusBanner, Badge, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

function getUserId() {
  return getStoredUserId() || 'anonymous'
}

function formatTimestamp(ts) {
  if (!ts) return 'Unknown date'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Today at ${time}`
  if (diffDays === 1) return `Yesterday at ${time}`
  if (diffDays < 7) return `${diffDays} days ago at ${time}`
  return `${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} at ${time}`
}

function generateICS(tasks) {
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AarogyaVaani//Health Tasks//EN\n'
  const now = new Date()
  tasks.forEach((task) => {
    const date = new Date(now)
    date.setDate(date.getDate() + (task.due_suggestion === 'today' ? 0 : task.due_suggestion === 'this week' ? 3 : 7))
    const dtstart = `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
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

function exportCallAsText(call, index) {
  const lines = [
    `AarogyaVaani - Call Summary #${index + 1}`,
    `Date: ${formatTimestamp(call.timestamp)}`,
    call.language ? `Language: ${call.language === 'hi' ? 'Hindi' : call.language === 'kn' ? 'Kannada' : 'English'}` : '',
    '',
    'Summary:',
    call.summary || 'No summary available',
    '',
    call.conditions?.length ? `Conditions: ${call.conditions.join(', ')}` : '',
    '',
    `- Exported from AarogyaVaani (${CONFIG.APP_BASE_URL})`,
  ].filter(Boolean).join('\n')
  const blob = new Blob([lines], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aarogyavaani-call-${index + 1}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function exportAllCallsAsText(calls) {
  const lines = calls.map((call, i) => [
    `--- Call #${i + 1} ---`,
    `Date: ${formatTimestamp(call.timestamp)}`,
    `Summary: ${call.summary || 'No summary'}`,
    call.conditions?.length ? `Conditions: ${call.conditions.join(', ')}` : '',
    '',
  ].filter(Boolean).join('\n')).join('\n')
  const full = `AarogyaVaani - Full Call History\nExported: ${new Date().toLocaleString()}\n\n${lines}\n- ${CONFIG.APP_BASE_URL}`
  const blob = new Blob([full], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'aarogyavaani-history.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function shareCall(call, platform) {
  const text = `AarogyaVaani Call Summary:\n${call.summary || 'No summary'}${call.conditions?.length ? `\nConditions: ${call.conditions.join(', ')}` : ''}`
  const url = CONFIG.APP_BASE_URL
  if (platform === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`, '_blank')
  } else if (platform === 'x') {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  } else if (platform === 'copy') {
    navigator.clipboard.writeText(`${text}\n\n${url}`).catch(() => {})
  }
}

export default function HistoryPage() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState({})
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aarogyavaani_completed_tasks') || '{}')
    } catch {
      return {}
    }
  })
  const [generatingTasks, setGeneratingTasks] = useState({})

  const userId = getUserId()

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${CONFIG.API_BASE_URL}/call_history/${encodeURIComponent(userId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load history (${r.status})`)
        return r.json()
      })
      .then((data) => {
        setCalls(data.calls || [])
        setLoading(false)
      })
      .catch((err) => {
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
    setGeneratingTasks((prev) => ({ ...prev, [callIdx]: true }))
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/generate_tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, user_id: userId }),
      })
      if (!res.ok) throw new Error('Failed to generate tasks')
      const data = await res.json()
      setTasks((prev) => ({ ...prev, [callIdx]: data.tasks || [] }))
    } catch {
      setTasks((prev) => ({ ...prev, [callIdx]: [] }))
    }
    setGeneratingTasks((prev) => ({ ...prev, [callIdx]: false }))
  }

  return (
    <AppPage maxWidth="56rem">
      <PageHeader
        icon={History}
        eyebrow="Timeline"
        title="Conversation history"
        subtitle="Review past calls, export summaries, and turn each conversation into practical follow-up tasks."
        actions={calls.length > 0 ? <SecondaryButton onClick={() => exportAllCallsAsText(calls)}><Download className="w-4 h-4" />Export all</SecondaryButton> : null}
      />

      {loading ? (
        <SurfaceCard>
          <EmptyState icon={Loader2} title="Loading your history" subtitle="Fetching past conversations and saved follow-up context." />
        </SurfaceCard>
      ) : null}

      {!loading && error ? <StatusBanner icon={AlertTriangle} title="Could not load call history" subtitle={error} tone="danger" /> : null}

      {!loading && !error && calls.length === 0 ? (
        <SurfaceCard style={{ marginTop: '1rem' }}>
          <EmptyState icon={Heart} title="No calls yet" subtitle="Start your first conversation with AarogyaVaani and your history will appear here." />
        </SurfaceCard>
      ) : null}

      {!loading && !error && calls.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {calls.map((call, ci) => (
            <div key={ci} style={{ display: 'grid', gridTemplateColumns: '2.2rem 1fr', gap: '0.9rem', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '2rem', height: '2rem', borderRadius: '999px', border: `2px solid ${appTheme.copper}`, background: appTheme.surface, display: 'grid', placeItems: 'center' }}>
                    <div style={{ width: '0.7rem', height: '0.7rem', borderRadius: '999px', background: appTheme.copper }} />
                  </div>
                  {ci < calls.length - 1 ? <div style={{ flex: 1, width: 2, background: `linear-gradient(180deg, ${appTheme.copper}, ${appTheme.border})`, opacity: 0.45, marginTop: '0.35rem' }} /> : null}
                </div>
              </div>

              <SurfaceCard
                title={formatTimestamp(call.timestamp)}
                icon={Clock}
                right={call.language ? <Badge tone="copper">{call.language === 'hi' ? 'Hindi' : call.language === 'kn' ? 'Kannada' : 'English'}</Badge> : null}
              >
                <p style={{ fontSize: '0.9rem', lineHeight: 1.72, color: appTheme.espresso, marginBottom: '0.9rem' }}>
                  {call.summary || 'No summary available'}
                </p>

                {call.conditions?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.9rem' }}>
                    {call.conditions.map((condition) => <Badge key={condition} tone="warning">{condition}</Badge>)}
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginBottom: tasks[ci] ? '1rem' : '0.2rem' }}>
                  <SecondaryButton onClick={() => exportCallAsText(call, ci)}><FileText className="w-4 h-4" />Export</SecondaryButton>
                  <SecondaryButton onClick={() => shareCall(call, 'whatsapp')}><Share2 className="w-4 h-4" />WhatsApp</SecondaryButton>
                  <SecondaryButton onClick={() => shareCall(call, 'x')}><Share2 className="w-4 h-4" />Post</SecondaryButton>
                  <SecondaryButton onClick={() => shareCall(call, 'copy')}><Share2 className="w-4 h-4" />Copy</SecondaryButton>
                </div>

                {tasks[ci] && tasks[ci].length > 0 ? (
                  <div style={{ borderTop: `1px solid ${appTheme.border}`, paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: appTheme.espresso }}>Health tasks</div>
                      <SecondaryButton onClick={() => generateICS(tasks[ci])}><Calendar className="w-4 h-4" />Add to calendar</SecondaryButton>
                    </div>
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                      {tasks[ci].map((task, ti) => {
                        const done = completedTasks[`${ci}-${ti}`]
                        return (
                          <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.8rem', borderRadius: '0.9rem', background: 'rgba(34,22,14,0.03)', border: `1px solid ${appTheme.border}` }}>
                            <button
                              onClick={() => toggleTask(ci, ti)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
                            >
                              {done ? <CheckCircle style={{ width: 18, height: 18, color: '#00a544' }} /> : <Circle style={{ width: 18, height: 18, color: appTheme.copper }} />}
                            </button>
                            <span style={{ flex: 1, fontSize: '0.86rem', lineHeight: 1.55, color: done ? appTheme.muted : appTheme.espresso, textDecoration: done ? 'line-through' : 'none' }}>
                              {task.task}
                            </span>
                            {task.priority ? <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>{task.priority}</Badge> : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : tasks[ci] && tasks[ci].length === 0 ? (
                  <div style={{ borderTop: `1px solid ${appTheme.border}`, paddingTop: '0.9rem', color: appTheme.espressoSoft, fontSize: '0.84rem', fontStyle: 'italic' }}>
                    No tasks could be generated for this conversation.
                  </div>
                ) : (
                  <div style={{ borderTop: `1px solid ${appTheme.border}`, paddingTop: '0.9rem' }}>
                    <PrimaryButton onClick={() => generateTasksForCall(ci, call.summary)} disabled={generatingTasks[ci]}>
                      {generatingTasks[ci] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {generatingTasks[ci] ? 'Generating tasks...' : 'Generate tasks'}
                    </PrimaryButton>
                  </div>
                )}
              </SurfaceCard>
            </div>
          ))}
        </div>
      ) : null}
    </AppPage>
  )
}
