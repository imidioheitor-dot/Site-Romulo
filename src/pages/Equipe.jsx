import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiLock, FiLogOut, FiPackage, FiBox, FiSettings, FiCheck, FiX, FiTruck,
  FiClock, FiPlus, FiMinus, FiEdit2, FiTrash2, FiEye, FiSave, FiSearch, FiExternalLink, FiUpload, FiDownload,
  FiCloud, FiCloudOff, FiRefreshCw, FiUploadCloud, FiAlertTriangle
} from 'react-icons/fi';
import LiquidGlass from '../components/fx/LiquidGlass';
import AnimatedTitle from '../components/AnimatedTitle';
import ProductMedia from '../components/ProductMedia';
import {
  useSession, login, logout, changePassword,
  useOrders, updateOrderStatus, ORDER_STATUS, obterComprovante,
  useProducts, saveProduct, deleteProduct, adjustStock, LOJA, CATEGORIAS,
  exportCatalog, importCatalog, isStoragePersistent,
  useBackend, sincronizarCatalogo, sincronizarPedidos, publicarCatalogoAtual
} from '../lib/store';
import { brl, dataBR } from '../lib/format';
import { useToast } from '../components/Toast';
import './Equipe.css';

export default function Equipe() {
  const session = useSession();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return session ? <Painel /> : <Login />;
}

/* ---------------- LOGIN ---------------- */
function Login() {
  const [pass, setPass] = useState('');
  const [erro, setErro] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const toast = useToast();

  const entrar = async e => {
    e.preventDefault();
    if (entrando) return;
    setEntrando(true);
    try {
      if (await login(pass)) {
        toast('Bem-vindo à área da equipe.', 'ok');
      } else {
        setErro(true);
        toast('Senha incorreta.', 'danger');
        setTimeout(() => setErro(false), 600);
      }
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="equipe equipe--login">
      <div className="container">
        <LiquidGlass radius={28} className={`login-card rise ${erro ? 'shake' : ''}`} blur={10}>
          <form className="login-card__inner" onSubmit={entrar}>
            <span className="login-card__ic"><FiLock size={24} /></span>
            <h1 className="h2" style={{ fontSize: 30 }}>Área da <em className="h-serif">equipe</em></h1>
            <p className="muted" style={{ textAlign: 'center', marginBottom: 8 }}>
              Acesso restrito para gestão de estoque e pedidos.
            </p>
            <div className="field" style={{ width: '100%' }}>
              <label>Senha</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" autoFocus />
            </div>
            <button type="submit" className="btn btn-primary cursor-target" style={{ width: '100%' }} disabled={entrando}>
              {entrando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </LiquidGlass>
        <div className="page-end-space" />
      </div>
    </div>
  );
}

/* ---------------- PAINEL ---------------- */
const STATUS_META = {
  [ORDER_STATUS.AGUARDANDO]: { label: 'Aguardando', cls: 'gold', icon: <FiClock size={11} /> },
  [ORDER_STATUS.PAGO]: { label: 'Pago · Preparando', cls: 'ok', icon: <FiCheck size={11} /> },
  [ORDER_STATUS.ENVIADO]: { label: 'Enviado', cls: 'ok', icon: <FiTruck size={11} /> },
  [ORDER_STATUS.CANCELADO]: { label: 'Cancelado', cls: 'danger', icon: <FiX size={11} /> }
};

function Painel() {
  const [tab, setTab] = useState('pedidos');
  const toast = useToast();

  const tabs = [
    { id: 'pedidos', label: 'Pedidos', icon: <FiPackage /> },
    { id: 'estoque', label: 'Estoque', icon: <FiBox /> },
    { id: 'config', label: 'Configurações', icon: <FiSettings /> }
  ];

  return (
    <div className="equipe">
      <div className="container">
        <header className="painel__head">
          <div>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Painel da equipe</p>
            <AnimatedTitle className="display" style={{ fontSize: 'clamp(34px, 5vw, 62px)' }} pre="Gestão da" accent="loja" post="." />
          </div>
          <button className="btn btn-danger cursor-target" onClick={() => { logout(); toast('Sessão encerrada.', 'info'); }}>
            <FiLogOut /> Sair
          </button>
        </header>

        <BackendBar />

        <nav className="painel__tabs">
          {tabs.map(t => (
            <button key={t.id} className={`painel__tab cursor-target ${tab === t.id ? 'is-on' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {tab === 'pedidos' && <Pedidos />}
        {tab === 'estoque' && <Estoque />}
        {tab === 'config' && <Config />}

        <div className="page-end-space" />
      </div>
    </div>
  );
}

/* ---------------- ESTADO DO SERVIDOR COMPARTILHADO ---------------- */
function BackendBar() {
  const backend = useBackend();
  const sessao = useSession();
  const toast = useToast();
  const [ocupado, setOcupado] = useState(false);

  const online = backend.estado === 'online';
  const senhaFraca = online && sessao && sessao.senhaFraca;

  const atualizar = async () => {
    setOcupado(true);
    await sincronizarCatalogo({ forcar: true });
    await sincronizarPedidos({ forcar: true });
    setOcupado(false);
    toast('Dados atualizados.', 'ok');
  };

  const publicar = async () => {
    setOcupado(true);
    const r = await publicarCatalogoAtual();
    setOcupado(false);
    if (r.ok && r.remoto) toast('Catálogo publicado no servidor da loja.', 'ok');
    else toast((r.erro && r.erro.message) || 'Não foi possível publicar agora.', 'danger');
  };

  return (
    <>
    {senhaFraca && (
      <div className="senha-alerta">
        <FiAlertTriangle />
        <div>
          <strong>Troque a senha da equipe.</strong>{' '}
          A senha em uso ainda é a de fábrica, que está no histórico público do
          projeto — e é ela que autoriza mexer no estoque e nos pedidos.
          Vá em <strong>Configurações</strong> e escolha uma nova.
        </div>
      </div>
    )}
    <div className={`backend-bar ${online ? 'is-on' : 'is-off'}`}>
      <span className="backend-bar__ic">{online ? <FiCloud /> : <FiCloudOff />}</span>
      <div className="backend-bar__txt">
        {online ? (
          <>
            <strong>Servidor compartilhado ligado</strong>
            <span className="muted">
              Estoque e pedidos valem para todos os aparelhos
              {backend.rev != null && ` · versão ${backend.rev}`}
              {!backend.publicado && ' · catálogo ainda não publicado'}
            </span>
          </>
        ) : (
          <>
            <strong>Modo local</strong>
            <span className="muted">
              Sem servidor: as alterações valem só neste aparelho. Publique o site
              na Netlify para compartilhar estoque e pedidos.
            </span>
          </>
        )}
      </div>
      {online && (
        <div className="backend-bar__actions">
          <button className="btn btn-quiet btn-sm cursor-target" onClick={atualizar} disabled={ocupado}>
            <FiRefreshCw /> Atualizar
          </button>
          <button className="btn btn-quiet btn-sm cursor-target" onClick={publicar} disabled={ocupado}>
            <FiUploadCloud /> Publicar catálogo
          </button>
        </div>
      )}
    </div>
    </>
  );
}

/* ---------------- PEDIDOS ---------------- */
function Pedidos() {
  const orders = useOrders();
  const toast = useToast();
  const [filtro, setFiltro] = useState('todos');
  const [ver, setVer] = useState(null);

  const stats = useMemo(() => {
    const aguardando = orders.filter(o => o.status === ORDER_STATUS.AGUARDANDO).length;
    const pagos = orders.filter(o => o.status === ORDER_STATUS.PAGO).length;
    const receita = orders.filter(o => o.status !== ORDER_STATUS.CANCELADO).reduce((s, o) => s + o.total, 0);
    return { aguardando, pagos, receita, total: orders.length };
  }, [orders]);

  const lista = filtro === 'todos' ? orders : orders.filter(o => o.status === filtro);

  const mudarStatus = async (o, status, mensagem) => {
    const r = await updateOrderStatus(o.id, status);
    if (r && r.ok) toast(mensagem, 'ok');
    else toast((r && r.erro && r.erro.message) || 'Não foi possível atualizar o pedido.', 'danger');
  };

  const confirmar = o => mudarStatus(o, ORDER_STATUS.PAGO, `Pedido #${o.id} confirmado. Estoque atualizado.`);

  // o comprovante fica guardado à parte no servidor: busca só ao abrir
  const abrirComprovante = async o => {
    setVer({ pedido: o, comprovante: o.comprovante || null, carregando: !o.comprovante });
    if (o.comprovante) return;
    try {
      const c = await obterComprovante(o.id);
      setVer(v => (v && v.pedido.id === o.id ? { ...v, comprovante: c, carregando: false } : v));
    } catch {
      setVer(v => (v && v.pedido.id === o.id ? { ...v, carregando: false, erro: true } : v));
    }
  };

  return (
    <div className="pedidos">
      <div className="painel__stats">
        <Stat label="Pedidos" value={stats.total} />
        <Stat label="Aguardando" value={stats.aguardando} tone="gold" />
        <Stat label="Em preparo" value={stats.pagos} tone="ok" />
        <Stat label="Receita" value={brl(stats.receita)} />
      </div>

      <div className="pedidos__filters">
        {['todos', ORDER_STATUS.AGUARDANDO, ORDER_STATUS.PAGO, ORDER_STATUS.ENVIADO, ORDER_STATUS.CANCELADO].map(f => (
          <button key={f} className={`catalogo__chip cursor-target ${filtro === f ? 'is-on' : ''}`} onClick={() => setFiltro(f)}>
            {f === 'todos' ? 'Todos' : STATUS_META[f].label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="painel__empty">Nenhum pedido {filtro !== 'todos' ? 'com esse status' : 'ainda'}.</div>
      ) : (
        <div className="pedidos__list">
          {lista.map(o => {
            const meta = STATUS_META[o.status];
            return (
              <div key={o.id} className="pedido">
                <div className="pedido__main">
                  <div className="pedido__id">
                    <strong>#{o.id}</strong>
                    <span className={`tag ${meta.cls}`}>{meta.icon} {meta.label}</span>
                  </div>
                  <div className="pedido__cliente">
                    <span>{o.cliente.nome}</span>
                    <span className="muted">{o.cliente.telefone} · {o.cliente.entrega === 'entrega' ? 'Entrega' : 'Retirada'}</span>
                  </div>
                  <div className="pedido__meta">
                    <span className="muted">{dataBR(o.criadoEm)}</span>
                    <strong>{brl(o.total)}</strong>
                  </div>
                </div>

                <div className="pedido__itens">
                  {o.itens.map((it, i) => (
                    <span key={i} className="pedido__item">{it.qtd}× {it.nome} <em>({it.tamanho})</em></span>
                  ))}
                </div>

                <div className="pedido__actions">
                  {(o.comprovante || o.temComprovante) && (
                    <button className="btn btn-quiet btn-sm cursor-target" onClick={() => abrirComprovante(o)}>
                      <FiEye /> Comprovante
                    </button>
                  )}
                  <a
                    className="btn btn-quiet btn-sm cursor-target"
                    href={`https://wa.me/${(o.cliente.telefone || '').replace(/\D/g, '') || LOJA.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FiExternalLink /> Cliente
                  </a>
                  {o.status === ORDER_STATUS.AGUARDANDO && (
                    <>
                      <button className="btn btn-primary btn-sm cursor-target" onClick={() => confirmar(o)}><FiCheck /> Confirmar venda</button>
                      <button className="btn btn-danger btn-sm cursor-target" onClick={() => mudarStatus(o, ORDER_STATUS.CANCELADO, 'Pedido cancelado.')}><FiX /></button>
                    </>
                  )}
                  {o.status === ORDER_STATUS.PAGO && (
                    <button className="btn btn-primary btn-sm cursor-target" onClick={() => mudarStatus(o, ORDER_STATUS.ENVIADO, 'Marcado como enviado.')}><FiTruck /> Marcar enviado</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ver && (
        <div className="modal" onClick={() => setVer(null)}>
          <div className="modal__box" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <strong>Comprovante · #{ver.pedido.id}</strong>
              <button className="cursor-target" onClick={() => setVer(null)}><FiX size={18} /></button>
            </div>
            {ver.carregando && <div className="painel__empty">Carregando comprovante…</div>}
            {!ver.carregando && !ver.comprovante && (
              <div className="painel__empty">Não foi possível carregar o comprovante deste pedido.</div>
            )}
            {!ver.carregando && ver.comprovante && (
              ver.comprovante.type?.startsWith('image') ? (
                <img src={ver.comprovante.data} alt="Comprovante" />
              ) : (
                <a className="btn btn-quiet cursor-target" href={ver.comprovante.data} download={ver.comprovante.name}>
                  Baixar {ver.comprovante.name}
                </a>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat stat--${tone || 'base'}`}>
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
    </div>
  );
}

/* ---------------- ESTOQUE ---------------- */
const EMPTY = {
  nome: '', marca: '', tipo: 'Tênis', categoria: '', genero: 'Unissex', preco: '', precoAntigo: '',
  descricao: '', estoque: 0, tamanhos: '38,39,40,41,42', tag: '',
  cores: '#e9eef6,#c0663a', img: '',
  colorway: { base: '#e9eef6', mesh: '#f4f7fd', stripe: '#c0663a', sole: '#f6f4ee', accent: '#8a4526', lace: '#ffffff' }
};

function Estoque() {
  const products = useProducts();
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);
  const importRef = useRef(null);

  const lista = products.filter(p => (p.nome || '').toLowerCase().includes(busca.toLowerCase()) || (p.marca || '').toLowerCase().includes(busca.toLowerCase()));

  const totalPares = products.reduce((s, p) => s + (Number(p.estoque) || 0), 0);
  const semEstoque = products.filter(p => p.estoque <= 0).length;

  const baixarCatalogo = () => {
    const blob = new Blob([exportCatalog()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casa-mikka-catalogo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Catálogo baixado. Guarde este arquivo.', 'ok');
  };

  const carregarCatalogo = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const { total, sync } = await importCatalog(ev.target.result);
        toast(`Catálogo carregado — ${total} produtos.`, 'ok');
        avisarSync(sync);
      } catch (err) {
        toast('Arquivo inválido. Selecione um catálogo exportado aqui.', 'danger');
      }
    };
    reader.readAsText(file);
  };

  /* As alterações valem na hora no aparelho; se o envio ao servidor falhar,
     o lojista precisa saber que ainda não está compartilhado. */
  const avisarSync = sync => {
    if (sync && sync.ok === false && sync.erro && !sync.erro.offline) {
      toast(sync.erro.message || 'Salvo neste aparelho, mas não no servidor.', 'danger');
    }
  };

  return (
    <div className="estoque">
      <div className="painel__stats">
        <Stat label="Modelos" value={products.length} />
        <Stat label="Pares em estoque" value={totalPares} />
        <Stat label="Esgotados" value={semEstoque} tone={semEstoque ? 'danger' : 'base'} />
      </div>

      {!isStoragePersistent() && (
        <div className="estoque__warn">
          ⚠️ Este navegador não está salvando as alterações de forma permanente
          (comum ao abrir o arquivo direto no celular ou em aba anônima). Use
          <strong> Baixar catálogo</strong> para guardar o que você adicionar, ou
          publique o site para salvar automaticamente.
        </div>
      )}

      <div className="estoque__toolbar">
        <div className="catalogo__search cursor-target" style={{ maxWidth: 340 }}>
          <FiSearch />
          <input placeholder="Buscar produto…" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <div className="estoque__toolbar-actions">
          <button className="btn btn-ghost cursor-target" onClick={baixarCatalogo} title="Salva todos os produtos e fotos num arquivo"><FiDownload /> Baixar catálogo</button>
          <button className="btn btn-ghost cursor-target" onClick={() => importRef.current && importRef.current.click()} title="Recarrega um catálogo salvo"><FiUpload /> Carregar catálogo</button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e => { carregarCatalogo(e.target.files && e.target.files[0]); e.target.value = ''; }} />
          <button className="btn btn-primary cursor-target" onClick={() => setEditando({ ...EMPTY })}><FiPlus /> Novo produto</button>
        </div>
      </div>

      <div className="estoque__list">
        {lista.map(p => (
          <div key={p.id} className="erow">
            <div className="erow__media"><ProductMedia produto={p} /></div>
            <div className="erow__info">
              <strong>{p.nome}</strong>
              <span className="muted">{p.marca} · {p.categoria} · {brl(p.preco)}</span>
            </div>
            <div className="erow__stock">
              <button className="cursor-target" onClick={() => adjustStock(p.id, -1).then(avisarSync)} aria-label="Diminuir"><FiMinus /></button>
              <span className={p.estoque <= 0 ? 'is-zero' : ''}>{p.estoque}</span>
              <button className="cursor-target" onClick={() => adjustStock(p.id, 1).then(avisarSync)} aria-label="Aumentar"><FiPlus /></button>
            </div>
            <div className="erow__actions">
              <button className="erow__btn cursor-target" onClick={() => setEditando({ ...p, tamanhos: (p.tamanhos || []).join(','), cores: (p.cores || []).join(','), precoAntigo: p.precoAntigo || '' })} aria-label="Editar"><FiEdit2 /></button>
              <button className="erow__btn erow__btn--del cursor-target" onClick={async () => { if (confirm(`Excluir ${p.nome}?`)) { avisarSync(await deleteProduct(p.id)); toast('Produto removido.', 'info'); } }} aria-label="Excluir"><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <ProdutoForm
          produto={editando}
          onClose={() => setEditando(null)}
          onSaved={sync => { setEditando(null); toast('Produto salvo.', 'ok'); avisarSync(sync); }}
        />
      )}
    </div>
  );
}

function ProdutoForm({ produto, onClose, onSaved }) {
  const [f, setF] = useState(produto);
  const [salvando, setSalvando] = useState(false);

  // esconde o dock enquanto o formulário está aberto (evita cobrir os botões)
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const setCw = (k, v) => setF(prev => ({ ...prev, colorway: { ...prev.colorway, [k]: v } }));

  // envia foto do computador/celular: redimensiona e guarda embutida no produto
  const onPickFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        let { width, height } = img;
        const r = Math.min(1, max / Math.max(width, height));
        width = Math.round(width * r);
        height = Math.round(height * r);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        set('img', canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const previewSrc = f.img
    ? (/^(data:|https?:|blob:)/.test(f.img) ? f.img : `${import.meta.env.BASE_URL}products/${f.img}`)
    : null;

  const salvar = async e => {
    e.preventDefault();
    if (salvando) return;
    const payload = {
      ...f,
      preco: parseFloat(f.preco) || 0,
      precoAntigo: f.precoAntigo ? parseFloat(f.precoAntigo) : null,
      estoque: parseInt(f.estoque, 10) || 0,
      tamanhos: String(f.tamanhos).split(',').map(t => t.trim()).filter(Boolean).map(t => (/^\d+$/.test(t) ? parseInt(t, 10) : t)),
      cores: String(f.cores).split(',').map(c => c.trim()).filter(Boolean),
      tag: f.tag || null,
      destaque: !!f.destaque
    };
    setSalvando(true);
    const sync = await saveProduct(payload);
    setSalvando(false);
    onSaved(sync);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box modal__box--wide" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <strong>{produto.id ? 'Editar produto' : 'Novo produto'}</strong>
          <button className="cursor-target" onClick={onClose}><FiX size={18} /></button>
        </div>
        <form className="pform" onSubmit={salvar}>
          <div className="pform__grid">
            <div className="field"><label>Nome</label><input value={f.nome} onChange={e => set('nome', e.target.value)} required /></div>
            <div className="field"><label>Marca</label><input value={f.marca} onChange={e => set('marca', e.target.value)} /></div>
            <div className="field"><label>Categoria (aba do site)</label>
              <select value={f.tipo || 'Tênis'} onChange={e => set('tipo', e.target.value)} className="cursor-target">
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field"><label>Subcategoria (ex: Casual)</label><input value={f.categoria} onChange={e => set('categoria', e.target.value)} /></div>
            <div className="field"><label>Gênero</label>
              <select value={f.genero} onChange={e => set('genero', e.target.value)} className="cursor-target">
                <option>Unissex</option><option>Masculino</option><option>Feminino</option>
              </select>
            </div>
            <div className="field"><label>Preço (R$)</label><input type="number" step="0.01" value={f.preco} onChange={e => set('preco', e.target.value)} required /></div>
            <div className="field"><label>Preço antigo (opcional)</label><input type="number" step="0.01" value={f.precoAntigo} onChange={e => set('precoAntigo', e.target.value)} /></div>
            <div className="field"><label>Estoque</label><input type="number" value={f.estoque} onChange={e => set('estoque', e.target.value)} /></div>
            <div className="field"><label>Etiqueta (ex: Novo)</label><input value={f.tag || ''} onChange={e => set('tag', e.target.value)} /></div>
            <div className="field"><label>Tamanhos (vírgula)</label><input value={f.tamanhos} onChange={e => set('tamanhos', e.target.value)} /></div>
            <div className="field"><label>Cores hex (vírgula)</label><input value={f.cores} onChange={e => set('cores', e.target.value)} /></div>
            <div className="field field--photo">
              <label>Foto do produto</label>
              <div className="pform__photo">
                <div className="pform__photo-preview">
                  {previewSrc
                    ? <img src={previewSrc} alt="Prévia" />
                    : <span className="pform__photo-empty">Sem foto</span>}
                </div>
                <div className="pform__photo-actions">
                  <label className="btn btn-ghost cursor-target pform__upload">
                    <FiUpload /> Enviar foto
                    <input type="file" accept="image/*" hidden onChange={e => onPickFile(e.target.files && e.target.files[0])} />
                  </label>
                  {f.img && <button type="button" className="btn btn-quiet cursor-target" onClick={() => set('img', '')}>Remover</button>}
                  <p className="muted pform__photo-hint">Envie do computador ou celular. A imagem fica salva junto do produto.</p>
                </div>
              </div>
            </div>
            <div className="field field--check">
              <label className="pform__check cursor-target">
                <input type="checkbox" checked={!!f.destaque} onChange={e => set('destaque', e.target.checked)} /> Exibir em destaque
              </label>
            </div>
          </div>

          <div className="field"><label>Descrição</label><textarea rows={3} value={f.descricao} onChange={e => set('descricao', e.target.value)} /></div>

          <div className="pform__cw">
            <span className="pform__cw-label">Cores da ilustração (usada quando não há foto)</span>
            <div className="pform__cw-grid">
              {['base', 'mesh', 'stripe', 'sole', 'accent', 'lace'].map(k => (
                <label key={k} className="pform__cw-item">
                  <input type="color" value={f.colorway?.[k] || '#ffffff'} onChange={e => setCw(k, e.target.value)} className="cursor-target" />
                  <span>{k}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pform__actions">
            <button type="button" className="btn btn-ghost cursor-target" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary cursor-target" disabled={salvando}>
              <FiSave /> {salvando ? 'Salvando…' : 'Salvar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- CONFIG ---------------- */
function Config() {
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [nova, setNova] = useState('');
  const [conf, setConf] = useState('');

  const trocar = async e => {
    e.preventDefault();
    if (nova.length < 6) return toast('A nova senha precisa ter ao menos 6 caracteres.', 'danger');
    if (nova !== conf) return toast('As senhas não coincidem.', 'danger');
    if (await changePassword(cur, nova)) {
      toast('Senha atualizada com sucesso.', 'ok');
      setCur(''); setNova(''); setConf('');
    } else {
      toast('Senha atual incorreta.', 'danger');
    }
  };

  return (
    <div className="config">
      <LiquidGlass radius={24} className="config__card" blur={9}>
        <form className="config__form" onSubmit={trocar}>
          <h2>Alterar senha da equipe</h2>
          <p className="muted" style={{ marginBottom: 8 }}>
            A senha é compartilhada por quem gerencia a loja — e é ela que autoriza
            as alterações no servidor. Guarde com cuidado.
          </p>
          <div className="field"><label>Senha atual</label><input type="password" value={cur} onChange={e => setCur(e.target.value)} /></div>
          <div className="field"><label>Nova senha</label><input type="password" value={nova} onChange={e => setNova(e.target.value)} /></div>
          <div className="field"><label>Confirmar nova senha</label><input type="password" value={conf} onChange={e => setConf(e.target.value)} /></div>
          <button type="submit" className="btn btn-primary cursor-target"><FiSave /> Salvar nova senha</button>
        </form>
      </LiquidGlass>

      <LiquidGlass radius={24} className="config__card" blur={9}>
        <div className="config__form">
          <h2>Sobre o painel</h2>
          <ul className="config__list">
            <li><FiCheck /> Os pedidos chegam aqui assim que o cliente envia o comprovante.</li>
            <li><FiCheck /> Ao <strong>confirmar a venda</strong>, o estoque é baixado automaticamente.</li>
            <li><FiCheck /> Ajuste o estoque manualmente na aba <strong>Estoque</strong> a qualquer momento.</li>
            <li><FiCheck /> Cadastre novos modelos com foto (em <code>public/products/</code>) ou apenas com as cores da ilustração.</li>
            <li><FiCheck /> Com o <strong>servidor compartilhado</strong> ligado, o que você muda aqui aparece em todos os aparelhos em poucos segundos.</li>
            <li><FiCheck /> Sem servidor, o painel continua funcionando — só que as alterações ficam neste aparelho.</li>
          </ul>
        </div>
      </LiquidGlass>
    </div>
  );
}
