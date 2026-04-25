import { useState, useEffect } from 'react'
import { Users, Plus, User, Loader2, AlertTriangle, X, Baby, UserRound, Heart } from 'lucide-react'
import { CONFIG } from '../lib/config'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, EmptyState, StatusBanner, TextInput, SelectInput, Badge, appTheme } from '../components/AppPrimitives'

const RELATION_ICONS = {
  mother: Heart,
  father: UserRound,
  child: Baby,
  spouse: Heart,
  self: User,
}

const RELATION_TONES = {
  mother: 'danger',
  father: 'info',
  child: 'success',
  spouse: 'warning',
  self: 'copper',
}

export default function FamilyPage() {
  const userId = (() => { try { const p = JSON.parse(localStorage.getItem('aarogyavaani_profile') || '{}'); return p.userId || localStorage.getItem('aarogyavaani_user_id') || '' } catch { return '' } })()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', relation: 'mother', age: '', conditions: '' })
  const [activeMember, setActiveMember] = useState(null)

  useEffect(() => {
    loadMembers()
  }, [userId])

  async function loadMembers() {
    setLoading(true)
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/family_members/${encodeURIComponent(userId)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addMember() {
    if (!form.name.trim() || !form.relation) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/family_members/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          relation: form.relation,
          age: form.age,
          conditions: form.conditions ? form.conditions.split(',').map((c) => c.trim()).filter(Boolean) : [],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setForm({ name: '', relation: 'mother', age: '', conditions: '' })
      setShowAdd(false)
      await loadMembers()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  function switchToMember(member) {
    setActiveMember(member)
    if (member) localStorage.setItem('aarogyavaani_active_member', JSON.stringify(member))
    else localStorage.removeItem('aarogyavaani_active_member')
  }

  return (
    <AppPage maxWidth="72rem">
      <PageHeader
        icon={Users}
        eyebrow="Care circle"
        title="Family care mode"
        subtitle="Manage separate health contexts for the people you care for, then switch their active memory when needed."
        actions={<PrimaryButton onClick={() => setShowAdd(!showAdd)}>{showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showAdd ? 'Cancel' : 'Add family member'}</PrimaryButton>}
      />

      {activeMember ? <StatusBanner icon={User} title={`Active member: ${activeMember.name}`} subtitle={`You are currently viewing shared context for ${activeMember.relation}.`} tone="success" actions={<SecondaryButton onClick={() => switchToMember(null)}>Switch to self</SecondaryButton>} style={{ marginBottom: '1rem' }} /> : null}
      {error ? <StatusBanner icon={AlertTriangle} title="Family mode error" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} /> : null}

      {showAdd ? (
        <SurfaceCard title="Add a family member" icon={Plus} style={{ marginBottom: '1rem' }}>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunita Devi" />
            <SelectInput label="Relation" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="grandparent">Grandparent</option>
              <option value="other">Other</option>
            </SelectInput>
            <TextInput label="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 55" />
            <TextInput label="Known conditions" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="e.g. diabetes, high BP" />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <PrimaryButton onClick={addMember} disabled={adding || !form.name.trim()}>{adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{adding ? 'Adding...' : 'Add member'}</PrimaryButton>
          </div>
        </SurfaceCard>
      ) : null}

      {loading ? (
        <SurfaceCard>
          <EmptyState icon={Loader2} title="Loading family members" subtitle="Fetching saved members and their linked health contexts." />
        </SurfaceCard>
      ) : members.length === 0 ? (
        <SurfaceCard>
          <EmptyState icon={Users} title="No family members yet" subtitle="Add parents, spouse, children, or others to manage their healthcare context separately." />
        </SurfaceCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => switchToMember(null)}
            style={{
              padding: '1.1rem',
              borderRadius: '1.25rem',
              border: !activeMember ? `2px solid ${appTheme.borderStrong}` : `1px solid ${appTheme.border}`,
              background: !activeMember ? 'rgba(198,117,12,0.10)' : '#fff',
              boxShadow: appTheme.shadow,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.9rem' }}>
              <div style={{ width: '2.7rem', height: '2.7rem', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'rgba(198,117,12,0.10)', border: `1px solid ${appTheme.borderStrong}` }}>
                <User className="w-5 h-5" style={{ color: appTheme.copper }} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: appTheme.espresso }}>Self</div>
                <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft }}>Primary account</div>
              </div>
            </div>
            {!activeMember ? <Badge tone="copper">Active</Badge> : null}
          </button>

          {members.map((member, index) => {
            const tone = RELATION_TONES[member.relation] || 'neutral'
            const Icon = RELATION_ICONS[member.relation] || User
            const isActive = activeMember?.member_id === member.member_id
            return (
              <button
                key={member.member_id || index}
                onClick={() => switchToMember(member)}
                style={{
                  padding: '1.1rem',
                  borderRadius: '1.25rem',
                  border: isActive ? `2px solid ${appTheme.borderStrong}` : `1px solid ${appTheme.border}`,
                  background: isActive ? 'rgba(198,117,12,0.08)' : '#fff',
                  boxShadow: appTheme.shadow,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.9rem' }}>
                  <div style={{ width: '2.7rem', height: '2.7rem', borderRadius: '999px', display: 'grid', placeItems: 'center', background: 'rgba(34,22,14,0.04)', border: `1px solid ${appTheme.border}` }}>
                    <Icon className="w-5 h-5" style={{ color: appTheme.copperStrong }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: appTheme.espresso }}>{member.name}</div>
                    <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft, textTransform: 'capitalize' }}>{member.relation}{member.age ? `, ${member.age} yrs` : ''}</div>
                  </div>
                </div>
                {member.conditions?.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {member.conditions.slice(0, 3).map((condition, idx) => <Badge key={`${condition}-${idx}`} tone={tone}>{condition}</Badge>)}
                  </div>
                ) : null}
                {isActive ? <Badge tone="success">Active</Badge> : <Badge>{member.member_id || 'Linked member'}</Badge>}
              </button>
            )
          })}
        </div>
      )}
    </AppPage>
  )
}
