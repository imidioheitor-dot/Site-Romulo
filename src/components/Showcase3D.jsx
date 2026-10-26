import { Link } from 'react-router-dom';

/* Faixa horizontal com as fotos da loja (2D, desliza com o dedo ou o mouse). */
const FOTOS = [
  { f: 'mesa-natalino', to: 'mh-kit-mesa-natalino', cor: '#c1272d', t: 'Mesa posta natalina' },
  { f: 'escapulario-azul', to: 'mh-escapulario-porta', cor: '#1d3a8a', t: 'Escapulário azul royal' },
  { f: 'arvore-dourada', to: 'mh-colar-bolas', cor: '#c9a24a', t: 'Colar de bolas dourado' },
  { f: 'mesa-limao', to: 'mh-kit-mesa-dia-a-dia', cor: '#f2a71b', t: 'Mesa posta limão' },
  { f: 'vila-1', to: 'mh-vila-natalina', cor: '#e3c9a0', t: 'Vila natalina' },
  { f: 'escapulario-verde', to: 'mh-escapulario-porta', cor: '#0f6b3d', t: 'Escapulário verde' },
  { f: 'mesa-rosas', to: 'mh-kit-mesa-dia-a-dia', cor: '#e8508a', t: 'Mesa posta rosas' },
  { f: 'arvore-vinho', to: 'mh-colar-bolas', cor: '#8c1b2f', t: 'Colar de bolas vinho' },
  { f: 'almofadas-xadrez', to: 'mh-almofada-tricoline', cor: '#1f6b3a', t: 'Almofadas xadrez' },
  { f: 'mesa-floral-redondo', to: 'mh-kit-mesa-dia-a-dia', cor: '#d4553c', t: 'Jogo americano floral' },
  { f: 'vila-2', to: 'mh-vila-natalina', cor: '#e8d9b8', t: 'Vila natalina' }
];

export default function Showcase3D() {
  return (
    <div className="strip" aria-label="Fotos da Mikka Home">
      {FOTOS.map(p => (
        <Link key={p.f} to={`/produto/${p.to}`} className="strip__panel cursor-target" style={{ '--cor': p.cor }} aria-label={p.t}>
          <img src={`${import.meta.env.BASE_URL}fotos/${p.f}.jpg`} alt={p.t} loading="lazy" draggable="false" />
          <span className="strip__cap">{p.t}</span>
        </Link>
      ))}
    </div>
  );
}
