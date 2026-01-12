import axios from 'axios';

const API_BASE = '/api/manhwaweb';

export const normalizeTitle = (title) => {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/[''"!-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const searchManhwaWeb1 = async (query = '', filters = {}, page = 1) => {
  try {
    console.log(`[ManhwaWeb1] Buscando: "${query}"`, filters);
    
    const params = {
      query: query || '',
      genres: filters.genres ? filters.genres.join(',') : ''
    };
    
    if (filters.type && filters.type !== '') {
      params.type = filters.type;
    }
    if (filters.status && filters.status !== '') {
      params.status = filters.status;
    }
    if (filters.erotic && filters.erotic !== '') {
      params.erotic = filters.erotic;
    }
    if (filters.demographic && filters.demographic !== '') {
      params.demographic = filters.demographic;
    }
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
    }
    if (filters.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }
    if (page) {
      params.page = String(page || 1);
    }

    const response = await axios.get(`${API_BASE}/search-direct`, {
      params,
      timeout: 20000
    });

    if (response.data.success && response.data.results) {
      const results = response.data.results.map((item, index) => ({
        id: `manhwaweb1-${item.slug}-${Date.now()}-${index}`,
        slug: item.slug,
        title: item.title,
        cover: item.cover,
        source: 'manhwaweb1'
      }));

      console.log(`[ManhwaWeb1] Encontradas ${results.length} obras`);
      return results;
    } else {
      console.error('[ManhwaWeb1] Respuesta inválida de la API');
      return [];
    }
  } catch (error) {
    console.error('[ManhwaWeb1] Error en búsqueda:', error);
    return [];
  }
};

export const getManhwaWeb1Details = async (slug) => {
  try {
    console.log(`[ManhwaWeb1] Obteniendo detalles de: ${slug}`);

    const response = await axios.get(`${API_BASE}/details`, {
      params: { slug },
      timeout: 20000
    });

    if (response.data.success && response.data.details) {
      const details = response.data.details;

      return {
        id: `manhwaweb1-${slug}`,
        slug: details.slug,
        title: details.title,
        cover: details.cover || '',
        description: details.description || "Sinopsis no disponible.",
        genres: details.genres || [],
        status: details.status || 'ongoing',
        author: details.author || '',
        chaptersCount: details.chapters_count || 0,
        chapters: details.chapters || [],
        source: 'manhwaweb1'
      };
    } else {
      console.error('[ManhwaWeb1] Respuesta inválida de la API de detalles');
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('[ManhwaWeb1] Error obteniendo detalles:', error);
    throw error;
  }
};

export const getManhwaWeb1Chapters = async (slug) => {
  try {
    console.log(`[ManhwaWeb1] Obteniendo capítulos de: ${slug}`);

    const response = await axios.get(`${API_BASE}/details`, {
      params: { slug },
      timeout: 20000
    });

    if (response.data.success && response.data.details) {
      const chapters = response.data.details.chapters.map((item, index) => ({
        id: `manhwaweb1-${slug}-ch-${item.chapter}-${Date.now()}-${index}`,
        slug,
        chapter: item.chapter,
        title: item.title,
        url: item.url
      }));

      console.log(`[ManhwaWeb1] Encontrados ${chapters.length} capítulos`);
      return chapters;
    } else {
      console.error('[ManhwaWeb1] Respuesta inválida de la API');
      return [];
    }
  } catch (error) {
    console.error('[ManhwaWeb1] Error obteniendo capítulos:', error);
    return [];
  }
};

export const getManhwaWeb1Images = async (slug, chapter) => {
  try {
    console.log(`[ManhwaWeb1] Obteniendo imágenes del capítulo ${chapter} de ${slug}`);

    const response = await axios.get(`${API_BASE}/pages`, {
      params: { slug, chapter },
      timeout: 20000
    });

    if (response.data.success && response.data.images) {
      console.log(`[ManhwaWeb1] Obtenidas ${response.data.images.length} imágenes`);
      return response.data.images;
    } else {
      console.error('[ManhwaWeb1] Respuesta inválida de la API');
      return [];
    }
  } catch (error) {
    console.error('[ManhwaWeb1] Error obteniendo imágenes:', error);
    return [];
  }
};

export const getManhwaWeb1ChapterNav = async (slug, chapter) => {
  try {
    console.log(`[ManhwaWeb1] Obteniendo navegación del capítulo ${chapter} de ${slug}`);

    const response = await axios.get(`${API_BASE}/pages`, {
      params: { slug, chapter, action: 'nav' },
      timeout: 20000
    });

    if (response.data.success) {
      return response.data;
    } else {
      console.error('[ManhwaWeb1] Respuesta inválida de la API de navegación');
      return {
        success: false,
        current: { slug, chapter: parseFloat(chapter) },
        previous: null,
        next: null
      };
    }
  } catch (error) {
    console.error('[ManhwaWeb1] Error obteniendo navegación:', error);
    return {
      success: false,
      current: { slug, chapter: parseFloat(chapter) },
      previous: null,
      next: null
    };
  }
};

export const getManhwaWeb1Nuevos = async () => {
  try {
    console.log('[ManhwaWeb1] Obteniendo obras nuevas');

    const response = await axios.get(`${API_BASE}/search`, {
      params: { action: 'nuevos' },
      timeout: 20000
    });

    if (response.data.success && response.data.results) {
      const results = response.data.results.map((item, index) => ({
        id: `manhwaweb1-new-${item.slug}-${Date.now()}-${index}`,
        slug: item.slug,
        title: item.title,
        cover: item.cover,
        source: 'manhwaweb1'
      }));

      console.log(`[ManhwaWeb1] Encontradas ${results.length} obras nuevas`);
      return results;
    } else {
      console.error('[ManhwaWeb1] Respuesta inválida de la API');
      return [];
    }
  } catch (error) {
    console.error('[ManhwaWeb1] Error obteniendo obras nuevas:', error);
    return [];
  }
};
