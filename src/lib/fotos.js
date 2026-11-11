/* Fotos de um produto.
   Formato: `galeria` é a lista completa e ordenada; `img` é sempre a capa
   (= galeria[0]). Produtos antigos só têm `img` — continuam valendo. */

export const MAX_FOTOS = 12;

export function fotosDoProduto(p) {
  if (!p) return [];
  const lista = Array.isArray(p.galeria) && p.galeria.length ? p.galeria : [p.img];
  const vistas = new Set();
  const saida = [];
  for (const f of lista) {
    if (!f || vistas.has(f)) continue;
    vistas.add(f);
    saida.push(f);
  }
  return saida;
}

/* aceita: foto guardada no servidor (/api/foto?id=…), foto enviada localmente
   (data:), URL externa (http/blob) ou arquivo em public/products/ */
export function fotoSrc(raw) {
  if (!raw) return null;
  if (/^(\/|data:|https?:|blob:)/.test(raw)) return raw;
  return `${import.meta.env.BASE_URL}${raw.startsWith('fotos/') ? '' : 'products/'}${raw}`;
}

export const temFotoEmbutida = p => fotosDoProduto(p).some(f => String(f).startsWith('data:'));
