/**
 * ================================================
 * IKIGAI PROXY CONFIG - Configuración de filtros
 * ================================================
 *
 * FECHA: 2025-12-28
 * PROPOSITO: Archivo de configuración para filtros de Ikigai
 *
 * CONTENIDO:
 * - URL base del endpoint API de Ikigai
 * - Lista completa de géneros con sus IDs (extraídos del API)
 * - Lista de tipos de contenido (comic/novel)
 * - Lista de estados de publicación
 * - Opciones de ordenamiento disponibles
 * - Funciones de utilidad para construir parámetros de URL
 *
 * IMPORTANTE - LÍMITES DE VERCEL:
 * - Plan gratuito: Máximo 12 funciones serverless
 * - Este archivo NO cuenta como función (no tiene `export default`)
 * - Solo exporta constantes y funciones helper
 * - Por eso está fuera de la carpeta `api/`
 */

/**
 * URL base del endpoint API de Ikigai
 * Este endpoint NO está protegido por Cloudflare
 * Permite búsqueda directa sin necesidad de Puppeteer
 */
export const API_BASE_URL = 'https://panel.ikigaimangas.com/api/swf/series';

/**
 * ================================================
 * GÉNEROS DISPONIBLES
 * ================================================
 *
 * IDs extraídos directamente de la API de Ikigai
 * Cada género tiene: id (para el API), name (para mostrar), slug (para URLs)
 */
export const GENRES = [
  { id: '906397894348570627', name: 'Fantasía', slug: 'fantasia' },
  { id: '906397894527549443', name: 'Romance', slug: 'romance' },
  { id: '906397894408372227', name: 'Shoujo', slug: 'shoujo' },
  { id: '906397903999959043', name: 'Seinen', slug: 'seinen' },
  { id: '906397904061530115', name: 'Aventura', slug: 'aventura' },
  { id: '906397903933407235', name: 'Drama', slug: 'drama' },
  { id: '906398112923385859', name: 'Histórico', slug: 'historico' },
  { id: '906409351382073347', name: 'Psicológico', slug: 'psicologico' },
  { id: '906398112851165187', name: 'Comedia', slug: 'comedia' },
  { id: '906409459593347075', name: 'Magia', slug: 'magia' },
  { id: '906397894469255171', name: 'Regresion', slug: 'regresion' },
  { id: '906410027513937923', name: 'Supernatural', slug: 'supernatural' },
  { id: '906409351272792067', name: '+18', slug: '18' },
  { id: '906409370648543235', name: 'Ecchi', slug: 'ecchi' },
  { id: '906409351330037763', name: 'Boys Love', slug: 'boys-love' },
  { id: '906409644012961795', name: 'Girls Love', slug: 'girls-love' },
  { id: '906409432216403971', name: 'Yaoi', slug: 'yaoi' },
  { id: '906409501957390339', name: 'Josei', slug: 'josei' },
  { id: '906409351272792067', name: 'Adulto', slug: 'adulto' },
  { id: '906409612041551875', name: 'Maduro', slug: 'maduro' },
  { id: '906409400553046019', name: 'Reencarnación', slug: 'reencarnacion' },
  { id: '906409449984655363', name: 'Tragedia', slug: 'tragedia' },
  { id: '906409378688663555', name: 'Transmigración', slug: 'transmigracion' },
  { id: '906409508232822787', name: 'Vida Escolar', slug: 'vida-escolar' },
  { id: '906409374358110211', name: 'MangoScan', slug: 'mangoscan' },
  { id: '906409382934151171', name: 'Invictus Scan', slug: 'invictus-scan' },
  { id: '906409335735582723', name: 'Dragon Translation', slug: 'dragon-translation' },
  { id: '906409374971101187', name: 'Bighitler', slug: 'bighitler' }
];

/**
 * ================================================
 * TIPOS DE CONTENIDO
 * ================================================
 *
 * Ikigai soporta principalmente dos tipos:
 * - comic: Mangas/manhwas
 * - novel: Light novels
 */
export const TYPES = [
  { id: 'comic', name: 'Cómic' },
  { id: 'novel', name: 'Novela' }
];

/**
 * ================================================
 * ESTADOS DE PUBLICACIÓN
 * ================================================
 *
 * Estados que puede tener una obra:
 * - En Curso: Publicación activa
 * - Completado: Finalizada
 * - Pausado: Temporalmente detenida
 * - Hiatus: Pausa indefinida
 * - Abandonada: Cancelada por el autor
 * - Cancelada: Cancelada por otros motivos
 */
export const STATUSES = [
  { id: '911437469204086787', name: 'En Curso' },
  { id: 'completado', name: 'Completado' },
  { id: 'pausado', name: 'Pausado' },
  { id: 'hiatus', name: 'Hiatus' },
  { id: 'abandonada', name: 'Abandonada' },
  { id: 'cancelada', name: 'Cancelada' }
];

/**
 * ================================================
 * OPCIONES DE ORDENAMIENTO
 * ================================================
 *
 * Formas de ordenar los resultados de búsqueda
 */
export const SORT_OPTIONS = [
  { value: 'name', name: 'Nombre (A-Z)' },
  { value: 'created_at', name: 'Fecha de creación' },
  { value: 'updated_at', name: 'Última actualización' },
  { value: 'favorites', name: 'Favoritos' },
  { value: 'rating', name: 'Valoración' },
  { value: 'views', name: 'Vistas' }
];

/**
 * ================================================
 * FUNCIONES DE UTILIDAD
 * ================================================
 */

/**
 * Construye los parámetros de query de URL para Ikigai (site scraping)
 *
 * @param {object} params - Parámetros de búsqueda
 * @param {string} params.query - Texto de búsqueda (opcional)
 * @param {array} params.genres - Array de IDs de géneros (múltiples)
 * @param {array} params.types - Array de IDs de tipos (múltiples)
 * @param {array} params.statuses - Array de IDs de estados (múltiples)
 * @param {string} params.sortBy - Opción de ordenamiento (opcional)
 * @param {number} params.page - Número de página (default: 1)
 * @returns {URLSearchParams} - Parámetros de URL listos para usar
 *
 * NOTA: Esta función construye query params para el sitio web de Ikigai
 *       no para la API directa. El sitio usa:
 *       - buscar: para búsqueda de texto
 *       - generos[]: para filtros de géneros (múltiples)
 *       - tipos[]: para filtros de tipos (múltiples)
 *       - estados[]: para filtros de estados (múltiples)
 *       - ordenar: para ordenamiento
 *       - pagina: para paginación
 */
export function buildApiParams(params = {}) {
  const { query = '', genres = [], types = [], statuses = [], sortBy = '', page = 1 } = params;
  const urlParams = new URLSearchParams();

  // Búsqueda por texto (Ikigai usa 'buscar')
  if (query && query.trim()) {
    urlParams.append('buscar', query.trim());
  }

  // Filtros de géneros (Ikigai usa 'generos[]' - múltiples)
  genres.forEach(genreId => {
    if (genreId) {
      urlParams.append('generos[]', genreId);
    }
  });

  // Filtros de tipos (Ikigai usa 'tipos[]' - múltiples)
  types.forEach(typeId => {
    if (typeId) {
      urlParams.append('tipos[]', typeId);
    }
  });

  // Filtros de estados (Ikigai usa 'estados[]' - múltiples)
  statuses.forEach(statusId => {
    if (statusId) {
      urlParams.append('estados[]', statusId);
    }
  });

  // Ordenamiento (Ikigai usa 'ordenar')
  if (sortBy) {
    urlParams.append('ordenar', sortBy);
  }

  // Paginación (Ikigai usa 'pagina')
  if (page > 1) {
    urlParams.append('pagina', page.toString());
  }

  return urlParams;
}

/**
 * Obtiene la URL completa de la API con parámetros
 *
 * @param {object} params - Parámetros de búsqueda
 * @returns {string} - URL completa lista para usar
 *
 * Ejemplo:
 * getApiUrl({ genres: ['906397894527549443'], page: 2 })
 * => 'https://panel.ikigaimangas.com/api/swf/series?nsfw=true&page=2&genre=906397894527549443'
 */
export function getApiUrl(params = {}) {
  const urlParams = buildApiParams(params);
  return `${API_BASE_URL}?${urlParams.toString()}`;
}

/**
 * Construye la URL del sitio web para scraping directo
 * @param {object} params - Parámetros de búsqueda
 * @returns {string} - URL completa del sitio web para scraping
 *
 * Ejemplo:
 * buildSiteUrl({ genres: ['906397904327999491'], page: 2 })
 * => 'https://viralikigai.eurofiyati.online/series/?generos[]=906397904327999491&pagina=2'
 */
export function buildSiteUrl(params = {}) {
  const urlParams = buildApiParams(params);
  return `https://viralikigai.eurofiyati.online/series/?${urlParams.toString()}`;
}

/**
 * Busca géneros por nombre o slug (case-insensitive)
 *
 * @param {string} search - Texto a buscar
 * @returns {array} - Géneros coincidentes
 *
 * Ejemplo:
 * findGenres('fan') => [{ id: '...', name: 'Fantasía', slug: 'fantasia' }, ...]
 */
export function findGenres(search) {
  const lowerSearch = search.toLowerCase();
  return GENRES.filter(g =>
    g.name.toLowerCase().includes(lowerSearch) ||
    g.slug.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Obtiene un género específico por su ID
 *
 * @param {string} id - ID del género
 * @returns {object|null} - Género encontrado o null
 */
export function getGenreById(id) {
  return GENRES.find(g => g.id === id) || null;
}

/**
 * Obtiene un tipo específico por su ID
 *
 * @param {string} id - ID del tipo
 * @returns {object|null} - Tipo encontrado o null
 */
export function getTypeById(id) {
  return TYPES.find(t => t.id === id) || null;
}

/**
 * Obtiene un estado específico por su ID
 *
 * @param {string} id - ID del estado
 * @returns {object|null} - Estado encontrado o null
 */
export function getStatusById(id) {
  return STATUSES.find(s => s.id === id) || null;
}
