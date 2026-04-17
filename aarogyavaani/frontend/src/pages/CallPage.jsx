import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Loader2, Heart, Volume2, Clock, MessageSquare, X, AlertCircle, Upload, FileText, Stethoscope, ChevronDown, BookOpen, ShieldAlert } from 'lucide-react'
import { getVapi, destroyVapi } from '../lib/vapi'
import { CONFIG } from '../lib/config'
import { uploadMedicalReport, getDoctorBrief, getMedicalReports } from '../lib/api'
import NurseAvatar from '../components/NurseAvatar'
import VoiceOnboarding, { shouldShowOnboarding } from '../components/GuidedTour'

const STATUS_MAP = {
  idle: { label: 'Ready to call', color: 'hsl(45 21% 65%)' },
  connecting: { label: 'Connecting...', color: 'hsl(28 45% 57%)' },
  active: { label: 'Call active', color: 'hsl(28 49% 49%)' },
  ended: { label: 'Call ended', color: 'hsl(45 21% 50%)' },
}

/* warm pulse keyframes are in index.css */

export default function CallPage() {
  const [status, setStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  // Doctor mode
  const [doctorMode, setDoctorMode] = useState(false)
  const [doctorBrief, setDoctorBrief] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  // Upload
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  // References/reports
  const [reports, setReports] = useState([])
  const [activeTab, setActiveTab] = useState('transcript') // 'transcript' | 'reports'
  const [reportReferenceNotice, setReportReferenceNotice] = useState(null)
  // Red flag emergency
  const [emergency, setEmergency] = useState(null) // { keyword, timestamp }
  // Offline/low-network fallback
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [textQuery, setTextQuery] = useState('')
  const [textResponses, setTextResponses] = useState([])
  const [textLoading, setTextLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding())
  const fileInputRef = useRef(null)
  const timerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const statusRef = useRef(status)

  // Keep statusRef in sync
  useEffect(() => {
    statusRef.current = status
  }, [status])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Network status listener
  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  // Text-based fallback query
  const handleTextQuery = async () => {
    if (!textQuery.trim() || textLoading) return
    const q = textQuery.trim()
    setTextQuery('')
    setTextResponses(prev => [...prev, { role: 'user', text: q }])
    setTextLoading(true)
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/query_health_knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, query: q, language: 'auto' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTextResponses(prev => [...prev, { role: 'assistant', text: data.context || data.reasoning_summary || 'No response available.' }])
    } catch (err) {
      setTextResponses(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}. Please try again.` }])
    } finally {
      setTextLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      // Do NOT call destroyVapi() here.
      // React StrictMode double-mounts: mount → unmount → mount.
      // If a call is in progress during the unmount phase, destroyVapi()
      // calls vapi.stop() which signals the server to end the call.
      // Calls are stopped explicitly via the end-call button in handleCall().
    }
  }, [])

  // Attach listeners whenever we get a (possibly new) vapi instance
  const attachListeners = (vapi) => {
    const onCallStart = () => {
      console.log('[AV] call-start: Daily.co room joined, call is active')
      setStatus('active')
      setErrorMsg(null)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }

    const onCallEnd = () => {
      console.log('[AV] call-end: Call ended normally')
      setStatus('ended')
      if (timerRef.current) clearInterval(timerRef.current)
      // Destroy the instance so next call gets a fresh one (prevents KrispSDK duplication)
      destroyVapi()
      setTimeout(() => setStatus('idle'), 3000)
    }

    const onMessage = (msg) => {
      if (msg.type === 'transcript') {
        // Red flag detection
        if (msg.transcriptType === 'final') {
          const text = (msg.transcript || '').toLowerCase()
          const RED_FLAGS = [
            { pattern: /chest\s*pain|seene?\s*mein\s*dard|chhaati\s*mein\s*dard|heart\s*attack/i, label: 'Chest Pain / Heart Attack' },
            { pattern: /pregnancy\s*bleed|garbh\s*se\s*khoon|bleeding\s*during\s*pregnan/i, label: 'Pregnancy Bleeding' },
            { pattern: /stroke|face\s*droop|arm\s*weakness|sudden\s*confusion/i, label: 'Stroke Signs' },
            { pattern: /can'?t\s*breathe|saans\s*nahi|saans\s*phool|dam\s*ghut|breathing\s*difficult/i, label: 'Severe Breathing Difficulty' },
            { pattern: /unconscious|behosh|hosh\s*nahi|passed?\s*out|faint/i, label: 'Unconsciousness' },
            { pattern: /104\s*f|40\s*c|bahut\s*tez\s*bukhar|very\s*high\s*fever/i, label: 'Very High Fever' },
            { pattern: /anaphyla|throat\s*swell|face\s*swell|severe\s*allerg/i, label: 'Severe Allergic Reaction' },
            { pattern: /seizure|mirgi|convulsion/i, label: 'Seizures' },
            { pattern: /heavy\s*bleed|bahut\s*zyada\s*khoon|uncontrolled\s*bleed/i, label: 'Heavy Bleeding' },
          ]
          for (const flag of RED_FLAGS) {
            if (flag.pattern.test(text)) {
              setEmergency({ keyword: flag.label, timestamp: Date.now() })
              break
            }
          }
        }

        setMessages(prev => {
          const existing = prev.find(m => m.id === msg.transcriptId && m.role === msg.role)
          if (existing) {
            return prev.map(m => m.id === msg.transcriptId && m.role === msg.role
              ? { ...m, text: msg.transcript, final: msg.transcriptType === 'final' }
              : m
            )
          }
          return [...prev, {
            id: msg.transcriptId || Date.now(),
            role: msg.role,
            text: msg.transcript,
            final: msg.transcriptType === 'final',
            timestamp: new Date(),
          }]
        })
      } else {
        console.log('[AV] message:', msg.type, msg)
      }
    }

    const onVolumeLevel = (level) => setVolumeLevel(level)

    const onSpeechStart = () => console.log('[AV] speech-start: Assistant started speaking')
    const onSpeechEnd = () => console.log('[AV] speech-end: Assistant stopped speaking')

    const onError = (err) => {
      const errText = err?.error?.errorMsg || err?.error?.message || ''
      if (err?.type === 'daily-error' && /Meeting has ended/i.test(errText)) {
        console.log('[AV] daily-error (suppressed): Normal post-call teardown')
        return
      }
      console.error('[AV] ERROR:', JSON.stringify(err, null, 2))
      console.error('[AV] Error type:', err?.type, '| stage:', err?.stage, '| message:', errText)
      setStatus(prev => prev === 'connecting' ? 'idle' : prev)
      if (timerRef.current) clearInterval(timerRef.current)
    }

    vapi.on('call-start', onCallStart)
    vapi.on('call-end', onCallEnd)
    vapi.on('message', onMessage)
    vapi.on('volume-level', onVolumeLevel)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('speech-end', onSpeechEnd)
    vapi.on('error', onError)

    console.log('[AV] All event listeners attached')
  }

  const handleCall = async () => {
    if (status === 'active' || status === 'connecting') {
      console.log('[AV] User ending call. Current status:', status)
      try { getVapi().stop() } catch (_) {}
      destroyVapi()
      setStatus('ended')
      if (timerRef.current) clearInterval(timerRef.current)
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      console.log('[AV] === Starting new call ===')
      console.log('[AV] Step 1: Setting status to connecting')
      setStatus('connecting')
      setMessages([])
      setErrorMsg(null)
      try {
        console.log('[AV] Step 2: Destroying old Vapi instance')
        destroyVapi()
        console.log('[AV] Step 3: Creating fresh Vapi instance with public key:', CONFIG.VAPI_PUBLIC_KEY?.slice(0, 8) + '...')
        const vapi = getVapi()
        console.log('[AV] Step 4: Attaching event listeners')
        attachListeners(vapi)
        console.log('[AV] Step 5: Requesting mic permission + calling vapi.start() with assistantId:', CONFIG.VAPI_ASSISTANT_ID)
        console.log('[AV] Doctor mode:', doctorMode)
        const startTime = Date.now()
        if (doctorMode) {
          await vapi.start(CONFIG.VAPI_ASSISTANT_ID, {
            model: {
              messages: [{
                role: 'system',
                content: 'You are AarogyaVaani in DOCTOR MODE. You are speaking with a medical professional. Provide detailed clinical information, use medical terminology, reference uploaded reports and patient history with specifics. Summarize the patient profile, medications, conditions, and recent interactions comprehensively.',
              }],
            },
            firstMessage: 'Hello Doctor. I have the patient\'s complete history and uploaded reports ready. What would you like to know?',
          })
        } else {
          await vapi.start(CONFIG.VAPI_ASSISTANT_ID)
        }
        console.log(`[AV] Step 6: vapi.start() resolved successfully in ${Date.now() - startTime}ms`)
        console.log('[AV] Waiting for call-start event from Daily.co...')
      } catch (err) {
        console.error('[AV] FAILED at vapi.start():', err)
        console.error('[AV] Error name:', err?.name, '| message:', err?.message)
        console.error('[AV] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err || {}), 2))
        const msg = err?.message || err?.error?.message || 'Could not connect. Please check your internet and try again.'
        setErrorMsg(msg)
        setStatus('idle')
      }
    }
  }

  const toggleMute = () => {
    try {
      const vapi = getVapi()
      if (!vapi || !isActive) return
      vapi.setMuted(!isMuted)
      setIsMuted(!isMuted)
    } catch { /* ignore if no active call */ }
  }

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const isActive = status === 'active' || status === 'connecting'
  const hasMessages = messages.length > 0
  const userId = (() => {
    try {
      const profile = JSON.parse(localStorage.getItem('aarogyavaani_profile') || '{}')
      return profile.userId || profile.name || 'guest'
    } catch { return 'guest' }
  })()

  // Load reports on mount
  useEffect(() => {
    getMedicalReports(userId).then(data => {
      if (data.reports) setReports(data.reports)
    })
  }, [userId])

  useEffect(() => {
    if (reports.length > 0) {
      const latest = [...reports].sort((a, b) => (b.saved_at || '').localeCompare(a.saved_at || ''))[0]
      setReportReferenceNotice(latest)
    } else {
      setReportReferenceNotice(null)
    }
  }, [reports])

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    return processUploadFile(file)
  }

  const processUploadFile = async (file) => {
    if (!file) return
    const maxSize = 6 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadResult({ error: 'File too large. Maximum 6MB.' })
      return
    }
    setUploading(true)
    setUploadResult(null)
    try {
      const reader = new FileReader()
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const result = await uploadMedicalReport({
        userId,
        fileName: file.name,
        mimeType: file.type,
        contentBase64: base64,
      })
      if (result.error) {
        setUploadResult({ error: result.error })
      } else {
        setUploadResult({ success: true, report: result.report || result })
        // Refresh reports list
        const updated = await getMedicalReports(userId)
        if (updated.reports) setReports(updated.reports)
      }
    } catch (err) {
      setUploadResult({ error: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer?.files?.[0]
    await processUploadFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActive(false)
    }
  }

  // Load doctor brief
  const handleDoctorBrief = async () => {
    setLoadingBrief(true)
    const data = await getDoctorBrief(userId)
    setDoctorBrief(data)
    setLoadingBrief(false)
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#120b07' }}>
      {/* Header */}
      <div
        className="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between"
        style={{
          background: '#1b130d',
          borderBottom: '1px solid hsl(28 45% 20%)',
        }}
      >
        <div>
          <h1
            className="text-lg font-semibold"
            style={{
              color: 'hsl(45 21% 95%)',
              fontFamily: '"Instrument Serif", Georgia, serif',
            }}
          >
            Voice Call
          </h1>
          <p className="text-sm hidden sm:block" style={{ color: 'hsl(45 21% 65%)' }}>
            Talk to AarogyaVaani in 30+ languages
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Doctor mode toggle */}
          <button
            onClick={() => setDoctorMode(!doctorMode)}
            data-onboard="doctor-toggle"
            title={doctorMode ? 'Switch to Patient Mode' : 'Switch to Doctor Mode'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: doctorMode ? 'rgba(56, 189, 248, 0.15)' : '#271a10',
              color: doctorMode ? '#38bdf8' : 'hsl(45 21% 65%)',
              border: doctorMode ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            }}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{doctorMode ? 'Doctor' : 'Patient'}</span>
          </button>
          {/* Upload button */}
          <button
            onClick={() => setShowUpload(!showUpload)}
            data-onboard="upload-button"
            title="Upload medical report"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: showUpload ? 'hsl(28 45% 57%)' : '#271a10',
              color: showUpload ? 'white' : 'hsl(45 21% 65%)',
            }}
          >
            <Upload className="w-4 h-4" />
          </button>
          {status === 'active' && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" style={{ color: 'hsl(28 45% 57%)' }} />
              <span
                className="font-mono font-medium"
                style={{ color: 'hsl(28 45% 57%)' }}
              >
                {formatDuration(duration)}
              </span>
            </div>
          )}
          {/* Mobile transcript toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            data-onboard="transcript-toggle"
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center relative"
            aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'}
            style={{
              background: showTranscript ? 'hsl(28 45% 57%)' : '#271a10',
              color: showTranscript ? 'white' : 'hsl(45 21% 65%)',
            }}
          >
            {showTranscript ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            {hasMessages && !showTranscript && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{ background: 'hsl(28 45% 57%)' }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="px-4 sm:px-8 py-4" style={{ background: '#1b130d', borderBottom: '1px solid hsl(28 45% 20%)' }}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            className="rounded-2xl p-4 sm:p-5"
            style={{
              background: dragActive ? 'rgba(198, 117, 12, 0.08)' : 'rgba(255,255,255,0.02)',
              border: dragActive ? '1px dashed hsl(28 45% 57%)' : '1px dashed hsl(28 45% 24%)',
              boxShadow: dragActive ? '0 12px 36px rgba(198,117,12,0.12)' : 'none',
              transition: 'all 160ms ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              className="hidden"
            />
            <div className="flex items-center gap-4 flex-wrap justify-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: '1 1 260px' }}>
                <div className="mini-bounce-card" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', display: 'grid', placeItems: 'center', background: dragActive ? 'rgba(198, 117, 12, 0.14)' : 'rgba(198, 117, 12, 0.08)', border: '1px solid rgba(198, 117, 12, 0.12)' }}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(28 45% 57%)' }} /> : <Upload className="w-5 h-5" style={{ color: 'hsl(28 45% 57%)' }} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="text-sm" style={{ color: 'hsl(45 21% 88%)', fontWeight: 600, letterSpacing: '0.003em' }}>
                    Drag & drop a prescription, report, or scan
                  </span>
                  <span className="text-xs" style={{ color: 'hsl(45 21% 50%)', lineHeight: 1.65 }}>
                    PDF or image, max 6MB. We organise the report, extract medicines and conditions, and save clean memory for future conversations.
                  </span>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'hsl(28 45% 57%)',
                  color: 'white',
                  opacity: uploading ? 0.7 : 1,
                  boxShadow: '0 10px 24px rgba(198,117,12,0.18)',
                }}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {uploading ? 'Analyzing...' : 'Choose file'}
              </button>
            </div>

            {uploadResult?.error && (
              <p className="text-xs mt-3" style={{ color: '#fca5a5' }}>{uploadResult.error}</p>
            )}
            {uploadResult?.success && (
              <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.2)', color: '#86efac' }}>
                <p className="font-medium mb-1">Report uploaded, stored, and ready for future reference</p>
                {uploadResult.report?.summary && <p className="text-xs opacity-80">{uploadResult.report.summary}</p>}
                {uploadResult.report?.medicines?.length > 0 && (
                  <p className="text-xs mt-1 opacity-70">Medicines: {uploadResult.report.medicines.join(', ')}</p>
                )}
                <p className="text-xs mt-2 opacity-70">AarogyaVaani can now refer back to this report in later conversations and doctor summaries.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Doctor mode brief panel */}
      {doctorMode && (
        <div className="px-4 sm:px-8 py-3" style={{
          background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.05), rgba(56, 189, 248, 0.02))',
          borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" style={{ color: '#38bdf8' }} />
              <span className="text-sm font-medium" style={{ color: '#38bdf8' }}>Doctor Mode Active</span>
            </div>
            <button
              onClick={handleDoctorBrief}
              disabled={loadingBrief}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              {loadingBrief ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
              Generate Patient Brief
            </button>
          </div>
          {doctorBrief?.brief && (
            <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.12)' }}>
              <p style={{ color: 'hsl(45 21% 90%)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{doctorBrief.brief}</p>
              {doctorBrief.medicines?.length > 0 && (
                <p className="text-xs mt-2" style={{ color: '#38bdf8' }}>Medications: {doctorBrief.medicines.join(', ')}</p>
              )}
              {doctorBrief.conditions?.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'hsl(45 21% 60%)' }}>Conditions: {doctorBrief.conditions.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Call interface */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          {/* Nurse Avatar */}
          <div className="mb-4 sm:mb-6">
            <NurseAvatar
              volumeLevel={volumeLevel}
              isActive={status === 'active'}
              size={140}
            />
          </div>

          {/* Status */}
          <p
            className="text-sm font-medium mb-6 sm:mb-8"
            style={{ color: STATUS_MAP[status].color }}
          >
            {STATUS_MAP[status].label}
          </p>

          {/* Error message */}
          {errorMsg && (
            <div
              className="flex items-start gap-2.5 mb-6 px-4 py-3 rounded-xl max-w-sm text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <div>
                <p>{errorMsg}</p>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="text-xs mt-1 underline"
                  style={{ color: 'hsl(45 21% 55%)' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Call button */}
          <button
            onClick={handleCall}
            data-onboard="call-button"
            aria-label={isActive ? 'End call' : 'Start call'}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300"
            style={
              isActive
                ? {
                    background: '#dc2626',
                    boxShadow: '0 10px 36px rgba(220, 38, 38, 0.35)',
                  }
                : {
                    background: 'hsl(28 45% 57%)',
                    boxShadow: '0 10px 36px hsla(28, 45%, 45%, 0.4)',
                    animation: 'warmPulse 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
                  }
            }
          >
            {status === 'connecting' ? (
              <Loader2 className="w-9 h-9 sm:w-10 sm:h-10 text-white animate-spin" />
            ) : isActive ? (
              <PhoneOff className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
            ) : (
              <Phone className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
            )}
          </button>

          {/* Controls */}
          {isActive && (
            <div className="flex items-center gap-4 mt-6 sm:mt-8">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={
                  isMuted
                    ? { background: 'rgba(220,38,38,0.15)', color: '#ef4444' }
                    : { background: '#271a10', color: 'hsl(45 21% 65%)' }
                }
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" style={{ color: 'hsl(45 21% 50%)' }} />
                <div
                  className="w-24 h-1.5 rounded-full overflow-hidden"
                  style={{ background: '#271a10' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${Math.min(volumeLevel * 100, 100)}%`,
                      background: 'hsl(28 45% 57%)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Helper text */}
          {status === 'idle' && !errorMsg && !isOffline && (
            <p
              className="text-sm mt-6 sm:mt-8 max-w-xs text-center"
              style={{ color: 'hsl(45 21% 50%)' }}
            >
              Click the button to start talking. Ask about diabetes, government schemes, maternal health, and more.
            </p>
          )}

          {/* Offline / Low-Network Fallback */}
          {isOffline && status === 'idle' && (
            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3" style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
                <AlertCircle className="w-4 h-4" style={{ color: '#eab308' }} />
                <span className="text-xs font-medium" style={{ color: '#eab308' }}>Low network — using text mode</span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#1b130d', border: '1px solid hsl(28 45% 20%)' }}>
                {/* Text responses */}
                <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                  {textResponses.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'hsl(45 21% 50%)' }}>Type your health question below</p>
                  )}
                  {textResponses.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%] px-3 py-2 text-xs rounded-xl" style={
                        msg.role === 'user'
                          ? { background: 'hsl(28 45% 57%)', color: '#fff' }
                          : { background: '#271a10', color: 'hsl(45 21% 90%)', border: '1px solid rgba(255,255,255,0.04)' }
                      }>{msg.text}</div>
                    </div>
                  ))}
                  {textLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-xl" style={{ background: '#271a10' }}>
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(28 45% 57%)' }} />
                      </div>
                    </div>
                  )}
                </div>
                {/* Input */}
                <div className="flex gap-2 p-3" style={{ borderTop: '1px solid hsl(28 45% 20%)' }}>
                  <input
                    value={textQuery}
                    onChange={e => setTextQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTextQuery()}
                    placeholder="Ask a health question..."
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: '#271a10', color: 'hsl(45 21% 90%)', border: '1px solid hsl(28 45% 20%)' }}
                  />
                  <button
                    onClick={handleTextQuery}
                    disabled={textLoading || !textQuery.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'hsl(28 45% 57%)', color: '#fff', opacity: textLoading || !textQuery.trim() ? 0.5 : 1 }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transcript panel — desktop: always visible sidebar, mobile: slide-over */}
        {/* Desktop sidebar */}
        <div
          className="w-96 hidden lg:flex flex-col flex-shrink-0"
          style={{
            background: '#22160e',
            borderLeft: '1px solid hsl(28 45% 20%)',
          }}
        >
          <div
            className="px-5 py-3 flex items-center gap-1"
            style={{ borderBottom: '1px solid hsl(28 45% 20%)' }}
          >
            {['transcript', 'reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
                style={{
                  background: activeTab === tab ? 'hsl(28 45% 57%)' : 'rgba(255,255,255,0.03)',
                  color: activeTab === tab ? 'white' : 'hsl(45 21% 60%)',
                  border: activeTab === tab ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                }}
              >
                {tab === 'transcript' ? 'Transcript' : `Reports (${reports.length})`}
              </button>
            ))}
          </div>
          {activeTab === 'transcript' ? (
            <TranscriptMessages messages={messages} messagesEndRef={messagesEndRef} reportReferenceNotice={reportReferenceNotice} />
          ) : (
            <ReportsPanel reports={reports} />
          )}
        </div>

        {/* Mobile slide-over */}
        {showTranscript && (
          <div
            className="absolute inset-0 lg:hidden flex flex-col z-10"
            style={{ background: '#22160e' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between gap-2"
              style={{ borderBottom: '1px solid hsl(28 45% 20%)' }}
            >
              <div className="flex items-center gap-1">
                {['transcript', 'reports'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
                    style={{
                      background: activeTab === tab ? 'hsl(28 45% 57%)' : 'rgba(255,255,255,0.03)',
                      color: activeTab === tab ? 'white' : 'hsl(45 21% 60%)',
                      border: activeTab === tab ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                    }}
                  >
                    {tab === 'transcript' ? 'Transcript' : `Reports (${reports.length})`}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTranscript(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                aria-label="Close transcript"
                style={{ background: '#271a10', color: 'hsl(45 21% 65%)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {activeTab === 'transcript' ? (
              <TranscriptMessages messages={messages} messagesEndRef={messagesEndRef} reportReferenceNotice={reportReferenceNotice} />
            ) : (
              <ReportsPanel reports={reports} />
            )}
          </div>
        )}
      </div>

      {/* VOICE ONBOARDING */}
      {showOnboarding && (
        <VoiceOnboarding onDismiss={() => setShowOnboarding(false)} />
      )}

      {/* RED FLAG EMERGENCY OVERLAY */}
      {emergency && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6"
          style={{
            background: 'rgba(153, 27, 27, 0.95)',
            animation: 'emergencyPulse 1.5s ease-in-out infinite',
          }}
        >
          <ShieldAlert className="w-20 h-20 text-white mb-4" style={{ animation: 'emergencyBounce 0.6s ease-in-out infinite alternate' }} />
          <h2 className="text-3xl font-bold text-white mb-2 text-center" style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}>
            EMERGENCY DETECTED
          </h2>
          <p className="text-lg text-red-200 mb-6 text-center">
            {emergency.keyword}
          </p>
          <a
            href="tel:108"
            className="flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-bold text-white mb-4 transition-transform hover:scale-105"
            style={{
              background: '#ffffff',
              color: '#991b1b',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <Phone className="w-6 h-6" />
            Call 108 Now
          </a>
          <p className="text-red-200 text-sm text-center max-w-sm mb-6">
            108 is India's free emergency ambulance number. Keep someone with you and go to the nearest hospital immediately.
          </p>
          <button
            onClick={() => setEmergency(null)}
            className="text-red-300 text-sm underline hover:text-white transition-colors"
          >
            Dismiss — I understand the situation
          </button>
        </div>
      )}
    </div>
  )
}

// Provenance chip detection for inline source attribution
const PROVENANCE_PATTERNS = [
  { pattern: /(?:pichhli|previous|last)\s*(?:baar|call|time|conversation)/i, label: 'Previous call', color: '#7c3aed', bg: '#f5f3ff' },
  { pattern: /(?:aapke|your|uploaded)\s*report|prescription/i, label: 'Uploaded report', color: '#2563eb', bg: '#eff6ff' },
  { pattern: /(?:ayushman|jananee|government|scheme|yojana)/i, label: 'Knowledge base', color: '#16a34a', bg: '#f0fdf4' },
  { pattern: /(?:knowledge|database|health\s*info|medical\s*info)/i, label: 'Health database', color: '#d97706', bg: '#fffbeb' },
]

function detectProvenance(text) {
  const chips = []
  for (const p of PROVENANCE_PATTERNS) {
    if (p.pattern.test(text)) {
      chips.push(p)
    }
  }
  return chips
}

function TranscriptMessages({ messages, messagesEndRef, reportReferenceNotice }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
      {reportReferenceNotice && (
        <div
          className="rounded-xl p-3 mb-3"
          style={{
            background: 'rgba(37, 99, 235, 0.10)',
            border: '1px solid rgba(37, 99, 235, 0.18)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: '#93c5fd' }}>
            Using your uploaded report for future answers
          </p>
          <p className="text-xs mt-1" style={{ color: 'hsl(45 21% 75%)', lineHeight: 1.6 }}>
            {reportReferenceNotice.report_name || 'Uploaded report'} is stored in your health memory. AarogyaVaani can refer back to its extracted medicines, conditions, and summary when relevant.
          </p>
        </div>
      )}
      {messages.length === 0 ? (
        <div className="text-center py-16">
          <Heart
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: 'hsl(28 45% 25%)' }}
          />
          <p className="text-sm" style={{ color: 'hsl(45 21% 50%)' }}>
            Transcript will appear here during the call
          </p>
        </div>
      ) : (
        messages.map((msg, i) => {
          const chips = msg.role === 'assistant' && msg.final ? detectProvenance(msg.text) : []
          return (
            <div
              key={`${msg.id}-${i}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div>
                <div
                  className="max-w-[85%] px-3.5 py-2.5 text-sm"
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'hsl(28 45% 57%)',
                          color: '#ffffff',
                          borderRadius: '12px 4px 12px 12px',
                          opacity: msg.final ? 1 : 0.72,
                          boxShadow: '0 6px 16px rgba(76,46,18,0.18)',
                          lineHeight: 1.6,
                        }
                      : {
                          background: 'linear-gradient(180deg, #271a10, #22160e)',
                          color: 'hsl(45 21% 90%)',
                          borderRadius: '4px 12px 12px 12px',
                          opacity: msg.final ? 1 : 0.72,
                          border: '1px solid rgba(255,255,255,0.04)',
                          lineHeight: 1.6,
                        }
                  }
                >
                  {msg.text}
                </div>
                {chips.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {chips.map((chip, j) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: chip.bg, color: chip.color, border: `1px solid ${chip.color}30` }}>
                        {chip.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

function ReportsPanel({ reports }) {
  if (reports.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="text-center py-16">
          <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(28 45% 25%)' }} />
          <p className="text-sm" style={{ color: 'hsl(45 21% 50%)' }}>
            No uploaded reports yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'hsl(45 21% 40%)' }}>
            Upload a medical report or prescription image to see it here
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
      {reports.map((r) => (
        <div
          key={r.report_id}
          className="rounded-xl p-3.5"
          style={{ background: '#271a10', border: '1px solid hsl(28 45% 20%)' }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium" style={{ color: 'hsl(45 21% 90%)' }}>
              {r.report_name || 'Medical Report'}
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{
              background: r.report_kind === 'pdf' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.12)',
              color: r.report_kind === 'pdf' ? '#fca5a5' : '#7dd3fc',
            }}>
              {r.report_kind?.toUpperCase() || 'DOC'}
            </span>
          </div>
          {r.summary && (
            <p className="text-xs mb-2" style={{ color: 'hsl(45 21% 65%)', lineHeight: 1.6 }}>{r.summary}</p>
          )}
          {r.extracted_text_excerpt && (
            <div className="mb-2.5 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'hsl(45 21% 45%)' }}>
                Extracted from document
              </p>
              <p className="text-xs" style={{ color: 'hsl(45 21% 72%)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {r.extracted_text_excerpt}
              </p>
            </div>
          )}
          {r.medicines?.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'hsl(45 21% 45%)' }}>
                Medicines extracted
              </p>
              <div className="flex flex-wrap gap-1">
              {r.medicines.slice(0, 6).map((m, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: 'rgba(198, 117, 12, 0.12)',
                  color: 'hsl(28 45% 70%)',
                }}>{m}</span>
              ))}
              {r.medicines.length > 6 && (
                <span className="text-xs" style={{ color: 'hsl(45 21% 50%)' }}>+{r.medicines.length - 6} more</span>
              )}
              </div>
            </div>
          )}
          {r.conditions?.length > 0 && (
            <div className="mb-1.5">
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'hsl(45 21% 45%)' }}>
                Conditions detected
              </p>
              <p className="text-xs" style={{ color: 'hsl(45 21% 50%)', lineHeight: 1.6 }}>
                {r.conditions.slice(0, 6).join(', ')}
              </p>
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: 'hsl(45 21% 35%)' }}>
            {r.saved_at ? new Date(r.saved_at).toLocaleDateString() : ''}
          </p>
          <div className="mt-3 p-2.5 rounded-lg" style={{
            background: 'rgba(198, 117, 12, 0.08)',
            border: '1px solid rgba(198, 117, 12, 0.12)',
          }}>
            <p className="text-xs font-medium" style={{ color: 'hsl(45 97% 76%)' }}>
              Stored and available for future reference
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(45 21% 62%)', lineHeight: 1.6 }}>
              This report stays in your health memory, so AarogyaVaani can refer to it in later calls, transcript references, and doctor summaries.
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
