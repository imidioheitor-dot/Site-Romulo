/**
 * Ilustrações douradas (SVG) dos produtos da Mikka Home. Enquanto a loja não
 * cadastra a foto real do produto, é isto que aparece no card e na página.
 * `cores` (do produto) tinge cada ilustração.
 */
const OURO = '#b98a3c';
const OURO_CLARO = '#e3c47c';
const CREME = '#f3e9d8';

function Fundo({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={OURO_CLARO} />
          <stop offset="0.5" stopColor={OURO} />
          <stop offset="1" stopColor="#8a6420" />
        </linearGradient>
        <radialGradient id={`f-${id}`} cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#efe3cb" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#f-${id})`} />
    </>
  );
}

const ARTES = {
  porta: (c, id) => (
    <g>
      <rect x="150" y="30" width="100" height="340" rx="6" fill="none" stroke={`url(#g-${id})`} strokeWidth="2" opacity=".35" />
      <path d="M200 70 C145 70 120 130 135 190 C148 245 200 270 200 270 C200 270 252 245 265 190 C280 130 255 70 200 70Z" fill="none" stroke={c[2] || '#2f5a3a'} strokeWidth="14" strokeLinecap="round" opacity=".85" />
      <path d="M200 70 C145 70 120 130 135 190 C148 245 200 270 200 270 C200 270 252 245 265 190 C280 130 255 70 200 70Z" fill="none" stroke={`url(#g-${id})`} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
      <path d="M200 262 L165 318 L200 300 L235 318Z" fill={c[1] || '#8a1f2b'} />
      <path d="M200 262 L185 300 L200 292 L215 300Z" fill={`url(#g-${id})`} opacity=".9" />
      {[[150, 120], [250, 120], [130, 185], [270, 185], [160, 235], [240, 235]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill={i % 2 ? c[1] || '#8a1f2b' : `url(#g-${id})`} />
      ))}
    </g>
  ),
  bolas: (c, id) => (
    <g>
      <path d="M30 120 Q200 250 370 120" fill="none" stroke={`url(#g-${id})`} strokeWidth="3" />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = (i + 0.5) / 9;
        const x = 30 + 340 * t;
        const y = 120 + 2 * 130 * 0.5 * (1 - Math.pow(2 * t - 1, 2)) * 1.0;
        const cor = c[i % c.length];
        return (
          <g key={i}>
            <rect x={x - 3} y={y - 4} width="6" height="9" fill="#8a6420" />
            <circle cx={x} cy={y + 24} r="21" fill={cor} />
            <circle cx={x - 7} cy={y + 17} r="6" fill="#fff" opacity=".45" />
          </g>
        );
      })}
    </g>
  ),
  vila: (c, id) => (
    <g>
      <rect x="40" y="318" width="320" height="10" rx="5" fill={`url(#g-${id})`} opacity=".7" />
      {[[70, 230, 80, 88], [160, 200, 90, 118], [260, 240, 70, 78]].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#fffaf0" stroke={OURO} strokeWidth="2" />
          <path d={`M${x - 8} ${y} L${x + w / 2} ${y - 48} L${x + w + 8} ${y}Z`} fill={i === 1 ? '#b3262e' : `url(#g-${id})`} />
          <rect x={x + w / 2 - 9} y={y + h - 38} width="18" height="38" fill={OURO} />
          <rect x={x + 10} y={y + 16} width="16" height="18" fill="#ffe9a8" stroke={OURO} />
        </g>
      ))}
      {[[130, 120], [330, 140], [50, 150], [215, 90]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 9}L${x + 3} ${y - 3}L${x + 9} ${y}L${x + 3} ${y + 3}L${x} ${y + 9}L${x - 3} ${y + 3}L${x - 9} ${y}L${x - 3} ${y - 3}Z`} fill={OURO_CLARO} />
      ))}
    </g>
  ),
  mesa: (c, id) => (
    <g>
      <rect x="20" y="170" width="360" height="42" fill={c[0] || '#b3262e'} opacity=".9" />
      <rect x="20" y="170" width="360" height="5" fill={`url(#g-${id})`} />
      <rect x="20" y="207" width="360" height="5" fill={`url(#g-${id})`} />
      {[70, 200, 330].map((x, i) => (
        <g key={i}>
          <rect x={x - 52} y="226" width="104" height="66" rx="6" fill="#fffaf0" stroke={OURO} strokeWidth="2" />
          <circle cx={x} cy="259" r="23" fill="#fff" stroke={`url(#g-${id})`} strokeWidth="3" />
          <rect x={x - 62} y="300" width="124" height="40" rx="4" fill={CREME} stroke={OURO} strokeWidth="1.5" />
          <path d={`M${x - 62} 300 L${x} 322 L${x + 62} 300`} fill="none" stroke={OURO} strokeWidth="1.5" />
        </g>
      ))}
      {[135, 265].map(x => <circle key={x} cx={x} cy="150" r="13" fill="none" stroke={`url(#g-${id})`} strokeWidth="5" />)}
      <circle cx="200" cy="120" r="16" fill="none" stroke={`url(#g-${id})`} strokeWidth="5" />
    </g>
  ),
  centro: (c, id) => (
    <g>
      <ellipse cx="200" cy="318" rx="130" ry="18" fill={`url(#g-${id})`} opacity=".55" />
      <path d="M92 300 Q200 340 308 300 L292 250 Q200 280 108 250Z" fill={`url(#g-${id})`} />
      <rect x="192" y="120" width="16" height="100" rx="4" fill={CREME} stroke={OURO} />
      <path d="M200 70 Q184 100 200 118 Q216 100 200 70Z" fill="#ffd36e" />
      {[[110, 230], [150, 215], [250, 215], [290, 230]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="18" fill={i % 2 ? '#b3262e' : '#2f5a3a'} />
      ))}
      <path d="M118 245 Q150 200 200 225 Q250 200 282 245" fill="none" stroke="#2f5a3a" strokeWidth="9" strokeLinecap="round" opacity=".8" />
    </g>
  ),
  almofada: (c, id) => (
    <g>
      <path d="M85 95 Q200 60 315 95 Q335 200 315 305 Q200 340 85 305 Q65 200 85 95Z" fill={c[0] || '#9e1f2a'} />
      <path d="M85 95 Q200 60 315 95 Q335 200 315 305 Q200 340 85 305 Q65 200 85 95Z" fill="none" stroke={`url(#g-${id})`} strokeWidth="3" />
      <path d="M130 130 Q200 110 270 130" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="14" strokeLinecap="round" />
      <circle cx="200" cy="200" r="7" fill={`url(#g-${id})`} />
      {[[200, 120], [200, 280], [120, 200], [280, 200]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={OURO_CLARO} />)}
    </g>
  )
};

export default function ArteProduto({ produto, className = '', style }) {
  const arte = ARTES[produto?.arte] || ARTES.centro;
  const cores = (produto?.cores && produto.cores.length ? produto.cores : [OURO, '#8a1f2b', '#2f5a3a']);
  const id = (produto?.id || 'x').replace(/[^a-z0-9]/gi, '');
  return (
    <svg className={className} style={style} viewBox="0 0 400 400" role="img" aria-label={produto?.nome || 'Produto'} preserveAspectRatio="xMidYMid slice">
      <Fundo id={id} />
      {arte(cores, id)}
    </svg>
  );
}
