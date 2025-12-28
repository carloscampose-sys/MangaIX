import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';

// Activar plugin stealth para evadir detección de Cloudflare
puppeteer.use(StealthPlugin());

/**
 * Espera a que se complete el challenge de Cloudflare
 */
async function waitForCloudflareChallenge(page, timeout = 30000) {
  try {
    // Paso 1: Esperar a que desaparezca el challenge
    await page.waitForFunction(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText : '';
      
      return !title.includes('500') &&
        !title.includes('Just a moment') &&
        !title.includes('Un momento') &&
        !title.includes('Error') &&
        !bodyText.includes('Checking your browser') &&
        !bodyText.includes('Verifying you are human') &&
        !bodyText.includes('Enable JavaScript and cookies to continue');
    }, { timeout: timeout / 2 });
    
    console.log('[Ikigai Search] ✓ Challenge de Cloudflare superado');
    
    // Paso 2: Esperar a que aparezcan enlaces de series
    await page.waitForFunction(() => {
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
      const bodyText = document.body ? document.body.innerText : '';
      return seriesLinks.length > 5 && bodyText.length > 1000;
    }, { timeout: timeout / 2 });
    
    console.log('[Ikigai Search] ✓ Contenido cargado');
    
    // Espera adicional para Qwik
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return true;
  } catch (error) {
    console.error('[Ikigai Search] ❌ Challenge timeout:', error.message);
    
    const debugInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body ? document.body.innerText.length : 0,
        seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length,
        allLinksCount: document.querySelectorAll('a').length,
        url: window.location.href,
        bodyPreview: document.body ? document.body.innerText.substring(0, 300) : ''
      };
    });
    console.log('[Ikigai Search] Estado de la página:', JSON.stringify(debugInfo, null, 2));
    
    // Si hay enlaces de series, considerar exitoso
    if (debugInfo.seriesLinksCount > 5) {
      console.log('[Ikigai Search] ✓ Recuperado: hay enlaces de series');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return true;
    }
    
    // Si hay muy poco contenido, Cloudflare sigue bloqueando
    if (debugInfo.bodyLength < 500) {
      console.error('[Ikigai Search] ❌ Página bloqueada por Cloudflare');
      return false;
    }
    
    // Si hay contenido pero pocos enlaces, esperar más
    console.warn('[Ikigai Search] ⚠️ Contenido cargado pero pocos enlaces, esperando más...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return true;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] BÚSQUEDA CON PUPPETEER-EXTRA-STEALTH');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ============================================');

  let browser = null;

  try {
    // User agents rotativos
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ];
    const selectedUA = userAgents[page % userAgents.length];

    // Iniciar Puppeteer con stealth plugin
    console.log('[Ikigai Search] Iniciando browser con stealth plugin...');
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920x1080'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const puppeteerPage = await browser.newPage();
    
    // Configurar viewport y user agent
    await puppeteerPage.setViewport({ width: 1920, height: 1080 });
    await puppeteerPage.setUserAgent(selectedUA);

    // Bloquear recursos innecesarios para mejorar velocidad
    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const blockedResources = ['image', 'stylesheet', 'font', 'media'];
      const blockedDomains = ['ads', 'analytics', 'doubleclick', 'tracking', 'facebook', 'twitter'];
      const url = request.url().toLowerCase();

      if (blockedResources.includes(request.resourceType()) || 
          blockedDomains.some(domain => url.includes(domain))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // PASO 1: Establecer sesión navegando a /series/ primero (sin filtros)
    console.log('[Ikigai Search] Estableciendo sesión en /series/...');
    try {
      await puppeteerPage.goto('https://viralikigai.foodib.net/series/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (navError) {
      console.log('[Ikigai Search] Error en navegación inicial:', navError.message);
    }
    
    // Esperar a que pase el challenge de Cloudflare en la primera carga
    console.log('[Ikigai Search] Esperando challenge inicial (stealth activo)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

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
    try {
      await puppeteerPage.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
    } catch (navError) {
      console.log('[Ikigai Search] Error navegando con filtros:', navError.message);
    }

    // PASO 4: Esperar challenge de Cloudflare con timeout extendido
    console.log('[Ikigai Search] Esperando challenge de Cloudflare...');
    const challengeSuccess = await waitForCloudflareChallenge(puppeteerPage, 30000);
    
    if (!challengeSuccess) {
      // Último intento: verificar si realmente está bloqueado o solo lento
      console.log('[Ikigai Search] Challenge falló, verificando estado real...');
      
      const finalCheck = await puppeteerPage.evaluate(() => {
        return {
          title: document.title,
          bodyLength: document.body ? document.body.innerText.length : 0,
          seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length,
          hasCloudflareText: document.body ? (
            document.body.innerText.includes('Just a moment') ||
            document.body.innerText.includes('Checking your browser') ||
            document.body.innerText.includes('Enable JavaScript')
          ) : false
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
      searchMethod: 'puppeteer-extra-stealth'
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
