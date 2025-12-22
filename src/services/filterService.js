/**
 * Servicio unificador de filtros
 * Provee los filtros correctos según la fuente seleccionada
 * @version 1.0.0 - Sistema de filtros dinámicos multi-fuente
 * @date 2025-12-22
 */

import { 
    TUMANGA_GENRES, 
    TUMANGA_FORMATS, 
    TUMANGA_MOODS 
} from './tumanga';

import {
    MANHWAWEB_GENRES,
    MANHWAWEB_TYPES,
    MANHWAWEB_STATUS,
    MANHWAWEB_EROTIC,
    MANHWAWEB_DEMOGRAPHICS,
    MANHWAWEB_SORT_BY,
    MANHWAWEB_SORT_ORDER,
    MANHWAWEB_MOODS
} from './manhwawebFilters';

/**
 * Obtiene los filtros disponibles según la fuente
 * @param {string} source - 'tumanga' o 'manhwaweb'
 * @returns {object} Objeto con todos los filtros disponibles para esa fuente
 */
export const getFiltersForSource = (source) => {
    if (source === 'tumanga') {
        return {
            genres: TUMANGA_GENRES,
            formats: TUMANGA_FORMATS,
            moods: TUMANGA_MOODS,
            hasAdvancedFilters: false,
            // Campos adicionales vacíos para consistencia
            types: [],
            status: [],
            erotic: [],
            demographics: [],
            sortBy: [],
            sortOrder: []
        };
    }
    
    if (source === 'manhwaweb') {
        return {
            genres: MANHWAWEB_GENRES,
            types: MANHWAWEB_TYPES,
            status: MANHWAWEB_STATUS,
            erotic: MANHWAWEB_EROTIC,
            demographics: MANHWAWEB_DEMOGRAPHICS,
            sortBy: MANHWAWEB_SORT_BY,
            sortOrder: MANHWAWEB_SORT_ORDER,
            moods: MANHWAWEB_MOODS,
            hasAdvancedFilters: true,
            // Campo vacío para consistencia
            formats: []
        };
    }
    
    // Fallback a TuManga si la fuente no es reconocida
    console.warn(`Fuente desconocida: ${source}, usando TuManga por defecto`);
    return getFiltersForSource('tumanga');
};

/**
 * Obtiene solo los moods según la fuente
 * @param {string} source - 'tumanga' o 'manhwaweb'
 * @returns {array} Array de moods para esa fuente
 */
export const getMoodsForSource = (source) => {
    const filters = getFiltersForSource(source);
    return filters.moods;
};

/**
 * Obtiene solo los géneros según la fuente
 * @param {string} source - 'tumanga' o 'manhwaweb'
 * @returns {array} Array de géneros para esa fuente
 */
export const getGenresForSource = (source) => {
    const filters = getFiltersForSource(source);
    return filters.genres;
};

/**
 * Valida que los filtros seleccionados sean compatibles con la fuente
 * @param {object} filters - Filtros seleccionados
 * @param {string} source - Fuente actual
 * @returns {object} Filtros validados y limpios
 */
export const validateFiltersForSource = (filters, source) => {
    const availableFilters = getFiltersForSource(source);
    const validatedFilters = {};
    
    if (source === 'tumanga') {
        // Solo permitir genres y formats
        if (filters.genres) validatedFilters.genres = filters.genres;
        if (filters.formats) validatedFilters.formats = filters.formats;
    } else if (source === 'manhwaweb') {
        // Permitir todos los filtros avanzados
        if (filters.genres) validatedFilters.genres = filters.genres;
        if (filters.type) validatedFilters.type = filters.type;
        if (filters.status) validatedFilters.status = filters.status;
        if (filters.erotic) validatedFilters.erotic = filters.erotic;
        if (filters.demographic) validatedFilters.demographic = filters.demographic;
        if (filters.sortBy) validatedFilters.sortBy = filters.sortBy;
        if (filters.sortOrder) validatedFilters.sortOrder = filters.sortOrder;
    }
    
    return validatedFilters;
};

/**
 * Crea un objeto de filtros vacío para una fuente
 * @param {string} source - 'tumanga' o 'manhwaweb'
 * @returns {object} Objeto con todos los filtros vacíos
 */
export const getEmptyFiltersForSource = (source) => {
    if (source === 'tumanga') {
        return {
            genres: [],
            formats: []
        };
    }
    
    if (source === 'manhwaweb') {
        return {
            genres: [],
            type: '',
            status: '',
            erotic: '',
            demographic: '',
            sortBy: '',
            sortOrder: ''
        };
    }
    
    return {};
};
