import axios from 'axios';

const BASE_URL = 'https://tumanga.org';

// Lista de proxies CORS para hacer fallback (ordenados por confiabilidad)
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
            console.log(`Intentando proxy ${proxyIndex + 1}/${PROXY_URLS.length}...`);

            const response = await axios.get(fullUrl, {
                timeout: 12000,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });

            // Si funcionó, usar este proxy para las siguientes peticiones
            currentProxyIndex = proxyIndex;
            console.log(`Proxy ${proxyUrl} funcionó correctamente`);
            return response;
        } catch (error) {
            const errorMsg = error.response?.status || error.message;
            console.warn(`Proxy ${proxyUrl} falló (${errorMsg}), intentando siguiente...`);
            errors.push({ proxy: proxyUrl, error: errorMsg });

            if (i === retries - 1) {
                console.error('Todos los proxies fallaron:', errors);
                throw new Error('Todos los proxies CORS fallaron');
            }
        }
    }
};

// Géneros completos de TuManga con sus IDs numéricos (47 géneros)
export const TUMANGA_GENRES = [
    { name: "Acción 💥", id: 1, displayName: "Acción" },
    { name: "Aventura 🗺️", id: 2, displayName: "Aventura" },
    { name: "Comedia 🤣", id: 3, displayName: "Comedia" },
    { name: "Drama 🎭", id: 4, displayName: "Drama" },
    { name: "Recuentos de la vida 📖", id: 5, displayName: "Recuentos de la vida" },
    { name: "Ecchi 🔥", id: 6, displayName: "Ecchi" },
    { name: "Fantasía 🧚", id: 7, displayName: "Fantasía" },
    { name: "Magia ✨", id: 8, displayName: "Magia" },
    { name: "Sobrenatural 👻", id: 9, displayName: "Sobrenatural" },
    { name: "Horror 💀", id: 10, displayName: "Horror" },
    { name: "Misterio 🔍", id: 11, displayName: "Misterio" },
    { name: "Psicológico 🧠", id: 12, displayName: "Psicológico" },
    { name: "Romance 💞", id: 13, displayName: "Romance" },
    { name: "Sci-fi 🚀", id: 14, displayName: "Sci-fi" },
    { name: "Thriller 🔪", id: 15, displayName: "Thriller" },
    { name: "Deporte ⚽", id: 16, displayName: "Deporte" },
    { name: "Girls Love 🌸", id: 17, displayName: "Girls Love" },
    { name: "Boys Love 💕", id: 18, displayName: "Boys Love" },
    { name: "Harem 👯", id: 19, displayName: "Harem" },
    { name: "Mecha 🤖", id: 20, displayName: "Mecha" },
    { name: "Supervivencia 🏃", id: 21, displayName: "Supervivencia" },
    { name: "Reencarnación 🔄", id: 22, displayName: "Reencarnación" },
    { name: "Gore 🩸", id: 23, displayName: "Gore" },
    { name: "Apocalíptico 🌋", id: 24, displayName: "Apocalíptico" },
    { name: "Tragedia 🥀", id: 25, displayName: "Tragedia" },
    { name: "Vida Escolar 🎒", id: 26, displayName: "Vida Escolar" },
    { name: "Historia 🏰", id: 27, displayName: "Historia" },
    { name: "Militar 🪖", id: 28, displayName: "Militar" },
    { name: "Policiaco 👮", id: 29, displayName: "Policiaco" },
    { name: "Crimen 🔫", id: 30, displayName: "Crimen" },
    { name: "Superpoderes 💪", id: 31, displayName: "Superpoderes" },
    { name: "Vampiros 🧛", id: 32, displayName: "Vampiros" },
    { name: "Artes Marciales 🥋", id: 33, displayName: "Artes Marciales" },
    { name: "Samurái ⚔️", id: 34, displayName: "Samurái" },
    { name: "Género Bender 🔀", id: 35, displayName: "Género Bender" },
    { name: "VR 🎮", id: 36, displayName: "VR" },
    { name: "Ciberpunk 🌃", id: 37, displayName: "Ciberpunk" },
    { name: "Música 🎵", id: 38, displayName: "Música" },
    { name: "Parodia 🎭", id: 39, displayName: "Parodia" },
    { name: "Animación 🎬", id: 40, displayName: "Animación" },
    { name: "Demonios 😈", id: 41, displayName: "Demonios" },
    { name: "Familia 👨‍👩‍👧", id: 42, displayName: "Familia" },
    { name: "Extranjero 🌍", id: 43, displayName: "Extranjero" },
    { name: "Niños 👶", id: 44, displayName: "Niños" },
    { name: "Realidad 📺", id: 45, displayName: "Realidad" },
    { name: "Telenovela 📻", id: 46, displayName: "Telenovela" },
    { name: "Guerra ⚔️", id: 47, displayName: "Guerra" }
];

// Opciones de ordenamiento para TuManga
export const TUMANGA_SORT_BY = [
    { name: "Título", id: "title", value: "title" },
    { name: "Año", id: "year", value: "year" },
    { name: "Fecha Añadido", id: "date", value: "date" }
];

// Opciones de modo de ordenamiento
export const TUMANGA_SORT_ORDER = [
    { name: "Ascendente (A-Z, 0-9)", id: "asc", value: "asc", icon: "↑" },
    { name: "Descendente (Z-A, 9-0)", id: "desc", value: "desc", icon: "↓" }
];

// Moods predefinidos que mapean a géneros de TuManga (usando IDs numéricos)
export const TUMANGA_MOODS = [
    {
        name: "Quiero llorar 😭",
        id: "cry",
        genres: [4, 25],  // Drama (4), Tragedia (25)
        toast: "Busca los pañuelos, que hoy se llora... 😭",
        color: "from-blue-400 to-blue-600"
    },
    {
        name: "Colapso de amor 😍",
        id: "love",
        genres: [13, 3],  // Romance (13), Comedia (3)
        toast: "Prepárate para el colapso de azúcar, divina... 😍",
        color: "from-pink-400 to-rose-600"
    },
    {
        name: "Chisme y traición 🐍",
        id: "tea",
        genres: [4, 12],  // Drama (4), Psicológico (12)
        toast: "Prepárate, que el chisme viene fuerte... 🐍☕",
        color: "from-indigo-400 to-purple-600"
    },
    {
        name: "¡A devorar! 💅",
        id: "devour",
        genres: [1, 7],  // Acción (1), Fantasía (7)
        toast: "¡Poder total activado! Vas a devorar... 💅",
        color: "from-potaxie-green to-teal-600"
    },
    {
        name: "Noche de terror 🕯️",
        id: "fear",
        genres: [10, 11],  // Horror (10), Misterio (11)
        toast: "No mires atrás... el misterio te espera... 🕯️",
        color: "from-gray-700 to-gray-900"
    }
];

// Formatos/Tipos disponibles
export const TUMANGA_FORMATS = [
    { name: "Manga 🇯🇵", id: "manga", color: "bg-red-500" },
    { name: "Manhwa 🇰🇷", id: "manhwa" },
    { name: "Manhua 🇨🇳", id: "manhua" },
    { name: "Webtoon 📱", id: "webtoon" }
];

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
 * Extrae el número de capítulo de una URL
 * Ejemplos: /leer/one-punch-man-234.00 -> "234.00"
 *           /leer/jinx-86 -> "86"
 */
const extractChapterNumber = (href, slug) => {
    if (!href) return null;

    // Intentar extraer después del slug
    // Formato: /leer/[slug]-[numero]
    const slugPattern = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapar caracteres especiales
    const regex = new RegExp(`${slugPattern}-(\\d+(?:\\.\\d+)?)`);
    const match = href.match(regex);

    if (match) {
        return match[1];
    }

    // Fallback: buscar cualquier número al final
    const fallbackMatch = href.match(/-(\d+(?:\\.\\d+)?)(?:\.00)?$/);
    if (fallbackMatch) {
        return fallbackMatch[1];
    }

    return null;
};

/**
 * Claves conocidas que TuManga ha usado para la decodificación XOR
 * Se actualizan cuando el sitio cambia su clave
 */
const KNOWN_KEYS = [
    'y4Ic07YqD0',
    'b2c0733448d61c4ac81076792dcbc497',
    'tumanga2024',
    'potaxie',
    'manga123'
];

/**
 * Decodifica las URLs de imágenes desde el array codificado usando XOR
 */
function decodeImageUrl(encoded, key) {
    try {
        // Limpiar el encoded string
        const cleanEncoded = encoded.replace(/\s/g, '');

        // Decodificar base64
        const decoded = atob(cleanEncoded);
        let result = '';

        // Aplicar XOR con la clave
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }

        // Verificar que el resultado parece una ruta válida (puede empezar con / o con texto)
        // Las rutas decodificadas pueden variar en formato
        if (result && result.length > 5 && !result.includes('\x00')) {
            return result;
        }

        return null;
    } catch (error) {
        // No logueamos cada error individual para evitar spam
        return null;
    }
}

/**
 * Intenta decodificar con múltiples claves hasta encontrar una válida
 */
function tryDecodeWithKeys(encoded, primaryKey) {
    // Primero intentar con la clave proporcionada
    if (primaryKey) {
        const result = decodeImageUrl(encoded, primaryKey);
        if (result) return result;
    }

    // Luego intentar con claves conocidas
    for (const key of KNOWN_KEYS) {
        const result = decodeImageUrl(encoded, key);
        if (result) return result;
    }

    return null;
}

/**
 * Construye la URL de búsqueda de TuManga con todos los parámetros
 * @param {string} query - Término de búsqueda
 * @param {object} filters - Filtros a aplicar
 * @returns {string} URL completa
 */
function buildTuMangaSearchURL(query = '', filters = {}) {
    const baseUrl = `${BASE_URL}/biblioteca`;
    const params = new URLSearchParams();

    // 1. Título (búsqueda por texto)
    params.append('title', query || '');

    // 2. Géneros (c[]=1&c[]=2&c[]=3)
    if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
        filters.genres.forEach(genreId => {
            params.append('c[]', genreId);
        });
    }

    // 3. Ordenar por (title, year, date)
    const sortBy = filters.sortBy || 'title';
    params.append('order_by', sortBy);

    // 4. Modo de ordenamiento (asc, desc)
    const sortOrder = filters.sortOrder || 'asc';
    params.append('order_mode', sortOrder);

    // 5. Página (0-based: 0, 1, 2, ...)
    const page = filters.page !== undefined ? filters.page : 0;
    params.append('page', page);

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Busca mangas en TuManga con filtros opcionales
 * @param {string} query - Término de búsqueda
 * @param {object} filters - Filtros aplicados
 * @param {array} filters.genres - Array de IDs de géneros (números)
 * @param {string} filters.sortBy - 'title', 'year', o 'date'
 * @param {string} filters.sortOrder - 'asc' o 'desc'
 * @param {number} filters.page - Número de página (0-based)
 * @returns {Promise<array>} Array de mangas encontrados
 */
export const searchTuManga = async (query = '', filters = {}) => {
    try {
        console.log(`[TuManga] Buscando: "${query}"`, filters);

        // Construir URL con parámetros
        const url = buildTuMangaSearchURL(query, filters);
        console.log(`[TuManga] URL construida: ${url}`);

        const response = await fetchWithProxy(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        const results = [];

        // Seleccionar elementos de manga
        doc.querySelectorAll('.gm_h .item, ul.gm_h li.item').forEach((el, index) => {
            const link = el.querySelector('a');
            const href = link?.getAttribute('href');

            if (href && href.startsWith('/online/')) {
                const slug = href.replace('/online/', '');
                const title = el.querySelector('h2')?.textContent?.trim();
                const img = el.querySelector('img');
                const coverUrl = img?.getAttribute('data-src') || img?.getAttribute('src');

                if (title && slug) {
                    const uniqueId = `tumanga-${slug}-${Date.now()}-${index}`;
                    results.push({
                        id: uniqueId,
                        slug,
                        title,
                        cover: coverUrl?.startsWith('http') ? coverUrl : `${BASE_URL}${coverUrl}`,
                        source: 'tumanga'
                    });
                }
            }
        });

        console.log(`[TuManga] Encontrados ${results.length} resultados`);
        return results;
    } catch (error) {
        console.error('[TuManga] Error en búsqueda:', error);
        return [];
    }
};

/**
 * Obtiene los detalles completos de un manga
 */
export const getTuMangaDetails = async (slug) => {
    try {
        const url = `${BASE_URL}/online/${slug}`;
        const response = await fetchWithProxy(url);

        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');

        // Extraer título
        const title = doc.querySelector('h1')?.textContent?.trim() || slug;

        // Extraer imagen de portada - probar múltiples selectores
        const coverSelectors = [
            '.cover img',
            '.portada img',
            '.manga-cover img',
            '.thumb img',
            '.info img',
            'img[alt*="cover"]',
            'img[data-src*="uploads"]',
            'img[src*="uploads"]',
            '.container img'
        ];

        let cover = '';
        for (const selector of coverSelectors) {
            const img = doc.querySelector(selector);
            if (img) {
                const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
                // Solo aceptar si no es un loader
                if (src && !src.includes('loader') && !src.includes('assets/img')) {
                    cover = src;
                    break;
                }
            }
        }

        // Si no encontramos con selectores, buscar cualquier imagen que parezca portada
        if (!cover) {
            const allImages = doc.querySelectorAll('img');
            for (const img of allImages) {
                const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
                if (src && !src.includes('loader') && !src.includes('assets/img') &&
                    (src.includes('uploads') || src.includes('cover') || src.includes('poster'))) {
                    cover = src;
                    break;
                }
            }
        }

        if (cover && !cover.startsWith('http')) {
            cover = `${BASE_URL}${cover}`;
        }

        // Extraer sinopsis
        let description = '';
        const allParagraphs = doc.querySelectorAll('p');
        for (const p of allParagraphs) {
            const text = p.textContent?.trim() || '';
            if (text.length > 50 && !text.includes('Capítulo') && !text.includes('Inicio')) {
                description = text;
                break;
            }
        }

        // Extraer géneros/categorías
        const genres = [];
        doc.querySelectorAll('a[href*="biblioteca?c"]').forEach(el => {
            const genreName = el.textContent?.trim();
            if (genreName) {
                genres.push(genreName);
            }
        });

        // Extraer estado
        let status = 'ongoing';
        const statusText = doc.body?.textContent || '';
        if (statusText.toLowerCase().includes('finalizado') || statusText.toLowerCase().includes('completado')) {
            status = 'completed';
        }

        // Contar capítulos
        const chapters = [];
        const seenChapters = new Set();

        doc.querySelectorAll('.main_chapters .indi_chap').forEach((el, index) => {
            const chLink = el.querySelector('a.chap_go');
            const href = chLink?.getAttribute('href');

            if (href && href.includes('/leer/')) {
                const chapterNum = extractChapterNumber(href, slug) || String(index + 1);

                // Evitar duplicados
                if (!seenChapters.has(chapterNum)) {
                    seenChapters.add(chapterNum);
                    // Generar ID único garantizado
                    const uniqueId = `tumanga-${slug || 'unknown'}-ch-${chapterNum}-${Date.now()}-${index}`;
                    chapters.push({
                        id: uniqueId,
                        slug,
                        chapter: chapterNum,
                        title: chLink.getAttribute('title') || `Capítulo ${chapterNum}`,
                        url: href.startsWith('/') ? `${BASE_URL}${href}` : href
                    });
                }
            }
        });

        // Obtener el número más alto de capítulo
        let lastChapter = '?';
        if (chapters.length > 0) {
            const chapterNumbers = chapters.map(c => parseFloat(c.chapter)).filter(n => !isNaN(n));
            if (chapterNumbers.length > 0) {
                lastChapter = Math.max(...chapterNumbers).toString();
            }
        }

        return {
            id: `tumanga-${slug}`,
            slug,
            title,
            cover,
            description: description || "Esta obra es tan icónica que no necesita palabras... ¡Devoraste! 🥑",
            genres,
            status,
            author: 'Autor desconocido',
            lastChapter,
            chaptersCount: chapters.length,
            source: 'tumanga'
        };
    } catch (error) {
        console.error('Error getting manga details:', error);
        return null;
    }
};

/**
 * Obtiene la lista de capítulos de una obra
 */
export const getTuMangaChapters = async (slug) => {
    try {
        const url = `${BASE_URL}/online/${slug}`;
        const response = await fetchWithProxy(url);

        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        const chapters = [];
        const seenChapters = new Set();

        doc.querySelectorAll('.main_chapters .indi_chap').forEach((el, index) => {
            const link = el.querySelector('a.chap_go');
            const href = link?.getAttribute('href');

            if (href) {
                const chapterNum = extractChapterNumber(href, slug) || String(index + 1);

                // Evitar duplicados - usar el número de capítulo como key
                const chapterKey = chapterNum.split('.')[0]; // Usar solo la parte entera para agrupar
                if (!seenChapters.has(chapterKey)) {
                    seenChapters.add(chapterKey);

                    const title = link.getAttribute('title') || `Capítulo ${chapterNum}`;
                    // Generar ID único garantizado
                    const uniqueId = `tumanga-${slug || 'unknown'}-ch-${chapterNum}-${Date.now()}-${index}`;

                    chapters.push({
                        id: uniqueId,
                        slug,
                        chapter: chapterNum,
                        title,
                        url: href.startsWith('/') ? `${BASE_URL}${href}` : href
                    });
                }
            }
        });

        return chapters;
    } catch (error) {
        console.error('Error getting chapters from TuManga:', error);
        return [];
    }
};

/**
 * Extrae la clave de decodificación del HTML de la página
 */
function extractKeyFromHtml(html) {
    // Método 1: meta tag ad:check con content
    let match = html.match(/meta\s+property="ad:check"\s+content="([^"]+)"/);
    if (match) return match[1];

    // Método 2: meta tag ad:check con data-src
    match = html.match(/meta\s+property="ad:check"[^>]*data-src="([^"]+)"/);
    if (match) return match[1];

    // Método 3: Buscar la variable 'c' que a veces contiene la clave
    match = html.match(/var\s+c\s*=\s*["']([a-f0-9]{32})["']/);
    if (match) return match[1];

    // Método 4: Buscar kpk directamente
    match = html.match(/let\s+kpk\s*=\s*["']([^"']+)["']/);
    if (match) return match[1];

    return null;
}

/**
 * Construye la URL final de la imagen según el formato de TuManga
 */
function buildImageUrl(decodedPath, pageIndex) {
    // TuManga usa diferentes formatos de URL
    // Formato 1: /pic_source/[path]
    // Formato 2: /social-google-oauth.php[path][index]/social-google-oauth.png

    if (decodedPath.startsWith('/pic_source/')) {
        // Formato antiguo directo
        return `${BASE_URL}${decodedPath}`;
    }

    // Formato nuevo ofuscado
    const imageUrl = `${BASE_URL}/social-google-oauth.php${decodedPath}${pageIndex}/social-google-oauth.png`;
    return imageUrl;
}

/**
 * Obtiene las imágenes de un capítulo usando la API serverless con Puppeteer
 * Esto ejecuta un navegador headless que puede obtener las imágenes decodificadas
 */
export const getTuMangaPages = async (slug, chapter) => {
    try {
        console.log(`Fetching chapter ${chapter} of ${slug} via API...`);

        // Determinar la URL de la API (local o producción)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocalhost ? 'http://localhost:3000' : '';

        // Llamar a nuestra API serverless que usa Puppeteer
        const apiUrl = `${apiBase}/api/tumanga/pages?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(chapter)}`;
        console.log('Calling API:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.pages && data.pages.length > 0) {
            console.log(`API returned ${data.pages.length} pages`);
            return data.pages;
        }

        // Si la API no encontró páginas, intentar el método de scraping directo como fallback
        console.log('API returned no pages, trying direct scraping fallback...');
        return await getTuMangaPagesDirectScraping(slug, chapter);

    } catch (error) {
        console.error('Error fetching from API:', error);
        // Fallback al método de scraping directo
        console.log('API failed, trying direct scraping fallback...');
        return await getTuMangaPagesDirectScraping(slug, chapter);
    }
};

/**
 * Método de scraping directo (fallback) - intenta decodificar las URLs del lado del cliente
 */
const getTuMangaPagesDirectScraping = async (slug, chapter) => {
    try {
        const url = `${BASE_URL}/leer/${slug}-${chapter}`;
        console.log('Direct scraping from:', url);

        const response = await fetchWithProxy(url);
        const html = response.data;

        // Extraer la clave del HTML
        const extractedKey = extractKeyFromHtml(html);

        // Buscar el array PIC_ARRAY
        const picArrayMatch = html.match(/var\s+PIC_ARRAY\s*=\s*\[([\s\S]*?)\];/);
        if (!picArrayMatch) {
            console.warn('PIC_ARRAY not found in page');
            return [];
        }

        const encodedUrls = picArrayMatch[1].match(/"([^"]+)"/g) || [];
        const pages = [];
        let successfulKey = null;

        for (let i = 0; i < encodedUrls.length; i++) {
            const encoded = encodedUrls[i];
            const cleanEncoded = encoded.replace(/"/g, '');

            if (successfulKey) {
                const decodedPath = decodeImageUrl(cleanEncoded, successfulKey);
                if (decodedPath) {
                    pages.push(buildImageUrl(decodedPath, i));
                }
            } else {
                const decodedPath = tryDecodeWithKeys(cleanEncoded, extractedKey);
                if (decodedPath) {
                    pages.push(buildImageUrl(decodedPath, i));
                    successfulKey = extractedKey || KNOWN_KEYS.find(k => decodeImageUrl(cleanEncoded, k));
                }
            }
        }

        if (pages.length > 0) {
            console.log(`Direct scraping found ${pages.length} pages`);
            return pages;
        }

        // Buscar URLs directas como último recurso
        const directUrls = html.match(/https?:\/\/[^\s"'<>]+\.(jpg|png|webp|jpeg)/gi) || [];
        const mangaImages = directUrls.filter(url =>
            url.includes('/pic') || url.includes('manga') || url.includes('social-google-oauth')
        );

        return mangaImages;
    } catch (error) {
        console.error('Direct scraping failed:', error);
        return [];
    }
};

/**
 * Obtiene mangas aleatorios para el Oráculo
 * @param {array} genreIds - Array de IDs de géneros numéricos (ej: [1, 4, 7])
 * @returns {Promise<object|null>} Manga aleatorio con detalles completos
 */
export const getRandomManga = async (genreIds = []) => {
    try {
        console.log('[TuManga] Obteniendo manga aleatorio con géneros:', genreIds);

        // Si hay géneros, buscar con filtros
        const filters = genreIds.length > 0
            ? { genres: genreIds }  // Array de IDs numéricos [1, 4, 7]
            : {};

        // Usar búsqueda con filtros (usa buildTuMangaSearchURL internamente)
        const results = await searchTuManga('', filters);

        if (results.length === 0) {
            console.log('[TuManga] No se encontraron resultados con filtros, intentando sin filtros');
            const allResults = await searchTuManga('', {});
            if (allResults.length === 0) return null;

            const randomIndex = Math.floor(Math.random() * allResults.length);
            const randomManga = allResults[randomIndex];
            return await getTuMangaDetails(randomManga.slug);
        }

        // Seleccionar uno aleatorio de los resultados filtrados
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManga = results[randomIndex];

        console.log(`[TuManga] Manga aleatorio seleccionado: ${randomManga.title}`);
        return await getTuMangaDetails(randomManga.slug);
    } catch (error) {
        console.error('[TuManga] Error getting random manga:', error);
        return null;
    }
};

/**
 * Busca mangas con detalles completos
 */
export const searchTuMangaWithDetails = async (query = '', filters = {}) => {
    try {
        const basicResults = await searchTuManga(query, filters);
        const limitedResults = basicResults.slice(0, 24);

        return limitedResults.map(manga => ({
            ...manga,
            description: "Haz clic para ver más detalles... 🥑",
            author: 'Cargando...',
            status: 'ongoing',
            lastChapter: '?',
            year: '?'
        }));
    } catch (error) {
        console.error('Error in searchTuMangaWithDetails:', error);
        return [];
    }
};
