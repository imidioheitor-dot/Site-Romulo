/* ============================================================
   Casa Mikka — "armazéns" (camadas de persistência da API)

   Interface mínima:
     ler(chave)                  -> { valor, etag } | null
     gravar(chave, valor, opts)  -> { ok, etag }    (ok:false = conflito)
     apagar(chave)

   Três implementações: Netlify Blobs (produção), memória (testes) e
   arquivos locais (servidor de desenvolvimento).
   ============================================================ */

import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

function etagDe(valor) {
  return createHash('sha1').update(JSON.stringify(valor)).digest('hex').slice(0, 16);
}

/* ---------- Netlify Blobs ---------- */
export function armazemBlobs(store) {
  return {
    async ler(chave) {
      const reg = await store.getWithMetadata(chave, { type: 'json', consistency: 'strong' });
      if (!reg) return null;
      return { valor: reg.data, etag: reg.etag };
    },
    async gravar(chave, valor, { etag, novo } = {}) {
      const opcoes = etag ? { onlyIfMatch: etag } : novo ? { onlyIfNew: true } : {};
      const r = await store.setJSON(chave, valor, opcoes);
      return { ok: r.modified !== false, etag: r.etag };
    },
    async apagar(chave) {
      await store.delete(chave);
    }
  };
}

/* ---------- memória (testes) ---------- */
export function armazemMemoria(inicial = {}) {
  const mapa = new Map(Object.entries(inicial).map(([k, v]) => [k, { valor: v, etag: etagDe(v) }]));
  return {
    async ler(chave) {
      const reg = mapa.get(chave);
      return reg ? { valor: JSON.parse(JSON.stringify(reg.valor)), etag: reg.etag } : null;
    },
    async gravar(chave, valor, { etag, novo } = {}) {
      const atual = mapa.get(chave);
      if (novo && atual) return { ok: false };
      if (etag && (!atual || atual.etag !== etag)) return { ok: false };
      const novoEtag = etagDe(valor);
      mapa.set(chave, { valor: JSON.parse(JSON.stringify(valor)), etag: novoEtag });
      return { ok: true, etag: novoEtag };
    },
    async apagar(chave) { mapa.delete(chave); },
    _mapa: mapa
  };
}

/* ---------- arquivos locais (npm run dev / testes de ponta a ponta) ---------- */
export function armazemArquivo(pasta) {
  const caminho = chave => path.join(pasta, `${chave.replace(/[^a-z0-9/_-]/gi, '_')}.json`);

  return {
    async ler(chave) {
      try {
        const bruto = await readFile(caminho(chave), 'utf8');
        const valor = JSON.parse(bruto);
        return { valor, etag: etagDe(valor) };
      } catch {
        return null;
      }
    },
    async gravar(chave, valor, { etag, novo } = {}) {
      const atual = await this.ler(chave);
      if (novo && atual) return { ok: false };
      if (etag && (!atual || atual.etag !== etag)) return { ok: false };
      const alvo = caminho(chave);
      await mkdir(path.dirname(alvo), { recursive: true });
      await writeFile(alvo, JSON.stringify(valor, null, 2));
      return { ok: true, etag: etagDe(valor) };
    },
    async apagar(chave) {
      await rm(caminho(chave), { force: true });
    }
  };
}
