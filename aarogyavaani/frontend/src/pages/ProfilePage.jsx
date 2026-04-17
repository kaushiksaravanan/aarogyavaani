import { useState, useEffect, useRef } from 'react'
import { User, Save, Plus, X, Heart, Check } from 'lucide-react'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, TextInput, SelectInput, Badge, StatusBanner, appTheme } from '../components/AppPrimitives'

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'Pregnancy', 'Heart Disease', 'Asthma',
  'Arthritis', 'Eye Problems', 'Kidney Issues', 'Thyroid', 'None',
]

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Grandchild', 'Other',
]

const STORAGE_KEY = 'aarogyavaani_profile'

const defaultProfile = {
  userId: `user_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
  name: '',
  age: '',
  gender: '',
  language: 'hi',
  conditions: [],
  familyMembers: [],
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      const merged = { ...defaultProfile, ...stored }
      if (!merged.userId) merged.userId = `user_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
      return merged
    } catch {
      return { ...defaultProfile }
    }
  })
  const [toast, setToast] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', relationship: '', age: '' })
  const toastTimeout = useRef(null)

  const update = (key, val) => setProfile((p) => ({ ...p, [key]: val }))

  const toggleCondition = (condition) => {
    setProfile((p) => {
      if (condition === 'None') {
        return { ...p, conditions: p.conditions.includes('None') ? [] : ['None'] }
      }
      const withoutNone = p.conditions.filter((x) => x !== 'None')
      return {
        ...p,
        conditions: withoutNone.includes(condition) ? withoutNone.filter((x) => x !== condition) : [...withoutNone, condition],
      }
    })
  }

  const addFamilyMember = () => {
    if (!newMember.name.trim()) return
    setProfile((p) => ({
      ...p,
      familyMembers: [...p.familyMembers, { ...newMember, id: Date.now() }],
    }))
    setNewMember({ name: '', relationship: '', age: '' })
  }

  const removeMember = (id) => {
    setProfile((p) => ({ ...p, familyMembers: p.familyMembers.filter((m) => m.id !== id) }))
  }

  const save = () => {
    const toSave = profile.userId ? profile : { ...profile, userId: `user_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}` }
    setProfile(toSave)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast(true)
    toastTimeout.current = setTimeout(() => setToast(false), 3000)
  }

  useEffect(() => {
    if (profile.userId) {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
        if (!stored.userId) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, userId: profile.userId }))
      } catch {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: profile.userId }))
      }
    }

    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current)
    }
  }, [profile.userId])

  return (
    <AppPage maxWidth="46rem">
      <PageHeader
        icon={User}
        eyebrow="Personalization"
        title="Health profile"
        subtitle="Help AarogyaVaani personalize advice, remember your health context, and carry that context across calls and reports."
        actions={<Badge tone="copper">Memory enabled</Badge>}
      />

      {toast ? <StatusBanner icon={Check} title="Profile saved" subtitle="Your user ID and preferences are now available across the app." tone="success" style={{ marginBottom: '1rem' }} /> : null}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <SurfaceCard title="Identity and preferences" icon={Heart}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ padding: '0.9rem 1rem', borderRadius: '1rem', background: 'rgba(198,117,12,0.08)', border: `1px solid ${appTheme.borderStrong}` }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: appTheme.copperStrong, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your user ID</div>
              <code style={{ display: 'block', marginTop: '0.35rem', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.84rem', color: appTheme.espresso }}>{profile.userId}</code>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Display name" value={profile.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" style={{ gridColumn: '1 / -1' }} />
              <TextInput label="Age" value={profile.age} onChange={(e) => update('age', e.target.value)} placeholder="e.g. 55" type="number" min="0" max="150" />
              <SelectInput label="Gender" value={profile.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </SelectInput>
              <SelectInput label="Preferred language" value={profile.language} onChange={(e) => update('language', e.target.value)} style={{ gridColumn: '1 / -1' }}>
                <option value="hi">Hindi</option>
                <option value="en">English</option>
                <option value="kn">Kannada</option>
              </SelectInput>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Known health conditions" icon={Heart}>
          <div style={{ fontSize: '0.82rem', color: appTheme.espressoSoft, marginBottom: '0.9rem' }}>Select all that apply.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.65rem' }}>
            {CONDITIONS.map((condition) => {
              const active = profile.conditions.includes(condition)
              return (
                <button
                  key={condition}
                  onClick={() => toggleCondition(condition)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '0.9rem',
                    border: active ? `1px solid ${appTheme.borderStrong}` : `1px solid ${appTheme.border}`,
                    background: active ? 'rgba(198,117,12,0.10)' : '#fff',
                    color: active ? appTheme.copperStrong : appTheme.espressoSoft,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 5, display: 'grid', placeItems: 'center', border: active ? 'none' : `1px solid ${appTheme.border}`, background: active ? appTheme.copper : 'transparent', color: '#fff', flexShrink: 0 }}>
                    {active ? <Check style={{ width: 11, height: 11, strokeWidth: 3 }} /> : null}
                  </span>
                  {condition}
                </button>
              )
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Family members" icon={User}>
          <div style={{ fontSize: '0.82rem', color: appTheme.espressoSoft, marginBottom: '0.9rem' }}>
            Add people you regularly care for so future family features can keep their context separate.
          </div>

          {profile.familyMembers.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.55rem', marginBottom: '1rem' }}>
              {profile.familyMembers.map((member) => (
                <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'center', padding: '0.8rem 0.9rem', borderRadius: '0.9rem', background: 'rgba(34,22,14,0.03)', border: `1px solid ${appTheme.border}` }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: appTheme.espresso }}>{member.name}</div>
                    <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft }}>{member.relationship}{member.age ? `, age ${member.age}` : ''}</div>
                  </div>
                  <SecondaryButton onClick={() => removeMember(member.id)}><X className="w-4 h-4" />Remove</SecondaryButton>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
            <TextInput label="Name" value={newMember.name} onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))} placeholder="Member name" />
            <SelectInput label="Relationship" value={newMember.relationship} onChange={(e) => setNewMember((p) => ({ ...p, relationship: e.target.value }))}>
              <option value="">Select</option>
              {RELATIONSHIPS.map((relationship) => <option key={relationship} value={relationship}>{relationship}</option>)}
            </SelectInput>
            <TextInput label="Age" value={newMember.age} onChange={(e) => setNewMember((p) => ({ ...p, age: e.target.value }))} placeholder="Age" type="number" min="0" max="150" />
            <PrimaryButton onClick={addFamilyMember} style={{ justifyContent: 'center', minHeight: '3rem' }}><Plus className="w-4 h-4" />Add</PrimaryButton>
          </div>
        </SurfaceCard>

        <div>
          <PrimaryButton onClick={save}><Save className="w-4 h-4" />Save profile</PrimaryButton>
        </div>
      </div>
    </AppPage>
  )
}
