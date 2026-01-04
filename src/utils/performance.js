/**
 * Utilidades de performance para monitoreo y optimización
 */

/**
 * Registrar tiempo de ejecución de una función
 * @param {string} name - Nombre de la métrica
 * @param {Function} fn - Función a medir
 * @returns {*} Resultado de la función
 */
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
};

/**
 * Crear una versión throttled de una función
 * @param {Function} func - Función a throttle
 * @param {number} delay - Delay en ms
 * @returns {Function} Función throttled
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

/**
 * Crear una versión debounced de una función
 * @param {Function} func - Función a debounce
 * @param {number} delay - Delay en ms
 * @returns {Function} Función debounced
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Detectar si el dispositivo es móvil
 * @returns {boolean}
 */
export const isMobile = () => {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
};

/**
 * Detectar si el usuario prefiere reducir movimiento
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  return typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Verificar si el dispositivo tiene poca memoria (indicador de móvil lento)
 * @returns {boolean}
 */
export const isLowPowerMode = () => {
  if (typeof navigator === 'undefined' || !navigator.deviceMemory) {
    return isMobile(); // Fallback: asumir que móvil = baja potencia
  }
  return navigator.deviceMemory <= 4; // 4GB o menos = baja potencia
};
