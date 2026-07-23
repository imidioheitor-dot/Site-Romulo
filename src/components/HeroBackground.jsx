import { useEffect, useRef, useState } from 'react';
import LiquidChrome from './fx/LiquidChrome';
import Boundary from './fx/Boundary';

/**
 * Fundo do hero: tenta reproduzir o vídeo em /public/media/hero.mp4.
 * Enquanto o vídeo não existir (ou falhar), mostra o shader LiquidChrome
 * animado por baixo — então o hero nunca fica vazio.
 */
export default function HeroBackground() {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onErr = () => setHasVideo(false);
    v.addEventListener('error', onErr, true);
    // se após um tempo não houver dados, considera ausente
    const t = setTimeout(() => {
      if (v.readyState === 0) setHasVideo(false);
    }, 2600);
    return () => {
      v.removeEventListener('error', onErr, true);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="hero-bg">
      <div className="hero-bg__chrome">
        <Boundary>
          <LiquidChrome baseColor={[0.16, 0.09, 0.05]} speed={0.35} amplitude={0.45} frequencyX={2.6} frequencyY={2.2} interactive />
        </Boundary>
      </div>

      <video
        ref={videoRef}
        className={`hero-bg__video ${hasVideo ? 'is-on' : ''}`}
        src={`${import.meta.env.BASE_URL}media/hero.mp4`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      <div className="hero-bg__scrim" />
    </div>
  );
}
