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
    const results = await puppeteerPage.evaluate(() => {
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
      
      const validLinks = Array.from(seriesLinks).filter(link => {
        const href = link.getAttribute('href');
        if (!href || href === '/series/' || href === '/series') return false;
        
        const excludePatterns = ['/clasificacion', '/lists/', '/grupos/'];
        if (excludePatterns.some(pattern => href.includes(pattern))) return false;
        
        const hasImage = link.querySelector('img') !== null;
        const hasTitle = link.querySelector('h3, h2, h1') !== null;
        
        return (hasImage || hasTitle) && href.split('/series/')[1]?.length > 1;
      });

      return validLinks.map((link, index) => {
        const href = link.getAttribute('href');
        
        const titleElement = link.querySelector('h3') || link.querySelector('h2') || link.querySelector('h1');
        const title = titleElement?.textContent?.trim() || link.getAttribute('title') || '';
        
        const imgElement = link.querySelector('img');
        const cover = imgElement?.src || imgElement?.getAttribute('src') || '';
        
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
    });

    await browser.close();

    console.log(`[Ikigai Search] ✅ ${results.length} resultados encontrados`);

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
