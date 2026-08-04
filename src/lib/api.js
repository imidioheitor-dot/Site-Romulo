/* ============================================================
   Cliente da API compartilhada (Netlify Functions + Netlify Blobs)

   Regra de ouro: o site NUNCA pode quebrar por causa do backend.
   Se a API não existir (site aberto como arquivo, hospedagem estática,
   função fora do ar), tudo continua funcionando em modo local.
   ============================================================ */

const BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || '/api';
const SERVICO = 'casa-mikka';
const TEMPO_LIMITE = 12000;

export const ESTADO = {
  DESCONHECIDO: 'desconhecido',
  ONLINE: 'online',
  OFFLINE: 'offline'
};

let estado = ESTADO.DESCONHECIDO;
let ultimoErro = null;
const ouvintes = new Set();

export function estadoBackend() { return estado; }
export function erroBackend() { return ultimoErro; }
export function backendAtivo() { return estado === ESTADO.ONLINE; }

export function ouvirBackend(cb) {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}

function definirEstado(novo, erro) {
  ultimoErro = erro || null;
  if (estado === novo) return;
  estado = novo;
  ouvintes.forEach(cb => { try { cb(estado); } catch { /* ignora */ } });
}

export class ErroApi extends Error {
  constructor(status, mensagem, dados) {
    super(mensagem);
    this.status = status;
    this.dados = dados || null;
  }
  get conflito() { return this.status === 409; }
  get naoAutorizado() { return this.status === 401 || this.status === 403; }
  /* offline = não conseguimos falar com a API (rede/rota inexistente) */
  get offline() { return this.status === 0; }
}

function comTempoLimite(ms) {
  if (typeof AbortController === 'undefined') return { sinal: undefined, limpar: () => {} };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { sinal: ctrl.signal, limpar: () => clearTimeout(t) };
}

/* Chamada crua. Devolve o JSON já validado como "nosso" backend. */
export async function chamar(recurso, { metodo = 'GET', corpo, token, tempoLimite = TEMPO_LIMITE } = {}) {
  if (typeof fetch !== 'function') throw new ErroApi(0, 'Navegador sem suporte a fetch.');

  const { sinal, limpar } = comTempoLimite(tempoLimite);
  const cabecalhos = { accept: 'application/json' };
  if (corpo !== undefined) cabecalhos['content-type'] = 'application/json';
  if (token) cabecalhos.authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${BASE}/${recurso}`.replace(/([^:]\/)\/+/g, '$1'), {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: sinal,
      credentials: 'same-origin'
    });
  } catch (e) {
    definirEstado(ESTADO.OFFLINE, e && e.message);
    throw new ErroApi(0, 'Não foi possível falar com o servidor da loja.');
  } finally {
    limpar();
  }

  // Hospedagem sem funções costuma devolver o index.html com status 200:
  // isso NÃO é a nossa API.
  const tipo = resposta.headers.get('content-type') || '';
  if (!tipo.includes('application/json')) {
    definirEstado(ESTADO.OFFLINE, 'resposta não-JSON');
    throw new ErroApi(0, 'Servidor da loja não está disponível nesta hospedagem.');
  }

  let dados;
  try {
    dados = await resposta.json();
  } catch {
    definirEstado(ESTADO.OFFLINE, 'JSON inválido');
    throw new ErroApi(0, 'Resposta inválida do servidor da loja.');
  }

  if (dados && dados.servico !== SERVICO) {
    definirEstado(ESTADO.OFFLINE, 'serviço desconhecido');
    throw new ErroApi(0, 'Servidor da loja não está disponível nesta hospedagem.');
  }

  if (resposta.status === 503) {
    definirEstado(ESTADO.OFFLINE, dados && dados.erro);
    throw new ErroApi(503, (dados && dados.erro) || 'Servidor da loja indisponível.', dados);
  }

  // Chegou resposta nossa: o backend existe, mesmo que esta chamada tenha
  // dado 401/409 — esses são erros de uso, não de disponibilidade.
  definirEstado(ESTADO.ONLINE, null);

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, (dados && dados.erro) || 'Não foi possível completar a operação.', dados);
  }
  return dados;
}

/* ---------- rotas ---------- */

export function buscarCatalogo(rev) {
  const q = rev == null ? '' : `?rev=${encodeURIComponent(rev)}`;
  return chamar(`catalogo${q}`);
}

export function publicarCatalogo(produtos, { rev, token } = {}) {
  return chamar('catalogo', { metodo: 'PUT', corpo: { produtos, rev }, token });
}

export function entrar(senha) {
  return chamar('login', { metodo: 'POST', corpo: { senha } });
}

export function trocarSenhaRemota(nova, token) {
  return chamar('senha', { metodo: 'PUT', corpo: { nova }, token });
}

export function buscarPedidos(token, rev) {
  const q = rev == null ? '' : `?rev=${encodeURIComponent(rev)}`;
  return chamar(`pedidos${q}`, { token });
}

export function enviarPedido(pedido) {
  return chamar('pedidos', { metodo: 'POST', corpo: pedido, tempoLimite: 30000 });
}

export function mudarStatusPedido(id, status, token) {
  return chamar('pedidos', { metodo: 'PATCH', corpo: { id, status }, token });
}

export function buscarComprovante(id, token) {
  return chamar(`comprovante?id=${encodeURIComponent(id)}`, { token, tempoLimite: 30000 });
}
