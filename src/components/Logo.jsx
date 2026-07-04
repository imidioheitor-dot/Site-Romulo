export default function Logo({ size = 34, withText = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="rsf-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#62a0ff" />
            <stop offset="0.55" stopColor="#3d7bff" />
            <stop offset="1" stopColor="#59e3d8" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="46" height="46" rx="13" stroke="url(#rsf-logo-g)" strokeWidth="1.4" opacity="0.6" />
        {/* monograma RS estilizado */}
        <path
          d="M15 34V15h7.5c3.6 0 5.8 2 5.8 5.1 0 2.4-1.3 4.1-3.5 4.7L29 34"
          stroke="url(#rsf-logo-g)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M34 20.5c-.6-1.1-1.9-1.8-3.4-1.8-2 0-3.4 1.1-3.4 2.7 0 3.7 7.2 2 7.2 6 0 1.8-1.6 3-3.9 3-1.7 0-3.1-.7-3.8-1.9"
          stroke="url(#rsf-logo-g)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />
      </svg>
      {withText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 19,
              fontWeight: 600,
              color: 'var(--bone)',
              letterSpacing: '0.01em'
            }}
          >
            Rômulo Santos
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.42em',
              color: 'var(--ice)',
              textTransform: 'uppercase',
              marginTop: 3
            }}
          >
            Flores · Calçados
          </span>
        </span>
      )}
    </span>
  );
}
