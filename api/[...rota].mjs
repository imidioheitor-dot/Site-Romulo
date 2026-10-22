/* API compartilhada da Mikka Home na Vercel (Vercel Function + Vercel Blob).
   É o MESMO roteador usado na Netlify (netlify/lib/api.mjs); só troca o armazém. */

import { criarRoteador } from '../netlify/lib/api.mjs';
import { armazemVercelBlob } from '../vercel/armazem.mjs';

let roteador;
function obter() {
  if (!roteador) roteador = criarRoteador({ armazem: armazemVercelBlob(), ambiente: process.env });
  return roteador;
}

async function tratar(request) {
  try {
    return await obter()(request, {
      ip: (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'desconhecido'
    });
  } catch (e) {
    console.error('[api] backend indisponível', e);
    return new Response(
      JSON.stringify({ ok: false, servico: 'casa-mikka', erro: 'Armazenamento compartilhado indisponível.' }),
      { status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }
    );
  }
}

export const GET = tratar;
export const POST = tratar;
export const PUT = tratar;
export const PATCH = tratar;
export const DELETE = tratar;
export const OPTIONS = tratar;

export const config = { maxDuration: 30 };
