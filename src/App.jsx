import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingBag, FiMapPin, FiMail, FiLock } from 'react-icons/fi';

import Nav from './components/Nav';
import Footer from './components/Footer';
import Dock from './components/fx/Dock';
import TargetCursor from './components/fx/TargetCursor';
import MagicBento from './components/fx/MagicBento';
import Boundary from './components/fx/Boundary';
import { ToastProvider } from './components/Toast';

import Home from './pages/Home';
const Catalogo = lazy(() => import('./pages/Catalogo'));
const Produto = lazy(() => import('./pages/Produto'));
const Carrinho = lazy(() => import('./pages/Carrinho'));
const Contato = lazy(() => import('./pages/Contato'));
const Localizacao = lazy(() => import('./pages/Localizacao'));
const Equipe = lazy(() => import('./pages/Equipe'));

function Loader() {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <div className="rsf-spinner" />
    </div>
  );
}

function RouteError() {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ maxWidth: 460 }}>
        <h2 className="h2" style={{ marginBottom: 12 }}>Não foi possível carregar esta página</h2>
        <p className="muted" style={{ marginBottom: 22 }}>
          Tente recarregar. Se o problema continuar, pode ser uma limitação gráfica do aparelho.
        </p>
        <button className="btn btn-primary cursor-target" onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    </div>
  );
}

export default function App() {
  const loc = useLocation();
  const navigate = useNavigate();
  const hideChrome = false;
  const isLanding = loc.pathname === '/';

  const dockItems = [
    { icon: <FiHome size={18} />, label: 'Início', onClick: () => navigate('/'), active: loc.pathname === '/' },
    { icon: <FiGrid size={18} />, label: 'Catálogo', onClick: () => navigate('/catalogo'), active: loc.pathname.startsWith('/catalogo') || loc.pathname.startsWith('/produto') },
    { icon: <FiShoppingBag size={18} />, label: 'Carrinho', onClick: () => navigate('/carrinho'), active: loc.pathname === '/carrinho' },
    { icon: <FiMapPin size={18} />, label: 'Localização', onClick: () => navigate('/localizacao'), active: loc.pathname === '/localizacao' },
    { icon: <FiMail size={18} />, label: 'Contato', onClick: () => navigate('/contato'), active: loc.pathname === '/contato' },
    { icon: <FiLock size={18} />, label: 'Equipe', onClick: () => navigate('/equipe'), active: loc.pathname === '/equipe' }
  ];

  return (
    <ToastProvider>
      <div className="app-bg" aria-hidden="true">
        <div className="app-bg__grid" />
        <div className="app-bg__glow app-bg__glow--1" />
        <div className="app-bg__glow app-bg__glow--2" />
      </div>

      {/* Fundo interativo (MagicBento) nas áreas escuras — fora da landing page */}
      {!isLanding && (
        <div className="bento-bg-layer" aria-hidden="true">
          <Boundary>
            <MagicBento
              className="bento-bg"
              textAutoHide
              enableStars={false}
              enableSpotlight
              enableBorderGlow
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={false}
              spotlightRadius={340}
              glowColor="192, 102, 58"
            />
          </Boundary>
        </div>
      )}

      <Boundary>
        <TargetCursor targetSelector=".cursor-target" spinDuration={3} hideDefaultCursor parallaxOn />
      </Boundary>

      <Nav />

      <main key={loc.pathname} className="route-fade">
        <Boundary fallback={<RouteError />}>
          <Suspense fallback={<Loader />}>
            <Routes location={loc}>
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/catalogo/:tipo" element={<Catalogo />} />
              <Route path="/produto/:id" element={<Produto />} />
              <Route path="/carrinho" element={<Carrinho />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/localizacao" element={<Localizacao />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </Boundary>
      </main>

      {!hideChrome && <Footer />}

      <Dock items={dockItems} />
    </ToastProvider>
  );
}
