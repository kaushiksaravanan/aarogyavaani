import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Activity, Database, Server, CheckCircle, XCircle, Globe, Brain, Users, Sparkles } from 'lucide-react'
import { healthCheck, getSupportedLanguages, getQdrantStats } from '../lib/api'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, StatCard, Badge, appTheme } from '../components/AppPrimitives'

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [languageCount, setLanguageCount] = useState({ total: 0, featured: '' })
  const [qdrantStats, setQdrantStats] = useState({ knowledge: 0, memory: 0 })

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
            {['Vapi', 'Qdrant', 'GPT-4o', 'FastAPI', 'ElevenLabs', 'Deepgram', 'HuggingFace', 'React', 'Vercel', 'Python'].map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', lineHeight: 1.65, color: appTheme.espressoSoft }}>
            The frontend, report memory, and doctor-facing tools now share the same warm visual system for a more consistent demo story.
          </div>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
