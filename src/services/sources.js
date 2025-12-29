/**
 * Catálogo centralizado de fuentes de manga/manhwa
 * Cada fuente define sus características y metadatos
 */

export const SOURCES = {
    TUMANGA: {
        id: 'tumanga',
        name: 'TuManga',
        icon: '📚',
        baseUrl: 'https://tumanga.org',
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600',
        textColor: 'text-blue-500',
        features: ['search', 'details', 'chapters', 'read', 'random'],
        status: 'active'
    },
    MANHWAWEB: {
        id: 'manhwaweb',
        name: 'ManhwaWeb',
        icon: '🌐',
        baseUrl: 'https://manhwaweb.com',
        color: 'bg-purple-500',
        hoverColor: 'hover:bg-purple-600',
        textColor: 'text-purple-500',
        features: ['search', 'details', 'chapters', 'read'],
        status: 'active'
    },
    IKIGAI: {
        id: 'ikigai',
        name: 'Ikigai',
        icon: '🌸',
        baseUrl: 'https://viralikigai.ozoviral.xyz',
        color: 'bg-pink-500',
        hoverColor: 'hover:bg-pink-600',
        textColor: 'text-pink-500',
        features: ['search', 'details', 'chapters', 'read', 'random'],
        status: 'disabled'
    }
};

// Fuente por defecto
export const DEFAULT_SOURCE = SOURCES.TUMANGA.id;

/**
 * Obtiene la configuración de una fuente por su ID
 */
export function getSourceById(sourceId) {
    return Object.values(SOURCES).find(s => s.id === sourceId) || SOURCES.TUMANGA;
}

/**
 * Obtiene todas las fuentes activas
 */
export function getActiveSources() {
    return Object.values(SOURCES).filter(s => s.status === 'active');
}

/**
 * Verifica si una fuente soporta una característica específica
 */
export function sourceSupportsFeature(sourceId, feature) {
    const source = getSourceById(sourceId);
    return source.features.includes(feature);
}

/**
 * Obtiene el nombre para mostrar de una fuente
 */
export function getSourceDisplayName(sourceId) {
    const source = getSourceById(sourceId);
    return `${source.icon} ${source.name}`;
}
