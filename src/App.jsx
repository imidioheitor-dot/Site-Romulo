import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingBag, FiMapPin, FiMail, FiLock } from 'react-icons/fi';

import Nav from './components/Nav';
import Footer from './components/Footer';
import Dock from './components/fx/Dock';
import TargetCursor from './components/fx/TargetCursor';
import MagicBento from './components/fx/MagicBento';
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
            glowColor="61, 123, 255"
          />
        </div>
      )}

      <TargetCursor targetSelector=".cursor-target" spinDuration={3} hideDefaultCursor parallaxOn />

      <Nav />

      <main key={loc.pathname} className="route-fade">
        <Suspense fallback={<Loader />}>
          <Routes location={loc}>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/produto/:id" element={<Produto />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/localizacao" element={<Localizacao />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>

      {!hideChrome && <Footer />}

      <Dock items={dockItems} />
    </ToastProvider>
  );
}
