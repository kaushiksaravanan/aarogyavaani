import { Link } from 'react-router-dom'
import { Phone, Heart, ArrowRight, Mic, MessageCircle, Globe, Brain, Clock, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SignInButton, UserButton } from '@clerk/clerk-react'
import { useAuthSafe, CLERK_AVAILABLE } from '../lib/useAuthSafe'
import useScrollReveal from '../lib/useScrollReveal'
import { CONFIG } from '../lib/config'

/* ─── data ────────────────────────────────────────────────────────── */

const features = [
  {
    icon: Globe,
    title: 'Multilingual Voice AI',
    description: 'Speaks Hindi, English, and Kannada. Auto-detects your language and responds naturally in real time.',
  },
  {
    icon: Brain,
    title: 'Smart Health Knowledge',
    description: 'Powered by Qdrant vector search over verified health information, government schemes, and protocols.',
  },
  {
    icon: Clock,
    title: 'Remembers You',
    description: 'Persistent memory across calls. Recalls your health history, preferences, and past conversations.',
  },
  {
    icon: Shield,
    title: 'Safe & Trustworthy',
    description: 'Never diagnoses. Always recommends seeing a doctor. Emergency guidance for critical situations.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Start a Call',
    description: 'Click the call button or dial the phone number. No app download needed.',
  },
  {
    num: '02',
    title: 'Speak Naturally',
    description: 'Ask about symptoms, medicines, government schemes, or diet — in your language.',
  },
  {
    num: '03',
    title: 'Get Guidance',
    description: 'Receive accurate, simple health information sourced from verified medical knowledge.',
  },
]

/* ─── style tokens (inline, for complex gradients) ────────────────── */

const t = {
  heroBg:
    'radial-gradient(circle at 50% -10%, hsl(45 97% 76% / 0.22), transparent 26%), linear-gradient(180deg, #3c2818 0%, #271a10 50%, #1b130d 100%)',
  heroHeading: 'hsl(45 21% 95%)',
  heroBody: 'hsl(45 21% 95% / 0.78)',
  heroPillBorder: 'rgba(255,255,255,0.16)',
  heroPillText: 'rgba(255,255,255,0.86)',
  primaryBtnBg: '#ffffff',
  primaryBtnText: '#150f0b',
  ghostBorder: 'rgba(255,255,255,0.5)',
  ghostText: '#ffffff',
  lightSectionBg: 'linear-gradient(180deg, #fff8f1, #fffdf9, #ffffff)',
  cardBg:
    'linear-gradient(180deg, hsl(32 52% 97% / 0.92), hsl(0 0% 100% / 0.9))',
  cardBorder: 'rgba(34, 22, 14, 0.08)',
  cardHoverBorder: 'rgba(158, 92, 31, 0.16)',
  cardHoverShadow: '0 18px 42px rgba(76, 46, 18, 0.08)',
  ctaBg:
    'radial-gradient(circle at 18% 18%, rgba(208,134,30,0.18), transparent 30%), linear-gradient(180deg, hsl(28 45% 13%), hsl(28 45% 10%))',
  footerText: 'hsl(45 21% 40%)',
  copper: '#c6750c',
}

const serif = { fontFamily: '"Instrument Serif", Georgia, serif' }

const conversations = [
  {
    lang: 'Hindi',
    flag: '🇮🇳',
    messages: [
      { role: 'ai', text: 'नमस्ते! मैं आरोग्यवाणी हूं। बताइए, आज मैं आपकी क्या मदद कर सकती हूं?' },
      { role: 'user', text: 'मुझे शुगर है, खाने में क्या ध्यान रखना चाहिए?' },
      { role: 'ai', text: 'बहुत अच्छा सवाल! शुगर में रोटी, दाल, हरी सब्ज़ियां खाएं। चीनी और मीठा कम करें। करेला शुगर कम करने में मदद करता है...' },
    ],
  },
  {
    lang: 'English',
    flag: '🇬🇧',
    messages: [
      { role: 'ai', text: 'Hello! I\'m AarogyaVaani, your health assistant. How can I help you today?' },
      { role: 'user', text: 'My mother has high BP. What should she eat?' },
      { role: 'ai', text: 'Great question! For high blood pressure, reduce salt and processed foods. Eat more bananas, spinach, and garlic. Regular walks help too. Shall I explain more?' },
    ],
  },
  {
    lang: 'Kannada',
    flag: '🇮🇳',
    messages: [
      { role: 'ai', text: 'ನಮಸ್ಕಾರ! ನಾನು ಆರೋಗ್ಯವಾಣಿ. ಇವತ್ತು ನಿಮಗೆ ಏನು ಸಹಾಯ ಮಾಡಲಿ?' },
      { role: 'user', text: 'ನನಗೆ ಗರ್ಭಿಣಿಯಾಗಿದ್ದೇನೆ. ಯಾವ ಯೋಜನೆಗಳಿವೆ?' },
      { role: 'ai', text: 'ಅಭಿನಂದನೆಗಳು! ಜನನಿ ಸುರಕ್ಷಾ ಯೋಜನೆ ಅಡಿಯಲ್ಲಿ ₹1,400 ಸಹಾಯ ಸಿಗುತ್ತದೆ. ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಉಚಿತ ಪ್ರಸವ ಸೌಲಭ್ಯ ಇದೆ...' },
    ],
  },
  {
    lang: 'Tamil',
    flag: '🇮🇳',
    messages: [
      { role: 'ai', text: 'வணக்கம்! நான் ஆரோக்யவாணி. இன்று உங்களுக்கு எப்படி உதவ முடியும்?' },
      { role: 'user', text: 'என் குழந்தைக்கு காய்ச்சல் அதிகமாக இருக்கிறது' },
      { role: 'ai', text: 'கவலைப்படாதீர்கள்! குழந்தைக்கு நிறைய தண்ணீர் கொடுங்கள். ஈரத் துணியால் ஒத்தடம் கொடுங்கள். 102°F மேல் இருந்தால் உடனே மருத்துவரைப் பாருங்கள்.' },
    ],
  },
  {
    lang: 'Telugu',
    flag: '🇮🇳',
    messages: [
      { role: 'ai', text: 'నమస్కారం! నేను ఆరోగ్యవాణి. ఈరోజు మీకు ఏ విధంగా సహాయం చేయగలను?' },
      { role: 'user', text: 'ఆయుష్మాన్ భారత్ కార్డ్ ఎలా పొందాలి?' },
      { role: 'ai', text: 'మంచి ప్రశ్న! మీ నజీకి CSC కేంద్రానికి వెళ్ళండి. ఆధార్ కార్డ్, రేషన్ కార్డ్ తీసుకెళ్ళండి. ఉచిత ₹5 లక్షల ఆరోగ్య బీమా లభిస్తుంది...' },
    ],
  },
]

const LANG_NAMES = ['Hindi', 'English', 'Kannada', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Urdu']
const LANG_NATIVES = ['हिंदी', 'English', 'ಕನ್ನಡ', 'தமிழ்', 'తెలుగు', 'বাংলা', 'मराठी', 'اردو']

function AnimatedLangWord() {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % LANG_NATIVES.length)
        setFade(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])
  return (
    <span
      className="multilingual-shimmer"
      style={{
        display: 'inline-block',
        minWidth: '5ch',
        transition: 'opacity 300ms ease, transform 300ms ease',
        opacity: fade ? 1 : 0,
        transform: fade ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {LANG_NATIVES[idx]}
    </span>
  )
}

function ChatDemo() {
  const [convIdx, setConvIdx] = useState(0)
  const [visibleCount, setVisibleCount] = useState(0)
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const conv = conversations[convIdx]

  useEffect(() => {
    setVisibleCount(0)
    setTypingText('')
    setIsTyping(false)
    setTransitioning(false)
  }, [convIdx])

  useEffect(() => {
    if (visibleCount >= conv.messages.length) {
      // All messages shown, wait then transition to next language
      const timer = setTimeout(() => {
        setTransitioning(true)
        setTimeout(() => {
          setConvIdx(i => (i + 1) % conversations.length)
        }, 600)
      }, 3000)
      return () => clearTimeout(timer)
    }

    // Type out the next message
    const msg = conv.messages[visibleCount]
    const fullText = msg.text
    let charIdx = 0
    setIsTyping(true)
    setTypingText('')

    const typeInterval = setInterval(() => {
      charIdx++
      if (charIdx <= fullText.length) {
        setTypingText(fullText.slice(0, charIdx))
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
        // Pause briefly then show this message as "complete"
        setTimeout(() => {
          setVisibleCount(c => c + 1)
          setTypingText('')
        }, 400)
      }
    }, msg.role === 'ai' ? 22 : 18)

    return () => clearInterval(typeInterval)
  }, [visibleCount, convIdx])

  const renderMessage = (msg, idx, isLive) => {
    const text = isLive ? typingText : msg.text
    if (msg.role === 'ai') {
      return (
        <div
          key={idx}
          className="flex items-start gap-3 mb-4"
          style={{
            animation: isLive ? 'none' : 'chatBubbleIn 400ms ease-out both',
            animationDelay: isLive ? '0ms' : '50ms',
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: t.copper }}
          >
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div
            className="rounded-2xl rounded-tl-md px-4 py-3 flex-1"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(45 21% 90%)' }}>
              {text}
              {isLive && isTyping && (
                <span className="inline-block w-0.5 h-4 ml-0.5 align-middle" style={{
                  background: 'hsl(45 21% 90%)',
                  animation: 'cursorBlink 0.8s infinite',
                }} />
              )}
            </p>
          </div>
        </div>
      )
    }
    return (
      <div
        key={idx}
        className="flex items-start gap-3 justify-end mb-4"
        style={{
          animation: isLive ? 'none' : 'chatBubbleIn 400ms ease-out both',
          animationDelay: isLive ? '0ms' : '50ms',
        }}
      >
        <div
          className="rounded-2xl rounded-tr-md px-4 py-3 max-w-sm"
          style={{
            background: t.copper,
            boxShadow: '0 4px 16px rgba(198,117,12,0.25)',
          }}
        >
          <p className="text-sm leading-relaxed text-white">
            {text}
            {isLive && isTyping && (
              <span className="inline-block w-0.5 h-4 ml-0.5 align-middle" style={{
                background: 'white',
                animation: 'cursorBlink 0.8s infinite',
              }} />
            )}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }}>
          <MessageCircle className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-20 max-w-2xl mx-auto">
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(180deg, rgba(60,40,24,0.7) 0%, rgba(27,19,13,0.85) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 500ms ease, transform 500ms ease',
        }}
      >
        {/* header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#e05a3a' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#d9a026' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4ca84c' }} />
            <span className="ml-2 text-xs tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Live Conversation
            </span>
          </div>
          {/* Language pills — scrollable on small screens */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {conversations.map((c, i) => (
              <button
                key={c.lang}
                onMouseEnter={() => { if (i !== convIdx) { setTransitioning(true); setTimeout(() => setConvIdx(i), 500) } }}
                className="text-xs px-2.5 py-1 rounded-full transition-all duration-300 flex-shrink-0"
                style={{
                  background: i === convIdx ? 'rgba(198,117,12,0.3)' : 'rgba(255,255,255,0.06)',
                  color: i === convIdx ? 'hsl(45 97% 76%)' : 'rgba(255,255,255,0.4)',
                  border: i === convIdx ? '1px solid rgba(198,117,12,0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: i === convIdx ? 600 : 400,
                }}
              >
                {c.lang}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ minHeight: '200px' }}>
          {conv.messages.slice(0, visibleCount).map((msg, idx) => renderMessage(msg, idx, false))}
          {visibleCount < conv.messages.length && typingText && renderMessage(conv.messages[visibleCount], visibleCount, true)}
          {visibleCount < conv.messages.length && !typingText && isTyping && (
            <div className="flex items-center gap-2 ml-12 mb-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)', animation: 'dotPulse 1.2s 0ms infinite' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)', animation: 'dotPulse 1.2s 200ms infinite' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)', animation: 'dotPulse 1.2s 400ms infinite' }} />
              </div>
            </div>
          )}
        </div>

        {/* Language rotation indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {conversations.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: i === convIdx ? '24px' : '6px',
                background: i === convIdx ? t.copper : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderRadius: '1rem',
      border: '1px solid rgba(34,22,14,0.08)',
      background: open ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,241,0.98))' : 'transparent',
      overflow: 'hidden',
      transition: 'background 280ms ease',
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', padding: '1.15rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 500, color: 'hsl(28 45% 15%)',
        }}
      >
        {q}
        <span style={{
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'transform 280ms ease',
          fontSize: '1.25rem', color: 'hsl(28 45% 57%)', flexShrink: 0, marginLeft: '1.25rem',
        }}>+</span>
      </button>
      <div
        role="region"
        aria-hidden={!open}
        style={{
          maxHeight: open ? '500px' : '0',
          opacity: open ? 1 : 0,
          padding: open ? '0 1.5rem 1.25rem' : '0 1.5rem',
          overflow: 'hidden',
          transition: 'max-height 380ms ease, opacity 280ms ease, padding 280ms ease',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: 'hsl(45 21% 40%)', lineHeight: 1.7 }}>{a}</p>
      </div>
    </div>
  )
}

function MemoryDemo() {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState(0) // 0=nothing, 1=user msg, 2=typing AI, 3=AI done, 4=refs appearing
  const [aiText, setAiText] = useState('')
  const [visibleRefs, setVisibleRefs] = useState(0)

  const userMsg = 'Doctor ne sugar ki tablets di thi. Aaj unko continue karna hai kya?'
  const aiFullText = 'I can help with that. I found your recent prescription upload from Dr. Meena - 14 Apr and your earlier call summary about fasting sugar.'
  const references = [
    'Reference: Prescription image -> Metformin 500 mg after breakfast and dinner',
    'Reference: Call history -> user reported dizziness when skipping food',
    'Reasoning shown: answered using uploaded medicine + past symptom context',
  ]

  const howSteps = [
    { label: 'Upload', title: 'Let us organise your reports', description: 'Drop in cluttered prescriptions, scans, and report PDFs. AarogyaVaani cleans them up before saving the useful parts.' },
    { label: 'Store', title: 'Qdrant turns clutter into memory', description: 'Medicines, conditions, report summaries, and evidence snippets are indexed into vector memory so future calls stay grounded.' },
    { label: 'Recall', title: 'We understand you', description: 'On the next call, the AI brings back the right references from your previous reports and shows exactly what it used.' },
  ]

  // Phase machine: loops the animation
  useEffect(() => {
    // Start sequence
    const t1 = setTimeout(() => setPhase(1), 600) // show user msg
    return () => clearTimeout(t1)
  }, [])

  // Phase 1 -> 2: after user msg appears, start typing AI
  useEffect(() => {
    if (phase === 1) {
      const t = setTimeout(() => { setPhase(2); setAiText('') }, 1200)
      return () => clearTimeout(t)
    }
  }, [phase])

  // Phase 2: type out AI message
  useEffect(() => {
    if (phase !== 2) return
    let idx = 0
    const interval = setInterval(() => {
      idx++
      if (idx <= aiFullText.length) {
        setAiText(aiFullText.slice(0, idx))
      } else {
        clearInterval(interval)
        setPhase(3)
      }
    }, 18)
    return () => clearInterval(interval)
  }, [phase])

  // Phase 3 -> 4: show references one by one
  useEffect(() => {
    if (phase === 3) {
      setVisibleRefs(0)
      const t = setTimeout(() => setPhase(4), 400)
      return () => clearTimeout(t)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 4 && visibleRefs < references.length) {
      const t = setTimeout(() => setVisibleRefs(v => v + 1), 500)
      return () => clearTimeout(t)
    }
    if (phase === 4 && visibleRefs >= references.length) {
      // Hold for 4s then restart
      const t = setTimeout(() => {
        setPhase(0)
        setAiText('')
        setVisibleRefs(0)
        setTimeout(() => setPhase(1), 400)
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [phase, visibleRefs])

  // How-it-works stepper
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % howSteps.length), 2600)
    return () => clearInterval(interval)
  }, [])

  return (
    <section data-reveal style={{ background: '#fffdf9', padding: '5rem 0' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '42rem', margin: '0 auto 3rem' }}>
          <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.95rem, 4vw, 2.9rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
            We <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>understand you</span>
          </h2>
          <p style={{ color: 'hsl(45 21% 40%)', marginTop: '0.95rem', fontSize: '1rem', lineHeight: 1.72, letterSpacing: '0.004em' }}>
            Your recent doctor prescriptions, uploaded reports, and old call summaries are referenced during new conversations — with transparent proof shown in transcript and history.
          </p>
        </div>

        <div className="landing-memory-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Animated transcript card */}
            <div style={{ borderRadius: '1.4rem', padding: '1.35rem', background: 'linear-gradient(180deg, rgba(27,19,13,0.96), rgba(34,22,14,0.98))', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 26px 90px rgba(16,9,4,0.20)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '0.55rem', height: '0.55rem', borderRadius: '999px', background: phase >= 1 ? '#4ca84c' : 'rgba(255,255,255,0.2)', transition: 'background 300ms ease' }} />
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(45 21% 65%)' }}>Live transcript + references</span>
                </div>
                <span className="wiggle-chip" style={{ fontSize: '0.72rem', color: 'hsl(45 97% 76%)', background: 'rgba(198,117,12,0.14)', border: '1px solid rgba(198,117,12,0.2)', padding: '0.25rem 0.55rem', borderRadius: '999px' }}>Transparent memory</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '220px' }}>
                {/* User message */}
                <div style={{
                  alignSelf: 'flex-end', maxWidth: '78%', background: 'hsl(28 45% 57%)', color: 'white',
                  padding: '0.8rem 0.95rem', borderRadius: '1rem 1rem 0.3rem 1rem', fontSize: '0.9rem', lineHeight: 1.55,
                  opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 400ms ease, transform 400ms ease',
                }}>
                  {userMsg}
                </div>

                {/* AI response */}
                {phase >= 2 && (
                  <div style={{
                    alignSelf: 'flex-start', maxWidth: '84%', background: 'rgba(255,255,255,0.06)', color: 'hsl(45 21% 90%)',
                    padding: '0.9rem 1rem', borderRadius: '1rem 1rem 1rem 0.3rem', fontSize: '0.9rem', lineHeight: 1.65,
                    animation: 'chatBubbleIn 400ms ease-out both',
                  }}>
                    {aiText}
                    {phase === 2 && (
                      <span className="inline-block w-0.5 h-4 ml-0.5 align-middle" style={{
                        background: 'hsl(45 21% 90%)', animation: 'cursorBlink 0.8s infinite',
                      }} />
                    )}

                    {/* References — fade in one by one */}
                    {phase >= 4 && visibleRefs > 0 && (
                      <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {references.slice(0, visibleRefs).map((line, ri) => (
                          <div key={ri} style={{
                            display: 'flex', gap: '0.45rem', alignItems: 'flex-start',
                            animation: 'chatBubbleIn 350ms ease-out both',
                          }}>
                            <span style={{ color: 'hsl(45 97% 76%)' }}>•</span>
                            <span style={{ fontSize: '0.78rem', color: 'hsl(45 21% 70%)', lineHeight: 1.55 }}>{line}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Typing dots before AI starts */}
                {phase === 1 && (
                  <div className="flex items-center gap-2 ml-2 mb-2" style={{ animation: 'chatBubbleIn 300ms ease-out both' }}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)', animation: 'dotPulse 1.2s 0ms infinite' }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)', animation: 'dotPulse 1.2s 200ms infinite' }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)', animation: 'dotPulse 1.2s 400ms infinite' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="landing-memory-subgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="mini-bounce-card" style={{ borderRadius: '1.2rem', padding: '1rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 20px 60px rgba(76, 46, 18, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(28 45% 57%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>History view</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {[
                    '15 Apr • Uploaded CBC report • medicines extracted',
                    '16 Apr • Call summary • asked about dizziness after tablets',
                    '18 Apr • Doctor brief generated • medication + issues summarized',
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: '0.7rem 0.75rem', borderRadius: '0.85rem', background: idx === 1 ? 'rgba(198,117,12,0.08)' : 'rgba(34,22,14,0.03)', fontSize: '0.8rem', color: 'hsl(45 21% 35%)', lineHeight: 1.55 }}>{item}</div>
                  ))}
                </div>
              </div>

              <div className="mini-bounce-card" style={{ borderRadius: '1.2rem', padding: '1rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 20px 60px rgba(76, 46, 18, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(28 45% 57%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Qdrant memory cleanup</div>
                <div style={{ fontSize: '0.78rem', color: 'hsl(45 21% 38%)', lineHeight: 1.65 }}>
                  <div style={{ padding: '0.7rem 0.75rem', borderRadius: '0.85rem', background: 'rgba(34,22,14,0.04)', marginBottom: '0.55rem' }}>
                    "Metforin? metformin? after food 500? sugar medicine..."
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '0.2rem 0 0.55rem', color: 'hsl(28 45% 57%)' }}>↓</div>
                  <div style={{ padding: '0.7rem 0.75rem', borderRadius: '0.85rem', background: 'rgba(198,117,12,0.08)' }}>
                    Clean memory: <strong>Metformin 500 mg</strong> • diabetes • after breakfast and dinner • source: uploaded prescription
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderRadius: '1.4rem', padding: '1.35rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 26px 90px rgba(76, 46, 18, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(45 21% 40%)' }}>How it works under the hood</span>
                <span className="mini-spark" style={{ fontSize: '1rem' }}>✨</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {howSteps.map((item, idx) => (
                  <div key={item.label} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.85rem', alignItems: 'start', opacity: step === idx ? 1 : 0.55, transform: step === idx ? 'translateY(0)' : 'translateY(2px)', transition: 'all 220ms ease' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '999px', background: step === idx ? 'hsl(28 45% 57%)' : 'rgba(34,22,14,0.08)', color: step === idx ? 'white' : 'hsl(45 21% 40%)', display: 'grid', placeItems: 'center', fontSize: '0.78rem', fontWeight: 700 }}>{idx + 1}</div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'hsl(28 45% 57%)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.22rem' }}>{item.label}</div>
                      <div style={{ fontSize: '1rem', color: 'hsl(28 45% 15%)', fontWeight: 600, marginBottom: '0.22rem', lineHeight: 1.35 }}>{item.title}</div>
                      <div style={{ fontSize: '0.88rem', color: 'hsl(45 21% 40%)', lineHeight: 1.65 }}>{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-memory-subgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="mini-bounce-card" style={{ borderRadius: '1.2rem', padding: '1rem', background: 'linear-gradient(180deg, rgba(27,19,13,0.96), rgba(34,22,14,0.98))', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.55rem' }}>
                  <Mic className="w-4 h-4" style={{ color: 'hsl(45 97% 76%)' }} />
                  <span style={{ color: 'hsl(45 21% 95%)', fontWeight: 600 }}>Powered by Vapi</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'hsl(45 21% 70%)', lineHeight: 1.62 }}>
                  Fast, natural voice conversations with a call experience that feels like talking to someone who actually listens.
                </p>
              </div>

              <div className="mini-bounce-card" style={{ borderRadius: '1.2rem', padding: '1rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.55rem' }}>
                  <Brain className="w-4 h-4" style={{ color: 'hsl(28 45% 57%)' }} />
                  <span style={{ color: 'hsl(28 45% 15%)', fontWeight: 600 }}>Memory by Qdrant</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'hsl(45 21% 40%)', lineHeight: 1.62 }}>
                  Turns messy health documents and old conversations into searchable, useful memory that the AI can cite honestly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── component ──────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const { isSignedIn } = useAuthSafe()
  useScrollReveal()
  const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(`Just tried ${CONFIG.APP_NAME} — a voice AI that provides healthcare guidance in 30+ languages. Perfect for rural India! ${CONFIG.APP_X_HANDLE}`)}&url=${encodeURIComponent(CONFIG.APP_BASE_URL)}`

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#fffdf9' }}>
      {/* ───────── Sticky Nav ───────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(27,19,13,0.92)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart
              className="w-6 h-6"
              style={{ color: t.copper }}
              fill="currentColor"
            />
            <span
              className="text-lg tracking-tight"
              style={{ ...serif, color: t.heroHeading }}
            >
              AarogyaVaani
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-sm transition-colors"
              style={{ color: t.heroBody }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.heroBody)}
            >
              Dashboard
            </Link>
            <a
              href="#features"
              className="text-sm transition-colors hidden sm:inline"
              style={{ color: t.heroBody }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.heroBody)}
            >
              Features
            </a>
            {CLERK_AVAILABLE && isSignedIn ? (
              <>
                <Link
                  to="/call"
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2 transition-all"
                  style={{
                    background: t.primaryBtnBg,
                    color: t.primaryBtnText,
                    borderRadius: '999px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(45 97% 92%)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = t.primaryBtnBg
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Start Call
                </Link>
                <UserButton />
              </>
            ) : CLERK_AVAILABLE ? (
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2 transition-all cursor-pointer"
                  style={{
                    background: t.primaryBtnBg,
                    color: t.primaryBtnText,
                    borderRadius: '999px',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(45 97% 92%)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = t.primaryBtnBg
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <Link
                to="/call"
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2 transition-all"
                style={{
                  background: t.primaryBtnBg,
                  color: t.primaryBtnText,
                  borderRadius: '999px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(45 97% 92%)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = t.primaryBtnBg
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Phone className="w-4 h-4" />
                Start Call
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ───────── Hero ───────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: t.heroBg }}
      >
        {/* atmospheric noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 70% 30%, rgba(198,117,12,0.10), transparent 50%), radial-gradient(circle at 20% 80%, rgba(198,117,12,0.06), transparent 40%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-36 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* eyebrow pill */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm mb-8"
              style={{
                border: `1px solid ${t.heroPillBorder}`,
                borderRadius: '999px',
                color: t.heroPillText,
              }}
            >
              <Mic className="w-3.5 h-3.5" />
              Powered by Vapi + Qdrant AI
            </div>

            {/* headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight"
              style={{ ...serif, color: t.heroHeading }}
            >
              Healthcare guidance{' '}
              <br className="hidden sm:block" />
              <span style={{ color: t.copper, fontStyle: 'italic' }}>
                in your voice
              </span>
            </h1>

            {/* sub */}
            <p
              className="text-lg sm:text-xl mt-7 max-w-2xl mx-auto leading-relaxed"
              style={{ color: t.heroBody }}
            >
              AarogyaVaani is a voice-first AI assistant that provides
              accessible healthcare information in{' '}
              <AnimatedLangWord /> — designed for rural India where
              reading apps isn't an option.
            </p>

            {/* buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
              <Link
                to="/call"
                className="flex items-center gap-2.5 text-base font-semibold px-8 py-3.5 transition-all"
                style={{
                  background: t.primaryBtnBg,
                  color: t.primaryBtnText,
                  borderRadius: '999px',
                  boxShadow: '0 8px 30px rgba(198,117,12,0.18)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow =
                    '0 12px 36px rgba(198,117,12,0.28)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow =
                    '0 8px 30px rgba(198,117,12,0.18)'
                }}
              >
                <Phone className="w-5 h-5" />
                Talk to AarogyaVaani
              </Link>

              <a
                href="#features"
                className="flex items-center gap-2 text-base font-medium px-7 py-3.5 transition-all"
                style={{
                  border: `1px solid ${t.ghostBorder}`,
                  borderRadius: '999px',
                  color: t.ghostText,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = t.ghostBorder
                }}
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* ── animated multilingual conversation demo ── */}
          <ChatDemo />
        </div>

        {/* bottom fade from hero into light section */}
        <div
          className="h-24 w-full"
          style={{
            background:
              'linear-gradient(180deg, transparent, #fff8f1)',
          }}
        />
      </section>

      <MemoryDemo />

      {/* ───────── Features (light) ───────── */}
      <section id="features" className="py-24" style={{ background: t.lightSectionBg }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl tracking-tight"
              style={{ ...serif, color: '#1b130d' }}
            >
              Built for real impact
            </h2>
            <p
              className="mt-4 text-base max-w-xl mx-auto leading-relaxed"
              style={{ color: 'hsl(28 20% 42%)' }}
            >
              Voice-first, multilingual, and designed with empathy for
              users who can't read apps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="rounded-xl p-7 transition-all duration-300 cursor-default group"
                  style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = t.cardHoverBorder
                    e.currentTarget.style.boxShadow = t.cardHoverShadow
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = t.cardBorder
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'hsl(32 60% 94%)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: t.copper }} />
                  </div>
                  <h3
                    className="font-semibold mb-3"
                    style={{ color: '#1b130d', fontSize: '1.05rem' }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-loose"
                    style={{ color: 'hsl(28 15% 46%)' }}
                  >
                    {f.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────── How It Works (light) ───────── */}
      <section className="py-24" style={{ background: '#fffdf9' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl tracking-tight"
              style={{ ...serif, color: '#1b130d' }}
            >
              How it works
            </h2>
            <p
              className="mt-4 text-base"
              style={{ color: 'hsl(28 20% 42%)' }}
            >
              Three steps to accessible healthcare guidance.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-5xl mb-5 tracking-tight"
                  style={{
                    ...serif,
                    color: 'hsl(32 40% 82%)',
                    fontStyle: 'italic',
                  }}
                >
                  {s.num}
                </div>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: '#1b130d' }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-loose"
                  style={{ color: 'hsl(28 15% 46%)' }}
                >
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Tech Stack ───────── */}
      <section data-reveal style={{ background: 'linear-gradient(180deg, #fff8f1, #fffdf9)', padding: '5rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '40rem', marginInline: 'auto' }}>
            <h2 style={{ ...serif, fontSize: 'clamp(1.95rem, 4vw, 2.9rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
              Powered by <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>serious tech</span>
            </h2>
            <p style={{ color: 'hsl(45 21% 40%)', marginTop: '0.95rem', fontSize: '1rem', lineHeight: 1.7 }}>
              Every piece chosen for a reason. Hover to see how each technology powers AarogyaVaani.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', maxWidth: '56rem', margin: '0 auto' }}>
            {[
              { name: 'Vapi', icon: '🎙️', color: '#6366f1', tooltip: 'Voice AI orchestrator — handles real-time phone calls, turn-taking, and speech pipeline coordination across 30+ languages.' },
              { name: 'GPT-4o', icon: '🧠', color: '#10a37f', tooltip: 'LLM brain — generates empathetic, medically-grounded responses using RAG context from Qdrant and user memory.' },
              { name: 'Qdrant', icon: '🔷', color: '#dc2626', tooltip: 'Vector database — stores health knowledge, user memories, and uploaded report embeddings for semantic search and recall.' },
              { name: 'Deepgram', icon: '🔊', color: '#13ef93', tooltip: 'Speech-to-text — real-time transcription with Asteria voice model for low-latency, natural-sounding AI speech.' },
              { name: 'ElevenLabs', icon: '🗣️', color: '#000', tooltip: 'Text-to-speech fallback — high-quality multilingual voice synthesis for natural conversation output.' },
              { name: 'FastAPI', icon: '⚡', color: '#009688', tooltip: 'Backend framework — serves all API endpoints, Vapi webhooks, report processing, and Qdrant queries with async Python.' },
              { name: 'HuggingFace', icon: '🤗', color: '#ff9d00', tooltip: 'E5 embedding model — converts health text and user queries into vectors for semantic search in Qdrant.' },
              { name: 'React', icon: '⚛️', color: '#61dafb', tooltip: 'Frontend framework — powers the SPA with call interface, dashboard, history, doctor mode, and report uploads.' },
              { name: 'Python', icon: '🐍', color: '#3776ab', tooltip: 'Backend language — runs all server logic, PDF parsing, embedding generation, and LLM orchestration.' },
              { name: 'Vercel', icon: '▲', color: '#000', tooltip: 'Deployment platform — hosts both frontend SPA and serverless Python backend with edge caching and instant deploys.' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="tech-stack-chip"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,241,0.98))',
                  border: '1px solid rgba(34,22,14,0.08)',
                  boxShadow: '0 4px 16px rgba(76,46,18,0.06)',
                  cursor: 'default',
                  transition: 'all 220ms ease',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'hsl(28 45% 15%)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.borderColor = tech.color
                  e.currentTarget.style.boxShadow = `0 8px 28px ${tech.color}22`
                  e.currentTarget.querySelector('.tech-tooltip').style.opacity = '1'
                  e.currentTarget.querySelector('.tech-tooltip').style.transform = 'translateY(0)'
                  e.currentTarget.querySelector('.tech-tooltip').style.pointerEvents = 'auto'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(34,22,14,0.08)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(76,46,18,0.06)'
                  e.currentTarget.querySelector('.tech-tooltip').style.opacity = '0'
                  e.currentTarget.querySelector('.tech-tooltip').style.transform = 'translateY(6px)'
                  e.currentTarget.querySelector('.tech-tooltip').style.pointerEvents = 'none'
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>{tech.icon}</span>
                {tech.name}
                <div
                  className="tech-tooltip"
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    left: '50%',
                    transform: 'translateX(-50%) translateY(6px)',
                    width: '260px',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.85rem',
                    background: 'hsl(28 45% 12%)',
                    color: 'hsl(45 21% 90%)',
                    fontSize: '0.8rem',
                    lineHeight: 1.55,
                    fontWeight: 400,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'opacity 220ms ease, transform 220ms ease',
                    zIndex: 10,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'hsl(45 97% 76%)' }}>{tech.name}</div>
                  {tech.tooltip}
                  <div style={{
                    position: 'absolute',
                    bottom: '-5px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '10px',
                    height: '10px',
                    background: 'hsl(28 45% 12%)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Dark CTA Section ───────── */}
      <section
        className="relative py-28 overflow-hidden"
        style={{ background: t.ctaBg }}
      >
        {/* extra atmospheric glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 80%, rgba(198,117,12,0.10), transparent 40%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl sm:text-5xl tracking-tight"
            style={{ ...serif, color: t.heroHeading }}
          >
            Ready to try{' '}
            <span style={{ color: t.copper, fontStyle: 'italic' }}>
              AarogyaVaani
            </span>
            ?
          </h2>
          <p
            className="mt-5 text-lg"
            style={{ color: t.heroBody }}
          >
            Free. No sign-up needed. Just click and talk.
          </p>
          <Link
            to="/call"
            className="inline-flex items-center gap-2.5 text-base font-semibold px-9 py-4 mt-10 transition-all"
            style={{
              background: t.primaryBtnBg,
              color: t.primaryBtnText,
              borderRadius: '999px',
              boxShadow: '0 8px 30px rgba(198,117,12,0.22)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow =
                '0 14px 40px rgba(198,117,12,0.32)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow =
                '0 8px 30px rgba(198,117,12,0.22)'
            }}
          >
            <Phone className="w-5 h-5" />
            Start Your First Call
          </Link>
        </div>
      </section>

      {/* ───────── Use Cases ───────── */}
      <section data-reveal style={{ background: 'linear-gradient(180deg, #fff8f1, #fffdf9)', padding: '5rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.25rem', maxWidth: '40rem', marginInline: 'auto' }}>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.95rem, 4vw, 2.9rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.02em', lineHeight: 1.12, textWrap: 'balance' }}>
              Who is <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>AarogyaVaani</span> for?
            </h2>
            <p style={{ color: 'hsl(45 21% 40%)', marginTop: '0.95rem', fontSize: '1rem', lineHeight: 1.7, letterSpacing: '0.005em', textWrap: 'pretty' }}>Real healthcare guidance for real people — no app, no reading, just your voice.</p>
          </div>
          <div className="landing-usecase-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
            {[
              { icon: '🩺', title: 'Diabetes Patients', tagline: 'शुगर की देखभाल', desc: 'Daily diet guidance, blood sugar tracking reminders, medicine schedules, and when to see a doctor — all explained simply.' },
              { icon: '🤰', title: 'Expecting Mothers', tagline: 'माँ और बच्चे की सुरक्षा', desc: 'Antenatal care guidance, nutrition tips, danger signs to watch for, and how to access Janani Suraksha Yojana benefits.' },
              { icon: '👴', title: 'Elderly Care', tagline: 'बुज़ुर्गों का सहारा', desc: 'No apps to learn — just call and talk. Remembers past conversations, speaks slowly, confirms understanding every step.' },
              { icon: '🏛️', title: 'Government Schemes', tagline: 'सरकारी योजनाओं की जानकारी', desc: 'Ayushman Bharat card, PM-JAY, health helplines — step-by-step guidance to access free healthcare benefits.' },
              { icon: '👨‍⚕️', title: 'Doctors & Pharmacists', tagline: 'मरीज़ की पूरी जानकारी', desc: 'Doctor Mode summarizes patient history, uploaded reports, medications, and conditions into a clinical brief — instantly.' },
              { icon: '💊', title: 'Medicine Tracking', tagline: 'दवाइयों की याद', desc: 'Upload prescriptions or medical reports. AI extracts medicine names, dosages, and conditions — stored for future reference.' },
              { icon: '🏥', title: 'Rural Health Workers', tagline: 'ग्रामीण स्वास्थ्य सेवा', desc: 'ASHA and ANM workers can quickly get protocol guidance, scheme details, and referral advice in their local language.' },
              { icon: '👶', title: 'Child Health & Nutrition', tagline: 'बच्चों की सेहत', desc: 'Vaccination schedules, growth milestones, nutrition advice, and when to seek urgent care for infants and toddlers.' },
            ].map((uc, i) => (
              <div key={uc.title} className="stagger-item landing-usecase-card" style={{
                padding: '1.6rem',
                borderRadius: '1.4rem',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))',
                border: '1px solid rgba(34, 22, 14, 0.08)',
                boxShadow: '0 26px 90px rgba(76, 46, 18, 0.08)',
                transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease',
                cursor: 'default',
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(158, 92, 31, 0.18)'; e.currentTarget.style.boxShadow = '0 22px 52px rgba(76, 46, 18, 0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(34, 22, 14, 0.08)'; e.currentTarget.style.boxShadow = '0 26px 90px rgba(76, 46, 18, 0.08)'; }}
              >
                <div style={{ width: '3rem', height: '3rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '1rem', background: 'rgba(198, 117, 12, 0.08)' }}>{uc.icon}</div>
                <h3 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '1.18rem', color: 'hsl(28 45% 15%)', marginBottom: '0.45rem', letterSpacing: '-0.015em', lineHeight: 1.15 }}>{uc.title}</h3>
                <p lang="hi" style={{ fontSize: '0.8rem', color: 'hsl(28 45% 57%)', fontStyle: 'italic', marginBottom: '0.85rem', letterSpacing: '0.01em' }}>{uc.tagline}</p>
                <p style={{ fontSize: '0.93rem', color: 'hsl(45 21% 40%)', lineHeight: 1.72, letterSpacing: '0.003em', marginTop: 'auto' }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Share on X CTA ───────── */}
      <section data-reveal style={{ background: '#fffdf9', padding: '5rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem',
            borderRadius: '1.4rem',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))',
            border: '1px solid rgba(34, 22, 14, 0.08)',
            boxShadow: '0 26px 90px rgba(76, 46, 18, 0.08)',
          }}>
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <h2 style={{ 
              fontFamily: '"Instrument Serif", Georgia, serif', 
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', 
              color: 'hsl(28 45% 15%)', 
              letterSpacing: '-0.02em',
              lineHeight: 1.12,
              marginBottom: '0.75rem',
            }}>
              Share your <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>experience</span>
            </h2>
            <p style={{ 
              color: 'hsl(45 21% 40%)', 
              fontSize: '1rem',
              maxWidth: '32rem',
              margin: '0 auto 2rem',
              lineHeight: 1.68,
              letterSpacing: '0.004em',
            }}>
              Tried AarogyaVaani? We'd love to hear from you! Share your experience on X and tag us.
            </p>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.9rem 2rem',
                borderRadius: '999px',
                background: '#000',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                transition: 'all 180ms ease',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-2px)'; 
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X @Kaushiks0
            </a>
            <p style={{ 
              marginTop: '1.5rem',
              fontSize: '0.85rem',
              color: 'hsl(45 21% 55%)',
            }}>
              Your feedback helps us improve healthcare access for millions
            </p>
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" data-reveal style={{ background: 'linear-gradient(180deg, #fff8f1, #fffdf9)', padding: '5rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
              Simple, honest <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>pricing</span>
            </h2>
            <p style={{ color: 'hsl(45 21% 40%)', marginTop: '0.85rem', lineHeight: 1.65, letterSpacing: '0.004em' }}>Start free. Upgrade when your family needs more.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '56rem', margin: '0 auto' }}>
            {/* Free */}
            <div className="stagger-item" style={{ padding: '2.25rem', borderRadius: '1.4rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 26px 90px rgba(76,46,18,0.08)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(45 21% 40%)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Free</p>
              <div style={{ margin: '1.25rem 0' }}>
                <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '2.5rem', color: 'hsl(28 45% 15%)' }}>₹0</span>
                <span style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)' }}>/month</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)', marginBottom: '1.75rem', lineHeight: 1.6 }}>Get started with basic health guidance.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {['5 voice calls per month', 'Hindi & English', 'Basic health info', 'Government scheme guidance', 'Emergency helpline numbers'].map(f => (
                  <li key={f} style={{ fontSize: '0.85rem', color: 'hsl(28 45% 15%)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'hsl(28 45% 57%)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/call" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: '999px', border: '1px solid rgba(34,22,14,0.15)', color: 'hsl(28 45% 15%)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'all 180ms ease' }}>Start Free</Link>
            </div>
            {/* Pro */}
            <div className="stagger-item" style={{ padding: '2.25rem', borderRadius: '1.4rem', background: 'linear-gradient(180deg, hsl(28 45% 13%), hsl(28 45% 10%))', border: '1px solid hsl(28 45% 20%)', boxShadow: '0 36px 120px rgba(16,9,4,0.28)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'hsl(28 45% 57%)', color: 'white', padding: '0.25rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>Most Popular</span>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(45 21% 65%)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pro</p>
              <div style={{ margin: '1.25rem 0' }}>
                <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '2.5rem', color: 'hsl(45 21% 95%)' }}>₹299</span>
                <span style={{ fontSize: '0.85rem', color: 'hsl(45 21% 65%)' }}>/month</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'hsl(28 45% 57%)', marginBottom: '0.6rem' }}>₹2,499/year — save 30%</p>
              <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 65%)', marginBottom: '1.75rem', lineHeight: 1.6 }}>Complete healthcare companion for your family.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {['Unlimited voice calls', '30+ languages supported', 'Full conversation memory', 'Family profiles (up to 5)', 'Call history & export', 'Auto health tasks + calendar', 'Monthly health reports', 'Priority response queue'].map(f => (
                  <li key={f} style={{ fontSize: '0.85rem', color: 'hsl(45 21% 95% / 0.85)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'hsl(28 45% 57%)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/call" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: '999px', background: 'hsl(28 45% 57%)', color: 'white', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'all 180ms ease', boxShadow: '0 24px 48px rgba(188,126,65,0.22)' }}>Start Pro Trial</Link>
            </div>
            {/* Enterprise */}
            <div className="stagger-item" style={{ padding: '2.25rem', borderRadius: '1.4rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 26px 90px rgba(76,46,18,0.08)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(45 21% 40%)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enterprise</p>
              <div style={{ margin: '1.25rem 0' }}>
                <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '2.5rem', color: 'hsl(28 45% 15%)' }}>Custom</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)', marginBottom: '1.75rem', lineHeight: 1.6 }}>For NGOs, hospitals, and government programs.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {['Everything in Pro', 'Custom knowledge base', 'White-label branding', 'API access', 'Dedicated support', 'SLA & compliance'].map(f => (
                  <li key={f} style={{ fontSize: '0.85rem', color: 'hsl(28 45% 15%)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'hsl(28 45% 57%)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@aarogyavaani.in" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: '999px', border: '1px solid rgba(34,22,14,0.15)', color: 'hsl(28 45% 15%)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'all 180ms ease' }}>Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section data-reveal style={{ background: '#fffdf9', padding: '5rem 0' }}>
        <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
              Frequently asked <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>questions</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { q: 'Is AarogyaVaani a real doctor?', a: 'No. AarogyaVaani is an AI health assistant that provides general health information and guidance. It is not a substitute for professional medical advice. For any serious condition, we always recommend visiting your nearest doctor or hospital.' },
              { q: 'What languages does it support?', a: 'AarogyaVaani supports 30+ languages including Hindi, English, Kannada, Tamil, Telugu, Bengali, Marathi, Gujarati, Urdu, and many more. The AI automatically detects which language you\'re speaking and responds naturally.' },
              { q: 'Is my health data safe?', a: 'Your conversations are stored securely and used only to provide better guidance in future calls. We do not share your data with third parties. You can request deletion of your data at any time.' },
              { q: 'How much does it cost?', a: 'AarogyaVaani offers a free tier with 5 calls per month. For unlimited access, family profiles, and health reports, the Pro plan is ₹299/month or ₹2,499/year.' },
              { q: 'Can my whole family use this?', a: 'Yes! With the Pro plan, you can create up to 5 family member profiles. Each family member gets their own health history and personalized guidance.' },
              { q: 'What if there\'s a medical emergency?', a: 'AarogyaVaani will immediately tell you to call 108 (ambulance) or go to the nearest hospital. It never delays emergency care with questions. For emergencies, always call 108 first.' },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer
        className="py-10"
        style={{
          background: '#fffdf9',
          borderTop: '1px solid rgba(34,22,14,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart
              className="w-5 h-5"
              style={{ color: t.copper }}
              fill="currentColor"
            />
            <span
              className="text-sm"
              style={{ ...serif, color: '#1b130d' }}
            >
              AarogyaVaani
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: t.footerText }}>
            <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
            <Link to="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</Link>
            <span>Built for HackBLR 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
