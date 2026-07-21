/* ============================================================
   Camada de dados — persistência em localStorage
   Produtos / estoque / pedidos / carrinho / sessão de equipe
   ============================================================ */

import { useSyncExternalStore } from 'react';

const KEYS = {
  products: 'rsf.products.v6',
  orders: 'rsf.orders.v1',
  cart: 'rsf.cart.v4',
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
    tipo: 'Tênis',
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
    tipo: 'Tênis',
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
    tipo: 'Tênis',
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
    tipo: 'Tênis',
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
    tipo: 'Tênis',
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
  },
  {
    id: 'rsf-jordan-mostarda',
    nome: 'Jordan 1 Low Mostarda',
    marca: 'Nike',
    tipo: 'Tênis',
    categoria: 'Casual',
    genero: 'Masculino',
    preco: 699.9,
    precoAntigo: 799.9,
    descricao: 'Branco e mostarda com swoosh preto e cadarços vermelhos que roubam a cena. Um colorway quente e cheio de personalidade para quem não passa despercebido.',
    cores: ['#d8a63a', '#f4f1ea', '#161616'],
    colorway: { base: '#e7edf2', mesh: '#f4f1ea', stripe: '#161616', sole: '#f6f4ee', accent: '#d8a63a', lace: '#c8462f' },
    tamanhos: [39, 40, 41, 42, 43, 44],
    estoque: 7,
    img: 'jordan-mostarda.jpg',
    destaque: true,
    tag: 'Novo'
  },
  {
    id: 'rsf-mizuno-azul',
    nome: 'Wave Prophecy Azul',
    marca: 'Mizuno',
    tipo: 'Tênis',
    categoria: 'Corrida',
    genero: 'Unissex',
    preco: 899.9,
    precoAntigo: 1099.9,
    descricao: 'Entressola Wave em ondas visíveis, cabedal azul-gelo com detalhes marinho. Amortecimento infinito e um visual futurista que impõe presença na rua e no treino.',
    cores: ['#a9c9e0', '#1c2a52', '#c9d4dd'],
    colorway: { base: '#bcd4e6', mesh: '#a9c9e0', stripe: '#1c2a52', sole: '#e4eaf0', accent: '#1c2a52', lace: '#dfe8f0' },
    tamanhos: [39, 40, 41, 42, 43, 44],
    estoque: 6,
    img: 'mizuno-azul.jpg',
    destaque: false,
    tag: 'Premium'
  },
  {
    id: 'rsf-mizuno-preto',
    nome: 'Wave Prophecy Preto',
    marca: 'Mizuno',
    tipo: 'Tênis',
    categoria: 'Corrida',
    genero: 'Masculino',
    preco: 899.9,
    precoAntigo: null,
    descricao: 'A icônica entressola Wave em preto total, com acabamento tech e presença absoluta. Conforto de elite para quem leva performance e estilo a sério.',
    cores: ['#0e0e10', '#2a2a2e'],
    colorway: { base: '#1a1a1e', mesh: '#0e0e10', stripe: '#3a3a40', sole: '#141416', accent: '#4a4a52', lace: '#0e0e10' },
    tamanhos: [39, 40, 41, 42, 43, 44],
    estoque: 9,
    img: 'mizuno-preto.jpg',
    destaque: false,
    tag: 'Premium'
  },

  /* ---------- ÓCULOS (Casa Mikka) ---------- */
  oculosProd('rsf-oculos-01', 'Aviador Clássico', 100, null, 'Aviador atemporal com armação metálica e lentes espelhadas. Acompanha estojo de couro e flanela Mikka.', 'oculos-01.jpg', 10, true, 'Best-seller', ['#3a2a1e', '#c9a24a']),
  oculosProd('rsf-oculos-02', 'Retrô Tartaruga', 100, null, 'Armação em acetato tartaruga com lentes polarizadas. Um clássico que valoriza qualquer rosto.', 'oculos-02.jpg', 12, true, 'Novo', ['#6b4230', '#e0a35f']),
  oculosProd('rsf-oculos-03', 'Esportivo Wrap', 100, null, 'Modelo esportivo envolvente com proteção UV400 e lentes espelhadas azuis. Leve e firme no rosto.', 'oculos-03.jpg', 8, true, 'Lançamento', ['#1c2a52', '#9ccdf5']),
  oculosProd('rsf-oculos-04', 'Redondo Vintage', 100, null, 'Armação redonda metálica de inspiração vintage. Elegante e despojado ao mesmo tempo.', 'oculos-04.jpg', 14, false, null, ['#c0663a', '#e6bd8c']),
  oculosProd('rsf-oculos-05', 'Quadrado Moderno', 100, null, 'Linhas retas e armação encorpada para um visual contemporâneo. Lentes com proteção total.', 'oculos-05.jpg', 9, true, null, ['#2e2016', '#d8834e']),
  oculosProd('rsf-oculos-06', 'Aviador Espelhado', 100, null, 'Aviador com lentes espelhadas premium e acabamento impecável. O queridinho da casa.', 'oculos-06.jpg', 7, true, 'Best-seller', ['#4a4f52', '#9adfc3']),
  oculosProd('rsf-oculos-07', 'Esportivo Rainbow', 100, null, 'Lente única espelhada em degradê arco-íris. Para quem quer se destacar com estilo.', 'oculos-07.jpg', 6, true, 'Edição limitada', ['#c4499c', '#59e3d8']),
  oculosProd('rsf-oculos-08', 'Retrô Âmbar', 100, null, 'Acetato âmbar translúcido com lentes marrons. Sofisticação em tom quente.', 'oculos-08.jpg', 11, false, null, ['#8a5a3b', '#e3b768']),
  oculosProd('rsf-oculos-09', 'Piloto Degradê', 100, null, 'Estilo piloto com lentes degradê e armação leve. Conforto para o dia todo.', 'oculos-09.jpg', 10, false, null, ['#3a2a1e', '#d8a63a']),
  oculosProd('rsf-oculos-10', 'Wayfarer Noir', 100, null, 'O wayfarer preto absoluto — atemporal, versátil e sempre elegante.', 'oculos-10.jpg', 13, true, null, ['#141110', '#6c5f51']),
  oculosProd('rsf-oculos-11', 'Esportivo Azul', 100, null, 'Modelo esportivo com lentes espelhadas azuis e pegada firme. Ideal para o sol forte.', 'oculos-11.jpg', 8, false, null, ['#1c2a52', '#62a0ff']),
  oculosProd('rsf-oculos-12', 'Redondo Metal', 100, null, 'Armação metálica fina e lentes redondas espelhadas. Leveza e personalidade.', 'oculos-12.jpg', 9, false, null, ['#a38b74', '#e6bd8c']),
  oculosProd('rsf-oculos-13', 'Aviador Dourado', 100, null, 'Aviador com armação dourada e lentes premium. O toque de luxo da coleção.', 'oculos-13.jpg', 5, true, 'Premium', ['#c9a24a', '#f6ece0']),

  /* ---------- TÊNIS (fotos reais da coleção) ---------- */
  {
    id: 'rsf-nb-9060-cream',
    nome: 'New Balance 9060 Cream',
    marca: 'New Balance',
    tipo: 'Tênis',
    categoria: 'Casual',
    genero: 'Unissex',
    preco: 150,
    precoAntigo: null,
    descricao: 'A silhueta chunky do 9060 em tom creme com o "N" clássico. Camurça e mesh premium, entressola volumosa e muito conforto para o dia a dia.',
    cores: ['#e8e0d0', '#b9bec4'],
    colorway: { base: '#e8e0d0', mesh: '#f0eadd', stripe: '#9aa0a8', sole: '#efe9dc', accent: '#b9bec4', lace: '#e8e0d0' },
    tamanhos: [37, 38, 39, 40, 41, 42, 43],
    estoque: 10,
    img: 'tenis-nb-cream.jpg',
    destaque: true,
    tag: 'Novo'
  },
  {
    id: 'rsf-adidas-samba-choco',
    nome: 'Samba Chocolate',
    marca: 'Adidas',
    tipo: 'Tênis',
    categoria: 'Casual',
    genero: 'Unissex',
    preco: 150,
    precoAntigo: null,
    descricao: 'Samba em couro off-white com as três listras marrom-chocolate e sola de goma caramelo. Um clássico absoluto que combina com qualquer look.',
    cores: ['#f2ead9', '#5a3a26', '#e0a35f'],
    colorway: { base: '#f2ead9', mesh: '#f7f1e4', stripe: '#5a3a26', sole: '#e0a35f', accent: '#5a3a26', lace: '#f2ead9' },
    tamanhos: [37, 38, 39, 40, 41, 42, 43],
    estoque: 12,
    img: 'tenis-adidas-choco.jpg',
    destaque: true,
    tag: 'Best-seller'
  },
  {
    id: 'rsf-nb-9060-blush',
    nome: 'New Balance 9060 Blush',
    marca: 'New Balance',
    tipo: 'Tênis',
    categoria: 'Casual',
    genero: 'Feminino',
    preco: 100,
    precoAntigo: 150,
    descricao: 'O 9060 em tom rosé amanteigado, delicado e cheio de personalidade. Conforto de sobra numa entressola volumosa com visual atual.',
    cores: ['#e9d7ca', '#caa892'],
    colorway: { base: '#e9d7ca', mesh: '#f2e6dc', stripe: '#caa892', sole: '#f0e6dc', accent: '#caa892', lace: '#e9d7ca' },
    tamanhos: [34, 35, 36, 37, 38, 39, 40],
    estoque: 9,
    img: 'tenis-nb-bege.jpg',
    destaque: true,
    tag: 'Oferta'
  },

  /* ---------- BOLSAS (fotos reais) ---------- */
  mikkaProd('rsf-bolsa-caramelo', 'Bolsas', 'Bolsa de mão', 'Feminino', 'Bolsa Iconic Caramelo', 150, null,
    'Bolsa estruturada em couro caramelo com fecho H dourado e alça de corrente. Elegância atemporal para compor looks sofisticados.',
    'bolsa-marrom.jpg', 8, true, 'Novo', ['#a45a34', '#c9a24a']),
  mikkaProd('rsf-bolsa-terracota', 'Bolsas', 'Bolsa de mão', 'Feminino', 'Bolsa Iconic Terracota', 150, null,
    'Bolsa em couro terracota com fecho H dourado e alça de corrente removível. Um toque de cor quente para o seu dia.',
    'bolsa-rose.jpg', 7, true, null, ['#b96a4a', '#c9a24a']),
  mikkaProd('rsf-bolsa-preta', 'Bolsas', 'Bolsa de mão', 'Feminino', 'Bolsa Iconic Preta', 150, null,
    'Bolsa preta atemporal em couro com fecho H dourado e corrente. O acessório coringa que combina com tudo.',
    'bolsa-navy.jpg', 9, true, 'Best-seller', ['#121316', '#c9a24a']),

  /* ---------- PERFUMES (fotos reais) ---------- */
  mikkaProd('rsf-perfume-fabulous', 'Acessórios', 'Perfumaria', 'Feminino', 'Perfume Fabulous Red', 89.9, null,
    'Fragrância marcante em frasco vermelho translúcido com tampa dourada. Presença doce e envolvente que dura o dia todo. 50 ml.',
    'perfume-fabulous.jpg', 20, true, 'Novo', ['#8e1420', '#c9a24a']),
  mikkaProd('rsf-perfume-f1-black', 'Acessórios', 'Perfumaria', 'Masculino', 'Perfume F1 Black', 89.9, null,
    'Perfume masculino amadeirado inspirado no universo das pistas. Notas intensas e sofisticadas para marcar presença. 50 ml.',
    'perfume-f1black.jpg', 18, true, null, ['#161616', '#e3b768']),
  mikkaProd('rsf-perfume-black-oud', 'Acessórios', 'Perfumaria', 'Unissex', 'Perfume Black Oud', 89.9, null,
    'Fragrância oriental em frasco fosco com estojo verde e detalhes dourados. Amadeirado envolvente para todos os momentos. 50 ml.',
    'perfume-black.jpg', 16, true, null, ['#1c241c', '#c9a24a'])
];

/* fábrica de produtos de tamanho único (bolsas, perfumes, acessórios) */
function mikkaProd(id, tipo, categoria, genero, nome, preco, precoAntigo, descricao, img, estoque, destaque, tag, cores) {
  return {
    id, nome, marca: 'Mikka', tipo, categoria, genero,
    preco, precoAntigo, descricao, cores,
    colorway: { base: '#2e2016', mesh: '#3a2a1e', stripe: '#c0663a', sole: '#e6bd8c', accent: '#c9a24a', lace: '#e6bd8c' },
    tamanhos: ['Único'], estoque, img, destaque, tag
  };
}

/* fábrica de produtos de óculos — reduz repetição no seed */
function oculosProd(id, nome, preco, precoAntigo, descricao, img, estoque, destaque, tag, cores) {
  return {
    id, nome, marca: 'Mikka', tipo: 'Óculos', categoria: 'Óculos de sol', genero: 'Unissex',
    preco, precoAntigo, descricao, cores,
    colorway: { base: '#2e2016', mesh: '#3a2a1e', stripe: '#c0663a', sole: '#e6bd8c', accent: '#c9a24a', lace: '#e6bd8c' },
    tamanhos: ['Único'], estoque, img, destaque, tag
  };
}

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

/* ---------- categorias (tipos de produto) ---------- */
export const CATEGORIAS = ['Tênis', 'Roupas', 'Óculos', 'Bolsas', 'Cuecas', 'Acessórios'];

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
  nome: 'Casa Mikka',
  slogan: 'Elegância para o dia a dia.',
  pixTelefone: '+55 62 9236-8358',
  pixChave: '+556292368358',
  whatsapp: '556292368358',
  email: 'contato@casamikka.com.br',
  endereco: 'R. 261, 450 — Qd 24 Lt 54, St. Coimbra, Goiânia - GO, 74533-050',
  horario: 'Seg a Sáb — 9h às 19h',
  cidade: 'GOIANIA'
};
