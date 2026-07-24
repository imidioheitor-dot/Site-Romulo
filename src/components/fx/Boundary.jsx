import { Component } from 'react';

/**
 * Boundary — captura erros de renderização (ex.: falha ao criar contexto
 * WebGL em aparelhos fracos / Safari, ou um dado inesperado) para que um
 * efeito decorativo ou uma página nunca derrubem o site inteiro.
 *
 * fallback: node OU função (erro) => node. Por padrão não mostra nada.
 */
export default class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, error };
  }

  componentDidCatch() {
    /* silencioso: o efeito/página simplesmente não é exibido */
  }

  render() {
    if (this.state.failed) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') return fallback(this.state.error);
      return fallback ?? null;
    }
    return this.props.children;
  }
}
