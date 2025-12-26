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

    // Esperar a que cargue el contenido
    // La página usa Qwik framework, esperar a que se renderice
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Intentar esperar por el grid o por los enlaces de series
    try {
      await puppeteerPage.waitForSelector('a[href*="/series/"]', { timeout: 5000 });
      console.log('[Ikigai Search] Enlaces de series encontrados');
    } catch (e) {
      console.warn('[Ikigai Search] No se encontraron enlaces de series');
      await browser.close();
      return res.status(200).json({
        results: [],
        page,
        hasMore: false
      });
    }

    // Extraer resultados
    const results = await puppeteerPage.evaluate(() => {
      // Buscar todos los enlaces que apuntan a /series/
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');

      // Filtrar solo los enlaces principales (no los de navegación)
      const validLinks = Array.from(seriesLinks).filter(link => {
        const href = link.getAttribute('href');
        // Solo enlaces que son /series/nombre-id/ (no /series/ solo)
        return href && href.match(/\/series\/[^\/]+-\d+\//);
      });

      return validLinks.map(link => {
        const href = link.getAttribute('href');

        // Extraer título (buscar h3 dentro del enlace)
        const titleElement = link.querySelector('h3, h2, [class*="title"]');
        const title = titleElement?.textContent?.trim() || link.getAttribute('title') || '';

        // Extraer imagen
        const imgElement = link.querySelector('img');
        const cover = imgElement?.src || imgElement?.srcset?.split(' ')[0] || '';

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
    });

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
