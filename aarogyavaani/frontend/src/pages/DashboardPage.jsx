import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Activity, Database, Server, CheckCircle, XCircle, Globe, Heart, Brain, Users } from 'lucide-react'
import { healthCheck } from '../lib/api'

const stats = [
  { label: 'Languages Supported', value: '3', detail: 'Hindi, English, Kannada', icon: Globe },
  { label: 'Knowledge Chunks', value: '23', detail: 'Health, schemes, maternal', icon: Brain },
  { label: 'Target Users', value: '500M+', detail: 'Rural India population', icon: Users },
]

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    healthCheck()
      .then(data => { setBackendStatus(data); setLoading(false) })
      .catch(() => { setBackendStatus(null); setLoading(false) })
  }, [])

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-text-secondary mt-1">System status and quick actions for AarogyaVaani</p>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/call"
          className="bg-primary-600 text-white rounded-xl p-6 hover:bg-primary-700 transition-colors group"
        >
          <Phone className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-lg">Start Voice Call</h3>
          <p className="text-primary-100 text-sm mt-1">Talk to AarogyaVaani right now</p>
        </Link>
        <div className="bg-surface-elevated rounded-xl p-6 border border-gray-100">
          <Activity className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-lg text-gray-900">System Status</h3>
          {loading ? (
            <p className="text-sm text-text-muted mt-1">Checking...</p>
          ) : backendStatus?.status === 'ok' ? (
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">All systems operational</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">Backend unreachable</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-surface-elevated rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-primary-500" />
                <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{s.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{s.detail}</p>
            </div>
          )
        })}
      </div>

      {/* Service health */}
      <div className="bg-surface-elevated rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Service Health</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { name: 'FastAPI Backend', url: 'aarogyavaani-api.vercel.app', icon: Server, status: backendStatus?.status === 'ok' },
            { name: 'Qdrant Vector DB', url: 'Qdrant Cloud (EU-West-1)', icon: Database, status: true },
            { name: 'Vapi Voice AI', url: 'GPT-4o + ElevenLabs + Deepgram', icon: Phone, status: true },
            { name: 'HuggingFace Embeddings', url: 'multilingual-e5-large-instruct', icon: Brain, status: true },
          ].map((service, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <service.icon className="w-4.5 h-4.5 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-text-muted">{service.url}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${service.status ? 'text-green-600' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${service.status ? 'bg-green-500' : 'bg-red-500'}`} />
                {service.status ? 'Healthy' : 'Down'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="mt-8 bg-surface-elevated rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {['Vapi', 'Qdrant', 'GPT-4o', 'FastAPI', 'ElevenLabs', 'Deepgram', 'HuggingFace', 'React', 'Vercel', 'Python'].map(tech => (
            <span key={tech} className="bg-gray-50 text-text-secondary text-xs px-3 py-1.5 rounded-full border border-gray-100">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
