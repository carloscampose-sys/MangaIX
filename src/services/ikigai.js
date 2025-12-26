// ========================================
// CONFIGURACIÓN
// ========================================
const IKIGAI_BASE_URL = 'https://viralikigai.ozoviral.xyz';

/**
 * Detecta el entorno de ejecución
 */
const detectEnvironment = () => {
  const isLocal = typeof window !== 'undefined' &&
                 (window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1');

  const apiUrl = typeof window !== 'undefined'
    ? window.location.origin
    : '';

  return { isLocal, apiUrl };
};

// ========================================
// BÚSQUEDA
// ========================================

/**
 * Búsqueda de mangas en Ikigai con filtros
 * @param {string} query - Término de búsqueda (opcional)
 * @param {object} filters - Filtros aplicados
 * @param {number} page - Página actual
 * @returns {Promise<Array>} - Array de resultados
 */
export async function searchIkigai(query = '', filters = {}, page = 1) {
  const { isLocal, apiUrl } = detectEnvironment();

  if (isLocal) {
    console.warn('[Ikigai] No disponible en localhost - requiere Puppeteer en Vercel');
    return [];
  }

  try {
    console.log('[Ikigai] Búsqueda:', { query, filters, page });

    const response = await fetch(`${apiUrl}/api/ikigai/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, filters, page })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[Ikigai] ${data.results?.length || 0} resultados encontrados`);

    return data.results || [];
  } catch (error) {
    console.error('[Ikigai] Error en búsqueda:', error);
    return [];
  }
}

// ========================================
// DETALLES
// ========================================

/**
 * Obtiene los detalles completos de una obra
 * @param {string} slug - Slug de la obra
 * @returns {Promise<object|null>} - Detalles de la obra
 */
export async function getIkigaiDetails(slug) {
  const { isLocal, apiUrl } = detectEnvironment();

  if (isLocal) {
    console.warn('[Ikigai] No disponible en localhost');
    return null;
  }

  try {
    console.log('[Ikigai] Obteniendo detalles de:', slug);

    const response = await fetch(`${apiUrl}/api/ikigai/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('[Ikigai] Detalles obtenidos:', data.title);

    return data;
  } catch (error) {
    console.error('[Ikigai] Error obteniendo detalles:', error);
    return null;
  }
}

// ========================================
// CAPÍTULOS
// ========================================

/**
 * Obtiene todos los capítulos de una obra (con paginación automática)
 * @param {string} slug - Slug de la obra
 * @returns {Promise<Array>} - Array de capítulos
 */
export async function getIkigaiChapters(slug) {
  const { isLocal, apiUrl } = detectEnvironment();

  if (isLocal) {
    console.warn('[Ikigai] No disponible en localhost');
    return [];
  }

  try {
    console.log('[Ikigai] Obteniendo capítulos de:', slug);

    const response = await fetch(`${apiUrl}/api/ikigai/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[Ikigai] ${data.total || 0} capítulos obtenidos (${data.pagesScanned || 0} páginas escaneadas)`);

    return data.chapters || [];
  } catch (error) {
    console.error('[Ikigai] Error obteniendo capítulos:', error);
    return [];
  }
}

// ========================================
// PÁGINAS (IMÁGENES)
// ========================================

/**
 * Obtiene las páginas/imágenes de un capítulo
 * @param {string} slug - Slug de la obra
 * @param {string} chapter - Número del capítulo
 * @returns {Promise<Array>} - Array de URLs de imágenes
 */
export async function getIkigaiPages(slug, chapter) {
  const { isLocal, apiUrl } = detectEnvironment();

  if (isLocal) {
    console.warn('[Ikigai] No disponible en localhost');
    return [];
  }

  try {
    console.log('[Ikigai] Obteniendo páginas de:', slug, 'capítulo', chapter);

    const response = await fetch(`${apiUrl}/api/ikigai/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, chapter })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[Ikigai] ${data.total || 0} páginas obtenidas`);

    return data.pages || [];
  } catch (error) {
    console.error('[Ikigai] Error obteniendo páginas:', error);
    return [];
  }
}

// ========================================
// ALEATORIO (ORÁCULO)
// ========================================

/**
 * Obtiene una obra aleatoria basada en géneros
 * @param {Array<string>} genreIds - Array de IDs de géneros
 * @returns {Promise<object|null>} - Obra aleatoria con detalles
 */
export async function getRandomIkigai(genreIds = []) {
  const { isLocal } = detectEnvironment();

  if (isLocal) {
    console.warn('[Ikigai] No disponible en localhost');
    return null;
  }

  try {
    console.log('[Ikigai] Obteniendo obra aleatoria con géneros:', genreIds);

    // Buscar con los géneros especificados
    const filters = {
      genres: genreIds
    };

    const results = await searchIkigai('', filters, 1);

    if (!results || results.length === 0) {
      console.warn('[Ikigai] No se encontraron resultados para géneros especificados');
      return null;
    }

    // Seleccionar un resultado aleatorio
    const randomIndex = Math.floor(Math.random() * Math.min(results.length, 20));
    const randomResult = results[randomIndex];

    if (!randomResult || !randomResult.slug) {
      console.warn('[Ikigai] Resultado aleatorio inválido');
      return null;
    }

    // Obtener los detalles completos
    const details = await getIkigaiDetails(randomResult.slug);

    if (!details) {
      console.warn('[Ikigai] No se pudieron obtener detalles de la obra aleatoria');
      return null;
    }

    // Combinar datos básicos con detalles completos
    return {
      ...randomResult,
      ...details,
      slug: randomResult.slug,
      source: 'ikigai'
    };
  } catch (error) {
    console.error('[Ikigai] Error obteniendo obra aleatoria:', error);
    return null;
  }
}

// ========================================
// EXPORTACIONES
// ========================================

export default {
  searchIkigai,
  getIkigaiDetails,
  getIkigaiChapters,
  getIkigaiPages,
  getRandomIkigai
};
