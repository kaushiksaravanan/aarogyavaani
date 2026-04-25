import { useEffect, useState } from 'react'
import { Lock, FileText, Trash2, Search, Shield, Loader2 } from 'lucide-react'
import { AppPage, PageHeader, SurfaceCard, SecondaryButton, TextInput, EmptyState, StatusBanner, Badge, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'
import { getPrivateDocuments, removePrivateDocument } from '../lib/privateDocuments'

export default function PrivateDocumentsPage() {
  const userId = getStoredUserId()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let mounted = true
    getPrivateDocuments(userId)
      .then((docs) => {
        if (!mounted) return
        setDocuments(docs)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || 'Could not load private documents.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [userId])

  async function removeDoc(docId) {
    try {
      const next = await removePrivateDocument(userId, docId)
      setDocuments(next)
      setNotice('Private document removed from this device.')
      window.setTimeout(() => setNotice(''), 1800)
    } catch (err) {
      setError(err.message || 'Could not remove private document.')
    }
  }

  const filtered = filter.trim()
    ? documents.filter((doc) => {
        const haystack = `${doc.fileName} ${doc.summary} ${(doc.keywords || []).join(' ')}`.toLowerCase()
        return haystack.includes(filter.toLowerCase())
      })
    : documents

  return (
    <AppPage maxWidth="70rem">
      <PageHeader
        icon={Lock}
        eyebrow="Private Vault"
        title="Private documents"
        subtitle="Browse and manage documents that stay encrypted on this device and are used only for local retrieval."
      />

      {notice ? <StatusBanner icon={Shield} title="Updated" subtitle={notice} tone="success" style={{ marginBottom: '1rem' }} /> : null}
      {error ? <StatusBanner icon={Shield} title="Private vault error" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} /> : null}

      <SurfaceCard title="Search local vault" icon={Search} style={{ marginBottom: '1rem' }}>
        <TextInput
          label="Filter private documents"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search file name, summary, or keywords..."
        />
      </SurfaceCard>

      {loading ? (
        <SurfaceCard>
          <EmptyState icon={Loader2} title="Loading private documents" subtitle="Decrypting local document metadata for this device." />
        </SurfaceCard>
      ) : filtered.length === 0 ? (
        <SurfaceCard>
          <EmptyState
            icon={FileText}
            title={documents.length === 0 ? 'No private documents yet' : 'No matching private documents'}
            subtitle={documents.length === 0 ? 'Switch document privacy mode to private in Settings, then upload a report from the call page.' : 'Try a different keyword or clear the filter.'}
          />
        </SurfaceCard>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((doc) => (
            <SurfaceCard
              key={doc.id}
              title={doc.fileName || 'Private document'}
              icon={Lock}
              right={<Badge tone="success">Local only</Badge>}
            >
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.86rem', color: appTheme.espresso, lineHeight: 1.7 }}>
                  {doc.summary || 'No summary stored.'}
                </div>
                {doc.keywords?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {doc.keywords.slice(0, 10).map((keyword, index) => (
                      <Badge key={`${keyword}-${index}`} tone="violet">{keyword}</Badge>
                    ))}
                  </div>
                ) : null}
                <div style={{ fontSize: '0.78rem', color: appTheme.espressoSoft }}>
                  Saved {doc.savedAt ? new Date(doc.savedAt).toLocaleString() : 'recently'} · {(doc.chunks || []).length} local chunk(s)
                </div>
                <div>
                  <SecondaryButton onClick={() => removeDoc(doc.id)}>
                    <Trash2 className="w-4 h-4" />Remove from device
                  </SecondaryButton>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </AppPage>
  )
}
