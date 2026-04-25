import { useMemo, useState } from 'react'
import { Settings, Lock, Cloud, Shield, FlaskConical, Languages } from 'lucide-react'
import { AppPage, PageHeader, SurfaceCard, SecondaryButton, StatusBanner, Badge, appTheme } from '../components/AppPrimitives'
import { getDocumentPrivacyMode, setDocumentPrivacyMode, getOcrLanguages, setOcrLanguages } from '../lib/settingsStore'

const OCR_LANGUAGE_OPTIONS = [
  { code: 'eng', label: 'English OCR' },
  { code: 'hin', label: 'Hindi OCR' },
  { code: 'kan', label: 'Kannada OCR' },
]

export default function SettingsPage() {
  const [documentPrivacyMode, setMode] = useState(() => getDocumentPrivacyMode())
  const [ocrLanguages, setLanguages] = useState(() => getOcrLanguages())
  const [saved, setSaved] = useState(false)

  const modeMeta = useMemo(() => ({
    cloud: {
      icon: Cloud,
      title: 'Cloud memory mode',
      detail: 'Uploads reports for server-side extraction, doctor briefs, and cloud memory retrieval.',
      tone: 'info',
    },
    private: {
      icon: Lock,
      title: 'Private on-device mode',
      detail: 'Keeps document text encrypted on this device and enables local private querying.',
      tone: 'success',
    },
  }), [])

  function saveMode(mode) {
    setMode(mode)
    setDocumentPrivacyMode(mode)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  function toggleOcrLanguage(language) {
    const next = ocrLanguages.includes(language)
      ? ocrLanguages.filter(code => code !== language)
      : [...ocrLanguages, language]
    const normalized = next.length > 0 ? next : ['eng']
    setLanguages(normalized)
    setOcrLanguages(normalized)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <AppPage maxWidth="60rem">
      <PageHeader
        icon={Settings}
        eyebrow="Controls"
        title="Settings"
        subtitle="Control how AarogyaVaani handles private documents, retrieval, and future experimental safety features."
      />

      {saved ? (
        <StatusBanner
          icon={Shield}
          title="Settings saved"
          subtitle="Your document privacy mode is now active across uploads and local retrieval."
          tone="success"
          style={{ marginBottom: '1rem' }}
        />
      ) : null}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <SurfaceCard
          title="Document privacy mode"
          icon={Lock}
          right={<Badge tone={modeMeta[documentPrivacyMode]?.tone || 'neutral'}>{documentPrivacyMode === 'private' ? 'Private on-device' : 'Cloud memory'}</Badge>}
        >
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {Object.entries(modeMeta).map(([key, meta]) => {
              const Icon = meta.icon
              const active = documentPrivacyMode === key
              return (
                <button
                  key={key}
                  onClick={() => saveMode(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    borderRadius: '1rem',
                    border: active ? `1px solid ${appTheme.borderStrong}` : `1px solid ${appTheme.border}`,
                    background: active ? 'rgba(198,117,12,0.08)' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.9rem', display: 'grid', placeItems: 'center', background: active ? 'rgba(198,117,12,0.12)' : 'rgba(34,22,14,0.04)' }}>
                      <Icon className="w-4 h-4" style={{ color: active ? appTheme.copperStrong : appTheme.espressoSoft }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: appTheme.espresso }}>{meta.title}</div>
                      <div style={{ fontSize: '0.83rem', color: appTheme.espressoSoft, lineHeight: 1.6, marginTop: '0.25rem', maxWidth: '38rem' }}>{meta.detail}</div>
                    </div>
                  </div>
                  {active ? <Badge tone={meta.tone}>Active</Badge> : null}
                </button>
              )
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="OCR languages"
          icon={Languages}
          right={<Badge tone="violet">{ocrLanguages.join(' + ')}</Badge>}
        >
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.84rem', color: appTheme.espressoSoft, lineHeight: 1.65 }}>
              Select which OCR languages should be loaded for private on-device document reading. More languages improve recall but can increase local processing time.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {OCR_LANGUAGE_OPTIONS.map((option) => {
                const active = ocrLanguages.includes(option.code)
                return (
                  <button
                    key={option.code}
                    onClick={() => toggleOcrLanguage(option.code)}
                    style={{
                      padding: '0.7rem 0.95rem',
                      borderRadius: '0.9rem',
                      border: active ? `1px solid ${appTheme.borderStrong}` : `1px solid ${appTheme.border}`,
                      background: active ? 'rgba(198,117,12,0.10)' : '#fff',
                      color: active ? appTheme.copperStrong : appTheme.espressoSoft,
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Experimental roadmap" icon={FlaskConical}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.88rem', color: appTheme.espresso, lineHeight: 1.7 }}>
              Next upgrades planned behind this settings surface:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Badge tone="warning">On-device OCR</Badge>
              <Badge tone="violet">Local vector retrieval</Badge>
              <Badge tone="info">Private document translation</Badge>
              <Badge tone="success">Confidence-aware escalation</Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: appTheme.espressoSoft, lineHeight: 1.65 }}>
              This page is the long-term home for privacy, local AI, and safety controls so the call surface stays simple during urgent moments.
            </div>
            <div>
              <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                <SecondaryButton onClick={() => saveMode(documentPrivacyMode)}>Re-save current mode</SecondaryButton>
                <a href="#/private-documents" style={{ textDecoration: 'none' }}>
                  <SecondaryButton>Open private documents</SecondaryButton>
                </a>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
