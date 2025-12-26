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

    // Iniciar Puppeteer con configuración anti-detección
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-blink-features=AutomationControlled'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const puppeteerPage = await browser.newPage();

    // Configurar User Agent real (Chrome reciente)
    await puppeteerPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Configurar viewport
    await puppeteerPage.setViewport({
      width: 1920,
      height: 1080
    });

    // Inyectar código anti-detección ANTES de navegar
    await puppeteerPage.evaluateOnNewDocument(() => {
      // Eliminar webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Sobrescribir chrome runtime
      window.navigator.chrome = {
        runtime: {},
      };

      // Sobrescribir plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Sobrescribir languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Permisos
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    });

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

    // Navegar a la URL con estrategia flexible
    console.log('[Ikigai Search] Navegando a URL...');
    try {
      await puppeteerPage.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (e) {
      console.log('[Ikigai Search] Timeout en navegación, continuando...');
    }

    console.log('[Ikigai Search] Página cargada, esperando renderizado JS...');

    // Esperar renderizado inicial
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[Ikigai Search] Intentando cargar todos los resultados con scroll...');

    // Hacer scroll para cargar todos los resultados (scroll infinito)
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // Máximo 20 scrolls para búsqueda

    while (scrollAttempts < maxScrollAttempts) {
      // Hacer scroll hasta el final
      await puppeteerPage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Esperar a que cargue contenido nuevo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar si hay un botón "Cargar más" y hacer clic
      const loadMoreClicked = await puppeteerPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loadBtn = buttons.find(btn =>
          btn.textContent.toLowerCase().includes('cargar') ||
          btn.textContent.toLowerCase().includes('más') ||
          btn.textContent.toLowerCase().includes('load') ||
          btn.textContent.toLowerCase().includes('more')
        );

        if (loadBtn && !loadBtn.disabled) {
          loadBtn.click();
          return true;
        }
        return false;
      });

      if (loadMoreClicked) {
        console.log('[Ikigai Search] Botón "Cargar más" clickeado');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Verificar si la altura cambió (se cargó más contenido)
      const currentHeight = await puppeteerPage.evaluate(() => document.body.scrollHeight);

      if (currentHeight === previousHeight) {
        // No hay más contenido para cargar
        console.log('[Ikigai Search] No se detectó más contenido nuevo');
        break;
      }

      previousHeight = currentHeight;
      scrollAttempts++;
      console.log(`[Ikigai Search] Scroll ${scrollAttempts}: altura ${currentHeight}px`);
    }

    console.log(`[Ikigai Search] Scroll completado después de ${scrollAttempts} intentos`);

    // Verificar si hay contenido en la página
    const pageContent = await puppeteerPage.content();
    console.log('[Ikigai Search] Tamaño de HTML:', pageContent.length);

    // Contar enlaces totales
    const linkCount = await puppeteerPage.evaluate(() => {
      return document.querySelectorAll('a').length;
    });
    console.log(`[Ikigai Search] Total de enlaces en página: ${linkCount}`);

    // Contar enlaces que contienen /series/
    const seriesLinkCount = await puppeteerPage.evaluate(() => {
      return document.querySelectorAll('a[href*="/series/"]').length;
    });
    console.log(`[Ikigai Search] Enlaces de series encontrados: ${seriesLinkCount}`);

    if (seriesLinkCount === 0) {
      console.warn('[Ikigai Search] No se encontraron series después del scroll');
      await browser.close();
      return res.status(200).json({
        results: [],
        page,
        hasMore: false,
        scrollAttempts
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

        // Excluir enlaces de navegación (inicio, biblioteca, etc)
        const excludePatterns = ['/clasificacion', '/lists/', '/grupos/'];
        if (excludePatterns.some(pattern => href.includes(pattern))) return false;

        // Debe tener contenido (imagen o título)
        const hasImage = link.querySelector('img') !== null;
        const hasTitle = link.querySelector('h3, h2, h1') !== null;
        const hasText = link.textContent && link.textContent.trim().length > 2;

        return (hasImage || hasTitle || hasText) && href.split('/series/')[1]?.length > 1;
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
      hasMore: false, // Con scroll infinito, cargamos todo de una vez
      scrollAttempts,
      totalResults: results.length
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
  const baseUrl = 'https://viralikigai.ozoviral.xyz/series/';
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
