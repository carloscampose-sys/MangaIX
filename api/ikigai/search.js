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
    console.log('[Ikigai Search] Navegando a URL...');
    await puppeteerPage.goto(searchUrl, {
      waitUntil: 'networkidle0', // Cambio a networkidle0 para esperar TODO
      timeout: 15000
    });

    console.log('[Ikigai Search] Página cargada, esperando renderizado...');

    // Esperar a que cargue el contenido
    // La página usa Qwik framework, esperar a que se renderice
    await new Promise(resolve => setTimeout(resolve, 4000)); // Aumentar a 4 segundos

    // Verificar si hay contenido en la página
    const pageContent = await puppeteerPage.content();
    console.log('[Ikigai Search] Tamaño de HTML:', pageContent.length);

    // Intentar esperar por el grid o por los enlaces de series
    try {
      await puppeteerPage.waitForSelector('a[href*="/series/"]', { timeout: 8000 });
      console.log('[Ikigai Search] Enlaces de series encontrados');
    } catch (e) {
      console.warn('[Ikigai Search] No se encontraron enlaces de series después de esperar');

      // Contar cuántos enlaces hay en la página para debug
      const linkCount = await puppeteerPage.evaluate(() => {
        return document.querySelectorAll('a').length;
      });
      console.log(`[Ikigai Search] Total de enlaces en página: ${linkCount}`);

      // Contar enlaces que contienen /series/
      const seriesLinkCount = await puppeteerPage.evaluate(() => {
        return document.querySelectorAll('a[href*="/series/"]').length;
      });
      console.log(`[Ikigai Search] Enlaces de series encontrados: ${seriesLinkCount}`);

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

      console.log('[Ikigai Eval] Total enlaces encontrados:', seriesLinks.length);

      // Filtrar solo los enlaces principales (no los de navegación)
      // Un enlace válido debe tener al menos una imagen o un h3 dentro
      const validLinks = Array.from(seriesLinks).filter(link => {
        const href = link.getAttribute('href');

        // Debe tener href válido
        if (!href || href === '/series/' || href === '/series') return false;

        // Debe tener contenido (imagen o título)
        const hasImage = link.querySelector('img') !== null;
        const hasTitle = link.querySelector('h3, h2, h1') !== null;

        return hasImage || hasTitle;
      });

      console.log('[Ikigai Eval] Enlaces válidos después de filtrar:', validLinks.length);

      return validLinks.map((link, index) => {
        const href = link.getAttribute('href');

        // Extraer título (buscar h3, h2, h1 dentro del enlace)
        const titleElement = link.querySelector('h3') ||
                            link.querySelector('h2') ||
                            link.querySelector('h1');
        const title = titleElement?.textContent?.trim() ||
                     link.getAttribute('title') ||
                     link.getAttribute('alt') || '';

        // Extraer imagen
        const imgElement = link.querySelector('img');
        const cover = imgElement?.src ||
                     imgElement?.getAttribute('src') ||
                     imgElement?.srcset?.split(' ')[0] || '';

        // Extraer slug de la URL
        let slug = '';
        if (href.includes('/series/')) {
          slug = href.split('/series/')[1]?.replace(/\/$/, '');
        }

        console.log(`[Ikigai Eval ${index}] slug: ${slug}, title: ${title}, cover: ${cover ? 'yes' : 'no'}`);

        // Solo retornar si tenemos slug (obligatorio) y al menos título o portada
        if (!slug) {
          return null;
        }

        return {
          id: `ikigai-${slug}-${Date.now()}-${index}`,
          slug,
          title: title || slug.split('-').join(' '),
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
