import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiSliders } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import VariableProximity from '../components/fx/VariableProximity';
import { useProducts, CATEGORIAS } from '../lib/store';
import { useReveal } from '../lib/useReveal';
import './Catalogo.css';

const ORDER = [
  { id: 'destaque', label: 'Em destaque' },
  { id: 'menor', label: 'Menor preço' },
  { id: 'maior', label: 'Maior preço' },
  { id: 'nome', label: 'Nome (A–Z)' }
];

const TABS = ['Todos', ...CATEGORIAS];

// mapeia o slug da URL <-> nome do tipo (para acentos/case)
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const tipoFromSlug = s => TABS.find(t => slug(t) === slug(s || '')) || 'Todos';

export default function Catalogo() {
  const products = useProducts();
  const navigate = useNavigate();
  const { tipo: tipoParam } = useParams();
  const tipo = tipoFromSlug(tipoParam);

  const [busca, setBusca] = useState('');
  const [genero, setGenero] = useState('Todos');
  const [marca, setMarca] = useState('Todas');
  const [ordem, setOrdem] = useState('destaque');
  const headRef = useRef(null);

  useEffect(() => window.scrollTo(0, 0), [tipoParam]);
  useEffect(() => { setGenero('Todos'); setMarca('Todas'); }, [tipoParam]);

  // produtos do tipo atual (para derivar filtros e lista)
  const doTipo = useMemo(
    () => (tipo === 'Todos' ? products : products.filter(p => (p.tipo || 'Tênis') === tipo)),
    [products, tipo]
  );

  const generos = useMemo(() => ['Todos', ...new Set(doTipo.map(p => p.genero).filter(Boolean))], [doTipo]);
  const marcas = useMemo(() => ['Todas', ...new Set(doTipo.map(p => p.marca).filter(Boolean))], [doTipo]);

  const lista = useMemo(() => {
    let out = doTipo.filter(p => {
      const okBusca =
        !busca ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (p.marca || '').toLowerCase().includes(busca.toLowerCase());
      const okGen = genero === 'Todos' || p.genero === genero;
      const okMarca = marca === 'Todas' || p.marca === marca;
      return okBusca && okGen && okMarca;
    });
    out = [...out].sort((a, b) => {
      if (ordem === 'menor') return a.preco - b.preco;
      if (ordem === 'maior') return b.preco - a.preco;
      if (ordem === 'nome') return a.nome.localeCompare(b.nome);
      return (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0);
    });
    return out;
  }, [doTipo, busca, genero, marca, ordem]);

  useReveal([lista.length, tipo, genero, marca, ordem, busca]);

  const contagem = t => (t === 'Todos' ? products.length : products.filter(p => (p.tipo || 'Tênis') === t).length);

  return (
    <div className="catalogo">
      <section className="container catalogo__head">
        <p className="eyebrow rise" style={{ marginBottom: 20 }}>
          {tipo === 'Todos' ? 'O catálogo completo' : `Categoria · ${tipo}`}
        </p>
        <h1 className="display rise rise-1 catalogo__title" ref={headRef}>
          <VariableProximity
            label={tipo === 'Todos' ? 'Encontre o seu' : tipo}
            containerRef={headRef}
            className="catalogo__vp cursor-target"
            fromFontVariationSettings="'wght' 300, 'opsz' 12"
            toFontVariationSettings="'wght' 900, 'opsz' 40"
            radius={130}
            falloff="gaussian"
          />
          {tipo === 'Todos' && <> <em>estilo</em>.</>}
        </h1>
        <p className="lead rise rise-2" style={{ marginTop: 18 }}>
          Tênis, roupas, óculos, bolsas, cuecas e acessórios — a seleção da Casa Mikka,
          com o equilíbrio certo entre estilo, qualidade e preço.
        </p>
      </section>

      {/* Abas de categoria */}
      <section className="container catalogo__tabs-wrap">
        <div className="catalogo__tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`catalogo__tab cursor-target ${tipo === t ? 'is-on' : ''}`}
              onClick={() => navigate(t === 'Todos' ? '/catalogo' : `/catalogo/${slug(t)}`)}
            >
              {t}
              <span className="catalogo__tab-count">{contagem(t)}</span>
            </button>
          ))}
        </div>
      </section>

      {tipo === 'Tênis' && (
        <section className="container catalogo__banner-wrap">
          <div className="catalogo__banner reveal">
            <video
              className="catalogo__banner-video"
              src={`${import.meta.env.BASE_URL}media/tenis.mp4`}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
            <div className="catalogo__banner-scrim" />
            <div className="catalogo__banner-text">
              <span className="eyebrow">Coleção de tênis</span>
              <h2>Do casual ao statement.</h2>
              <p>Modelos selecionados a dedo — conforto e presença em cada passo.</p>
            </div>
          </div>
        </section>
      )}

      <section className="container catalogo__toolbar">
        <div className="catalogo__search cursor-target">
          <FiSearch />
          <input placeholder="Buscar por nome ou marca…" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        <div className="catalogo__filters">
          {generos.length > 1 && <Filter label="Gênero" options={generos} value={genero} onChange={setGenero} />}
          {marcas.length > 1 && <Filter label="Marca" options={marcas} value={marca} onChange={setMarca} />}
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
        <div className="catalogo__count">{lista.length} {lista.length === 1 ? 'produto' : 'produtos'}</div>
        {lista.length ? (
          <div className="catalogo__grid">
            {lista.map((p, i) => (
              <ProductCard key={p.id} produto={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="catalogo__empty">
            <p>
              {contagem(tipo) === 0 && tipo !== 'Todos'
                ? `Novidades de ${tipo.toLowerCase()} chegando em breve. 👀`
                : 'Nenhum produto encontrado com esses filtros.'}
            </p>
            <button className="btn btn-quiet cursor-target" onClick={() => { setBusca(''); setGenero('Todos'); setMarca('Todas'); navigate('/catalogo'); }}>
              Ver tudo
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
