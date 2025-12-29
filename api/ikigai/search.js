/**
 * ================================================
 * IKIGAI SEARCH API - Endpoint de búsqueda
 * ================================================
 *
 * FECHA: 2025-12-28
 * CAMBIO: Implementado ScrapingBee Free para bypass Cloudflare
 *
 * ANTES: Usaba Puppeteer o Axios directo
 *        - Problema: Cloudflare bloqueaba IP de Vercel (datacenter)
 *        - Confiabilidad Axios directo: 0% (siempre bloqueaba)
 *        - Confiabilidad Puppeteer: 30-40%
 *
 * AHORA: Usa ScrapingBee Free (1000 req/mes)
 *        - Ventaja: ScrapingBee maneja proxies y bypass Cloudflare
 *        - Confiabilidad: ~95% de éxito
 *        - Velocidad: ~1-3s por búsqueda
 *
 * API Key de ScrapingBee: 1V32WF6IUBATGZ33GUYNIZ6VW8FT6MQS9BL0NMMYM9QQTZ0TW4ECK48X8EQE78FURLR9LR634GD9MKPI
 *
 * PARÁMETROS SOPORTADOS POR SCRAPINGBEE:
 * - api_key: Tu API key
 * - url: URL de Ikigai a scrapear
 * - render_js: false (no renderizar, API directa es suficiente)
 * - country_code: 'us' (IP de Estados Unidos)
 * - extract_rules: '' (no usar reglas de extracción, API devuelve JSON)
 *
 * ESTRUCTURA DE RESPUESTA DE SCRAPINGBEE:
 * {
 *   request_id: "ID de la petición",
 *   body: "HTML o JSON string (si render_js=true devuelve JSON)",
 *   remaining_requests: Requests restantes en el mes
 *   ...
 * }
 *
 * ARCHIVOS DE CONFIGURACIÓN:
 * - lib/ikigai/proxyConfig.js: IDs de géneros, tipos, estados
 *
 * VARIABLES DE ENTORNO (.env.local):
 * - SCRAPINGBEE_KEY: Tu API key de ScrapingBee
 */

import axios from 'axios';

// ========================================
// VERIFICACIÓN DE API KEY
// ========================================

const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_KEY;

/**
 * Verifica que la API key está configurada
 * @returns {boolean}
 */
<<<<<<< HEAD
function checkApiKey() {
  if (!SCRAPINGBEE_KEY) {
    console.error('[Ikigai Search] ❌ ERROR: SCRAPINGBEE_KEY no está configurada en variables de entorno');
    console.error('[Ikigai Search] ❌ Pasos para corregir:');
    console.error('[Ikigai Search]    1. Crear archivo .env.local con:');
    console.error('[Ikigai Search]       SCRAPINGBEE_KEY=1V32WF6IUBATGZ33GUYNIZ6VW8FT6MQS9BL0NMMYM9QQTZ0TW4ECK48X8EQE78FURLR9LR634GD9MKPI');
    console.error('[Ikigai Search]    2. En Vercel dashboard → Settings → Environment Variables');
    console.error('[Ikigai Search]    3. Agregar: SCRAPINGBEE_KEY = 1V32WF6IUBATGZ33GUYNIZ6VW8FT6MQS9BL0NMMYM9QQTZ0TW4ECK48X8EQE78FURLR9LR634GD9MKPI');
    console.error('[Ikigai Search]    4. Redeploy el proyecto');
    return false;
=======
async function waitForCloudflareChallenge(page, timeout = 60000) {
  try {
    console.log('[Ikigai Search] Esperando que desaparezca challenge...');

    // Paso 1: Esperar a que desaparezca el challenge
    await page.waitForFunction(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText : '';

      const isCloudflare = title.includes('500') ||
        title.includes('Just a moment') ||
        title.includes('Un momento') ||
        title.includes('Error') ||
        title.includes('Attention Required') ||
        bodyText.includes('Checking your browser') ||
        bodyText.includes('Verifying you are human') ||
        bodyText.includes('Enable JavaScript and cookies to continue') ||
        bodyText.includes('Ray ID') ||
        bodyText.includes('Performance & security by Cloudflare') ||
        bodyText.includes('Please wait while we verify your browser') ||
        bodyText.includes('Processing your request');

      return !isCloudflare;
    }, { timeout: timeout * 0.6 });

    console.log('[Ikigai Search] ✓ Challenge superado');

    // Paso 2: Esperar a que aparezcan enlaces de series
    console.log('[Ikigai Search] Esperando contenido...');
    await page.waitForFunction(() => {
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
      const bodyText = document.body ? document.body.innerText : '';
      return seriesLinks.length > 5 && bodyText.length > 1000;
    }, { timeout: timeout * 0.4 });

    console.log('[Ikigai Search] ✓ Contenido cargado');

    // Espera adicional para Qwik
    await new Promise(resolve => setTimeout(resolve, 3000));

    return true;
  } catch (error) {
    console.error('[Ikigai Search] ❌ Timeout esperando contenido:', error.message);

    const debugInfo = await page.evaluate(() => {
      const bodyText = document.body ? document.body.innerText : '';
      return {
        title: document.title,
        bodyLength: document.body ? document.body.innerText.length : 0,
        seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length,
        allLinksCount: document.querySelectorAll('a').length,
        url: window.location.href,
        bodyPreview: bodyText.substring(0, 400),
        hasCloudflareText: (
          bodyText.includes('Just a moment') ||
          bodyText.includes('Checking your browser') ||
          bodyText.includes('Ray ID') ||
          bodyText.includes('Performance & security by Cloudflare') ||
          bodyText.includes('Please wait while we verify your browser') ||
          bodyText.includes('Processing your request')
        )
      };
    });
    console.log('[Ikigai Search] Estado de la página:', JSON.stringify(debugInfo, null, 2));

    // Si hay enlaces de series, considerar exitoso
    if (debugInfo.seriesLinksCount > 5) {
      console.log('[Ikigai Search] ✓ Recuperado: hay suficientes enlaces');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return true;
    }

    // Si hay pocos enlaces pero algo de contenido
    if (debugInfo.seriesLinksCount > 0 && debugInfo.bodyLength > 500) {
      console.log('[Ikigai Search] ⚠️ Pocos enlaces pero hay contenido, continuando...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return true;
    }

    // Si definitivamente está bloqueado
    if (debugInfo.hasCloudflareText || debugInfo.bodyLength < 300) {
      console.error('[Ikigai Search] ❌ Cloudflare sigue bloqueando');
      return false;
    }

    // Último intento: esperar más
    console.warn('[Ikigai Search] ⚠️ Esperando 8s adicionales...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    const finalCheck = await page.evaluate(() => ({
      seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length
    }));

    return finalCheck.seriesLinksCount > 0;
>>>>>>> parent of 5644b2e (aea)
  }
  console.log('[Ikigai Search] ✅ API Key configurada correctamente');
  return true;
}

// ========================================
// HANDLER PRINCIPAL
// ========================================

/**
 * Busca series en Ikigai usando ScrapingBee Free
 *
 * @param {object} req - Request de Vercel
 * @param {object} res - Response de Vercel
 * @returns {Promise<void>}
 */
<<<<<<< HEAD
=======
async function attemptScraping(query, filters, page, attempt) {
  const puppeteerPage = await browser.newPage();

  try {
    // Anti-detección completa
    await puppeteerPage.evaluateOnNewDocument(() => {
      // Ocultar webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });

      // Simular Chrome real
      window.navigator.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };

      // Plugins realistas
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
        ]
      });

      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'es']
      });

      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // WebGL vendor
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };
    });

    // Bloquear SOLAMENTE publicidad y analytics (dejar images, stylesheets, fonts para stealth)
    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const url = request.url().toLowerCase();

      // Bloquear solamente publicidad y analytics
      if (url.includes('ads') ||
          url.includes('analytics') ||
          url.includes('tracking') ||
          url.includes('juicyads') ||
          url.includes('exoclick') ||
          url.includes('pubadx') ||
          url.includes('facebook.com/tr') ||
          url.includes('google-analytics')) {
        request.abort();
      } else {
        request.continue();  // Permitir todo lo demás para mejor detección
      }
    });

    // PASO 1: Establecer sesión navegando a home primero
    console.log('[Ikigai Search] Estableciendo sesión en home...');
    try {
      await puppeteerPage.goto('https://viralikigai.foodib.net/', {
        waitUntil: 'networkidle2',  // Esperar a que la red esté inactiva (más robusto)
        timeout: 45000  // Aumentado de 30s a 45s
      });
      console.log('[Ikigai Search] Home cargada');
    } catch (navError) {
      console.log('[Ikigai Search] Error en home:', navError.message);
    }

    // Esperar más tiempo para que Cloudflare nos "conozca" (aumentado de 12s a 20s)
    console.log('[Ikigai Search] Esperando establecer sesión (20s)...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    // PASO 2: Construir URL con parámetros
    const baseUrl = 'https://viralikigai.foodib.net/series/';
    const urlParams = new URLSearchParams();

    if (query && query.trim()) {
      urlParams.append('buscar', query);
    }

    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach(genreId => {
        urlParams.append('generos[]', genreId);
      });
    }

    if (filters.types && filters.types.length > 0) {
      filters.types.forEach(typeId => {
        urlParams.append('tipos[]', typeId);
      });
    }

    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(statusId => {
        urlParams.append('estados[]', statusId);
      });
    }

    if (filters.sortBy) {
      urlParams.append('ordenar', filters.sortBy);
    }

    if (page > 1) {
      urlParams.append('pagina', page.toString());
    }

    const queryString = urlParams.toString();
    const targetUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    console.log(`[Ikigai Search] URL construida: ${targetUrl}`);

    // PASO 3: Navegar a la URL con filtros
    console.log('[Ikigai Search] Navegando a URL con filtros...');
    console.log('[Ikigai Search] URL:', targetUrl);

    try {
      await puppeteerPage.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
      console.log('[Ikigai Search] Navegación completada');
    } catch (navError) {
      console.log('[Ikigai Search] Error navegando:', navError.message);
    }

    // PASO 4: Esperar challenge de Cloudflare con timeout muy generoso
    console.log('[Ikigai Search] Esperando challenge de Cloudflare (60s timeout)...');
    const challengeSuccess = await waitForCloudflareChallenge(puppeteerPage, 60000);  // Aumentado de 35s a 60s

    if (!challengeSuccess) {
      // Último intento: verificar si realmente está bloqueado o solo lento
      console.log('[Ikigai Search] Challenge falló, verificando estado real...');

      const finalCheck = await puppeteerPage.evaluate(() => {
        const bodyText = document.body ? document.body.innerText : '';
        return {
          title: document.title,
          bodyLength: document.body ? document.body.innerText.length : 0,
          seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length,
          hasCloudflareText: (
            bodyText.includes('Just a moment') ||
            bodyText.includes('Checking your browser') ||
            bodyText.includes('Ray ID') ||
            bodyText.includes('Performance & security by Cloudflare') ||
            bodyText.includes('Please wait while we verify your browser')
          )
        };
      });

      console.log('[Ikigai Search] Verificación final:', JSON.stringify(finalCheck, null, 2));

      // Si definitivamente está bloqueado por Cloudflare
      if (finalCheck.hasCloudflareText || finalCheck.bodyLength < 300) {
        return { success: false, blockedByCloudflare: true };
      }

      // Si hay algo de contenido, intentar extraer de todos modos
      if (finalCheck.seriesLinksCount > 0) {
        console.log('[Ikigai Search] Hay algunos enlaces, continuando extracción...');
      } else {
        return { success: false, noContent: true };
      }
    }

    // PASO 5: Scroll para lazy loading
    console.log('[Ikigai Search] Activando lazy loading...');
    for (let i = 0; i < 5; i++) {
      await puppeteerPage.evaluate((step) => {
        window.scrollTo(0, document.body.scrollHeight * step / 5);
      }, i + 1);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // PASO 6: Buscar paginación
    const paginationInfo = await puppeteerPage.evaluate((currentPage) => {
      const paginationLinks = document.querySelectorAll('a[href*="pagina="]');
      let nextPageExists = false;
      let maxPageFound = currentPage;

      paginationLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const pageMatch = href.match(/pagina=(\d+)/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1]);
          if (pageNum > maxPageFound) {
            maxPageFound = pageNum;
          }
          if (pageNum > currentPage) {
            nextPageExists = true;
          }
        }
      });

      return { nextPageExists, maxPageFound, currentPage };
    }, page);

    console.log('[Ikigai Search] Paginación:', paginationInfo);

    // PASO 7: Extraer resultados
    console.log('[Ikigai Search] Extrayendo resultados...');
    const results = await puppeteerPage.evaluate(() => {
      const selectors = [
        'a[href*="/series/"]',
        'a[href*="/serie/"]',
        '[href*="/series/"]'
      ];

      let allLinks = [];
      for (const selector of selectors) {
        const links = document.querySelectorAll(selector);
        allLinks.push(...Array.from(links));
      }

      const validLinks = Array.from(allLinks).filter(link => {
        const href = link.getAttribute('href');
        if (!href || href === '/series/' || href === '/series') return false;

        const excludePatterns = ['/clasificacion', '/lists/', '/grupos/', '/generos/', '/tags/'];
        if (excludePatterns.some(pattern => href.includes(pattern))) return false;

        const hasImage = link.querySelector('img') !== null;
        const hasTitle = link.querySelector('h3, h2, h1, .title, [class*="title"]') !== null;
        const hasText = link.textContent && link.textContent.trim().length > 2;

        return (hasImage || hasTitle || hasText) && href.split('/series/')[1]?.length > 1;
      });

      const extractedResults = validLinks.map((link, index) => {
        const href = link.getAttribute('href');

        let title = '';
        const titleSelectors = ['h3', 'h2', 'h1', '.title', '[class*="title"]', 'span', 'div'];
        for (const selector of titleSelectors) {
          const titleEl = link.querySelector(selector);
          if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 1) {
            title = titleEl.textContent.trim();
            break;
          }
        }

        if (!title) {
          title = link.getAttribute('title') || link.getAttribute('alt') || '';
        }

        const imgElement = link.querySelector('img');
        const cover = imgElement?.src || imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src') || '';

        let slug = '';
        if (href.includes('/series/')) {
          const slugPart = href.split('/series/')[1];
          slug = slugPart?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        }

        if (!slug) return null;

        const finalTitle = title || slug.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        return {
          id: `ikigai-${slug}-${Date.now()}-${index}`,
          slug,
          title: finalTitle,
          cover,
          source: 'ikigai'
        };
      }).filter(item => item !== null);

      const uniqueResults = [];
      const seenSlugs = new Set();

      extractedResults.forEach(result => {
        if (!seenSlugs.has(result.slug)) {
          seenSlugs.add(result.slug);
          uniqueResults.push(result);
        }
      });

      return uniqueResults;
    });

    return { success: true, results, paginationInfo };

  } catch (error) {
    console.error('[Ikigai Search] Error en intento:', error.message);
    return { success: false, error };
  }
}

>>>>>>> parent of 5644b2e (aea)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar API key
  if (!checkApiKey()) {
    return res.status(500).json({
      error: 'SCRAPINGBEE_KEY no está configurada en variables de entorno',
      solution: 'Configurar SCRAPINGBEE_KEY en .env.local o en Vercel Environment Variables'
    });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] BÚSQUEDA CON SCRAPINGBEE FREE');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ============================================');

  try {
    // Construir URL de Ikigai
    const baseUrl = 'https://panel.ikigaimangas.com/api/swf/series';
    const params = new URLSearchParams();

<<<<<<< HEAD
    // Siempre incluir nsfw=true
    params.append('nsfw', 'true');

    // Página
    params.append('page', page.toString());
=======
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Ikigai Search] Intento ${attempt}/${maxRetries}...`);
>>>>>>> parent of 5644b2e (aea)

    // Búsqueda por texto (opcional)
    if (query && query.trim()) {
      params.append('search', query.trim());
    }

<<<<<<< HEAD
    // Filtros de género (múltiples géneros pueden enviarse)
    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach(genreId => {
        params.append('genre', genreId);
=======
      // Iniciar Puppeteer con configuración mejorada
      console.log('[Ikigai Search] Iniciando browser con configuración anti-detección...');
      const browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
          `--user-agent=${selectedUA}`
        ],
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
        defaultViewport: { width: 1920, height: 1080 }
>>>>>>> parent of 5644b2e (aea)
      });
    }

<<<<<<< HEAD
    // Filtros de tipo (comic/novel)
    if (filters.types && filters.types.length > 0) {
      filters.types.forEach(typeId => {
        params.append('type', typeId);
      });
    }

    // Filtros de estado (múltiples estados pueden enviarse)
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(statusId => {
        params.append('status', statusId);
      });
    }
=======
      // Intentar scraping
      const result = await attemptScraping(query, filters, page, attempt);

      // Cerrar browser siempre
      await browser.close();
>>>>>>> parent of 5644b2e (aea)

    // Ordenamiento (opcional)
    if (filters.sortBy) {
      params.append('order', filters.sortBy);
    }

    const targetUrl = `${baseUrl}?${params.toString()}`;
    console.log('[Ikigai Search] URL target:', targetUrl);

    // Hacer petición a través de ScrapingBee
    // IMPORTANTE: ScrapingBee espera los parámetros en la query string, NO en el body
    const scrapingbeeUrl = new URL('https://app.scrapingbee.com/api/v1/');
    scrapingbeeUrl.searchParams.append('api_key', SCRAPINGBEE_KEY);
    scrapingbeeUrl.searchParams.append('url', targetUrl);
    scrapingbeeUrl.searchParams.append('render_js', 'false');  // NO renderizar JS, la API directa es suficiente
    scrapingbeeUrl.searchParams.append('country_code', 'us');  // IP de Estados Unidos

    console.log('[Ikigai Search] ScrapingBee URL:', scrapingbeeUrl.toString());

    const response = await axios.get(scrapingbeeUrl.toString(), {
      timeout: 30000,  // 30 segundos de timeout
      headers: {
        'Accept': 'application/json'
      },
      responseType: 'text'  // Importante: recibir como texto primero
    });

    console.log('[Ikigai Search] Response status:', response.status);
    console.log('[Ikigai Search] Response data type:', typeof response.data);
    console.log('[Ikigai Search] Response data is null:', response.data === null);
    console.log('[Ikigai Search] Response data is undefined:', response.data === undefined);
    console.log('[Ikigai Search] Response data length:', response.data?.length || 0);

    // Con GET, la respuesta es el contenido directamente de la URL target
    const responseBody = typeof response.data === 'string' ? response.data : '';

    console.log('[Ikigai Search] Longitud del body:', responseBody.length);

    // ========================================
    // PARSEAR RESPUESTA DE SCRAPINGBEE
    // ========================================

    let parsedData;

<<<<<<< HEAD
    // Intentar parsear como JSON primero
    try {
      parsedData = JSON.parse(responseBody);
      console.log('[Ikigai Search] ✅ JSON parseado correctamente');
      console.log('[Ikigai Search] Total:', parsedData.total);
      console.log('[Ikigai Search] Items en página:', parsedData.data?.length || 0);
    } catch (parseError) {
      console.error('[Ikigai Search] ❌ Error parseando JSON:', parseError.message);
=======
      // Asegurar cerrar browser si existe
      try {
        if (browser) {
          await browser.close();
        }
      } catch (e) {
        console.error('[Ikigai Search] Error cerrando browser:', e);
      }
>>>>>>> parent of 5644b2e (aea)

      // Si no es JSON, verificar si es HTML de Cloudflare
      if (responseBody.includes('Just a moment') ||
          responseBody.includes('Checking your browser') ||
          responseBody.includes('Cloudflare') ||
          responseBody.includes('Enable JavaScript')) {
        console.error('[Ikigai Search] ❌ Cloudflare está bloqueando incluso con ScrapingBee');
        return res.status(503).json({
          error: 'Cloudflare está bloqueando Ikigai incluso con ScrapingBee',
          details: 'El endpoint de Ikigai está muy protegido. Considerar:',
          options: [
            '1. Usar proxies residenciales (plan pago de ScrapingBee)',
            '2. Esperar y reintentar más tarde (Cloudflare puede bajar la protección temporalmente)',
            '3. Desactivar Ikigai temporalmente hasta encontrar una solución mejor'
          ],
          bodyPreview: responseBody.substring(0, 500) + '...'
        });
      }

      return res.status(500).json({
        error: 'No se pudo parsear la respuesta de Ikigai',
        bodyPreview: responseBody.substring(0, 500) + '...',
        parseError: parseError.message
      });
    }
<<<<<<< HEAD

    // ========================================
    // MAPEAR RESULTADOS AL FORMATO ESPERADO
    // ========================================

    // El frontend espera objetos con: id, slug, title, cover, source, etc.
    const results = (parsedData.data || []).map((item) => {
      const result = {
        id: `ikigai-${item.id}`,           // ID único para el frontend
        slug: item.slug,                      // Slug para URL de la obra
        title: item.name,                     // Nombre de la obra
        cover: item.cover || item.cover_path || '',  // URL de la imagen
        source: 'ikigai',                    // Fuente de datos
        type: item.type,                       // comic | novel
        status: item.status?.name || '',        // Estado de publicación
        genres: (item.genres || []).map(g => g.name || g.slug),  // Array de géneros
        chapterCount: item.chapter_count,       // Número total de capítulos
        isMature: item.is_mature,           // Contenido adulto
        team: item.team?.name || '',          // Scanlation team
        ranking: item.ranking                  // Ranking (si existe)
      };

      // Usar la mejor calidad de imagen disponible
      // La API devuelve un srcset con diferentes tamaños
      if (item.cover_srcset) {
        const srcsetParts = item.cover_srcset.split(', ');
        // srcset tiene formato: "url1 768w, url2 1536w"
        if (srcsetParts.length > 1) {
          result.cover = srcsetParts[1].split(' ')[0]; // Tomar la más grande (1536w)
        } else {
          result.cover = srcsetParts[0].split(' ')[0];
        }
      }

      return result;
    });

    console.log('[Ikigai Search] ✅ Éxito');
    console.log('[Ikigai Search] ✅ Resultados transformados:', results.length);

    if (results.length > 0) {
      console.log('[Ikigai Search] Primeros 3 resultados:');
      results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. "${r.title}" (${r.slug})`);
      });
    }

    // ========================================
    // RETORNAR RESPUESTA CON ESTRUCTURA ESPERADA POR EL FRONTEND
    // ========================================

    return res.status(200).json({
      results,                              // Array de resultados
      page: parsedData.current_page || page,       // Página actual
      hasMore: !!parsedData.next_page_url,        // Hay más páginas
      total: parsedData.total,                    // Total de resultados
      lastPage: parsedData.last_page,             // Última página
      searchMethod: 'scrapingbee-free'        // Método usado (para debugging)
    });

  } catch (error) {
    console.error('[Ikigai Search] ❌ Error:', error.message);

    // ========================================
    // MANEJO DE ERRORES
    // ========================================

    // Error de respuesta de ScrapingBee
    if (error.response) {
      console.error('[Ikigai Search] Status:', error.response.status);
      console.error('[Ikigai Search] Data:', JSON.stringify(error.response.data, null, 2));

      // Manejar errores específicos de ScrapingBee
      if (error.response.status === 401) {
        return res.status(401).json({
          error: 'API Key de ScrapingBee inválida o no autorizada',
          details: 'Verifica que la variable SCRAPINGBEE_KEY está correcta en Vercel Environment Variables'
        });
      }

      if (error.response.status === 402) {
        return res.status(402).json({
          error: 'Requests de ScrapingBee agotadas',
          details: 'El plan gratuito tiene 1000 requests/mes. Si se agotaron, espera el próximo mes o actualiza a un plan de pago.'
        });
      }

      if (error.response.status === 429) {
        return res.status(429).json({
          error: 'Límite de velocidad de ScrapingBee excedido',
          details: 'Demasiadas requests muy rápido. Reduce la velocidad o agrega un delay entre requests.'
        });
      }

      return res.status(error.response.status).json({
        error: 'Error en la API de ScrapingBee',
        status: error.response.status,
        details: error.response.data
      });
    }

    // Error de conexión (no se recibió respuesta)
    if (error.request) {
      console.error('[Ikigai Search] No response recibida de ScrapingBee');
      return res.status(503).json({
        error: 'No se pudo conectar con ScrapingBee',
        details: error.message
      });
    }

    // Otros errores
    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
=======
>>>>>>> parent of 5644b2e (aea)
  }
}
