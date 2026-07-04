import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';
import Logo from './Logo';
import { useCart } from '../lib/store';
import './Nav.css';

const LINKS = [
  { to: '/', label: 'Início' },
  { to: '/catalogo', label: 'Catálogo' },
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
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav__link cursor-target ${loc.pathname === l.to ? 'is-active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav__actions">
          <button
            className="nav__cart cursor-target"
            onClick={() => navigate('/carrinho')}
            aria-label="Carrinho"
          >
            <FiShoppingBag size={19} />
            {count > 0 && <span className="nav__cart-badge">{count}</span>}
          </button>
          <button className="nav__burger cursor-target" onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      <div className={`nav__mobile ${open ? 'is-open' : ''}`}>
        {LINKS.map(l => (
          <Link key={l.to} to={l.to} className={`nav__mobile-link ${loc.pathname === l.to ? 'is-active' : ''}`}>
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
