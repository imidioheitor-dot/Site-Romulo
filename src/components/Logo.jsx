/* Marca Mikka Home: monograma M dourado + nome em serifa. A arte original
   (public/brand/logo-mikka.jpg) aparece grande no hero e no rodapé. */
export default function Logo({ size = 34, withText = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="mk-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e3c47c" />
            <stop offset="0.5" stopColor="#b98a3c" />
            <stop offset="1" stopColor="#8a6420" />
          </linearGradient>
        </defs>
        <path d="M9 38V12l15 18L39 12v26" stroke="url(#mk-logo-g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 40c8-1 15-6 23-15" stroke="url(#mk-logo-g)" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      </svg>
      {withText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 23, fontWeight: 600, color: 'var(--ice)', letterSpacing: '0.18em' }}>
            MIKKA
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 11, fontWeight: 500, letterSpacing: '0.6em', color: 'var(--mist)', marginTop: 4, paddingLeft: 2 }}>
            HOME
          </span>
        </span>
      )}
    </span>
  );
}
