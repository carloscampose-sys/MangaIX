/**
 * Custom React Hook para anime.js
 * Maneja automáticamente el ciclo de vida y limpieza de animaciones
 */

import { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { prefersReducedMotion } from '../utils/animeHelpers';

/**
 * Hook principal para usar anime.js en componentes React
 * @param {Function} animationCallback - Función que retorna la configuración de anime
 * @param {Array} dependencies - Dependencias para re-ejecutar la animación
 * @param {Object} options - Opciones adicionales
 */
export const useAnime = (animationCallback, dependencies = [], options = {}) => {
  const animationRef = useRef(null);
  const {
    autoplay = true,
    respectReducedMotion = true,
  } = options;

  useEffect(() => {
    // Verificar preferencias de accesibilidad
    if (respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    // Crear y ejecutar animación
    if (autoplay) {
      animationRef.current = animationCallback();
    }

    // Cleanup al desmontar
    return () => {
      if (animationRef.current) {
        if (typeof animationRef.current.pause === 'function') {
          animationRef.current.pause();
        }
        animationRef.current = null;
      }
    };
  }, dependencies);

  // Métodos de control
  const play = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.play === 'function') {
      animationRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.pause === 'function') {
      animationRef.current.pause();
    }
  }, []);

  const restart = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.restart === 'function') {
      animationRef.current.restart();
    }
  }, []);

  const reverse = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.reverse === 'function') {
      animationRef.current.reverse();
    }
  }, []);

  return {
    animation: animationRef.current,
    play,
    pause,
    restart,
    reverse,
  };
};

/**
 * Hook para animaciones al montar el componente
 */
export const useAnimeOnMount = (target, animationConfig, options = {}) => {
  const targetRef = useRef(null);

  useEffect(() => {
    if (options.respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    const element = targetRef.current || target;
    if (!element) return;

    const animation = anime({
      targets: element,
      ...animationConfig,
    });

    return () => {
      if (animation && typeof animation.pause === 'function') {
        animation.pause();
      }
    };
  }, []);

  return targetRef;
};

/**
 * Hook para animaciones en hover
 */
export const useAnimeHover = (hoverInConfig, hoverOutConfig, options = {}) => {
  const elementRef = useRef(null);
  const animationRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (options.respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    if (animationRef.current) {
      animationRef.current.pause();
    }

    animationRef.current = anime({
      targets: elementRef.current,
      ...hoverInConfig,
    });
  }, [hoverInConfig]);

  const handleMouseLeave = useCallback(() => {
    if (options.respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    if (animationRef.current) {
      animationRef.current.pause();
    }

    animationRef.current = anime({
      targets: elementRef.current,
      ...hoverOutConfig,
    });
  }, [hoverOutConfig]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      
      if (animationRef.current && typeof animationRef.current.pause === 'function') {
        animationRef.current.pause();
      }
    };
  }, [handleMouseEnter, handleMouseLeave]);

  return elementRef;
};

/**
 * Hook para timeline de anime.js
 */
export const useAnimeTimeline = (timelineConfig, dependencies = [], options = {}) => {
  const timelineRef = useRef(null);

  useEffect(() => {
    if (options.respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    timelineRef.current = anime.timeline(timelineConfig);

    return () => {
      if (timelineRef.current && typeof timelineRef.current.pause === 'function') {
        timelineRef.current.pause();
      }
    };
  }, dependencies);

  const add = useCallback((animationConfig, offset) => {
    if (timelineRef.current) {
      timelineRef.current.add(animationConfig, offset);
    }
    return timelineRef.current;
  }, []);

  const play = useCallback(() => {
    if (timelineRef.current && typeof timelineRef.current.play === 'function') {
      timelineRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (timelineRef.current && typeof timelineRef.current.pause === 'function') {
      timelineRef.current.pause();
    }
  }, []);

  const restart = useCallback(() => {
    if (timelineRef.current && typeof timelineRef.current.restart === 'function') {
      timelineRef.current.restart();
    }
  }, []);

  return {
    timeline: timelineRef.current,
    add,
    play,
    pause,
    restart,
  };
};

/**
 * Hook para animaciones con scroll
 */
export const useAnimeScroll = (target, animationConfig, options = {}) => {
  const {
    threshold = 0.1,
    respectReducedMotion = true,
  } = options;

  useEffect(() => {
    if (respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: element,
              ...animationConfig,
            });
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [target, animationConfig, threshold, respectReducedMotion]);
};

/**
 * Hook para animaciones de stagger
 */
export const useAnimeStagger = (targets, animationConfig, options = {}) => {
  const {
    stagger = 100,
    respectReducedMotion = true,
  } = options;

  useEffect(() => {
    if (respectReducedMotion && prefersReducedMotion()) {
      return;
    }

    const elements = typeof targets === 'string' 
      ? document.querySelectorAll(targets) 
      : targets;
    
    if (!elements || elements.length === 0) return;

    const animation = anime({
      targets: elements,
      delay: anime.stagger(stagger),
      ...animationConfig,
    });

    return () => {
      if (animation && typeof animation.pause === 'function') {
        animation.pause();
      }
    };
  }, [targets, stagger, respectReducedMotion]);
};

/**
 * Hook para controlar animaciones manualmente
 */
export const useAnimeControl = () => {
  const animationRef = useRef(null);

  const create = useCallback((config) => {
    if (animationRef.current && typeof animationRef.current.pause === 'function') {
      animationRef.current.pause();
    }
    
    animationRef.current = anime({
      autoplay: false,
      ...config,
    });
    
    return animationRef.current;
  }, []);

  const play = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.play === 'function') {
      animationRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.pause === 'function') {
      animationRef.current.pause();
    }
  }, []);

  const restart = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.restart === 'function') {
      animationRef.current.restart();
    }
  }, []);

  const reverse = useCallback(() => {
    if (animationRef.current && typeof animationRef.current.reverse === 'function') {
      animationRef.current.reverse();
    }
  }, []);

  const seek = useCallback((time) => {
    if (animationRef.current && typeof animationRef.current.seek === 'function') {
      animationRef.current.seek(time);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current && typeof animationRef.current.pause === 'function') {
        animationRef.current.pause();
      }
    };
  }, []);

  return {
    animation: animationRef.current,
    create,
    play,
    pause,
    restart,
    reverse,
    seek,
  };
};

export default useAnime;
