import { useRef } from 'react';
import VariableProximity from './fx/VariableProximity';

/**
 * Título com o efeito de texto (VariableProximity): as letras engrossam
 * conforme o cursor se aproxima. Usado nos títulos das páginas.
 *  - pre: parte principal (recebe o efeito)
 *  - accent: destaque em serifa itálica (opcional)
 *  - post: pontuação/sufixo simples (opcional)
 */
export default function AnimatedTitle({
  pre,
  accent,
  post,
  as: Tag = 'h1',
  className = 'display',
  radius = 130,
  style
}) {
  const ref = useRef(null);
  return (
    <Tag className={`${className} animated-title`} ref={ref} style={style}>
      <VariableProximity
        label={pre}
        containerRef={ref}
        className="cursor-target"
        fromFontVariationSettings="'wght' 300, 'opsz' 12"
        toFontVariationSettings="'wght' 900, 'opsz' 40"
        radius={radius}
        falloff="gaussian"
      />
      {accent ? <> <em className="h-serif">{accent}</em></> : null}
      {post ? post : null}
    </Tag>
  );
}
