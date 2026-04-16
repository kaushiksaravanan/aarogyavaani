import { Link } from 'react-router-dom'
import { Phone, Heart, ArrowRight, Mic, MessageCircle, Globe, Brain, Clock, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

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

/* ─── component ──────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

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
              accessible healthcare information in Hindi, English, and
              Kannada — designed for rural India where reading apps isn't
              an option.
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

          {/* ── conversation preview card ── */}
          <div className="mt-20 max-w-2xl mx-auto">
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background:
                  'linear-gradient(180deg, rgba(60,40,24,0.7) 0%, rgba(27,19,13,0.85) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow:
                  '0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* header bar */}
              <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#e05a3a' }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#d9a026' }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#4ca84c' }}
                />
                <span
                  className="ml-2 text-xs tracking-wide uppercase"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  Live Conversation
                </span>
              </div>

              {/* AI message */}
              <div className="flex items-start gap-3 mb-5">
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
                    नमस्ते! मैं आरोग्यवाणी हूं। बताइए, आज मैं आपकी क्या
                    मदद कर सकती हूं?
                  </p>
                </div>
              </div>

              {/* User message */}
              <div className="flex items-start gap-3 justify-end mb-5">
                <div
                  className="rounded-2xl rounded-tr-md px-4 py-3 max-w-sm"
                  style={{
                    background: t.copper,
                    boxShadow: '0 4px 16px rgba(198,117,12,0.25)',
                  }}
                >
                  <p className="text-sm leading-relaxed text-white">
                    मुझे शुगर है, खाने में क्या ध्यान रखना चाहिए?
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  <MessageCircle className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                </div>
              </div>

              {/* AI reply */}
              <div className="flex items-start gap-3">
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
                    बहुत अच्छा सवाल! शुगर में रोटी, दाल, हरी सब्ज़ियां
                    खाएं। चीनी और मीठा कम करें। करेला शुगर कम करने में
                    मदद करता है...
                  </p>
                </div>
              </div>
            </div>
          </div>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="rounded-xl p-6 transition-all duration-300 cursor-default group"
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
                    className="font-semibold mb-2"
                    style={{ color: '#1b130d' }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
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

          <div className="grid sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-5xl mb-4 tracking-tight"
                  style={{
                    ...serif,
                    color: 'hsl(32 40% 82%)',
                    fontStyle: 'italic',
                  }}
                >
                  {s.num}
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: '#1b130d' }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'hsl(28 15% 46%)' }}
                >
                  {s.description}
                </p>
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
            className="mt-4 text-lg"
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
          <p className="text-xs" style={{ color: t.footerText }}>
            Built for HackBLR 2026 — Vapi x Qdrant Hackathon
          </p>
        </div>
      </footer>
    </div>
  )
}
