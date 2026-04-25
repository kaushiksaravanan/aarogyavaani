import { useState, useEffect } from 'react'
import { Database, BookOpen, Brain, Search, ChevronLeft, ChevronRight, User, Copy, Check } from 'lucide-react'
import { browseKnowledgeBase, browseUserMemory } from '../lib/api'
import { AppPage, PageHeader, SurfaceCard, SecondaryButton, Badge, EmptyState, TextInput, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

function getUserId() {
  return getStoredUserId()
}

function getLanguageTone(lang) {
  const tones = {
    hi: { tone: 'warning', label: 'Hindi' },
    en: { tone: 'info', label: 'English' },
    kn: { tone: 'success', label: 'Kannada' },
    ta: { tone: 'danger', label: 'Tamil' },
    te: { tone: 'violet', label: 'Telugu' },
    auto: { tone: 'neutral', label: 'Auto' },
  }
  return tones[lang] || { tone: 'neutral', label: lang || 'Unknown' }
}

function ChunkCard({ chunk, type = 'knowledge' }) {
  const text = chunk.text || '(empty)'
  const truncated = text.length > 300 ? `${text.slice(0, 300)}...` : text
  const [expanded, setExpanded] = useState(false)
  const language = getLanguageTone(chunk.language)

  return (
    <SurfaceCard
      style={{ borderRadius: '1rem' }}
      title={chunk.topic || (type === 'knowledge' ? 'Knowledge entry' : 'Memory entry')}
      icon={type === 'knowledge' ? BookOpen : Brain}
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {chunk.source ? <Badge>{chunk.source}</Badge> : null}
          {chunk.type && type === 'memory' ? <Badge tone="copper">{chunk.type}</Badge> : null}
          <Badge tone={language.tone}>{language.label}</Badge>
          <span style={{ fontSize: '0.68rem', color: appTheme.espressoSoft, fontFamily: 'monospace' }}>#{chunk.id?.slice(0, 8)}</span>
        </div>
      }
    >
      <p style={{ fontSize: '0.86rem', lineHeight: 1.68, color: appTheme.espresso, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {expanded ? text : truncated}
      </p>
      {text.length > 300 ? (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ marginTop: '0.65rem', fontSize: '0.78rem', fontWeight: 600, color: appTheme.copper, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
      {chunk.timestamp ? (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.7rem', borderTop: `1px solid ${appTheme.border}`, fontSize: '0.74rem', color: appTheme.espressoSoft }}>
          {new Date(chunk.timestamp).toLocaleString?.() || chunk.timestamp}
        </div>
      ) : null}
    </SurfaceCard>
  )
}

export default function KnowledgeBasePage() {
  const [tab, setTab] = useState('knowledge')
  const [knowledgeData, setKnowledgeData] = useState({ chunks: [], total: 0 })
  const [memoryData, setMemoryData] = useState({ chunks: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [searchFilter, setSearchFilter] = useState('')
  const [userId, setUserId] = useState(getUserId)
  const [copied, setCopied] = useState(false)
  const PAGE_SIZE = 20

  useEffect(() => {
    if (tab !== 'knowledge') return
    setLoading(true)
    browseKnowledgeBase(offset, PAGE_SIZE).then((data) => {
      if (data.status === 'ok') setKnowledgeData({ chunks: data.chunks, total: data.total })
      setLoading(false)
    })
  }, [tab, offset])

  useEffect(() => {
    if (tab !== 'memory' || !userId.trim()) return
    setLoading(true)
    browseUserMemory(userId.trim()).then((data) => {
      if (data.status === 'ok') setMemoryData({ chunks: data.chunks, total: data.total })
      setLoading(false)
    })
  }, [tab, userId])

  const displayChunks = tab === 'knowledge' ? knowledgeData.chunks : memoryData.chunks
  const filtered = searchFilter
    ? displayChunks.filter((c) =>
        (c.text || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (c.topic || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (c.source || '').toLowerCase().includes(searchFilter.toLowerCase())
      )
    : displayChunks

  const totalCount = tab === 'knowledge' ? knowledgeData.total : memoryData.total

  const copyUserId = () => {
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <AppPage maxWidth="74rem">
      <PageHeader
        icon={Database}
        eyebrow="Qdrant browser"
        title="Knowledge and memory explorer"
        subtitle="Inspect shared health knowledge and the personal memory AarogyaVaani builds from reports and conversations."
      />

      <div className="grid lg:grid-cols-[1.05fr_2fr] gap-4">
        <SurfaceCard title="Active identity" icon={User}>
          <div style={{ fontSize: '0.78rem', color: appTheme.espressoSoft, marginBottom: '0.35rem' }}>Current user ID</div>
          {userId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <code
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: appTheme.espresso,
                  background: 'rgba(34,22,14,0.05)',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.8rem',
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                }}
              >
                {userId}
              </code>
              <SecondaryButton onClick={copyUserId}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy ID'}
              </SecondaryButton>
            </div>
          ) : (
            <div style={{ fontSize: '0.86rem', lineHeight: 1.6, color: appTheme.espressoSoft }}>
              No user ID yet. Complete onboarding or save a profile to start building memory.
            </div>
          )}
          <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            <Badge tone="copper">Calls</Badge>
            <Badge tone="copper">Reports</Badge>
            <Badge tone="copper">Doctor brief</Badge>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Browse storage"
          icon={Search}
          right={
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { key: 'knowledge', label: 'Health Knowledge', icon: BookOpen, count: knowledgeData.total },
                { key: 'memory', label: 'Your Memory', icon: Brain, count: memoryData.total },
              ].map((item) => {
                const Icon = item.icon
                const active = tab === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setTab(item.key)
                      setOffset(0)
                      setSearchFilter('')
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '999px',
                      border: active ? `1px solid ${appTheme.borderStrong}` : `1px solid ${appTheme.border}`,
                      background: active ? 'rgba(198,117,12,0.10)' : '#fff',
                      color: active ? appTheme.copperStrong : appTheme.espressoSoft,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.count > 0 ? <Badge tone={active ? 'copper' : 'neutral'} style={{ padding: '0.1rem 0.45rem' }}>{item.count}</Badge> : null}
                  </button>
                )
              })}
            </div>
          }
        >
          {tab === 'memory' ? (
            <div className="grid md:grid-cols-[1fr_auto] gap-3 mb-3">
              <TextInput label="User ID to browse memory for" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g. user_abc123..." inputStyle={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }} />
              <div style={{ alignSelf: 'end' }}>
                <SecondaryButton
                  onClick={() => {
                    setLoading(true)
                    browseUserMemory(userId.trim()).then((data) => {
                      if (data.status === 'ok') setMemoryData({ chunks: data.chunks, total: data.total })
                      setLoading(false)
                    })
                  }}
                >
                  Load memory
                </SecondaryButton>
              </div>
            </div>
          ) : null}

          <TextInput
            label="Filter results"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search text, topic, or source..."
          />

          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: appTheme.espressoSoft }}>
            Showing {filtered.length} of {totalCount} {tab === 'knowledge' ? 'entries' : 'memory items'}
            {searchFilter ? ' after filtering' : ''}.
          </div>
        </SurfaceCard>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <SurfaceCard>
            <EmptyState icon={Database} title="Loading from Qdrant" subtitle="Fetching the latest knowledge and user memory entries." />
          </SurfaceCard>
        ) : filtered.length === 0 ? (
          <SurfaceCard>
            <EmptyState
              icon={tab === 'memory' ? Brain : BookOpen}
              title={tab === 'memory' ? 'No memory found' : 'No knowledge entries found'}
              subtitle={tab === 'memory' ? 'Make a call or upload reports first to build personal memory.' : 'The shared knowledge base is currently empty.'}
            />
          </SurfaceCard>
        ) : (
          <div className="grid gap-3">
            {filtered.map((chunk) => (
              <ChunkCard key={chunk.id} chunk={chunk} type={tab} />
            ))}
          </div>
        )}
      </div>

      {tab === 'knowledge' && !loading && knowledgeData.total > PAGE_SIZE ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
          <SecondaryButton disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
            <ChevronLeft className="w-4 h-4" />Prev
          </SecondaryButton>
          <div style={{ fontSize: '0.82rem', color: appTheme.espressoSoft }}>
            Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.ceil(knowledgeData.total / PAGE_SIZE)}
          </div>
          <SecondaryButton disabled={offset + PAGE_SIZE >= knowledgeData.total} onClick={() => setOffset(offset + PAGE_SIZE)}>
            Next<ChevronRight className="w-4 h-4" />
          </SecondaryButton>
        </div>
      ) : null}
    </AppPage>
  )
}
