/**
 * Configuración de Proxies Rotatorios para Ikigai
 * Usa proxies gratuitos para rotar IP en cada request
 */

/**
 * Lista de proxies CORS gratuitos y servicios alternativos
 * Nota: Proxies gratuitos pueden ser lentos, inestables o bloqueados
 * Rotar entre ellos aumenta la probabilidad de éxito
 */
export const FREE_PROXIES = [
  // Proxies CORS especializados
  {
    url: null,  // Sin proxy directo
    name: 'directo'
  },
  // Más proxies gratuitos pueden agregarse aquí
  // Nota: Proxies HTTP/SOCKS gratuitos rara vez funcionan con Cloudflare
  // La mejor estrategia es usar diferentes estrategias de detección
];

/**
 * Genera un proxy rotatorio basado en la página o random
 * @param {number} seed - Semilla para generación (número de página o random)
 * @returns {string|null} - URL del proxy o null
 */
export function getRotatingProxy(seed) {
  // Por ahora, usamos rotación sin proxy directo
  // La clave es la configuración de anti-detección, no el proxy
  return null;
}

/**
 * Lista de User-Agents adicionales para rotar
 * Usamos muchos UAs diferentes para parecer usuarios distintos
 */
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/116.0.0.0'
];

/**
 * Obtiene un User-Agent rotatorio basado en seed
 * @param {number} seed - Semilla para generación
 * @returns {string} - User-Agent
 */
export function getRotatingUserAgent(seed) {
  return USER_AGENTS[seed % USER_AGENTS.length];
}

/**
 * Configuración avanzada de anti-detección para simular comportamiento humano
 */
export const HUMAN_BEHAVIOR_CONFIG = {
  // Tiempo de espera entre acciones (ms)
  delays: {
    afterPageLoad: 2000,
    afterScroll: 500,
    betweenActions: 300
  },
  // Configuración de scroll
  scroll: {
    steps: 8,           // Número de pasos
    stepDelay: 600,     // ms entre pasos
    finalDelay: 1500     // ms final
  },
  // Movimientos de mouse (simulados)
  mouse: {
    enabled: true,
    jitter: 50          // px de variación aleatoria
  }
};
