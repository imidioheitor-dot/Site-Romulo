import { useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import './StickerPeel.css';

gsap.registerPlugin(Draggable);

let filterUid = 0;

const StickerPeel = ({
  imageSrc,
  renderImage,
  rotate = 0,
  peelBackHoverPct = 25,
  peelBackActivePct = 40,
  peelEasing = 'power3.out',
  peelHoverEasing = 'power2.out',
  width = 260,
  shadowIntensity = 0.55,
  lightingIntensity = 0.08,
  initialPosition = 'center',
  peelDirection = 0,
  draggable = true,
  className = ''
}) => {
  const containerRef = useRef(null);
  const dragTargetRef = useRef(null);
  const pointLightRef = useRef(null);
  const pointLightFlippedRef = useRef(null);
  const draggableInstanceRef = useRef(null);

  const ids = useMemo(() => {
    filterUid += 1;
    return {
      light: `sp-light-${filterUid}`,
      lightFlip: `sp-light-flip-${filterUid}`,
      shadow: `sp-shadow-${filterUid}`,
      fill: `sp-fill-${filterUid}`
    };
  }, []);

  const defaultPadding = 12;

  useEffect(() => {
    const target = dragTargetRef.current;
    if (!target) return;

    if (typeof initialPosition === 'object' && initialPosition.x !== undefined && initialPosition.y !== undefined) {
      gsap.set(target, { x: initialPosition.x, y: initialPosition.y });
    }
  }, [initialPosition]);

  useEffect(() => {
    if (!draggable) return;
    const target = dragTargetRef.current;
    const boundsEl = target.parentNode;

    draggableInstanceRef.current = Draggable.create(target, {
      type: 'x,y',
      bounds: boundsEl,
      onDrag() {
        const rot = gsap.utils.clamp(-24, 24, this.deltaX * 0.4);
        gsap.to(target, { rotation: rot, duration: 0.15, ease: 'power1.out' });
      },
      onDragEnd() {
        gsap.to(target, { rotation: 0, duration: 0.8, ease: 'power2.out' });
      }
    })[0];

    const handleResize = () => {
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.update();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.kill();
      }
    };
  }, [draggable]);

  useEffect(() => {
    const updateLight = e => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (pointLightRef.current) gsap.set(pointLightRef.current, { attr: { x, y } });

      const normalizedAngle = Math.abs(peelDirection % 360);
      if (pointLightFlippedRef.current) {
        if (normalizedAngle !== 180) {
          gsap.set(pointLightFlippedRef.current, { attr: { x, y: rect.height - y } });
        } else {
          gsap.set(pointLightFlippedRef.current, { attr: { x: -1000, y: -1000 } });
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', updateLight);
      return () => container.removeEventListener('mousemove', updateLight);
    }
  }, [peelDirection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = () => {
      container.classList.add('touch-active');
    };

    const handleTouchEnd = () => {
      container.classList.remove('touch-active');
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const cssVars = useMemo(
    () => ({
      '--sticker-rotate': `${rotate}deg`,
      '--sticker-p': `${defaultPadding}px`,
      '--sticker-peelback-hover': `${peelBackHoverPct}%`,
      '--sticker-peelback-active': `${peelBackActivePct}%`,
      '--sticker-peel-easing': peelEasing,
      '--sticker-peel-hover-easing': peelHoverEasing,
      '--sticker-width': `${width}px`,
      '--sticker-shadow-opacity': shadowIntensity,
      '--sticker-lighting-constant': lightingIntensity,
      '--peel-direction': `${peelDirection}deg`
    }),
    [
      rotate,
      peelBackHoverPct,
      peelBackActivePct,
      peelEasing,
      peelHoverEasing,
      width,
      shadowIntensity,
      lightingIntensity,
      peelDirection
    ]
  );

  const imageEl = renderImage ? (
    <div className="sticker-image" style={{ width: `${width}px` }}>
      {renderImage()}
    </div>
  ) : (
    <img
      src={imageSrc}
      alt=""
      className="sticker-image"
      draggable="false"
      onContextMenu={e => e.preventDefault()}
    />
  );

  const flapImageEl = renderImage ? (
    <div className="flap-image" style={{ width: `${width}px`, filter: `url(#${ids.fill})` }}>
      {renderImage()}
    </div>
  ) : (
    <img
      src={imageSrc}
      alt=""
      className="flap-image"
      style={{ filter: `url(#${ids.fill})` }}
      draggable="false"
      onContextMenu={e => e.preventDefault()}
    />
  );

  return (
    <div className={`sticker-draggable ${className}`} ref={dragTargetRef} style={cssVars}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={ids.light}>
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity}
              lightingColor="white"
            >
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id={ids.lightFlip}>
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity * 7}
              lightingColor="white"
            >
              <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>

          <filter id={ids.shadow}>
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation={3 * shadowIntensity}
              floodColor="black"
              floodOpacity={shadowIntensity}
            />
          </filter>

          <filter id={ids.fill}>
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(140,160,190)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      <div className="sticker-container" ref={containerRef}>
        <div className="sticker-main" style={{ filter: `url(#${ids.shadow})` }}>
          <div className="sticker-lighting" style={{ filter: `url(#${ids.light})` }}>
            {imageEl}
          </div>
        </div>

        <div className="sticker-flap">
          <div className="flap-lighting" style={{ filter: `url(#${ids.lightFlip})` }}>
            {flapImageEl}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerPeel;
