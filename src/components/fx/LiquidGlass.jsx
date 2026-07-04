import { useEffect, useRef, useMemo } from 'react';
import './LiquidGlass.css';

/**
 * LiquidGlass — superfície de "vidro líquido" (Apple-style).
 * Usa uma camada de backdrop-filter refratada por um feDisplacementMap
 * animado (feTurbulence) para produzir a distorção ótica real do vidro,
 * mais realces especulares e uma borda luminosa. Envolve qualquer conteúdo.
 */
let glassUid = 0;

export default function LiquidGlass({
  children,
  className = '',
  radius = 24,
  blur = 10,
  displace = 14,
  freq = 0.008,
  interactive = true,
  tint = 'rgba(158, 197, 255, 0.06)',
  style,
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null);
  const id = useMemo(() => `lg-${++glassUid}`, []);

  useEffect(() => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;
    let raf;
    const onMove = e => {
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${mx}%`);
        el.style.setProperty('--my', `${my}%`);
      });
    };
    el.addEventListener('pointermove', onMove);
    return () => {
      el.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <Tag
      ref={ref}
      className={`liquid-glass ${className}`}
      style={{
        '--lg-radius': `${radius}px`,
        '--lg-blur': `${blur}px`,
        '--lg-tint': tint,
        ...style
      }}
      {...rest}
    >
      <svg className="liquid-glass__svg" aria-hidden="true">
        <defs>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed="7" result="noise">
              <animate attributeName="baseFrequency" dur="18s" values={`${freq};${freq * 1.7};${freq}`} repeatCount="indefinite" />
            </feTurbulence>
            <feGaussianBlur in="noise" stdDeviation="1.4" result="soft" />
            <feDisplacementMap in="SourceGraphic" in2="soft" scale={displace} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <span className="liquid-glass__refract" style={{ backdropFilter: `blur(var(--lg-blur)) url(#${id})`, WebkitBackdropFilter: `blur(var(--lg-blur)) url(#${id})` }} />
      <span className="liquid-glass__tint" />
      <span className="liquid-glass__sheen" />
      <span className="liquid-glass__edge" />
      <span className="liquid-glass__spot" />
      <div className="liquid-glass__content">{children}</div>
    </Tag>
  );
}
