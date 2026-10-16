import { Link } from 'react-router-dom';
import { useTilt } from '../lib/useTilt';

/* Cartões coloridos por "clima": foto grande, cor da coleção e inclinação 3D. */
const COLECOES = [
  { f: 'mesa-natalino', to: '/produto/mh-kit-mesa-natalino', t: 'Natal clássico', d: 'Vermelho, verde e dourado na ceia', a: '#c1272d', b: '#0f6b3d' },
  { f: 'escapulario-azul', to: '/produto/mh-escapulario-porta', t: 'Azul royal', d: 'Escapulário de veludo para a porta', a: '#1d3a8a', b: '#6aa7ff' },
  { f: 'arvore-dourada', to: '/produto/mh-colar-bolas', t: 'Dourado', d: 'Colar de bolas de 2 metros', a: '#c9a24a', b: '#7a4b12' },
  { f: 'mesa-limao', to: '/produto/mh-kit-mesa-dia-a-dia', t: 'Limão siciliano', d: 'Mesa posta de todo dia', a: '#f2a71b', b: '#4f9a2c' },
  { f: 'mesa-rosas', to: '/produto/mh-kit-mesa-dia-a-dia', t: 'Rosas e azul', d: 'Mesa posta cheia de romance', a: '#e8508a', b: '#6aa7ff' },
  { f: 'escapulario-verde', to: '/produto/mh-escapulario-porta', t: 'Verde esmeralda', d: 'Veludo e dourado para a porta', a: '#0f6b3d', b: '#c9a24a' }
];

function Cartao({ c, i }) {
  const tilt = useTilt(10);
  return (
    <Link
      to={c.to}
      className="colec reveal cursor-target"
      style={{ '--a': c.a, '--b': c.b, transitionDelay: `${(i % 3) * 80}ms` }}
      {...tilt}
    >
      <img className="colec__img" src={`${import.meta.env.BASE_URL}fotos/${c.f}.jpg`} alt={c.t} loading="lazy" draggable="false" />
      <span className="colec__veil" />
      <span className="colec__txt">
        <strong>{c.t}</strong>
        <em>{c.d}</em>
      </span>
    </Link>
  );
}

export default function Colecoes() {
  return (
    <div className="colecs">
      {COLECOES.map((c, i) => <Cartao key={c.f + c.t} c={c} i={i} />)}
    </div>
  );
}
