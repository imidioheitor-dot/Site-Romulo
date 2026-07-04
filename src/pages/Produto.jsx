import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiShoppingBag, FiCheck, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';
import LiquidGlass from '../components/fx/LiquidGlass';
import ProductMedia from '../components/ProductMedia';
import ProductCard from '../components/ProductCard';
import { useProducts, addToCart } from '../lib/store';
import { useToast } from '../components/Toast';
import { brl } from '../lib/format';
import { useReveal } from '../lib/useReveal';
import './Produto.css';

export default function Produto() {
  const { id } = useParams();
  const products = useProducts();
  const navigate = useNavigate();
  const toast = useToast();
  const produto = products.find(p => p.id === id);
  const [tamanho, setTamanho] = useState(null);
  const [qtd, setQtd] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTamanho(null);
    setQtd(1);
  }, [id]);

  const relacionados = useMemo(
    () => products.filter(p => p.id !== id && (p.categoria === produto?.categoria || p.marca === produto?.marca)).slice(0, 4),
    [products, id, produto]
  );

  useReveal([relacionados.length]);

  if (!produto) {
    return (
      <div className="container" style={{ paddingTop: 'calc(var(--nav-h) + 80px)', minHeight: '60vh' }}>
        <p className="lead">Produto não encontrado.</p>
        <Link to="/catalogo" className="btn btn-quiet cursor-target" style={{ marginTop: 20 }}>Voltar ao catálogo</Link>
      </div>
    );
  }

  const esgotado = produto.estoque <= 0;

  const handleAdd = () => {
    if (!tamanho) {
      toast('Selecione um tamanho primeiro.', 'danger');
      return;
    }
    addToCart(produto.id, tamanho, qtd);
    toast(`${produto.nome} (${tamanho}) adicionado ao carrinho.`, 'ok');
  };

  return (
    <div className="produto">
      <div className="container">
        <button className="produto__back cursor-target" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Voltar
        </button>
      </div>

      <section className="container produto__main">
        <div className="produto__media rise">
          <LiquidGlass radius={28} className="produto__glass" blur={6}>
            <div className="produto__stage">
              {produto.tag && <span className="tag" style={{ position: 'absolute', top: 20, left: 20, zIndex: 5 }}>{produto.tag}</span>}
              <ProductMedia produto={produto} artStyle={{ padding: '4%' }} />
            </div>
          </LiquidGlass>
          <div className="produto__thumbs">
            {(produto.cores || []).map((c, i) => (
              <span key={i} className="produto__thumb" style={{ background: c }} />
            ))}
          </div>
        </div>

        <div className="produto__info rise rise-1">
          <span className="produto__brand">{produto.marca} · {produto.categoria}</span>
          <h1 className="produto__title">{produto.nome}</h1>

          <div className="produto__price">
            {produto.precoAntigo && <s>{brl(produto.precoAntigo)}</s>}
            <strong>{brl(produto.preco)}</strong>
            {produto.precoAntigo && (
              <span className="produto__save">Economize {brl(produto.precoAntigo - produto.preco)}</span>
            )}
          </div>

          <p className="lead produto__desc">{produto.descricao}</p>

          <div className="produto__sizes">
            <div className="produto__sizes-head">
              <span>Tamanho</span>
              {esgotado ? (
                <span className="tag danger">Esgotado</span>
              ) : (
                <span className="produto__stock">{produto.estoque} em estoque</span>
              )}
            </div>
            <div className="produto__size-grid">
              {produto.tamanhos.map(t => (
                <button
                  key={t}
                  className={`produto__size cursor-target ${tamanho === t ? 'is-on' : ''}`}
                  onClick={() => setTamanho(t)}
                  disabled={esgotado}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="produto__actions">
            <div className="produto__qty">
              <button className="cursor-target" onClick={() => setQtd(q => Math.max(1, q - 1))} disabled={esgotado}>−</button>
              <span>{qtd}</span>
              <button className="cursor-target" onClick={() => setQtd(q => q + 1)} disabled={esgotado}>+</button>
            </div>
            <button className="btn btn-primary produto__add cursor-target" onClick={handleAdd} disabled={esgotado}>
              {esgotado ? 'Indisponível' : <>Adicionar ao carrinho <FiShoppingBag /></>}
            </button>
          </div>

          <div className="produto__perks">
            <span><FiTruck /> Entrega em Goiânia</span>
            <span><FiRefreshCw /> Troca em até 30 dias</span>
            <span><FiShield /> Compra segura via Pix</span>
          </div>

          <ul className="produto__facts">
            <li><FiCheck /> Gênero: {produto.genero}</li>
            <li><FiCheck /> Numeração {produto.tamanhos[0]} ao {produto.tamanhos[produto.tamanhos.length - 1]}</li>
            <li><FiCheck /> Selecionado pela curadoria Rômulo Santos Flores</li>
          </ul>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="section container produto__related">
          <h2 className="h2" style={{ marginBottom: 34 }}>Você também vai <em className="h-serif">gostar</em></h2>
          <div className="produto__related-grid">
            {relacionados.map((p, i) => (
              <ProductCard key={p.id} produto={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="page-end-space" />
    </div>
  );
}
