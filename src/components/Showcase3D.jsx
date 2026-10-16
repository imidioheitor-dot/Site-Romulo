import { Link } from 'react-router-dom';

/* Carrossel 3D giratório com as fotos da loja. CSS puro: cada foto fica num
   painel posicionado em círculo (rotateY + translateZ); o anel inteiro gira
   devagar e para quando o mouse passa por cima. */
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
  const n = FOTOS.length;
  return (
    <div className="ring3d" aria-label="Fotos da Mikka Home">
      <div className="ring3d__scene">
        <div className="ring3d__ring" style={{ '--n': n }}>
          {FOTOS.map((p, i) => (
            <Link
              key={p.f}
              to={`/produto/${p.to}`}
              className="ring3d__panel cursor-target"
              style={{ '--i': i, '--cor': p.cor }}
              aria-label={p.t}
            >
              <img src={`${import.meta.env.BASE_URL}fotos/${p.f}.jpg`} alt={p.t} loading="lazy" draggable="false" />
              <span className="ring3d__cap">{p.t}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
