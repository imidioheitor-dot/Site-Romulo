import { useEffect } from 'react';
import { FiMapPin, FiClock, FiPhone, FiNavigation, FiExternalLink } from 'react-icons/fi';
import LiquidGlass from '../components/fx/LiquidGlass';
import AnimatedTitle from '../components/AnimatedTitle';
import { LOJA } from '../lib/store';
import { useReveal } from '../lib/useReveal';
import './Localizacao.css';

const mapsQuery = encodeURIComponent(LOJA.enderecoMapa);

export default function Localizacao() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useReveal([]);

  return (
    <div className="local">
      <section className="container local__head">
        <p className="eyebrow rise" style={{ marginBottom: 20 }}>Onde nos encontrar</p>
        <AnimatedTitle className="display rise rise-1" pre="Venha nos" accent="visitar" post="." />
        <p className="lead rise rise-2" style={{ marginTop: 18 }}>
          Venha conhecer a Mikka Home no Setor Campinas, em Goiânia. Toque nos tecidos,
          escolha com calma e leve o Natal para casa.
        </p>
      </section>

      <section className="container local__layout">
        <LiquidGlass radius={26} className="local__map-glass reveal" blur={4}>
          <div className="local__map">
            <iframe
              title="Mapa da loja"
              loading="lazy"
              src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </LiquidGlass>

        <div className="local__side">
          <div className="local__info reveal">
            <span className="local__ic"><FiMapPin /></span>
            <div>
              <strong>Endereço</strong>
              <p>{LOJA.endereco}</p>
            </div>
          </div>
          <div className="local__info reveal">
            <span className="local__ic"><FiClock /></span>
            <div>
              <strong>Horário de funcionamento</strong>
              <p>{LOJA.horario}</p>
              
            </div>
          </div>
          <div className="local__info reveal">
            <span className="local__ic"><FiPhone /></span>
            <div>
              <strong>WhatsApp</strong>
              <p>{LOJA.vendedora}: {LOJA.telefone}</p>
              <p>{LOJA.dono}: {LOJA.telefoneDono}</p>
            </div>
          </div>

          <a
            className="btn btn-primary cursor-target"
            href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            style={{ width: '100%', marginTop: 6 }}
          >
            Como chegar <FiNavigation />
          </a>
          <a
            className="btn btn-ghost cursor-target"
            href={`https://wa.me/${LOJA.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            style={{ width: '100%' }}
          >
            Chamar a Elvira no WhatsApp <FiExternalLink />
          </a>
        </div>
      </section>

      <div className="page-end-space" />
    </div>
  );
}
