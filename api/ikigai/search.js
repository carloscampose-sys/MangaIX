import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  let browser = null;

  try {
    // Construir URL con filtros
    const searchUrl = buildSearchUrl(query, filters, page);

    console.log('[Ikigai Search] URL:', searchUrl);
    console.log('[Ikigai Search] Filters:', JSON.stringify(filters));

    // Iniciar Puppeteer
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const puppeteerPage = await browser.newPage();

    // Bloquear ads y recursos innecesarios
    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const blockedResources = [
        'ads',
        'analytics',
        'facebook',
        'google-analytics',
        'doubleclick',
        'tracking'
      ];
      const url = request.url().toLowerCase();

      if (blockedResources.some(resource => url.includes(resource))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navegar a la URL
    await puppeteerPage.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Esperar a que carguen los resultados
    // Intentar múltiples selectores posibles
    const possibleSelectors = [
      '.element',
      '.manga-item',
      '.serie-item',
      'article',
      '.grid > div',
      '.series-grid > div'
    ];

    let selectorUsed = null;
    for (const selector of possibleSelectors) {
      try {
        await puppeteerPage.waitForSelector(selector, { timeout: 5000 });
        selectorUsed = selector;
        console.log(`[Ikigai Search] Selector encontrado: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!selectorUsed) {
      console.warn('[Ikigai Search] No se encontraron resultados con selectores conocidos');
      await browser.close();
      return res.status(200).json({
        results: [],
        page,
        hasMore: false
      });
    }

    // Extraer resultados
    const results = await puppeteerPage.evaluate((selector) => {
      const items = document.querySelectorAll(selector);

      return Array.from(items).map(item => {
        // Intentar múltiples formas de extraer datos
        const link = item.querySelector('a');
        const titleElement = item.querySelector('h3, h2, .title, .serie-title, .manga-title');
        const imgElement = item.querySelector('img');

        const href = link?.href || '';
        const title = titleElement?.textContent?.trim() ||
                     item.querySelector('a')?.title ||
                     '';
        const cover = imgElement?.src || imgElement?.dataset?.src || '';

        // Extraer slug de la URL
        let slug = '';
        if (href.includes('/series/')) {
          slug = href.split('/series/')[1]?.replace(/\/$/, '');
        }

        // Solo retornar si tenemos datos mínimos válidos
        if (!slug || !title) {
          return null;
        }

        return {
          id: `ikigai-${slug}-${Date.now()}`,
          slug,
          title,
          cover,
          source: 'ikigai'
        };
      }).filter(item => item !== null);
    }, selectorUsed);

    await browser.close();

    console.log(`[Ikigai Search] ${results.length} resultados encontrados`);

    return res.status(200).json({
      results,
      page,
      hasMore: results.length > 0
    });

  } catch (error) {
    console.error('[Ikigai Search] Error:', error);

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

// Función helper para construir URL
function buildSearchUrl(query, filters, page) {
  const baseUrl = 'https://viralikigai.eurofiyati.online/series/';
  const params = new URLSearchParams();

  // Tipos
  if (filters.types?.length) {
    filters.types.forEach(type => params.append('tipos[]', type));
  }

  // Estados
  if (filters.statuses?.length) {
    filters.statuses.forEach(status => params.append('estados[]', status));
  }

  // Géneros
  if (filters.genres?.length) {
    filters.genres.forEach(genre => params.append('generos[]', genre));
  }

  // Ordenar
  if (filters.sortBy) {
    params.append('ordenar', filters.sortBy);
  }

  // Página
  if (page > 1) {
    params.append('pagina', page);
  }

  // Query de búsqueda (si existe)
  if (query && query.trim()) {
    params.append('buscar', query.trim());
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
