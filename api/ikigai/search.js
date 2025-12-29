import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  let browser = null;

  try {
    // 1. Construir URL con filtros
    const searchUrl = buildSearchUrl(query, filters, page);

    console.log('[Ikigai Search] URL:', searchUrl);

    // 2. Iniciar Puppeteer
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

    // 3. Bloquear ads y recursos innecesarios
    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'facebook', 'google-analytics', 'doubleclick', 'tracking'];
      const url = request.url().toLowerCase();

      if (blockedResources.some(resource => url.includes(resource))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // 4. Navegar a la URL
    await puppeteerPage.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 8000
    });

    // 5. Esperar a que carguen los resultados (probar múltiples selectores)
    const possibleSelectors = [
      '.resultado-obra',
      '.series-card',
      '.obra-card',
      'a[href*="/series/"]',
      '.card'
    ];

    let resultsFound = false;
    for (const selector of possibleSelectors) {
      try {
        await puppeteerPage.waitForSelector(selector, { timeout: 3000 });
        resultsFound = true;
        console.log(`[Ikigai Search] Selector encontrado: ${selector}`);
        break;
      } catch (e) {
        // Selector no válido, continuar
      }
    }

    if (!resultsFound) {
      console.log('[Ikigai Search] No se encontraron resultados');
      await browser.close();
      return res.status(200).json({ results: [], page, hasMore: false });
    }

    // 6. Extraer resultados
    const results = await puppeteerPage.evaluate(() => {
      // Intentar múltiples selectores para resultados
      const selectors = [
        '.resultado-obra',
        '.series-card',
        '.obra-card',
        'article'
      ];

      let items = [];
      for (const selector of selectors) {
        items = document.querySelectorAll(selector);
        if (items.length > 0) break;
      }

      return Array.from(items).map(item => {
        // Encontrar link
        const link = item.querySelector('a[href*="/series/"]');
        if (!link) return null;

        const href = link.href;
        const slugMatch = href.match(/\/series\/([^\/]+)/);
        const slug = slugMatch ? slugMatch[1] : '';

        // Encontrar imagen de portada
        const img = item.querySelector('img');
        const cover = img ? img.src : '';

        // Encontrar título
        const titleElement = item.querySelector('.title, .titulo, h2, h3');
        const title = titleElement ? titleElement.textContent.trim() : '';

        return {
          id: `ikigai-${slug}-${Date.now()}`,
          slug,
          title,
          cover,
          source: 'ikigai'
        };
      }).filter(Boolean); // Filtrar nulls
    });

    console.log(`[Ikigai Search] ${results.length} resultados encontrados`);

    await browser.close();

    return res.status(200).json({
      results,
      page,
      hasMore: results.length > 0
    });

  } catch (error) {
    console.error('[Ikigai Search] Error:', error);

    if (browser) await browser.close();

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

  // Query de búsqueda (si existe)
  if (query) {
    params.append('buscar', query);
  }

  // Tipos
  if (filters.types && filters.types.length) {
    filters.types.forEach(type => params.append('tipos[]', type));
  }

  // Estados
  if (filters.statuses && filters.statuses.length) {
    filters.statuses.forEach(status => params.append('estados[]', status));
  }

  // Géneros
  if (filters.genres && filters.genres.length) {
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

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
