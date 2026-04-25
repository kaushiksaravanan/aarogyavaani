import { useState } from 'react'
import { Sunrise, Sun, Moon, Pill, AlertTriangle, Loader2, RefreshCw, Clock, Info } from 'lucide-react'
import { CONFIG } from '../lib/config'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, EmptyState, StatusBanner, TextInput, Badge, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', icon: Sunrise, tone: 'warning', time: '7:00 - 9:00 AM' },
  { key: 'afternoon', label: 'Afternoon', icon: Sun, tone: 'copper', time: '12:00 - 2:00 PM' },
  { key: 'night', label: 'Night', icon: Moon, tone: 'info', time: '8:00 - 10:00 PM' },
]

function MedCard({ med, tone }) {
  return (
    <div style={{ padding: '0.9rem', borderRadius: '1rem', background: '#fff', border: `1px solid ${appTheme.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: appTheme.espresso }}>{med.name}</div>
        <Badge tone={tone}>{med.dosage || 'As prescribed'}</Badge>
      </div>
      {med.instructions ? <div style={{ fontSize: '0.8rem', color: appTheme.copperStrong, marginTop: '0.3rem' }}>{med.instructions}</div> : null}
      {med.purpose ? <div style={{ fontSize: '0.78rem', color: appTheme.espressoSoft, marginTop: '0.35rem', fontStyle: 'italic' }}>{med.purpose}</div> : null}
    </div>
  )
}

export default function MedicationsPage() {
  const [userId, setUserId] = useState(() => getStoredUserId())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadSchedule() {
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/medications/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const hasMeds = data && data.medications && data.medications.length > 0

  return (
    <AppPage maxWidth="72rem">
      <PageHeader
        icon={Pill}
        eyebrow="Medication memory"
        title="Medication schedule"
        subtitle="Build a daily medicine timeline from prescriptions, uploaded reports, and prior conversations."
      />

      <SurfaceCard title="Load patient schedule" icon={RefreshCw} style={{ marginBottom: '1rem' }}>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <TextInput label="Patient ID" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter patient or user ID" />
          <PrimaryButton onClick={loadSchedule} disabled={loading || !userId.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? 'Loading...' : 'Load schedule'}
          </PrimaryButton>
        </div>
      </SurfaceCard>

      {error ? <StatusBanner icon={AlertTriangle} title="Could not load medication schedule" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} /> : null}

      {hasMeds ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {TIME_SLOTS.map((slot) => {
            const meds = (data.schedule && data.schedule[slot.key]) || []
            if (!meds.length) return null
            const Icon = slot.icon
            return (
              <SurfaceCard key={slot.key} title={slot.label} icon={Icon} right={<Badge tone={slot.tone}>{slot.time}</Badge>}>
                <div style={{ display: 'grid', gap: '0.7rem' }}>
                  {meds.map((med, index) => <MedCard key={index} med={med} tone={slot.tone} />)}
                </div>
              </SurfaceCard>
            )
          })}

          {data.warnings?.length ? (
            <SurfaceCard title="Warnings" icon={AlertTriangle}>
              <div style={{ display: 'grid', gap: '0.55rem' }}>
                {data.warnings.map((warning, index) => <Badge key={`${warning}-${index}`} tone="danger" style={{ justifyContent: 'flex-start', borderRadius: '0.85rem', padding: '0.55rem 0.75rem' }}>{warning}</Badge>)}
              </div>
            </SurfaceCard>
          ) : null}

          {data.general_advice ? <StatusBanner icon={Info} title="General advice" subtitle={data.general_advice} tone="success" /> : null}

          <div style={{ fontSize: '0.78rem', textAlign: 'center', color: appTheme.espressoSoft }}>
            {(data.raw_medicines?.length || 0)} unique medicine(s) found - generated {data.generated_at ? new Date(data.generated_at).toLocaleString() : 'just now'}.
          </div>
        </div>
      ) : null}

      {data && !hasMeds ? (
        <SurfaceCard>
          <EmptyState icon={Pill} title="No medications found" subtitle="Upload a prescription or mention medicines in a call to build a schedule." />
        </SurfaceCard>
      ) : null}

      {!data && !loading && !error ? (
        <SurfaceCard>
          <EmptyState icon={Clock} title="Ready to load" subtitle="Enter a patient ID to see the medication timeline built from stored memory." />
        </SurfaceCard>
      ) : null}
    </AppPage>
  )
}
