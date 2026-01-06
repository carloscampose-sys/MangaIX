import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * API Route: Ikigai Search
 * Enfoque Híbrido:
 * - Búsqueda por título: Puppeteer (scraping del sitio web)
 * - Búsqueda con filtros: API directa (+proxies fallback)
 */

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  // ====================================================
  // ENRUTAMIENTO INTELIGENTE
  // ====================================================

  // CASO 1: Búsqueda por título (hay query) → Usar Puppeteer
  if (query && query.trim()) {
    console.log('[Ikigai Search] Búsqueda por título detectada, usando Puppeteer...');
    return handleSearchWithPuppeteer(query, filters, page, res);
  }

  // CASO 2: Búsqueda solo con filtros (sin query) → Usar API actual
  console.log('[Ikigai Search] Búsqueda solo con filtros, usando API...');
  return handleSearchWithAPI(filters, page, res);
}

// ====================================================
// HANDLER 1: Búsqueda con Puppeteer (Título)
// ====================================================
async function handleSearchWithPuppeteer(query, filters, page, res) {
  let browser = null;

  try {
    // Validar query
    if (!query || query.trim() === '') {
      return res.status(200).json({
        results: [],
        page: 1,
        totalPages: 1,
        total: 0,
        hasMore: false
      });
    }

    // Construir URL de búsqueda del sitio web
    const queryEncoded = encodeURIComponent(query.trim());
    let searchUrl = `https://viralikigai.learnixs.site/series/?buscar=${queryEncoded}&pagina=${page}`;

    // Aplicar filtros de géneros si existen
    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach(genreId => {
        searchUrl += `&generos[]=${genreId}`;
      });
    }

    console.log('[Ikigai Search Puppeteer] URL:', searchUrl);

    // Lanzar navegador (misma configuración que pages.js)
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const puppeteerPage = await browser.newPage();

    // User agent de navegador real
    await puppeteerPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Bloquear ads y recursos innecesarios (misma lógica que pages.js)
    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'facebook', 'google-analytics', 'doubleclick', 'tracking'];
      const url = request.url().toLowerCase();
      const resourceType = request.resourceType();

      if (blockedResources.some(r => url.includes(r))) {
        request.abort();
        return;
      }

      // Bloquear imágenes de ads
      if (resourceType === 'image' && url.includes('ad')) {
        request.abort();
        return;
      }

      request.continue();
    });

    // Navegar a la página de búsqueda
    await puppeteerPage.goto(searchUrl, {
      waitUntil: 'networkidle0',
      timeout: 45000
    });

    // Esperar carga de Qwik framework (misma lógica que pages.js)
    console.log('[Ikigai Search Puppeteer] Esperando carga de Qwik framework...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraer resultados con múltiples selectores
    console.log('[Ikigai Search Puppeteer] Extrayendo resultados...');
    const searchResults = await puppeteerPage.evaluate(() => {
      // Intentar múltiples selectores para encontrar cards
      const selectors = [
        '.card',
        '.serie-card',
        '[class*="card"]',
        '[class*="serie"]',
        '.grid > div',
        'article',
        '.result-card'
      ];

      let cards = [];
      for (const selector of selectors) {
        const found = Array.from(document.querySelectorAll(selector));
        // Filtrar elementos que parezcan cards reales (tienen imagen o título)
        const validCards = found.filter(card => {
          const hasImage = card.querySelector('img');
          const hasTitle = card.querySelector('h1, h2, h3, .title, [class*="title"]');
          return hasImage || hasTitle;
        });

        if (validCards.length > 0) {
          console.log(`[Ikigai Search Puppeteer] Encontradas ${validCards.length} cards con selector: ${selector}`);
          cards = validCards;
          break;
        }
      }

      const results = [];

      cards.forEach(card => {
        try {
          // Extraer imagen de portada (múltiples selectores)
          const imgSelectors = [
            'img.cover',
            'img[alt*="portada"]',
            'img[src*="ikigaimangas"]',
            'img[src*="imagedelivery.net"]',
            'img'
          ];
          let imgElement = null;
          for (const selector of imgSelectors) {
            imgElement = card.querySelector(selector);
            if (imgElement && (imgElement.src || imgElement.dataset?.src)) {
              break;
            }
          }

          const cover = imgElement?.src || imgElement?.dataset?.src || '';

          // Extraer título (múltiples selectores)
          const titleSelectors = [
            '.title',
            'h3',
            'h2',
            'h1',
            '.name',
            '[class*="title"]',
            '[class*="name"]',
            'a[title]'
          ];
          let titleElement = null;
          for (const selector of titleSelectors) {
            titleElement = card.querySelector(selector);
            const text = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
            if (text) {
              break;
            }
          }

          const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';

          // Extraer link para obtener el slug
          const linkElement = card.querySelector('a[href]');
          const href = linkElement?.href || '';
          // Extraer slug de varias formas posibles
          const slugMatch = href.match(/\/([^\/]+)\/?$/);
          const slug = slugMatch ? slugMatch[1] : href.split('/').pop() || '';

          // Extraer géneros
          const genreElements = card.querySelectorAll('.genre, .tag, span[class*="genre"], [class*="tag"]');
          const genres = Array.from(genreElements)
            .map(g => g.textContent?.trim())
            .filter(Boolean);

          // Extraer estado
          const statusElement = card.querySelector('.status, .estado, [class*="status"]');
          const status = statusElement?.textContent?.trim() || '';

          // Extraer tipo
          const typeElement = card.querySelector('.type, .tipo, [class*="type"]');
          const type = typeElement?.textContent?.trim() || '';

          if (title) {
            results.push({
              title,
              slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              cover,
              genres,
              status,
              type
            });
          }
        } catch (error) {
          // Ignorar errores individuales
        }
      });

      return results;
    });

    console.log(`[Ikigai Search Puppeteer] ${searchResults.length} resultados extraídos`);

    // Cerrar navegador
    await browser.close();

    // Transformar resultados al formato de la app
    const results = searchResults.map((item, index) => ({
      id: `ikigai-${item.slug}-${Date.now()}-${index}`,
      slug: item.slug,
      title: item.title,
      cover: item.cover,
      source: 'ikigai',
      type: item.type || 'comic',
      status: item.status || 'En Curso',
      chapterCount: 0, // Puppeteer no expone esto en la búsqueda
      genres: item.genres || []
    }));

    // Filtrar por coincidencia exacta si el checkbox está marcado
    if (filters.exactMatch && query && query.trim()) {
      const normalizedQuery = normalizeTitle(query.trim());
      console.log('[Ikigai Search Puppeteer] Filtrando por coincidencia exacta:', normalizedQuery);

      results = results.filter(serie =>
        normalizeTitle(serie.title).toLowerCase() === normalizedQuery.toLowerCase()
      );

      console.log(`[Ikigai Search Puppeteer] ${results.length} resultados después de filtro exacto`);
    }

    // Si no hay resultados y checkbox marcado, enviar mensaje informativo
    if (results.length === 0 && filters.exactMatch && query && query.trim()) {
      console.log('[Ikigai Search Puppeteer] No se encontró coincidencia exacta');
      return res.status(200).json({
        results: [],
        message: 'No se encontró una obra con ese título exacto',
        page: 1,
        totalPages: 1,
        total: 0,
        hasMore: false
      });
    }

    return res.status(200).json({
      results,
      page: page,
      totalPages: page + 1, // Por defecto, puede mejorarse
      total: results.length,
      hasMore: results.length > 0
    });

  } catch (error) {
    console.error('[Ikigai Search Puppeteer] Error:', error);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}

// ====================================================
// HANDLER 2: Búsqueda con API (Filtros)
// ====================================================
async function handleSearchWithAPI(filters, page, res) {
  // ====================================================
  // TODO EL CÓDIGO ACTUAL DE API + PROXIES
  // SIN NINGÚN CAMBIO
  // ====================================================

  // Validar: Si no hay query ni filtros, no buscar
  if (!filters.genres || filters.genres.length === 0) {
    console.log('[Ikigai Search API] No hay filtros, retornando array vacío');
    return res.status(200).json({
      results: [],
      page: 1,
      totalPages: 1,
      total: 0,
      hasMore: false
    });
  }

  try {
    // Construir URL de la API
    const apiUrl = buildApiUrl('', filters, page); // Query vacía
    console.log('[Ikigai Search API] API URL:', apiUrl);

    // Headers completos que simulan un navegador real (MANTENER ACTUALES)
    const browserHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://viralikigai.learnixs.site',
      'Referer': `https://viralikigai.learnixs.site/`,
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Llamar a la API de Ikigai
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: browserHeaders
    });

    console.log('[Ikigai Search API] Response status:', response.status);

    if (!response.ok) {
      // Si la API directa falla, intentar con proxy alternativo
      console.log('[Ikigai Search API] API directa falló, intentando alternativa...');

      // Usar corsproxy.io con URL encode
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      console.log('[Ikigai Search API] Proxy URL:', proxyUrl);

      const proxyResponse = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!proxyResponse.ok) {
        // Intentar con allorigins.win
        console.log('[Ikigai Search API] corsproxy falló, intentando allorigins.win...');
        const alloriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

        const alloriginsResponse = await fetch(alloriginsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (alloriginsResponse.ok) {
          console.log('[Ikigai Search API] allorigins.win funcionó');
          const alloriginsData = await alloriginsResponse.json();
          return processAndReturnResults(alloriginsData, page, res, '', filters); // Query vacía
        }

        console.log('[Ikigai Search API] allorigins falló, intentando thingproxy...');
        const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(apiUrl)}`;

        const thingProxyResponse = await fetch(thingProxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!thingProxyResponse.ok) {
          console.error('[Ikigai Search API] Todos los proxies fallaron');
          return res.status(500).json({
            error: 'Error en la API de Ikigai',
            details: 'Todos los métodos fallaron'
          });
        }

        const thingProxyData = await thingProxyResponse.json();
        return processAndReturnResults(thingProxyData, page, res, '', filters); // Query vacía
      }

      const proxyData = await proxyResponse.json();
      return processAndReturnResults(proxyData, page, res, '', filters); // Query vacía
    }

    const data = await response.json();
    return processAndReturnResults(data, page, res, '', filters); // Query vacía

  } catch (error) {
    console.error('[Ikigai Search API] Error:', error);

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}

/**
 * Procesa los datos y retorna la respuesta (reutilizado por ambos handlers)
 */
function processAndReturnResults(data, page, res, query, filters) {
  console.log('[Ikigai Search] API Response - Total:', data.total, 'Current Page:', data.current_page);

  // Transformar resultados al formato esperado por la app
  let results = (data.data || []).map(serie => ({
    id: `ikigai-${serie.slug}-${serie.id}`,
    slug: serie.slug,
    title: serie.name,
    cover: serie.cover || '',
    source: 'ikigai',
    // Datos adicionales útiles
    type: serie.type,
    status: serie.status,
    chapterCount: serie.chapter_count,
    genres: (serie.genres || []).map(g => g.name),
    description: serie.summary || serie.synopsis || '',
    author: serie.team?.name || ''
  }));

  // Filtrar por coincidencia exacta si el checkbox está marcado
  if (filters.exactMatch && query && query.trim()) {
    const normalizedQuery = normalizeTitle(query.trim());
    console.log('[Ikigai Search] Filtrando por coincidencia exacta:', normalizedQuery);

    results = results.filter(serie =>
      normalizeTitle(serie.title).toLowerCase() === normalizedQuery.toLowerCase()
    );

    console.log(`[Ikigai Search] ${results.length} resultados después de filtro exacto`);
  }

  // Si no hay resultados y checkbox marcado, enviar mensaje informativo
  if (results.length === 0 && filters.exactMatch && query && query.trim()) {
    console.log('[Ikigai Search] No se encontró coincidencia exacta');
    return res.status(200).json({
      results: [],
      message: 'No se encontró una obra con ese título exacto',
      page: 1,
      totalPages: 1,
      total: 0,
      hasMore: false
    });
  }

  console.log(`[Ikigai Search] ${results.length} resultados transformados`);

  return res.status(200).json({
    results,
    page: data.current_page,
    totalPages: data.last_page,
    total: data.total,
    hasMore: data.current_page < data.last_page
  });
}

/**
 * Construye la URL de la API con los filtros (reutilizado por API handler)
 *
 * Parámetros correctos de la API de Ikigai:
 * - page: número de página
 * - search: texto de búsqueda
 * - genres: ID de género (solo uno a la vez)
 * - type: tipo de contenido (comic/novel)
 * - status: estado de publicación
 * - order_by: ordenamiento
 */
function buildApiUrl(query, filters, page) {
  const baseUrl = 'https://panel.ikigaimangas.com/api/swf/series';
  const params = new URLSearchParams();

  params.append('page', page);

  // Query de búsqueda (Ikigai usa 'buscar')
  if (query) {
    params.append('buscar', query);
  }

  // Género (la API solo acepta un género a la vez)
  if (filters.genres && filters.genres.length > 0) {
    params.append('genres', filters.genres[0]);
  }

  // Tipo (comic, novel) - solo uno a la vez
  if (filters.types && filters.types.length > 0) {
    params.append('type', filters.types[0]);
  }

  // Estado - solo uno a la vez
  if (filters.statuses && filters.statuses.length > 0) {
    params.append('status', filters.statuses[0]);
  }

  // Ordenamiento
  if (filters.sortBy) {
    params.append('order_by', filters.sortBy);
  }

  // Habilitar contenido adulto en resultados
  params.append('nsfw', 'true');

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Normaliza un título para comparaciones (reutilizado por ambos handlers)
 * - Minúsculas
 * - Sin acentos
 * - Sin caracteres especiales
 * - Espacios normalizados
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^\w\s-]/g, '')  // Remove special chars (keep alphanumeric, space, hyphen)
    .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
    .trim();
}
