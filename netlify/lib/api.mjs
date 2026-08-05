/* ============================================================
   Casa Mikka — roteador da API compartilhada (estoque + pedidos)

   Recebe/devolve Request/Response padrão da web, então roda tanto dentro
   de uma Netlify Function quanto num servidor Node comum (usado nos testes
   e no `npm run dev`). Todo o armazenamento passa pelo "armazém", uma
   interface mínima que o Netlify Blobs (ou a memória, nos testes) implementa.
   ============================================================ */

import {
  SERVICO, SENHA_HASH_PADRAO, LIMITES, STATUS_PEDIDO,
  ErroApi, hashSenha, statusValido,
  normalizarCatalogo, normalizarCliente, normalizarItens, normalizarComprovante,
  novoIdPedido, pedidoResumido
} from './dados.mjs';

const CHAVES = {
  catalogo: 'catalogo',
  pedidos: 'pedidos',
  equipe: 'equipe',
  comprovante: id => `comprovante/${id}`
};

const CATALOGO_VAZIO = { rev: 0, atualizadoEm: null, produtos: [] };
const PEDIDOS_VAZIO = { rev: 0, atualizadoEm: null, pedidos: [] };

/* ---------- respostas ---------- */

function json(dados, { status = 200, headers } = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });
}

function erro(status, mensagem, extra) {
  return json({ ok: false, servico: SERVICO, erro: mensagem, ...(extra || {}) }, { status });
}

/* ---------- proteção contra tentativa de senha em massa ----------
   Best-effort: vive na memória da instância da função. Não substitui uma
   senha forte, mas encarece o chute automatizado. */
const tentativas = new Map();
const JANELA_MS = 5 * 60 * 1000;
const MAX_TENTATIVAS = 12;

function registrarFalha(ip) {
  const agora = Date.now();
  const atual = tentativas.get(ip);
  if (!atual || agora - atual.inicio > JANELA_MS) tentativas.set(ip, { inicio: agora, n: 1 });
  else atual.n += 1;
  if (tentativas.size > 500) tentativas.clear();
}

function bloqueado(ip) {
  const atual = tentativas.get(ip);
  if (!atual) return false;
  if (Date.now() - atual.inicio > JANELA_MS) { tentativas.delete(ip); return false; }
  return atual.n >= MAX_TENTATIVAS;
}

function limparFalhas(ip) { tentativas.delete(ip); }

/* comparação de tamanho constante para não vazar o hash por tempo de resposta */
function mesmoSegredo(a, b) {
  const x = String(a || '');
  const y = String(b || '');
  let dif = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) dif |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return dif === 0;
}

/* ---------- leitura/escrita com repetição em caso de concorrência ---------- */

async function lerDoc(armazem, chave, vazio) {
  const reg = await armazem.ler(chave);
  if (!reg || !reg.valor) return { doc: { ...vazio }, etag: reg ? reg.etag : undefined, novo: true };
  return { doc: { ...vazio, ...reg.valor }, etag: reg.etag, novo: false };
}

async function atualizarDoc(armazem, chave, vazio, mutar) {
  let ultimo;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const { doc, etag, novo } = await lerDoc(armazem, chave, vazio);
    const resultado = await mutar(doc);
    if (resultado && resultado.abortar) return resultado;
    const proximo = {
      ...(resultado && resultado.doc ? resultado.doc : doc),
      rev: (doc.rev || 0) + 1,
      atualizadoEm: new Date().toISOString()
    };
    const gravou = await armazem.gravar(chave, proximo, novo ? { novo: true } : { etag });
    if (gravou.ok) return { doc: proximo, extra: resultado && resultado.extra };
    ultimo = gravou;
  }
  throw new ErroApi(409, 'Outra pessoa salvou ao mesmo tempo. Recarregue e tente de novo.', ultimo);
}

/* ---------- senha da equipe ---------- */

async function hashAtivo(armazem, ambiente) {
  const reg = await armazem.ler(CHAVES.equipe);
  if (reg && reg.valor && reg.valor.senhaHash) return reg.valor.senhaHash;
  if (ambiente.EQUIPE_SENHA_HASH) return ambiente.EQUIPE_SENHA_HASH;
  if (ambiente.EQUIPE_SENHA) return hashSenha(ambiente.EQUIPE_SENHA);
  return SENHA_HASH_PADRAO;
}

function tokenDaRequisicao(req) {
  const cabecalho = req.headers.get('authorization') || '';
  const bearer = cabecalho.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1].trim();
  return (req.headers.get('x-equipe-senha') || '').trim();
}

async function exigirEquipe(req, ctx) {
  const token = tokenDaRequisicao(req);
  if (!token) throw new ErroApi(401, 'Faça login na área da equipe para alterar dados.');
  if (bloqueado(ctx.ip)) throw new ErroApi(429, 'Muitas tentativas. Aguarde alguns minutos.');
  const esperado = await hashAtivo(ctx.armazem, ctx.ambiente);
  if (!mesmoSegredo(hashSenha(token), esperado)) {
    registrarFalha(ctx.ip);
    throw new ErroApi(401, 'Senha da equipe incorreta.');
  }
  limparFalhas(ctx.ip);
  return token;
}

/* ---------- corpo da requisição ---------- */

async function corpoJson(req) {
  const bruto = await req.text();
  if (bruto.length > LIMITES.corpoRequisicao) throw new ErroApi(413, 'Envio grande demais.');
  if (!bruto.trim()) return {};
  try {
    return JSON.parse(bruto);
  } catch {
    throw new ErroApi(400, 'Corpo da requisição não é um JSON válido.');
  }
}

/* ============================================================
   Rotas
   ============================================================ */

async function rotaStatus(req, ctx) {
  const { doc: catalogo } = await lerDoc(ctx.armazem, CHAVES.catalogo, CATALOGO_VAZIO);
  return json({
    ok: true,
    servico: SERVICO,
    backend: 'netlify-blobs',
    versao: 1,
    catalogoPublicado: catalogo.produtos.length > 0,
    produtos: catalogo.produtos.length,
    rev: catalogo.rev || 0,
    atualizadoEm: catalogo.atualizadoEm
  });
}

async function rotaCatalogoGet(req, ctx) {
  const { doc } = await lerDoc(ctx.armazem, CHAVES.catalogo, CATALOGO_VAZIO);
  const rev = doc.rev || 0;
  const conhecido = new URL(req.url).searchParams.get('rev');

  // resposta curtinha quando o navegador já está com a versão atual
  if (conhecido != null && conhecido !== '' && Number(conhecido) === rev) {
    return json({ ok: true, servico: SERVICO, rev, semMudanca: true, atualizadoEm: doc.atualizadoEm });
  }

  return json({
    ok: true,
    servico: SERVICO,
    rev,
    atualizadoEm: doc.atualizadoEm,
    publicado: doc.produtos.length > 0,
    produtos: doc.produtos
  });
}

async function rotaCatalogoPut(req, ctx) {
  await exigirEquipe(req, ctx);
  const corpo = await corpoJson(req);
  const produtos = normalizarCatalogo(corpo.produtos);
  const revBase = corpo.rev == null ? null : Number(corpo.rev);

  const resultado = await atualizarDoc(ctx.armazem, CHAVES.catalogo, CATALOGO_VAZIO, doc => {
    if (revBase != null && Number.isFinite(revBase) && (doc.rev || 0) !== revBase) {
      return { abortar: true, conflito: doc };
    }
    return { doc: { ...doc, produtos } };
  });

  if (resultado.abortar) {
    return json({
      ok: false,
      servico: SERVICO,
      erro: 'O catálogo foi alterado em outro aparelho. Atualizamos a sua tela com a versão mais recente.',
      conflito: true,
      rev: resultado.conflito.rev || 0,
      atualizadoEm: resultado.conflito.atualizadoEm,
      produtos: resultado.conflito.produtos
    }, { status: 409 });
  }

  return json({
    ok: true,
    servico: SERVICO,
    rev: resultado.doc.rev,
    atualizadoEm: resultado.doc.atualizadoEm,
    produtos: resultado.doc.produtos
  });
}

async function rotaPedidosGet(req, ctx) {
  await exigirEquipe(req, ctx);
  const { doc } = await lerDoc(ctx.armazem, CHAVES.pedidos, PEDIDOS_VAZIO);
  const rev = doc.rev || 0;
  const conhecido = new URL(req.url).searchParams.get('rev');
  if (conhecido != null && conhecido !== '' && Number(conhecido) === rev) {
    return json({ ok: true, servico: SERVICO, rev, semMudanca: true, atualizadoEm: doc.atualizadoEm });
  }
  return json({
    ok: true,
    servico: SERVICO,
    rev,
    atualizadoEm: doc.atualizadoEm,
    pedidos: doc.pedidos.map(pedidoResumido)
  });
}

/* Checkout público: qualquer visitante pode criar um pedido, mas quem manda
   nos preços é o catálogo do servidor. */
async function rotaPedidosPost(req, ctx) {
  const corpo = await corpoJson(req);
  const { doc: catalogo } = await lerDoc(ctx.armazem, CHAVES.catalogo, CATALOGO_VAZIO);
  if (!catalogo.produtos.length) {
    throw new ErroApi(503, 'A loja ainda não publicou o catálogo. Tente novamente em instantes.');
  }

  const cliente = normalizarCliente(corpo.cliente);
  const { itens, total } = normalizarItens(corpo.itens, catalogo.produtos);
  const comprovante = normalizarComprovante(corpo.comprovante);

  const agora = Date.now();
  let id = novoIdPedido(agora);

  const resultado = await atualizarDoc(ctx.armazem, CHAVES.pedidos, PEDIDOS_VAZIO, doc => {
    let n = 0;
    while (doc.pedidos.some(p => p.id === id)) id = novoIdPedido(agora + ++n);
    const pedido = {
      id,
      criadoEm: new Date().toISOString(),
      status: STATUS_PEDIDO.AGUARDANDO,
      cliente,
      itens,
      total,
      temComprovante: !!comprovante,
      comprovanteNome: comprovante ? comprovante.name : null,
      comprovanteTipo: comprovante ? comprovante.type : null
    };
    const pedidos = [pedido, ...doc.pedidos].slice(0, LIMITES.pedidosGuardados);
    return { doc: { ...doc, pedidos }, extra: pedido };
  });

  if (comprovante) {
    await ctx.armazem.gravar(CHAVES.comprovante(id), comprovante, {});
  }

  return json({ ok: true, servico: SERVICO, rev: resultado.doc.rev, pedido: resultado.extra }, { status: 201 });
}

/* Mudança de status pela equipe. Confirmar a venda baixa o estoque — a
   baixa acontece no servidor, então vale para todos os aparelhos. */
async function rotaPedidosPatch(req, ctx) {
  await exigirEquipe(req, ctx);
  const corpo = await corpoJson(req);
  const id = String(corpo.id || '').trim();
  const status = String(corpo.status || '').trim();
  if (!id) throw new ErroApi(400, 'Informe o pedido.');
  if (!statusValido(status)) throw new ErroApi(400, 'Status inválido.');

  let baixarEstoque = null;

  const resultado = await atualizarDoc(ctx.armazem, CHAVES.pedidos, PEDIDOS_VAZIO, doc => {
    const pedidos = doc.pedidos.slice();
    const i = pedidos.findIndex(p => p.id === id);
    if (i < 0) return { abortar: true, naoEncontrado: true };
    const pedido = { ...pedidos[i] };
    if (status === STATUS_PEDIDO.PAGO && pedido.status === STATUS_PEDIDO.AGUARDANDO) {
      baixarEstoque = pedido.itens;
    } else {
      baixarEstoque = null;
    }
    pedido.status = status;
    pedido.atualizadoEm = new Date().toISOString();
    pedidos[i] = pedido;
    return { doc: { ...doc, pedidos }, extra: pedido };
  });

  if (resultado.abortar) throw new ErroApi(404, 'Pedido não encontrado.');

  let catalogoFinal = null;
  if (baixarEstoque) {
    const r = await atualizarDoc(ctx.armazem, CHAVES.catalogo, CATALOGO_VAZIO, doc => {
      const produtos = doc.produtos.map(p => {
        const item = baixarEstoque.find(i => i.productId === p.id);
        if (!item) return p;
        return { ...p, estoque: Math.max(0, (p.estoque || 0) - item.qtd) };
      });
      return { doc: { ...doc, produtos } };
    });
    catalogoFinal = { rev: r.doc.rev, produtos: r.doc.produtos };
  }

  return json({
    ok: true,
    servico: SERVICO,
    rev: resultado.doc.rev,
    pedido: resultado.extra,
    catalogo: catalogoFinal
  });
}

async function rotaComprovante(req, ctx) {
  await exigirEquipe(req, ctx);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) throw new ErroApi(400, 'Informe o pedido.');
  const reg = await ctx.armazem.ler(CHAVES.comprovante(id));
  if (!reg || !reg.valor) throw new ErroApi(404, 'Comprovante não encontrado.');
  return json({ ok: true, servico: SERVICO, comprovante: reg.valor });
}

/* Login: confere a senha e devolve o token de escrita (a própria senha). */
async function rotaLogin(req, ctx) {
  const corpo = await corpoJson(req);
  const senha = String(corpo.senha || '');
  if (!senha) throw new ErroApi(400, 'Informe a senha.');
  if (bloqueado(ctx.ip)) throw new ErroApi(429, 'Muitas tentativas. Aguarde alguns minutos.');

  const esperado = await hashAtivo(ctx.armazem, ctx.ambiente);
  if (!mesmoSegredo(hashSenha(senha), esperado)) {
    registrarFalha(ctx.ip);
    throw new ErroApi(401, 'Senha da equipe incorreta.');
  }
  limparFalhas(ctx.ip);
  return json({ ok: true, servico: SERVICO, token: senha });
}

async function rotaSenha(req, ctx) {
  await exigirEquipe(req, ctx);
  const corpo = await corpoJson(req);
  const nova = String(corpo.nova || '');
  if (nova.length < 6) throw new ErroApi(400, 'A nova senha precisa ter ao menos 6 caracteres.');
  await ctx.armazem.gravar(CHAVES.equipe, { senhaHash: hashSenha(nova), atualizadoEm: new Date().toISOString() }, {});
  return json({ ok: true, servico: SERVICO, token: nova });
}

/* ============================================================
   Roteamento
   ============================================================ */

const ROTAS = {
  'GET status': rotaStatus,
  'GET catalogo': rotaCatalogoGet,
  'PUT catalogo': rotaCatalogoPut,
  'POST catalogo': rotaCatalogoPut,
  'GET pedidos': rotaPedidosGet,
  'POST pedidos': rotaPedidosPost,
  'PATCH pedidos': rotaPedidosPatch,
  'GET comprovante': rotaComprovante,
  'POST login': rotaLogin,
  'PUT senha': rotaSenha,
  'POST senha': rotaSenha
};

/* aceita /api/x, /.netlify/functions/api/x e /api/api/x (proxies) */
function recurso(url) {
  let caminho = new URL(url).pathname;
  caminho = caminho.replace(/^\/\.netlify\/functions\/api/, '');
  caminho = caminho.replace(/^\/api/, '');
  const partes = caminho.split('/').filter(Boolean);
  return partes[0] || 'status';
}

function cabecalhosCors(ambiente, origem) {
  const permitidas = String(ambiente.API_ORIGENS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!permitidas.length || !origem) return null;
  if (!permitidas.includes(origem) && !permitidas.includes('*')) return null;
  return {
    'access-control-allow-origin': origem,
    'access-control-allow-headers': 'content-type, authorization, x-equipe-senha',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

export function criarRoteador({ armazem, ambiente = {} }) {
  return async function roteador(req, extra = {}) {
    const origem = req.headers.get('origin');
    const cors = cabecalhosCors(ambiente, origem);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: cors ? 204 : 405, headers: cors || {} });
    }

    const ctx = {
      armazem,
      ambiente,
      ip: extra.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'desconhecido'
    };

    const chave = `${req.method} ${recurso(req.url)}`;
    const rota = ROTAS[chave];

    let resposta;
    if (!rota) {
      resposta = erro(404, 'Rota não encontrada.');
    } else {
      try {
        resposta = await rota(req, ctx);
      } catch (e) {
        if (e instanceof ErroApi) {
          resposta = erro(e.status, e.message, e.extra && e.extra.conflito ? { conflito: true } : null);
        } else {
          console.error('[api] falha inesperada', e);
          resposta = erro(500, 'Falha no servidor. Tente novamente.');
        }
      }
    }

    if (cors) {
      const cabecalhos = new Headers(resposta.headers);
      Object.entries(cors).forEach(([k, v]) => cabecalhos.set(k, v));
      return new Response(resposta.body, { status: resposta.status, headers: cabecalhos });
    }
    return resposta;
  };
}

export { CHAVES, CATALOGO_VAZIO, PEDIDOS_VAZIO };
