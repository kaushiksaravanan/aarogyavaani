import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone, LayoutDashboard, Database, Stethoscope, Pill,
  GitCompareArrows, Users, CheckSquare, Clock, User,
  Upload, MicOff, MessageSquare, ArrowRight, Volume2,
} from 'lucide-react'
import NurseAvatar from './NurseAvatar'

const STORAGE_KEY = 'aarogyavaani_tour_completed'

/*
 * Each step is a "voice message" from the nurse avatar.
 * The text types out character by character to feel like she's speaking.
 * Some steps highlight a specific UI element.
 */
const ONBOARDING_SCRIPT = [
  {
    id: 'greet',
    text: "Namaste! I'm AarogyaVaani, your health assistant. Let me quickly show you around so you feel at home here.",
    highlight: null,
    pauseAfter: 600,
  },
  {
    id: 'call-button',
    text: "This big button in the centre is how you talk to me. Just tap it and start speaking — I'll understand your language automatically, whether it's Hindi, English, Kannada, or 30+ others.",
    highlight: 'call-button',
    icon: Phone,
    pauseAfter: 500,
  },
  {
    id: 'doctor-mode',
    text: "See the Patient / Doctor toggle up here? Doctors can switch to Doctor Mode for clinical language, detailed report references, and a professional patient summary.",
    highlight: 'doctor-toggle',
    icon: Stethoscope,
    pauseAfter: 400,
  },
  {
    id: 'upload',
    text: "This upload button lets you share prescriptions, lab reports, or scans with me. I'll read the document, extract the medicines and conditions, and remember it for all future conversations.",
    highlight: 'upload-button',
    icon: Upload,
    pauseAfter: 400,
  },
  {
    id: 'transcript',
    text: "During a call, everything we say appears in a live transcript on the side. You can review it anytime — even after the call ends.",
    highlight: 'transcript-toggle',
    icon: MessageSquare,
    pauseAfter: 400,
  },
  {
    id: 'mute',
    text: "Once a call is active, you'll see mute and volume controls here. You can mute your mic anytime without ending the call.",
    highlight: null,
    icon: MicOff,
    pauseAfter: 300,
  },
  {
    id: 'nav-dashboard',
    text: "Your Dashboard shows everything at a glance — recent calls, active medications, follow-up reminders. It's your health control centre.",
    highlight: 'nav-dashboard',
    icon: LayoutDashboard,
    navLabel: 'Dashboard',
    pauseAfter: 300,
  },
  {
    id: 'nav-knowledge',
    text: "The Knowledge Base is your health memory. Every call and uploaded report builds it up, so I give you better, more personalised answers each time.",
    highlight: 'nav-knowledge',
    icon: Database,
    navLabel: 'Knowledge',
    pauseAfter: 300,
  },
  {
    id: 'nav-doctor-brief',
    text: "Going to see a doctor? The Doctor Brief page generates a structured summary of your full health history — conditions, medications, past conversations — ready to show your physician.",
    highlight: 'nav-doctor-brief',
    icon: Stethoscope,
    navLabel: 'Doctor Brief',
    pauseAfter: 300,
  },
  {
    id: 'nav-medications',
    text: "Medications tracks every medicine you're taking — extracted from your prescriptions and our conversations. Dosage, frequency, and purpose, all in one place.",
    highlight: 'nav-medications',
    icon: Pill,
    navLabel: 'Medications',
    pauseAfter: 300,
  },
  {
    id: 'nav-compare',
    text: "Compare lets you see how your health has changed over time. Track medications, conditions, and vitals across different periods.",
    highlight: 'nav-compare',
    icon: GitCompareArrows,
    navLabel: 'Compare',
    pauseAfter: 300,
  },
  {
    id: 'nav-family',
    text: "The Family section lets you manage health profiles for your whole family. Each person gets their own memory, medications, and conversation history.",
    highlight: 'nav-family',
    icon: Users,
    navLabel: 'Family',
    pauseAfter: 300,
  },
  {
    id: 'nav-tasks',
    text: "I automatically create health tasks from our conversations — medication refills, doctor visits, tests to schedule. You'll find them all under Tasks with priorities.",
    highlight: 'nav-tasks',
    icon: CheckSquare,
    navLabel: 'Tasks',
    pauseAfter: 300,
  },
  {
    id: 'nav-history',
    text: "Call History keeps full transcripts of every conversation we've had. You can search through them anytime to find specific advice.",
    highlight: 'nav-history',
    icon: Clock,
    navLabel: 'History',
    pauseAfter: 300,
  },
  {
    id: 'nav-profile',
    text: "Your Profile stores your name, age, language, and health conditions. Keeping it updated helps me personalise every conversation.",
    highlight: 'nav-profile',
    icon: User,
    navLabel: 'Profile',
    pauseAfter: 300,
  },
  {
    id: 'memory',
    text: "One more thing — I remember everything. Every call, every report, every medicine. The more we talk, the better I understand your health. Your data stays private and linked only to your profile.",
    highlight: null,
    pauseAfter: 400,
  },
  {
    id: 'ready',
    text: "That's it! You're all set. Tap the call button whenever you're ready to talk. I'm here to help — in your language, at your pace.",
    highlight: 'call-button',
    icon: Phone,
    pauseAfter: 0,
    isFinal: true,
  },
]

// Character typing speed (ms per character)
const TYPING_SPEED = 22
const FAST_TYPING_SPEED = 12

const STEP_LABELS = {
  greet: 'Introduction',
  'call-button': 'Voice call',
  'doctor-mode': 'Doctor mode',
  upload: 'Report upload',
  transcript: 'Live transcript',
  mute: 'Call controls',
  memory: 'Private memory',
  ready: 'Ready to begin',
}

export default function VoiceOnboarding({ onDismiss }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [completedSteps, setCompletedSteps] = useState([])
  const [avatarVolume, setAvatarVolume] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const chatEndRef = useRef(null)
  const typingRef = useRef(null)
  const volumeRef = useRef(null)

  const step = ONBOARDING_SCRIPT[currentStep]
  const isLastStep = currentStep === ONBOARDING_SCRIPT.length - 1
  const stepLabel = step.navLabel || STEP_LABELS[step.id] || 'Guided walkthrough'

  // Scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Simulate volume while "speaking"
  useEffect(() => {
    if (!isTyping) {
      setAvatarVolume(0)
      return
    }
    const interval = setInterval(() => {
      setAvatarVolume(0.15 + Math.random() * 0.5)
    }, 120)
    volumeRef.current = interval
    return () => clearInterval(interval)
  }, [isTyping])

  // Type out current step text
  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)
    let i = 0
    const speed = currentStep > 6 ? FAST_TYPING_SPEED : TYPING_SPEED

    typingRef.current = setInterval(() => {
      i++
      if (i <= step.text.length) {
        setDisplayedText(step.text.slice(0, i))
      } else {
        clearInterval(typingRef.current)
        setIsTyping(false)
      }
    }, speed)

    return () => clearInterval(typingRef.current)
  }, [currentStep, step.text])

  // Scroll when text updates
  useEffect(() => {
    scrollToBottom()
  }, [displayedText, completedSteps, scrollToBottom])

  // Highlight target element
  useEffect(() => {
    if (!step.highlight) return
    const el = document.querySelector(`[data-onboard="${step.highlight}"]`)
    if (el) {
      el.classList.add('onboard-highlight')
      el.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
      return () => el.classList.remove('onboard-highlight')
    }
  }, [currentStep, step.highlight])

  const handleNext = () => {
    if (isTyping) {
      // Skip typing, show full text immediately
      clearInterval(typingRef.current)
      setDisplayedText(step.text)
      setIsTyping(false)
      return
    }
    if (isLastStep) {
      handleDismiss()
      return
    }
    // Save completed step
    setCompletedSteps(prev => [...prev, { ...step, fullText: step.text }])
    setCurrentStep(prev => prev + 1)
  }

  const handleSkip = () => {
    handleDismiss()
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
    setTimeout(() => onDismiss?.(), 400)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className="fixed inset-0"
      role="dialog"
      aria-modal="true"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      style={{ zIndex: 60 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at top left, rgba(198, 117, 12, 0.12), transparent 26%), rgba(18, 11, 7, 0.72)',
          backdropFilter: 'blur(10px)',
          opacity: dismissed ? 0 : 1,
          transition: 'opacity 400ms ease',
        }}
      />

      <div
        className="relative flex h-full items-end justify-end p-3 sm:p-5 lg:p-8"
        style={{
          opacity: dismissed ? 0 : 1,
          transition: 'opacity 400ms ease',
        }}
      >
        <div
          className="flex w-full max-w-xl flex-col overflow-hidden rounded-[28px]"
          style={{
            maxHeight: 'min(760px, calc(100vh - 1.5rem))',
            background: 'linear-gradient(180deg, rgba(30, 20, 11, 0.97) 0%, rgba(18, 11, 7, 0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 120px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: 'rgba(198, 117, 12, 0.14)',
                    color: 'hsl(28 45% 76%)',
                    border: '1px solid rgba(198, 117, 12, 0.16)',
                  }}
                >
                  <Volume2 className="h-3 w-3" />
                  Voice walkthrough
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{
                    color: 'hsl(45 21% 55%)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {currentStep + 1} of {ONBOARDING_SCRIPT.length}
                </span>
              </div>

              <h2
                className="text-lg font-semibold sm:text-xl"
                style={{ color: 'hsl(45 21% 92%)', fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                Getting you started
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm" style={{ color: 'hsl(45 21% 66%)', lineHeight: 1.65 }}>
                {step.highlight
                  ? `${stepLabel} is highlighted on screen so you can quickly orient yourself.`
                  : 'A quick guided introduction before your first conversation.'}
              </p>
            </div>

            <button
              onClick={handleSkip}
              className="rounded-xl px-3 py-2 text-xs font-medium transition-colors"
              style={{
                color: 'hsl(45 21% 58%)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              Skip
            </button>
          </div>

          <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <div
              style={{
                height: '100%',
                width: `${((currentStep + 1) / ONBOARDING_SCRIPT.length) * 100}%`,
                background: 'linear-gradient(90deg, hsl(28 45% 57%), hsl(45 97% 76%))',
                transition: 'width 400ms ease',
              }}
            />
          </div>

          <div
            className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(198,117,12,0.15) transparent' }}
          >
            <div className="space-y-4">
              {completedSteps.map((s) => (
                <ChatBubble
                  key={s.id}
                  text={s.fullText}
                  icon={s.icon}
                  navLabel={s.navLabel || STEP_LABELS[s.id]}
                />
              ))}

              <div
                className="rounded-[30px] p-px"
                style={{ background: 'linear-gradient(135deg, rgba(198, 117, 12, 0.32), rgba(255,255,255,0.06))' }}
              >
                <div
                  className="rounded-[30px] px-4 py-4 sm:px-5 sm:py-5"
                  onClick={isTyping ? handleNext : undefined}
                  style={{
                    background: 'linear-gradient(135deg, rgba(39, 26, 16, 0.98), rgba(34, 22, 14, 0.96))',
                    cursor: isTyping ? 'pointer' : 'default',
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex-shrink-0" style={{ width: 52, height: 52 }}>
                      <NurseAvatar
                        volumeLevel={avatarVolume}
                        isActive={isTyping}
                        size={52}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div
                          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium"
                          style={{
                            background: 'rgba(198, 117, 12, 0.10)',
                            color: 'hsl(28 45% 72%)',
                            border: '1px solid rgba(198, 117, 12, 0.15)',
                          }}
                        >
                          {step.icon ? <step.icon className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          {stepLabel}
                        </div>
                        <div
                          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: isTyping ? 'rgba(198, 117, 12, 0.08)' : 'rgba(255,255,255,0.04)',
                            color: isTyping ? 'hsl(45 97% 76%)' : 'hsl(45 21% 58%)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              background: isTyping ? 'hsl(28 45% 57%)' : 'hsl(45 21% 45%)',
                              animation: isTyping ? 'warmPulse 1.6s ease-in-out infinite' : 'none',
                            }}
                          />
                          {isTyping ? 'Speaking' : 'Ready'}
                        </div>
                      </div>

                      <p
                        className="text-sm sm:text-[15px]"
                        style={{
                          color: 'hsl(45 21% 88%)',
                          lineHeight: 1.8,
                        }}
                      >
                        {displayedText}
                        {isTyping && (
                          <span
                            className="ml-0.5 inline-block h-4 w-0.5 align-text-bottom"
                            style={{
                              background: 'hsl(28 45% 57%)',
                              animation: 'cursorBlink 1s step-end infinite',
                            }}
                          />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={chatEndRef} />
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {ONBOARDING_SCRIPT.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all"
                    style={{
                      width: i === currentStep ? 18 : 6,
                      height: 6,
                      background:
                        i === currentStep
                          ? 'hsl(28 45% 57%)'
                          : i < currentStep
                            ? 'rgba(198, 117, 12, 0.42)'
                            : 'rgba(255,255,255,0.09)',
                      transition: 'all 300ms ease',
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] sm:text-xs" style={{ color: 'hsl(45 21% 48%)' }}>
                {isTyping
                  ? 'Tap the message card to reveal the rest instantly.'
                  : isLastStep
                    ? 'You can revisit this walkthrough later from your profile.'
                    : 'Continue when you are ready for the next part.'}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleDismiss}
                className="rounded-xl px-3 py-2 text-xs font-medium"
                style={{ color: 'hsl(45 21% 48%)' }}
              >
                Explore later
              </button>

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
                style={{
                  background: isTyping || isLastStep ? 'hsl(28 45% 57%)' : 'rgba(198, 117, 12, 0.12)',
                  color: isTyping || isLastStep ? 'white' : 'hsl(28 45% 72%)',
                  border: isTyping || isLastStep ? 'none' : '1px solid rgba(198, 117, 12, 0.18)',
                  boxShadow: isTyping || isLastStep ? '0 12px 28px rgba(198, 117, 12, 0.24)' : 'none',
                }}
              >
                {isLastStep && !isTyping ? <Phone className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {isTyping ? 'Reveal message' : isLastStep ? 'Start my first call' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Completed message bubble (collapsed) ─── */
function ChatBubble({ text, icon: Icon, navLabel }) {
  return (
    <div className="flex items-start gap-3 opacity-80">
      <div className="flex w-[52px] flex-shrink-0 justify-center pt-1.5">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: 'rgba(198, 117, 12, 0.22)' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="inline-block max-w-full rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {navLabel && (
            <div
              className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: 'rgba(198, 117, 12, 0.08)',
                color: 'hsl(28 45% 60%)',
                border: '1px solid rgba(198, 117, 12, 0.1)',
              }}
            >
              {Icon && <Icon className="w-2.5 h-2.5" />}
              {navLabel}
            </div>
          )}
          <p
            className="text-xs"
            style={{ color: 'hsl(45 21% 62%)', lineHeight: 1.7 }}
          >
            {text.length > 120 ? text.slice(0, 120) + '...' : text}
          </p>
        </div>
      </div>
    </div>
  )
}

export function shouldShowOnboarding() {
  return !localStorage.getItem(STORAGE_KEY)
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}
