/* ============================================================
   Armazém em Vercel Blob (mesma interface de netlify/lib/armazem.mjs)

     ler(chave)                  -> { valor, etag } | null
     gravar(chave, valor, opts)  -> { ok, etag }    (ok:false = conflito)
     apagar(chave)

   Cada chave vira um arquivo JSON no Blob, com o caminho embaralhado por um
   segredo derivado do token do store (o endereço público do Blob não pode ser
   adivinhado, porque ali ficam pedidos e dados de clientes).
   Leitura sempre sem cache de CDN (useCache:false) e escrita condicional por
   ETag (ifMatch), para dois aparelhos não se atropelarem.
   ============================================================ */

import { createHmac } from 'node:crypto';
import { get, put, del, BlobPreconditionFailedError } from '@vercel/blob';

export function armazemVercelBlob({ token = process.env.BLOB_READ_WRITE_TOKEN, pasta = 'kv' } = {}) {
  const sal = createHmac('sha256', String(token || 'local')).update('helu-equipe-kv').digest('hex').slice(0, 24);
  const caminho = chave => `${pasta}/${sal}/${chave.replace(/[^a-z0-9/_-]/gi, '_')}.json`;

  async function lerBruto(chave) {
    const r = await get(caminho(chave), { access: 'public', useCache: false });
    if (!r || r.statusCode !== 200) return null;
    const texto = await new Response(r.stream).text();
    return { valor: JSON.parse(texto), etag: r.blob.etag };
  }

  return {
    async ler(chave) {
      try { return await lerBruto(chave); } catch (e) {
        if (e && /not.?found/i.test(e.name + ' ' + e.message)) return null;
        throw e;
      }
    },
    async gravar(chave, valor, { etag, novo } = {}) {
      const corpo = JSON.stringify(valor);
      const opcoes = {
        access: 'public', contentType: 'application/json', addRandomSuffix: false,
        cacheControlMaxAge: 60
      };
      try {
        let r;
        if (etag) r = await put(caminho(chave), corpo, { ...opcoes, ifMatch: etag });
        else if (novo) r = await put(caminho(chave), corpo, { ...opcoes, allowOverwrite: false });
        else r = await put(caminho(chave), corpo, { ...opcoes, allowOverwrite: true });
        const atual = await lerBruto(chave).catch(() => null);
        return { ok: true, etag: (atual && atual.etag) || r.etag };
      } catch (e) {
        if (e instanceof BlobPreconditionFailedError) return { ok: false };
        if (novo && /already exists|exists/i.test(String(e && e.message))) return { ok: false };
        throw e;
      }
    },
    async apagar(chave) {
      await del(caminho(chave)).catch(() => {});
    }
  };
}
