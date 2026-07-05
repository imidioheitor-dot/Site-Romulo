import { useMemo, useState, useEffect, useRef } from 'react';
import { FiSearch, FiSliders } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import GradualBlur from '../components/fx/GradualBlur';
import VariableProximity from '../components/fx/VariableProximity';
import { useProducts } from '../lib/store';
import { useReveal } from '../lib/useReveal';
import './Catalogo.css';

const ORDER = [
  { id: 'destaque', label: 'Em destaque' },
  { id: 'menor', label: 'Menor preço' },
  { id: 'maior', label: 'Maior preço' },
  { id: 'nome', label: 'Nome (A–Z)' }
];

export default function Catalogo() {
  const products = useProducts();
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState('Todos');
  const [genero, setGenero] = useState('Todos');
  const [marca, setMarca] = useState('Todas');
  const [ordem, setOrdem] = useState('destaque');
  const headRef = useRef(null);

  useEffect(() => window.scrollTo(0, 0), []);

  const categorias = useMemo(() => ['Todos', ...new Set(products.map(p => p.categoria))], [products]);
  const generos = useMemo(() => ['Todos', ...new Set(products.map(p => p.genero))], [products]);
  const marcas = useMemo(() => ['Todas', ...new Set(products.map(p => p.marca))], [products]);

  const lista = useMemo(() => {
    let out = products.filter(p => {
      const okBusca =
        !busca ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.marca.toLowerCase().includes(busca.toLowerCase());
      const okCat = cat === 'Todos' || p.categoria === cat;
      const okGen = genero === 'Todos' || p.genero === genero;
      const okMarca = marca === 'Todas' || p.marca === marca;
      return okBusca && okCat && okGen && okMarca;
    });
    out = [...out].sort((a, b) => {
      if (ordem === 'menor') return a.preco - b.preco;
      if (ordem === 'maior') return b.preco - a.preco;
      if (ordem === 'nome') return a.nome.localeCompare(b.nome);
      return (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0);
    });
    return out;
  }, [products, busca, cat, genero, marca, ordem]);

  useReveal([lista.length, cat, genero, marca, ordem, busca]);

  return (
    <div className="catalogo">
      <section className="container catalogo__head">
        <p className="eyebrow rise" style={{ marginBottom: 20 }}>O catálogo completo</p>
        <h1 className="display rise rise-1 catalogo__title" ref={headRef}>
          <VariableProximity
            label="Encontre o seu"
            containerRef={headRef}
            className="catalogo__vp cursor-target"
            fromFontVariationSettings="'wght' 300, 'opsz' 12"
            toFontVariationSettings="'wght' 900, 'opsz' 40"
            radius={130}
            falloff="gaussian"
          />{' '}
          <em>par</em>.
        </h1>
        <p className="lead rise rise-2" style={{ marginTop: 18 }}>
          Do casual ao social, do conforto à corrida — {products.length} modelos selecionados
          com o equilíbrio certo entre estilo, qualidade e preço.
        </p>
      </section>

      <section className="container catalogo__toolbar">
        <div className="catalogo__search cursor-target">
          <FiSearch />
          <input
            placeholder="Buscar por nome ou marca…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="catalogo__filters">
          <Filter label="Categoria" options={categorias} value={cat} onChange={setCat} />
          <Filter label="Gênero" options={generos} value={genero} onChange={setGenero} />
          <Filter label="Marca" options={marcas} value={marca} onChange={setMarca} />
          <div className="catalogo__order">
            <FiSliders size={14} />
            <select value={ordem} onChange={e => setOrdem(e.target.value)} className="cursor-target">
              {ORDER.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="container catalogo__grid-wrap">
        <div className="catalogo__count">{lista.length} {lista.length === 1 ? 'modelo' : 'modelos'}</div>
        {lista.length ? (
          <div className="catalogo__grid">
            {lista.map((p, i) => (
              <ProductCard key={p.id} produto={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="catalogo__empty">
            <p>Nenhum modelo encontrado com esses filtros.</p>
            <button className="btn btn-quiet cursor-target" onClick={() => { setBusca(''); setCat('Todos'); setGenero('Todos'); setMarca('Todas'); }}>
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      <div className="page-end-space" />
    </div>
  );
}

function Filter({ label, options, value, onChange }) {
  return (
    <div className="catalogo__chipset">
      <span className="catalogo__chipset-label">{label}</span>
      <div className="catalogo__chips">
        {options.map(o => (
          <button
            key={o}
            className={`catalogo__chip cursor-target ${value === o ? 'is-on' : ''}`}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
