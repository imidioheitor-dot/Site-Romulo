/* Brilho 2D que segue o mouse nos cartões (sem inclinar).
   Escreve as variáveis CSS --gx / --gy. No toque ou com "menos movimento"
   ligado no aparelho, não faz nada. */
export function useTilt() {
  const reduz = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const toque = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;
  if (reduz || toque) return {};
  return {
    onMouseMove(e) {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    }
  };
}
