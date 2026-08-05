#!/usr/bin/env node
/* ============================================================
   Teste de ponta a ponta no navegador (Chromium via Playwright).

   Sobe o site construído (dist/) junto com o servidor local da API — o
   mesmo roteador que roda na Netlify Function — e checa, de verdade:

     1. catálogo compartilhado (o que a equipe publica, o cliente vê)
     2. escrita protegida pela senha do painel
     3. checkout público de ponta a ponta
     4. atualização ao vivo entre dois aparelhos
     5. fallback: o site sem backend nenhum continua funcionando

   Requer: npm run build  +  npm i -D playwright-core
   Uso:    npm run test:e2e
   ============================================================ */

import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SENHA = 'romulo2026';
const PORTA_API = 8901;
const PORTA_ESTATICA = 8902;
const BASE = `http://localhost:${PORTA_API}`;
const BASE_SEM_API = `http://localhost:${PORTA_ESTATICA}`;
const DADOS = path.join(raiz, '.netlify-blobs-local-e2e');

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error('\nEste teste precisa do Playwright:\n  npm i -D playwright-core\n');
  process.exit(1);
}

if (!existsSync(path.join(raiz, 'dist', 'index.html'))) {
  console.error('\nRode `npm run build` antes de `npm run test:e2e`.\n');
  process.exit(1);
}

let passou = 0;
let falhou = 0;
const ok = (cond, titulo, detalhe) => {
  if (cond) { passou++; console.log(`  ✓ ${titulo}`); }
  else { falhou++; console.error(`  ✗ ${titulo}${detalhe ? `\n      ${detalhe}` : ''}`); }
};
const grupo = t => console.log(`\n${t}`);
const espera = ms => new Promise(r => setTimeout(r, ms));

/* ---------- servidores ---------- */
const processos = [];
function subirServidor(args, aviso) {
  const p = spawn(process.execPath, [path.join(raiz, 'scripts', 'api-local.mjs'), ...args], {
    cwd: raiz,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  p.stderr.on('data', d => process.env.E2E_VERBOSE && console.error(`[${aviso}] ${d}`));
  processos.push(p);
  return p;
}

async function esperarNoAr(url, tentativas = 60) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return true;
    } catch { /* ainda subindo */ }
    await espera(250);
  }
  throw new Error(`servidor não subiu: ${url}`);
}

/* espera uma condição virar verdadeira na página */
async function ate(fn, { limite = 30000, passo = 400, titulo = '' } = {}) {
  const fim = Date.now() + limite;
  for (;;) {
    if (await fn()) return true;
    if (Date.now() > fim) { if (titulo) console.error(`      (tempo esgotado: ${titulo})`); return false; }
    await espera(passo);
  }
}

rmSync(DADOS, { recursive: true, force: true });
subirServidor([`--port`, String(PORTA_API), '--static', 'dist', '--dados', path.relative(raiz, DADOS)], 'api');
subirServidor([`--port`, String(PORTA_ESTATICA), '--static', 'dist', '--no-api'], 'estatico');
await esperarNoAr(`${BASE}/api/status`);
await esperarNoAr(`${BASE_SEM_API}/`);

// CHROMIUM_PATH permite usar um Chromium já instalado na máquina/CI
const navegador = await chromium.launch({
  args: ['--no-sandbox'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
});

/* Cada "aparelho" é um contexto isolado: localStorage próprio, como se
   fossem celulares diferentes. */
async function novoAparelho() {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('   [erro na página]', e.message));
  return { ctx, page };
}

/* dispara o caminho "voltei para a aba" — o site sincroniza na hora */
const sincronizarAgora = page => page.evaluate(() => window.dispatchEvent(new Event('focus')));

const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

try {
  /* ============================================================ */
  grupo('1. Equipe entra e publica o catálogo no servidor');

  const vazio = await (await fetch(`${BASE}/api/status`)).json();
  ok(vazio.catalogoPublicado === false, 'servidor começa sem catálogo');

  const equipe = await novoAparelho();
  await equipe.page.goto(`${BASE}/#/equipe`, { waitUntil: 'domcontentloaded' });
  await equipe.page.fill('input[type=password]', SENHA);
  await equipe.page.click('button[type=submit]');
  await equipe.page.waitForSelector('.backend-bar', { timeout: 20000 });

  const textoBarra = await equipe.page.textContent('.backend-bar');
  ok(/Servidor compartilhado ligado/.test(textoBarra), 'painel mostra o servidor compartilhado ligado');

  const publicou = await ate(async () => (await (await fetch(`${BASE}/api/status`)).json()).catalogoPublicado, {
    titulo: 'publicação automática do catálogo'
  });
  ok(publicou, 'ao entrar, a equipe publica o catálogo local no servidor');

  const catalogo = await (await fetch(`${BASE}/api/catalogo`)).json();
  ok(catalogo.produtos.length > 30, `catálogo completo no servidor (${catalogo.produtos.length} produtos)`);

  const alvo = catalogo.produtos.find(p => p.estoque > 1);
  const estoqueInicial = alvo.estoque;

  /* ============================================================ */
  grupo('2. Escrita protegida pela senha do painel');

  const semSenha = await equipe.page.evaluate(async () => {
    const r = await fetch('/api/catalogo', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ produtos: [] })
    });
    return r.status;
  });
  ok(semSenha === 401, 'PUT /api/catalogo sem senha → 401 (mesmo com sessão aberta no painel)');

  const senhaErrada = await equipe.page.evaluate(async () => {
    const r = await fetch('/api/catalogo', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: 'Bearer chute123' },
      body: JSON.stringify({ produtos: [] })
    });
    return r.status;
  });
  ok(senhaErrada === 401, 'PUT /api/catalogo com senha errada → 401');

  const pedidosPublico = await equipe.page.evaluate(async () => (await fetch('/api/pedidos')).status);
  ok(pedidosPublico === 401, 'lista de pedidos (dados de cliente) exige senha');

  const aindaCompleto = await (await fetch(`${BASE}/api/catalogo`)).json();
  ok(aindaCompleto.produtos.length === catalogo.produtos.length, 'nenhuma das tentativas negadas mexeu no catálogo');

  /* ============================================================ */
  grupo('3. Cliente enxerga o catálogo do servidor (outro aparelho)');

  const cliente = await novoAparelho();
  await cliente.page.goto(`${BASE}/#/produto/${alvo.id}`, { waitUntil: 'domcontentloaded' });
  await cliente.page.waitForSelector('.produto__stock', { timeout: 20000 });
  const estoqueVisto = await cliente.page.textContent('.produto__stock');
  ok(estoqueVisto.includes(String(estoqueInicial)), `cliente vê o estoque do servidor (${estoqueVisto.trim()})`);

  /* ============================================================ */
  grupo('4. Atualização ao vivo: equipe muda, cliente vê');

  await equipe.page.click('.painel__tab:nth-child(2)'); // aba Estoque
  await equipe.page.waitForSelector('.estoque__list .erow', { timeout: 20000 });
  await equipe.page.fill('.estoque__toolbar input[placeholder="Buscar produto…"]', alvo.nome);
  await equipe.page.waitForSelector('.estoque__list .erow');
  await equipe.page.click('.estoque__list .erow:first-child .erow__stock button:last-child'); // +1

  const subiuNoServidor = await ate(async () => {
    const c = await (await fetch(`${BASE}/api/catalogo`)).json();
    return c.produtos.find(p => p.id === alvo.id).estoque === estoqueInicial + 1;
  }, { titulo: 'estoque +1 chegar ao servidor' });
  ok(subiuNoServidor, 'o +1 do painel sobe para o servidor na hora');

  await sincronizarAgora(cliente.page);
  const clienteAtualizou = await ate(
    async () => (await cliente.page.textContent('.produto__stock')).includes(String(estoqueInicial + 1)),
    { titulo: 'cliente receber o estoque novo' }
  );
  ok(clienteAtualizou, 'a página do cliente se atualiza sozinha, sem recarregar');

  grupo('4b. Atualização ao vivo pelo relógio (sem foco, ~20s)');
  await equipe.page.click('.estoque__list .erow:first-child .erow__stock button:last-child'); // +1 de novo
  const porTemporizador = await ate(
    async () => (await cliente.page.textContent('.produto__stock')).includes(String(estoqueInicial + 2)),
    { limite: 40000, passo: 1000, titulo: 'sincronização periódica' }
  );
  ok(porTemporizador, 'a sincronização periódica também traz a mudança (sem nenhuma interação)');

  /* ============================================================ */
  grupo('5. Checkout público de ponta a ponta');

  await cliente.page.click('.produto__size-grid button:first-child');
  await cliente.page.click('.produto__add');
  await cliente.page.goto(`${BASE}/#/carrinho`, { waitUntil: 'domcontentloaded' });
  await cliente.page.waitForSelector('.resumo__btn');
  await cliente.page.click('.resumo__btn'); // Sacola → Dados
  await cliente.page.waitForSelector('.carrinho__form-grid');
  await cliente.page.fill('.carrinho__form-grid .field:nth-child(1) input', 'Maria Testadora');
  await cliente.page.fill('.carrinho__form-grid .field:nth-child(2) input', '62 98888-7777');
  await cliente.page.click('.resumo__btn'); // Dados → Pagamento
  await cliente.page.waitForSelector('.pix-upload');

  await cliente.page.setInputFiles('.pix-upload input[type=file]', {
    name: 'comprovante.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_1PX, 'base64')
  });
  await cliente.page.waitForSelector('.pix-file');
  await cliente.page.click('.resumo__btn'); // Enviar pedido
  await cliente.page.waitForSelector('.done-card', { timeout: 30000 });
  const confirmacao = await cliente.page.textContent('.done-card');
  ok(/Pedido/.test(confirmacao), 'cliente vê a tela de pedido recebido');

  const pedidos = await (await fetch(`${BASE}/api/pedidos`, { headers: { authorization: `Bearer ${SENHA}` } })).json();
  ok(pedidos.pedidos.length === 1, 'o pedido caiu no servidor da loja (não só no celular do cliente)');
  const pedido = pedidos.pedidos[0];
  ok(pedido.cliente.nome === 'Maria Testadora', 'nome do cliente registrado');
  ok(pedido.total === alvo.preco, `total calculado pelo servidor (${pedido.total})`);
  ok(pedido.temComprovante === true, 'comprovante anexado e guardado à parte');

  const comprovante = await (await fetch(`${BASE}/api/comprovante?id=${pedido.id}`, {
    headers: { authorization: `Bearer ${SENHA}` }
  })).json();
  ok(comprovante.comprovante.data.startsWith('data:image/'), 'comprovante recuperável pela equipe');

  /* ============================================================ */
  grupo('6. Equipe confirma a venda e o estoque baixa para todos');

  await equipe.page.click('.painel__tab:nth-child(1)'); // aba Pedidos
  await sincronizarAgora(equipe.page);
  const pedidoNaTela = await ate(() => equipe.page.$('.pedido'), { titulo: 'pedido aparecer no painel' });
  ok(!!pedidoNaTela, 'o pedido aparece no painel da equipe (veio do servidor)');

  await equipe.page.click('.pedido__actions .btn-primary'); // Confirmar venda
  const baixou = await ate(async () => {
    const c = await (await fetch(`${BASE}/api/catalogo`)).json();
    return c.produtos.find(p => p.id === alvo.id).estoque === estoqueInicial + 1;
  }, { titulo: 'baixa de estoque no servidor' });
  ok(baixou, 'confirmar a venda baixa o estoque no servidor (−1 do que estava lá)');

  await sincronizarAgora(cliente.page);
  await cliente.page.goto(`${BASE}/#/produto/${alvo.id}`, { waitUntil: 'domcontentloaded' });
  await cliente.page.waitForSelector('.produto__stock');
  const estoqueFinalCliente = await ate(
    async () => (await cliente.page.textContent('.produto__stock')).includes(String(estoqueInicial + 1)),
    { titulo: 'cliente ver o estoque após a venda' }
  );
  ok(estoqueFinalCliente, 'o cliente passa a ver o estoque já descontado');

  /* ============================================================ */
  grupo('7. Fallback: o mesmo site sem backend nenhum');

  const semBackend = await novoAparelho();
  const respostas = [];
  semBackend.page.on('response', r => respostas.push(r.url()));
  await semBackend.page.goto(`${BASE_SEM_API}/#/catalogo`, { waitUntil: 'domcontentloaded' });
  await semBackend.page.waitForSelector('.pcard', { timeout: 20000 });
  const cards = await semBackend.page.$$eval('.pcard', els => els.length);
  ok(cards > 0, `catálogo aparece normalmente sem servidor (${cards} produtos da semente)`);

  await semBackend.page.goto(`${BASE_SEM_API}/#/equipe`, { waitUntil: 'domcontentloaded' });
  await semBackend.page.fill('input[type=password]', SENHA);
  await semBackend.page.click('button[type=submit]');
  await semBackend.page.waitForSelector('.backend-bar', { timeout: 20000 });
  const barraLocal = await semBackend.page.textContent('.backend-bar');
  ok(/Modo local/.test(barraLocal), 'painel avisa que está em modo local');

  await semBackend.page.click('.painel__tab:nth-child(2)');
  await semBackend.page.waitForSelector('.estoque__list .erow');
  const antesLocal = await semBackend.page.textContent('.estoque__list .erow:first-child .erow__stock span');
  await semBackend.page.click('.estoque__list .erow:first-child .erow__stock button:last-child');
  const mudouLocal = await ate(async () => {
    const agora = await semBackend.page.textContent('.estoque__list .erow:first-child .erow__stock span');
    return Number(agora) === Number(antesLocal) + 1;
  }, { titulo: 'ajuste local de estoque' });
  ok(mudouLocal, 'ajustar estoque continua funcionando sem servidor');

  const senhaErradaLocal = await semBackend.page.evaluate(async () => {
    const r = await fetch('/api/catalogo', { method: 'PUT', body: '{}' });
    return r.headers.get('content-type') || '';
  });
  ok(/text\/html/.test(senhaErradaLocal), 'sem funções, /api devolve o index.html — e o site sabe ignorar isso');

  /* checkout local (pedido fica no aparelho) */
  const produtoLocal = await semBackend.page.$eval('.estoque__list .erow:first-child .erow__info strong', el => el.textContent);
  await semBackend.page.goto(`${BASE_SEM_API}/#/catalogo`, { waitUntil: 'domcontentloaded' });
  await semBackend.page.waitForSelector('.pcard');
  await semBackend.page.click('.pcard');
  await semBackend.page.waitForSelector('.produto__add', { timeout: 20000 });
  await semBackend.page.click('.produto__size-grid button:first-child');
  await semBackend.page.click('.produto__add');
  await semBackend.page.goto(`${BASE_SEM_API}/#/carrinho`, { waitUntil: 'domcontentloaded' });
  await semBackend.page.waitForSelector('.resumo__btn');
  await semBackend.page.click('.resumo__btn');
  await semBackend.page.waitForSelector('.carrinho__form-grid');
  await semBackend.page.fill('.carrinho__form-grid .field:nth-child(1) input', 'Cliente Offline');
  await semBackend.page.fill('.carrinho__form-grid .field:nth-child(2) input', '62 90000-0000');
  await semBackend.page.click('.resumo__btn');
  await semBackend.page.waitForSelector('.pix-upload');
  await semBackend.page.setInputFiles('.pix-upload input[type=file]', {
    name: 'comprovante.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1PX, 'base64')
  });
  await semBackend.page.waitForSelector('.pix-file');
  await semBackend.page.click('.resumo__btn');
  await semBackend.page.waitForSelector('.done-card', { timeout: 30000 });
  ok(true, `checkout completo sem servidor (produto "${produtoLocal.trim()}")`);

  const pedidosServidor = await (await fetch(`${BASE}/api/pedidos`, { headers: { authorization: `Bearer ${SENHA}` } })).json();
  ok(pedidosServidor.pedidos.length === 1, 'o pedido offline não vazou para o servidor da outra hospedagem');

  /* ============================================================ */
  grupo('8. Nenhuma exceção deixa a tela em branco');

  const quebrado = await novoAparelho();
  const raizVazia = pagina => pagina.evaluate(() => {
    const r = document.getElementById('root');
    return !r || r.childElementCount === 0;
  });

  /* (a) dado corrompido numa PÁGINA: produto sem a lista de tamanhos.
     Vai na origem sem backend, senão o próprio resync conserta o catálogo
     antes de a página tentar desenhá-lo. */
  await quebrado.page.goto(`${BASE_SEM_API}/#/catalogo`, { waitUntil: 'domcontentloaded' });
  await quebrado.page.waitForSelector('.pcard', { timeout: 20000 });
  await quebrado.page.evaluate(() => {
    localStorage.setItem('rsf.products.v7', JSON.stringify([
      { id: 'quebrado', nome: 'Produto Quebrado', preco: 10, estoque: 1, cores: [] } // sem `tamanhos`
    ]));
  });
  // reload de verdade: só trocar o hash não faz o app reler o localStorage
  await quebrado.page.goto(`${BASE_SEM_API}/#/produto/quebrado`, { waitUntil: 'domcontentloaded' });
  await quebrado.page.reload({ waitUntil: 'domcontentloaded' });
  await quebrado.page.waitForTimeout(3000);
  const produtoQuebradoNaTela = await quebrado.page.evaluate(
    () => (localStorage.getItem('rsf.products.v7') || '').includes('Produto Quebrado')
  );
  ok(produtoQuebradoNaTela, 'o dado inválido realmente chegou à página (o teste não passa à toa)');
  ok(!(await raizVazia(quebrado.page)), 'produto com dado inválido não apaga a tela');
  const textoRecuperacao = await quebrado.page.textContent('body');
  ok(/Recarregar|não foi possível carregar|Voltar ao catálogo/i.test(textoRecuperacao),
    'e a pessoa vê um caminho de volta, não uma tela morta');

  // (b) dado corrompido na MOLDURA (Nav lê o carrinho), fora das rotas —
  // antes isso derrubava a árvore inteira do React
  await quebrado.page.evaluate(() => {
    localStorage.setItem('rsf.cart.v4', JSON.stringify({ isso: 'não é uma lista' }));
  });
  await quebrado.page.goto(`${BASE_SEM_API}/#/catalogo`, { waitUntil: 'domcontentloaded' });
  await quebrado.page.reload({ waitUntil: 'domcontentloaded' });
  await quebrado.page.waitForTimeout(3000);
  ok(!(await raizVazia(quebrado.page)), 'carrinho corrompido não apaga a tela');
  const aindaTemCatalogo = await quebrado.page.$$eval('.pcard', e => e.length).catch(() => 0);
  ok(aindaTemCatalogo > 0, `o catálogo continua no ar mesmo com a moldura falhando (${aindaTemCatalogo} produtos)`);
  const navSumiu = (await quebrado.page.$$eval('nav', e => e.length).catch(() => 0)) === 0;
  ok(navSumiu, 'só o pedaço quebrado (o menu) sai do ar — é o boundary da moldura agindo');

  /* (c) falha PASSAGEIRA: é o caso do relato (quebra durante uma atualização
     e depois o dado volta ao normal). Tem de se curar sozinho, sem F5. */
  const passageiro = await novoAparelho();
  await passageiro.page.goto(`${BASE_SEM_API}/#/catalogo`, { waitUntil: 'domcontentloaded' });
  await passageiro.page.waitForSelector('.pcard', { timeout: 20000 });
  const bons = await passageiro.page.evaluate(() => localStorage.getItem('rsf.products.v7'));
  await passageiro.page.evaluate(() => {
    localStorage.setItem('rsf.products.v7', JSON.stringify([{ id: 'x', nome: 'X', preco: 1, estoque: 1, cores: [] }]));
  });
  await passageiro.page.goto(`${BASE_SEM_API}/#/produto/x`, { waitUntil: 'domcontentloaded' });
  await passageiro.page.reload({ waitUntil: 'domcontentloaded' });
  await passageiro.page.waitForTimeout(1500);
  ok(!(await raizVazia(passageiro.page)), 'durante a falha, a tela não fica em branco');

  // o dado se conserta (como um resync que traz o catálogo bom de volta)
  await passageiro.page.evaluate(v => localStorage.setItem('rsf.products.v7', v), bons);
  await passageiro.page.evaluate(() => window.dispatchEvent(new Event('storage')));
  await passageiro.page.goto(`${BASE_SEM_API}/#/catalogo`, { waitUntil: 'domcontentloaded' });
  const voltouSozinho = await ate(
    async () => (await passageiro.page.$$eval('.pcard', e => e.length).catch(() => 0)) > 0,
    { limite: 15000, titulo: 'catálogo voltar sem recarregar' }
  );
  ok(voltouSozinho, 'e a navegação volta a funcionar sem precisar de F5');

  /* ============================================================
     Regressão do "n is not a function" ao trocar de aba.

     `useEffect(() => window.scrollTo(0, 0), deps)` tem corpo de EXPRESSÃO:
     o que `scrollTo` devolver vira a função de limpeza do efeito. Em
     navegador limpo isso é `undefined` e não dá em nada — mas basta uma
     extensão, um polyfill de rolagem suave ou um quirk de celular embrulhar
     `scrollTo` para a limpeza virar um valor qualquer. Aí, no desmonte (ou
     quando as dependências mudam), o React chama esse valor: TypeError.
     ============================================================ */
  grupo('9. Efeito de rolagem não pode virar função de limpeza');

  const comScrollEnvolvido = await novoAparelho();
  const falhasLimpeza = [];
  comScrollEnvolvido.page.on('console', m => {
    if (m.type() === 'error' && /not a function/i.test(m.text())) falhasLimpeza.push(m.text().slice(0, 120));
  });
  // imita o ambiente do relato: algo faz scrollTo devolver um valor
  await comScrollEnvolvido.ctx.addInitScript(() => {
    const original = window.scrollTo.bind(window);
    window.scrollTo = (...a) => { original(...a); return 'valor-qualquer'; };
  });

  await comScrollEnvolvido.page.goto(`${BASE}/#/catalogo`, { waitUntil: 'domcontentloaded' });
  await comScrollEnvolvido.page.waitForSelector('.pcard', { timeout: 20000 });
  await comScrollEnvolvido.page.click('.pcard');
  await comScrollEnvolvido.page.waitForSelector('.produto__add', { timeout: 20000 });
  await comScrollEnvolvido.page.click('.produto__size-grid button:first-child');
  await comScrollEnvolvido.page.click('.produto__add');

  // percorre as etapas do carrinho: cada uma muda `step` e roda a limpeza
  await comScrollEnvolvido.page.goto(`${BASE}/#/carrinho`, { waitUntil: 'domcontentloaded' });
  await comScrollEnvolvido.page.waitForSelector('.resumo__btn', { timeout: 20000 });
  await comScrollEnvolvido.page.click('.resumo__btn');
  await comScrollEnvolvido.page.waitForSelector('.carrinho__form-grid');
  await comScrollEnvolvido.page.fill('.carrinho__form-grid .field:nth-child(1) input', 'Teste Rolagem');
  await comScrollEnvolvido.page.fill('.carrinho__form-grid .field:nth-child(2) input', '62 90000-0000');
  await comScrollEnvolvido.page.click('.resumo__btn');
  await comScrollEnvolvido.page.waitForTimeout(1200);
  // e troca de rota algumas vezes, que é quando o desmonte acontece
  for (const rota of ['/#/catalogo', '/#/carrinho', '/#/contato', '/#/catalogo']) {
    await comScrollEnvolvido.page.goto(`${BASE}${rota}`, { waitUntil: 'domcontentloaded' });
    await comScrollEnvolvido.page.waitForTimeout(700);
  }

  ok(falhasLimpeza.length === 0, 'nenhum "is not a function" mesmo com scrollTo devolvendo valor',
    falhasLimpeza[0]);
  const carrinhoVivo = await comScrollEnvolvido.page.evaluate(
    () => !/Não foi possível carregar/.test(document.body.textContent || '')
  );
  ok(carrinhoVivo, 'e as telas continuam funcionando, sem o aviso de erro');

  /* ============================================================ */
  grupo('10. Troca de senha vale para o servidor');

  await equipe.page.click('.painel__tab:nth-child(3)');
  await equipe.page.waitForSelector('.config__form');
  await equipe.page.fill('.config__form .field:nth-child(3) input', SENHA);
  await equipe.page.fill('.config__form .field:nth-child(4) input', 'senhaNova2026');
  await equipe.page.fill('.config__form .field:nth-child(5) input', 'senhaNova2026');
  await equipe.page.click('.config__form button[type=submit]');

  const trocou = await ate(async () => {
    const r = await fetch(`${BASE}/api/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ senha: 'senhaNova2026' })
    });
    return r.status === 200;
  }, { titulo: 'nova senha valer no servidor' });
  ok(trocou, 'a senha nova passa a valer no servidor');

  const antigaMorreu = await fetch(`${BASE}/api/catalogo`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${SENHA}` },
    body: JSON.stringify({ produtos: [] })
  });
  ok(antigaMorreu.status === 401, 'a senha antiga não escreve mais');

  // a sessão do painel continua válida com a senha nova (sem logar de novo)
  const guardouToken = await ate(async () => {
    const t = await equipe.page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('rsf.session.v1') || '{}').token; } catch { return null; }
    });
    return t === 'senhaNova2026';
  }, { limite: 10000, titulo: 'painel guardar o novo token' });
  ok(guardouToken, 'o painel guarda o novo token de escrita sem precisar logar de novo');

  const escreveComTokenNovo = await equipe.page.evaluate(async () => {
    const s = JSON.parse(localStorage.getItem('rsf.session.v1') || '{}');
    const r = await fetch('/api/catalogo', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${s.token}` },
      body: JSON.stringify({ produtos: [{ nome: 'Teste pós-troca', preco: 1, estoque: 1 }] })
    });
    return r.status;
  });
  ok(escreveComTokenNovo === 200, 'e continua conseguindo salvar no servidor com ele');
} catch (e) {
  falhou++;
  console.error('\n✗ erro no teste:', e && e.stack ? e.stack : e);
} finally {
  await navegador.close().catch(() => {});
  processos.forEach(p => p.kill('SIGTERM'));
  rmSync(DADOS, { recursive: true, force: true });
}

console.log(`\n${falhou ? '✗' : '✓'} ${passou} verificações passaram, ${falhou} falharam.\n`);
process.exit(falhou ? 1 : 0);
