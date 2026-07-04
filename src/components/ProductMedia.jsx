import { useState } from 'react';
import TenisArt from './TenisArt';

/**
 * Mostra a foto real do produto (public/products/<img>) e, caso o
 * arquivo não exista ou falhe ao carregar, cai graciosamente para a
 * ilustração vetorial gerada a partir do colorway.
 */
export default function ProductMedia({ produto, className = '', style, artStyle }) {
  const [failed, setFailed] = useState(false);
  const src = produto?.img ? `${import.meta.env.BASE_URL}products/${produto.img}` : null;

  if (!src || failed) {
    return (
      <div className={`product-media product-media--art ${className}`} style={style}>
        <TenisArt colorway={produto?.colorway} seed={produto?.id?.length || 1} style={artStyle} />
      </div>
    );
  }

  return (
    <div className={`product-media ${className}`} style={style}>
      <img src={src} alt={produto?.nome || ''} loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}
