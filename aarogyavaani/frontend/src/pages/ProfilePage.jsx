import { useState, useEffect, useRef } from 'react'
import { User, Save, Plus, X, Heart, Check } from 'lucide-react'

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
  borderFocus: 'hsl(28 45% 57%)',
  shadow: '0 26px 90px rgba(76, 46, 18, 0.08)',
  surface: '#fffdf9',
  success: '#00a544',
}
const serif = { fontFamily: '"Instrument Serif", Georgia, serif' }

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'Pregnancy', 'Heart Disease', 'Asthma',
  'Arthritis', 'Eye Problems', 'Kidney Issues', 'Thyroid', 'None',
]

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Grandchild', 'Other',
]

const STORAGE_KEY = 'aarogyavaani_profile'

const defaultProfile = {
  name: '',
  age: '',
  gender: '',
  language: 'hi',
  conditions: [],
  familyMembers: [],
}

function WarmInput({ label, value, onChange, placeholder, type = 'text', style: extraStyle, ...rest }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ width: '100%', ...extraStyle }}>
      {label && (
        <label style={{
          display: 'block', fontSize: '0.8rem', fontWeight: 500,
          color: t.soft, marginBottom: '0.35rem',
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          border: `1px solid ${focused ? t.borderFocus : t.border}`,
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
          color: t.espresso,
          background: t.surface,
          transition: 'border-color 180ms ease',
          boxSizing: 'border-box',
        }}
        {...rest}
      />
    </div>
  )
}

function WarmSelect({ label, value, onChange, children, style: extraStyle }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ width: '100%', ...extraStyle }}>
      {label && (
        <label style={{
          display: 'block', fontSize: '0.8rem', fontWeight: 500,
          color: t.soft, marginBottom: '0.35rem',
        }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          border: `1px solid ${focused ? t.borderFocus : t.border}`,
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
          color: t.espresso,
          background: t.surface,
          cursor: 'pointer',
          transition: 'border-color 180ms ease',
          boxSizing: 'border-box',
          appearance: 'auto',
        }}
      >
        {children}
      </select>
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return { ...defaultProfile, ...stored }
    } catch {
      return { ...defaultProfile }
    }
  })
  const [toast, setToast] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', relationship: '', age: '' })
  const toastTimeout = useRef(null)

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }))

  const toggleCondition = (c) => {
    setProfile(p => {
      // If selecting "None", clear all others
      if (c === 'None') {
        return { ...p, conditions: p.conditions.includes('None') ? [] : ['None'] }
      }
      // If selecting a condition, remove "None"
      const without = p.conditions.filter(x => x !== 'None')
      return {
        ...p,
        conditions: without.includes(c) ? without.filter(x => x !== c) : [...without, c],
      }
    })
  }

  const addFamilyMember = () => {
    if (!newMember.name.trim()) return
    setProfile(p => ({
      ...p,
      familyMembers: [...p.familyMembers, { ...newMember, id: Date.now() }],
    }))
    setNewMember({ name: '', relationship: '', age: '' })
  }

  const removeMember = (id) => {
    setProfile(p => ({ ...p, familyMembers: p.familyMembers.filter(m => m.id !== id) }))
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    // Clear any existing toast timer
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast(true)
    toastTimeout.current = setTimeout(() => setToast(false), 3000)
  }

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current)
    }
  }, [])

  return (
    <div style={{ background: t.surface, minHeight: '100vh', padding: '2rem', position: 'relative' }}>
      {/* Success Toast */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          transform: toast ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 320ms ease, opacity 320ms ease',
          opacity: toast ? 1 : 0,
          pointerEvents: toast ? 'auto' : 'none',
        }}
      >
        <div style={{
          background: t.success, color: 'white',
          padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          fontSize: '0.875rem', fontWeight: 500,
          boxShadow: '0 4px 14px rgba(0, 165, 68, 0.25)',
        }}>
          <Check style={{ width: 16, height: 16 }} />
          Profile saved successfully
        </div>
      </div>

      <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ ...serif, fontSize: '2rem', color: t.espresso, letterSpacing: '-0.035em', lineHeight: 1.05 }}>
            Health Profile
          </h1>
          <p style={{ color: t.soft, fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Help AarogyaVaani give you better, personalized guidance
          </p>
        </div>

        {/* Basic Information */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.border}`,
          borderRadius: '1.4rem', padding: '1.75rem',
          boxShadow: t.shadow, marginBottom: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: t.espresso, marginBottom: '1.25rem' }}>
            Basic Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <WarmInput
              label="Display Name"
              value={profile.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Your name"
              style={{ gridColumn: '1 / -1' }}
            />
            <WarmInput
              label="Age"
              value={profile.age}
              onChange={e => update('age', e.target.value)}
              placeholder="e.g. 55"
              type="number"
              min="0"
              max="150"
            />
            <WarmSelect
              label="Gender"
              value={profile.gender}
              onChange={e => update('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </WarmSelect>
            <WarmSelect
              label="Preferred Language"
              value={profile.language}
              onChange={e => update('language', e.target.value)}
              style={{ gridColumn: '1 / -1' }}
            >
              <option value="hi">Hindi</option>
              <option value="en">English</option>
              <option value="kn">Kannada</option>
            </WarmSelect>
          </div>
        </div>

        {/* Known Health Conditions */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.border}`,
          borderRadius: '1.4rem', padding: '1.75rem',
          boxShadow: t.shadow, marginBottom: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: t.espresso, marginBottom: '0.35rem' }}>
            Known Health Conditions
          </h2>
          <p style={{ fontSize: '0.8rem', color: t.muted, marginBottom: '1rem' }}>
            Select all that apply
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.6rem',
          }}>
            {CONDITIONS.map(c => {
              const active = profile.conditions.includes(c)
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.82rem', fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                    border: active ? `1.5px solid ${t.copper}` : `1px solid ${t.border}`,
                    background: active ? t.pillBg : 'transparent',
                    color: active ? t.pillColor : t.soft,
                    textAlign: 'left',
                  }}
                >
                  {/* Checkbox indicator */}
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: active ? 'none' : `1.5px solid ${t.border}`,
                    background: active ? t.copper : 'transparent',
                    transition: 'all 180ms ease',
                  }}>
                    {active && <Check style={{ width: 11, height: 11, color: 'white', strokeWidth: 3 }} />}
                  </span>
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        {/* Family Members */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.border}`,
          borderRadius: '1.4rem', padding: '1.75rem',
          boxShadow: t.shadow, marginBottom: '1.75rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: t.espresso, marginBottom: '0.35rem' }}>
            Family Members
          </h2>
          <p style={{ fontSize: '0.8rem', color: t.muted, marginBottom: '1rem' }}>
            Add family members for comprehensive health tracking
          </p>

          {/* Member list */}
          {profile.familyMembers.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {profile.familyMembers.map((m, idx) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.75rem',
                    background: idx % 2 === 0 ? 'rgba(34,22,14,0.02)' : 'transparent',
                    marginBottom: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: t.pillBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User style={{ width: 15, height: 15, color: t.copper }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: t.espresso, fontWeight: 500 }}>
                        {m.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: t.soft, marginLeft: '0.5rem' }}>
                        {m.relationship}{m.age ? `, age ${m.age}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMember(m.id)}
                    title="Remove member"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0.35rem', borderRadius: '0.5rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 180ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,22,14,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                  >
                    <X style={{ width: 16, height: 16, color: t.muted }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add member form */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 0.8fr auto',
            gap: '0.6rem', alignItems: 'end',
          }}>
            <WarmInput
              label="Name"
              value={newMember.name}
              onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
              placeholder="Member name"
            />
            <WarmSelect
              label="Relationship"
              value={newMember.relationship}
              onChange={e => setNewMember(p => ({ ...p, relationship: e.target.value }))}
            >
              <option value="">Select</option>
              {RELATIONSHIPS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </WarmSelect>
            <WarmInput
              label="Age"
              value={newMember.age}
              onChange={e => setNewMember(p => ({ ...p, age: e.target.value }))}
              placeholder="Age"
              type="number"
              min="0"
              max="150"
            />
            <button
              onClick={addFamilyMember}
              title="Add family member"
              style={{
                background: t.copper, color: 'white', border: 'none',
                borderRadius: '0.75rem', padding: '0.75rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 180ms ease',
                boxShadow: '0 4px 14px rgba(188, 126, 65, 0.18)',
                alignSelf: 'end', height: 'fit-content',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = t.copperStrong
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = t.copper
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Plus style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={save}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: t.copper, color: 'white', border: 'none',
            borderRadius: '999px',
            padding: '0.85rem 2.25rem',
            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 24px 48px rgba(188, 126, 65, 0.22)',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = t.copperStrong
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = t.copper
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Save style={{ width: 16, height: 16 }} />
          Save Profile
        </button>
      </div>
    </div>
  )
}
