import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Loader2, Heart, Volume2, Clock } from 'lucide-react'
import { getVapi } from '../lib/vapi'
import { CONFIG } from '../lib/config'

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

  useEffect(() => {
    const vapi = getVapi()

    const onCallStart = () => {
      setStatus('active')
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }

    const onCallEnd = () => {
      setStatus('ended')
      if (timerRef.current) clearInterval(timerRef.current)
      setTimeout(() => setStatus('idle'), 3000)
    }

    const onMessage = (msg) => {
      if (msg.type === 'transcript') {
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
      }
    }

    const onVolumeLevel = (level) => setVolumeLevel(level)

    const onError = (err) => {
      console.error('Vapi error:', err)
      setStatus('idle')
      if (timerRef.current) clearInterval(timerRef.current)
    }

    vapi.on('call-start', onCallStart)
    vapi.on('call-end', onCallEnd)
    vapi.on('message', onMessage)
    vapi.on('volume-level', onVolumeLevel)
    vapi.on('error', onError)

    return () => {
      vapi.off('call-start', onCallStart)
      vapi.off('call-end', onCallEnd)
      vapi.off('message', onMessage)
      vapi.off('volume-level', onVolumeLevel)
      vapi.off('error', onError)
      if (timerRef.current) clearInterval(timerRef.current)
      // Stop any active call on unmount
      try { vapi.stop() } catch (_) { /* may not be in call */ }
    }
  }, [])

  const handleCall = async () => {
    if (status === 'active' || status === 'connecting') {
      const vapi = getVapi()
      vapi.stop()
      setStatus('ended')
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      setStatus('connecting')
      setMessages([])
      try {
        const vapi = getVapi()
        await vapi.start(CONFIG.VAPI_ASSISTANT_ID)
      } catch (err) {
        console.error('Failed to start call:', err)
        setStatus('idle')
      }
    }
  }

  const toggleMute = () => {
    const vapi = getVapi()
    vapi.setMuted(!isMuted)
    setIsMuted(!isMuted)
  }

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const isActive = status === 'active' || status === 'connecting'

  return (
    <div className="h-full flex flex-col" style={{ background: '#120b07' }}>
      {/* Header */}
      <div
        className="px-8 py-5 flex items-center justify-between"
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
          <p className="text-sm" style={{ color: 'hsl(45 21% 65%)' }}>
            Talk to AarogyaVaani in Hindi, English, or Kannada
          </p>
        </div>
        {status === 'active' && (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4" style={{ color: 'hsl(28 45% 57%)' }} />
            <span
              className="font-mono font-medium"
              style={{ color: 'hsl(28 45% 57%)' }}
            >
              {formatDuration(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex">
        {/* Call interface */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Status */}
          <p
            className="text-sm font-medium mb-8"
            style={{ color: STATUS_MAP[status].color }}
          >
            {STATUS_MAP[status].label}
          </p>

          {/* Call button */}
          <button
            onClick={handleCall}
            aria-label={isActive ? 'End call' : 'Start call'}
            className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300"
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
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isActive ? (
              <PhoneOff className="w-10 h-10 text-white" />
            ) : (
              <Phone className="w-10 h-10 text-white" />
            )}
          </button>

          {/* Controls */}
          {isActive && (
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={
                  isMuted
                    ? { background: 'rgba(220,38,38,0.15)', color: '#ef4444' }
                    : { background: '#271a10', color: 'hsl(45 21% 65%)' }
                }
                onMouseEnter={e => {
                  if (!isMuted) e.currentTarget.style.background = '#32210f'
                }}
                onMouseLeave={e => {
                  if (!isMuted) e.currentTarget.style.background = '#271a10'
                }}
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
          {status === 'idle' && (
            <p
              className="text-sm mt-8 max-w-xs text-center"
              style={{ color: 'hsl(45 21% 50%)' }}
            >
              Click the button to start talking. Ask about diabetes, government schemes, maternal health, and more.
            </p>
          )}
        </div>

        {/* Transcript panel */}
        <div
          className="w-96 flex flex-col"
          style={{
            background: '#22160e',
            borderLeft: '1px solid hsl(28 45% 20%)',
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: '1px solid hsl(28 45% 20%)' }}
          >
            <h2
              className="text-sm font-semibold"
              style={{
                color: 'hsl(45 21% 95%)',
                fontFamily: '"Instrument Serif", Georgia, serif',
              }}
            >
              Live Transcript
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
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
              messages.map((msg, i) => (
                <div
                  key={`${msg.id}-${i}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] px-3.5 py-2 text-sm"
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'hsl(28 45% 57%)',
                            color: '#ffffff',
                            borderRadius: '12px 4px 12px 12px',
                            opacity: msg.final ? 1 : 0.6,
                            boxShadow: '0 2px 8px rgba(76,46,18,0.25)',
                          }
                        : {
                            background: '#271a10',
                            color: 'hsl(45 21% 90%)',
                            borderRadius: '4px 12px 12px 12px',
                            opacity: msg.final ? 1 : 0.6,
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
