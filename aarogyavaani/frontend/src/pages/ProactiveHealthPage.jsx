import { useState, useEffect } from 'react'
import { Activity, Loader2, AlertTriangle, TrendingUp, Pill, TestTube, Calendar, Heart, Shield, ThermometerSun, Sparkles, RefreshCw, Bug } from 'lucide-react'
import { getProactiveIntelligence } from '../lib/api'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, StatCard, Badge, EmptyState, StatusBanner, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const RISK_COLORS = {
  high: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', bar: '#ef4444' },
  medium: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', bar: '#f59e0b' },
  low: { bg: '#f0fdf4', border: '#86efac', color: '#166534', bar: '#22c55e' },
}

export default function ProactiveHealthPage() {
  const userId = getStoredUserId()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadIntelligence = async () => {
    if (!userId) { setError('Please set a user ID in your profile first.'); return }
    setLoading(true)
    setError('')
    try {
      const result = await getProactiveIntelligence(userId)
      if (result.status === 'error') throw new Error(result.error || 'Failed to load')
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) loadIntelligence()
  }, [userId])

  const currentMonth = new Date().getMonth()

  return (
    <AppPage maxWidth="72rem">
      <PageHeader
        icon={Activity}
        eyebrow="Proactive intelligence"
        title="Health intelligence"
        subtitle="AI-powered seasonal risk analysis, medication gap detection, overdue test identification, and comprehensive wellness scoring — all personalized to your health profile."
        actions={
          <PrimaryButton onClick={loadIntelligence} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </PrimaryButton>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Badge tone="info"><Sparkles className="w-3 h-3" /> Powered by Google Gemini</Badge>
        <Badge tone="copper"><Activity className="w-3 h-3" /> Personalized Analysis</Badge>
      </div>

      {error && <StatusBanner icon={AlertTriangle} title="Error" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} />}

      {loading && !data && (
        <SurfaceCard>
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" style={{ color: appTheme.copper }} />
            <p style={{ fontFamily: appTheme.headingFont, fontSize: '1.15rem', color: appTheme.espresso }}>Analyzing your health data...</p>
            <p style={{ color: appTheme.espressoSoft, fontSize: '0.88rem', marginTop: '0.3rem' }}>Checking medications, tests, and seasonal risks</p>
          </div>
        </SurfaceCard>
      )}

      {!data && !loading && !error && (
        <SurfaceCard>
          <EmptyState
            icon={Activity}
            title="No data yet"
            subtitle="Set your user ID in your profile to see personalized health intelligence."
          />
        </SurfaceCard>
      )}

      {data && (
        <div className="space-y-5">
          {/* Wellness Score */}
          {data.wellness_score != null && (
            <div className="grid sm:grid-cols-4 gap-4">
              <StatCard
                icon={Heart}
                label="Wellness Score"
                value={`${data.wellness_score.overall || data.wellness_score}/100`}
                detail="Overall health score"
                accent="#ef4444"
              />
              {data.wellness_score.medication_adherence != null && (
                <StatCard
                  icon={Pill}
                  label="Medication"
                  value={`${data.wellness_score.medication_adherence}%`}
                  detail="Adherence rate"
                  accent={appTheme.copper}
                />
              )}
              {data.wellness_score.test_compliance != null && (
                <StatCard
                  icon={TestTube}
                  label="Test compliance"
                  value={`${data.wellness_score.test_compliance}%`}
                  detail="Up-to-date tests"
                  accent="#3b82f6"
                />
              )}
              {data.wellness_score.followup_score != null && (
                <StatCard
                  icon={Calendar}
                  label="Follow-ups"
                  value={`${data.wellness_score.followup_score}%`}
                  detail="Completed follow-ups"
                  accent="#8b5cf6"
                />
              )}
            </div>
          )}

          {/* Seasonal Risk Map */}
          {data.seasonal_risks && data.seasonal_risks.length > 0 && (
            <SurfaceCard title="Seasonal disease risk map" icon={ThermometerSun}>
              <p style={{ fontSize: '0.82rem', color: appTheme.espressoSoft, marginBottom: '1rem' }}>
                India-specific seasonal health risks for the next 12 months. Current month highlighted.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '0.6rem' }}>
                {data.seasonal_risks.map((risk, i) => {
                  const monthIdx = typeof risk.month === 'number' ? risk.month - 1 : MONTH_NAMES.indexOf(risk.month)
                  const isCurrent = monthIdx === currentMonth
                  const riskLevel = (risk.risk_level || risk.level || 'low').toLowerCase()
                  const colors = RISK_COLORS[riskLevel] || RISK_COLORS.low

                  return (
                    <div
                      key={i}
                      style={{
                        padding: '0.7rem',
                        borderRadius: '0.9rem',
                        border: isCurrent ? `2px solid ${appTheme.copper}` : `1px solid ${colors.border}`,
                        background: isCurrent ? 'rgba(198,117,12,0.06)' : colors.bg,
                        position: 'relative',
                      }}
                    >
                      {isCurrent && (
                        <div style={{
                          position: 'absolute', top: '-0.5rem', right: '0.5rem',
                          fontSize: '0.65rem', fontWeight: 700, color: '#fff',
                          background: appTheme.copper, padding: '0.1rem 0.4rem',
                          borderRadius: '999px',
                        }}>
                          NOW
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: appTheme.espresso, marginBottom: '0.3rem' }}>
                        {risk.month_name || MONTH_NAMES[monthIdx] || risk.month}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(risk.diseases || []).map((d, j) => (
                          <span key={j} style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.4rem',
                            borderRadius: '999px', background: `${colors.bar}18`,
                            color: colors.color, fontWeight: 600,
                          }}>
                            {d}
                          </span>
                        ))}
                      </div>
                      <div style={{
                        marginTop: '0.35rem', height: '3px', borderRadius: '2px',
                        background: '#e5e7eb',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: '2px',
                          background: colors.bar,
                          width: riskLevel === 'high' ? '100%' : riskLevel === 'medium' ? '60%' : '30%',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SurfaceCard>
          )}

          {/* Medication Gaps */}
          {data.medication_gaps && data.medication_gaps.length > 0 && (
            <SurfaceCard title={`Medication gaps (${data.medication_gaps.length})`} icon={Pill}>
              <div className="space-y-2">
                {data.medication_gaps.map((gap, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '0.75rem', padding: '0.7rem 0.8rem', borderRadius: '0.8rem',
                      border: `1px solid ${appTheme.border}`, background: 'rgba(255,251,235,0.5)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: appTheme.espresso }}>
                        {gap.medicine_name || gap.medication || gap.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft }}>
                        {gap.reason || gap.issue || 'Possible gap detected'}
                      </div>
                    </div>
                    <Badge tone={gap.severity === 'high' ? 'danger' : gap.severity === 'medium' ? 'warning' : 'neutral'}>
                      {gap.severity || 'check'}
                    </Badge>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Overdue Tests */}
          {data.overdue_tests && data.overdue_tests.length > 0 && (
            <SurfaceCard title={`Overdue tests (${data.overdue_tests.length})`} icon={TestTube}>
              <div className="space-y-2">
                {data.overdue_tests.map((test, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '0.75rem', padding: '0.7rem 0.8rem', borderRadius: '0.8rem',
                      border: `1px solid ${appTheme.border}`, background: 'rgba(239,246,255,0.5)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: appTheme.espresso }}>
                        {test.test_name || test.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft }}>
                        {test.last_done ? `Last done: ${test.last_done}` : 'No record found'}
                        {test.recommended_frequency && ` | Recommended: ${test.recommended_frequency}`}
                      </div>
                    </div>
                    <Badge tone={test.urgency === 'high' ? 'danger' : test.urgency === 'medium' ? 'warning' : 'info'}>
                      {test.urgency || 'due'}
                    </Badge>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {/* Health Trends / Analysis */}
          {data.analysis && (
            <SurfaceCard title="Gemini health analysis" icon={Sparkles}>
              <p style={{ fontSize: '0.88rem', color: appTheme.espressoSoft, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {data.analysis}
              </p>
            </SurfaceCard>
          )}

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <SurfaceCard title="Recommendations" icon={Shield}>
              <div className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                      padding: '0.6rem 0.7rem', borderRadius: '0.8rem',
                      border: `1px solid ${appTheme.border}`,
                    }}
                  >
                    <TrendingUp className="w-4 h-4" style={{ color: appTheme.copper, marginTop: '0.1rem', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.85rem', color: appTheme.espressoSoft, lineHeight: 1.6 }}>
                      {typeof rec === 'string' ? rec : rec.text || rec.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        </div>
      )}
    </AppPage>
  )
}
