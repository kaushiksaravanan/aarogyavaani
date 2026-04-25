import { useState } from 'react'
import { Shield, Search, Loader2, ExternalLink, Phone, CheckCircle, AlertTriangle, IndianRupee, MapPin, Heart, Sparkles } from 'lucide-react'
import { matchSchemes } from '../lib/api'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, TextInput, SelectInput, Badge, EmptyState, StatusBanner, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

const INDIAN_STATES = [
  '', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
]

const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Cancer', 'Kidney Disease',
  'TB / Tuberculosis', 'Pregnancy', 'Malaria', 'Dengue', 'Asthma',
  'Arthritis', 'Anemia', 'Thyroid', 'Eye Problems', 'Mental Health',
]

export default function SchemeMatcherPage() {
  const userId = getStoredUserId()
  const [state, setState] = useState('')
  const [conditions, setConditions] = useState([])
  const [income, setIncome] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCondition = (c) => {
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  }

  const handleMatch = async () => {
    if (!userId) { setError('Please set a user ID in your profile first.'); return }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await matchSchemes({ userId, state, conditions, income, age, gender })
      if (data.status === 'error') throw new Error(data.error || 'Matching failed')
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppPage maxWidth="72rem">
      <PageHeader
        icon={Shield}
        eyebrow="Government schemes"
        title="Health scheme eligibility"
        subtitle="Find government health insurance and welfare schemes you or your family may qualify for. Powered by Google Gemini AI for personalized eligibility analysis."
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Badge tone="info"><Sparkles className="w-3 h-3" /> Powered by Google Gemini</Badge>
        <Badge tone="success"><Shield className="w-3 h-3" /> 8+ Central Schemes</Badge>
      </div>

      {error && <StatusBanner icon={AlertTriangle} title="Error" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} />}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <SurfaceCard title="Your details" icon={Heart} style={{ marginBottom: '1rem' }}>
            <div className="space-y-3">
              <SelectInput label="State" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select your state</option>
                {INDIAN_STATES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectInput>

              <TextInput label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 45" />

              <SelectInput label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </SelectInput>

              <SelectInput label="Annual household income" value={income} onChange={(e) => setIncome(e.target.value)}>
                <option value="">Select income range</option>
                <option value="below_1_lakh">Below 1 Lakh</option>
                <option value="1_to_3_lakh">1 - 3 Lakh</option>
                <option value="3_to_5_lakh">3 - 5 Lakh</option>
                <option value="5_to_10_lakh">5 - 10 Lakh</option>
                <option value="above_10_lakh">Above 10 Lakh</option>
              </SelectInput>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: appTheme.espressoSoft, marginBottom: '0.5rem' }}>Health conditions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {COMMON_CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCondition(c)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: conditions.includes(c) ? '1.5px solid hsl(28 45% 57%)' : '1px solid rgba(34,22,14,0.12)',
                        background: conditions.includes(c) ? 'rgba(198,117,12,0.12)' : '#fff',
                        color: conditions.includes(c) ? 'hsl(28 49% 49%)' : appTheme.espressoSoft,
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <PrimaryButton onClick={handleMatch} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Checking eligibility...' : 'Find matching schemes'}
              </PrimaryButton>
            </div>
          </SurfaceCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {!results && !loading && (
            <SurfaceCard>
              <EmptyState
                icon={Shield}
                title="Check your eligibility"
                subtitle="Fill in your details and click 'Find matching schemes' to discover government health schemes you may qualify for."
              />
            </SurfaceCard>
          )}

          {loading && (
            <SurfaceCard>
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" style={{ color: appTheme.copper }} />
                <p style={{ fontFamily: appTheme.headingFont, fontSize: '1.15rem', color: appTheme.espresso }}>Analyzing eligibility with Gemini AI...</p>
                <p style={{ color: appTheme.espressoSoft, fontSize: '0.88rem', marginTop: '0.3rem' }}>Checking {8}+ government health schemes</p>
              </div>
            </SurfaceCard>
          )}

          {results && results.matches && (
            <div className="space-y-4">
              <StatusBanner
                icon={CheckCircle}
                title={`${results.matches.length} scheme${results.matches.length !== 1 ? 's' : ''} found`}
                subtitle={`Out of ${results.total_schemes_checked || 8} central and state schemes checked`}
                tone="success"
              />

              {results.matches.map((scheme, i) => (
                <SurfaceCard key={i} style={{ transition: 'box-shadow 200ms ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ fontFamily: appTheme.headingFont, fontSize: '1.15rem', color: appTheme.espresso, marginBottom: '0.2rem' }}>
                        {scheme.scheme_name || scheme.name}
                      </h3>
                      {scheme.hindi_name && (
                        <p style={{ fontSize: '0.82rem', color: appTheme.copper, fontWeight: 600 }}>{scheme.hindi_name}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {scheme.eligibility_score != null && (
                        <Badge tone={scheme.eligibility_score >= 70 ? 'success' : scheme.eligibility_score >= 40 ? 'warning' : 'neutral'}>
                          {scheme.eligibility_score}% match
                        </Badge>
                      )}
                      {scheme.category && <Badge tone="info">{scheme.category}</Badge>}
                    </div>
                  </div>

                  {scheme.description && (
                    <p style={{ fontSize: '0.88rem', color: appTheme.espressoSoft, lineHeight: 1.65, marginBottom: '0.75rem' }}>
                      {scheme.description}
                    </p>
                  )}

                  {scheme.benefits && scheme.benefits.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: appTheme.espresso, marginBottom: '0.35rem' }}>Benefits</div>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                        {(Array.isArray(scheme.benefits) ? scheme.benefits : [scheme.benefits]).map((b, j) => (
                          <li key={j} style={{ fontSize: '0.85rem', color: appTheme.espressoSoft, lineHeight: 1.6, marginBottom: '0.15rem' }}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scheme.coverage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <IndianRupee className="w-3.5 h-3.5" style={{ color: appTheme.copper }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: appTheme.espresso }}>{scheme.coverage}</span>
                    </div>
                  )}

                  {scheme.how_to_apply && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: appTheme.espresso, marginBottom: '0.25rem' }}>How to apply</div>
                      <p style={{ fontSize: '0.85rem', color: appTheme.espressoSoft, lineHeight: 1.6 }}>{scheme.how_to_apply}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {scheme.website && (
                      <a href={scheme.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <SecondaryButton style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>
                          <ExternalLink className="w-3.5 h-3.5" /> Visit website
                        </SecondaryButton>
                      </a>
                    )}
                    {scheme.helpline && (
                      <a href={`tel:${scheme.helpline}`} style={{ textDecoration: 'none' }}>
                        <SecondaryButton style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>
                          <Phone className="w-3.5 h-3.5" /> {scheme.helpline}
                        </SecondaryButton>
                      </a>
                    )}
                  </div>
                </SurfaceCard>
              ))}

              {results.gemini_analysis && (
                <SurfaceCard title="Gemini AI Analysis" icon={Sparkles}>
                  <p style={{ fontSize: '0.88rem', color: appTheme.espressoSoft, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {results.gemini_analysis}
                  </p>
                </SurfaceCard>
              )}
            </div>
          )}
        </div>
      </div>
    </AppPage>
  )
}
