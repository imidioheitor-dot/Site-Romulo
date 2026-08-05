#!/usr/bin/env node
/* ============================================================
   Servidor local da API — roda o MESMO roteador da Netlify Function,
   trocando o Netlify Blobs por arquivos em .netlify-blobs-local/.

   Uso:
     node scripts/api-local.mjs --port 8888
     node scripts/api-local.mjs --port 8888 --static dist   (site + API juntos)

   Serve para `npm run dev` (o Vite faz proxy de /api) e para os testes.
   ============================================================ */

import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { criarRoteador } from '../netlify/lib/api.mjs';
import { armazemArquivo } from '../netlify/lib/armazem.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const porta = Number(arg('port', process.env.PORT || 8888));
const pastaDados = path.resolve(raiz, arg('dados', '.netlify-blobs-local'));
const pastaEstatica = arg('static', '') ? path.resolve(raiz, arg('static', '')) : null;
// --no-api imita uma hospedagem estática (sem funções): /api cai no index.html
const semApi = process.argv.includes('--no-api');

const roteador = criarRoteador({ armazem: armazemArquivo(pastaDados), ambiente: process.env });

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

async function lerCorpo(req) {
  const partes = [];
  for await (const p of req) partes.push(p);
  return Buffer.concat(partes);
}

async function servirEstatico(url, res) {
  if (!pastaEstatica) return false;
  const limpo = decodeURIComponent(url.pathname).replace(/\.\./g, '');
  let alvo = path.join(pastaEstatica, limpo);
  try {
    const info = await stat(alvo);
    if (info.isDirectory()) alvo = path.join(alvo, 'index.html');
  } catch {
    alvo = path.join(pastaEstatica, 'index.html'); // fallback de SPA
  }
  try {
    const conteudo = await readFile(alvo);
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(conteudo);
    return true;
  } catch {
    return false;
  }
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (semApi || !url.pathname.startsWith('/api')) {
    if (await servirEstatico(url, res)) return;
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
    return;
  }

  const corpo = ['GET', 'HEAD'].includes(req.method) ? undefined : await lerCorpo(req);
  const requisicao = new Request(url, {
    method: req.method,
    headers: Object.entries(req.headers).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
    body: corpo && corpo.length ? corpo : undefined
  });

  const resposta = await roteador(requisicao, { ip: req.socket.remoteAddress || 'local' });
  const cabecalhos = {};
  resposta.headers.forEach((v, k) => { cabecalhos[k] = v; });
  res.writeHead(resposta.status, cabecalhos);
  res.end(Buffer.from(await resposta.arrayBuffer()));
});

servidor.listen(porta, () => {
  if (semApi) console.log(`[api-local] modo SEM API (hospedagem estática) em http://localhost:${porta}`);
  else {
    console.log(`[api-local] http://localhost:${porta}/api/status`);
    console.log(`[api-local] dados em ${path.relative(raiz, pastaDados)}/`);
  }
  if (pastaEstatica) console.log(`[api-local] site estático: ${path.relative(raiz, pastaEstatica)}/`);
});
