import axios from 'axios';

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
export const searchManhwaWeb = async (query = '', filters = {}) => {
    try {
        console.log(`[ManhwaWeb] Buscando: "${query}"`, filters);

        if (!query || query.trim() === '') {
            console.log('[ManhwaWeb] Búsqueda vacía, retornando array vacío');
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

        // En producción, usar la API serverless
        const response = await axios.get('/api/manhwaweb/search', {
            params: { query },
            timeout: 30000
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
        
        // URL correcta de detalles
        const url = `${BASE_URL}/manhwa/${slug}`;
        
        // Construir detalles básicos desde el slug
        const title = slug.split('_')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return {
            id: `manhwaweb-${slug}`,
            slug,
            title,
            cover: '', // Se cargará de la búsqueda
            description: "Descubre esta increíble historia en ManhwaWeb. ¡A devorar! 🥑",
            genres: [],
            status: 'ongoing',
            author: 'Autor desconocido',
            lastChapter: '?',
            chaptersCount: 0,
            source: 'manhwaweb'
        };

        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');

        // Extraer título (buscar en múltiples ubicaciones)
        let title = doc.querySelector('h1')?.textContent?.trim() || '';
        if (!title) {
            // Fallback: extraer del slug
            title = slug.split('_')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        // Extraer imagen de portada
        let cover = '';
        const coverImg = doc.querySelector('img[src*="imageshack"], img[src*="manhwa"]');
        if (coverImg) {
            cover = coverImg.getAttribute('src') || '';
        }

        // Extraer descripción/sinopsis
        let description = '';
        const descriptionEl = doc.querySelector('p[class*="description"], div[class*="sinopsis"], div[class*="description"]');
        if (descriptionEl) {
            description = descriptionEl.textContent?.trim() || '';
        }
        
        if (!description) {
            description = "Descubre esta increíble historia. ¡A devorar! 🥑";
        }

        // Extraer géneros
        const genres = [];
        doc.querySelectorAll('a[href*="genero"], span[class*="genre"], a[class*="genre"]').forEach(el => {
            const genreName = el.textContent?.trim();
            if (genreName && genreName.length < 20) {
                genres.push(genreName);
            }
        });

        // Estado (por defecto ongoing)
        let status = 'ongoing';
        const statusText = doc.body?.textContent || '';
        if (statusText.toLowerCase().includes('finalizado') || 
            statusText.toLowerCase().includes('completado') ||
            statusText.toLowerCase().includes('completed')) {
            status = 'completed';
        }

        return {
            id: `manhwaweb-${slug}`,
            slug,
            title,
            cover,
            description,
            genres,
            status,
            author: 'Autor desconocido',
            lastChapter: '?',
            chaptersCount: 0,
            source: 'manhwaweb'
        };
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo detalles:', error);
        return null;
    }
};

/**
 * Obtiene la lista de capítulos de una obra
 */
export const getManhwaWebChapters = async (slug) => {
    try {
        const url = `${BASE_URL}/manhwa/${slug}`;
        const response = await fetchWithProxy(url);

        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        
        const chapters = [];
        
        // Buscar enlaces de capítulos (esto puede variar, necesita verificación)
        const chapterLinks = doc.querySelectorAll('a[href*="/capitulo/"], a[href*="/chapter/"], a[href*="/cap/"]');
        
        chapterLinks.forEach((link, index) => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            // Intentar extraer número de capítulo del href o del texto
            const chapterText = link.textContent.trim();
            const chapterMatch = chapterText.match(/cap[íi]tulo\s*(\d+\.?\d*)/i) || 
                                chapterText.match(/chapter\s*(\d+\.?\d*)/i) ||
                                chapterText.match(/(\d+\.?\d*)/);
            
            const chapterNum = chapterMatch ? chapterMatch[1] : String(index + 1);
            
            const uniqueId = `manhwaweb-${slug}-ch-${chapterNum}-${Date.now()}-${index}`;
            
            chapters.push({
                id: uniqueId,
                slug,
                chapter: chapterNum,
                title: chapterText || `Capítulo ${chapterNum}`,
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`
            });
        });
        
        console.log(`[ManhwaWeb] Encontrados ${chapters.length} capítulos`);
        return chapters;
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
 */
export const getRandomManhwaWeb = async (genreIds = []) => {
    try {
        // Buscar obras y seleccionar una aleatoria
        const results = await searchManhwaWeb('');
        
        if (results.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManhwa = results[randomIndex];
        
        // Obtener detalles completos
        return await getManhwaWebDetails(randomManhwa.slug);
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo obra aleatoria:', error);
        return null;
    }
};
