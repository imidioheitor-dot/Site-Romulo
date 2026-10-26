import { useEffect, useRef, useState } from 'react';

/**
 * Primeiro quadro do site: só o vídeo em tela cheia (public/media/hero.mp4).
 * Sem texto por cima. Se o vídeo não carregar, fica a cor de fundo escura.
 */
export default function HeroBackground() {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onErr = () => setHasVideo(false);
    v.addEventListener('error', onErr, true);
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
      <div className="hero-bg__vinheta" />
    </div>
  );
}
