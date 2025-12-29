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
      waitUntil: 'networkidle0',  // Esperar a que no haya conexiones de red
      timeout: 45000
    });

    // 5. Esperar a que carguen los resultados
    // Qwik framework carga contenido dinámicamente, necesitamos esperar
    // La estructura es: div > a[href*="/series/"] con h3 dentro
    console.log('[Ikigai Search] Esperando carga de contenido dinámico...');

    try {
      // Primero esperar a que exista algún link a series
      await puppeteerPage.waitForSelector('a[href*="/series/"]', { timeout: 20000 });
      console.log('[Ikigai Search] Links a series encontrados');

      // Esperar un poco más para asegurar que las imágenes y títulos carguen
      await puppeteerPage.waitForTimeout(2000);

      // Verificar que hay h3 (títulos) cargados
      await puppeteerPage.waitForSelector('h3', { timeout: 5000 });
      console.log('[Ikigai Search] Títulos h3 encontrados');
    } catch (e) {
      console.log('[Ikigai Search] Timeout esperando contenido:', e.message);

      // Intentar extraer lo que haya de todos modos
      const pageContent = await puppeteerPage.content();
      console.log('[Ikigai Search] HTML length:', pageContent.length);
      console.log('[Ikigai Search] Contiene /series/:', pageContent.includes('/series/'));
    }

    // 6. Extraer resultados
    // Estructura real: <div><a href="/series/[slug]/"><img/><h3>Título</h3>...</a></div>
    const results = await puppeteerPage.evaluate(() => {
      // Buscar todos los links a series
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
      const seen = new Set(); // Para evitar duplicados
      const results = [];

      seriesLinks.forEach(link => {
        const href = link.href || link.getAttribute('href');
        if (!href) return;

        // Extraer slug del href
        const slugMatch = href.match(/\/series\/([^\/]+)/);
        const slug = slugMatch ? slugMatch[1] : '';

        // Ignorar si no tiene slug o ya lo vimos
        if (!slug || seen.has(slug)) return;
        seen.add(slug);

        // Encontrar el contenedor padre (puede ser div, li, article, etc)
        const container = link.closest('div') || link.parentElement;

        // Encontrar imagen de portada
        const img = link.querySelector('img') || (container && container.querySelector('img'));
        let cover = '';
        if (img) {
          cover = img.src || img.dataset.src || img.getAttribute('src') || '';
        }

        // Encontrar título (h3 dentro del link o contenedor)
        const titleElement = link.querySelector('h3') || (container && container.querySelector('h3'));
        const title = titleElement ? titleElement.textContent.trim() : '';

        // Solo agregar si tiene al menos título o cover
        if (title || cover) {
          results.push({
            id: `ikigai-${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            slug,
            title: title || slug.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
            cover,
            source: 'ikigai'
          });
        }
      });

      return results;
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
