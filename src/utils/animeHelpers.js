/**
 * Anime.js Helper Utilities
 * Funciones reutilizables y configuraciones para animaciones con anime.js
 */

import anime from 'animejs/lib/anime.es.js';

// ============================================================
// CONFIGURACIONES PREDEFINIDAS
// ============================================================

export const ANIME_EASINGS = {
  // Easings suaves para entradas
  easeOutElastic: 'easeOutElastic(1, .8)',
  easeOutBounce: 'easeOutBounce',
  easeOutBack: 'easeOutBack',
  
  // Easings para salidas
  easeInBack: 'easeInBack',
  easeInQuad: 'easeInQuad',
  
  // Easings suaves generales
  easeInOutQuad: 'easeInOutQuad',
  easeInOutCubic: 'easeInOutCubic',
  easeInOutQuart: 'easeInOutQuart',
  
  // Easings especiales
  spring: 'spring(1, 80, 10, 0)',
  elastic: 'easeOutElastic(1, .6)',
};

export const ANIME_DURATIONS = {
  fast: 300,
  medium: 600,
  slow: 900,
  verySlow: 1200,
};

export const ANIME_DELAYS = {
  none: 0,
  short: 100,
  medium: 200,
  long: 400,
};

// ============================================================
// UTILIDADES DE ANIMACIÓN
// ============================================================

/**
 * Crea una animación de entrada con fade y slide
 * @param {string|HTMLElement} target - Selector o elemento DOM
 * @param {Object} options - Opciones adicionales
 */
export const fadeInUp = (target, options = {}) => {
  return anime({
    targets: target,
    translateY: [40, 0],
    opacity: [0, 1],
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeOutCubic,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Crea una animación de entrada con fade y slide desde la izquierda
 */
export const fadeInLeft = (target, options = {}) => {
  return anime({
    targets: target,
    translateX: [-40, 0],
    opacity: [0, 1],
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeOutCubic,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Crea una animación de entrada con fade y slide desde la derecha
 */
export const fadeInRight = (target, options = {}) => {
  return anime({
    targets: target,
    translateX: [40, 0],
    opacity: [0, 1],
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeOutCubic,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Crea una animación de salida con fade y slide hacia abajo
 */
export const fadeOutDown = (target, options = {}) => {
  return anime({
    targets: target,
    translateY: [0, 40],
    opacity: [1, 0],
    duration: options.duration || ANIME_DURATIONS.fast,
    easing: options.easing || ANIME_EASINGS.easeInQuad,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Crea una animación de scale con bounce
 */
export const scaleInBounce = (target, options = {}) => {
  return anime({
    targets: target,
    scale: [0, 1],
    opacity: [0, 1],
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeOutElastic,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Crea una animación de scale out
 */
export const scaleOut = (target, options = {}) => {
  return anime({
    targets: target,
    scale: [1, 0],
    opacity: [1, 0],
    duration: options.duration || ANIME_DURATIONS.fast,
    easing: options.easing || ANIME_EASINGS.easeInBack,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Crea una animación de rotación con entrada
 */
export const rotateIn = (target, options = {}) => {
  return anime({
    targets: target,
    rotate: [options.from || -180, 0],
    scale: [0.5, 1],
    opacity: [0, 1],
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeOutBack,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Crea una animación de pulse (latido)
 */
export const pulse = (target, options = {}) => {
  return anime({
    targets: target,
    scale: [1, 1.05, 1],
    duration: options.duration || 800,
    easing: ANIME_EASINGS.easeInOutQuad,
    loop: options.loop !== undefined ? options.loop : true,
    ...options,
  });
};

/**
 * Crea una animación de shake (sacudida)
 */
export const shake = (target, options = {}) => {
  return anime({
    targets: target,
    translateX: [
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: 0, duration: 100 },
    ],
    easing: 'easeInOutSine',
    ...options,
  });
};

/**
 * Crea una animación de glow (brillo pulsante)
 */
export const glow = (target, options = {}) => {
  return anime({
    targets: target,
    boxShadow: [
      { value: '0 0 10px rgba(185, 243, 179, 0.5)' },
      { value: '0 0 20px rgba(185, 243, 179, 0.8)' },
      { value: '0 0 10px rgba(185, 243, 179, 0.5)' },
    ],
    duration: options.duration || 1500,
    easing: ANIME_EASINGS.easeInOutQuad,
    loop: options.loop !== undefined ? options.loop : true,
    ...options,
  });
};

// ============================================================
// ANIMACIONES CON STAGGER (ESCALONADAS)
// ============================================================

/**
 * Anima múltiples elementos con efecto stagger
 */
export const staggerFadeIn = (targets, options = {}) => {
  return anime({
    targets,
    translateY: [40, 0],
    opacity: [0, 1],
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeOutCubic,
    delay: anime.stagger(options.stagger || 100, {
      start: options.startDelay || 0,
    }),
    ...options,
  });
};

/**
 * Anima múltiples elementos con efecto stagger desde diferentes direcciones
 */
export const staggerFromGrid = (targets, options = {}) => {
  return anime({
    targets,
    scale: [0, 1],
    opacity: [0, 1],
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeOutElastic,
    delay: anime.stagger(100, {
      grid: options.grid || [3, 3],
      from: options.from || 'center',
    }),
    ...options,
  });
};

// ============================================================
// ANIMACIONES DE TEXTO
// ============================================================

/**
 * Efecto de typing (escritura) para texto
 */
export const typingEffect = (target, options = {}) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return null;

  const text = options.text || element.textContent;
  element.textContent = '';
  
  const chars = text.split('');
  const fragment = document.createDocumentFragment();
  
  chars.forEach((char) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.opacity = '0';
    fragment.appendChild(span);
  });
  
  element.appendChild(fragment);
  
  return anime({
    targets: element.querySelectorAll('span'),
    opacity: [0, 1],
    duration: options.duration || 50,
    easing: 'linear',
    delay: anime.stagger(options.stagger || 50),
    complete: options.complete,
  });
};

/**
 * Efecto de scramble (texto aleatorio que se resuelve)
 */
export const scrambleText = (target, options = {}) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return null;

  const finalText = options.text || element.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  
  let iteration = 0;
  const duration = options.duration || 1000;
  const interval = 30;
  const iterations = duration / interval;
  
  const intervalId = setInterval(() => {
    element.textContent = finalText
      .split('')
      .map((char, index) => {
        if (index < iteration) {
          return finalText[index];
        }
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');
    
    iteration += 1 / iterations * finalText.length;
    
    if (iteration >= finalText.length) {
      clearInterval(intervalId);
      element.textContent = finalText;
      if (options.complete) options.complete();
    }
  }, interval);
  
  return { pause: () => clearInterval(intervalId) };
};

// ============================================================
// UTILIDADES PARA REACT
// ============================================================

/**
 * Hook helper para usar anime.js en React
 * Limpia automáticamente las animaciones al desmontar
 */
export const createAnimeInstance = (callback) => {
  const instance = callback();
  
  return {
    animation: instance,
    cleanup: () => {
      if (instance && instance.pause) {
        instance.pause();
      }
    },
  };
};

/**
 * Verifica si el usuario prefiere movimiento reducido
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Wrapper que respeta las preferencias de accesibilidad
 */
export const accessibleAnime = (animationFn, fallbackFn = null) => {
  if (prefersReducedMotion()) {
    return fallbackFn ? fallbackFn() : null;
  }
  return animationFn();
};

// ============================================================
// ANIMACIONES DE SVG
// ============================================================

/**
 * Anima el path de un SVG (draw effect)
 */
export const drawSVGPath = (target, options = {}) => {
  const path = typeof target === 'string' ? document.querySelector(target) : target;
  if (!path) return null;

  const pathLength = path.getTotalLength();
  
  path.style.strokeDasharray = pathLength;
  path.style.strokeDashoffset = pathLength;
  
  return anime({
    targets: path,
    strokeDashoffset: [pathLength, 0],
    duration: options.duration || ANIME_DURATIONS.slow,
    easing: options.easing || ANIME_EASINGS.easeInOutQuart,
    delay: options.delay || 0,
    ...options,
  });
};

/**
 * Anima el morphing entre dos paths SVG
 */
export const morphSVGPath = (target, options = {}) => {
  return anime({
    targets: target,
    d: options.path,
    duration: options.duration || ANIME_DURATIONS.medium,
    easing: options.easing || ANIME_EASINGS.easeInOutQuart,
    ...options,
  });
};

// ============================================================
// TIMELINE HELPERS
// ============================================================

/**
 * Crea un timeline básico con configuración común
 */
export const createTimeline = (options = {}) => {
  return anime.timeline({
    easing: options.easing || ANIME_EASINGS.easeOutCubic,
    duration: options.duration || ANIME_DURATIONS.medium,
    ...options,
  });
};

/**
 * Timeline para secuencia de entrada de página
 */
export const pageEntranceTimeline = (options = {}) => {
  const tl = createTimeline(options);
  
  return {
    timeline: tl,
    addTitle: (target, delay = 0) => {
      tl.add({
        targets: target,
        translateY: [60, 0],
        opacity: [0, 1],
        duration: ANIME_DURATIONS.medium,
        easing: ANIME_EASINGS.easeOutCubic,
      }, delay);
      return tl;
    },
    addSubtitle: (target, delay = 0) => {
      tl.add({
        targets: target,
        translateY: [40, 0],
        opacity: [0, 1],
        duration: ANIME_DURATIONS.medium,
        easing: ANIME_EASINGS.easeOutCubic,
      }, delay);
      return tl;
    },
    addContent: (target, delay = 0) => {
      tl.add({
        targets: target,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: ANIME_DURATIONS.medium,
        easing: ANIME_EASINGS.easeOutCubic,
      }, delay);
      return tl;
    },
  };
};

// ============================================================
// EXPORTAR ANIME DIRECTAMENTE PARA CASOS AVANZADOS
// ============================================================

export { anime as default };
