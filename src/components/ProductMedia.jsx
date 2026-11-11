import { useState } from 'react';
import ArteProduto from './ArteProduto';
import { fotoSrc } from '../lib/fotos';

/**
 * Mostra a foto real do produto (public/products/<img>) e, caso o
 * arquivo não exista ou falhe ao carregar, cai graciosamente para a
 * ilustração vetorial gerada a partir do colorway.
 */
export default function ProductMedia({ produto, className = '', style, artStyle, foto }) {
  const [falhou, setFalhou] = useState(null);
  const raw = foto || produto?.img;
  const src = fotoSrc(raw);
  const failed = falhou === src;

  if (!src || failed) {
    return (
      <div className={`product-media product-media--art ${className}`} style={style}>
        <ArteProduto produto={produto} style={artStyle} />
      </div>
    );
  }

  return (
    <div className={`product-media ${className}`} style={style}>
      <img key={src} src={src} alt={produto?.nome || ''} loading="lazy" onError={() => setFalhou(src)} />
    </div>
  );
}
