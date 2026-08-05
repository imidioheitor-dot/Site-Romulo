/* ============================================================
   Casa Mikka — API compartilhada (Netlify Function + Netlify Blobs)

   Rotas (todas sob /api):
     GET   /api/status        estado do backend (usado para o fallback)
     GET   /api/catalogo      catálogo público (aceita ?rev= para poupar dados)
     PUT   /api/catalogo      grava o catálogo            [senha da equipe]
     GET   /api/pedidos       lista de pedidos            [senha da equipe]
     POST  /api/pedidos       checkout público
     PATCH /api/pedidos       muda status / baixa estoque [senha da equipe]
     GET   /api/comprovante   comprovante de um pedido    [senha da equipe]
     POST  /api/login         confere a senha da equipe
     PUT   /api/senha         troca a senha da equipe     [senha da equipe]
   ============================================================ */

import { getStore } from '@netlify/blobs';
import { criarRoteador } from '../lib/api.mjs';
import { armazemBlobs } from '../lib/armazem.mjs';

const NOME_STORE = process.env.BLOBS_STORE || 'casa-mikka';

let roteador;

function obterRoteador() {
  if (!roteador) {
    const store = getStore({ name: NOME_STORE, consistency: 'strong' });
    roteador = criarRoteador({ armazem: armazemBlobs(store), ambiente: process.env });
  }
  return roteador;
}

export default async function handler(request, context) {
  try {
    return await obterRoteador()(request, {
      ip: (context && context.ip) || request.headers.get('x-nf-client-connection-ip')
    });
  } catch (e) {
    // Blobs indisponível (ex.: recurso desligado no site): o site continua
    // funcionando no modo local, então respondemos de forma explícita.
    console.error('[api] backend indisponível', e);
    return new Response(
      JSON.stringify({ ok: false, servico: 'casa-mikka', erro: 'Armazenamento compartilhado indisponível.' }),
      { status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }
    );
  }
}

export const config = {
  path: ['/api', '/api/*']
};
