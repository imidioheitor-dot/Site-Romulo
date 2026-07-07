import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import Logo from './Logo';
import { useCart, CATEGORIAS } from '../lib/store';
import './Nav.css';

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const LINKS = [
  { to: '/', label: 'Início' },
  { to: '/catalogo', label: 'Catálogo', categorias: true },
  { to: '/contato', label: 'Contato' },
  { to: '/localizacao', label: 'Localização' },
  { to: '/equipe', label: 'Equipe' }
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const cart = useCart();
  const count = cart.reduce((s, i) => s + i.qtd, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner container">
        <Link to="/" className="nav__logo cursor-target" aria-label="Início">
          <Logo />
        </Link>

        <nav className="nav__links">
          {LINKS.map(l =>
            l.categorias ? (
              <div className="nav__dropdown" key={l.to}>
                <Link
                  to={l.to}
                  className={`nav__link cursor-target ${loc.pathname.startsWith('/catalogo') ? 'is-active' : ''}`}
                >
                  {l.label} <FiChevronDown size={13} />
                </Link>
                <div className="nav__menu">
                  <Link to="/catalogo" className="nav__menu-link">Ver tudo</Link>
                  {CATEGORIAS.map(c => (
                    <Link key={c} to={`/catalogo/${slug(c)}`} className="nav__menu-link">{c}</Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className={`nav__link cursor-target ${loc.pathname === l.to ? 'is-active' : ''}`}
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="nav__actions">
          <button className="nav__cart cursor-target" onClick={() => navigate('/carrinho')} aria-label="Carrinho">
            <FiShoppingBag size={19} />
            {count > 0 && <span className="nav__cart-badge">{count}</span>}
          </button>
          <button className="nav__burger cursor-target" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      <div className={`nav__mobile ${open ? 'is-open' : ''}`}>
        <Link to="/" className={`nav__mobile-link ${loc.pathname === '/' ? 'is-active' : ''}`}>Início</Link>
        <span className="nav__mobile-heading">Categorias</span>
        <Link to="/catalogo" className="nav__mobile-link nav__mobile-sub">Ver tudo</Link>
        {CATEGORIAS.map(c => (
          <Link key={c} to={`/catalogo/${slug(c)}`} className="nav__mobile-link nav__mobile-sub">{c}</Link>
        ))}
        <Link to="/contato" className={`nav__mobile-link ${loc.pathname === '/contato' ? 'is-active' : ''}`}>Contato</Link>
        <Link to="/localizacao" className={`nav__mobile-link ${loc.pathname === '/localizacao' ? 'is-active' : ''}`}>Localização</Link>
        <Link to="/equipe" className={`nav__mobile-link ${loc.pathname === '/equipe' ? 'is-active' : ''}`}>Equipe</Link>
      </div>
    </header>
  );
}
