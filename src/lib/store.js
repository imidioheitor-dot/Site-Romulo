/* ============================================================
   Camada de dados — persistência em localStorage
   Produtos / estoque / pedidos / carrinho / sessão de equipe
   ============================================================ */

import { useSyncExternalStore } from 'react';

const KEYS = {
  products: 'rsf.products.v1',
  orders: 'rsf.orders.v1',
  cart: 'rsf.cart.v1',
  staff: 'rsf.staff.v1',
  session: 'rsf.session.v1'
};

const EVENT = 'rsf-store-change';

/* ---------- catálogo inicial ----------
   As imagens vivem em /products/<img>. Se o arquivo ainda não
   existir, o site renderiza uma arte vetorial do tênis com o
   colorway do produto — nada quebra sem as fotos. */
const SEED_PRODUCTS = [
  {
    id: 'rsf-airflow',
    nome: 'Supernova Stride',
    marca: 'Adidas',
    categoria: 'Corrida',
    genero: 'Unissex',
    preco: 499.9,
    precoAntigo: 599.9,
    descricao: 'Malha ultraleve branca com cabedal em degradê ciano e detalhe magenta no calcanhar. Amortecimento que devolve energia a cada passo.',
    cores: ['#f5f8ff', '#37b6d9', '#c4499c'],
    colorway: { base: '#eef3fa', mesh: '#bfeef4', stripe: '#2fa8c9', sole: '#f6f2e6', accent: '#c4499c', lace: '#ffffff' },
    tamanhos: [36, 37, 38, 39, 40, 41, 42, 43],
    estoque: 14,
    img: 'tenis-supernova.jpg',
    destaque: true,
    tag: 'Lançamento'
  },
  {
    id: 'rsf-vans-black',
    nome: 'Skate Noir',
    marca: 'Vans',
    categoria: 'Casual',
    genero: 'Unissex',
    preco: 389.9,
    precoAntigo: null,
    descricao: 'Couro e camurça all-black com a faixa lateral branca clássica. O par que resolve qualquer look de rua.',
    cores: ['#0d0d0f', '#ffffff'],
    colorway: { base: '#15161a', mesh: '#0d0d0f', stripe: '#f5f5f5', sole: '#101014', accent: '#f5f5f5', lace: '#0d0d0f' },
    tamanhos: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
    estoque: 22,
    img: 'tenis-noir.jpg',
    destaque: true,
    tag: 'Best-seller'
  },
  {
    id: 'rsf-jordan-mint',
    nome: 'Court Low Menta',
    marca: 'Jordan',
    categoria: 'Casual',
    genero: 'Masculino',
    preco: 549.9,
    precoAntigo: 649.9,
    descricao: 'Cinza-névoa com swoosh grafite e cadarços verde-menta. Discreto no corpo, ousado nos detalhes.',
    cores: ['#c9c9c4', '#4a4f52', '#9adfc3'],
    colorway: { base: '#d9d9d2', mesh: '#efefe9', stripe: '#4a4f52', sole: '#f2f2ee', accent: '#9adfc3', lace: '#9adfc3' },
    tamanhos: [38, 39, 40, 41, 42, 43, 44],
    estoque: 9,
    img: 'tenis-menta.jpg',
    destaque: true,
    tag: 'Edição limitada'
  },
  {
    id: 'rsf-samba-cream',
    nome: 'Samba Creme',
    marca: 'Adidas',
    categoria: 'Casual',
    genero: 'Feminino',
    preco: 459.9,
    precoAntigo: null,
    descricao: 'Off-white com as três listras em marrom-café e sola de goma caramelo. Um clássico atemporal, elegante em qualquer ocasião.',
    cores: ['#f2ead9', '#6b4230', '#e0a35f'],
    colorway: { base: '#f2ead9', mesh: '#f7f1e4', stripe: '#6b4230', sole: '#e0a35f', accent: '#6b4230', lace: '#f2ead9' },
    tamanhos: [34, 35, 36, 37, 38, 39, 40],
    estoque: 17,
    img: 'tenis-samba.jpg',
    destaque: true,
    tag: 'Novo'
  },
  {
    id: 'rsf-speed-m',
    nome: 'Speed Runner',
    marca: 'Nike',
    categoria: 'Corrida',
    genero: 'Masculino',
    preco: 459.9,
    precoAntigo: 529.9,
    descricao: 'Malha respirável azul-gelo com entressola de espuma reativa. Feito para o ritmo do dia a dia.',
    cores: ['#cfe4f5', '#3d7bff', '#ffffff'],
    colorway: { base: '#dcebf8', mesh: '#eef6fd', stripe: '#3d7bff', sole: '#ffffff', accent: '#1f3f8f', lace: '#ffffff' },
    tamanhos: [38, 39, 40, 41, 42, 43, 44],
    estoque: 12,
    img: 'tenis-speed.jpg',
    destaque: false,
    tag: null
  },
  {
    id: 'rsf-speed-f',
    nome: 'Speed Runner Rosé',
    marca: 'Nike',
    categoria: 'Corrida',
    genero: 'Feminino',
    preco: 459.9,
    precoAntigo: null,
    descricao: 'Branco-nuvem com detalhes rosé e sola em lilás suave. Leveza com personalidade.',
    cores: ['#f7f4f6', '#d98bb8', '#b9a8e0'],
    colorway: { base: '#f7f4f6', mesh: '#fdfbfc', stripe: '#d98bb8', sole: '#e9e2f5', accent: '#b9a8e0', lace: '#ffffff' },
    tamanhos: [34, 35, 36, 37, 38, 39],
    estoque: 8,
    img: 'tenis-rose.jpg',
    destaque: false,
    tag: null
  },
  {
    id: 'rsf-office',
    nome: 'Derby Urbano',
    marca: 'Rômulo Selection',
    categoria: 'Social',
    genero: 'Masculino',
    preco: 329.9,
    precoAntigo: 399.9,
    descricao: 'Couro legítimo marinho com solado emborrachado. A ponte perfeita entre o escritório e a rua.',
    cores: ['#1a2438', '#8a5a3b'],
    colorway: { base: '#1a2438', mesh: '#22304a', stripe: '#8a5a3b', sole: '#d9c9b2', accent: '#8a5a3b', lace: '#1a2438' },
    tamanhos: [38, 39, 40, 41, 42, 43, 44],
    estoque: 11,
    img: 'derby-urbano.jpg',
    destaque: false,
    tag: null
  },
  {
    id: 'rsf-slip',
    nome: 'Slip-on Nuvem',
    marca: 'Rômulo Selection',
    categoria: 'Conforto',
    genero: 'Feminino',
    preco: 259.9,
    precoAntigo: null,
    descricao: 'Calce fácil em tecido acolchoado cinza-pérola. Conforto de pantufa com cara de tênis.',
    cores: ['#d8dce3', '#f4f7ff'],
    colorway: { base: '#d8dce3', mesh: '#e8ecf2', stripe: '#aab3c2', sole: '#f4f7ff', accent: '#aab3c2', lace: '#d8dce3' },
    tamanhos: [34, 35, 36, 37, 38, 39, 40],
    estoque: 19,
    img: 'slipon-nuvem.jpg',
    destaque: false,
    tag: 'Conforto'
  }
];

/* senha padrão da equipe: romulo2026 (troque no painel) */
const SEED_STAFF = { passHash: hashPass('romulo2026') };

function hashPass(p) {
  // hash simples para não guardar a senha em texto puro no navegador
  let h = 5381;
  for (let i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36) + p.length;
}

/* ---------- primitivas ---------- */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function ensureSeed() {
  if (!localStorage.getItem(KEYS.products)) write(KEYS.products, SEED_PRODUCTS);
  if (!localStorage.getItem(KEYS.staff)) write(KEYS.staff, SEED_STAFF);
}
ensureSeed();

/* cache de snapshots para useSyncExternalStore não entrar em loop */
const snapshots = new Map();

function subscribe(cb) {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshot(key, fallback) {
  const raw = localStorage.getItem(key);
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value;
  const value = raw ? JSON.parse(raw) : fallback;
  snapshots.set(key, { raw, value });
  return value;
}

export function useStoreKey(name, fallback) {
  const key = KEYS[name];
  return useSyncExternalStore(subscribe, () => getSnapshot(key, fallback));
}

/* ---------- produtos / estoque ---------- */
export const useProducts = () => useStoreKey('products', []);

export function getProducts() {
  return read(KEYS.products, []);
}

export function saveProduct(product) {
  const list = getProducts();
  const i = list.findIndex(p => p.id === product.id);
  if (i >= 0) list[i] = product;
  else list.unshift({ ...product, id: 'rsf-' + Math.random().toString(36).slice(2, 8) });
  write(KEYS.products, list);
}

export function deleteProduct(id) {
  write(KEYS.products, getProducts().filter(p => p.id !== id));
}

export function adjustStock(id, delta) {
  const list = getProducts();
  const p = list.find(x => x.id === id);
  if (!p) return;
  p.estoque = Math.max(0, (p.estoque || 0) + delta);
  write(KEYS.products, list);
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

export function createOrder({ cliente, itens, total, comprovante }) {
  const orders = read(KEYS.orders, []);
  const id = 'RSF' + Date.now().toString(36).toUpperCase().slice(-6);
  const order = {
    id,
    criadoEm: new Date().toISOString(),
    status: ORDER_STATUS.AGUARDANDO,
    cliente,
    itens,
    total,
    comprovante // dataURL da imagem/pdf do comprovante
  };
  orders.unshift(order);
  write(KEYS.orders, orders);
  clearCart();
  return order;
}

export function updateOrderStatus(orderId, status) {
  const orders = read(KEYS.orders, []);
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  // confirmar a venda baixa o estoque automaticamente (uma única vez)
  if (status === ORDER_STATUS.PAGO && order.status === ORDER_STATUS.AGUARDANDO) {
    const products = getProducts();
    order.itens.forEach(item => {
      const p = products.find(x => x.id === item.productId);
      if (p) p.estoque = Math.max(0, p.estoque - item.qtd);
    });
    write(KEYS.products, products);
  }

  order.status = status;
  write(KEYS.orders, orders);
}

/* ---------- autenticação da equipe ---------- */
export const useSession = () => useStoreKey('session', null);

export function login(password) {
  const staff = read(KEYS.staff, SEED_STAFF);
  if (hashPass(password) === staff.passHash) {
    write(KEYS.session, { at: Date.now() });
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(KEYS.session);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: KEYS.session }));
}

export function changePassword(current, next) {
  const staff = read(KEYS.staff, SEED_STAFF);
  if (hashPass(current) !== staff.passHash) return false;
  write(KEYS.staff, { passHash: hashPass(next) });
  return true;
}

/* dados fixos da loja */
export const LOJA = {
  nome: 'Rômulo Santos Flores',
  slogan: 'Elegância para o dia a dia.',
  pixTelefone: '+55 62 9236-8358',
  pixChave: '+556292368358',
  whatsapp: '556292368358',
  email: 'contato@romulosantosflores.com.br',
  endereco: 'Av. República do Líbano, 1875 — St. Oeste, Goiânia - GO, 74115-030',
  horario: 'Seg a Sáb — 9h às 19h',
  cidade: 'GOIANIA'
};
