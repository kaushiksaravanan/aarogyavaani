import { Link } from 'react-router-dom'
import { Phone, Heart, ArrowRight, Mic, MessageCircle, Globe, Brain, Clock, Shield } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

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

/* ─── FAQ accordion item ─────────────────────────────────────────── */

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
        style={{
          width: '100%', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 500, color: 'hsl(28 45% 15%)',
        }}
      >
        {q}
        <span style={{
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'transform 280ms ease',
          fontSize: '1.25rem', color: 'hsl(28 45% 57%)', flexShrink: 0, marginLeft: '1rem',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? '200px' : '0',
        opacity: open ? 1 : 0,
        padding: open ? '0 1.25rem 1rem' : '0 1.25rem',
        overflow: 'hidden',
        transition: 'max-height 380ms ease, opacity 280ms ease, padding 280ms ease',
      }}>
        <p style={{ fontSize: '0.875rem', color: 'hsl(45 21% 40%)', lineHeight: 1.7 }}>{a}</p>
      </div>
    </div>
  )
}

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

      {/* ───────── Use Cases ───────── */}
      <section data-reveal style={{ background: 'linear-gradient(180deg, #fff8f1, #fffdf9)', padding: '5rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.035em' }}>
              Who is <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>AarogyaVaani</span> for?
            </h2>
            <p style={{ color: 'hsl(45 21% 40%)', marginTop: '0.75rem' }}>Real healthcare guidance for real people — no app, no reading, just your voice.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '🩺', title: 'Diabetes Patients', tagline: 'शुगर की देखभाल', desc: 'Daily diet guidance, blood sugar tracking reminders, medicine schedules, and when to see a doctor — all explained simply.' },
              { icon: '🤰', title: 'Expecting Mothers', tagline: 'माँ और बच्चे की सुरक्षा', desc: 'Antenatal care guidance, nutrition tips, danger signs to watch for, and how to access Janani Suraksha Yojana benefits.' },
              { icon: '👴', title: 'Elderly Care', tagline: 'बुज़ुर्गों का सहारा', desc: 'No apps to learn — just call and talk. Remembers past conversations, speaks slowly, confirms understanding every step.' },
              { icon: '🏛️', title: 'Government Schemes', tagline: 'सरकारी योजनाओं की जानकारी', desc: 'Ayushman Bharat card, PM-JAY, health helplines — step-by-step guidance to access free healthcare benefits.' },
            ].map((uc, i) => (
              <div key={uc.title} className="stagger-item" style={{
                padding: '1.5rem',
                borderRadius: '1.4rem',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))',
                border: '1px solid rgba(34, 22, 14, 0.08)',
                boxShadow: '0 26px 90px rgba(76, 46, 18, 0.08)',
                transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(158, 92, 31, 0.16)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(34, 22, 14, 0.08)'; }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{uc.icon}</div>
                <h3 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '1.25rem', color: 'hsl(28 45% 15%)', marginBottom: '0.25rem' }}>{uc.title}</h3>
                <p lang="hi" style={{ fontSize: '0.8rem', color: 'hsl(28 45% 57%)', fontStyle: 'italic', marginBottom: '0.75rem' }}>{uc.tagline}</p>
                <p style={{ fontSize: '0.875rem', color: 'hsl(45 21% 40%)', lineHeight: 1.6 }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section data-reveal style={{ background: '#fffdf9', padding: '5rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.035em' }}>
              Voices from the <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>community</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[
              { name: 'Ramesh Kumar', detail: '58, Farmer, Uttar Pradesh', quote: '"Pehle mujhe doctor ke paas jaane mein dar lagta tha. Ab main AarogyaVaani ko phone karta hoon — woh meri baat samajhti hai aur simple mein batati hai ki kya karna hai. Meri sugar ab control mein hai."', stars: 5 },
              { name: 'Sunita Devi', detail: '32, Expecting Mother, Rajasthan', quote: '"Mere gaon mein koi lady doctor nahi hai. AarogyaVaani ne mujhe bataya ki pregnancy mein kya khana chahiye aur kab hospital jaana chahiye. Mera beta healthy paida hua."', stars: 5 },
              { name: 'Lakshmi Amma', detail: '72, Grandmother, Karnataka', quote: '"Nange phone app use maadoke bartilla. AarogyaVaani jote Kannada-alli maataadtaare, nanna health bagge keluttaare, idu nange thumba sahaya aagide."', stars: 5 },
            ].map((t, i) => (
              <div key={t.name} className="stagger-item" style={{
                padding: '1.75rem',
                borderRadius: '1.4rem',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))',
                border: '1px solid rgba(34, 22, 14, 0.08)',
                boxShadow: '0 26px 90px rgba(76, 46, 18, 0.08)',
              }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <span key={si} style={{ color: 'hsl(28 45% 57%)', fontSize: '1rem' }}>★</span>
                  ))}
                </div>
                <p lang={t.name === 'Lakshmi Amma' ? 'kn' : 'hi'} style={{ fontSize: '0.9rem', color: 'hsl(28 45% 15%)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '1.25rem' }}>{t.quote}</p>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(28 45% 15%)' }}>{t.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(45 21% 40%)' }}>{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" data-reveal style={{ background: 'linear-gradient(180deg, #fff8f1, #fffdf9)', padding: '5rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.035em' }}>
              Simple, honest <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>pricing</span>
            </h2>
            <p style={{ color: 'hsl(45 21% 40%)', marginTop: '0.75rem' }}>Start free. Upgrade when your family needs more.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', maxWidth: '56rem', margin: '0 auto' }}>
            {/* Free */}
            <div className="stagger-item" style={{ padding: '2rem', borderRadius: '1.4rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 26px 90px rgba(76,46,18,0.08)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(45 21% 40%)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Free</p>
              <div style={{ margin: '1rem 0' }}>
                <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '2.5rem', color: 'hsl(28 45% 15%)' }}>₹0</span>
                <span style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)' }}>/month</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)', marginBottom: '1.5rem' }}>Get started with basic health guidance.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['5 voice calls per month', 'Hindi & English', 'Basic health info', 'Government scheme guidance', 'Emergency helpline numbers'].map(f => (
                  <li key={f} style={{ fontSize: '0.85rem', color: 'hsl(28 45% 15%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'hsl(28 45% 57%)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="/call" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: '999px', border: '1px solid rgba(34,22,14,0.15)', color: 'hsl(28 45% 15%)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'all 180ms ease' }}>Start Free</a>
            </div>
            {/* Pro */}
            <div className="stagger-item" style={{ padding: '2rem', borderRadius: '1.4rem', background: 'linear-gradient(180deg, hsl(28 45% 13%), hsl(28 45% 10%))', border: '1px solid hsl(28 45% 20%)', boxShadow: '0 36px 120px rgba(16,9,4,0.28)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'hsl(28 45% 57%)', color: 'white', padding: '0.25rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>Most Popular</span>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(45 21% 65%)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pro</p>
              <div style={{ margin: '1rem 0' }}>
                <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '2.5rem', color: 'hsl(45 21% 95%)' }}>₹299</span>
                <span style={{ fontSize: '0.85rem', color: 'hsl(45 21% 65%)' }}>/month</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'hsl(28 45% 57%)', marginBottom: '0.5rem' }}>₹2,499/year — save 30%</p>
              <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 65%)', marginBottom: '1.5rem' }}>Complete healthcare companion for your family.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Unlimited voice calls', 'Hindi, English & Kannada', 'Full conversation memory', 'Family profiles (up to 5)', 'Call history & export', 'Auto health tasks + calendar', 'Monthly health reports', 'Priority response queue'].map(f => (
                  <li key={f} style={{ fontSize: '0.85rem', color: 'hsl(45 21% 95% / 0.85)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'hsl(28 45% 57%)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="/call" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: '999px', background: 'hsl(28 45% 57%)', color: 'white', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'all 180ms ease', boxShadow: '0 24px 48px rgba(188,126,65,0.22)' }}>Start Pro Trial</a>
            </div>
            {/* Enterprise */}
            <div className="stagger-item" style={{ padding: '2rem', borderRadius: '1.4rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))', border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 26px 90px rgba(76,46,18,0.08)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(45 21% 40%)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enterprise</p>
              <div style={{ margin: '1rem 0' }}>
                <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '2.5rem', color: 'hsl(28 45% 15%)' }}>Custom</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)', marginBottom: '1.5rem' }}>For NGOs, hospitals, and government programs.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Everything in Pro', 'Custom knowledge base', 'White-label branding', 'API access', 'Dedicated support', 'SLA & compliance'].map(f => (
                  <li key={f} style={{ fontSize: '0.85rem', color: 'hsl(28 45% 15%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.035em' }}>
              Frequently asked <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>questions</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { q: 'Is AarogyaVaani a real doctor?', a: 'No. AarogyaVaani is an AI health assistant that provides general health information and guidance. It is not a substitute for professional medical advice. For any serious condition, we always recommend visiting your nearest doctor or hospital.' },
              { q: 'What languages does it support?', a: 'Currently Hindi, English, and Kannada. The AI automatically detects which language you\'re speaking and responds in the same language. More languages are coming soon.' },
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
