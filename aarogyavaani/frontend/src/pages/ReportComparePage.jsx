import { useState, useEffect } from 'react'
import { GitCompareArrows, TrendingUp, TrendingDown, AlertTriangle, Plus, Minus, Loader2, FileText, ArrowRight } from 'lucide-react'
import { CONFIG } from '../lib/config'
import { getMedicalReports } from '../lib/api'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, EmptyState, StatusBanner, SelectInput, Badge, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

function ChangeCard({ items, title, icon: Icon, tone = 'neutral' }) {
  if (!items || items.length === 0) return null

  return (
    <SurfaceCard title={title} icon={Icon} right={<Badge tone={tone}>{items.length}</Badge>}>
      <div style={{ display: 'grid', gap: '0.65rem' }}>
        {items.map((item, index) => (
          <div key={index} style={{ padding: '0.85rem', borderRadius: '0.95rem', background: '#ffffffb8', border: `1px solid ${appTheme.border}` }}>
            {typeof item === 'string' ? (
              <div style={{ fontSize: '0.88rem', color: appTheme.espresso }}>{item}</div>
            ) : (
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: appTheme.espresso }}>{item.metric}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {item.old_value ? <Badge>{item.old_value}</Badge> : null}
                  {item.old_value && item.new_value ? <ArrowRight className="w-3 h-3" style={{ color: appTheme.espressoSoft }} /> : null}
                  {item.new_value ? <Badge tone={tone}>{item.new_value}</Badge> : null}
                </div>
                {item.note ? <div style={{ fontSize: '0.78rem', color: appTheme.espressoSoft, marginTop: '0.3rem' }}>{item.note}</div> : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </SurfaceCard>
  )
}

export default function ReportComparePage() {
  const userId = getStoredUserId()
  const [reports, setReports] = useState([])
  const [reportId1, setReportId1] = useState('')
  const [reportId2, setReportId2] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMedicalReports(userId).then((data) => {
      if (data.reports) {
        setReports(data.reports)
        if (data.reports.length >= 2) {
          setReportId1(data.reports[data.reports.length - 1].report_id)
          setReportId2(data.reports[0].report_id)
        }
      }
    })
  }, [userId])

  async function compare() {
    if (!reportId1 || !reportId2 || reportId1 === reportId2) {
      setError('Select two different reports to compare')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/reports/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, report_id_1: reportId1, report_id_2: reportId2 }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const comp = result?.comparison

  return (
    <AppPage maxWidth="72rem">
      <PageHeader
        icon={GitCompareArrows}
        eyebrow="Report intelligence"
        title="Compare two medical reports"
        subtitle="Surface what improved, worsened, appeared newly, or stayed stable between two uploaded reports."
      />

      {reports.length < 2 ? (
        <SurfaceCard>
          <EmptyState icon={FileText} title="Need at least two reports" subtitle="Upload medical reports on the call page before using report compare." />
        </SurfaceCard>
      ) : (
        <SurfaceCard title="Choose reports" icon={FileText} style={{ marginBottom: '1rem' }}>
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectInput label="Older report" value={reportId1} onChange={(e) => setReportId1(e.target.value)}>
              <option value="">Select report...</option>
              {reports.map((report) => (
                <option key={report.report_id} value={report.report_id}>
                  {report.report_name} ({report.saved_at ? new Date(report.saved_at).toLocaleDateString() : 'No date'})
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Newer report" value={reportId2} onChange={(e) => setReportId2(e.target.value)}>
              <option value="">Select report...</option>
              {reports.map((report) => (
                <option key={report.report_id} value={report.report_id}>
                  {report.report_name} ({report.saved_at ? new Date(report.saved_at).toLocaleDateString() : 'No date'})
                </option>
              ))}
            </SelectInput>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <PrimaryButton onClick={compare} disabled={loading || !reportId1 || !reportId2 || reportId1 === reportId2}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompareArrows className="w-4 h-4" />}
              {loading ? 'Comparing...' : 'Compare reports'}
            </PrimaryButton>
          </div>
        </SurfaceCard>
      )}

      {error ? <StatusBanner icon={AlertTriangle} title="Could not compare reports" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} /> : null}

      {comp ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {comp.overall_summary ? (
            <SurfaceCard title="Overall summary" icon={FileText}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: appTheme.espresso }}>{comp.overall_summary}</p>
            </SurfaceCard>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-4">
            <SurfaceCard title="Older report" icon={FileText}>
              <div style={{ fontSize: '0.9rem', color: appTheme.espresso }}>{result.report_1.name}</div>
            </SurfaceCard>
            <SurfaceCard title="Newer report" icon={FileText}>
              <div style={{ fontSize: '0.9rem', color: appTheme.espresso }}>{result.report_2.name}</div>
            </SurfaceCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChangeCard items={comp.improved} title="Improved" icon={TrendingUp} tone="success" />
            <ChangeCard items={comp.worsened} title="Worsened" icon={TrendingDown} tone="danger" />
            <ChangeCard items={comp.new_findings} title="New findings" icon={AlertTriangle} tone="warning" />
            <ChangeCard items={comp.medications_added} title="Medications added" icon={Plus} tone="violet" />
            <ChangeCard items={comp.medications_removed} title="Medications removed" icon={Minus} tone="neutral" />
          </div>

          {comp.unchanged && comp.unchanged.length > 0 ? (
            <SurfaceCard title="Unchanged findings" icon={FileText}>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {comp.unchanged.map((item, index) => <Badge key={`${item}-${index}`}>{item}</Badge>)}
              </div>
            </SurfaceCard>
          ) : null}
        </div>
      ) : null}
    </AppPage>
  )
}
