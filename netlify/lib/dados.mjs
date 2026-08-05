/* ============================================================
   Casa Mikka — regras de dados compartilhadas pelo backend
   Validação/normalização de catálogo, pedidos e senha.
   Sem dependência de Netlify: dá para testar em Node puro.
   ============================================================ */

export const SERVICO = 'casa-mikka';

/* Hash idêntico ao usado no navegador (src/lib/store.js) para que a MESMA
   senha do painel Equipe sirva como token de escrita da API. */
export function hashSenha(senha) {
  let h = 5381;
  const txt = String(senha ?? '');
  for (let i = 0; i < txt.length; i++) h = ((h << 5) + h + txt.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36) + txt.length;
}

/* Hash da senha inicial (`romulo2026`). Serve de padrão quando nenhuma senha
   foi definida via variável de ambiente nem trocada no painel. */
export const SENHA_HASH_PADRAO = 'hltbjm510';

export const LIMITES = {
  produtos: 500,
  itensPorPedido: 50,
  qtdPorItem: 50,
  pedidosGuardados: 800,
  textoCurto: 140,
  textoMedio: 400,
  textoLongo: 2000,
  imagemProduto: 2_000_000,   // ~2 MB por foto embutida (data URL)
  comprovante: 5_500_000,     // ~5,5 MB de data URL (o cliente já reduz antes)
  corpoRequisicao: 24_000_000
};

export const STATUS_PEDIDO = {
  AGUARDANDO: 'aguardando',
  PAGO: 'pago',
  ENVIADO: 'enviado',
  CANCELADO: 'cancelado'
};

const STATUS_VALIDOS = new Set(Object.values(STATUS_PEDIDO));

export function statusValido(s) {
  return STATUS_VALIDOS.has(s);
}

/* ---------------- utilidades ---------------- */

export class ErroApi extends Error {
  constructor(status, mensagem, extra) {
    super(mensagem);
    this.status = status;
    this.extra = extra || null;
  }
}

function texto(valor, max, { obrigatorio = false, campo = 'campo' } = {}) {
  if (valor == null) {
    if (obrigatorio) throw new ErroApi(400, `Informe ${campo}.`);
    return '';
  }
  const t = String(valor).trim();
  if (obrigatorio && !t) throw new ErroApi(400, `Informe ${campo}.`);
  if (t.length > max) throw new ErroApi(400, `O ${campo} é longo demais (máx. ${max} caracteres).`);
  return t;
}

function numero(valor, { min = 0, max = 10_000_000, padrao = 0 } = {}) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, n));
}

function inteiro(valor, { min = 0, max = 1_000_000, padrao = 0 } = {}) {
  const n = parseInt(valor, 10);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, n));
}

function listaDeCores(cores) {
  if (!Array.isArray(cores)) return [];
  return cores.slice(0, 12).map(c => texto(c, 40, { campo: 'cor' })).filter(Boolean);
}

function tamanhos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .slice(0, 40)
    .map(t => (typeof t === 'number' && Number.isFinite(t) ? t : texto(t, 20, { campo: 'tamanho' })))
    .filter(t => t !== '');
}

const CHAVES_COLORWAY = ['base', 'mesh', 'stripe', 'sole', 'accent', 'lace'];

function colorway(cw) {
  if (!cw || typeof cw !== 'object') return undefined;
  const saida = {};
  CHAVES_COLORWAY.forEach(k => {
    if (cw[k] != null) saida[k] = texto(cw[k], 40, { campo: 'cor' });
  });
  return Object.keys(saida).length ? saida : undefined;
}

/* Aceita nome de arquivo (foto em /public/products), URL http(s) ou data URL. */
function imagemProduto(img) {
  if (!img) return '';
  const t = String(img);
  if (t.startsWith('data:')) {
    if (!/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(t)) {
      throw new ErroApi(400, 'Formato de imagem não suportado.');
    }
    if (t.length > LIMITES.imagemProduto) {
      throw new ErroApi(413, 'Foto de produto grande demais. Reduza a imagem e tente de novo.');
    }
    return t;
  }
  return texto(t, 500, { campo: 'nome da imagem' });
}

export function novoId(prefixo = 'rsf') {
  return `${prefixo}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

/* ---------------- catálogo ---------------- */

export function normalizarProduto(p) {
  if (!p || typeof p !== 'object') throw new ErroApi(400, 'Produto inválido.');
  const produto = {
    id: texto(p.id, 80, { campo: 'id do produto' }) || novoId(),
    nome: texto(p.nome, LIMITES.textoCurto, { obrigatorio: true, campo: 'nome do produto' }),
    marca: texto(p.marca, LIMITES.textoCurto, { campo: 'marca' }),
    tipo: texto(p.tipo, LIMITES.textoCurto, { campo: 'categoria' }) || 'Tênis',
    categoria: texto(p.categoria, LIMITES.textoCurto, { campo: 'subcategoria' }),
    genero: texto(p.genero, 40, { campo: 'gênero' }) || 'Unissex',
    preco: numero(p.preco, { min: 0 }),
    precoAntigo: p.precoAntigo == null || p.precoAntigo === '' ? null : numero(p.precoAntigo, { min: 0 }),
    descricao: texto(p.descricao, LIMITES.textoLongo, { campo: 'descrição' }),
    cores: listaDeCores(p.cores),
    tamanhos: tamanhos(p.tamanhos),
    estoque: inteiro(p.estoque, { min: 0, max: 100_000 }),
    img: imagemProduto(p.img),
    destaque: !!p.destaque,
    tag: p.tag ? texto(p.tag, 40, { campo: 'etiqueta' }) : null
  };
  const cw = colorway(p.colorway);
  if (cw) produto.colorway = cw;
  return produto;
}

export function normalizarCatalogo(lista) {
  if (!Array.isArray(lista)) throw new ErroApi(400, 'O catálogo precisa ser uma lista de produtos.');
  if (lista.length > LIMITES.produtos) {
    throw new ErroApi(413, `Catálogo com produtos demais (máx. ${LIMITES.produtos}).`);
  }
  const vistos = new Set();
  return lista.map(p => {
    const produto = normalizarProduto(p);
    while (vistos.has(produto.id)) produto.id = novoId();
    vistos.add(produto.id);
    return produto;
  });
}

/* ---------------- pedidos ---------------- */

export function normalizarCliente(c) {
  if (!c || typeof c !== 'object') throw new ErroApi(400, 'Dados do cliente ausentes.');
  const entrega = c.entrega === 'entrega' ? 'entrega' : 'retirada';
  const cliente = {
    nome: texto(c.nome, LIMITES.textoCurto, { obrigatorio: true, campo: 'nome' }),
    telefone: texto(c.telefone, 40, { obrigatorio: true, campo: 'telefone' }),
    entrega,
    endereco: texto(c.endereco, LIMITES.textoMedio, { campo: 'endereço' }),
    obs: texto(c.obs, LIMITES.textoMedio, { campo: 'observação' })
  };
  if (entrega === 'entrega' && !cliente.endereco) {
    throw new ErroApi(400, 'Informe o endereço de entrega.');
  }
  return cliente;
}

/* Os preços vêm SEMPRE do catálogo no servidor — o que o navegador manda
   sobre valores é ignorado, para o total não poder ser adulterado. */
export function normalizarItens(itens, produtos) {
  if (!Array.isArray(itens) || !itens.length) throw new ErroApi(400, 'O pedido está sem itens.');
  if (itens.length > LIMITES.itensPorPedido) throw new ErroApi(400, 'Pedido com itens demais.');

  const porId = new Map(produtos.map(p => [p.id, p]));
  const saida = itens.map(item => {
    const productId = texto(item && item.productId, 80, { obrigatorio: true, campo: 'produto' });
    const produto = porId.get(productId);
    if (!produto) throw new ErroApi(400, 'Um dos produtos do pedido não existe mais no catálogo.');
    const qtd = inteiro(item.qtd, { min: 1, max: LIMITES.qtdPorItem, padrao: 1 });
    return {
      productId,
      nome: produto.nome,
      tamanho: texto(item.tamanho, 20, { campo: 'tamanho' }) || 'Único',
      qtd,
      preco: produto.preco
    };
  });

  const total = Math.round(saida.reduce((s, i) => s + i.preco * i.qtd, 0) * 100) / 100;
  return { itens: saida, total };
}

export function normalizarComprovante(c) {
  if (!c) return null;
  if (typeof c !== 'object') throw new ErroApi(400, 'Comprovante inválido.');
  const data = String(c.data || '');
  if (!/^data:(image\/[a-z0-9.+-]+|application\/pdf);base64,/i.test(data)) {
    throw new ErroApi(400, 'O comprovante precisa ser uma imagem ou PDF.');
  }
  if (data.length > LIMITES.comprovante) {
    throw new ErroApi(413, 'Comprovante grande demais (máx. ~4 MB). Envie um print menor.');
  }
  return {
    name: texto(c.name, LIMITES.textoCurto, { campo: 'nome do arquivo' }) || 'comprovante',
    type: texto(c.type, 80, { campo: 'tipo do arquivo' }) || data.slice(5, data.indexOf(';')),
    data
  };
}

export function novoIdPedido(agora = Date.now()) {
  return 'RSF' + agora.toString(36).toUpperCase().slice(-6);
}

/* Versão pública do pedido: sem o comprovante (que fica num blob à parte). */
export function pedidoResumido(pedido) {
  const { comprovante, ...resto } = pedido;
  return resto;
}
