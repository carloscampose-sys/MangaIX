import axios from 'axios';
import { MANHWAWEB_GENRES } from './manhwawebFilters';

const API_BASE = '/api/manhwaweb';

export const normalizeTitle = (title) => {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/[''"!-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export const searchManhwaWeb = async (query = '', filters = {}, page = 1) => {
    try {
        console.log(`[ManhwaWeb] Buscando: "${query}"`, filters);

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
                id: `manhwaweb-${item.slug}-${Date.now()}-${index}`,
                slug: item.slug,
                title: item.title,
                cover: item.cover,
                source: 'manhwaweb'
            }));

            console.log(`[ManhwaWeb] Encontradas ${results.length} obras`);
            return results;
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API');
            return [];
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error en búsqueda:', error);
        return [];
    }
};

export const getManhwaWebDetails = async (slug) => {
    try {
        console.log(`[ManhwaWeb] Obteniendo detalles de: ${slug}`);

        const response = await axios.get(`${API_BASE}/details`, {
            params: { slug },
            timeout: 20000
        });

        if (response.data.success && response.data.details) {
            const details = response.data.details;

            return {
                id: `manhwaweb-${slug}`,
                slug: details.slug,
                title: details.title,
                cover: details.cover || '',
                description: details.description || "Sinopsis no disponible.",
                genres: details.genres || [],
                status: details.status || 'ongoing',
                author: details.author || '',
                chaptersCount: details.chapters_count || 0,
                chapters: details.chapters || [],
                source: 'manhwaweb'
            };
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API de detalles');
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo detalles:', error);
        throw error;
    }
};

export const getManhwaWebChapters = async (slug) => {
    try {
        console.log(`[ManhwaWeb] Obteniendo capítulos de: ${slug}`);

        const response = await axios.get(`${API_BASE}/details`, {
            params: { slug },
            timeout: 20000
        });

        if (response.data.success && response.data.details) {
            const chapters = response.data.details.chapters.map((item, index) => ({
                id: `manhwaweb-${slug}-ch-${item.chapter}-${Date.now()}-${index}`,
                slug,
                chapter: item.chapter,
                title: item.title,
                url: item.url
            }));

            console.log(`[ManhwaWeb] Encontrados ${chapters.length} capítulos`);
            return chapters;
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API');
            return [];
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo capítulos:', error);
        return [];
    }
};

export const getManhwaWebPages = async (slug, chapter) => {
    try {
        console.log(`[ManhwaWeb] Obteniendo imágenes del capítulo ${chapter} de ${slug}`);

        const response = await axios.get(`${API_BASE}/pages`, {
            params: { slug, chapter },
            timeout: 20000
        });

        if (response.data.success && response.data.images) {
            console.log(`[ManhwaWeb] Obtenidas ${response.data.images.length} imágenes`);
            return response.data.images;
        } else if (response.data.success && response.data.pages) {
            console.log(`[ManhwaWeb] Obtenidas ${response.data.pages.length} páginas`);
            return response.data.pages;
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API');
            return [];
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo imágenes:', error);
        return [];
    }
};

export const getManhwaWebChapterNav = async (slug, chapter) => {
    try {
        console.log(`[ManhwaWeb] Obteniendo navegación del capítulo ${chapter} de ${slug}`);

        const response = await axios.get(`${API_BASE}/pages`, {
            params: { slug, chapter, action: 'nav' },
            timeout: 20000
        });

        if (response.data.success) {
            return response.data;
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API de navegación');
            return {
                success: false,
                current: { slug, chapter: parseFloat(chapter) },
                previous: null,
                next: null
            };
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo navegación:', error);
        return {
            success: false,
            current: { slug, chapter: parseFloat(chapter) },
            previous: null,
            next: null
        };
    }
};

export const getManhwaWebNuevos = async () => {
    try {
        console.log('[ManhwaWeb] Obteniendo obras nuevas');

        const response = await axios.get(`${API_BASE}/search`, {
            params: { action: 'nuevos' },
            timeout: 20000
        });

        if (response.data.success && response.data.results) {
            const results = response.data.results.map((item, index) => ({
                id: `manhwaweb-new-${item.slug}-${Date.now()}-${index}`,
                slug: item.slug,
                title: item.title,
                cover: item.cover,
                source: 'manhwaweb'
            }));

            console.log(`[ManhwaWeb] Encontradas ${results.length} obras nuevas`);
            return results;
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API');
            return [];
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo obras nuevas:', error);
        return [];
    }
};

export const getRandomManhwaWeb = async (genreIds = []) => {
    try {
        console.log('[ManhwaWeb] Obteniendo obra aleatoria con géneros:', genreIds);

        const genreValues = genreIds.map(id => {
            const genre = MANHWAWEB_GENRES.find(g => g.id === id);
            return genre ? genre.value : null;
        }).filter(v => v !== null);

        console.log('[ManhwaWeb] Genre values para búsqueda:', genreValues);

        const filters = genreValues.length > 0 ? { genres: genreValues } : {};

        const maxPages = 10;
        const randomPage = Math.floor(Math.random() * maxPages) + 1;
        console.log(`[ManhwaWeb Random] Página aleatoria: ${randomPage}`);

        let results = await searchManhwaWeb('', filters, randomPage);

        if (results.length === 0) {
            console.log('[ManhwaWeb Random] Página vacía, usando página 1');
            results = await searchManhwaWeb('', filters, 1);
        }

        if (results.length === 0) {
            console.log('[ManhwaWeb] No se encontraron resultados');
            return null;
        }

        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManhwa = results[randomIndex];

        console.log(`[ManhwaWeb Random] Obra seleccionada: ${randomManhwa.title} (página ${randomPage}, índice ${randomIndex})`);
        return await getManhwaWebDetails(randomManhwa.slug);
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo obra aleatoria:', error);
        return null;
    }
};
