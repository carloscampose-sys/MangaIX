import puppeteer from 'puppeteer-extra';
import chromium from '@sparticuz/chromium';

/**
 * Espera a que se complete el challenge de Cloudflare
 */
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
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] BÚSQUEDA CON ANTI-DETECCIÓN MEJORADO (puppeteer-extra)');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ============================================');

  let browser = null;

  try {
    // User agents rotativos más realistas
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ];
    const selectedUA = userAgents[page % userAgents.length];

    // Iniciar Puppeteer con plugin stealth activado
    console.log('[Ikigai Search] Iniciando browser con stealth plugin...');
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        // Nota: El plugin stealth maneja automáticamente --disable-blink-features=AutomationControlled
        // Removido --disable-web-security porque puede causar detección
        // Removido --disable-features=IsolateOrigins,site-per-process para mejor compatibilidad
        '--window-size=1920,1080',
        `--user-agent=${selectedUA}`
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      defaultViewport: { width: 1920, height: 1080 }
    });

    const puppeteerPage = await browser.newPage();

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
        await browser.close();
        return res.status(200).json({
          results: [],
          page,
          hasMore: false,
          error: 'Cloudflare bloqueó la solicitud. La búsqueda por filtros en Ikigai está temporalmente no disponible.',
          searchMethod: 'cloudflare-blocked'
        });
      }
      
      // Si hay algo de contenido, intentar extraer de todos modos
      if (finalCheck.seriesLinksCount > 0) {
        console.log('[Ikigai Search] Hay algunos enlaces, continuando extracción...');
      } else {
        await browser.close();
        return res.status(200).json({
          results: [],
          page,
          hasMore: false,
          error: 'No se pudieron cargar los resultados',
          searchMethod: 'timeout'
        });
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

    await browser.close();

    console.log(`[Ikigai Search] ✅ ${results.length} resultados encontrados`);
    
    if (results.length > 0) {
      console.log('[Ikigai Search] Primeros 3 resultados:');
      results.slice(0, 3).forEach((result, i) => {
        console.log(`  ${i + 1}. "${result.title}" (${result.slug})`);
      });
    }

    return res.status(200).json({
      results,
      page,
      hasMore: paginationInfo.nextPageExists,
      searchMethod: 'manual-stealth-max'
    });

  } catch (error) {
    console.error('[Ikigai Search] ❌ Error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[Ikigai Search] Error cerrando browser:', e);
      }
    }

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}
