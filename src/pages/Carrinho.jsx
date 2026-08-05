import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  FiTrash2, FiArrowRight, FiArrowLeft, FiCopy, FiCheck, FiUploadCloud,
  FiShoppingBag, FiCreditCard, FiClock, FiExternalLink
} from 'react-icons/fi';
import LiquidGlass from '../components/fx/LiquidGlass';
import AnimatedTitle from '../components/AnimatedTitle';
import ProductMedia from '../components/ProductMedia';
import { useProducts, useCart, cartDetails, setCartQty, createOrder, LOJA } from '../lib/store';
import { buildPixPayload } from '../lib/pix';
import { brl } from '../lib/format';
import { useToast } from '../components/Toast';
import './Carrinho.css';

const STEPS = ['Sacola', 'Dados', 'Pagamento'];

export default function Carrinho() {
  const products = useProducts();
  const cart = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const { items, total, count } = useMemo(() => cartDetails(cart, products), [cart, products]);

  const [step, setStep] = useState(0);
  const [cliente, setCliente] = useState({ nome: '', telefone: '', entrega: 'retirada', endereco: '', obs: '' });
  const [comprovante, setComprovante] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, [step, pedido]);

  const txid = useMemo(() => 'RSF' + Date.now().toString(36).toUpperCase().slice(-6), [step === 2]);

  const pixPayload = useMemo(
    () =>
      buildPixPayload({
        chave: LOJA.pixChave,
        nome: LOJA.nome,
        cidade: LOJA.cidade,
        valor: total,
        txid
      }),
    [total, txid]
  );

  useEffect(() => {
    if (step === 2 && total > 0) {
      QRCode.toDataURL(pixPayload, { margin: 1, width: 320, color: { dark: '#17110d', light: '#f4f7ff' } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    }
  }, [step, pixPayload, total]);

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = pixPayload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    toast('Código Pix copiado!', 'ok');
    setTimeout(() => setCopied(false), 2200);
  };

  /* Reduz o print antes de enviar: comprovante de celular costuma ter vários
     MB e o que importa é a leitura, não a resolução. */
  const comprimirImagem = dataUrl =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        let { width, height } = img;
        const r = Math.min(1, max / Math.max(width, height));
        width = Math.round(width * r);
        height = Math.round(height * r);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  /* Teto do que o servidor aceita receber num pedido. Acima disso a própria
     hospedagem recusa o envio antes do nosso código rodar — e o cliente veria
     "pedido enviado" sem o pedido ter chegado na loja. Então cortamos aqui,
     com um recado que diz o que fazer. */
  const LIMITE_ENVIO = 4_000_000; // ~3 MB de arquivo depois de virar data URL

  const onFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ehImagem = file.type.startsWith('image/');
      const dados = ehImagem ? await comprimirImagem(reader.result) : reader.result;
      if (String(dados).length > LIMITE_ENVIO) {
        toast(
          ehImagem
            ? 'Essa imagem é pesada demais. Tire um print da tela do banco e envie ele.'
            : 'PDF pesado demais (máx. 3MB). Envie um print da tela do comprovante.',
          'danger'
        );
        if (fileRef.current) fileRef.current.value = '';
        return;
      }
      setComprovante({ name: file.name, type: ehImagem ? 'image/jpeg' : file.type, data: dados });
    };
    reader.readAsDataURL(file);
  };

  const goDados = () => {
    if (!count) return;
    setStep(1);
  };

  const goPagamento = () => {
    if (!cliente.nome.trim() || !cliente.telefone.trim()) {
      toast('Preencha nome e telefone.', 'danger');
      return;
    }
    if (cliente.entrega === 'entrega' && !cliente.endereco.trim()) {
      toast('Informe o endereço de entrega.', 'danger');
      return;
    }
    setStep(2);
  };

  const finalizar = async () => {
    if (!comprovante) {
      toast('Anexe o comprovante do Pix.', 'danger');
      return;
    }
    if (enviando) return;
    setEnviando(true);
    try {
      const order = await createOrder({
        cliente,
        itens: items.map(i => ({
          productId: i.productId,
          nome: i.produto.nome,
          tamanho: i.tamanho,
          qtd: i.qtd,
          preco: i.produto.preco
        })),
        total,
        comprovante
      });
      setPedido(order);
      toast('Pedido enviado! Aguardando confirmação.', 'ok');
    } catch (err) {
      toast((err && err.message) || 'Não foi possível enviar o pedido. Tente de novo.', 'danger');
    } finally {
      setEnviando(false);
    }
  };

  /* ---------- Confirmação ---------- */
  if (pedido) {
    return (
      <div className="carrinho carrinho--done">
        <div className="container">
          <LiquidGlass radius={30} className="done-card rise" blur={10}>
            <div className="done-card__inner">
              <span className="done-card__check"><FiCheck size={34} /></span>
              <h1 className="h2">Pedido <em className="h-serif">recebido</em>!</h1>
              <p className="lead" style={{ margin: '16px auto 0', textAlign: 'center' }}>
                Seu pedido <strong>#{pedido.id}</strong> foi registrado e está
                <span className="tag gold" style={{ margin: '0 6px' }}><FiClock size={11} /> Aguardando confirmação</span>
                do pagamento.
              </p>
              <p className="muted" style={{ textAlign: 'center', marginTop: 14, maxWidth: 460 }}>
                Assim que a loja confirmar o comprovante, o estoque é atualizado e
                seu pedido entra em preparação. Você pode acompanhar pelo WhatsApp.
              </p>
              <div className="done-card__actions">
                <a
                  className="btn btn-primary cursor-target"
                  href={`https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(`Olá! Acabei de enviar o pedido #${pedido.id} (${brl(pedido.total)}) e o comprovante do Pix.`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Avisar no WhatsApp <FiExternalLink />
                </a>
                <button className="btn btn-ghost cursor-target" onClick={() => navigate('/catalogo')}>
                  Continuar comprando
                </button>
              </div>
            </div>
          </LiquidGlass>
          <div className="page-end-space" />
        </div>
      </div>
    );
  }

  /* ---------- Carrinho vazio ---------- */
  if (!count) {
    return (
      <div className="carrinho">
        <div className="container carrinho__empty">
          <span className="carrinho__empty-ic"><FiShoppingBag size={30} /></span>
          <h1 className="h2">Sua sacola está <em className="h-serif">vazia</em></h1>
          <p className="lead" style={{ textAlign: 'center' }}>Que tal encontrar o par perfeito para começar?</p>
          <Link to="/catalogo" className="btn btn-primary cursor-target">Ver catálogo <FiArrowRight /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="carrinho">
      <div className="carrinho__ambient" aria-hidden="true" />
      <div className="container">
        <header className="carrinho__head">
          <AnimatedTitle className="display" style={{ fontSize: 'clamp(38px, 6vw, 76px)' }} pre="Sua" accent="sacola" post="." />
          <div className="carrinho__steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`carrinho__step ${i === step ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`}>
                <span>{i < step ? <FiCheck size={13} /> : i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </header>

        <div className="carrinho__layout">
          <div className="carrinho__main">
            {/* STEP 0 — itens */}
            {step === 0 && (
              <div className="carrinho__items">
                {items.map(i => (
                  <div key={`${i.productId}-${i.tamanho}`} className="citem">
                    <div className="citem__media" onClick={() => navigate(`/produto/${i.productId}`)}>
                      <ProductMedia produto={i.produto} />
                    </div>
                    <div className="citem__info">
                      <div className="citem__top">
                        <div>
                          <h3>{i.produto.nome}</h3>
                          <span className="muted">{i.produto.marca} · Tam. {i.tamanho}</span>
                        </div>
                        <button className="citem__del cursor-target" onClick={() => setCartQty(i.productId, i.tamanho, 0)} aria-label="Remover">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <div className="citem__bottom">
                        <div className="citem__qty">
                          <button className="cursor-target" onClick={() => setCartQty(i.productId, i.tamanho, Math.max(1, i.qtd - 1))}>−</button>
                          <span>{i.qtd}</span>
                          <button className="cursor-target" onClick={() => setCartQty(i.productId, i.tamanho, i.qtd + 1)}>+</button>
                        </div>
                        <strong>{brl(i.subtotal)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/catalogo" className="carrinho__continue cursor-target"><FiArrowLeft /> Continuar comprando</Link>
              </div>
            )}

            {/* STEP 1 — dados */}
            {step === 1 && (
              <div className="carrinho__form">
                <h2 className="carrinho__form-title">Seus dados</h2>
                <div className="carrinho__form-grid">
                  <div className="field">
                    <label>Nome completo</label>
                    <input value={cliente.nome} onChange={e => setCliente({ ...cliente, nome: e.target.value })} placeholder="Como devemos te chamar" />
                  </div>
                  <div className="field">
                    <label>Telefone / WhatsApp</label>
                    <input value={cliente.telefone} onChange={e => setCliente({ ...cliente, telefone: e.target.value })} placeholder="(62) 90000-0000" />
                  </div>
                </div>

                <div className="carrinho__delivery">
                  <button className={`carrinho__deliv cursor-target ${cliente.entrega === 'retirada' ? 'is-on' : ''}`} onClick={() => setCliente({ ...cliente, entrega: 'retirada' })}>
                    <strong>Retirar na loja</strong>
                    <span>Grátis · {LOJA.horario}</span>
                  </button>
                  <button className={`carrinho__deliv cursor-target ${cliente.entrega === 'entrega' ? 'is-on' : ''}`} onClick={() => setCliente({ ...cliente, entrega: 'entrega' })}>
                    <strong>Entrega em Goiânia</strong>
                    <span>Combinar frete no WhatsApp</span>
                  </button>
                </div>

                {cliente.entrega === 'entrega' && (
                  <div className="field" style={{ marginTop: 18 }}>
                    <label>Endereço de entrega</label>
                    <input value={cliente.endereco} onChange={e => setCliente({ ...cliente, endereco: e.target.value })} placeholder="Rua, número, bairro, complemento" />
                  </div>
                )}

                <div className="field" style={{ marginTop: 18 }}>
                  <label>Observações (opcional)</label>
                  <textarea rows={3} value={cliente.obs} onChange={e => setCliente({ ...cliente, obs: e.target.value })} placeholder="Alguma preferência ou recado?" />
                </div>
              </div>
            )}

            {/* STEP 2 — pagamento Pix */}
            {step === 2 && (
              <div className="carrinho__pix">
                <div className="pix-head">
                  <span className="pix-head__ic"><FiCreditCard /></span>
                  <div>
                    <h2 className="carrinho__form-title" style={{ margin: 0 }}>Pagamento via Pix</h2>
                    <p className="muted" style={{ fontSize: 13.5 }}>Escaneie o QR Code ou use o Pix copia e cola.</p>
                  </div>
                </div>

                <div className="pix-body">
                  <div className="pix-qr">
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR Code Pix" /> : <div className="pix-qr__load"><div className="rsf-spinner" /></div>}
                    <span className="pix-qr__value">{brl(total)}</span>
                  </div>

                  <div className="pix-details">
                    <div className="pix-detail">
                      <span className="muted">Recebedor</span>
                      <strong>{LOJA.nome}</strong>
                    </div>
                    <div className="pix-detail">
                      <span className="muted">Chave Pix (e-mail)</span>
                      <strong>{LOJA.pixChave}</strong>
                    </div>
                    <div className="pix-detail">
                      <span className="muted">Identificador</span>
                      <strong>{txid}</strong>
                    </div>

                    <button className="pix-copy cursor-target" onClick={copyPix}>
                      {copied ? <><FiCheck /> Copiado!</> : <><FiCopy /> Copiar código Pix</>}
                    </button>
                    <code className="pix-payload">{pixPayload}</code>
                  </div>
                </div>

                <div className="pix-upload">
                  <div className="pix-upload__head">
                    <strong>Anexe o comprovante</strong>
                    <span className="muted">Após pagar, envie o print/PDF para confirmarmos.</span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={onFile} />
                  {comprovante ? (
                    <div className="pix-file">
                      {comprovante.type.startsWith('image') ? (
                        <img src={comprovante.data} alt="Comprovante" />
                      ) : (
                        <span className="pix-file__pdf">PDF</span>
                      )}
                      <div className="pix-file__meta">
                        <FiCheck className="pix-file__ok" />
                        <span>{comprovante.name}</span>
                      </div>
                      <button className="cursor-target" onClick={() => { setComprovante(null); if (fileRef.current) fileRef.current.value = ''; }}>Trocar</button>
                    </div>
                  ) : (
                    <button className="pix-drop cursor-target" onClick={() => fileRef.current?.click()}>
                      <FiUploadCloud size={26} />
                      <strong>Clique para anexar</strong>
                      <span className="muted">PNG, JPG ou PDF · até 3MB</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resumo */}
          <aside className="carrinho__aside">
            <LiquidGlass radius={24} className="resumo" blur={8}>
              <div className="resumo__inner">
                <h3>Resumo</h3>
                <div className="resumo__row"><span>{count} {count === 1 ? 'item' : 'itens'}</span><span>{brl(total)}</span></div>
                <div className="resumo__row"><span>Frete</span><span className="muted">a combinar</span></div>
                <hr className="hairline" style={{ marginBlock: 16 }} />
                <div className="resumo__total"><span>Total</span><strong>{brl(total)}</strong></div>

                {step === 0 && <button className="btn btn-primary resumo__btn cursor-target" onClick={goDados}>Continuar <FiArrowRight /></button>}
                {step === 1 && (
                  <>
                    <button className="btn btn-primary resumo__btn cursor-target" onClick={goPagamento}>Ir para o pagamento <FiArrowRight /></button>
                    <button className="btn btn-ghost resumo__btn cursor-target" onClick={() => setStep(0)}>Voltar</button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <button className="btn btn-primary resumo__btn cursor-target" onClick={finalizar} disabled={enviando}>
                      {enviando ? 'Enviando…' : <>Enviar pedido <FiCheck /></>}
                    </button>
                    <button className="btn btn-ghost resumo__btn cursor-target" onClick={() => setStep(1)} disabled={enviando}>Voltar</button>
                  </>
                )}

                <p className="resumo__safe"><FiCheck size={12} /> Pagamento Pix · confirmação manual pela loja</p>
              </div>
            </LiquidGlass>
          </aside>
        </div>

        <div className="page-end-space" />
      </div>
    </div>
  );
}
