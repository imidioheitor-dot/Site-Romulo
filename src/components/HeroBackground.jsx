/**
 * Fundo do hero: creme com brilhos dourados e a marca ao fundo.
 * CSS puro, sem vídeo nem WebGL (leve e sem custo de geração).
 */
export default function HeroBackground() {
  return (
    <div className="hero-bg">
      <div className="hero-bg__chrome hero-bg__gold" />
      <img className="hero-bg__logo" src={`${import.meta.env.BASE_URL}brand/logo-mikka.jpg`} alt="" aria-hidden="true" draggable="false" />
      <div className="hero-bg__scrim" />
    </div>
  );
}
