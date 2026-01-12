/**
 * MANHWAWEB ORACLE VIEW CACHE
 * Almacena las últimas 100 obras recomendadas por el oráculo
 * Evita repetir las mismas obras en invocaciones consecutivas
 */

const STORAGE_KEY = 'manhwaweb-oracle-views';
const MAX_VIEWS = 100;

/**
 * Obtiene todas las vistas almacenadas
 * @returns {Array<{slug, title, cover, viewedAt}>}
 */
export function getViewedMangas() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        
        const views = JSON.parse(stored);
        
        return views.sort((a, b) => b.viewedAt - a.viewedAt);
    } catch (error) {
        console.error('[ManhwaWeb Cache] Error obteniendo vistas:', error);
        return [];
    }
}

/**
 * Guarda una nueva vista
 * @param {string} slug - Slug de la obra vista
 * @param {object} manga - Objeto completo de la obra
 */
export function saveViewedManga(slug, manga) {
    try {
        const views = getViewedMangas();
        
        const newView = {
            slug,
            title: manga?.title || '',
            cover: manga?.cover || '',
            viewedAt: Date.now()
        };
        
        const filtered = views.filter(v => v.slug !== slug);
        filtered.unshift(newView);
        
        const trimmed = filtered.slice(0, MAX_VIEWS);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        
        console.log(`[ManhwaWeb Cache] ✅ Vista guardada: ${manga?.title} (${trimmed.length} vistas en caché)`);
    } catch (error) {
        console.error('[ManhwaWeb Cache] Error guardando vista:', error);
    }
}

/**
 * Verifica si una obra ya fue vista recientemente
 * @param {string} slug - Slug de la obra a verificar
 * @param {number} hours - Horas atrás para verificar (default: 24)
 * @returns {boolean}
 */
export function isMangaViewed(slug, hours = 24) {
    const views = getViewedMangas();
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    return views.some(v => v.slug === slug && v.viewedAt > cutoffTime);
}

/**
 * Obtiene el array de slugs vistos
 * Útil para excluir de búsquedas
 * @returns {string[]}
 */
export function getViewedSlugs() {
    return getViewedMangas().map(v => v.slug);
}

/**
 * Limpia vistas muy antiguas (opcional)
 * @param {number} days - Días máximos a mantener (default: 30)
 */
export function clearOldViews(days = 30) {
    try {
        const views = getViewedMangas();
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        const filtered = views.filter(v => v.viewedAt > cutoffTime);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        
        console.log(`[ManhwaWeb Cache] ✅ Limpiadas ${views.length - filtered.length} vistas antiguas (${days} días)`);
    } catch (error) {
        console.error('[ManhwaWeb Cache] Error limpiando vistas:', error);
    }
}

/**
 * Limpia TODO el caché (opcional)
 */
export function clearAllViews() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ManhwaWeb Cache] ✅ Caché limpiado completamente');
}
