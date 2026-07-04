import { Link } from 'react-router-dom';
import { FiInstagram, FiPhone, FiMapPin, FiMail } from 'react-icons/fi';
import Logo from './Logo';
import { LOJA } from '../lib/store';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo />
            <p className="lead" style={{ marginTop: 20, fontSize: 15 }}>
              Calçados que unem conforto e elegância para o seu dia a dia — selecionados a dedo, com o preço justo.
            </p>
            <div className="footer__social">
              <a className="footer__ic cursor-target" href="#" aria-label="Instagram"><FiInstagram /></a>
              <a className="footer__ic cursor-target" href={`https://wa.me/${LOJA.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><FiPhone /></a>
              <a className="footer__ic cursor-target" href={`mailto:${LOJA.email}`} aria-label="E-mail"><FiMail /></a>
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
              <FiPhone size={13} /> {LOJA.pixTelefone}
            </a>
            <a href={`mailto:${LOJA.email}`}><FiMail size={13} /> {LOJA.email}</a>
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
