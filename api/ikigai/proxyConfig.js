/**
 * Configuración de Filtros de Ikigai
 * Basado en el endpoint API directo: https://panel.ikigaimangas.com/api/swf/series
 */

/**
 * URL base del endpoint API
 */
export const API_BASE_URL = 'https://panel.ikigaimangas.com/api/swf/series';

/**
 * Géneros disponibles en Ikigai (IDs extraídos del API)
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
  { id: '906397894527549443', name: 'Romance', slug: 'romance' },
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
 * Tipos de contenido disponibles
 */
export const TYPES = [
  { id: 'comic', name: 'Cómic' },
  { id: 'novel', name: 'Novela' }
];

/**
 * Estados de publicación disponibles
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
 * Opciones de ordenamiento
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
 * Construye los parámetros de URL para la API
 * @param {object} params - Parámetros de búsqueda
 * @param {string} params.query - Texto de búsqueda
 * @param {array} params.genres - Array de IDs de géneros
 * @param {array} params.types - Array de IDs de tipos
 * @param {array} params.statuses - Array de IDs de estados
 * @param {string} params.sortBy - Opción de ordenamiento
 * @param {number} params.page - Número de página
 * @returns {URLSearchParams} - Parámetros de URL
 */
export function buildApiParams(params = {}) {
  const { query = '', genres = [], types = [], statuses = [], sortBy = '', page = 1 } = params;
  const urlParams = new URLSearchParams();

  // Siempre incluir nsfw=true
  urlParams.append('nsfw', 'true');

  // Página
  urlParams.append('page', page.toString());

  // Búsqueda por texto
  if (query && query.trim()) {
    urlParams.append('search', query.trim());
  }

  // Filtros de género (múltiples)
  genres.forEach(genreId => {
    if (genreId) {
      urlParams.append('genre', genreId);
    }
  });

  // Filtros de tipo (múltiples)
  types.forEach(typeId => {
    if (typeId) {
      urlParams.append('type', typeId);
    }
  });

  // Filtros de estado (múltiples)
  statuses.forEach(statusId => {
    if (statusId) {
      urlParams.append('status', statusId);
    }
  });

  // Ordenamiento
  if (sortBy) {
    urlParams.append('order', sortBy);
  }

  return urlParams;
}

/**
 * Obtiene la URL completa de la API
 * @param {object} params - Parámetros de búsqueda
 * @returns {string} - URL completa
 */
export function getApiUrl(params = {}) {
  const urlParams = buildApiParams(params);
  return `${API_BASE_URL}?${urlParams.toString()}`;
}

/**
 * Obtiene géneros por nombre/slug
 * @param {string} search - Texto a buscar
 * @returns {array} - Géneros coincidentes
 */
export function findGenres(search) {
  const lowerSearch = search.toLowerCase();
  return GENRES.filter(g =>
    g.name.toLowerCase().includes(lowerSearch) ||
    g.slug.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Obtiene género por ID
 * @param {string} id - ID del género
 * @returns {object|null} - Género encontrado o null
 */
export function getGenreById(id) {
  return GENRES.find(g => g.id === id) || null;
}

/**
 * Obtiene tipo por ID
 * @param {string} id - ID del tipo
 * @returns {object|null} - Tipo encontrado o null
 */
export function getTypeById(id) {
  return TYPES.find(t => t.id === id) || null;
}

/**
 * Obtiene estado por ID
 * @param {string} id - ID del estado
 * @returns {object|null} - Estado encontrado o null
 */
export function getStatusById(id) {
  return STATUSES.find(s => s.id === id) || null;
}
