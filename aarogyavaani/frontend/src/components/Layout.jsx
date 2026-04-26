import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Phone, LayoutDashboard, Clock, User, Stethoscope, Pill, GitCompareArrows, Users, CheckSquare, Database, Copy, Check, Settings, Lock, Bot, Shield, ScanLine, Activity, BellRing, PhoneOff } from 'lucide-react'
import { appTheme, Badge } from './AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'
import { getReminders, updateReminderStatus } from '../lib/api'
import { emitReminderChange, findFirstLocalReminder, getActiveIncomingReminder, loadLocalReminders, setActiveIncomingReminder, subscribeToReminderEvents, updateLocalReminder, upsertLocalReminder } from '../lib/reminderStore'

const navItems = [
  { path: '/call', label: 'Call', icon: Phone },
  { path: '/agent', label: 'AI Agent', icon: Bot },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scan', label: 'Smart Scan', icon: ScanLine },
  { path: '/schemes', label: 'Schemes', icon: Shield },
  { path: '/proactive', label: 'Health Intel', icon: Activity },
  { path: '/knowledge', label: 'Knowledge', icon: Database },
  { path: '/doctor-brief', label: 'Doctor Brief', icon: Stethoscope },
  { path: '/medications', label: 'Medications', icon: Pill },
  { path: '/compare', label: 'Compare', icon: GitCompareArrows },
  { path: '/family', label: 'Family', icon: Users },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/private-documents', label: 'Private Docs', icon: Lock },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const DARK_ROUTES = ['/call']

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDarkRoute = DARK_ROUTES.includes(location.pathname)
  const [userId, setUserId] = useState('')
  const [copied, setCopied] = useState(false)
  const [incomingReminder, setIncomingReminder] = useState(null)

  useEffect(() => {
    setUserId(getStoredUserId())
  }, [])

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false

    async function syncReminders() {
      const [serverReminders, localReminders, activeReminder] = await Promise.all([
        getReminders(userId, false),
        loadLocalReminders(userId),
        getActiveIncomingReminder(userId),
      ])

      if (cancelled) return

      const now = Date.now()
      const merged = []
      for (const reminder of localReminders) merged.push(reminder)
      for (const reminder of serverReminders.reminders || []) {
        merged.push(reminder)
        await upsertLocalReminder(userId, reminder)
      }

      const dueLocalReminder = await findFirstLocalReminder(userId, reminder => {
        if (reminder.status !== 'scheduled' || reminder.delivery_mode !== 'mock_incoming' || reminder.reminder_type !== 'call' || !reminder.scheduled_for) return false
        const when = new Date(reminder.scheduled_for).getTime()
        return Number.isFinite(when) && when <= now
      })

      if (dueLocalReminder) {
        const ringingReminder = { ...dueLocalReminder, status: 'ringing', last_triggered_at: new Date().toISOString() }
        await updateReminderStatus({ userId, reminderId: dueLocalReminder.reminder_id, status: 'ringing', note: 'Mock incoming call is ringing in the client' })
        await updateLocalReminder(userId, dueLocalReminder.reminder_id, ringingReminder)
        merged.push(ringingReminder)
      }

      const ringing = activeReminder
        && activeReminder.status === 'ringing'
        && activeReminder.reminder_type === 'call'
        ? activeReminder
        : merged.find(reminder => reminder.status === 'ringing' && reminder.delivery_mode === 'mock_incoming' && reminder.reminder_type === 'call')
        || null
      setIncomingReminder(ringing)
      if (ringing) {
        await setActiveIncomingReminder(userId, ringing)
      }
    }

    syncReminders().catch(() => {})
    const interval = window.setInterval(() => {
      syncReminders().catch(() => {})
    }, 15000)
    const unsubscribe = subscribeToReminderEvents(() => {
      syncReminders().catch(() => {})
    })

    return () => {
      cancelled = true
      window.clearInterval(interval)
      unsubscribe()
    }
  }, [userId])

  const copyId = () => {
    if (!userId) return
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const shellBg = isDarkRoute ? '#120b07' : appTheme.surface

  const handleAcceptIncomingCall = async () => {
    if (!incomingReminder || !userId) return
    const nextReminder = {
      ...incomingReminder,
      status: 'acknowledged',
      note: 'User accepted incoming mock call',
      updated_at: new Date().toISOString(),
    }
    await updateReminderStatus({ userId, reminderId: incomingReminder.reminder_id, status: 'acknowledged', note: 'User accepted incoming mock call' })
    await updateLocalReminder(userId, incomingReminder.reminder_id, nextReminder)
    await setActiveIncomingReminder(userId, nextReminder)
    emitReminderChange()
    setIncomingReminder(null)
    navigate(`/call?incomingReminder=${encodeURIComponent(incomingReminder.reminder_id)}`)
  }

  const handleDismissIncomingCall = async () => {
    if (!incomingReminder || !userId) return
    await updateReminderStatus({ userId, reminderId: incomingReminder.reminder_id, status: 'dismissed', note: 'User dismissed incoming mock call' })
    await updateLocalReminder(userId, incomingReminder.reminder_id, { status: 'dismissed', note: 'User dismissed incoming mock call' })
    await setActiveIncomingReminder(userId, null)
    emitReminderChange()
    setIncomingReminder(null)
  }

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ background: shellBg }}>
      <aside
        className="w-56 lg:w-72 hidden md:flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #22160e 0%, #1a120c 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="p-4 lg:p-6 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/" className="block">
            <div style={{ fontFamily: appTheme.headingFont, fontSize: '1.25rem', fontWeight: 600, color: 'hsl(45 21% 95%)' }}>
              AarogyaVaani
            </div>
            <p className="text-xs mt-1 hidden lg:block" style={{ color: 'hsl(45 21% 68%)', lineHeight: 1.6 }}>
              Voice AI healthcare with memory, reports, and doctor handoff.
            </p>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 lg:px-3 py-3 lg:py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }} aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                data-onboard={`nav-${item.path.slice(1)}`}
                aria-current={active ? 'page' : undefined}
                className="flex items-center gap-2 lg:gap-3 px-2.5 lg:px-3.5 py-2 lg:py-3 rounded-2xl text-xs lg:text-sm font-medium mb-1 lg:mb-1.5 transition-colors"
                style={{
                  background: active ? 'linear-gradient(135deg, rgba(198,117,12,0.18), rgba(198,117,12,0.08))' : 'transparent',
                  color: active ? '#fff2e1' : 'hsl(45 21% 72%)',
                  border: active ? '1px solid rgba(198,117,12,0.28)' : '1px solid transparent',
                }}
              >
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.8rem',
                    display: 'grid',
                    placeItems: 'center',
                    background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    flexShrink: 0,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {userId ? (
          <div className="p-3 lg:p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="rounded-3xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-semibold" style={{ color: 'hsl(45 21% 72%)' }}>
                  Active user ID
                </p>
                <Badge tone="copper" style={{ background: 'rgba(198,117,12,0.16)', color: '#ffd8ad', border: '1px solid rgba(198,117,12,0.22)' }}>
                  Memory linked
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 truncate"
                  style={{
                    color: '#ffe8cc',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: '0.72rem',
                    background: 'rgba(0,0,0,0.16)',
                    padding: '0.55rem 0.7rem',
                    borderRadius: '0.8rem',
                  }}
                >
                  {userId}
                </code>
                <button
                  onClick={copyId}
                  style={{
                    width: '2.2rem',
                    height: '2.2rem',
                    borderRadius: '0.8rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: copied ? '#86efac' : 'hsl(45 21% 72%)',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <main
        className={`flex-1 min-w-0 flex flex-col ${isDarkRoute ? 'overflow-hidden' : 'overflow-auto pb-20 md:pb-0'}`}
        style={{ background: shellBg }}
      >
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 md:hidden z-50"
        aria-label="Mobile navigation"
        style={{
          background: isDarkRoute ? '#120b07' : 'rgba(34,22,14,0.96)',
          borderTop: isDarkRoute ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.06)',
          backdropFilter: isDarkRoute ? 'none' : 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center overflow-x-auto px-2 py-2" style={{ scrollbarWidth: 'none' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                data-onboard={`nav-${item.path.slice(1)}`}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium"
                style={{
                  color: active ? '#fff2e1' : 'hsl(45 21% 62%)',
                  minWidth: '4.5rem',
                }}
              >
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.8rem',
                    display: 'grid',
                    placeItems: 'center',
                    background: active ? 'rgba(198,117,12,0.20)' : 'transparent',
                    border: active ? '1px solid rgba(198,117,12,0.28)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {incomingReminder ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(18, 11, 7, 0.76)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: '1.2rem',
          }}
        >
          <div
            style={{
              width: 'min(100%, 28rem)',
              borderRadius: '1.8rem',
              padding: '1.3rem',
              background: 'linear-gradient(180deg, #2a1b12, #1a120c)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.42)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'rgba(198,117,12,0.18)', border: '1px solid rgba(198,117,12,0.28)', animation: 'warmPulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite' }}>
                <BellRing className="w-5 h-5" style={{ color: '#ffd8ad' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>Incoming check-in call</div>
                <div style={{ fontFamily: appTheme.headingFont, fontSize: '1.45rem', color: '#fff4e6' }}>AarogyaVaani is calling</div>
              </div>
            </div>

            <div style={{ padding: '0.95rem 1rem', borderRadius: '1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff4e6' }}>{incomingReminder.title}</div>
              {incomingReminder.description ? <div style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginTop: '0.35rem' }}>{incomingReminder.description}</div> : null}
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <Badge tone="copper">{incomingReminder.category || 'follow-up'}</Badge>
                <Badge tone={incomingReminder.priority === 'high' ? 'danger' : incomingReminder.priority === 'medium' ? 'warning' : 'success'}>{incomingReminder.priority || 'medium'}</Badge>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <button
                onClick={handleAcceptIncomingCall}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', width: '100%', padding: '0.95rem 1rem', borderRadius: '1rem', border: 'none', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}
              >
                <Phone className="w-4 h-4" />
                Accept and connect to agent
              </button>
              <button
                onClick={handleDismissIncomingCall}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', width: '100%', padding: '0.9rem 1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.84)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <PhoneOff className="w-4 h-4" />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
