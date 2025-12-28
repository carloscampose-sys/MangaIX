import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] ESTRATEGIA DIRECTA: Construir URL y navegar');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ============================================');

  let browser = null;

  try {
    // Iniciar Puppeteer
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const puppeteerPage = await browser.newPage();

    await puppeteerPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // PASO 1: Establecer sesión
    console.log('[Ikigai Search] Estableciendo sesión...');
    await puppeteerPage.goto('https://viralikigai.foodib.net/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

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

    // PASO 3: Navegar a la URL
    console.log('[Ikigai Search] Navegando a URL...');
    await puppeteerPage.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // PASO 4: Esperar a que Qwik cargue (20 segundos)
    console.log('[Ikigai Search] Esperando carga de Qwik (20s)...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    // PASO 4.5: Verificar estado de la página
    const pageState = await puppeteerPage.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body ? document.body.textContent.length : 0,
        url: window.location.href,
        hasCloudflare: document.body ? (
          document.body.textContent.includes('Just a moment') ||
          document.body.textContent.includes('Un momento') ||
          document.body.textContent.includes('Checking your browser')
        ) : false,
        seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length,
        bodyPreview: document.body ? document.body.textContent.substring(0, 500) : ''
      };
    });
    
    console.log('[Ikigai Search] Estado de la página:', JSON.stringify(pageState, null, 2));
    
    // Si Cloudflare está bloqueando o no hay contenido, esperar más
    if (pageState.hasCloudflare || pageState.bodyLength < 10000 || pageState.seriesLinksCount < 5) {
      console.log('[Ikigai Search] ⚠️ Página no cargada, esperando 20s más...');
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      const pageState2 = await puppeteerPage.evaluate(() => {
        return {
          title: document.title,
          bodyLength: document.body ? document.body.textContent.length : 0,
          hasCloudflare: document.body ? (
            document.body.textContent.includes('Just a moment') ||
            document.body.textContent.includes('Un momento')
          ) : false,
          seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length
        };
      });
      
      console.log('[Ikigai Search] Estado después de espera adicional:', JSON.stringify(pageState2, null, 2));
      
      if (pageState2.hasCloudflare || pageState2.seriesLinksCount === 0) {
        console.log('[Ikigai Search] ❌ Página sigue sin cargar después de 40s');
        await browser.close();
        return res.status(200).json({
          results: [],
          page,
          hasMore: false,
          error: 'Cloudflare bloqueando o página no cargó',
          searchMethod: 'url-direct-failed'
        });
      }
    }

    // PASO 5: Scroll para lazy loading
    console.log('[Ikigai Search] Haciendo scroll...');
    for (let i = 0; i < 5; i++) {
      await puppeteerPage.evaluate((step) => {
        window.scrollTo(0, document.body.scrollHeight * step / 5);
      }, i + 1);
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      // Buscar enlaces de series con múltiples selectores
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
      
      console.log(`[Ikigai Evaluate] Total enlaces encontrados: ${allLinks.length}`);
      
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

      console.log(`[Ikigai Evaluate] Enlaces válidos: ${validLinks.length}`);

      const extractedResults = validLinks.map((link, index) => {
        const href = link.getAttribute('href');
        
        // Buscar título en múltiples lugares
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
      
      // Eliminar duplicados
      const uniqueResults = [];
      const seenSlugs = new Set();
      
      extractedResults.forEach(result => {
        if (!seenSlugs.has(result.slug)) {
          seenSlugs.add(result.slug);
          uniqueResults.push(result);
        }
      });

      console.log(`[Ikigai Evaluate] Resultados únicos: ${uniqueResults.length}`);
      
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
      searchMethod: 'url-direct'
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
