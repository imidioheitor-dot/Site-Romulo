import { Component } from 'react';

/**
 * Boundary — captura erros de renderização (ex.: falha ao criar contexto
 * WebGL em aparelhos fracos / Safari, um dado inesperado, ou a limpeza de um
 * efeito que explode durante o desmonte) para que um efeito decorativo ou uma
 * página nunca derrubem o site inteiro.
 *
 * Duas coisas importantes acontecem aqui:
 *
 * 1. TENTA SE RECUPERAR SOZINHO. Boa parte dessas falhas é passageira —
 *    acontece no meio de uma troca de tela ou de uma atualização vinda do
 *    servidor. Em vez de deixar a pessoa presa numa tela morta tendo que dar
 *    F5, o boundary remonta o conteúdo uma vez. Se quebrar de novo logo em
 *    seguida, aí sim mostra o aviso — para não entrar em laço.
 *
 * 2. REGISTRA QUEM QUEBROU. O React entrega a pilha de componentes; sem
 *    imprimi-la sobra só um stack minificado, que não diz nada. Com ela, o
 *    nome do componente aparece no console e no rodapé do aviso.
 *
 * fallback: node OU função (erro, info) => node. Por padrão não mostra nada.
 * resetKey: quando muda (ex.: a rota), o boundary volta a tentar.
 */
export default class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, error: null, pilha: null, tentativas: 0 };
    this.timer = null;
  }

  static getDerivedStateFromError(error) {
    return { failed: true, error };
  }

  componentDidCatch(error, info) {
    const pilha = (info && info.componentStack) || '';
    // eslint-disable-next-line no-console
    console.error('[Casa Mikka] falha contida por um boundary:', error, pilha);
    this.setState({ pilha });

    // uma única tentativa automática de remontar; falhou de novo, mostra o aviso
    if (this.state.tentativas < 1) {
      this.timer = setTimeout(() => {
        this.setState(s => ({ failed: false, error: null, tentativas: s.tentativas + 1 }));
      }, 400);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false, error: null, pilha: null, tentativas: 0 });
    }
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  render() {
    if (this.state.failed) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') return fallback(this.state.error, this.state.pilha);
      return fallback ?? null;
    }
    return this.props.children;
  }
}
