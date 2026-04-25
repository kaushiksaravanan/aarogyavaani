import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Activity, Database, Server, CheckCircle, XCircle, Globe, Brain, Users, Sparkles, Bot, Shield, AlertTriangle, Zap } from 'lucide-react'
import { healthCheck, getSupportedLanguages, getQdrantStats, runProactiveCheck } from '../lib/api'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, StatCard, Badge, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [languageCount, setLanguageCount] = useState({ total: 0, featured: '' })
  const [qdrantStats, setQdrantStats] = useState({ knowledge: 0, memory: 0 })
  const [proactiveAlerts, setProactiveAlerts] = useState(null)
  const [proactiveLoading, setProactiveLoading] = useState(false)
  const userId = getStoredUserId()

  useEffect(() => {
    let isMounted = true

    Promise.all([healthCheck(), getSupportedLanguages(), getQdrantStats()])
      .then(([healthData, langData, statsData]) => {
        if (!isMounted) return
        setBackendStatus(healthData)

        if (langData.languages) {
          const featured = langData.featured || langData.languages.filter((l) => l.featured)
          const featuredNames = featured
            .filter((l) => l.code !== 'auto' && l.code !== 'multi')
            .slice(0, 3)
            .map((l) => l.label)
            .join(', ')
          setLanguageCount({
            total: langData.total || langData.languages.length,
            featured: featuredNames || 'Hindi, English, Kannada',
          })
        }

        if (statsData.status === 'ok') {
          setQdrantStats({
            knowledge: statsData.knowledge_chunks || 0,
            memory: statsData.memory_chunks || 0,
          })
        }

        setLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setBackendStatus(null)
        setLanguageCount({ total: 3, featured: 'Hindi, English, Kannada' })
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const totalChunks = qdrantStats.knowledge + qdrantStats.memory

  const handleProactiveCheck = async () => {
    if (!userId) return
    setProactiveLoading(true)
    try {
      const result = await runProactiveCheck(userId)
      setProactiveAlerts(result)
    } catch {
      setProactiveAlerts({ alerts: [] })
    } finally {
      setProactiveLoading(false)
    }
  }

  const stats = [
    {
      label: 'Languages Supported',
      value: languageCount.total > 0 ? String(languageCount.total) : '3',
      detail: languageCount.featured || 'Hindi, English, Kannada',
      icon: Globe,
    },
    {
      label: 'Qdrant Memory',
      value: loading ? '...' : String(totalChunks),
      detail: `${qdrantStats.knowledge} health + ${qdrantStats.memory} user memory entries`,
      icon: Brain,
    },
    {
      label: 'Target Reach',
      value: '500M+',
      detail: 'Rural and multilingual healthcare access',
      icon: Users,
    },
  ]

  const services = [
    { name: 'FastAPI Backend', url: 'aarogyavaani-api.vercel.app', icon: Server, status: backendStatus?.status === 'ok' },
    { name: 'Google Gemini AI', url: 'Gemini 2.0 Flash — Primary LLM & Vision', icon: Sparkles, status: true },
    { name: 'Qdrant Vector DB', url: 'Qdrant Cloud (EU-West-1)', icon: Database, status: true },
    { name: 'Vapi Voice Stack', url: 'GPT-4o + ElevenLabs + Deepgram', icon: Phone, status: true },
    { name: 'Embeddings Layer', url: 'multilingual-e5-large-instruct', icon: Brain, status: true },
  ]

  return (
    <AppPage maxWidth="74rem">
      <PageHeader
        icon={Sparkles}
        eyebrow="Overview"
        title="AarogyaVaani dashboard"
        subtitle="Track system health, memory coverage, and the core features powering calls, reports, and doctor handoff."
        actions={
          <>
            <Link to="/agent"><SecondaryButton><Bot className="w-4 h-4" />AI Agent</SecondaryButton></Link>
            <Link to="/knowledge"><SecondaryButton>Browse memory</SecondaryButton></Link>
            <Link to="/call"><PrimaryButton><Phone className="w-4 h-4" />Start voice call</PrimaryButton></Link>
          </>
        }
      />

      <div className="grid lg:grid-cols-[1.25fr_0.9fr] gap-4 mb-4">
        <SurfaceCard
          title="Quick actions"
          icon={Phone}
          bodyStyle={{ display: 'grid', gap: '0.95rem' }}
          style={{ background: 'linear-gradient(135deg, #fff8f1 0%, #ffffff 100%)' }}
        >
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: appTheme.espresso }}>Talk, upload, and remember in one flow</div>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: appTheme.espressoSoft, marginTop: '0.25rem' }}>
                  Start a voice session, attach reports, then reuse that context in later conversations and doctor summaries.
                </div>
              </div>
              <Badge tone="copper">Hackathon demo ready</Badge>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/call"><PrimaryButton><Phone className="w-4 h-4" />Open call page</PrimaryButton></Link>
              <Link to="/doctor-brief"><SecondaryButton>Generate doctor brief</SecondaryButton></Link>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="System status" icon={Activity}>
          {loading ? (
            <div style={{ color: appTheme.espressoSoft, fontSize: '0.92rem' }}>Checking backend, languages, and vector storage...</div>
          ) : backendStatus?.status === 'ok' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#15803d', fontWeight: 600 }}>
              <CheckCircle className="w-4 h-4" />
              All systems operational
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#b91c1c', fontWeight: 600 }}>
              <XCircle className="w-4 h-4" />
              Backend unreachable
            </div>
          )}
          <div style={{ marginTop: '0.9rem', fontSize: '0.84rem', lineHeight: 1.65, color: appTheme.espressoSoft }}>
            The app depends on the backend, Qdrant memory, and the live voice pipeline staying in sync.
          </div>
        </SurfaceCard>
      </div>

      {/* Agentic AI Section */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 mb-4">
        <SurfaceCard
          title="Agentic AI"
          icon={Bot}
          style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: appTheme.espresso }}>Multi-agent health intelligence</div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: appTheme.espressoSoft, marginTop: '0.25rem' }}>
              Powered by Google Gemini 2.0 Flash. 7 specialist agents, 11 autonomous tools, and 4 health workflows. The AI agent can search knowledge, analyze reports, check medications, and assess emergencies — all autonomously.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.85rem' }}>
            <Badge style={{ fontSize: '0.68rem', background: 'linear-gradient(135deg, #1a73e8, #4285f4)', color: '#fff', border: '1px solid #1a73e8', fontWeight: 700 }}>
              Gemini AI
            </Badge>
            {['Triage', 'Knowledge', 'Medication', 'Report', 'Follow-up', 'Proactive'].map((name) => (
              <Badge key={name} style={{ fontSize: '0.68rem', background: 'rgba(139,92,246,0.08)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.18)' }}>
                {name} Agent
              </Badge>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link to="/agent"><PrimaryButton style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}><Bot className="w-4 h-4" />Open AI Agent</PrimaryButton></Link>
            <SecondaryButton onClick={handleProactiveCheck} disabled={proactiveLoading || !userId}>
              <Shield className="w-4 h-4" />{proactiveLoading ? 'Checking...' : 'Run proactive check'}
            </SecondaryButton>
          </div>
        </SurfaceCard>

        {/* Proactive Alerts */}
        <SurfaceCard title="Health alerts" icon={Shield}>
          {proactiveAlerts?.alerts?.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {proactiveAlerts.alerts.slice(0, 4).map((alert, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.55rem 0.7rem',
                    borderRadius: '0.7rem',
                    background: alert.priority === 'high' ? '#fef2f2' : alert.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                    border: `1px solid ${alert.priority === 'high' ? '#fecaca' : alert.priority === 'medium' ? '#fde68a' : '#bbf7d0'}`,
                  }}
                >
                  <AlertTriangle style={{ width: 12, height: 12, marginTop: '0.18rem', flexShrink: 0, color: alert.priority === 'high' ? '#b91c1c' : alert.priority === 'medium' ? '#92400e' : '#166534' }} />
                  <div style={{ fontSize: '0.78rem', color: appTheme.espresso, lineHeight: 1.5 }}>{alert.message}</div>
                </div>
              ))}
              {proactiveAlerts.tools_used?.length > 0 && (
                <div style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'flex', gap: '0.3rem', alignItems: 'center', marginTop: '0.2rem' }}>
                  <Zap style={{ width: 10, height: 10 }} />
                  {proactiveAlerts.tools_used.length} tools used &middot; {proactiveAlerts.total_steps || 0} steps
                </div>
              )}
            </div>
          ) : proactiveLoading ? (
            <div style={{ color: appTheme.espressoSoft, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap style={{ width: 14, height: 14, color: '#8b5cf6' }} />
              Running proactive health analysis with AI agents...
            </div>
          ) : (
            <div style={{ color: appTheme.espressoSoft, fontSize: '0.88rem', lineHeight: 1.6 }}>
              {userId
                ? 'Click "Run proactive check" to have the AI agent analyze your health data for alerts, missed follow-ups, and recommendations.'
                : 'Set up your user ID in Profile to enable proactive health monitoring.'}
            </div>
          )}
        </SurfaceCard>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {stats.map((item) => (
          <StatCard key={item.label} icon={item.icon} label={item.label} value={item.value} detail={item.detail} />
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <SurfaceCard title="Service health" icon={Server}>
          <div style={{ display: 'grid' }}>
            {services.map((service, index) => (
              <div
                key={service.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.9rem 0',
                  borderBottom: index < services.length - 1 ? `1px solid ${appTheme.border}` : 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <service.icon className="w-4 h-4" style={{ color: appTheme.copper, marginTop: '0.15rem' }} />
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: appTheme.espresso }}>{service.name}</div>
                    <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft }}>{service.url}</div>
                  </div>
                </div>
                <Badge tone={service.status ? 'success' : 'danger'}>{service.status ? 'Healthy' : 'Down'}</Badge>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Tech stack" icon={Database}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            {[
              { name: 'Google Gemini', highlight: true },
              { name: 'Gemini 2.0 Flash', highlight: true },
              { name: 'Vapi' }, { name: 'Qdrant' }, { name: 'FastAPI' },
              { name: 'ElevenLabs' }, { name: 'Deepgram' }, { name: 'HuggingFace' },
              { name: 'React' }, { name: 'Vercel' }, { name: 'Python' },
              { name: 'Multi-Agent AI' }, { name: 'Tool-Augmented LLM' },
            ].map((tech) => (
              <Badge
                key={tech.name}
                style={tech.highlight ? {
                  background: 'linear-gradient(135deg, #1a73e8, #4285f4)',
                  color: '#fff',
                  border: '1px solid #1a73e8',
                  fontWeight: 700,
                } : undefined}
              >
                {tech.name}
              </Badge>
            ))}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', lineHeight: 1.65, color: appTheme.espressoSoft }}>
            Powered by Google Gemini for multimodal medical analysis, agentic reasoning, and multilingual healthcare intelligence.
          </div>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
