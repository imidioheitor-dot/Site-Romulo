import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowUpRight, FiHeart, FiAward, FiGift, FiRefreshCw, FiTruck, FiCreditCard, FiHeadphones } from 'react-icons/fi';

import HeroBackground from '../components/HeroBackground';
import RotatingText from '../components/fx/RotatingText';
import LiquidGlass from '../components/fx/LiquidGlass';
import ShapeBlur from '../components/fx/ShapeBlur';
import Boundary from '../components/fx/Boundary';
import StickerPeel from '../components/fx/StickerPeel';
import ProductCard from '../components/ProductCard';
import ProductMedia from '../components/ProductMedia';
import Showcase3D from '../components/Showcase3D';
import Colecoes from '../components/Colecoes';
import { useProducts } from '../lib/store';
import { useReveal } from '../lib/useReveal';
import './Home.css';

const PILLARS = [
  { icon: <FiHeart />, t: 'Aconchego', d: 'Para cada canto do lar' },
  { icon: <FiAward />, t: 'Elegância', d: 'Detalhes que encantam' },
  { icon: <FiGift />, t: 'Natal Mikka', d: 'Coleção da temporada' },
  { icon: <FiRefreshCw />, t: 'Preço justo', d: 'Qualidade que cabe' }
];

const PERKS = [
  { icon: <FiTruck />, t: 'Entrega em Goiânia', d: 'Ou retire grátis na loja' },
  { icon: <FiCreditCard />, t: 'Pagamento via Pix', d: 'Rápido e sem taxas' },
  { icon: <FiGift />, t: 'Embalagem para presente', d: 'Pedindo no atendimento' },
  { icon: <FiHeadphones />, t: 'Atendimento da Elvira', d: 'Direto no WhatsApp' }
];

export default function Home() {
  const products = useProducts();
  const navigate = useNavigate();
  const destaques = products.filter(p => p.destaque).slice(0, 4);
  const natalProduct = products.find(p => p.id === 'mh-vila-natalina') || products[0];
  const mesaProduct = products.find(p => p.id === 'mh-kit-mesa-natalino') || products[3] || products[0];

  const heroRef = useRef(null);
  const introRef = useRef(null);

  useReveal([products.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // o vídeo recua e escurece enquanto o texto sobe; o topo só aparece depois do vídeo
  useEffect(() => {
    const hero = heroRef.current;
    const intro = introRef.current;
    if (!hero || !intro) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, Math.max(0, 1 - intro.getBoundingClientRect().top / window.innerHeight));
        hero.style.setProperty('--p', p.toFixed(4));
        intro.style.setProperty('--f', Math.min(1, Math.max(0, (p - 0.08) / 0.4)).toFixed(3));
        document.body.classList.toggle('on-hero', window.scrollY < window.innerHeight * 0.55);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      document.body.classList.remove('on-hero');
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

      {/* ===================== HERO: SÓ O VÍDEO EM TELA CHEIA ===================== */}
      <section className="hero" ref={heroRef} aria-label="Abertura">
        <HeroBackground />
        <span className="hero__rola" aria-hidden="true" />
      </section>

      {/* ===================== ABERTURA: o texto sobe por cima do vídeo ===================== */}
      <section className="hero-intro" ref={introRef}>
          <div className="container hero-intro__inner">
            <div className="hero__eyebrow">
              <span className="tag">Coleção Natal 2026 · Mikka Home</span>
            </div>

            <h1 className="hero__title">
              <span className="hero__title-line">
                <span className="hero__sinta">Sinta o</span>
                <RotatingText
                  texts={['aconchego.', 'charme.', 'Natal.', 'carinho.', 'requinte.', 'brilho.']}
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
              <span className="hero__brand">Mikka Home</span>
            </h1>

            <p className="hero__sub">
              Decoração, mesa posta e almofadas com <em>elegância</em> — da nossa casa para seu lar!
            </p>

            <div className="hero__cta">
              <button className="btn btn-primary cursor-target" onClick={() => navigate('/catalogo')}>
                Ver catálogo <FiArrowRight />
              </button>
              <Link to="/localizacao" className="btn btn-ghost cursor-target">
                Visitar a loja
              </Link>
            </div>
          </div>

          <div className="hero-intro__statement container">
            <span className="hero__kicker">Da nossa casa para seu lar</span>
            <h2 className="hero__statement">
              Cada detalhe <em className="h-serif">faz</em><br />a sua casa brilhar.
            </h2>
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

      {/* ===================== GALERIA ===================== */}
      <section className="section home-showcase">
        <div className="container home-showcase__head reveal">
          <p className="eyebrow" style={{ marginBottom: 18 }}>Direto da nossa casa</p>
          <h2 className="h2">Escolha o <em className="h-serif">seu</em></h2>
          <p className="lead" style={{ marginTop: 14 }}>Mesas postas, árvores e almofadas pensadas para a sua casa.</p>
        </div>
        <Showcase3D />
      </section>

      {/* ===================== COLEÇÕES COLORIDAS ===================== */}
      <section className="section container home-colecs">
        <header className="home-featured__head reveal">
          <div>
            <p className="eyebrow" style={{ marginBottom: 18 }}>Escolha o seu clima</p>
            <h2 className="h2">Cores que <em className="h-serif">encantam</em></h2>
          </div>
        </header>
        <Colecoes />
      </section>

      {/* ===================== DESTAQUES ===================== */}
      <section className="section container home-featured">
        <header className="home-featured__head reveal">
          <div>
            <p className="eyebrow" style={{ marginBottom: 18 }}>Seleção da casa</p>
            <h2 className="h2">Queridinhos da <em className="h-serif">casa</em></h2>
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
        <div className="split-card split-card--tech reveal cursor-target" onClick={() => navigate('/catalogo/natal')}>
          <div className="split-card__shape" aria-hidden="true">
            <Boundary>
              <ShapeBlur variation={0} shapeSize={0.62} roundness={0.5} borderSize={0.045} circleSize={0.35} circleEdge={0.9} color="#c9a24a" pixelRatioProp={typeof window !== 'undefined' ? window.devicePixelRatio : 1} />
            </Boundary>
          </div>
          <div className="split-card__sticker" aria-hidden="true">
            <StickerPeel width={230} rotate={-8} peelBackHoverPct={26} peelDirection={-24} shadowIntensity={0.5} renderImage={() => <div style={{ width: 230, aspectRatio: '1 / 1', borderRadius: 18, overflow: 'hidden' }}><ProductMedia produto={natalProduct} /></div>} />
          </div>
          <div className="split-card__body">
            <span className="tag">Natal</span>
            <h3 className="split-card__title">Natal com <em className="h-serif">encanto</em></h3>
            <p className="lead">Vila natalina, colar de bolas e escapulário de porta: o clima de Natal que a sua família vai lembrar.</p>
            <span className="split-card__link">Explorar <FiArrowRight /></span>
          </div>
        </div>

        <div className="split-card split-card--design reveal cursor-target" onClick={() => navigate('/catalogo/mesa-posta')}>
          <div className="split-card__shape" aria-hidden="true">
            <Boundary>
              <ShapeBlur variation={2} shapeSize={0.7} roundness={0.5} borderSize={0.05} circleSize={0.4} circleEdge={1} color="#c9a24a" pixelRatioProp={typeof window !== 'undefined' ? window.devicePixelRatio : 1} />
            </Boundary>
          </div>
          <div className="split-card__sticker" aria-hidden="true">
            <StickerPeel width={230} rotate={9} peelBackHoverPct={26} peelDirection={20} shadowIntensity={0.5} renderImage={() => <div style={{ width: 230, aspectRatio: '1 / 1', borderRadius: 18, overflow: 'hidden' }}><ProductMedia produto={mesaProduct} /></div>} />
          </div>
          <div className="split-card__body">
            <span className="tag">Mesa Posta</span>
            <h3 className="split-card__title">Mesa posta com <em className="h-serif">requinte</em></h3>
            <p className="lead">Guardanapos, jogos americanos e caminho de mesa para receber bem, no Natal e no dia a dia.</p>
            <span className="split-card__link">Conferir <FiArrowRight /></span>
          </div>
        </div>
      </section>

      {/* ===================== FAIXA CTA ===================== */}
      <section className="section home-cta">
        <div className="container">
          <LiquidGlass className="home-cta__glass reveal" radius={30} blur={12}>
            <div className="home-cta__content">
              <p className="eyebrow" style={{ marginBottom: 20 }}>Pronto para o próximo passo?</p>
              <h2 className="h2" style={{ maxWidth: 620 }}>
                Monte seu carrinho e pague com <em className="h-serif">Pix</em> em segundos.
              </h2>
              <p className="lead" style={{ marginTop: 18 }}>
                Escolha seus produtos, envie o comprovante pelo site e nós preparamos o pedido.
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
