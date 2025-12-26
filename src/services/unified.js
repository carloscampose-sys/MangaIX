/**
 * Servicio unificado para múltiples fuentes de manga/manhwa
 * Actúa como capa de abstracción sobre los servicios específicos
 */

import * as tumanga from './tumanga';
import * as manhwaweb from './manhwaweb';
import * as ikigai from './ikigai';
import { getSourceById } from './sources';

// Mapa de servicios por fuente
const serviceMap = {
    tumanga,
    manhwaweb,
    ikigai
};

/**
 * Obtiene el servicio correspondiente a una fuente
 */
function getService(source) {
    const service = serviceMap[source];
    if (!service) {
        console.error(`Servicio no encontrado para fuente: ${source}`);
        return serviceMap.tumanga; // Fallback a tumanga
    }
    return service;
}

/**
 * Busca obras en una fuente específica
 * @returns {Promise<{results: Array, hasMore: boolean}>} - Resultados y flag de paginación
 */
export async function unifiedSearch(query, filters, source, page = 1) {
    try {
        const service = getService(source);

        if (source === 'tumanga') {
            const results = await service.searchTuManga(query, filters);
            return { results, hasMore: false }; // TuManga no usa paginación
        } else if (source === 'manhwaweb') {
            const results = await service.searchManhwaWeb(query, filters, page);
            // ManhwaWeb: si devuelve 30 resultados, probablemente hay más
            return { results, hasMore: results.length >= 30 };
        } else if (source === 'ikigai') {
            // Ikigai devuelve { results, hasMore }
            return await service.searchIkigai(query, filters, page);
        }

        return { results: [], hasMore: false };
    } catch (error) {
        console.error(`[Unified] Error en búsqueda (${source}):`, error);
        return { results: [], hasMore: false };
    }
}

/**
 * Obtiene detalles de una obra en una fuente específica
 */
export async function unifiedGetDetails(slug, source) {
    try {
        const service = getService(source);

        if (source === 'tumanga') {
            return await service.getTuMangaDetails(slug);
        } else if (source === 'manhwaweb') {
            return await service.getManhwaWebDetails(slug);
        } else if (source === 'ikigai') {
            return await service.getIkigaiDetails(slug);
        }

        return null;
    } catch (error) {
        console.error(`[Unified] Error obteniendo detalles (${source}):`, error);
        return null;
    }
}

/**
 * Obtiene capítulos de una obra en una fuente específica
 */
export async function unifiedGetChapters(slug, source) {
    try {
        const service = getService(source);

        if (source === 'tumanga') {
            return await service.getTuMangaChapters(slug);
        } else if (source === 'manhwaweb') {
            return await service.getManhwaWebChapters(slug);
        } else if (source === 'ikigai') {
            return await service.getIkigaiChapters(slug);
        }

        return [];
    } catch (error) {
        console.error(`[Unified] Error obteniendo capítulos (${source}):`, error);
        return [];
    }
}

/**
 * Obtiene páginas de un capítulo en una fuente específica
 */
export async function unifiedGetPages(slug, chapter, source, chapterUrl = null) {
    try {
        const service = getService(source);

        if (source === 'tumanga') {
            return await service.getTuMangaPages(slug, chapter);
        } else if (source === 'manhwaweb') {
            return await service.getManhwaWebPages(slug, chapter);
        } else if (source === 'ikigai') {
            return await service.getIkigaiPages(slug, chapter, chapterUrl);
        }

        return [];
    } catch (error) {
        console.error(`[Unified] Error obteniendo páginas (${source}):`, error);
        return [];
    }
}

/**
 * Obtiene una obra aleatoria de una fuente específica
 */
export async function unifiedGetRandom(genreIds, source) {
    try {
        const service = getService(source);

        if (source === 'tumanga') {
            return await service.getRandomManga(genreIds);
        } else if (source === 'manhwaweb') {
            return await service.getRandomManhwaWeb(genreIds);
        } else if (source === 'ikigai') {
            return await service.getRandomIkigai(genreIds);
        }

        return null;
    } catch (error) {
        console.error(`[Unified] Error obteniendo aleatorio (${source}):`, error);
        return null;
    }
}

/**
 * Normaliza un título (usa la función de la fuente correspondiente)
 */
export function unifiedNormalizeTitle(title, source) {
    const service = getService(source);
    return service.normalizeTitle ? service.normalizeTitle(title) : title;
}

/**
 * Busca en múltiples fuentes simultáneamente
 */
export async function searchAllSources(query, filters) {
    try {
        const [tumangaResults, manhwawebResults, ikigaiResults] = await Promise.allSettled([
            unifiedSearch(query, filters, 'tumanga'),
            unifiedSearch(query, filters, 'manhwaweb'),
            unifiedSearch(query, filters, 'ikigai')
        ]);

        const results = [];

        if (tumangaResults.status === 'fulfilled') {
            results.push(...(tumangaResults.value.results || []));
        }

        if (manhwawebResults.status === 'fulfilled') {
            results.push(...(manhwawebResults.value.results || []));
        }

        if (ikigaiResults.status === 'fulfilled') {
            results.push(...(ikigaiResults.value.results || []));
        }

        return results;
    } catch (error) {
        console.error('[Unified] Error en búsqueda multi-fuente:', error);
        return [];
    }
}
