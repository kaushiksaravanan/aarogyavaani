import { useState, useRef } from 'react'
import { ScanLine, Upload, Camera, Loader2, FileText, Pill, TestTube, CreditCard, AlertTriangle, CheckCircle, Sparkles, X, Image } from 'lucide-react'
import { smartScan } from '../lib/api'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, SelectInput, Badge, EmptyState, StatusBanner, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'

const SCAN_TYPES = [
  { value: 'auto', label: 'Auto-detect', icon: ScanLine, description: 'Let Gemini identify the document type' },
  { value: 'prescription', label: 'Prescription', icon: FileText, description: 'Handwritten or printed prescriptions' },
  { value: 'medicine_label', label: 'Medicine Label', icon: Pill, description: 'Medicine box or bottle labels' },
  { value: 'blister_pack', label: 'Blister Pack', icon: Pill, description: 'Medicine blister pack with details' },
  { value: 'lab_report', label: 'Lab Report', icon: TestTube, description: 'Blood tests, X-rays, pathology reports' },
  { value: 'government_document', label: 'Govt Scheme Card', icon: CreditCard, description: 'Ayushman Bharat, PMJAY cards' },
  { value: 'handwritten_note', label: 'Handwritten Note', icon: FileText, description: 'Notes from doctor visits' },
]

export default function SmartScanPage() {
  const userId = getStoredUserId()
  const fileInputRef = useRef(null)
  const [scanType, setScanType] = useState('auto')
  const [imageData, setImageData] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResults(null)

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10 MB')
      return
    }

    setMimeType(file.type)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setImageData(base64)
      setImagePreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleScan = async () => {
    if (!userId) { setError('Please set a user ID in your profile first.'); return }
    if (!imageData) { setError('Please select an image first.'); return }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await smartScan({ userId, imageBase64: imageData, mimeType, scanType })
      if (data.status === 'error') throw new Error(data.error || 'Scan failed')
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearImage = () => {
    setImageData(null)
    setImagePreview(null)
    setResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <AppPage maxWidth="72rem">
      <PageHeader
        icon={ScanLine}
        eyebrow="AI document scanner"
        title="Smart scan"
        subtitle="Scan prescriptions, medicine labels, lab reports, and government health cards using Gemini Vision AI. Works with handwritten and printed documents in any Indian language."
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Badge tone="info"><Sparkles className="w-3 h-3" /> Gemini Vision AI</Badge>
        <Badge tone="copper"><ScanLine className="w-3 h-3" /> 7 Document Types</Badge>
      </div>

      {error && <StatusBanner icon={AlertTriangle} title="Error" subtitle={error} tone="danger" style={{ marginBottom: '1rem' }} />}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Upload panel */}
        <div className="lg:col-span-2">
          <SurfaceCard title="Upload document" icon={Camera} style={{ marginBottom: '1rem' }}>
            <div className="space-y-3">
              <SelectInput label="Document type" value={scanType} onChange={(e) => setScanType(e.target.value)}>
                {SCAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </SelectInput>

              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: appTheme.espressoSoft, marginBottom: '0.25rem' }}>
                {SCAN_TYPES.find((t) => t.value === scanType)?.description}
              </div>

              {/* Upload zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '2.5rem 1rem',
                    borderRadius: '1rem',
                    border: '2px dashed rgba(198,117,12,0.3)',
                    background: 'rgba(198,117,12,0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{
                    width: '3.5rem', height: '3.5rem', borderRadius: '1rem',
                    display: 'grid', placeItems: 'center',
                    background: 'rgba(198,117,12,0.1)',
                  }}>
                    <Upload className="w-6 h-6" style={{ color: appTheme.copper }} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: appTheme.espresso }}>
                    Tap to upload or take a photo
                  </div>
                  <div style={{ fontSize: '0.78rem', color: appTheme.espressoSoft }}>
                    JPG, PNG up to 10 MB
                  </div>
                </button>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="Document preview"
                    style={{
                      width: '100%',
                      borderRadius: '1rem',
                      border: `1px solid ${appTheme.border}`,
                      maxHeight: '18rem',
                      objectFit: 'contain',
                      background: '#f8f6f3',
                    }}
                  />
                  <button
                    onClick={clearImage}
                    style={{
                      position: 'absolute', top: '0.5rem', right: '0.5rem',
                      width: '2rem', height: '2rem', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      border: 'none', cursor: 'pointer',
                      display: 'grid', placeItems: 'center',
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <PrimaryButton onClick={handleScan} disabled={loading || !imageData} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                {loading ? 'Scanning with Gemini...' : 'Scan document'}
              </PrimaryButton>
            </div>
          </SurfaceCard>

          {/* Scan type grid */}
          <SurfaceCard title="Supported documents" icon={FileText}>
            <div className="space-y-2">
              {SCAN_TYPES.filter((t) => t.value !== 'auto').map((t) => {
                const Icon = t.icon
                return (
                  <div
                    key={t.value}
                    onClick={() => setScanType(t.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.6rem 0.7rem', borderRadius: '0.8rem',
                      background: scanType === t.value ? 'rgba(198,117,12,0.08)' : 'transparent',
                      border: scanType === t.value ? '1px solid rgba(198,117,12,0.2)' : '1px solid transparent',
                      cursor: 'pointer', transition: 'all 120ms ease',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: scanType === t.value ? appTheme.copper : appTheme.muted, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: appTheme.espresso }}>{t.label}</div>
                      <div style={{ fontSize: '0.75rem', color: appTheme.espressoSoft }}>{t.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </SurfaceCard>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-3">
          {!results && !loading && (
            <SurfaceCard>
              <EmptyState
                icon={ScanLine}
                title="Ready to scan"
                subtitle="Upload a medical document — prescription, lab report, medicine label, or government scheme card — and Gemini Vision AI will extract all the details."
              />
            </SurfaceCard>
          )}

          {loading && (
            <SurfaceCard>
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" style={{ color: appTheme.copper }} />
                <p style={{ fontFamily: appTheme.headingFont, fontSize: '1.15rem', color: appTheme.espresso }}>Gemini Vision is analyzing...</p>
                <p style={{ color: appTheme.espressoSoft, fontSize: '0.88rem', marginTop: '0.3rem' }}>
                  Extracting text, medicines, dosages, and more
                </p>
              </div>
            </SurfaceCard>
          )}

          {results && (
            <div className="space-y-4">
              <StatusBanner
                icon={CheckCircle}
                title="Scan complete"
                subtitle={`Document type: ${results.detected_type || results.scan_type || scanType}`}
                tone="success"
              />

              {/* Extracted text */}
              {results.extracted_text && (
                <SurfaceCard title="Extracted text" icon={FileText}>
                  <div style={{
                    color: appTheme.espresso, lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', background: 'rgba(34,22,14,0.03)',
                    padding: '1rem', borderRadius: '0.8rem',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: '0.82rem',
                  }}>
                    {results.extracted_text}
                  </div>
                </SurfaceCard>
              )}

              {/* Medicines found */}
              {results.medicines && results.medicines.length > 0 && (
                <SurfaceCard title={`Medicines found (${results.medicines.length})`} icon={Pill}>
                  <div className="space-y-3">
                    {results.medicines.map((med, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.8rem', borderRadius: '0.9rem',
                          border: `1px solid ${appTheme.border}`,
                          background: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: appTheme.espresso }}>
                            {med.name || med.medicine_name || `Medicine ${i + 1}`}
                          </div>
                          {med.frequency && <Badge tone="copper">{med.frequency}</Badge>}
                        </div>
                        {med.dosage && <div style={{ fontSize: '0.82rem', color: appTheme.espressoSoft, marginTop: '0.25rem' }}>Dosage: {med.dosage}</div>}
                        {med.duration && <div style={{ fontSize: '0.82rem', color: appTheme.espressoSoft }}>Duration: {med.duration}</div>}
                        {med.purpose && <div style={{ fontSize: '0.82rem', color: appTheme.copper, marginTop: '0.2rem' }}>For: {med.purpose}</div>}
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              )}

              {/* Lab results */}
              {results.lab_results && results.lab_results.length > 0 && (
                <SurfaceCard title={`Lab results (${results.lab_results.length})`} icon={TestTube}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${appTheme.border}` }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem', color: appTheme.espressoSoft, fontWeight: 600 }}>Test</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem', color: appTheme.espressoSoft, fontWeight: 600 }}>Value</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem', color: appTheme.espressoSoft, fontWeight: 600 }}>Range</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem', color: appTheme.espressoSoft, fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.lab_results.map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${appTheme.border}` }}>
                            <td style={{ padding: '0.5rem', color: appTheme.espresso, fontWeight: 600 }}>{r.test_name || r.name}</td>
                            <td style={{ padding: '0.5rem', color: appTheme.espresso }}>{r.value} {r.unit || ''}</td>
                            <td style={{ padding: '0.5rem', color: appTheme.espressoSoft }}>{r.reference_range || r.normal_range || '-'}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <Badge tone={r.status === 'normal' ? 'success' : r.status === 'high' || r.status === 'low' ? 'warning' : 'neutral'}>
                                {r.status || 'N/A'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SurfaceCard>
              )}

              {/* Doctor info */}
              {results.doctor_info && (
                <SurfaceCard title="Doctor information" icon={FileText}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(results.doctor_info).map(([key, val]) => (
                      val && (
                        <div key={key}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: appTheme.espressoSoft, textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '0.88rem', color: appTheme.espresso }}>{val}</div>
                        </div>
                      )
                    ))}
                  </div>
                </SurfaceCard>
              )}

              {/* AI Summary */}
              {results.summary && (
                <SurfaceCard title="Gemini AI summary" icon={Sparkles}>
                  <p style={{ fontSize: '0.88rem', color: appTheme.espressoSoft, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {results.summary}
                  </p>
                </SurfaceCard>
              )}

              {/* Warnings */}
              {results.warnings && results.warnings.length > 0 && (
                <StatusBanner
                  icon={AlertTriangle}
                  title="Important notes"
                  subtitle={results.warnings.join(' | ')}
                  tone="warning"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </AppPage>
  )
}
