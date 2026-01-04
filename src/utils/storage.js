/**
 * Utilidad segura para localStorage
 * Maneja errores y fallas en Chrome headless/Lighthouse
 */

export const safeLocalStorage = {
  /**
   * Obtener valor del localStorage con try-catch
   * @param {string} key - Clave a obtener
   * @returns {string|null} Valor o null si falla
   */
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[storage] Failed to get localStorage item:', key, error);
      return null;
    }
  },

  /**
   * Guardar valor en localStorage con try-catch
   * @param {string} key - Clave a guardar
   * @param {string} value - Valor a guardar
   * @returns {boolean} true si éxito, false si falla
   */
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('[storage] Failed to set localStorage item:', key, error);
      return false;
    }
  },

  /**
   * Eliminar valor del localStorage
   * @param {string} key - Clave a eliminar
   * @returns {boolean} true si éxito, false si falla
   */
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('[storage] Failed to remove localStorage item:', key, error);
      return false;
    }
  },

  /**
   * Limpiar todo el localStorage
   * @returns {boolean} true si éxito, false si falla
   */
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('[storage] Failed to clear localStorage:', error);
      return false;
    }
  }
};

/**
 * Detectar si estamos en un entorno de test automatizado
 * @returns {boolean}
 */
export const isAutomatedTest = () => {
  if (typeof navigator === 'undefined') return false;
  return /HeadlessChrome|Lighthouse|puppeteer|PhantomJS/i.test(navigator.userAgent);
};

export default safeLocalStorage;
