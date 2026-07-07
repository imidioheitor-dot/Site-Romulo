import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiNike, SiAdidas, SiPuma, SiNewbalance, SiReebok, SiJordan, SiFila, SiUnderarmour } from 'react-icons/si';
import { FiArrowRight, FiArrowUpRight, FiFeather, FiZap, FiShield, FiRefreshCw, FiTruck, FiCreditCard, FiHeadphones } from 'react-icons/fi';

import HeroBackground from '../components/HeroBackground';
import RotatingText from '../components/fx/RotatingText';
import GradualBlur from '../components/fx/GradualBlur';
import LogoLoop from '../components/fx/LogoLoop';
import LiquidGlass from '../components/fx/LiquidGlass';
import ShapeBlur from '../components/fx/ShapeBlur';
import StickerPeel from '../components/fx/StickerPeel';
import Cubes from '../components/fx/Cubes';
import ProductCard from '../components/ProductCard';
import SplitCardMedia from '../components/SplitCardMedia';
import { useProducts } from '../lib/store';
import { useReveal } from '../lib/useReveal';
import './Home.css';

const BRANDS = [
  { node: <SiNike />, title: 'Nike' },
  { node: <SiAdidas />, title: 'Adidas' },
  { node: <SiJordan />, title: 'Jordan' },
  { node: <SiPuma />, title: 'Puma' },
  { node: <SiNewbalance />, title: 'New Balance' },
  { node: <SiReebok />, title: 'Reebok' },
  { node: <SiFila />, title: 'Fila' },
  { node: <SiUnderarmour />, title: 'Under Armour' }
];

const PILLARS = [
  { icon: <FiFeather />, t: 'Leveza', d: 'Materiais ultraleves' },
  { icon: <FiZap />, t: 'Performance', d: 'Feito para o ritmo' },
  { icon: <FiShield />, t: 'Durabilidade', d: 'Construção que dura' },
  { icon: <FiRefreshCw />, t: 'Maciez', d: 'O dia todo, sem peso' }
];

const PERKS = [
  { icon: <FiTruck />, t: 'Entrega para toda Goiânia', d: 'Retirada grátis na loja' },
  { icon: <FiCreditCard />, t: 'Pagamento via Pix', d: 'Rápido e sem taxas' },
  { icon: <FiRefreshCw />, t: 'Troca fácil', d: 'Até 30 dias' },
  { icon: <FiHeadphones />, t: 'Atendimento dedicado', d: 'Suporte de verdade' }
];

export default function Home() {
  const products = useProducts();
  const navigate = useNavigate();
  const destaques = products.filter(p => p.destaque).slice(0, 4);
  const techProduct = products.find(p => p.id === 'rsf-supernova') || products[0];
  const designProduct = products.find(p => p.id === 'rsf-jordan-menta') || products[3] || products[0];

  const heroRef = useRef(null);

  useReveal([products.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // progresso de scroll do hero (0 → 1) dirigindo o efeito cinematográfico
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const total = el.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)) : 0;
        el.style.setProperty('--p', p.toFixed(4));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="home">
      {/* fundo "liquid glass" bem sutil (CSS puro, sem WebGL) para as áreas
          escuras não ficarem chapadas de preto */}
      <div className="home__bg" aria-hidden="true">
        <span className="home__bg-blob home__bg-blob--1" />
        <span className="home__bg-blob home__bg-blob--2" />
        <span className="home__bg-blob home__bg-blob--3" />
        <span className="home__bg-sheen" />
      </div>

      {/* ===================== HERO SCROLÁVEL ===================== */}
      <section className="hero" ref={heroRef}>
        <div className="hero__sticky">
          <HeroBackground />

          {/* Camada 1 — entrada */}
          <div className="container hero__inner hero__layer hero__layer--1">
            <div className="hero__eyebrow rise">
              <span className="tag">Coleção 2026 · Casa Mikka</span>
            </div>

            <h1 className="hero__title rise">
              <span className="hero__title-line">
                <span className="hero__sinta">Sinta a</span>
                <RotatingText
                  texts={['leveza.', 'elegância.', 'maciez.', 'atitude.', 'presença.', 'durabilidade.', 'sofisticação.']}
                  mainClassName="hero__rotating"
                  splitLevelClassName="hero__rotating-split"
                  staggerFrom="last"
                  staggerDuration={0.015}
                  rotationInterval={2600}
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-120%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 34, stiffness: 480 }}
                />
              </span>
              <span className="hero__brand">Casa Mikka</span>
            </h1>

            <p className="hero__sub rise rise-2">
              Sapatos para o dia a dia que mantêm a <em>elegância</em> — selecionados a dedo,
              com o caimento que te acompanha e o preço que cabe no bolso.
            </p>

            <div className="hero__cta rise rise-3">
              <button className="btn btn-primary cursor-target" onClick={() => navigate('/catalogo')}>
                Ver catálogo <FiArrowRight />
              </button>
              <Link to="/localizacao" className="btn btn-ghost cursor-target">
                Visitar a loja
              </Link>
            </div>
          </div>

          {/* Camada 2 — revela no meio do scroll */}
          <div className="container hero__inner hero__layer hero__layer--2" aria-hidden="true">
            <span className="hero__kicker">Do casual ao social</span>
            <h2 className="hero__statement">
              O <em className="h-serif">par certo</em><br />para cada passo do seu dia.
            </h2>
          </div>

          <div className="hero__scrollcue">
            <span className="hero__scrollcue-track"><span /></span>
            <span>Role para descobrir</span>
          </div>

          <GradualBlur target="parent" position="bottom" height="8rem" strength={2.4} divCount={6} curve="bezier" exponential opacity={1} />
        </div>
      </section>

      {/* ===================== PILARES ===================== */}
      <section className="container home-pillars">
        <LiquidGlass className="pillars-glass reveal" radius={26}>
          <div className="pillars">
            {PILLARS.map((p, i) => (
              <div className="pillar" key={i}>
                <span className="pillar__ic">{p.icon}</span>
                <div>
                  <strong>{p.t}</strong>
                  <span>{p.d}</span>
                </div>
              </div>
            ))}
          </div>
        </LiquidGlass>
      </section>

      {/* ===================== MARCAS ===================== */}
      <section className="section home-brands">
        <div className="container">
          <p className="eyebrow reveal" style={{ marginBottom: 26 }}>As marcas que você ama</p>
        </div>
        <LogoLoop logos={BRANDS} speed={62} logoHeight={30} gap={72} fadeOut fadeOutColor="#17110d" scaleOnHover ariaLabel="Marcas" />
      </section>

      {/* ===================== DESTAQUES ===================== */}
      <section className="section container home-featured">
        <header className="home-featured__head reveal">
          <div>
            <p className="eyebrow" style={{ marginBottom: 18 }}>Seleção da casa</p>
            <h2 className="h2">Lançamentos em <em className="h-serif">destaque</em></h2>
          </div>
          <Link to="/catalogo" className="home-featured__all cursor-target">
            Ver todos <FiArrowUpRight />
          </Link>
        </header>

        <div className="home-featured__grid">
          {destaques.map((p, i) => (
            <ProductCard key={p.id} produto={p} index={i} />
          ))}
        </div>
      </section>

      {/* ===================== TECNOLOGIA / DESIGN ===================== */}
      <section className="section container home-split">
        <div className="split-card split-card--tech reveal cursor-target" onClick={() => navigate('/catalogo')}>
          <div className="split-card__shape" aria-hidden="true">
            <ShapeBlur variation={0} shapeSize={0.62} roundness={0.5} borderSize={0.045} circleSize={0.35} circleEdge={0.9} color="#d8834e" pixelRatioProp={typeof window !== 'undefined' ? window.devicePixelRatio : 1} />
          </div>
          <div className="split-card__sticker" aria-hidden="true">
            <StickerPeel width={230} rotate={-8} peelBackHoverPct={26} peelDirection={-24} shadowIntensity={0.5} renderImage={() => <SplitCardMedia img="card-amortecimento.jpg" colorway={techProduct?.colorway} seed={7} />} />
          </div>
          <div className="split-card__body">
            <span className="tag">Tecnologia</span>
            <h3 className="split-card__title">Amortecimento <em className="h-serif">inteligente</em></h3>
            <p className="lead">Espuma reativa que devolve energia a cada passo. Leveza que você sente do primeiro ao último quilômetro.</p>
            <span className="split-card__link">Explorar <FiArrowRight /></span>
          </div>
        </div>

        <div className="split-card split-card--design reveal cursor-target" onClick={() => navigate(`/produto/${designProduct?.id}`)}>
          <div className="split-card__shape" aria-hidden="true">
            <ShapeBlur variation={2} shapeSize={0.7} roundness={0.5} borderSize={0.05} circleSize={0.4} circleEdge={1} color="#cf9b6b" pixelRatioProp={typeof window !== 'undefined' ? window.devicePixelRatio : 1} />
          </div>
          <div className="split-card__sticker" aria-hidden="true">
            <StickerPeel width={230} rotate={9} peelBackHoverPct={26} peelDirection={20} shadowIntensity={0.5} renderImage={() => <SplitCardMedia img="card-estilo.jpg" colorway={designProduct?.colorway} seed={12} />} />
          </div>
          <div className="split-card__body">
            <span className="tag">Design</span>
            <h3 className="split-card__title">Estilo que <em className="h-serif">inspira</em></h3>
            <p className="lead">Detalhes pensados para se destacar sem gritar. O par certo transforma qualquer look do dia a dia.</p>
            <span className="split-card__link">Conferir <FiArrowRight /></span>
          </div>
        </div>
      </section>

      {/* ===================== FAIXA CUBES / CTA ===================== */}
      <section className="section home-cta">
        <div className="home-cta__cubes" aria-hidden="true">
          <Cubes
            gridSize={9}
            maxAngle={55}
            radius={4}
            cellGap={6}
            borderStyle="1px solid rgba(224, 183, 138,0.18)"
            faceColor="#241a12"
            shadow={false}
            autoAnimate
            rippleOnClick
            rippleColor="#c0663a"
            rippleSpeed={1.6}
          />
        </div>
        <div className="container">
          <LiquidGlass className="home-cta__glass reveal" radius={30} blur={12}>
            <div className="home-cta__content">
              <p className="eyebrow" style={{ marginBottom: 20 }}>Pronto para o próximo passo?</p>
              <h2 className="h2" style={{ maxWidth: 620 }}>
                Monte seu carrinho e pague com <em className="h-serif">Pix</em> em segundos.
              </h2>
              <p className="lead" style={{ marginTop: 18 }}>
                Escolha seus pares, envie o comprovante pelo site e nós preparamos o pedido.
                Simples, seguro e sem taxas.
              </p>
              <div className="hero__cta" style={{ marginTop: 30 }}>
                <button className="btn btn-primary cursor-target" onClick={() => navigate('/catalogo')}>
                  Começar a comprar <FiArrowRight />
                </button>
                <Link to="/contato" className="btn btn-ghost cursor-target">Falar com a loja</Link>
              </div>
            </div>
          </LiquidGlass>
        </div>
      </section>

      {/* ===================== PERKS ===================== */}
      <section className="section container home-perks">
        {PERKS.map((p, i) => (
          <div className="perk reveal" key={i} style={{ transitionDelay: `${i * 60}ms` }}>
            <span className="perk__ic">{p.icon}</span>
            <div>
              <strong>{p.t}</strong>
              <span>{p.d}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="page-end-space" />
    </div>
  );
}
