/* Inclinação 3D que segue o mouse (efeito de cartão físico).
   Devolve handlers para espalhar no elemento; escreve as variáveis CSS
   --rx / --ry (graus) e --gx / --gy (brilho). No toque ou com "menos
   movimento" ligado no aparelho, não faz nada. */
export function useTilt(max = 9) {
  const reduz = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const toque = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;
  if (reduz || toque) return {};
  return {
    onMouseMove(e) {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    },
    onMouseLeave(e) {
      const el = e.currentTarget;
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
  };
}
