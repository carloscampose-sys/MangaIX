import axios from 'axios';

const BASE_URL = 'https://viralikigai.learnixs.site';

/**
 * Detecta si estamos en localhost
 */
const isLocalhost = () => {
  return typeof window !== 'undefined' &&
         (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');
};

/**
 * Busca obras en Ikigai Mangas
 *
 * En LOCAL: Muestra mensaje informativo (Ikigai requiere API serverless)
 * En PRODUCCIÓN: Usa API serverless con Puppeteer
 */
export const searchIkigai = async (query = '', filters = {}, page = 1) => {
  try {
    console.log(`[Ikigai] Buscando: "${query}"`, filters);

    // Permitir búsquedas solo con filtros (sin query de texto)
    if ((!query || query.trim() === '') && (!filters.genres || filters.genres.length === 0)) {
      console.log('[Ikigai] Búsqueda vacía sin filtros, retornando array vacío');
      return [];
    }

    // Detectar si estamos en local o producción
    if (isLocalhost()) {
      // En local, no podemos usar la API serverless con Vite
      console.warn('[Ikigai] ⚠️ Búsqueda no disponible en local.');
      console.warn('[Ikigai] 💡 Para probar Ikigai, despliega a Vercel o usa Vercel CLI.');
      console.warn('[Ikigai] 📚 TuManga funciona perfectamente en local.');

      // Retornar array vacío para que no rompa la UI
      return [];
    }

    // En producción, usar la API serverless
    console.log('[Ikigai Service] Enviando búsqueda - Página:', page);

    const response = await axios.post('/api/ikigai/search', {
      query: query || '',
      filters: {
        types: filters.types || [],
        statuses: filters.statuses || [],
        genres: filters.genres || [],
        sortBy: filters.sortBy || ''
      },
      page: page || 1
    }, {
      timeout: 60000 // 60 segundos para Puppeteer
    });

    if (response.data.results) {
      const results = response.data.results.map((item, index) => ({
        id: `ikigai-${item.slug}-${Date.now()}-${index}`,
        slug: item.slug,
        title: item.title,
        cover: item.cover,
        source: 'ikigai'
      }));

      console.log(`[Ikigai] Encontradas ${results.length} obras`);
      return results;
    } else {
      console.error('[Ikigai] Respuesta inválida de la API');
      return [];
    }
  } catch (error) {
    console.error('[Ikigai] Error en búsqueda:', error);
    return [];
  }
};

/**
 * Obtiene los detalles completos de una obra
 */
export const getIkigaiDetails = async (slug) => {
  try {
    console.log(`[Ikigai] Obteniendo detalles de: ${slug}`);

    // Detectar si estamos en local o producción
    if (isLocalhost()) {
      // En local, devolver datos básicos sin API
      console.warn('[Ikigai] ⚠️ Detalles limitados en local. Despliega a Vercel para sinopsis reales.');

      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      return {
        id: `ikigai-${slug}`,
        slug,
        title,
        cover: '',
        description: "Sinopsis no disponible en local. Despliega a Vercel para ver detalles completos. 🌸",
        genres: [],
        status: 'En Curso',
        author: '',
        lastChapter: '?',
        chaptersCount: 0,
        source: 'ikigai'
      };
    }

    // En producción, usar la API serverless con Puppeteer
    console.log('[Ikigai] Llamando a API de detalles...');

    const response = await axios.post('/api/ikigai/details', {
      slug
    }, {
      timeout: 35000 // 35 segundos
    });

    if (response.data) {
      const details = response.data;

      console.log('[Ikigai] Detalles obtenidos:', {
        title: details.title,
        synopsisLength: details.synopsis?.length || 0,
        author: details.author,
        genresCount: details.genres?.length || 0
      });

      return {
        id: `ikigai-${slug}`,
        slug,
        title: details.title,
        cover: details.cover || '',
        description: details.synopsis || "Sinopsis no disponible para esta obra.",
        genres: details.genres || [],
        status: details.status || 'En Curso',
        author: details.author || '',
        lastChapter: '?',
        chaptersCount: 0,
        source: 'ikigai'
      };
    } else {
      console.error('[Ikigai] Respuesta inválida de la API de detalles');
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('[Ikigai] Error obteniendo detalles:', error);

    // Fallback: devolver datos básicos
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
      id: `ikigai-${slug}`,
      slug,
      title,
      cover: '',
      description: "No se pudo cargar la sinopsis. Inténtalo de nuevo más tarde. 🌸",
      genres: [],
      status: 'En Curso',
      author: '',
      lastChapter: '?',
      chaptersCount: 0,
      source: 'ikigai'
    };
  }
};

/**
 * Obtiene la lista de capítulos de una obra usando API serverless con Puppeteer
 */
export const getIkigaiChapters = async (slug) => {
  try {
    console.log(`[Ikigai] Obteniendo capítulos de: ${slug}`);

    // Detectar si estamos en local
    if (isLocalhost()) {
      console.warn('[Ikigai] ⚠️ Capítulos no disponibles en local.');
      console.warn('[Ikigai] 💡 Para ver capítulos, despliega a Vercel.');
      return [];
    }

    // En producción, usar la API serverless
    const response = await axios.post('/api/ikigai/chapters', {
      slug
    }, {
      timeout: 50000 // 50 segundos (puede tardar si hay muchas páginas)
    });

    if (response.data.chapters) {
      const chapters = response.data.chapters.map((item, index) => ({
        id: `ikigai-${slug}-ch-${item.chapter}-${Date.now()}-${index}`,
        slug,
        chapter: item.chapter,
        title: item.title,
        url: item.url,
        chapterId: item.chapterId  // ID largo necesario para la URL de lectura
      }));

      console.log(`[Ikigai] Encontrados ${chapters.length} capítulos`);
      return chapters;
    } else {
      console.error('[Ikigai] Respuesta inválida de la API');
      return [];
    }
  } catch (error) {
    console.error('[Ikigai] Error obteniendo capítulos:', error);
    return [];
  }
};

/**
 * Obtiene las páginas/imágenes de un capítulo usando la API serverless
 *
 * En LOCAL: No funciona (requiere API serverless)
 * En PRODUCCIÓN: Usa API serverless con Puppeteer
 *
 * @param {string} slug - Slug de la serie
 * @param {string} chapter - Número del capítulo
 * @param {string} chapterId - ID largo del capítulo (necesario para URL)
 */
export const getIkigaiPages = async (slug, chapter, chapterId) => {
  try {
    console.log(`[Ikigai] Obteniendo páginas del capítulo ${chapter} de ${slug} (ID: ${chapterId})`);

    // Detectar si estamos en local
    if (isLocalhost()) {
      console.warn('[Ikigai] ⚠️ Lectura no disponible en local.');
      console.warn('[Ikigai] 💡 Para leer, despliega a Vercel.');
      return [];
    }

    const response = await axios.post('/api/ikigai/pages', {
      slug,
      chapter,
      chapterId  // ID largo necesario para construir la URL correcta
    }, {
      timeout: 30000
    });

    if (response.data.pages) {
      console.log(`[Ikigai] Obtenidas ${response.data.pages.length} páginas`);
      return response.data.pages;
    } else {
      console.error('[Ikigai] Respuesta inválida de la API');
      return [];
    }
  } catch (error) {
    console.error('[Ikigai] Error obteniendo páginas:', error);
    return [];
  }
};

/**
 * Obtiene una obra aleatoria (para el Oráculo)
 * @param {array} genreValues - Array de IDs de géneros (ej: ["906397904327999491", "906397904169861123"])
 * @returns {Promise<object|null>} Obra aleatoria con detalles completos
 */
export const getRandomIkigai = async (genreValues = []) => {
  try {
    console.log('[Ikigai] Obteniendo obra aleatoria con géneros:', genreValues);

    // Construir filtros
    const filters = genreValues.length > 0
      ? { genres: genreValues }
      : {};

    // Primero obtener info de paginación con página 1
    const firstPageResponse = await axios.post('/api/ikigai/search', {
      query: '',
      filters: {
        genres: filters.genres || [],
        types: [],
        statuses: [],
        sortBy: ''
      },
      page: 1
    }, { timeout: 30000 });

    const totalPages = firstPageResponse.data.totalPages || 1;
    const total = firstPageResponse.data.total || 0;

    console.log(`[Ikigai Random] Total: ${total} obras en ${totalPages} páginas`);

    if (total === 0) {
      console.log('[Ikigai] No se encontraron resultados con filtros');
      return null;
    }

    // Seleccionar una página aleatoria
    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    console.log(`[Ikigai Random] Página aleatoria seleccionada: ${randomPage}/${totalPages}`);

    // Si es la página 1, usar los resultados que ya tenemos
    let results;
    if (randomPage === 1) {
      results = firstPageResponse.data.results || [];
    } else {
      // Buscar en la página aleatoria
      const randomPageResponse = await axios.post('/api/ikigai/search', {
        query: '',
        filters: {
          genres: filters.genres || [],
          types: [],
          statuses: [],
          sortBy: ''
        },
        page: randomPage
      }, { timeout: 30000 });
      results = randomPageResponse.data.results || [];
    }

    if (results.length === 0) {
      console.log('[Ikigai] Página vacía, usando página 1');
      results = firstPageResponse.data.results || [];
    }

    // Seleccionar una obra aleatoria de la página
    const randomIndex = Math.floor(Math.random() * results.length);
    const randomWork = results[randomIndex];

    console.log(`[Ikigai Random] Obra seleccionada: ${randomWork.title} (página ${randomPage}, índice ${randomIndex})`);
    return await getIkigaiDetails(randomWork.slug);
  } catch (error) {
    console.error('[Ikigai] Error obteniendo obra aleatoria:', error);
    return null;
  }
};
