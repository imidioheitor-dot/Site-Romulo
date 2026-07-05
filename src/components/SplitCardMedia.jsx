import { useState } from 'react';
import TenisArt from './TenisArt';

/**
 * Mídia dos cards "Amortecimento" e "Estilo". Mostra a imagem real
 * (public/products/<img>) quando existir; enquanto não existir, cai
 * graciosamente para a ilustração vetorial do tênis.
 * Usado dentro do StickerPeel (efeito de adesivo descolável).
 */
export default function SplitCardMedia({ img, colorway, seed = 1, width = 230 }) {
  const [failed, setFailed] = useState(false);
  const src = img ? `${import.meta.env.BASE_URL}products/${img}` : null;

  if (!src || failed) {
    return (
      <div style={{ width, borderRadius: 18, overflow: 'hidden' }}>
        <TenisArt colorway={colorway} seed={seed} />
      </div>
    );
  }

  return (
    <div style={{ width, aspectRatio: '1 / 1', borderRadius: 18, overflow: 'hidden' }}>
      <img
        src={src}
        alt=""
        draggable="false"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}
