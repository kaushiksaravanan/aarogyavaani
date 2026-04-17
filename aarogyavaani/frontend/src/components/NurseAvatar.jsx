import { useEffect, useRef, useState, memo } from 'react'

/**
 * NurseAvatar — a beautiful stylised SVG nurse with facemask.
 *
 * Volume-reactive: eyes, head bob, glow. Mask covers mouth — no lip-sync needed.
 */
function NurseAvatarInner({ volumeLevel = 0, isActive = false, size = 160 }) {
  const [blinking, setBlinking] = useState(false)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const blinkTimer = useRef(null)
  const containerRef = useRef(null)
  const targetLookRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2200 + Math.random() * 3200
      blinkTimer.current = setTimeout(() => {
        setBlinking(true)
        setTimeout(() => setBlinking(false), 140)
        scheduleBlink()
      }, delay)
    }
    scheduleBlink()
    return () => clearTimeout(blinkTimer.current)
  }, [])

  useEffect(() => {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

    const handleMove = (event) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height * 0.42
      targetLookRef.current = {
        x: clamp((event.clientX - centerX) / (window.innerWidth * 0.22), -1, 1),
        y: clamp((event.clientY - centerY) / (window.innerHeight * 0.22), -1, 1),
      }
    }

    const handleLeave = () => {
      targetLookRef.current = { x: 0, y: 0 }
    }

    let frameId = 0
    const tick = () => {
      setLook((prev) => {
        const nextX = prev.x + (targetLookRef.current.x - prev.x) * 0.14
        const nextY = prev.y + (targetLookRef.current.y - prev.y) * 0.14
        if (Math.abs(nextX - prev.x) < 0.0005 && Math.abs(nextY - prev.y) < 0.0005) {
          return prev
        }
        return { x: nextX, y: nextY }
      })
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseleave', handleLeave)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  const vol = Math.min(volumeLevel, 1)
  const headBob = isActive ? vol * 2.5 : 0
  const eyeNarrow = isActive && vol > 0.12 ? Math.min(vol * 0.35, 0.25) : 0
  const eyeScaleY = blinking ? 0.06 : 1 - eyeNarrow
  const glowOpacity = isActive ? 0.2 + vol * 0.55 : 0

  // Proportions
  const s = size
  const cx = s / 2
  const faceRx = s * 0.235 // slimmer face width
  const faceRy = s * 0.325 // keep face length elegant
  const faceCy = s * 0.425 // slightly lower for a longer forehead
  const bodyTop = faceCy + faceRy * 0.78
  const lookX = look.x * faceRx * 0.045
  const lookY = look.y * faceRy * 0.03

  return (
    <div ref={containerRef} style={{ position: 'relative', width: s, height: s }}>
      {/* Pulse rings during call */}
      {isActive && (
        <>
          <div style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            border: '2px solid rgba(198, 117, 12, 0.18)',
            animation: 'avatarPulse 2.6s ease-out infinite',
          }} />
          <div style={{
            position: 'absolute', inset: -22, borderRadius: '50%',
            border: '1.5px solid rgba(198, 117, 12, 0.08)',
            animation: 'avatarPulse 2.6s ease-out 0.7s infinite',
          }} />
        </>
      )}

      <div style={{ animation: 'avatarBreathe 4.8s ease-in-out infinite', transformOrigin: '50% 62%' }}>
      <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} style={{ display: 'block' }}>
        <defs>
          <filter id="avShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#1b130d" floodOpacity="0.18" />
          </filter>
          {/* Skin gradient for warmth */}
          <radialGradient id="skinGrad" cx="45%" cy="35%" r="60%">
            <stop offset="0%" stopColor="hsl(25, 55%, 78%)" />
            <stop offset="100%" stopColor="hsl(22, 42%, 68%)" />
          </radialGradient>
          {/* Hair gradient for depth */}
          <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(20, 35%, 14%)" />
            <stop offset="50%" stopColor="hsl(18, 30%, 10%)" />
            <stop offset="100%" stopColor="hsl(22, 25%, 16%)" />
          </linearGradient>
          {/* Hair highlight */}
          <linearGradient id="hairShine" x1="0.3" y1="0" x2="0.7" y2="0.5">
            <stop offset="0%" stopColor="hsl(28, 40%, 28%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          {/* White uniform gradient */}
          <linearGradient id="scrubsGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" />
            <stop offset="55%" stopColor="hsl(38, 28%, 96%)" />
            <stop offset="100%" stopColor="hsl(35, 18%, 88%)" />
          </linearGradient>
          {/* Mask gradient */}
          <linearGradient id="maskGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="hsl(205, 34%, 96%)" />
            <stop offset="100%" stopColor="hsl(205, 22%, 88%)" />
          </linearGradient>
          {/* Eye iris gradient */}
          <radialGradient id="irisGrad" cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor="hsl(30, 72%, 36%)" />
            <stop offset="55%" stopColor="hsl(24, 58%, 22%)" />
            <stop offset="100%" stopColor="hsl(22, 50%, 14%)" />
          </radialGradient>
        </defs>

        <g
          transform={`translate(0, ${-headBob})`}
          style={{ transition: 'transform 90ms ease-out' }}
          filter="url(#avShadow)"
        >
          {/* ── Active glow ring ── */}
          {isActive && (
            <ellipse
              cx={cx} cy={faceCy}
              rx={faceRx * 1.28} ry={faceRy * 1.16}
              fill="none"
              stroke={`rgba(198, 117, 12, ${glowOpacity})`}
              strokeWidth="2.5"
              style={{ transition: 'stroke 100ms ease' }}
            />
          )}

          {/* ── Body / Scrubs ── */}
          <path
            d={`M ${cx - faceRx * 1.45} ${bodyTop + faceRy * 0.55}
                Q ${cx - faceRx * 1.62} ${s * 0.99}, ${cx} ${s * 0.99}
                Q ${cx + faceRx * 1.62} ${s * 0.99}, ${cx + faceRx * 1.45} ${bodyTop + faceRy * 0.55}
                Z`}
            fill="url(#scrubsGrad)"
          />
          {/* V-neck line */}
          <path
            d={`M ${cx - faceRx * 0.38} ${bodyTop + faceRy * 0.18}
                L ${cx} ${bodyTop + faceRy * 0.52}
                L ${cx + faceRx * 0.38} ${bodyTop + faceRy * 0.18}`}
            fill="none"
            stroke="hsl(30, 16%, 72%)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* ── Neck ── */}
          <rect
            x={cx - faceRx * 0.2}
            y={bodyTop - faceRy * 0.05}
            width={faceRx * 0.4}
            height={faceRy * 0.28}
            rx={faceRx * 0.08}
            fill="url(#skinGrad)"
          />

          {/* ── Face (slim heart shape) ── */}
          <path
            d={`M ${cx} ${faceCy - faceRy * 0.98}
                Q ${cx - faceRx * 0.78} ${faceCy - faceRy * 0.92}, ${cx - faceRx * 0.92} ${faceCy - faceRy * 0.28}
                Q ${cx - faceRx * 0.9} ${faceCy + faceRy * 0.12}, ${cx - faceRx * 0.46} ${faceCy + faceRy * 0.64}
                Q ${cx - faceRx * 0.18} ${faceCy + faceRy * 0.97}, ${cx} ${faceCy + faceRy * 1.12}
                Q ${cx + faceRx * 0.18} ${faceCy + faceRy * 0.97}, ${cx + faceRx * 0.46} ${faceCy + faceRy * 0.64}
                Q ${cx + faceRx * 0.9} ${faceCy + faceRy * 0.12}, ${cx + faceRx * 0.92} ${faceCy - faceRy * 0.28}
                Q ${cx + faceRx * 0.78} ${faceCy - faceRy * 0.92}, ${cx} ${faceCy - faceRy * 0.98}
                Z`}
            fill="url(#skinGrad)"
          />

          {/* ── Ears ── */}
          <ellipse cx={cx - faceRx * 0.88} cy={faceCy + faceRy * 0.01} rx={faceRx * 0.07} ry={faceRy * 0.11} fill="hsl(22, 42%, 68%)" />
          <ellipse cx={cx + faceRx * 0.88} cy={faceCy + faceRy * 0.01} rx={faceRx * 0.07} ry={faceRy * 0.11} fill="hsl(22, 42%, 68%)" />
          {/* Ear studs (small gold earrings) */}
          <circle cx={cx - faceRx * 0.87} cy={faceCy + faceRy * 0.08} r={1.5} fill="hsl(45, 80%, 60%)" />
          <circle cx={cx + faceRx * 0.87} cy={faceCy + faceRy * 0.08} r={1.5} fill="hsl(45, 80%, 60%)" />

          {/* ── Rosy cheeks (above mask) ── */}
          <ellipse cx={cx - faceRx * 0.36} cy={faceCy - faceRy * 0.03} rx={faceRx * 0.075} ry={faceRy * 0.05} fill="hsl(0, 55%, 78%)" opacity="0.18" />
          <ellipse cx={cx + faceRx * 0.36} cy={faceCy - faceRy * 0.03} rx={faceRx * 0.075} ry={faceRy * 0.05} fill="hsl(0, 55%, 78%)" opacity="0.18" />

          {/* ── Hair (voluminous, flowing) ── */}
          <path
            d={`M ${cx - faceRx * 0.98} ${faceCy + faceRy * 0.02}
                Q ${cx - faceRx * 1.1} ${faceCy - faceRy * 0.88}, ${cx - faceRx * 0.48} ${faceCy - faceRy * 1.08}
                Q ${cx - faceRx * 0.12} ${faceCy - faceRy * 1.2}, ${cx} ${faceCy - faceRy * 1.15}
                Q ${cx + faceRx * 0.12} ${faceCy - faceRy * 1.2}, ${cx + faceRx * 0.48} ${faceCy - faceRy * 1.08}
                Q ${cx + faceRx * 1.1} ${faceCy - faceRy * 0.88}, ${cx + faceRx * 0.98} ${faceCy + faceRy * 0.02}
                L ${cx + faceRx * 0.72} ${faceCy + faceRy * 0.2}
                Q ${cx + faceRx * 0.5} ${faceCy - faceRy * 0.48}, ${cx + faceRx * 0.1} ${faceCy - faceRy * 0.76}
                Q ${cx} ${faceCy - faceRy * 0.82}, ${cx - faceRx * 0.1} ${faceCy - faceRy * 0.76}
                Q ${cx - faceRx * 0.5} ${faceCy - faceRy * 0.48}, ${cx - faceRx * 0.72} ${faceCy + faceRy * 0.2}
                Z`}
            fill="url(#hairGrad)"
          />
          {/* Hair shine highlight */}
          <path
            d={`M ${cx - faceRx * 0.42} ${faceCy - faceRy * 1.0}
                Q ${cx - faceRx * 0.04} ${faceCy - faceRy * 1.1}, ${cx + faceRx * 0.24} ${faceCy - faceRy * 1.0}
                Q ${cx + faceRx * 0.12} ${faceCy - faceRy * 0.88}, ${cx - faceRx * 0.16} ${faceCy - faceRy * 0.86}
                Z`}
            fill="url(#hairShine)"
          />
          {/* Side hair strands */}
          <path
            d={`M ${cx - faceRx * 0.9} ${faceCy + faceRy * 0.02}
                Q ${cx - faceRx * 0.98} ${faceCy + faceRy * 0.32}, ${cx - faceRx * 0.7} ${faceCy + faceRy * 0.4}`}
            fill="none" stroke="hsl(18, 30%, 12%)" strokeWidth="3" strokeLinecap="round"
          />
          <path
            d={`M ${cx + faceRx * 0.9} ${faceCy + faceRy * 0.02}
                Q ${cx + faceRx * 0.98} ${faceCy + faceRy * 0.32}, ${cx + faceRx * 0.7} ${faceCy + faceRy * 0.4}`}
            fill="none" stroke="hsl(18, 30%, 12%)" strokeWidth="3" strokeLinecap="round"
          />

          {/* ── Nurse Cap (elegant) ── */}
          <path
            d={`M ${cx - faceRx * 0.5} ${faceCy - faceRy * 0.94}
                Q ${cx - faceRx * 0.52} ${faceCy - faceRy * 1.18}, ${cx} ${faceCy - faceRy * 1.22}
                Q ${cx + faceRx * 0.52} ${faceCy - faceRy * 1.18}, ${cx + faceRx * 0.5} ${faceCy - faceRy * 0.94}
                Z`}
            fill="hsl(0, 0%, 99%)"
            stroke="hsl(0, 0%, 82%)"
            strokeWidth="0.8"
          />
          {/* Red cross */}
          <line
            x1={cx} y1={faceCy - faceRy * 1.14}
            x2={cx} y2={faceCy - faceRy * 0.98}
            stroke="hsl(0, 65%, 50%)" strokeWidth="2.2" strokeLinecap="round"
          />
          <line
            x1={cx - faceRx * 0.1} y1={faceCy - faceRy * 1.06}
            x2={cx + faceRx * 0.1} y2={faceCy - faceRy * 1.06}
            stroke="hsl(0, 65%, 50%)" strokeWidth="2.2" strokeLinecap="round"
          />

          {/* ── Eyes (almond-shaped, beautiful) ── */}
          {/* Left eye */}
          <g transform={`translate(${cx - faceRx * 0.285}, ${faceCy - faceRy * 0.155})`}>
            {/* Eye shape */}
            <ellipse
              cx="0" cy="0"
              rx={faceRx * 0.2}
              ry={faceRy * 0.115 * eyeScaleY}
              fill="white"
              style={{ transition: 'ry 130ms ease' }}
            />
            {/* Iris */}
            <g transform={`translate(${lookX}, ${lookY})`}>
              <ellipse
                cx={faceRx * 0.02} cy={0}
                rx={faceRx * 0.105 * Math.min(eyeScaleY + 0.15, 1)}
                ry={faceRy * 0.078 * eyeScaleY}
                fill="url(#irisGrad)"
                style={{ transition: 'rx 130ms ease, ry 130ms ease' }}
              />
              {/* Pupil */}
              <circle
                cx={faceRx * 0.02} cy={0}
                r={faceRx * 0.045 * Math.min(eyeScaleY + 0.1, 1)}
                fill="hsl(20, 30%, 8%)"
                style={{ transition: 'r 130ms ease' }}
              />
              {/* Eye shine (two catchlights) */}
              <circle cx={faceRx * 0.05} cy={-faceRy * 0.032} r={faceRx * 0.034} fill="white" opacity="0.95" />
              <circle cx={-faceRx * 0.018} cy={faceRy * 0.015} r={faceRx * 0.016} fill="white" opacity="0.55" />
            </g>
            {/* Upper lash line (thick, curved) */}
            <path
              d={`M ${-faceRx * 0.18} ${faceRy * 0.01}
                  Q ${-faceRx * 0.08} ${-faceRy * 0.125 * eyeScaleY}, ${0} ${-faceRy * 0.118 * eyeScaleY}
                  Q ${faceRx * 0.08} ${-faceRy * 0.125 * eyeScaleY}, ${faceRx * 0.18} ${faceRy * 0.01}`}
              fill="none" stroke="hsl(20, 30%, 10%)" strokeWidth="2.1" strokeLinecap="round"
              style={{ transition: 'd 130ms ease' }}
            />
            {/* Eyelashes (3 upper lashes) */}
            {eyeScaleY > 0.3 && <>
              <line x1={-faceRx * 0.16} y1={-faceRy * 0.04} x2={-faceRx * 0.22} y2={-faceRy * 0.11} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
              <line x1={-faceRx * 0.06} y1={-faceRy * 0.095} x2={-faceRx * 0.08} y2={-faceRy * 0.155} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
              <line x1={faceRx * 0.06} y1={-faceRy * 0.095} x2={faceRx * 0.08} y2={-faceRy * 0.155} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
              <line x1={faceRx * 0.16} y1={-faceRy * 0.04} x2={faceRx * 0.22} y2={-faceRy * 0.11} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
            </>}
          </g>

          {/* Right eye */}
          <g transform={`translate(${cx + faceRx * 0.285}, ${faceCy - faceRy * 0.155})`}>
            <ellipse
              cx="0" cy="0"
              rx={faceRx * 0.2}
              ry={faceRy * 0.115 * eyeScaleY}
              fill="white"
              style={{ transition: 'ry 130ms ease' }}
            />
            <g transform={`translate(${lookX}, ${lookY})`}>
              <ellipse
                cx={-faceRx * 0.02} cy={0}
                rx={faceRx * 0.105 * Math.min(eyeScaleY + 0.15, 1)}
                ry={faceRy * 0.078 * eyeScaleY}
                fill="url(#irisGrad)"
                style={{ transition: 'rx 130ms ease, ry 130ms ease' }}
              />
              <circle
                cx={-faceRx * 0.02} cy={0}
                r={faceRx * 0.045 * Math.min(eyeScaleY + 0.1, 1)}
                fill="hsl(20, 30%, 8%)"
                style={{ transition: 'r 130ms ease' }}
              />
              <circle cx={faceRx * 0.03} cy={-faceRy * 0.032} r={faceRx * 0.034} fill="white" opacity="0.95" />
              <circle cx={-faceRx * 0.04} cy={faceRy * 0.015} r={faceRx * 0.016} fill="white" opacity="0.55" />
            </g>
            <path
              d={`M ${-faceRx * 0.18} ${faceRy * 0.01}
                  Q ${-faceRx * 0.08} ${-faceRy * 0.125 * eyeScaleY}, ${0} ${-faceRy * 0.118 * eyeScaleY}
                  Q ${faceRx * 0.08} ${-faceRy * 0.125 * eyeScaleY}, ${faceRx * 0.18} ${faceRy * 0.01}`}
              fill="none" stroke="hsl(20, 30%, 10%)" strokeWidth="2.1" strokeLinecap="round"
            />
            {eyeScaleY > 0.3 && <>
              <line x1={-faceRx * 0.16} y1={-faceRy * 0.04} x2={-faceRx * 0.22} y2={-faceRy * 0.11} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
              <line x1={-faceRx * 0.06} y1={-faceRy * 0.095} x2={-faceRx * 0.08} y2={-faceRy * 0.155} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
              <line x1={faceRx * 0.06} y1={-faceRy * 0.095} x2={faceRx * 0.08} y2={-faceRy * 0.155} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
              <line x1={faceRx * 0.16} y1={-faceRy * 0.04} x2={faceRx * 0.22} y2={-faceRy * 0.11} stroke="hsl(20, 30%, 10%)" strokeWidth="0.9" strokeLinecap="round" />
            </>}
          </g>

          {/* ── Eyebrows (elegant arched) ── */}
          <path
            d={`M ${cx - faceRx * 0.44} ${faceCy - faceRy * 0.28}
                Q ${cx - faceRx * 0.3} ${faceCy - faceRy * 0.4}, ${cx - faceRx * 0.1} ${faceCy - faceRy * 0.305}`}
            fill="none" stroke="hsl(20, 28%, 18%)" strokeWidth="1.35" strokeLinecap="round"
          />
          <path
            d={`M ${cx + faceRx * 0.12} ${faceCy - faceRy * 0.31}
                Q ${cx + faceRx * 0.3} ${faceCy - faceRy * 0.4}, ${cx + faceRx * 0.44} ${faceCy - faceRy * 0.28}`}
            fill="none" stroke="hsl(20, 28%, 18%)" strokeWidth="1.35" strokeLinecap="round"
          />

          {/* ── Bindi (small, elegant) ── */}
          <circle
            cx={cx} cy={faceCy - faceRy * 0.46}
            r={1.45}
            fill="hsl(354, 68%, 48%)"
          />

          {/* ── Facemask (clean, fitted) ── */}
          <path
            d={`M ${cx - faceRx * 0.54} ${faceCy - faceRy * 0.02}
                Q ${cx - faceRx * 0.58} ${faceCy + faceRy * 0.34}, ${cx} ${faceCy + faceRy * 0.48}
                Q ${cx + faceRx * 0.58} ${faceCy + faceRy * 0.34}, ${cx + faceRx * 0.54} ${faceCy - faceRy * 0.02}
                Q ${cx + faceRx * 0.24} ${faceCy + faceRy * 0.03}, ${cx} ${faceCy + faceRy * 0.06}
                Q ${cx - faceRx * 0.24} ${faceCy + faceRy * 0.03}, ${cx - faceRx * 0.54} ${faceCy - faceRy * 0.02}
                Z`}
            fill="url(#maskGrad)"
            stroke="hsl(205, 18%, 82%)"
            strokeWidth="0.55"
          />
          {/* Mask pleats */}
          <line x1={cx - faceRx * 0.34} y1={faceCy + faceRy * 0.16} x2={cx + faceRx * 0.34} y2={faceCy + faceRy * 0.16} stroke="hsl(205, 12%, 84%)" strokeWidth="0.34" />
          <line x1={cx - faceRx * 0.3} y1={faceCy + faceRy * 0.26} x2={cx + faceRx * 0.3} y2={faceCy + faceRy * 0.26} stroke="hsl(205, 12%, 84%)" strokeWidth="0.34" />
          {/* Ear loops */}
          <path
            d={`M ${cx - faceRx * 0.54} ${faceCy - faceRy * 0.01} Q ${cx - faceRx * 0.76} ${faceCy - faceRy * 0.1} ${cx - faceRx * 0.72} ${faceCy - faceRy * 0.18}`}
            fill="none" stroke="hsl(200, 15%, 78%)" strokeWidth="0.8"
          />
          <path
            d={`M ${cx + faceRx * 0.54} ${faceCy - faceRy * 0.01} Q ${cx + faceRx * 0.76} ${faceCy - faceRy * 0.1} ${cx + faceRx * 0.72} ${faceCy - faceRy * 0.18}`}
            fill="none" stroke="hsl(200, 15%, 78%)" strokeWidth="0.8"
          />

          {/* ── Stethoscope (polished steel look) ── */}
          <path
            d={`M ${cx - faceRx * 0.12} ${bodyTop + faceRy * 0.15}
                Q ${cx - faceRx * 0.45} ${bodyTop + faceRy * 0.5}, ${cx - faceRx * 0.08} ${bodyTop + faceRy * 0.65}`}
            fill="none" stroke="hsl(215, 8%, 48%)" strokeWidth="2" strokeLinecap="round"
          />
          <circle
            cx={cx - faceRx * 0.08} cy={bodyTop + faceRy * 0.65}
            r={faceRx * 0.08}
            fill="hsl(215, 8%, 58%)"
            stroke="hsl(215, 8%, 42%)"
            strokeWidth="0.8"
          />
          {/* Stethoscope shine */}
          <circle cx={cx - faceRx * 0.1} cy={bodyTop + faceRy * 0.63} r={faceRx * 0.025} fill="white" opacity="0.4" />
        </g>
      </svg>
      </div>

      {/* Name badge */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(27, 19, 13, 0.88)',
        backdropFilter: 'blur(8px)',
        color: 'hsl(45 21% 92%)',
        fontSize: Math.max(s * 0.062, 9),
        fontWeight: 600,
        padding: `${s * 0.018}px ${s * 0.075}px`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        letterSpacing: '0.04em',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        AarogyaVaani
      </div>
    </div>
  )
}

const NurseAvatar = memo(NurseAvatarInner)
export default NurseAvatar
