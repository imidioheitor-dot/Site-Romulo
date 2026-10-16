/* ============================================================
   Camada de dados — produtos / estoque / pedidos / carrinho / equipe

   Duas camadas empilhadas:
   1. localStorage — sempre presente, faz o site funcionar sozinho.
   2. API compartilhada (Netlify Functions + Netlify Blobs) — quando existe,
      vira a fonte da verdade e sincroniza estoque e pedidos entre aparelhos.
   Se a API sumir, a camada 1 continua respondendo: nada quebra.
   ============================================================ */

import { useSyncExternalStore } from 'react';
import * as api from './api';

const KEYS = {
  products: 'mikka.products.v1',
  orders: 'mikka.orders.v1',
  cart: 'mikka.cart.v1',
  staff: 'rsf.staff.v1',
  session: 'rsf.session.v1'
};

const EVENT = 'rsf-store-change';

/* ---------- catálogo inicial ----------
   Cada produto pode apontar para uma FOTO REAL em /products/<img>.
   Enquanto a foto não existir, o site mostra uma ilustração em dourado
   (campo `arte`). Para trocar, basta cadastrar a foto em /equipe → Estoque.
   `tamanhos` guarda as opções de compra (cor, modelo…) e `opcaoLabel`
   diz como chamá-las na página do produto. */
const SEED_PRODUCTS = [
  mikkaProd('mh-escapulario-porta', 'Natal', 'Escapulário de Porta',
    150, 250,
    'Escapulário natalino para a porta de entrada: o primeiro detalhe que recebe a família e os convidados. Acabamento delicado, pensado para durar muitos Natais.',
    'porta', ['Único'], 'Opção', 6, true, 'Natal', ['#c9a24a', '#8a1f2b', '#2f5a3a']),
  mikkaProd('mh-colar-bolas', 'Natal', 'Colar de Bolas de Natal · 2 m',
    100, 180,
    'Colar de bolas de Natal com 2 metros de comprimento, para a árvore, a escada, a lareira ou o centro da mesa. Escolha a cor que combina com a sua decoração.',
    'bolas', ['Verde', 'Dourado', 'Vermelho', 'Azul Royal', 'Vinho'], 'Cor', 15, true, 'Mais vendido', ['#2f5a3a', '#c9a24a', '#b3262e', '#2a4aa8', '#6e1e2b']),
  mikkaProd('mh-vila-natalina', 'Natal', 'Vila Natalina',
    99.9, null,
    'Uma pequena vila de Natal para montar sobre o aparador, a estante ou a mesa. Charme e aconchego que encantam adultos e crianças.',
    'vila', ['Único'], 'Opção', 8, true, 'Encantadora', ['#f3e9d8', '#c9a24a']),
  mikkaProd('mh-kit-mesa-natalino', 'Mesa Posta', 'Kit Mesa Posta Natalino',
    149.9, null,
    'Tudo para a ceia ficar pronta e elegante: 6 guardanapos, 6 jogos americanos, 6 porta-guardanapos e 1 caminho de mesa, combinando entre si.',
    'mesa', ['Único'], 'Opção', 10, true, 'Kit completo', ['#b3262e', '#c9a24a', '#f3e9d8'],
    ['6 guardanapos', '6 jogos americanos', '6 porta-guardanapos', '1 caminho de mesa']),
  mikkaProd('mh-kit-mesa-dia-a-dia', 'Mesa Posta', 'Kit Mesa Posta Dia a Dia',
    90, 130,
    'A mesa bonita não precisa esperar ocasião especial. Kit com 6 guardanapos, 6 jogos americanos e 6 porta-guardanapos para o almoço de todo dia.',
    'mesa', ['Único'], 'Opção', 10, false, 'Oferta', ['#e8dcc6', '#c9a24a'],
    ['6 guardanapos', '6 jogos americanos', '6 porta-guardanapos']),
  mikkaProd('mh-centro-mesa', 'Decoração', 'Centro de Mesa',
    99.9, 130,
    'Centro de mesa que completa a decoração da sala de jantar com presença e delicadeza, para o dia a dia ou para receber.',
    'centro', ['Único'], 'Opção', 8, false, 'Oferta', ['#c9a24a', '#f3e9d8']),
  mikkaProd('mh-almofada-veludo', 'Almofadas', 'Almofada de Veludo',
    65, 99.9,
    'Almofada de veludo macio, com brilho suave e toque aconchegante. Disponível em vermelho e verde, cores que trazem o clima de Natal para o sofá.',
    'almofada', ['Vermelha', 'Verde'], 'Cor', 12, false, 'Veludo', ['#9e1f2a', '#2f5a3a']),
  mikkaProd('mh-almofada-tricoline', 'Almofadas', 'Almofada Tricoline 45×45 cm',
    35, 60,
    'Almofada em tricoline, tecido de algodão com toque leve e acabamento firme. Tamanho 45×45 cm, ideal para sofás, poltronas e camas.',
    'almofada', ['Único'], 'Opção', 20, false, 'Oferta', ['#f3e9d8', '#c9a24a'],
    ['Tamanho 45×45 cm', 'Tecido tricoline'])
];

/* fábrica de produtos Mikka Home */
function mikkaProd(id, categoria, nome, preco, precoAntigo, descricao, arte, opcoes, opcaoLabel, estoque, destaque, tag, cores, inclui = null) {
  return {
    id, nome, marca: 'Mikka Home', tipo: categoria, categoria, genero: 'Casa',
    preco, precoAntigo, descricao, cores, arte, opcaoLabel,
    ...(inclui ? { inclui } : {}),
    tamanhos: opcoes, estoque, img: null, destaque, tag
  };
}

/* Senha da equipe guardada SOMENTE como hash — o texto puro não fica no
   código nem no bundle. Para trocar a senha, use "Alterar senha" no painel
   (isso regrava o hash em localStorage). */
const SEED_STAFF = { passHash: 'hltbjm510' };

function hashPass(p) {
  // hash simples para não guardar a senha em texto puro no navegador
  let h = 5381;
  for (let i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36) + p.length;
}

/* ---------- primitivas (camada resiliente) ----------
   Guarda uma cópia em memória (mem) que funciona mesmo quando o
   localStorage está indisponível (ex.: Safari em aba privada) ou cheio.
   Quando o localStorage funciona, ele é usado para persistir entre visitas. */
const mem = new Map();
let storagePersistent = true;

function lsGet(key) {
  try { return localStorage.getItem(key); } catch { storagePersistent = false; return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); return true; }
  catch { storagePersistent = false; return false; }
}
function lsDel(key) {
  try { localStorage.removeItem(key); } catch { /* ignora */ }
}
function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function read(key, fallback) {
  if (mem.has(key)) return mem.get(key);
  const raw = lsGet(key);
  const value = raw ? safeParse(raw, fallback) : fallback;
  mem.set(key, value);
  return value;
}

function write(key, value) {
  // guarda uma nova referência (arrays) para o useSyncExternalStore detectar a mudança
  mem.set(key, Array.isArray(value) ? value.slice() : value);
  if (value == null) lsDel(key);
  else lsSet(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

/* true quando as alterações estão sendo salvas no navegador (persistem entre visitas) */
export function isStoragePersistent() { return storagePersistent; }

function ensureSeed() {
  if (!mem.has(KEYS.products) && !lsGet(KEYS.products)) write(KEYS.products, SEED_PRODUCTS);
  if (!mem.has(KEYS.staff) && !lsGet(KEYS.staff)) write(KEYS.staff, SEED_STAFF);
}
ensureSeed();

function subscribe(cb) {
  const handler = e => {
    if (e && e.type === 'storage') mem.clear(); // outra aba mudou: recarrega do storage
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshot(key, fallback) {
  return read(key, fallback);
}

export function useStoreKey(name, fallback) {
  const key = KEYS[name];
  return useSyncExternalStore(subscribe, () => getSnapshot(key, fallback));
}

/* ============================================================
   Backend compartilhado (Netlify Functions + Netlify Blobs)

   O localStorage continua sendo a base: tudo funciona sem servidor.
   Quando a API responde, ela vira a fonte da verdade do catálogo e dos
   pedidos, e o localStorage passa a ser o espelho local (offline).
   ============================================================ */

let catalogoRev = null;   // versão do catálogo no servidor (null = ainda não sei)
let pedidosRev = null;
let sincronizacaoIniciada = false;

const ESTADO_INICIAL_BACKEND = {
  estado: api.ESTADO.DESCONHECIDO, // desconhecido | online | offline
  rev: null,
  publicado: false,     // já existe catálogo no servidor?
  sincronizando: false,
  ultimaSync: null,
  erro: null
};

let infoBackend = ESTADO_INICIAL_BACKEND;
const ouvintesBackend = new Set();

function atualizarInfo(parcial) {
  const proximo = { ...infoBackend, ...parcial };
  const mudou = Object.keys(proximo).some(k => proximo[k] !== infoBackend[k]);
  if (!mudou) return;
  infoBackend = proximo;
  ouvintesBackend.forEach(cb => { try { cb(); } catch { /* ignora */ } });
}

api.ouvirBackend(estado => atualizarInfo({ estado, erro: estado === api.ESTADO.OFFLINE ? api.erroBackend() : null }));

/* Estas três funções são definidas UMA vez, fora do componente, de propósito:
   se a `subscribe` mudasse de identidade a cada render, o React cancelaria e
   refaria a inscrição em todo render — troca-troca de efeitos sem necessidade,
   justamente durante as atualizações vindas do servidor. */
function assinarBackend(cb) {
  ouvintesBackend.add(cb);
  return () => { ouvintesBackend.delete(cb); };
}
const lerInfoBackend = () => infoBackend;
const lerInfoBackendInicial = () => ESTADO_INICIAL_BACKEND;

/* Estado do servidor compartilhado, para a interface avisar o lojista. */
export function useBackend() {
  return useSyncExternalStore(assinarBackend, lerInfoBackend, lerInfoBackendInicial);
}

function tokenEquipe() {
  const sessao = read(KEYS.session, null);
  return (sessao && sessao.token) || null;
}

let assinaturaCatalogo = null;

/* Só reescreve o catálogo local quando o conteúdo mudou de verdade. Um
   `write` troca a identidade do array e re-renderiza a árvore inteira —
   fazer isso à toa (a cada resync forçado) é desperdício e, pior, obriga o
   React a montar e desmontar componentes sem motivo. */
function aplicarProdutosRemotos(produtos) {
  if (!Array.isArray(produtos)) return false;
  let assinatura;
  try {
    assinatura = JSON.stringify(produtos);
  } catch {
    assinatura = null;
  }
  if (assinatura != null && assinatura === assinaturaCatalogo) return false;
  assinaturaCatalogo = assinatura;
  write(KEYS.products, produtos);
  return true;
}

/* ---------- catálogo: baixar do servidor ---------- */
let otimizacaoTentada = false;

/* Um catálogo com fotos embutidas demais fica grande a ponto de a hospedagem
   recusar tanto o envio quanto a entrega — e aí a loja não consegue mais
   cadastrar nada. Aqui a gente conserta sozinho, sem pedir nada a ninguém. */
async function consertarCatalogoPesado() {
  if (otimizacaoTentada || !tokenEquipe()) return false;
  otimizacaoTentada = true;
  const r = await otimizarFotos();
  return !!(r.ok && r.convertidas);
}

export async function sincronizarCatalogo({ forcar = false } = {}) {
  atualizarInfo({ sincronizando: true });
  try {
    const dados = await api.buscarCatalogo(forcar ? null : catalogoRev);
    catalogoRev = dados.rev;

    if (dados.semMudanca) {
      atualizarInfo({ sincronizando: false, rev: dados.rev, ultimaSync: Date.now(), erro: null });
      return { ok: true, mudou: false };
    }

    const publicado = Array.isArray(dados.produtos) && dados.produtos.length > 0;
    if (publicado) aplicarProdutosRemotos(dados.produtos);

    atualizarInfo({ sincronizando: false, rev: dados.rev, publicado, ultimaSync: Date.now(), erro: null });

    // Servidor ainda vazio e a equipe está logada: publica o catálogo local
    // (é assim que a loja "nasce" no backend, sem passo manual).
    if (!publicado && tokenEquipe()) await publicarCatalogoAtual();

    // Fotos embutidas vindas do formato antigo: conserta sozinho, senão o
    // catálogo continua engordando até travar todo cadastro.
    if (publicado && dados.produtos.some(p => String(p.img || '').startsWith('data:'))) {
      if (await consertarCatalogoPesado()) return { ok: true, mudou: true, publicado: true, otimizado: true };
    }

    return { ok: true, mudou: publicado, publicado };
  } catch (e) {
    /* O catálogo pode ter ficado grande demais para a hospedagem entregar.
       Nesse caso a API está viva (o /api/status responde) — o que quebrou foi
       só o tamanho. Conserta e tenta de novo, em vez de cair no modo local. */
    if (!otimizacaoTentada && tokenEquipe()) {
      try {
        await api.verificarBackend();          // a API está de pé?
        if (await consertarCatalogoPesado()) return { ok: true, mudou: true, otimizado: true };
      } catch { /* backend fora mesmo: segue para o modo local */ }
    }
    atualizarInfo({ sincronizando: false, erro: e.message });
    return { ok: false, erro: e };
  }
}

/* ---------- catálogo: enviar para o servidor ---------- */
/* Nenhuma foto embutida sai daqui dentro do catálogo: cada uma vai antes para
   o endereço dela. Sem isso, o catálogo cresce ~200 KB por foto e, passando de
   ~30, o envio inteiro é recusado pela hospedagem — e aí NADA mais salva. */
async function converterFotosEmbutidas(lista) {
  if (!lista.some(p => String(p.img || '').startsWith('data:'))) return { lista, ok: true };
  const saida = [];
  for (const p of lista) {
    if (!String(p.img || '').startsWith('data:')) { saida.push(p); continue; }
    const r = await guardarFoto(p.img);
    if (!r.ok) return { lista, ok: false, erro: r.erro };
    saida.push({ ...p, img: r.img });
  }
  return { lista: saida, ok: true, convertidas: true };
}

async function enviarCatalogo(listaOriginal, mutacao) {
  const token = tokenEquipe();
  if (!api.backendAtivo() || !token) return { ok: true, remoto: false };

  const convertido = await converterFotosEmbutidas(listaOriginal);
  if (!convertido.ok) return { ok: false, remoto: true, erro: convertido.erro };
  const lista = convertido.lista;
  if (convertido.convertidas) write(KEYS.products, lista);

  try {
    const r = await api.publicarCatalogo(lista, { rev: catalogoRev, token });
    catalogoRev = r.rev;
    aplicarProdutosRemotos(r.produtos);
    atualizarInfo({ rev: r.rev, publicado: true, ultimaSync: Date.now(), erro: null });
    return { ok: true, remoto: true };
  } catch (e) {
    // Alguém salvou primeiro: reaplica a mesma mudança sobre a versão nova.
    if (e.conflito && e.dados && Array.isArray(e.dados.produtos) && mutacao) {
      catalogoRev = e.dados.rev;
      const refeita = mutacao(e.dados.produtos);
      write(KEYS.products, refeita);
      try {
        const r2 = await api.publicarCatalogo(refeita, { rev: catalogoRev, token });
        catalogoRev = r2.rev;
        aplicarProdutosRemotos(r2.produtos);
        atualizarInfo({ rev: r2.rev, publicado: true, ultimaSync: Date.now(), erro: null });
        return { ok: true, remoto: true, refeito: true };
      } catch (e2) {
        atualizarInfo({ erro: e2.message });
        return { ok: false, remoto: true, erro: e2 };
      }
    }
    if (!e.offline) atualizarInfo({ erro: e.message });
    return { ok: false, remoto: true, erro: e };
  }
}

/* Publica o catálogo local inteiro (usado no primeiro login e no botão
   "Publicar catálogo" do painel). */
export async function publicarCatalogoAtual() {
  const r = await enviarCatalogo(getProducts(), null);
  if (r.ok && r.remoto) atualizarInfo({ publicado: true });
  return r;
}

/* Aplica a mudança no aparelho (resposta imediata) e replica no servidor. */
function alterarProdutos(mutacao) {
  const lista = mutacao(getProducts());
  write(KEYS.products, lista);
  return enviarCatalogo(lista, mutacao);
}

/* ---------- pedidos: baixar do servidor (só a equipe) ---------- */
export async function sincronizarPedidos({ forcar = false } = {}) {
  const token = tokenEquipe();
  if (!token || !api.backendAtivo()) return { ok: true, remoto: false };
  try {
    const dados = await api.buscarPedidos(token, forcar ? null : pedidosRev);
    pedidosRev = dados.rev;
    if (dados.semMudanca) return { ok: true, mudou: false };
    mesclarPedidosRemotos(dados.pedidos || []);
    return { ok: true, mudou: true };
  } catch (e) {
    return { ok: false, erro: e };
  }
}

/* O servidor manda a lista sem os comprovantes (que são pesados e ficam
   guardados à parte). Preservamos o comprovante que já estiver no aparelho. */
function mesclarPedidosRemotos(remotos) {
  const locais = read(KEYS.orders, []);
  const porId = new Map(locais.map(o => [o.id, o]));
  const mesclados = remotos.map(o => {
    const local = porId.get(o.id);
    return local && local.comprovante ? { ...o, comprovante: local.comprovante } : o;
  });
  const idsRemotos = new Set(remotos.map(o => o.id));
  // pedidos que ficaram só no aparelho (feitos sem servidor) continuam na lista
  const sobras = locais.filter(o => !idsRemotos.has(o.id) && o.somenteLocal);
  write(KEYS.orders, [...mesclados, ...sobras].sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm))));
}

function guardarPedidoLocal(pedido) {
  const orders = read(KEYS.orders, []);
  const i = orders.findIndex(o => o.id === pedido.id);
  if (i >= 0) orders[i] = { ...orders[i], ...pedido };
  else orders.unshift(pedido);
  write(KEYS.orders, orders);
}

/* ---------- sincronização ao vivo ----------
   Sem WebSocket: uma consulta curta de tempos em tempos (e sempre que a aba
   volta ao foco). Quando nada mudou, o servidor responde só com o número da
   versão, então o custo é mínimo. */
export function iniciarSincronizacao({ intervalo = 20000 } = {}) {
  if (sincronizacaoIniciada || typeof window === 'undefined') return () => {};
  sincronizacaoIniciada = true;

  let parado = false;
  let timer = null;

  const ciclo = async () => {
    if (parado) return;
    if (!document.hidden) {
      await sincronizarCatalogo();
      if (tokenEquipe()) await sincronizarPedidos();
    }
    if (!parado) timer = setTimeout(ciclo, intervalo);
  };

  const agora = () => {
    if (parado || document.hidden) return;
    sincronizarCatalogo();
    if (tokenEquipe()) sincronizarPedidos();
  };

  ciclo();

  const aoVoltar = () => { if (!document.hidden) agora(); };
  window.addEventListener('focus', aoVoltar);
  window.addEventListener('online', agora);
  document.addEventListener('visibilitychange', aoVoltar);

  return () => {
    parado = true;
    sincronizacaoIniciada = false;
    if (timer) clearTimeout(timer);
    window.removeEventListener('focus', aoVoltar);
    window.removeEventListener('online', agora);
    document.removeEventListener('visibilitychange', aoVoltar);
  };
}

/* ---------- categorias (tipos de produto) ---------- */
export const CATEGORIAS = ['Natal', 'Mesa Posta', 'Almofadas', 'Decoração'];

/* ---------- produtos / estoque ---------- */
export const useProducts = () => useStoreKey('products', []);

export function getProducts() {
  return read(KEYS.products, []);
}

/* Sobe a foto para o endereço dela e devolve a referência curta que vai para
   o catálogo. Sem servidor (ou sem sessão), a foto continua embutida — o modo
   local não tem onde guardá-la separada. */
async function guardarFoto(img) {
  const token = tokenEquipe();
  if (!img || !String(img).startsWith('data:')) return { img, ok: true };
  if (!api.backendAtivo() || !token) return { img, ok: true, local: true };
  try {
    const r = await api.enviarFoto(img, token);
    return { img: r.caminho, ok: true };
  } catch (e) {
    return { img, ok: false, erro: e };
  }
}

export async function saveProduct(product) {
  const id = product.id || 'rsf-' + Math.random().toString(36).slice(2, 8);

  const foto = await guardarFoto(product.img);
  if (!foto.ok) return { ok: false, erro: foto.erro };

  const produto = { ...product, id, img: foto.img };
  return alterarProdutos(lista => {
    const i = lista.findIndex(p => p.id === id);
    const nova = lista.slice();
    if (i >= 0) nova[i] = produto;
    else nova.unshift(produto);
    return nova;
  });
}

/* Conserta um catálogo que já engordou. Quem faz o trabalho é o servidor, do
   lado dele: assim funciona até quando o catálogo já está grande demais para
   ser baixado ou enviado — que é justamente quando a loja trava. */
export async function otimizarFotos() {
  const token = tokenEquipe();
  if (!token) return { ok: false, motivo: 'sem-sessao' };

  try {
    const r = await api.otimizarCatalogoRemoto(token);
    await sincronizarCatalogo({ forcar: true });
    return { ok: true, convertidas: r.convertidas || 0, bytesAntes: r.bytesAntes, bytesDepois: r.bytesDepois };
  } catch (e) {
    return { ok: false, erro: e };
  }
}

/* quantas fotos ainda viajam dentro do catálogo */
export function fotosEmbutidas() {
  return getProducts().filter(p => String(p.img || '').startsWith('data:')).length;
}

export function deleteProduct(id) {
  return alterarProdutos(lista => lista.filter(p => p.id !== id));
}

export function adjustStock(id, delta) {
  return alterarProdutos(lista =>
    lista.map(p => (p.id === id ? { ...p, estoque: Math.max(0, (p.estoque || 0) + delta) } : p))
  );
}

/* ---------- exportar / importar catálogo (backup local em arquivo) ----------
   Permite ao lojista salvar todos os produtos + fotos num arquivo .json e
   recarregar depois, garantindo que o trabalho não se perca entre visitas. */
export function exportCatalog() {
  return JSON.stringify({ tipo: 'mikka-home-catalogo', versao: 1, data: new Date().toISOString(), produtos: getProducts() });
}

export async function importCatalog(text, { mesclar = false } = {}) {
  const parsed = JSON.parse(text);
  const produtos = Array.isArray(parsed) ? parsed : parsed && parsed.produtos;
  if (!Array.isArray(produtos) || !produtos.length) throw new Error('Arquivo sem produtos válidos.');
  const norm = produtos.map(p => ({ ...p, id: p.id || 'rsf-' + Math.random().toString(36).slice(2, 8) }));

  let total = norm.length;
  const sync = await alterarProdutos(lista => {
    if (!mesclar) return norm;
    const byId = new Map(lista.map(p => [p.id, p]));
    norm.forEach(p => byId.set(p.id, p));
    const mesclada = [...byId.values()];
    total = mesclada.length;
    return mesclada;
  });
  return { total, sync };
}

/* ---------- carrinho ---------- */
export const useCart = () => useStoreKey('cart', []);

export function addToCart(productId, tamanho, qtd = 1) {
  const cart = read(KEYS.cart, []);
  const item = cart.find(i => i.productId === productId && i.tamanho === tamanho);
  if (item) item.qtd += qtd;
  else cart.push({ productId, tamanho, qtd });
  write(KEYS.cart, cart);
}

export function setCartQty(productId, tamanho, qtd) {
  let cart = read(KEYS.cart, []);
  const item = cart.find(i => i.productId === productId && i.tamanho === tamanho);
  if (item) item.qtd = qtd;
  cart = cart.filter(i => i.qtd > 0);
  write(KEYS.cart, cart);
}

export function clearCart() {
  write(KEYS.cart, []);
}

export function cartDetails(cart, products) {
  const items = cart
    .map(i => {
      const produto = products.find(p => p.id === i.productId);
      return produto ? { ...i, produto, subtotal: produto.preco * i.qtd } : null;
    })
    .filter(Boolean);
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const count = items.reduce((s, i) => s + i.qtd, 0);
  return { items, total, count };
}

/* ---------- pedidos ---------- */
export const useOrders = () => useStoreKey('orders', []);

export const ORDER_STATUS = {
  AGUARDANDO: 'aguardando',   // comprovante enviado, aguardando confirmação
  PAGO: 'pago',               // venda confirmada, estoque baixado, preparando
  ENVIADO: 'enviado',
  CANCELADO: 'cancelado'
};

/* Checkout público. Com servidor, o pedido cai na conta da loja (qualquer
   aparelho da equipe vê). Sem servidor, fica salvo no aparelho do cliente,
   exatamente como antes. */
export async function createOrder({ cliente, itens, total, comprovante }) {
  if (api.backendAtivo()) {
    try {
      const r = await api.enviarPedido({
        cliente,
        itens: itens.map(i => ({ productId: i.productId, tamanho: i.tamanho, qtd: i.qtd })),
        comprovante
      });
      const pedido = { ...r.pedido, comprovante: comprovante || null };
      guardarPedidoLocal(pedido);
      clearCart();
      return pedido;
    } catch (e) {
      // erro de validação precisa chegar ao cliente; queda de rede não.
      if (!e.offline && e.status !== 503) throw e;
    }
  }

  const orders = read(KEYS.orders, []);
  const id = 'RSF' + Date.now().toString(36).toUpperCase().slice(-6);
  const order = {
    id,
    criadoEm: new Date().toISOString(),
    status: ORDER_STATUS.AGUARDANDO,
    cliente,
    itens,
    total,
    comprovante, // dataURL da imagem/pdf do comprovante
    temComprovante: !!comprovante,
    somenteLocal: true
  };
  orders.unshift(order);
  write(KEYS.orders, orders);
  clearCart();
  return order;
}

export async function updateOrderStatus(orderId, status) {
  const token = tokenEquipe();
  const pedidoLocal = read(KEYS.orders, []).find(o => o.id === orderId);

  if (api.backendAtivo() && token && pedidoLocal && !pedidoLocal.somenteLocal) {
    try {
      const r = await api.mudarStatusPedido(orderId, status, token);
      pedidosRev = r.rev;
      guardarPedidoLocal(r.pedido);
      if (r.catalogo) {
        catalogoRev = r.catalogo.rev;
        aplicarProdutosRemotos(r.catalogo.produtos);
        atualizarInfo({ rev: r.catalogo.rev });
      }
      return { ok: true, remoto: true };
    } catch (e) {
      if (!e.offline) return { ok: false, erro: e };
    }
  }

  const orders = read(KEYS.orders, []);
  const order = orders.find(o => o.id === orderId);
  if (!order) return { ok: false, erro: new Error('Pedido não encontrado.') };

  // confirmar a venda baixa o estoque automaticamente (uma única vez)
  if (status === ORDER_STATUS.PAGO && order.status === ORDER_STATUS.AGUARDANDO) {
    await alterarProdutos(lista =>
      lista.map(p => {
        const item = order.itens.find(i => i.productId === p.id);
        return item ? { ...p, estoque: Math.max(0, (p.estoque || 0) - item.qtd) } : p;
      })
    );
  }

  order.status = status;
  write(KEYS.orders, orders);
  return { ok: true, remoto: false };
}

/* Comprovantes ficam num blob separado: busca sob demanda ao abrir o modal. */
export async function obterComprovante(orderId) {
  const local = read(KEYS.orders, []).find(o => o.id === orderId);
  if (local && local.comprovante) return local.comprovante;
  const token = tokenEquipe();
  if (!api.backendAtivo() || !token) return null;
  const r = await api.buscarComprovante(orderId, token);
  if (r && r.comprovante) {
    guardarPedidoLocal({ id: orderId, comprovante: r.comprovante });
    return r.comprovante;
  }
  return null;
}

/* ---------- autenticação da equipe ----------
   A senha do painel é também o token de escrita da API: ela vai no cabeçalho
   Authorization das rotas protegidas. */
export const useSession = () => useStoreKey('session', null);

export async function login(password) {
  /* Tenta SEMPRE o servidor, mesmo que uma chamada anterior tenha falhado.
     Um catálogo grande demais para a hospedagem entregar, por exemplo, marca
     o backend como fora do ar — e sem esta tentativa o dono ficaria trancado
     para fora com a senha certa, porque o aparelho novo só conhece o hash
     local antigo. O login é uma chamada pequena: se a API estiver de pé, ela
     passa. */
  {
    try {
      const r = await api.entrar(password);
      write(KEYS.session, {
        at: Date.now(),
        token: r.token,
        remoto: true,
        // o servidor avisa quando a senha em uso ainda é a de fábrica /
        // está guardada no formato fraco, que dá para forjar
        senhaFraca: !!r.senhaFraca,
        senhaNoAmbiente: !!r.senhaFixadaNoAmbiente
      });
      write(KEYS.staff, { passHash: hashPass(password) }); // mantém o modo local em dia
      await sincronizarCatalogo({ forcar: true });
      await sincronizarPedidos({ forcar: true });
      return true;
    } catch (e) {
      if (!e.offline) return false; // senha errada / bloqueio: não tenta local
    }
  }

  const staff = read(KEYS.staff, SEED_STAFF);
  if (hashPass(password) === staff.passHash) {
    write(KEYS.session, { at: Date.now(), token: password, remoto: false });
    return true;
  }
  return false;
}

export function logout() {
  pedidosRev = null;
  write(KEYS.session, null);
}

export async function changePassword(current, next) {
  const staff = read(KEYS.staff, SEED_STAFF);

  if (api.backendAtivo()) {
    try {
      // a senha atual é o próprio token: o servidor confere antes de trocar
      const r = await api.trocarSenhaRemota(next, current);
      write(KEYS.staff, { passHash: hashPass(next) });
      write(KEYS.session, { at: Date.now(), token: r.token || next, remoto: true, senhaFraca: false });
      return true;
    } catch (e) {
      if (!e.offline) return false;
    }
  }

  if (hashPass(current) !== staff.passHash) return false;
  write(KEYS.staff, { passHash: hashPass(next) });
  const sessao = read(KEYS.session, null);
  if (sessao) write(KEYS.session, { ...sessao, token: next });
  return true;
}

/* dados fixos da loja */
export const LOJA = {
  nome: 'Mikka Home',
  slogan: 'Da nossa casa para seu lar!',
  pixTelefone: '+55 62 9236-8358',
  pixChave: 'romulo.santosflores@icloud.com',
  whatsapp: '5562994146169',            // Elvira, vendedora (atendimento principal)
  vendedora: 'Elvira',
  telefone: '+55 62 99414-6169',
  whatsappDono: '5562992368358',        // Romulo, proprietário
  dono: 'Romulo',
  telefoneDono: '+55 62 99236-8358',
  endereco: 'Rua 261, nº 450 — Setor Campinas, Goiânia - GO',
  enderecoMapa: 'Rua 261, 450, Goiânia - GO',
  horario: 'Seg a Sáb — 9h às 19h',
  cidade: 'GOIANIA'
};
