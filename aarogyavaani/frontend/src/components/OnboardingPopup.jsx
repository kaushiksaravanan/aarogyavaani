import { useState, useEffect } from 'react'
import { Heart, ArrowRight, Check, X, User, Globe, Stethoscope } from 'lucide-react'

const STORAGE_KEY = 'aarogyavaani_profile'
const ONBOARDING_KEY = 'aarogyavaani_onboarded'

const t = {
  espresso: 'hsl(28 45% 15%)',
  soft: 'hsl(45 21% 40%)',
  muted: 'hsl(45 21% 55%)',
  copper: 'hsl(28 45% 57%)',
  copperStrong: 'hsl(28 49% 49%)',
  pillBg: 'hsl(28 45% 57% / 0.12)',
  border: 'rgba(34, 22, 14, 0.08)',
  surface: '#fffdf9',
}
const serif = { fontFamily: '"Instrument Serif", Georgia, serif' }

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'Pregnancy', 'Heart Disease', 'Asthma',
  'Arthritis', 'Eye Problems', 'Kidney Issues', 'Thyroid', 'None',
]

const LANGUAGES = [
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
]

const steps = [
  { id: 'welcome', icon: Heart, title: 'Welcome to AarogyaVaani', subtitle: 'Let\'s set up your health profile in 30 seconds' },
  { id: 'basics', icon: User, title: 'About You', subtitle: 'Help us personalize your experience' },
  { id: 'language', icon: Globe, title: 'Your Language', subtitle: 'We\'ll speak to you in your preferred language' },
  { id: 'health', icon: Stethoscope, title: 'Health Conditions', subtitle: 'Select any conditions that apply to you' },
]

export default function OnboardingPopup() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [language, setLanguage] = useState('hi')
  const [conditions, setConditions] = useState([])

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDING_KEY)
    if (!onboarded) {
      // Short delay so the page renders first
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const toggleCondition = (c) => {
    if (c === 'None') {
      setConditions(prev => prev.includes('None') ? [] : ['None'])
    } else {
      setConditions(prev => {
        const without = prev.filter(x => x !== 'None')
        return without.includes(c) ? without.filter(x => x !== c) : [...without, c]
      })
    }
  }

  const finish = () => {
    const userId = 'user_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    const profile = {
      userId,
      name: name.trim(),
      age,
      gender,
      language,
      conditions,
      familyMembers: [],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    localStorage.setItem('aarogyavaani_user_id', userId)
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setClosing(true)
    setTimeout(() => setShow(false), 400)
  }

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setClosing(true)
    setTimeout(() => setShow(false), 400)
  }

  if (!show) return null

  const current = steps[step]
  const StepIcon = current.icon
  const isLast = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(27, 19, 13, 0.6)',
        backdropFilter: 'blur(8px)',
        opacity: closing ? 0 : 1,
        transition: 'opacity 400ms ease',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '28rem',
          background: '#fffdf9',
          borderRadius: '1.5rem',
          boxShadow: '0 40px 120px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(34, 22, 14, 0.06)',
          overflow: 'hidden',
          transform: closing ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          transition: 'transform 400ms ease',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(34, 22, 14, 0.06)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${t.copper}, ${t.copperStrong})`,
            transition: 'width 400ms ease',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '2rem 2rem 0', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: t.pillBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <StepIcon style={{ width: 26, height: 26, color: t.copper }} />
          </div>
          <h2 style={{ ...serif, fontSize: '1.6rem', color: t.espresso, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
            {current.title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: t.soft, lineHeight: 1.5 }}>
            {current.subtitle}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                background: 'rgba(198, 117, 12, 0.04)',
                borderRadius: '1rem', padding: '1.25rem',
                border: '1px solid rgba(198, 117, 12, 0.08)',
                textAlign: 'left', marginBottom: '0.5rem',
              }}>
                {[
                  'Personalized health guidance',
                  'Voice AI in your language',
                  'Remembers your history across calls',
                  'Upload reports for smarter advice',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: t.copper, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check style={{ width: 12, height: 12, color: 'white', strokeWidth: 3 }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: t.espresso }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Basics */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: t.soft, marginBottom: '0.35rem' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh, Priya"
                  autoFocus
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '0.75rem',
                    border: `1px solid ${t.border}`, fontSize: '0.9rem',
                    fontFamily: 'inherit', outline: 'none', width: '100%',
                    color: t.espresso, background: t.surface, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: t.soft, marginBottom: '0.35rem' }}>
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 45"
                    min="0" max="150"
                    style={{
                      padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      border: `1px solid ${t.border}`, fontSize: '0.9rem',
                      fontFamily: 'inherit', outline: 'none', width: '100%',
                      color: t.espresso, background: t.surface, boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: t.soft, marginBottom: '0.35rem' }}>
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      border: `1px solid ${t.border}`, fontSize: '0.9rem',
                      fontFamily: 'inherit', outline: 'none', width: '100%',
                      color: gender ? t.espresso : t.muted, background: t.surface,
                      boxSizing: 'border-box', cursor: 'pointer', appearance: 'auto',
                    }}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Language */}
          {step === 2 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem',
            }}>
              {LANGUAGES.map(lang => {
                const active = language === lang.code
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '0.25rem', padding: '1rem 0.75rem',
                      borderRadius: '1rem', cursor: 'pointer',
                      transition: 'all 200ms ease',
                      border: active ? `2px solid ${t.copper}` : `1px solid ${t.border}`,
                      background: active ? t.pillBg : 'transparent',
                    }}
                  >
                    <span style={{
                      fontSize: '1.1rem', fontWeight: 600,
                      color: active ? t.copper : t.espresso,
                    }}>
                      {lang.native}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: t.soft }}>
                      {lang.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 3: Health conditions */}
          {step === 3 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem',
            }}>
              {CONDITIONS.map(c => {
                const active = conditions.includes(c)
                return (
                  <button
                    key={c}
                    onClick={() => toggleCondition(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.75rem',
                      fontSize: '0.84rem', fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 180ms ease',
                      border: active ? `1.5px solid ${t.copper}` : `1px solid ${t.border}`,
                      background: active ? t.pillBg : 'transparent',
                      color: active ? t.copper : t.soft,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: active ? 'none' : `1.5px solid ${t.border}`,
                      background: active ? t.copper : 'transparent',
                      transition: 'all 180ms ease',
                    }}>
                      {active && <Check style={{ width: 12, height: 12, color: 'white', strokeWidth: 3 }} />}
                    </span>
                    {c}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 2rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={skip}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', color: t.muted,
              padding: '0.5rem 0',
            }}
          >
            Skip for now
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: '999px',
                  border: `1px solid ${t.border}`, background: 'transparent',
                  color: t.espresso, fontSize: '0.85rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 180ms ease',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(s => s + 1)}
              style={{
                padding: '0.65rem 1.5rem', borderRadius: '999px',
                border: 'none', background: t.copper, color: 'white',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                boxShadow: '0 8px 24px rgba(198, 117, 12, 0.2)',
                transition: 'all 180ms ease',
              }}
            >
              {isLast ? 'Get Started' : 'Continue'}
              {!isLast && <ArrowRight style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '0.4rem',
          paddingBottom: '1.25rem',
        }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6, height: 6,
                borderRadius: 3,
                background: i === step ? t.copper : 'rgba(34, 22, 14, 0.1)',
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
