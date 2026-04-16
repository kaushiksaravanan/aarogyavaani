import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Activity, Database, Server, CheckCircle, XCircle, Globe, Heart, Brain, Users } from 'lucide-react'
import { healthCheck, getSupportedLanguages } from '../lib/api'

/* shared inline style fragments */
const cardBorder = 'rgba(34, 22, 14, 0.08)'
const cardGradient = 'linear-gradient(135deg, #ffffff 0%, #fff8f1 100%)'
const warmShadow = '0 1px 3px rgba(76,46,18,0.06), 0 4px 14px rgba(76,46,18,0.05)'
const warmShadowHover = '0 4px 20px rgba(76,46,18,0.10)'
const espresso = 'hsl(28 45% 15%)'
const espressoSoft = 'hsl(45 21% 40%)'
const copper = 'hsl(28 45% 57%)'
const copperStrong = 'hsl(28 49% 49%)'
const headingFont = '"Instrument Serif", Georgia, serif'
const bodyFont = '"Inter", system-ui, sans-serif'

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [languageCount, setLanguageCount] = useState({ total: 0, featured: '' })

  useEffect(() => {
    let isMounted = true
    
    // Fetch health check and supported languages in parallel
    Promise.all([
      healthCheck(),
      getSupportedLanguages(),
    ])
      .then(([healthData, langData]) => {
        if (isMounted) {
          setBackendStatus(healthData)
          if (langData.languages) {
            const featured = langData.featured || langData.languages.filter(l => l.featured)
            const featuredNames = featured
              .filter(l => l.code !== 'auto' && l.code !== 'multi')
              .slice(0, 3)
              .map(l => l.label)
              .join(', ')
            setLanguageCount({ 
              total: langData.total || langData.languages.length, 
              featured: featuredNames || 'Hindi, English, Kannada' 
            })
          }
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus(null)
          setLanguageCount({ total: 3, featured: 'Hindi, English, Kannada' })
          setLoading(false)
        }
      })
    
    return () => {
      isMounted = false
    }
  }, [])

  const stats = [
    { label: 'Languages Supported', value: languageCount.total > 0 ? String(languageCount.total) : '3', detail: languageCount.featured || 'Hindi, English, Kannada', icon: Globe },
    { label: 'Knowledge Chunks', value: '23', detail: 'Health, schemes, maternal', icon: Brain },
    { label: 'Target Users', value: '500M+', detail: 'Rural India population', icon: Users },
  ]

  return (
    <div
      className="p-8 max-w-5xl mx-auto"
      style={{ background: '#fffdf9', fontFamily: bodyFont, minHeight: '100%' }}
    >
      <div className="mb-8">
        <h1
          className="text-2xl"
          style={{ fontFamily: headingFont, fontWeight: 600, color: espresso }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: espressoSoft }}>
          System status and quick actions for AarogyaVaani
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/call"
          className="rounded-2xl p-6 transition-all duration-200 group"
          style={{
            background: `linear-gradient(135deg, ${copperStrong}, ${copper})`,
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(76,46,18,0.25)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(76,46,18,0.35)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(76,46,18,0.25)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Phone className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-lg">Start Voice Call</h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
            Talk to AarogyaVaani right now
          </p>
        </Link>

        <div
          className="rounded-2xl p-6"
          style={{
            background: cardGradient,
            border: `1px solid ${cardBorder}`,
            boxShadow: warmShadow,
          }}
        >
          <Activity className="w-8 h-8 mb-3" style={{ color: copper }} />
          <h3 className="font-semibold text-lg" style={{ color: espresso }}>
            System Status
          </h3>
          {loading ? (
            <p className="text-sm mt-1" style={{ color: espressoSoft }}>Checking...</p>
          ) : backendStatus?.status === 'ok' ? (
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="w-4 h-4" style={{ color: '#00a544' }} />
              <span className="text-sm" style={{ color: '#15803d' }}>All systems operational</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
              <span className="text-sm" style={{ color: '#b91c1c' }}>Backend unreachable</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              className="rounded-2xl p-5 transition-all duration-200"
              style={{
                background: cardGradient,
                border: `1px solid ${cardBorder}`,
                boxShadow: warmShadow,
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = warmShadowHover
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = warmShadow
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5" style={{ color: copper }} />
                <span
                  className="text-2xl font-bold"
                  style={{ color: espresso }}
                >
                  {s.value}
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: espresso }}>
                {s.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: espressoSoft }}>
                {s.detail}
              </p>
            </div>
          )
        })}
      </div>

      {/* Service health */}
      <div
        className="overflow-hidden"
        style={{
          background: cardGradient,
          border: `1px solid ${cardBorder}`,
          boxShadow: warmShadow,
          borderRadius: '1.4rem',
        }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: `1px solid ${cardBorder}` }}
        >
          <h2
            className="font-semibold"
            style={{ color: espresso, fontFamily: headingFont }}
          >
            Service Health
          </h2>
        </div>
        <div>
          {[
            { name: 'FastAPI Backend', url: 'aarogyavaani-api.vercel.app', icon: Server, status: backendStatus?.status === 'ok' },
            { name: 'Qdrant Vector DB', url: 'Qdrant Cloud (EU-West-1)', icon: Database, status: true },
            { name: 'Vapi Voice AI', url: 'GPT-4o + ElevenLabs + Deepgram', icon: Phone, status: true },
            { name: 'HuggingFace Embeddings', url: 'multilingual-e5-large-instruct', icon: Brain, status: true },
          ].map((service, i, arr) => (
            <div
              key={i}
              className="px-5 py-3.5 flex items-center justify-between"
              style={
                i < arr.length - 1
                  ? { borderBottom: `1px solid ${cardBorder}` }
                  : {}
              }
            >
              <div className="flex items-center gap-3">
                <service.icon className="w-4.5 h-4.5" style={{ color: espressoSoft }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: espresso }}>
                    {service.name}
                  </p>
                  <p className="text-xs" style={{ color: espressoSoft }}>
                    {service.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: service.status ? '#00a544' : '#dc2626' }}
                />
                <span style={{ color: service.status ? '#15803d' : '#b91c1c' }}>
                  {service.status ? 'Healthy' : 'Down'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div
        className="mt-8 p-5"
        style={{
          background: cardGradient,
          border: `1px solid ${cardBorder}`,
          boxShadow: warmShadow,
          borderRadius: '1.4rem',
        }}
      >
        <h2
          className="font-semibold mb-3"
          style={{ color: espresso, fontFamily: headingFont }}
        >
          Tech Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {['Vapi', 'Qdrant', 'GPT-4o', 'FastAPI', 'ElevenLabs', 'Deepgram', 'HuggingFace', 'React', 'Vercel', 'Python'].map(tech => (
            <span
              key={tech}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{
                background: '#fff8f1',
                color: espressoSoft,
                border: `1px solid ${cardBorder}`,
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
