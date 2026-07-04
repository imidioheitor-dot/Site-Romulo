/* ============================================================
   Camada de dados — persistência em localStorage
   Produtos / estoque / pedidos / carrinho / sessão de equipe
   ============================================================ */

import { useSyncExternalStore } from 'react';

const KEYS = {
  products: 'rsf.products.v2',
  orders: 'rsf.orders.v1',
  cart: 'rsf.cart.v2',
  staff: 'rsf.staff.v1',
  session: 'rsf.session.v1'
};

const EVENT = 'rsf-store-change';

/* ---------- catálogo inicial ----------
   Cada produto aponta para uma FOTO REAL em /products/<img>.
   Basta colocar o arquivo com esse nome na pasta public/products/.
   O colorway fica só como rede de segurança visual. */
const SEED_PRODUCTS = [
  {
    id: 'rsf-campus-preto',
    nome: 'Campus 00s Preto',
    marca: 'Adidas',
    categoria: 'Casual',
    genero: 'Unissex',
    preco: 499.9,
    precoAntigo: 599.9,
    descricao: 'Camurça preta com as três listras brancas, sola de goma caramelo e trefoil bordado. Um ícone do streetwear que combina com tudo, do jeans ao social despojado.',
    cores: ['#111113', '#ffffff', '#c9a24a'],
    colorway: { base: '#161618', mesh: '#101012', stripe: '#f4f4f2', sole: '#d8c69a', accent: '#c9a24a', lace: '#ffffff' },
    tamanhos: [37, 38, 39, 40, 41, 42, 43, 44],
    estoque: 16,
    img: 'campus-preto.jpg',
    destaque: true,
    tag: 'Best-seller'
  },
  {
    id: 'rsf-supernova',
    nome: 'Supernova Branco',
    marca: 'Adidas',
    categoria: 'Corrida',
    genero: 'Unissex',
    preco: 549.9,
    precoAntigo: 649.9,
    descricao: 'Malha branca ultraleve com o cabedal em degradê ciano e detalhe magenta no calcanhar. Amortecimento reativo que devolve energia a cada passo.',
    cores: ['#f5f8ff', '#37b6d9', '#c4499c'],
    colorway: { base: '#eef3fa', mesh: '#bfeef4', stripe: '#2fa8c9', sole: '#f6f2e6', accent: '#c4499c', lace: '#ffffff' },
    tamanhos: [36, 37, 38, 39, 40, 41, 42, 43],
    estoque: 12,
    img: 'supernova-branco.jpg',
    destaque: true,
    tag: 'Lançamento'
  },
  {
    id: 'rsf-vans-preto',
    nome: 'Knu Skool Preto',
    marca: 'Vans',
    categoria: 'Casual',
    genero: 'Unissex',
    preco: 429.9,
    precoAntigo: null,
    descricao: 'Silhueta chunky all-black com a faixa lateral branca marcante e cadarços grossos. O par que resolve qualquer look de rua com atitude.',
    cores: ['#0d0d0f', '#ffffff'],
    colorway: { base: '#161619', mesh: '#0d0d0f', stripe: '#f5f5f5', sole: '#101014', accent: '#f5f5f5', lace: '#0d0d0f' },
    tamanhos: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
    estoque: 20,
    img: 'vans-preto.jpg',
    destaque: true,
    tag: 'Best-seller'
  },
  {
    id: 'rsf-jordan-menta',
    nome: 'Jordan 1 Low Menta',
    marca: 'Nike',
    categoria: 'Casual',
    genero: 'Masculino',
    preco: 699.9,
    precoAntigo: 799.9,
    descricao: 'Cinza-névoa com swoosh grafite e cadarços verde-menta que dão o toque final. Discreto no corpo, ousado nos detalhes — para quem sabe se destacar sem gritar.',
    cores: ['#c9c9c4', '#4a4f52', '#9adfc3'],
    colorway: { base: '#d9d9d2', mesh: '#efefe9', stripe: '#4a4f52', sole: '#f2f2ee', accent: '#9adfc3', lace: '#9adfc3' },
    tamanhos: [38, 39, 40, 41, 42, 43, 44],
    estoque: 8,
    img: 'jordan-menta.jpg',
    destaque: true,
    tag: 'Edição limitada'
  },
  {
    id: 'rsf-samba-creme',
    nome: 'Samba OG Creme',
    marca: 'Adidas',
    categoria: 'Casual',
    genero: 'Feminino',
    preco: 469.9,
    precoAntigo: null,
    descricao: 'Couro off-white com as três listras em marrom-café e sola de goma caramelo. Um clássico atemporal, elegante em qualquer ocasião do dia a dia.',
    cores: ['#f2ead9', '#6b4230', '#e0a35f'],
    colorway: { base: '#f2ead9', mesh: '#f7f1e4', stripe: '#6b4230', sole: '#e0a35f', accent: '#6b4230', lace: '#f2ead9' },
    tamanhos: [34, 35, 36, 37, 38, 39, 40],
    estoque: 15,
    img: 'samba-creme.jpg',
    destaque: true,
    tag: 'Novo'
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
