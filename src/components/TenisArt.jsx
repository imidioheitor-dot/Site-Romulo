import { useMemo } from 'react';

/**
 * TenisArt — ilustração vetorial de um tênis de perfil, colorida
 * a partir do `colorway` do produto. É o fallback elegante usado
 * sempre que a foto real ainda não foi adicionada em /public/products.
 */
export default function TenisArt({ colorway = {}, seed = 1, className = '', style }) {
  const c = {
    base: colorway.base || '#e9eef6',
    mesh: colorway.mesh || '#f4f7fd',
    stripe: colorway.stripe || '#c0663a',
    sole: colorway.sole || '#f6f4ee',
    accent: colorway.accent || '#8a4526',
    lace: colorway.lace || '#ffffff'
  };
  const gid = useMemo(() => `tenis-${seed}-${Math.random().toString(36).slice(2, 7)}`, [seed]);

  return (
    <svg
      viewBox="0 0 400 240"
      className={className}
      style={style}
      role="img"
      aria-label="Ilustração de tênis"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.mesh} />
          <stop offset="1" stopColor={c.base} />
        </linearGradient>
        <linearGradient id={`${gid}-sole`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.sole} />
          <stop offset="1" stopColor={c.accent} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={c.stripe} stopOpacity="0.35" />
          <stop offset="1" stopColor={c.stripe} stopOpacity="0" />
        </radialGradient>
        <filter id={`${gid}-shadow`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* halo */}
      <ellipse cx="200" cy="120" rx="180" ry="110" fill={`url(#${gid}-glow)`} />

      {/* sombra no chão */}
      <ellipse cx="205" cy="212" rx="150" ry="14" fill="#000" opacity="0.35" />

      <g filter={`url(#${gid}-shadow)`}>
        {/* sola */}
        <path
          d="M40 196 Q34 172 60 168 L330 158 Q372 156 372 178 Q372 200 344 202 L74 208 Q46 208 40 196 Z"
          fill={`url(#${gid}-sole)`}
          stroke={c.accent}
          strokeOpacity="0.25"
        />
        {/* entressola risca */}
        <path d="M52 188 L354 178" stroke={c.accent} strokeOpacity="0.3" strokeWidth="2" fill="none" />

        {/* corpo do tênis */}
        <path
          d="M60 170 Q66 96 150 84 Q196 78 214 96 Q236 118 300 126 Q340 131 350 150 Q356 162 342 166 L70 178 Q58 178 60 170 Z"
          fill={`url(#${gid}-body)`}
          stroke={c.accent}
          strokeOpacity="0.18"
        />

        {/* biqueira */}
        <path d="M300 126 Q340 131 350 150 Q356 162 342 166 L300 168 Q292 146 300 126 Z" fill={c.base} opacity="0.65" />

        {/* gola / calcanhar */}
        <path d="M60 170 Q66 108 96 92 Q104 120 96 150 L92 172 Z" fill={c.mesh} />
        <path d="M74 96 Q90 84 108 90 Q98 100 96 116 Q82 108 74 96 Z" fill={c.accent} opacity="0.5" />

        {/* três listras / swoosh diagonal */}
        <g stroke={c.stripe} strokeWidth="9" strokeLinecap="round" opacity="0.95">
          <line x1="150" y1="150" x2="196" y2="112" />
          <line x1="172" y1="156" x2="222" y2="116" />
          <line x1="196" y1="160" x2="250" y2="122" />
        </g>

        {/* cadarços */}
        <g stroke={c.lace} strokeWidth="5" strokeLinecap="round" opacity="0.95">
          <line x1="112" y1="118" x2="140" y2="108" />
          <line x1="116" y1="132" x2="146" y2="122" />
          <line x1="122" y1="146" x2="150" y2="136" />
        </g>
        {/* ilhoses */}
        <g fill={c.accent} opacity="0.7">
          <circle cx="112" cy="118" r="2.6" />
          <circle cx="116" cy="132" r="2.6" />
          <circle cx="122" cy="146" r="2.6" />
          <circle cx="140" cy="108" r="2.6" />
          <circle cx="146" cy="122" r="2.6" />
          <circle cx="150" cy="136" r="2.6" />
        </g>

        {/* língua */}
        <path d="M108 92 Q120 80 138 86 Q132 100 130 112 Q118 104 108 92 Z" fill={c.lace} opacity="0.9" />
      </g>
    </svg>
  );
}
