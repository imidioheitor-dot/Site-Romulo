import { useState, useEffect } from 'react';
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend, FiExternalLink } from 'react-icons/fi';
import LiquidGlass from '../components/fx/LiquidGlass';
import AnimatedTitle from '../components/AnimatedTitle';
import { LOJA } from '../lib/store';
import { useToast } from '../components/Toast';
import { useReveal } from '../lib/useReveal';
import './Contato.css';

export default function Contato() {
  const toast = useToast();
  const [form, setForm] = useState({ nome: '', contato: '', assunto: 'Dúvida sobre produto', msg: '' });

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useReveal([]);

  const enviar = e => {
    e.preventDefault();
    if (!form.nome.trim() || !form.msg.trim()) {
      toast('Preencha nome e mensagem.', 'danger');
      return;
    }
    const texto = `Olá! Meu nome é ${form.nome}.%0AAssunto: ${form.assunto}%0A%0A${form.msg}${form.contato ? `%0A%0AContato: ${form.contato}` : ''}`;
    window.open(`https://wa.me/${LOJA.whatsapp}?text=${texto}`, '_blank');
    toast('Redirecionando para o WhatsApp…', 'ok');
  };

  return (
    <div className="contato">
      <section className="container contato__head">
        <p className="eyebrow rise" style={{ marginBottom: 20 }}>Fale com a gente</p>
        <AnimatedTitle className="display rise rise-1" pre="Vamos" accent="conversar" post="?" />
        <p className="lead rise rise-2" style={{ marginTop: 18 }}>
          Dúvidas sobre cores, disponibilidade ou seu pedido? A Elvira atende você
          pelo WhatsApp, ou envie uma mensagem aqui.
        </p>
      </section>

      <section className="container contato__layout">
        <div className="contato__cards">
          <a className="contato__card reveal cursor-target" href={`https://wa.me/${LOJA.whatsapp}`} target="_blank" rel="noreferrer">
            <span className="contato__ic"><FiPhone /></span>
            <div>
              <strong>WhatsApp · {LOJA.vendedora} (vendas)</strong>
              <span>{LOJA.telefone}</span>
            </div>
            <FiExternalLink className="contato__go" />
          </a>
          <a className="contato__card reveal cursor-target" href={`https://wa.me/${LOJA.whatsappDono}`} target="_blank" rel="noreferrer">
            <span className="contato__ic"><FiPhone /></span>
            <div>
              <strong>WhatsApp · {LOJA.dono} (proprietário)</strong>
              <span>{LOJA.telefoneDono}</span>
            </div>
            <FiExternalLink className="contato__go" />
          </a>
          <div className="contato__card reveal">
            <span className="contato__ic"><FiMapPin /></span>
            <div>
              <strong>Endereço</strong>
              <span>{LOJA.endereco}</span>
            </div>
          </div>
          <div className="contato__card reveal">
            <span className="contato__ic"><FiClock /></span>
            <div>
              <strong>Horário</strong>
              <span>{LOJA.horario}</span>
            </div>
          </div>
        </div>

        <LiquidGlass radius={26} className="contato__form-glass reveal" blur={9}>
          <form className="contato__form" onSubmit={enviar}>
            <h2>Envie uma mensagem</h2>
            <div className="field">
              <label>Nome</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" />
            </div>
            <div className="field">
              <label>Telefone ou e-mail</label>
              <input value={form.contato} onChange={e => setForm({ ...form, contato: e.target.value })} placeholder="Para retornarmos" />
            </div>
            <div className="field">
              <label>Assunto</label>
              <select value={form.assunto} onChange={e => setForm({ ...form, assunto: e.target.value })} className="cursor-target">
                <option>Dúvida sobre produto</option>
                <option>Disponibilidade / cores</option>
                <option>Meu pedido</option>
                <option>Entrega ou retirada</option>
                <option>Outro assunto</option>
              </select>
            </div>
            <div className="field">
              <label>Mensagem</label>
              <textarea rows={4} value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} placeholder="Como podemos ajudar?" />
            </div>
            <button type="submit" className="btn btn-primary cursor-target" style={{ width: '100%' }}>
              Enviar pelo WhatsApp <FiSend />
            </button>
          </form>
        </LiquidGlass>
      </section>

      <div className="page-end-space" />
    </div>
  );
}
