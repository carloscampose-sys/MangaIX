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

    // 4. Navegar a la URL (timeout mayor para Qwik framework)
    await puppeteerPage.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 5. Esperar a que carguen los resultados
    // Ikigai usa estructura: ul > li > a[href*="/series/"]
    try {
      // Esperar más tiempo porque usa Qwik (framework reactivo)
      await puppeteerPage.waitForSelector('li a[href*="/series/"]', { timeout: 15000 });
      console.log('[Ikigai Search] Selector encontrado: li a[href*="/series/"]');
    } catch (e) {
      console.log('[Ikigai Search] No se encontraron resultados después de esperar');
      await browser.close();
      return res.status(200).json({ results: [], page, hasMore: false });
    }

    // 6. Extraer resultados
    // Estructura: <li><a href="/series/[slug]/"><img/><h3>Título</h3>...</a></li>
    const results = await puppeteerPage.evaluate(() => {
      // Buscar todos los items de lista que contienen links a series
      const items = document.querySelectorAll('li');

      return Array.from(items).map(item => {
        // Buscar el link a la serie
        const link = item.querySelector('a[href*="/series/"]');
        if (!link) return null;

        const href = link.href;
        // Extraer slug del href
        const slugMatch = href.match(/\/series\/([^\/]+)/);
        const slug = slugMatch ? slugMatch[1] : '';

        if (!slug) return null;

        // Encontrar imagen de portada
        const img = item.querySelector('img');
        const cover = img ? (img.src || img.dataset.src) : '';

        // Encontrar título (h3 dentro del link)
        const titleElement = item.querySelector('h3');
        const title = titleElement ? titleElement.textContent.trim() : '';

        // Solo retornar si tiene datos válidos
        if (!title && !cover) return null;

        return {
          id: `ikigai-${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          slug,
          title: title || slug.replace(/-/g, ' '),
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
