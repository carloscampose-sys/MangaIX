import axios from 'axios';

const BASE_URL = 'https://tumanga.org';

// Lista de proxies CORS para hacer fallback
const PROXY_URLS = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
];

let currentProxyIndex = 0;

/**
 * Hace una petición con fallback de proxies
 */
const fetchWithProxy = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        const proxyUrl = PROXY_URLS[(currentProxyIndex + i) % PROXY_URLS.length];
        try {
            const response = await axios.get(`${proxyUrl}${encodeURIComponent(url)}`, {
                timeout: 15000
            });
            // Si funcionó, usar este proxy para las siguientes peticiones
            currentProxyIndex = (currentProxyIndex + i) % PROXY_URLS.length;
            return response;
        } catch (error) {
            console.warn(`Proxy ${proxyUrl} falló, intentando siguiente...`);
            if (i === retries - 1) throw error;
        }
    }
};

// Géneros disponibles en TuManga con sus IDs
export const TUMANGA_GENRES = [
    { name: "Romance 💞", id: "romance", searchParam: "Romance" },
    { name: "Boys Love 💕", id: "boys-love", searchParam: "Boys Love" },
    { name: "Girls Love 🌸", id: "girls-love", searchParam: "Girls Love" },
    { name: "Acción 💥", id: "accion", searchParam: "Acción" },
    { name: "Aventura 🗺️", id: "aventura", searchParam: "Aventura" },
    { name: "Comedia 🤣", id: "comedia", searchParam: "Comedia" },
    { name: "Drama 🎭", id: "drama", searchParam: "Drama" },
    { name: "Fantasía 🧚", id: "fantasia", searchParam: "Fantasia" },
    { name: "Sobrenatural 👻", id: "sobrenatural", searchParam: "Sobrenatural" },
    { name: "Horror 💀", id: "horror", searchParam: "Horror" },
    { name: "Misterio 🔍", id: "misterio", searchParam: "Misterio" },
    { name: "Psicológico 🧠", id: "psicologico", searchParam: "Psicológico" },
    { name: "Thriller 🔪", id: "thriller", searchParam: "Thriller" },
    { name: "Sci-fi 🚀", id: "sci-fi", searchParam: "Sci-fi" },
    { name: "Vida Escolar 🎒", id: "vida-escolar", searchParam: "Vida Escolar" },
    { name: "Histórico 🏰", id: "historia", searchParam: "Historia" },
    { name: "Artes Marciales 🥋", id: "artes-marciales", searchParam: "Artes Marciales" },
    { name: "Reencarnación ✨", id: "reencarnacion", searchParam: "Reencarnación" },
    { name: "Tragedia 🥀", id: "tragedia", searchParam: "Tragedia" },
    { name: "Harem 👯", id: "harem", searchParam: "Harem" },
    { name: "Gore 🩸", id: "gore", searchParam: "Gore" },
    { name: "Supervivencia 🏃", id: "supervivencia", searchParam: "Supervivencia" }
];

// Moods predefinidos que mapean a géneros de TuManga
export const TUMANGA_MOODS = [
    {
        name: "Quiero llorar 😭",
        id: "cry",
        genres: ["drama", "tragedia"],
        toast: "Busca los pañuelos, que hoy se llora... 😭",
        color: "from-blue-400 to-blue-600"
    },
    {
        name: "Colapso de amor 😍",
        id: "love",
        genres: ["romance", "comedia"],
        toast: "Prepárate para el colapso de azúcar, divina... 😍",
        color: "from-pink-400 to-rose-600"
    },
    {
        name: "Chisme y traición 🐍",
        id: "tea",
        genres: ["drama", "psicologico"],
        toast: "Prepárate, que el chisme viene fuerte... 🐍☕",
        color: "from-indigo-400 to-purple-600"
    },
    {
        name: "¡A devorar! 💅",
        id: "devour",
        genres: ["accion", "fantasia"],
        toast: "¡Poder total activado! Vas a devorar... 💅",
        color: "from-potaxie-green to-teal-600"
    },
    {
        name: "Noche de terror 🕯️",
        id: "fear",
        genres: ["horror", "misterio"],
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
 * Busca mangas en TuManga con filtros opcionales
 */
export const searchTuManga = async (query = '', filters = {}) => {
    try {
        console.log(`Buscando en TuManga: "${query}"`, filters);

        let url = `${BASE_URL}/biblioteca?`;
        const params = new URLSearchParams();

        if (query) {
            params.append('title', query);
        }

        url += params.toString();

        const response = await fetchWithProxy(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        const results = [];

        doc.querySelectorAll('.gm_h .item, ul.gm_h li.item').forEach((el, index) => {
            const link = el.querySelector('a');
            const href = link?.getAttribute('href');

            if (href && href.startsWith('/online/')) {
                const slug = href.replace('/online/', '');
                const title = el.querySelector('h2')?.textContent?.trim();
                const img = el.querySelector('img');
                const coverUrl = img?.getAttribute('data-src') || img?.getAttribute('src');

                if (title && slug) {
                    // Generar un ID único usando slug + timestamp + index
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

        return results;
    } catch (error) {
        console.error('Error searching TuManga:', error);
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

        // Extraer imagen de portada
        const coverImg = doc.querySelector('.cover img, .portada img, img[alt*="cover"], .manga-cover img');
        let cover = coverImg?.getAttribute('data-src') || coverImg?.getAttribute('src') || '';
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
 */
export const getRandomManga = async (genreIds = []) => {
    try {
        let searchTerm = '';

        if (genreIds.length > 0) {
            const genre = TUMANGA_GENRES.find(g => genreIds.includes(g.id));
            if (genre) {
                searchTerm = genre.searchParam;
            }
        }

        const results = await searchTuManga(searchTerm);

        if (results.length === 0) {
            const allResults = await searchTuManga('');
            if (allResults.length === 0) return null;
            const randomIndex = Math.floor(Math.random() * allResults.length);
            const randomManga = allResults[randomIndex];
            return await getTuMangaDetails(randomManga.slug);
        }

        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManga = results[randomIndex];

        return await getTuMangaDetails(randomManga.slug);
    } catch (error) {
        console.error('Error getting random manga:', error);
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
