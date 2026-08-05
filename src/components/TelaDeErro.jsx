import { FiRefreshCw } from 'react-icons/fi';

/**
 * Último recurso: aparece quando alguma exceção escapa e derrubaria a árvore
 * do React. Antes disso o site ficava com a tela preta e só voltava com F5.
 *
 * Fica de propósito sem efeitos, sem WebGL e sem dependência de dados —
 * ele precisa conseguir renderizar justamente quando o resto falhou.
 */
export default function TelaDeErro(erro, pilha) {
  const detalhe = erro && (erro.message || String(erro));
  // primeira linha útil da pilha de componentes: diz QUEM quebrou
  const culpado = (pilha || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ← ');

  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '48px 20px',
        background: '#17110d',
        color: '#f2e9df',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <h1 style={{ fontSize: 26, marginBottom: 12, fontWeight: 500 }}>
          Algo travou por aqui
        </h1>
        <p style={{ opacity: 0.75, lineHeight: 1.6, marginBottom: 24, fontSize: 15 }}>
          A página teve um problema, mas seus dados continuam salvos.
          Recarregue para voltar de onde parou.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 22px',
            borderRadius: 999,
            border: '1px solid rgba(230,189,140,0.4)',
            background: 'rgba(230,189,140,0.12)',
            color: '#e6bd8c',
            fontSize: 15,
            cursor: 'pointer'
          }}
        >
          <FiRefreshCw /> Recarregar
        </button>
        {(detalhe || culpado) && (
          <p style={{ marginTop: 26, fontSize: 11, opacity: 0.4, wordBreak: 'break-word' }}>
            {detalhe}
            {culpado && <><br />{culpado}</>}
          </p>
        )}
      </div>
    </div>
  );
}
