import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Espera a que se complete el challenge de Cloudflare
 */
async function waitForCloudflareChallenge(page, timeout = 25000) {
  try {
    await page.waitForFunction(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText : '';
      
      return !title.includes('Just a moment') &&
        !title.includes('Un momento') &&
        !bodyText.includes('Checking your browser') &&
        !bodyText.includes('Enable JavaScript and cookies to continue');
    }, { timeout: timeout / 2 });
    
    console.log('[Ikigai Search] ✓ Challenge de Cloudflare superado');
    
    await page.waitForFunction(() => {
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
      const bodyText = document.body ? document.body.innerText : '';
      return seriesLinks.length > 0 && bodyText.length > 1000;
    }, { timeout: timeout / 2 });
    
    console.log('[Ikigai Search] ✓ Contenido cargado');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return true;
  } catch (error) {
    console.error('[Ikigai Search] ❌ Challenge timeout:', error.message);
    
    const debugInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body ? document.body.innerText.length : 0,
        seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length,
        url: window.location.href
      };
    });
    console.log('[Ikigai Search] Estado de la página:', JSON.stringify(debugInfo, null, 2));
    
    if (debugInfo.seriesLinksCount > 0) {
      console.log('[Ikigai Search] ✓ Recuperado: hay enlaces de series');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }
    
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] BÚSQUEDA CON ANTI-CLOUDFLARE');
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

    // Iniciar Puppeteer con anti-detección
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920x1080',
        `--user-agent=${selectedUA}`
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const puppeteerPage = await browser.newPage();
    await puppeteerPage.setUserAgent(selectedUA);

    // Anti-detección
    await puppeteerPage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'es'] });
    });

    // Bloquear recursos innecesarios
    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'doubleclick', 'tracking', 'facebook', 'twitter'];
      const url = request.url().toLowerCase();

      if (blockedResources.some(resource => url.includes(resource))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // PASO 1: Establecer sesión navegando a la home
    console.log('[Ikigai Search] Estableciendo sesión...');
    try {
      await puppeteerPage.goto('https://viralikigai.foodib.net/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
    } catch (navError) {
      console.log('[Ikigai Search] Timeout en home, intentando domcontentloaded...');
      await puppeteerPage.goto('https://viralikigai.foodib.net/', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

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
        waitUntil: 'networkidle0',
        timeout: 45000
      });
    } catch (navError) {
      console.log('[Ikigai Search] Timeout en networkidle0, intentando domcontentloaded...');
      await puppeteerPage.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 35000
      });
    }

    // PASO 4: Esperar challenge de Cloudflare
    console.log('[Ikigai Search] Esperando challenge de Cloudflare...');
    const challengeSuccess = await waitForCloudflareChallenge(puppeteerPage, 25000);
    
    if (!challengeSuccess) {
      await browser.close();
      return res.status(200).json({
        results: [],
        page,
        hasMore: false,
        error: 'Cloudflare bloqueó la solicitud',
        searchMethod: 'cloudflare-blocked'
      });
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
      searchMethod: 'anti-cloudflare'
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
