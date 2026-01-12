import axios from 'axios';
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
    
    queries.push(''); // Query 1: vacía (variedad general)
    queries.push(getRandomQuery()); // Query 2: aleatoria
    queries.push(getRandomQuery()); // Query 3: aleatoria
    
    if (genreIds.length > 0) {
        queries.push(''); // Query 4: vacía con filtro de género
    } else {
        queries.push(getRandomQuery()); // Query 4: aleatoria
    }
    
    queries.push(getRandomQuery()); // Query 5: aleatoria
    
    return queries;
}

// Lista de proxies CORS (reutilizando la misma estrategia de TuManga)
const PROXY_URLS = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://proxy.cors.sh/',
    'https://api.codetabs.com/v1/proxy?quest='
];

let currentProxyIndex = 0;

/**
 * Hace una petición con fallback de proxies
 */
const fetchWithProxy = async (url, retries = 4) => {
    const errors = [];
    
    for (let i = 0; i < retries; i++) {
        const proxyIndex = (currentProxyIndex + i) % PROXY_URLS.length;
        const proxyUrl = PROXY_URLS[proxyIndex];
        
        try {
            const fullUrl = `${proxyUrl}${encodeURIComponent(url)}`;
            console.log(`[ManhwaWeb] Intentando proxy ${proxyIndex + 1}/${PROXY_URLS.length}...`);
            
            const response = await axios.get(fullUrl, {
                timeout: 12000,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            
            currentProxyIndex = proxyIndex;
            console.log(`[ManhwaWeb] Proxy funcionó correctamente`);
            return response;
        } catch (error) {
            const errorMsg = error.response?.status || error.message;
            console.warn(`[ManhwaWeb] Proxy ${proxyUrl} falló (${errorMsg})`);
            errors.push({ proxy: proxyUrl, error: errorMsg });
            
            if (i === retries - 1) {
                console.error('[ManhwaWeb] Todos los proxies CORS fallaron:', errors);
                throw new Error('Todos los proxies CORS fallaron');
            }
        }
    }
};

/**
 * Normaliza un título para mejorar las coincidencias
 */
export const normalizeTitle = (title) => {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/[''"!-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Normaliza un título para mejorar las coincidencias
 */
export const normalizeTitle = (title) => {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/[''"!-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Lista de queries populares para variedad en el oráculo
 * Estas son búsquedas que tienden a devolver muchos resultados
 */
const POPULAR_QUERIES = [
    '',                // Búsqueda vacía (muestra variedad general)
    'tower',         // Tower of God, Tower of Fantasy
    'level',          // Solo Leveling, Level Up
    'reborn',         // Reborn, I Reincarnated
    'god',            // Omniscient Reader, God of Magic
    'system',         // The Legendary Mechanic
    'demon',          // Demon Lord
    'dragon',         // Dragon King, Dragon Hunter
    'martial',        // Martial Peak, Martial Arts
    'noble',          // Return of Mount Hua Sect, Noble Reincarnation
    'swordsman',     // Swordmaster
    'academy',        // Academy
    'villain',        // Villain
    'hero',           // Hero
    'king',            // Emperor
    'prince',          // Prince
    'strong',         // Strongest
    'mage',           // Magician
    'sword',          // Sword
    'revenge',        // Revenge
    'war',            // Great Demon King
    'cultivation',    // Cultivation
    'trans',          // Transmigration
    'fantasy',        // Fantasy
    'world',          // World
    'heaven',         // Heaven
    'immortal',       // Immortal
    'legend',         // Legend
    'power',          // Power
    'blood',          // Blood
    'soul',           // Soul
    'life',           // Life
    'death',          // Deceased
    'destiny',        // Destiny
    'fate',          // Fate
    'magic'           // Magic
];

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
    
    queries.push(''); // Query 1: vacía (variedad general)
    queries.push(getRandomQuery()); // Query 2: aleatoria
    queries.push(getRandomQuery()); // Query 3: aleatoria
    
    if (genreIds.length > 0) {
        queries.push(''); // Query 4: vacía con filtro de género
    } else {
        queries.push(getRandomQuery()); // Query 4: aleatoria
    }
    
    queries.push(getRandomQuery()); // Query 5: aleatoria
    
    return queries;
}

// Lista de proxies CORS (reutilizando la misma estrategia de TuManga)
const PROXY_URLS = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://proxy.cors.sh/',
    'https://api.codetabs.com/v1/proxy?quest='
];

let currentProxyIndex = 0;

/**
 * Hace una petición con fallback de proxies
 */
const fetchWithProxy = async (url, retries = 4) => {
    const errors = [];
    
    for (let i = 0; i < retries; i++) {
        const proxyIndex = (currentProxyIndex + i) % PROXY_URLS.length;
        const proxyUrl = PROXY_URLS[proxyIndex];
        
        try {
            const fullUrl = `${proxyUrl}${encodeURIComponent(url)}`;
            console.log(`[ManhwaWeb] Intentando proxy ${proxyIndex + 1}/${PROXY_URLS.length}...`);
            
            const response = await axios.get(fullUrl, {
                timeout: 12000,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            
            currentProxyIndex = proxyIndex;
            console.log(`[ManhwaWeb] Proxy funcionó correctamente`);
            return response;
        } catch (error) {
            const errorMsg = error.response?.status || error.message;
            console.warn(`[ManhwaWeb] Proxy ${proxyUrl} falló (${errorMsg})`);
            errors.push({ proxy: proxyUrl, error: errorMsg });
            
            if (i === retries - 1) {
                console.error('[ManhwaWeb] Todos los proxies CORS fallaron:', errors);
                throw new Error('Todos los proxies CORS fallaron');
            }
        }
    }
};

/**
 * Normaliza un título para mejorar las coincidencias
 */
export const normalizeTitle = (title) => {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/[''"!-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Normaliza un título para mejorar las coincidencias
 */
export const normalizeTitle = (title) => {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/[''"!-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Busca obras en ManhwaWeb
 * 
 * En LOCAL: Muestra mensaje informativo (ManhwaWeb requiere API serverless)
 * En PRODUCCIÓN: Usa API serverless con Puppeteer (con paginación inteligente)
 */
export const searchManhwaWeb = async (query = '', filters = {}, page = 1) => {
    try {
        console.log(`[ManhwaWeb] Buscando: "${query}"`, filters);
        console.log(`[ManhwaWeb] ⚡ Página solicitada: ${page}`);
        
        // Permitir búsquedas solo con filtros (sin query de texto)
        if ((!query || query.trim() === '') && (!filters.genres || filters.genres.length === 0)) {
            console.log('[ManhwaWeb] Búsqueda vacía sin filtros, retornando array vacío');
            return { results: [], hasMore: false, totalFound: 0 };
        }

        // Detectar si estamos en local o producción
        const isLocal = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');

        if (isLocal) {
            // En local, no podemos usar la API serverless con Vite
            console.warn('[ManhwaWeb] ⚠️ Búsqueda no disponible en local con Vite.');
            console.warn('[ManhwaWeb] 💡 Para probar ManhwaWeb, despliega a Vercel o usa Vercel CLI.');
            console.warn('[ManhwaWeb] 📚 TuManga funciona perfectamente en local.');
            
            // Retornar estructura compatible
            return { results: [], hasMore: false, totalFound: 0 };
        }

        // En producción, usar la API serverless (timeout reducido con paginación)
        console.log('[ManhwaWeb Service] Enviando búsqueda - Página:', page);
        
        const response = await axios.get('/api/manhwaweb/search', {
            params: { 
                query: query || '',  // Enviar string vacío si no hay query
                // Enviar todos los filtros avanzados de ManhwaWeb a la API
                genres: filters.genres ? filters.genres.join(',') : '',
                type: filters.type || '',
                status: filters.status || '',
                erotic: filters.erotic || '',
                demographic: filters.demographic || '',
                sortBy: filters.sortBy || '',
                sortOrder: filters.sortOrder || '',
                page: String(page || 1)
            },
            timeout: 20000  // ⚡ Reducir de 60s a 20s (con paginación debería bastar)
        });

        if (response.data.success && response.data.results) {
            const results = response.data.results.map((item, index) => ({
                id: `manhwaweb-${item.slug}-${Date.now()}-${index}`,
                slug: item.slug,
                title: item.title,
                cover: item.cover,
                source: 'manhwaweb'
            }));

            console.log(`[ManhwaWeb] ⚡ Encontradas ${results.length} obras (página ${page})`);
            console.log(`[ManhwaWeb] ⚡ ¿Más páginas?`, response.data.hasMore);
            console.log(`[ManhwaWeb] ⚡ Total encontrado:`, response.data.totalFound);
            
            if (response.data.partial) {
                console.warn('[ManhwaWeb] ⚠️ Resultados parciales (timeout)');
            }
            
            return { 
                results, 
                hasMore: response.data.hasMore || false,
                totalFound: response.data.totalFound || 0,
                currentPage: response.data.page || page,
                totalPages: response.data.totalPages || 1,
                partial: response.data.partial || false
            };
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API');
            return { results: [], hasMore: false, totalFound: 0 };
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error en búsqueda:', error);
        return { results: [], hasMore: false, totalFound: 0 };
    }
};

/**
 * Obtiene los detalles completos de una obra
 */
export const getManhwaWebDetails = async (slug) => {
    try {
        console.log(`[ManhwaWeb] Obteniendo detalles de: ${slug}`);
        
        // Detectar si estamos en local o producción
        const isLocal = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');

        if (isLocal) {
            // En local, devolver datos básicos sin API
            console.warn('[ManhwaWeb] ⚠️ Detalles limitados en local. Despliega a Vercel para sinopsis reales.');
            
            const title = slug.split('_')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            return {
                id: `manhwaweb-${slug}`,
                slug,
                title,
                cover: '',
                description: "Sinopsis no disponible en local. Despliega a Vercel para ver detalles completos. 🥑",
                genres: [],
                status: 'ongoing',
                author: '',
                lastChapter: '?',
                chaptersCount: 0,
                source: 'manhwaweb'
            };
        }

        // En producción, usar la API serverless con Puppeteer
        console.log('[ManhwaWeb] Llamando a API de detalles...');
        
        const response = await axios.get('/api/manhwaweb/details', {
            params: { slug },
            timeout: 35000 // 35 segundos
        });

        if (response.data.success && response.data.details) {
            const details = response.data.details;
            
            console.log('[ManhwaWeb] Detalles obtenidos:', {
                title: details.title,
                descriptionLength: details.description?.length || 0,
                author: details.author,
                genresCount: details.genres?.length || 0
            });
            
            return {
                id: `manhwaweb-${slug}`,
                slug: details.slug,
                title: details.title,
                cover: details.cover || '',
                description: details.description || "Sinopsis no disponible para esta obra.",
                genres: details.genres || [],
                status: details.status || 'ongoing',
                author: details.author || '',
                lastChapter: '?',
                chaptersCount: details.chaptersCount || 0,
                source: 'manhwaweb'
            };
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API de detalles');
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo detalles:', error);
        
        // Fallback: devolver datos básicos
        const title = slug.split('_')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return {
            id: `manhwaweb-${slug}`,
            slug,
            title,
            cover: '',
            description: "No se pudo cargar la sinopsis. Inténtalo de nuevo más tarde. 🥑",
            genres: [],
            status: 'ongoing',
            author: '',
            lastChapter: '?',
            chaptersCount: 0,
            source: 'manhwaweb'
        };
    }
};

/**
 * Obtiene la lista de capítulos de una obra usando API serverless con Puppeteer
 */
export const getManhwaWebChapters = async (slug) => {
    try {
        console.log(`[ManhwaWeb] Obteniendo capítulos de: ${slug}`);
        
        // Detectar si estamos en local
        const isLocal = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');

        if (isLocal) {
            console.warn('[ManhwaWeb] ⚠️ Capítulos no disponibles en local con Vite.');
            console.warn('[ManhwaWeb] 💡 Para ver capítulos, despliega a Vercel.');
            return [];
        }

        // En producción, usar la API serverless
        const response = await axios.get('/api/manhwaweb/chapters', {
            params: { slug },
            timeout: 40000 // 40 segundos
        });

        if (response.data.success && response.data.chapters) {
            const chapters = response.data.chapters.map((item, index) => ({
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

/**
 * Obtiene las páginas/imágenes de un capítulo usando la API serverless
 * 
 * En LOCAL: No funciona (requiere API serverless)
 * En PRODUCCIÓN: Usa API serverless con Puppeteer
 */
export const getManhwaWebPages = async (slug, chapter) => {
    try {
        console.log(`[ManhwaWeb] Obteniendo páginas del capítulo ${chapter} de ${slug}`);
        
        // Detectar si estamos en local
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';

        if (isLocal) {
            console.warn('[ManhwaWeb] ⚠️ Lectura no disponible en local con Vite.');
            console.warn('[ManhwaWeb] 💡 Para leer, despliega a Vercel.');
            return [];
        }

        const response = await axios.get('/api/manhwaweb/pages', {
            params: { slug, chapter },
            timeout: 30000
        });

        if (response.data.success && response.data.pages) {
            console.log(`[ManhwaWeb] Obtenidas ${response.data.pages.length} páginas`);
            return response.data.pages;
        } else {
            console.error('[ManhwaWeb] Respuesta inválida de la API');
            return [];
        }
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo páginas:', error);
        return [];
    }
};

/**
 * Obtiene una obra aleatoria (para el Oráculo)
 * @param {array} genreIds - Array de IDs de géneros string (ej: ["drama", "tragedia"])
 * @returns {Promise<object|null>} Obra aleatoria con detalles completos
 */
export const getRandomManhwaWeb = async (genreIds = []) => {
    try {
        console.log('[ManhwaWeb Oracle] Iniciando oráculo híbrido con caché...');
        console.log(`[ManhwaWeb Oracle] Géneros: [${genreIds.join(', ')}]`);
        
        // PASO 1: Obtener vistas previas
        const viewedSlugs = getViewedSlugs();
        console.log(`[ManhwaWeb Oracle] ⚡ Vistas recientes: ${viewedSlugs.length} obras`);
        
        // PASO 2: Generar queries para búsqueda
        const searchQueries = generateSearchQueries(5, genreIds);
        console.log('[ManhwaWeb Oracle] Queries generadas:', searchQueries);
        
        // PASO 3: Ejecutar búsquedas en paralelo
        console.log('[ManhwaWeb Oracle] Ejecutando 5 búsquedas en paralelo...');
        
        const genreValues = genreIds.map(id => {
            const genre = MANHWAWEB_GENRES.find(g => g.id === id);
            return genre ? genre.value : null;
        }).filter(v => v !== null);
        
        const filters = genreValues.length > 0 ? { genres: genreValues } : {};
        
        const searchPromises = searchQueries.map(query => 
            searchManhwaWeb(query, filters, 1)
        );
        
        const searchResults = await Promise.all(searchPromises);
        
        console.log(`[ManhwaWeb Oracle] Búsquedas completadas: ${searchResults.map((r, i) => `Q${i+1}: ${r.results ? r.results.length : 0}`).join(', ')}`);
        
        // PASO 4: Combinar y deduplicar resultados
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
        
        // PASO 5: Excluir vistas recientes
        const availableResults = totalUnique.filter(manga => 
            !viewedSlugs.includes(manga.slug)
        );
        
        console.log(`[ManhwaWeb Oracle] Disponibles: ${availableResults.length} obras (excluyendo ${viewedSlugs.length} vistas)`);
        
        // Si no hay suficientes obras disponibles, incluir vistas
        let finalResults = availableResults;
        if (availableResults.length < 10) {
            console.warn('[ManhwaWeb Oracle] ⚠️ Pocas obras disponibles, incluyendo vistas...');
            finalResults = totalUnique;
        }
        
        // PASO 6: Seleccionar obra aleatoria
        if (finalResults.length === 0) {
            console.error('[ManhwaWeb Oracle] ❌ No se encontraron obras');
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * finalResults.length);
        const randomManga = finalResults[randomIndex];
        
        console.log(`[ManhwaWeb Oracle] ✅ Obra seleccionada: ${randomManga.title} (índice ${randomIndex} de ${finalResults.length})`);
        
        // PASO 7: Guardar vista en caché
        saveViewedManga(randomManga.slug, randomManga);
        
        return randomManga;
        
    } catch (error) {
        console.error('[ManhwaWeb Oracle] ❌ Error:', error.message);
        return null;
    }
};
