import { MANHWAWEB_GENRES } from './manhwawebFilters';
import { getViewedMangas, saveViewedManga, isMangaViewed, getViewedSlugs } from './manhwawebCache';

const BASE_URL = 'https://manhwaweb.com';

/**
 * Genera una query aleatoria de la lista de populares
 */
function getRandomQuery() {
    return POPULAR_QUERIES[Math.floor(Math.random() * POPULAR_QUERIES.length)];
}

/**
 * Genera N queries diferentes para búsqueda
 * @param {number} count - Número de queries a generar (3-5)
 * @param {array} genreIds - IDs de géneros
 * @returns {string[]}
 */
function generateSearchQueries(count = 5, genreIds = []) {
    const queries = [];
    
    queries.push('');
    queries.push(getRandomQuery());
    queries.push(getRandomQuery());
    
    if (genreIds.length > 0) {
        queries.push('');
    } else {
        queries.push(getRandomQuery());
    }
    
    queries.push(getRandomQuery());
    
    return queries;
}

/**
 * Obtiene una obra aleatoria (para el Oráculo)
 * @param {array} genreIds - Array de IDs de géneros string (ej: ["drama", "tragedia"])
 * @returns {Promise<object|null>} Obra aleatoria con detalles completos
 * 
 * ESTRATEGIA HÍBRIDA (CON CACHÉ DE VISTAS):
 * 1. Múltiples búsquedas dinámicas para variedad
 * 2. Excluir vistas recientes del oráculo
 * 3. Seleccionar random del pool combinado
 * 4. Guardar en caché para futuro
 */
export const getRandomManhwaWeb = async (genreIds = []) => {
    try {
        console.log('[ManhwaWeb Oracle] Iniciando oráculo híbrido con caché...');
        console.log(`[ManhwaWeb Oracle] Géneros: [${genreIds.join(', ')}]`);
        
        const viewedSlugs = getViewedSlugs();
        console.log(`[ManhwaWeb Oracle] ⚡ Vistas recientes: ${viewedSlugs.length} obras`);
        
        const searchQueries = generateSearchQueries(5, genreIds);
        console.log('[ManhwaWeb Oracle] Queries generadas:', searchQueries);
        
        console.log('[ManhwaWeb Oracle] Ejecutando 5 búsquedas en paralelo...');
        
        const genreValues = genreIds.map(id => {
            const genre = MANHWAWEB_GENRES.find(g => g.id === id);
            return genre ? genre.value : null;
        }).filter(v => v !== null);
        
        const filters = genreValues.length > 0 ? { genres: genreValues } : {};
        
        const searchPromises = searchQueries.map(query => 
            import('./manhwaweb').then(module => {
                const searchManhwaWeb = module.default.searchManhwaWeb;
                return searchManhwaWeb(query, filters, 1);
            })
        );
        
        const searchResults = await Promise.all(searchPromises);
        
        console.log(`[ManhwaWeb Oracle] Búsquedas completadas: ${searchResults.map((r, i) => `Q${i+1}: ${r.results ? r.results.length : 0}`).join(', ')}`);
        
        const combinedResults = new Map();
        
        for (const searchResponse of searchResults) {
            const results = searchResponse.results || [];
            for (const manga of results) {
                if (manga && manga.slug) {
                    combinedResults.set(manga.slug, manga);
                }
            }
        }
        
        const totalUnique = Array.from(combinedResults.values());
        console.log(`[ManhwaWeb Oracle] ✅ Total único: ${totalUnique.length} obras`);
        
        const availableResults = totalUnique.filter(manga => 
            !viewedSlugs.includes(manga.slug)
        );
        
        console.log(`[ManhwaWeb Oracle] Disponibles: ${availableResults.length} obras (excluyendo ${viewedSlugs.length} vistas)`);
        
        let finalResults = availableResults;
        if (availableResults.length < 10) {
            console.warn('[ManhwaWeb Oracle] ⚠️ Pocas obras disponibles, incluyendo vistas...');
            finalResults = totalUnique;
        }
        
        if (finalResults.length === 0) {
            console.error('[ManhwaWeb Oracle] ❌ No se encontraron obras');
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * finalResults.length);
        const randomManga = finalResults[randomIndex];
        
        console.log(`[ManhwaWeb Oracle] ✅ Obra seleccionada: ${randomManga.title} (índice ${randomIndex} de ${finalResults.length})`);
        
        saveViewedManga(randomManga.slug, randomManga);
        
        return import('./manhwaweb').then(module => {
            const getManhwaWebDetails = module.default.getManhwaWebDetails;
            return getManhwaWebDetails(randomManga.slug);
        });
        
    } catch (error) {
        console.error('[ManhwaWeb Oracle] ❌ Error:', error.message);
        return null;
    }
};
