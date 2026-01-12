import axios from 'axios';
import { MANHWAWEB_GENRES } from './manhwawebFilters';

const BASE_URL = 'https://manhwaweb.com';

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
                console.error('[ManhwaWeb] Todos los proxies fallaron:', errors);
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
 * Busca obras en ManhwaWeb
 * 
 * En LOCAL: Muestra mensaje informativo (ManhwaWeb requiere API serverless)
 * En PRODUCCIÓN: Usa API serverless con Puppeteer
 */
export const searchManhwaWeb = async (query = '', filters = {}, page = 1) => {
    try {
        console.log(`[ManhwaWeb] Buscando: "${query}"`, filters);

        // Permitir búsquedas solo con filtros (sin query de texto)
        if ((!query || query.trim() === '') && (!filters.genres || filters.genres.length === 0)) {
            console.log('[ManhwaWeb] Búsqueda vacía sin filtros, retornando array vacío');
            return [];
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
            
            // Retornar array vacío para que no rompa la UI
            return [];
        }

        // En producción, usar la API directa (muy rápido)
        console.log('[ManhwaWeb Service] Enviando búsqueda a API directa - Página:', page, 'Tipo:', typeof page);

        // Construir params solo con filtros válidos
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
        if (pageToUse) {
            params.page = String(pageToUse);
        }

        const response = await axios.get('/api/manhwaweb/search-direct', {
            params,
            timeout: 5000 // 5 segundos para API directa (suficiente)
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
        console.log('[ManhwaWeb] Obteniendo obra aleatoria con géneros:', genreIds);

        // Convertir IDs string a values numéricos para la API
        // genreIds puede ser ["drama", "tragedia"] y necesitamos ["1", "25"]
        const genreValues = genreIds.map(id => {
            const genre = MANHWAWEB_GENRES.find(g => g.id === id);
            return genre ? genre.value : null;
        }).filter(v => v !== null);

        console.log('[ManhwaWeb] Genre values para búsqueda:', genreValues);

        // Construir filtros
        const filters = genreValues.length > 0
            ? { genres: genreValues }  // Array de values string ["1", "25"]
            : {};

        // Seleccionar una página aleatoria (1-10, ManhwaWeb soporta paginación)
        const maxPages = 10;
        const randomPage = Math.floor(Math.random() * maxPages) + 1;
        console.log(`[ManhwaWeb Random] Página aleatoria: ${randomPage}`);

        // Buscar en la página aleatoria
        let results = await searchManhwaWeb('', filters, randomPage);

        // Si la página está vacía, intentar página 1
        if (results.length === 0) {
            console.log('[ManhwaWeb Random] Página vacía, usando página 1');
            results = await searchManhwaWeb('', filters, 1);
        }

        if (results.length === 0) {
            console.log('[ManhwaWeb] No se encontraron resultados');
            return null;
        }

        // Seleccionar uno aleatorio de los resultados
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManhwa = results[randomIndex];

        console.log(`[ManhwaWeb Random] Obra seleccionada: ${randomManhwa.title} (página ${randomPage}, índice ${randomIndex})`);
        return await getManhwaWebDetails(randomManhwa.slug);
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo obra aleatoria:', error);
        return null;
    }
};
