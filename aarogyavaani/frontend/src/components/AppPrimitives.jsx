export const appTheme = {
  surface: '#fffdf9',
  surfaceSoft: '#fff8f1',
  surfaceRaised: '#fffaf5',
  surfaceDark: '#22160e',
  espresso: 'hsl(28 45% 15%)',
  espressoSoft: 'hsl(45 21% 40%)',
  muted: 'hsl(45 21% 55%)',
  copper: 'hsl(28 45% 57%)',
  copperStrong: 'hsl(28 49% 49%)',
  border: 'rgba(34, 22, 14, 0.08)',
  borderStrong: 'rgba(158, 92, 31, 0.16)',
  cardBg: 'linear-gradient(135deg, #ffffff 0%, #fff8f1 100%)',
  cardBgSoft: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))',
  shadow: '0 1px 3px rgba(76,46,18,0.06), 0 8px 24px rgba(76,46,18,0.06)',
  shadowHover: '0 10px 34px rgba(76,46,18,0.10)',
  headingFont: '"Instrument Serif", Georgia, serif',
  bodyFont: '"Inter", system-ui, sans-serif',
}

const toneMap = {
  neutral: { bg: 'rgba(34,22,14,0.05)', color: appTheme.espressoSoft, border: appTheme.border },
  copper: { bg: 'rgba(198,117,12,0.10)', color: appTheme.copperStrong, border: appTheme.borderStrong },
  success: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  warning: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  danger: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  info: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  violet: { bg: '#f5f3ff', color: '#6b21a8', border: '#e9d5ff' },
}

function getTone(tone = 'neutral') {
  return toneMap[tone] || toneMap.neutral
}

const fieldBaseStyle = {
  width: '100%',
  padding: '0.78rem 0.95rem',
  borderRadius: '0.9rem',
  border: `1px solid ${appTheme.border}`,
  fontSize: '0.9rem',
  fontFamily: appTheme.bodyFont,
  color: appTheme.espresso,
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
}

export function AppPage({ children, maxWidth = '72rem', style }) {
  return (
    <div
      style={{
        background: 'radial-gradient(circle at top left, rgba(198,117,12,0.08), transparent 26%), radial-gradient(circle at top right, rgba(34,22,14,0.04), transparent 28%), #fffdf9',
        minHeight: '100%',
        padding: '1.25rem 1rem 2rem',
        fontFamily: appTheme.bodyFont,
        ...style,
      }}
    >
      <div style={{ maxWidth, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions, accent = appTheme.copper }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
          {Icon && (
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '1rem',
              display: 'grid', placeItems: 'center',
              background: 'rgba(198,117,12,0.10)', border: `1px solid ${appTheme.border}`,
              flexShrink: 0,
            }}>
              <Icon className="w-5 h-5" style={{ color: accent }} />
            </div>
          )}
          <div>
            {eyebrow && (
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: appTheme.copper, fontWeight: 700, marginBottom: '0.25rem' }}>
                {eyebrow}
              </div>
            )}
            <h1 style={{ fontFamily: appTheme.headingFont, fontSize: 'clamp(1.85rem, 3vw, 2.3rem)', fontWeight: 600, color: appTheme.espresso, lineHeight: 1.08, letterSpacing: '-0.018em', marginBottom: '0.35rem' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: appTheme.espressoSoft, fontSize: '0.95rem', lineHeight: 1.65, letterSpacing: '0.003em', maxWidth: '42rem' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions ? <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>{actions}</div> : null}
      </div>
    </div>
  )
}

export function SurfaceCard({ title, icon: Icon, children, right, accent = appTheme.copper, bodyStyle, style }) {
  return (
    <div style={{ background: appTheme.cardBg, border: `1px solid ${appTheme.border}`, boxShadow: appTheme.shadow, borderRadius: '1.4rem', overflow: 'hidden', ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '1rem 1.1rem', borderBottom: `1px solid ${appTheme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            {Icon ? <Icon className="w-4 h-4" style={{ color: accent }} /> : null}
            <h2 style={{ fontFamily: appTheme.headingFont, fontSize: '1.02rem', color: appTheme.espresso, fontWeight: 600 }}>{title}</h2>
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: '1.1rem', ...bodyStyle }}>{children}</div>
    </div>
  )
}

export function PrimaryButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: `linear-gradient(135deg, ${appTheme.copperStrong}, ${appTheme.copper})`,
        color: '#fff', border: 'none', borderRadius: '0.95rem',
        padding: '0.75rem 1.1rem', fontSize: '0.9rem', fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(76,46,18,0.18)',
        opacity: props.disabled ? 0.7 : 1,
        transition: 'transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, style, ...props }) {
  return (
    <button
      {...props}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: '#fff', color: appTheme.espresso,
        border: `1px solid ${appTheme.border}`, borderRadius: '0.95rem',
        padding: '0.72rem 1.05rem', fontSize: '0.88rem', fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer', transition: 'all 160ms ease',
        opacity: props.disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral', style }) {
  const colors = getTone(tone)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.28rem 0.65rem',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export function StatusBanner({ icon: Icon, title, subtitle, tone = 'info', actions, style }) {
  const colors = getTone(tone)
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '1rem 1.05rem',
        borderRadius: '1rem',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        ...style,
      }}
    >
      <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
        {Icon ? <Icon className="w-4 h-4" style={{ color: colors.color, marginTop: '0.15rem', flexShrink: 0 }} /> : null}
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: colors.color }}>{title}</div>
          {subtitle ? <div style={{ fontSize: '0.85rem', color: colors.color, opacity: 0.88, marginTop: '0.15rem' }}>{subtitle}</div> : null}
        </div>
      </div>
      {actions ? <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, detail, accent = appTheme.copper, style }) {
  return (
    <div
      style={{
        background: appTheme.cardBg,
        border: `1px solid ${appTheme.border}`,
        boxShadow: appTheme.shadow,
        borderRadius: '1.3rem',
        padding: '1.1rem',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.65rem' }}>
        {Icon ? <Icon className="w-4 h-4" style={{ color: accent }} /> : <span />}
        <div style={{ fontSize: '1.6rem', lineHeight: 1, fontWeight: 700, color: appTheme.espresso }}>{value}</div>
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: appTheme.espresso }}>{label}</div>
      {detail ? <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: appTheme.espressoSoft, marginTop: '0.2rem' }}>{detail}</div> : null}
    </div>
  )
}

export function TextInput({ label, style, inputStyle, ...props }) {
  return (
    <label style={{ display: 'block', width: '100%', ...style }}>
      {label ? <div style={{ fontSize: '0.78rem', fontWeight: 600, color: appTheme.espressoSoft, marginBottom: '0.38rem' }}>{label}</div> : null}
      <input {...props} style={{ ...fieldBaseStyle, ...inputStyle }} />
    </label>
  )
}

export function SelectInput({ label, style, selectStyle, children, ...props }) {
  return (
    <label style={{ display: 'block', width: '100%', ...style }}>
      {label ? <div style={{ fontSize: '0.78rem', fontWeight: 600, color: appTheme.espressoSoft, marginBottom: '0.38rem' }}>{label}</div> : null}
      <select {...props} style={{ ...fieldBaseStyle, appearance: 'auto', cursor: 'pointer', ...selectStyle }}>
        {children}
      </select>
    </label>
  )
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '4.5rem 1.25rem' }}>
      {Icon ? <Icon className="w-14 h-14 mx-auto mb-4" style={{ color: appTheme.border }} /> : null}
      <p style={{ fontFamily: appTheme.headingFont, fontSize: '1.25rem', color: appTheme.espresso, marginBottom: '0.35rem' }}>{title}</p>
      {subtitle ? <p style={{ color: appTheme.espressoSoft, fontSize: '0.92rem', lineHeight: 1.65, maxWidth: '28rem', margin: '0 auto' }}>{subtitle}</p> : null}
    </div>
  )
}
