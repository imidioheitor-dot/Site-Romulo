#!/usr/bin/env node
/* ============================================================
   Testes da API compartilhada — rodam o roteador real com um
   armazém em memória. Sem rede, sem Netlify: `npm test`.
   ============================================================ */

import { criarRoteador } from '../netlify/lib/api.mjs';
import { armazemMemoria, armazemBlobs } from '../netlify/lib/armazem.mjs';
import { hashSenha, SENHA_HASH_PADRAO } from '../netlify/lib/dados.mjs';

const SENHA = 'romulo2026';
const BASE = 'https://loja.test';

let passou = 0;
let falhou = 0;

function ok(condicao, titulo, detalhe) {
  if (condicao) { passou++; console.log(`  ✓ ${titulo}`); }
  else { falhou++; console.error(`  ✗ ${titulo}${detalhe ? `\n      ${detalhe}` : ''}`); }
}

function igual(a, b, titulo) {
  ok(JSON.stringify(a) === JSON.stringify(b), titulo, `esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`);
}

function novoServidor(inicial) {
  const armazem = armazemMemoria(inicial);
  const roteador = criarRoteador({ armazem, ambiente: {} });
  const chamar = async (metodo, caminho, { corpo, token, cabecalhos = {} } = {}) => {
    const h = { ...cabecalhos };
    if (corpo !== undefined) h['content-type'] = 'application/json';
    if (token) h.authorization = `Bearer ${token}`;
    const req = new Request(`${BASE}/api/${caminho}`, {
      method: metodo,
      headers: h,
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
    const res = await roteador(req, { ip: `teste-${Math.random()}` });
    const texto = await res.text();
    let dados = null;
    try { dados = JSON.parse(texto); } catch { /* deixa null */ }
    return { status: res.status, dados, tipo: res.headers.get('content-type') };
  };
  return { armazem, chamar };
}

const PRODUTOS = [
  { id: 'p1', nome: 'Tênis Alpha', preco: 150, estoque: 5, tamanhos: [40, 41], cores: ['#fff'], tipo: 'Tênis' },
  { id: 'p2', nome: 'Óculos Beta', preco: 100, estoque: 2, tamanhos: ['Único'], cores: ['#000'], tipo: 'Óculos' }
];

const IMG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function grupo(titulo, fn) {
  console.log(`\n${titulo}`);
  await fn();
}

/* ------------------------------------------------------------ */

await grupo('Hash da senha (compatível com o painel)', async () => {
  ok(hashSenha(SENHA) === SENHA_HASH_PADRAO, 'a senha do painel abre o backend por padrão');
  ok(hashSenha('outra-senha') !== SENHA_HASH_PADRAO, 'senha diferente gera hash diferente');
});

await grupo('Status e catálogo público', async () => {
  const { chamar } = novoServidor();
  const status = await chamar('GET', 'status');
  ok(status.status === 200, 'GET /api/status responde 200');
  ok(status.dados.servico === 'casa-mikka', 'identifica o serviço (usado para detectar o backend)');
  ok(status.dados.catalogoPublicado === false, 'começa sem catálogo publicado');

  const vazio = await chamar('GET', 'catalogo');
  igual(vazio.dados.produtos, [], 'catálogo começa vazio (site cai no modo local)');
  ok(vazio.dados.rev === 0, 'versão inicial é 0');
});

await grupo('Escrita protegida pela senha da equipe', async () => {
  const { chamar } = novoServidor();

  const semToken = await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS } });
  ok(semToken.status === 401, 'PUT /api/catalogo sem token → 401');

  const tokenErrado = await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: 'senha-errada' });
  ok(tokenErrado.status === 401, 'PUT /api/catalogo com senha errada → 401');

  const depois = await chamar('GET', 'catalogo');
  igual(depois.dados.produtos, [], 'nada foi gravado pelas tentativas negadas');

  const certo = await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: SENHA });
  ok(certo.status === 200, 'PUT /api/catalogo com a senha do painel → 200');
  ok(certo.dados.rev === 1, 'a versão sobe para 1');
  ok(certo.dados.produtos.length === 2, 'os dois produtos foram gravados');

  const pedidosSemToken = await chamar('GET', 'pedidos');
  ok(pedidosSemToken.status === 401, 'GET /api/pedidos sem token → 401 (dados de cliente protegidos)');

  const comprovanteSemToken = await chamar('GET', 'comprovante?id=X');
  ok(comprovanteSemToken.status === 401, 'GET /api/comprovante sem token → 401');
});

await grupo('Login e troca de senha', async () => {
  const { chamar } = novoServidor();

  const erro = await chamar('POST', 'login', { corpo: { senha: 'chute' } });
  ok(erro.status === 401, 'login com senha errada → 401');

  const bom = await chamar('POST', 'login', { corpo: { senha: SENHA } });
  ok(bom.status === 200 && bom.dados.token === SENHA, 'login devolve a senha como token de escrita');

  const troca = await chamar('PUT', 'senha', { corpo: { nova: 'novaSenha123' }, token: SENHA });
  ok(troca.status === 200, 'troca de senha autenticada → 200');

  const antiga = await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: SENHA });
  ok(antiga.status === 401, 'a senha antiga deixa de valer');

  const nova = await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: 'novaSenha123' });
  ok(nova.status === 200, 'a senha nova passa a valer para escrever');

  const curta = await chamar('PUT', 'senha', { corpo: { nova: '123' }, token: 'novaSenha123' });
  ok(curta.status === 400, 'recusa senha com menos de 6 caracteres');
});

await grupo('Senha vinda das variáveis de ambiente', async () => {
  const armazem = armazemMemoria();
  const roteador = criarRoteador({ armazem, ambiente: { EQUIPE_SENHA: 'senha-do-netlify' } });
  const req = (senha) => new Request(`${BASE}/api/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ senha })
  });
  const boa = await roteador(req('senha-do-netlify'), { ip: 'a' });
  ok(boa.status === 200, 'EQUIPE_SENHA no ambiente substitui a senha padrão');
  const ruim = await roteador(req(SENHA), { ip: 'b' });
  ok(ruim.status === 401, 'a senha padrão não vale quando EQUIPE_SENHA está definida');
});

await grupo('Checkout público', async () => {
  const { chamar } = novoServidor();
  await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: SENHA });

  const pedido = await chamar('POST', 'pedidos', {
    corpo: {
      cliente: { nome: 'Maria Silva', telefone: '62 99999-0000', entrega: 'retirada' },
      itens: [{ productId: 'p1', tamanho: 41, qtd: 2 }, { productId: 'p2', tamanho: 'Único', qtd: 1 }],
      comprovante: { name: 'pix.png', type: 'image/png', data: IMG_1PX }
    }
  });
  ok(pedido.status === 201, 'qualquer visitante consegue enviar um pedido (sem token)');
  ok(pedido.dados.pedido.total === 400, 'o total é calculado pelo servidor (2×150 + 1×100)');
  ok(pedido.dados.pedido.status === 'aguardando', 'nasce como "aguardando"');
  ok(pedido.dados.pedido.temComprovante === true, 'registra que há comprovante');
  ok(pedido.dados.pedido.comprovante === undefined, 'a lista não carrega o arquivo do comprovante');

  const adulterado = await chamar('POST', 'pedidos', {
    corpo: {
      cliente: { nome: 'Fraude', telefone: '1' },
      itens: [{ productId: 'p1', tamanho: 41, qtd: 1, preco: 1 }],
      total: 1
    }
  });
  ok(adulterado.dados.pedido.total === 150, 'preço mandado pelo navegador é ignorado');

  const semItens = await chamar('POST', 'pedidos', { corpo: { cliente: { nome: 'A', telefone: '1' }, itens: [] } });
  ok(semItens.status === 400, 'pedido sem itens → 400');

  const semNome = await chamar('POST', 'pedidos', { corpo: { cliente: { telefone: '1' }, itens: [{ productId: 'p1', qtd: 1 }] } });
  ok(semNome.status === 400, 'pedido sem nome do cliente → 400');

  const entregaSemEndereco = await chamar('POST', 'pedidos', {
    corpo: { cliente: { nome: 'A', telefone: '1', entrega: 'entrega' }, itens: [{ productId: 'p1', qtd: 1 }] }
  });
  ok(entregaSemEndereco.status === 400, 'entrega sem endereço → 400');

  const produtoInexistente = await chamar('POST', 'pedidos', {
    corpo: { cliente: { nome: 'A', telefone: '1' }, itens: [{ productId: 'nao-existe', qtd: 1 }] }
  });
  ok(produtoInexistente.status === 400, 'produto fora do catálogo → 400');

  const lista = await chamar('GET', 'pedidos', { token: SENHA });
  ok(lista.dados.pedidos.length === 2, 'a equipe vê só os pedidos válidos que entraram');

  const comprovante = await chamar('GET', `comprovante?id=${pedido.dados.pedido.id}`, { token: SENHA });
  ok(comprovante.status === 200 && comprovante.dados.comprovante.data === IMG_1PX, 'comprovante recuperado sob demanda');
});

await grupo('Confirmar venda baixa o estoque no servidor', async () => {
  const { chamar } = novoServidor();
  await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: SENHA });
  const criado = await chamar('POST', 'pedidos', {
    corpo: {
      cliente: { nome: 'João', telefone: '62 90000-0000' },
      itens: [{ productId: 'p1', tamanho: 40, qtd: 2 }]
    }
  });
  const id = criado.dados.pedido.id;

  const antes = await chamar('GET', 'catalogo');
  ok(antes.dados.produtos.find(p => p.id === 'p1').estoque === 5, 'estoque intacto antes de confirmar');

  const semToken = await chamar('PATCH', 'pedidos', { corpo: { id, status: 'pago' } });
  ok(semToken.status === 401, 'mudar status sem token → 401');

  const pago = await chamar('PATCH', 'pedidos', { corpo: { id, status: 'pago' }, token: SENHA });
  ok(pago.status === 200 && pago.dados.pedido.status === 'pago', 'equipe confirma a venda');
  ok(pago.dados.catalogo.produtos.find(p => p.id === 'p1').estoque === 3, 'estoque cai de 5 para 3');

  const depois = await chamar('GET', 'catalogo');
  ok(depois.dados.produtos.find(p => p.id === 'p1').estoque === 3, 'a baixa vale para todos os aparelhos');

  const enviado = await chamar('PATCH', 'pedidos', { corpo: { id, status: 'enviado' }, token: SENHA });
  ok(enviado.dados.catalogo === null, 'marcar como enviado não baixa estoque de novo');

  const dePagoPraPago = await chamar('PATCH', 'pedidos', { corpo: { id, status: 'pago' }, token: SENHA });
  ok(dePagoPraPago.dados.catalogo === null, 'reconfirmar não baixa estoque duas vezes');

  const inexistente = await chamar('PATCH', 'pedidos', { corpo: { id: 'RSFZZZ', status: 'pago' }, token: SENHA });
  ok(inexistente.status === 404, 'pedido inexistente → 404');

  const statusInvalido = await chamar('PATCH', 'pedidos', { corpo: { id, status: 'inventado' }, token: SENHA });
  ok(statusInvalido.status === 400, 'status inválido → 400');
});

await grupo('Atualização ao vivo (versões)', async () => {
  const { chamar } = novoServidor();
  await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: SENHA });

  const atual = await chamar('GET', 'catalogo');
  const rev = atual.dados.rev;

  const semMudanca = await chamar('GET', `catalogo?rev=${rev}`);
  ok(semMudanca.dados.semMudanca === true, 'consulta com a versão em mãos responde "sem mudança"');
  ok(semMudanca.dados.produtos === undefined, 'e não reenvia o catálogo inteiro');

  await chamar('PUT', 'catalogo', {
    corpo: { produtos: [{ ...PRODUTOS[0], estoque: 99 }, PRODUTOS[1]], rev },
    token: SENHA
  });

  const mudou = await chamar('GET', `catalogo?rev=${rev}`);
  ok(mudou.dados.semMudanca === undefined, 'depois de uma alteração, a resposta traz os dados');
  ok(mudou.dados.produtos.find(p => p.id === 'p1').estoque === 99, 'o outro aparelho enxerga o estoque novo');
  ok(mudou.dados.rev === rev + 1, 'a versão foi incrementada');
});

await grupo('Dois aparelhos editando ao mesmo tempo', async () => {
  const { chamar } = novoServidor();
  const inicial = await chamar('PUT', 'catalogo', { corpo: { produtos: PRODUTOS }, token: SENHA });
  const rev = inicial.dados.rev;

  const aparelhoA = await chamar('PUT', 'catalogo', {
    corpo: { produtos: [{ ...PRODUTOS[0], estoque: 10 }, PRODUTOS[1]], rev },
    token: SENHA
  });
  ok(aparelhoA.status === 200, 'o primeiro a salvar passa');

  const aparelhoB = await chamar('PUT', 'catalogo', {
    corpo: { produtos: [PRODUTOS[0], { ...PRODUTOS[1], estoque: 77 }], rev },
    token: SENHA
  });
  ok(aparelhoB.status === 409, 'o segundo recebe conflito em vez de apagar a alteração do outro');
  ok(aparelhoB.dados.produtos.find(p => p.id === 'p1').estoque === 10, 'o conflito devolve a versão mais nova para refazer');
});

await grupo('Validação de conteúdo', async () => {
  const { chamar } = novoServidor();

  const semNome = await chamar('PUT', 'catalogo', { corpo: { produtos: [{ preco: 10 }] }, token: SENHA });
  ok(semNome.status === 400, 'produto sem nome → 400');

  const naoLista = await chamar('PUT', 'catalogo', { corpo: { produtos: { nome: 'x' } }, token: SENHA });
  ok(naoLista.status === 400, 'catálogo que não é lista → 400');

  const normalizado = await chamar('PUT', 'catalogo', {
    corpo: { produtos: [{ nome: '  Tênis  ', preco: '199,00', estoque: '3', tamanhos: ['40'], img: 'foto.jpg' }] },
    token: SENHA
  });
  const p = normalizado.dados.produtos[0];
  ok(p.nome === 'Tênis', 'espaços do nome são aparados');
  ok(p.estoque === 3, 'estoque vira número');
  ok(typeof p.id === 'string' && p.id.length > 0, 'ganha um id automático');
  ok(p.preco === 0, 'preço em formato inválido não vira NaN');

  const jsonQuebrado = await (async () => {
    const armazem = armazemMemoria();
    const roteador = criarRoteador({ armazem, ambiente: {} });
    return roteador(new Request(`${BASE}/api/catalogo`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${SENHA}` },
      body: '{ isso não é json'
    }), { ip: 'x' });
  })();
  ok(jsonQuebrado.status === 400, 'corpo que não é JSON → 400');

  const comprovanteEstranho = await chamar('POST', 'pedidos', {
    corpo: {
      cliente: { nome: 'A', telefone: '1' },
      itens: [{ productId: normalizado.dados.produtos[0].id, qtd: 1 }],
      comprovante: { name: 'x.exe', type: 'application/x-msdownload', data: 'data:application/x-msdownload;base64,AAAA' }
    }
  });
  ok(comprovanteEstranho.status === 400, 'comprovante que não é imagem/PDF → 400');
});

await grupo('Rotas e caminhos', async () => {
  const { chamar } = novoServidor();
  const inexistente = await chamar('GET', 'nao-existe');
  ok(inexistente.status === 404, 'rota desconhecida → 404 em JSON');
  ok(inexistente.tipo.includes('application/json'), 'erros também são JSON (o cliente sabe interpretar)');

  const armazem = armazemMemoria();
  const roteador = criarRoteador({ armazem, ambiente: {} });
  const viaFuncao = await roteador(new Request(`${BASE}/.netlify/functions/api/status`), { ip: 'x' });
  ok(viaFuncao.status === 200, 'funciona também no caminho /.netlify/functions/api/*');
});

await grupo('Freio contra chute de senha', async () => {
  const roteador = criarRoteador({ armazem: armazemMemoria(), ambiente: {} });
  const ip = 'ip-do-atacante';
  let bloqueou = false;

  for (let i = 0; i < 20 && !bloqueou; i++) {
    const r = await roteador(new Request(`${BASE}/api/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ senha: `chute-${i}` })
    }), { ip });
    if (r.status === 429) bloqueou = true;
  }
  ok(bloqueou, 'tentativas repetidas do mesmo IP acabam bloqueadas (429)');

  const outroIp = await roteador(new Request(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ senha: SENHA })
  }), { ip: 'ip-da-loja' });
  ok(outroIp.status === 200, 'o bloqueio não atinge quem está com a senha certa em outro IP');
});

await grupo('Camada do Netlify Blobs', async () => {
  /* Dublê do Store do @netlify/blobs: só o que a nossa camada usa. */
  const dados = new Map();
  let etagSeq = 0;
  const store = {
    async getWithMetadata(chave) {
      const reg = dados.get(chave);
      return reg ? { data: reg.valor, etag: reg.etag, metadata: {} } : null;
    },
    async setJSON(chave, valor, opcoes = {}) {
      const atual = dados.get(chave);
      if (opcoes.onlyIfNew && atual) return { modified: false };
      if (opcoes.onlyIfMatch && (!atual || atual.etag !== opcoes.onlyIfMatch)) return { modified: false };
      const etag = `e${++etagSeq}`;
      dados.set(chave, { valor, etag });
      return { modified: true, etag };
    },
    async delete(chave) { dados.delete(chave); }
  };

  const armazem = armazemBlobs(store);
  ok((await armazem.ler('x')) === null, 'chave inexistente devolve null');

  const primeiro = await armazem.gravar('x', { a: 1 }, { novo: true });
  ok(primeiro.ok === true, 'primeira gravação passa com onlyIfNew');

  const duplicado = await armazem.gravar('x', { a: 2 }, { novo: true });
  ok(duplicado.ok === false, 'segunda gravação com onlyIfNew é recusada (evita sobrescrever)');

  const lido = await armazem.ler('x');
  igual(lido.valor, { a: 1 }, 'valor lido de volta');

  const comEtag = await armazem.gravar('x', { a: 3 }, { etag: lido.etag });
  ok(comEtag.ok === true, 'gravação com o etag correto passa');

  const etagVelho = await armazem.gravar('x', { a: 4 }, { etag: lido.etag });
  ok(etagVelho.ok === false, 'gravação com etag velho é recusada (é o que gera o 409)');

  // o roteador inteiro rodando sobre essa camada
  const roteador = criarRoteador({ armazem: armazemBlobs(store), ambiente: {} });
  const escreve = await roteador(new Request(`${BASE}/api/catalogo`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${SENHA}` },
    body: JSON.stringify({ produtos: PRODUTOS })
  }), { ip: 'blobs' });
  ok(escreve.status === 200, 'a API grava normalmente através do Netlify Blobs');

  const le = await roteador(new Request(`${BASE}/api/catalogo`), { ip: 'blobs' });
  const corpo = await le.json();
  ok(corpo.produtos.length === 2, 'e lê de volta o que gravou');
});

await grupo('Function da Netlify sem Blobs configurado', async () => {
  const { default: handler } = await import('../netlify/functions/api.mjs');
  const res = await handler(new Request(`${BASE}/api/status`), {});
  ok(res.status === 503, 'sem ambiente de Blobs a função responde 503 (site cai no modo local)');
  const corpo = await res.json();
  ok(corpo.servico === 'casa-mikka', 'e ainda assim se identifica em JSON');
});

console.log(`\n${falhou ? '✗' : '✓'} ${passou} verificações passaram, ${falhou} falharam.\n`);
process.exit(falhou ? 1 : 0);
