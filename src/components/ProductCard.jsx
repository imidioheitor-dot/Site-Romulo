import { useNavigate } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import ProductMedia from './ProductMedia';
import { brl } from '../lib/format';
import './ProductCard.css';

export default function ProductCard({ produto, index = 0 }) {
  const navigate = useNavigate();
  const esgotado = produto.estoque <= 0;

  return (
    <article
      className="pcard reveal cursor-target"
      style={{ transitionDelay: `${(index % 4) * 70}ms` }}
      onClick={() => navigate(`/produto/${produto.id}`)}
    >
      <div className="pcard__media">
        {produto.tag && <span className="pcard__tag tag">{produto.tag}</span>}
        {produto.precoAntigo && !esgotado && (
          <span className="pcard__off">
            -{Math.round((1 - produto.preco / produto.precoAntigo) * 100)}%
          </span>
        )}
        {esgotado && <span className="pcard__sold">Esgotado</span>}
        <ProductMedia produto={produto} />
        <span className="pcard__go"><FiArrowUpRight size={18} /></span>
      </div>

      <div className="pcard__body">
        <div className="pcard__head">
          <div>
            <h3 className="pcard__name">{produto.nome}</h3>
            <span className="pcard__meta">{produto.marca} · {produto.genero}</span>
          </div>
        </div>
        <div className="pcard__foot">
          <div className="pcard__price">
            {produto.precoAntigo && <s>{brl(produto.precoAntigo)}</s>}
            <strong>{brl(produto.preco)}</strong>
          </div>
          <div className="pcard__swatches">
            {(produto.cores || []).slice(0, 4).map((cor, i) => (
              <span key={i} style={{ background: cor }} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
