import { Link } from 'react-router-dom';
import { FiPhone, FiMapPin } from 'react-icons/fi';
import { LOJA } from '../lib/store';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <img className="footer__logo" src={`${import.meta.env.BASE_URL}brand/logo-mikka.jpg`} alt="Mikka Home — Da nossa casa para seu lar!" />
            <p className="lead" style={{ marginTop: 20, fontSize: 15 }}>
              Da nossa casa para seu lar! Decoração natalina, mesa posta e almofadas com elegância e preço justo.
            </p>
            <div className="footer__social">
              <a className="footer__ic cursor-target" href={`https://wa.me/${LOJA.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><FiPhone /></a>
            </div>
          </div>

          <div className="footer__col">
            <h4>Navegar</h4>
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/carrinho">Carrinho</Link>
            <Link to="/contato">Contato</Link>
            <Link to="/localizacao">Localização</Link>
            <Link to="/equipe">Área da equipe</Link>
          </div>

          <div className="footer__col">
            <h4>Atendimento</h4>
            <a href={`https://wa.me/${LOJA.whatsapp}`} target="_blank" rel="noreferrer">
              <FiPhone size={13} /> {LOJA.vendedora}: {LOJA.telefone}
            </a>
            <a href={`https://wa.me/${LOJA.whatsappDono}`} target="_blank" rel="noreferrer">
              <FiPhone size={13} /> {LOJA.dono}: {LOJA.telefoneDono}
            </a>
            <span className="footer__addr"><FiMapPin size={13} /> {LOJA.endereco}</span>
            <span className="muted" style={{ fontSize: 12 }}>{LOJA.horario}</span>
          </div>
        </div>

        <hr className="hairline" style={{ marginBlock: 34 }} />

        <div className="footer__bottom">
          <span className="muted">© {new Date().getFullYear()} {LOJA.nome}. Todos os direitos reservados.</span>
          <span className="muted">Pagamentos via Pix · {LOJA.cidade}</span>
        </div>
      </div>
    </footer>
  );
}
