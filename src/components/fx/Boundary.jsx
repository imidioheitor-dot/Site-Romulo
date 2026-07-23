import { Component } from 'react';

/**
 * Boundary — captura erros de renderização (ex.: falha ao criar contexto
 * WebGL em aparelhos fracos / Safari) para que um efeito decorativo ou uma
 * página nunca derrubem o site inteiro. Sem isto, um erro de WebGL no
 * carrinho deixava toda a aplicação em branco.
 *
 * fallback: o que mostrar quando há erro (por padrão nada — some o efeito).
 */
export default class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    /* silencioso: o efeito/página simplesmente não é exibido */
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
