import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Loader2, Heart, Volume2, Clock } from 'lucide-react'
import { getVapi } from '../lib/vapi'
import { CONFIG } from '../lib/config'

const STATUS_MAP = {
  idle: { label: 'Ready to call', color: 'text-text-secondary' },
  connecting: { label: 'Connecting...', color: 'text-accent-500' },
  active: { label: 'Call active', color: 'text-primary-600' },
  ended: { label: 'Call ended', color: 'text-text-muted' },
}

export default function CallPage() {
  const [status, setStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const vapi = getVapi()

    vapi.on('call-start', () => {
      setStatus('active')
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    })

    vapi.on('call-end', () => {
      setStatus('ended')
      if (timerRef.current) clearInterval(timerRef.current)
      setTimeout(() => setStatus('idle'), 3000)
    })

    vapi.on('message', (msg) => {
      if (msg.type === 'transcript') {
        setMessages(prev => {
          const existing = prev.find(m => m.id === msg.transcriptId && m.role === msg.role)
          if (existing) {
            return prev.map(m => m.id === msg.transcriptId && m.role === msg.role
              ? { ...m, text: msg.transcript }
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
      if (msg.type === 'speech-update') {
        // speech status
      }
    })

    vapi.on('volume-level', (level) => {
      setVolumeLevel(level)
    })

    vapi.on('error', (err) => {
      console.error('Vapi error:', err)
      setStatus('idle')
      if (timerRef.current) clearInterval(timerRef.current)
    })

    return () => {
      vapi.removeAllListeners?.()
      if (timerRef.current) clearInterval(timerRef.current)
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Voice Call</h1>
          <p className="text-sm text-text-secondary">Talk to AarogyaVaani in Hindi, English, or Kannada</p>
        </div>
        {status === 'active' && (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-primary-600" />
            <span className="font-mono text-primary-700 font-medium">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex">
        {/* Call interface */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Status */}
          <p className={`text-sm font-medium mb-8 ${STATUS_MAP[status].color}`}>
            {STATUS_MAP[status].label}
          </p>

          {/* Call button */}
          <button
            onClick={handleCall}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                : 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30'
            }`}
          >
            {!isActive && (
              <span className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-20" />
            )}
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
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-1">
                <Volume2 className="w-4 h-4 text-text-muted" />
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(volumeLevel * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Helper text */}
          {status === 'idle' && (
            <p className="text-sm text-text-muted mt-8 max-w-xs text-center">
              Click the button to start talking. Ask about diabetes, government schemes, maternal health, and more.
            </p>
          )}
        </div>

        {/* Transcript panel */}
        <div className="w-96 border-l border-gray-100 bg-surface-elevated flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Live Transcript</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-text-muted">Transcript will appear here during the call</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={`${msg.id}-${i}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    } ${!msg.final ? 'opacity-60' : ''}`}
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
