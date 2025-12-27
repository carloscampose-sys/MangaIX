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

    console.log('[Ikigai Search] ============================================');
    console.log('[Ikigai Search] Página solicitada:', page);
    console.log('[Ikigai Search] Query:', query);
    console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
    console.log('[Ikigai Search] URL completa:', searchUrl);
    console.log('[Ikigai Search] Base URL debe ser foodib.net');
    console.log('[Ikigai Search] ============================================');

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

    // Capturar logs del navegador para debugging
    puppeteerPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Ikigai Eval]')) {
        console.log(text);
      }
    });

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
    
    // ESTRATEGIA: Si hay query de búsqueda, navegar a la página base primero
    // y luego usar el campo de búsqueda interactivo
    const hasSearchQuery = query && query.trim();
    const navigationUrl = hasSearchQuery ? 'https://viralikigai.foodib.net/series/' : searchUrl;
    
    console.log('[Ikigai Search] URL de navegación:', navigationUrl);
    
    try {
      await puppeteerPage.goto(navigationUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (e) {
      console.log('[Ikigai Search] Timeout en navegación, continuando...');
    }

    console.log('[Ikigai Search] Página cargada, esperando renderizado JS...');

    // Esperar a que el contenido JavaScript se renderice
    // Qwik toma tiempo en hidratar - esperamos más tiempo
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos inicial
    
    // Si hay búsqueda por texto, usar el campo de búsqueda del sitio
    if (hasSearchQuery) {
      console.log('[Ikigai Search] Usando búsqueda interactiva...');
      
      try {
        // Buscar el input de búsqueda - Ikigai usa un input con placeholder "Buscar..."
        const searchInputSelector = 'input[type="text"], input[placeholder*="uscar"], input[placeholder*="ombre"]';
        
        console.log('[Ikigai Search] Esperando input de búsqueda...');
        await puppeteerPage.waitForSelector(searchInputSelector, { timeout: 10000 });
        
        console.log('[Ikigai Search] Input encontrado, escribiendo query...');
        await puppeteerPage.type(searchInputSelector, query.trim(), { delay: 100 });
        
        // Esperar un momento para que se procese
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Presionar Enter para buscar
        console.log('[Ikigai Search] Presionando Enter...');
        await puppeteerPage.keyboard.press('Enter');
        
        // Esperar a que se actualicen los resultados (más tiempo para Qwik)
        console.log('[Ikigai Search] Esperando resultados de búsqueda...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('[Ikigai Search] ✓ Búsqueda interactiva completada');
      } catch (error) {
        console.error('[Ikigai Search] Error en búsqueda interactiva:', error.message);
        console.log('[Ikigai Search] Continuando con resultados actuales...');
      }
    } else {
      // Sin búsqueda de texto, solo esperar más tiempo para que cargue
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Verificar si hay contenido en la página
    const pageContent = await puppeteerPage.content();
    console.log('[Ikigai Search] Tamaño de HTML:', pageContent.length);

    // Contar enlaces totales primero
    const linkCount = await puppeteerPage.evaluate(() => {
      return document.querySelectorAll('a').length;
    });
    console.log(`[Ikigai Search] Total de enlaces en página: ${linkCount}`);

    // Intentar múltiples estrategias para encontrar series
    let seriesFound = false;
    let seriesLinkCount = 0;

    // Estrategia 1: Esperar por enlaces /series/
    try {
      await puppeteerPage.waitForSelector('a[href*="/series/"]', { timeout: 5000 });
      seriesFound = true;
      console.log('[Ikigai Search] ✓ Estrategia 1: Enlaces encontrados');
    } catch (e) {
      console.log('[Ikigai Search] ✗ Estrategia 1 falló');
    }

    // Estrategia 2: Esperar a que haya imágenes (las series tienen portadas)
    if (!seriesFound) {
      try {
        await puppeteerPage.waitForSelector('img', { timeout: 5000 });
        seriesFound = true;
        console.log('[Ikigai Search] ✓ Estrategia 2: Imágenes encontradas');
      } catch (e) {
        console.log('[Ikigai Search] ✗ Estrategia 2 falló');
      }
    }

    // Contar enlaces que contienen /series/
    seriesLinkCount = await puppeteerPage.evaluate(() => {
      return document.querySelectorAll('a[href*="/series/"]').length;
    });
    console.log(`[Ikigai Search] Enlaces de series encontrados: ${seriesLinkCount}`);

    // Hacer scroll para cargar MÁS resultados (lazy loading)
    // Similar a manhwaweb, Ikigai carga más contenido mientras haces scroll
    console.log('[Ikigai Search] Haciendo scroll para cargar más resultados...');
    let previousCount = seriesLinkCount;
    let currentCount = seriesLinkCount;
    let scrollAttempts = 0;
    const maxScrollAttempts = 8; // Limitar a 8 intentos

    do {
      previousCount = currentCount;

      // Scroll hacia abajo hasta el final de la página
      await puppeteerPage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Esperar 1 segundo a que se carguen nuevos elementos
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Contar elementos actuales
      currentCount = await puppeteerPage.evaluate(() => {
        return document.querySelectorAll('a[href*="/series/"]').length;
      });

      scrollAttempts++;
      console.log(`[Ikigai Search] Scroll ${scrollAttempts}/${maxScrollAttempts}: ${currentCount} resultados`);

      // Salir si no hay más elementos nuevos o alcanzamos el límite de scrolls
    } while (currentCount > previousCount && scrollAttempts < maxScrollAttempts);

    console.log(`[Ikigai Search] Scroll completado. Total: ${currentCount} resultados`);
    seriesLinkCount = currentCount;

    if (seriesLinkCount === 0) {
      console.warn('[Ikigai Search] No se encontraron series después de todas las estrategias');
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

        // Excluir enlaces de navegación (inicio, biblioteca, etc)
        const excludePatterns = ['/clasificacion', '/lists/', '/grupos/'];
        if (excludePatterns.some(pattern => href.includes(pattern))) return false;

        // Excluir enlaces de paginación que NO son de series
        // Los enlaces de series pueden tener query strings (ej: /series/amor-maldito?buscar=...)
        // Solo excluir si es SOLO paginación sin /series/ en la ruta
        if (href.includes('?pagina=') && !href.includes('/series/')) return false;
        if (href.includes('&pagina=') && !href.includes('/series/')) return false;

        // Debe tener contenido (imagen o título)
        const hasImage = link.querySelector('img') !== null;
        const hasTitle = link.querySelector('h3, h2, h1') !== null;
        const hasText = link.textContent && link.textContent.trim().length > 2;

        return (hasImage || hasTitle || hasText) && href.split('/series/')[1]?.length > 1;
      });

      console.log('[Ikigai Eval] Enlaces válidos después de filtrar:', validLinks.length);

      // Extraer datos de cada enlace
      const extractedData = validLinks.map((link, index) => {
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
          const slugPart = href.split('/series/')[1];
          // Remover trailing slash y query strings (ej: ?buscar=..., ?pagina=...)
          slug = slugPart?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        }

        console.log(`[Ikigai Eval ${index}] href: ${href}, slug: ${slug}, title: ${title}, cover: ${cover ? 'yes' : 'no'}`);

        // Solo retornar si tenemos slug (obligatorio)
        if (!slug) {
          console.log(`[Ikigai Eval ${index}] ✗ DESCARTADO: sin slug`);
          return null;
        }

        // Si no tenemos título, usar el slug formateado
        const finalTitle = title || slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        console.log(`[Ikigai Eval ${index}] ✓ VÁLIDO: ${slug} (título: ${finalTitle})`);

        return {
          id: `ikigai-${slug}-${Date.now()}-${index}`,
          slug,
          title: finalTitle,
          cover,
          source: 'ikigai'
        };
      });

      // Filtrar resultados nulos y eliminar duplicados por slug
      const filtered = extractedData.filter(item => item !== null);
      console.log('[Ikigai Eval] Después de filtrar nulos:', filtered.length);

      // Eliminar duplicados por slug
      const uniqueBySlug = [];
      const seenSlugs = new Set();

      for (const item of filtered) {
        if (!seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          uniqueBySlug.push(item);
        } else {
          console.log(`[Ikigai Eval] ✗ DUPLICADO removido: ${item.slug}`);
        }
      }

      console.log('[Ikigai Eval] Total resultados únicos finales:', uniqueBySlug.length);
      
      // Log de los primeros 5 títulos para debugging
      console.log('[Ikigai Eval] Primeros 5 títulos encontrados:');
      uniqueBySlug.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.title} (slug: ${item.slug})`);
      });
      
      return uniqueBySlug;
    });

    // Verificar si hay página siguiente para paginación
    // NOTA: Ikigai usa paginación numérica (1, 2, 3, ...)
    const paginationInfo = await puppeteerPage.evaluate((currentPage) => {
      // Estrategia 1: Buscar indicadores de carga (spinner, loading, etc)
      const loadingIndicators = document.querySelectorAll(
        '[class*="loading"], [class*="spinner"], [class*="loader"], [aria-busy="true"]'
      );
      const hasLoadingIndicator = loadingIndicators.length > 0;

      // Estrategia 2: Buscar botón "Cargar más" o similar
      const loadMoreButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
        const text = el.textContent.toLowerCase();
        return text.includes('cargar más') || 
               text.includes('load more') || 
               text.includes('ver más') ||
               text.includes('show more');
      });
      const hasLoadMoreButton = loadMoreButtons.length > 0;

      // Estrategia 3: Buscar botones de paginación tradicional (siguiente/next)
      const nextSelectors = [
        'button.next-page:not(.disabled)',
        'a.next-page:not(.disabled)',
        'button.siguiente:not(.disabled)',
        'a.siguiente:not(.disabled)',
        '.pagination .next:not(.disabled)',
        '.pagination a[rel="next"]',
        'a[aria-label="Next"]:not(.disabled)',
        'button[aria-label="Next"]:not(.disabled)',
        'button[aria-label="siguiente"]:not(.disabled)',
        '[class*="pagination"] button:not(.disabled):last-child',
        '[class*="pagination"] a:not(.disabled):last-child'
      ];

      let hasNextButton = false;
      let foundBy = null;

      for (const selector of nextSelectors) {
        const btn = document.querySelector(selector);
        if (btn && !btn.disabled && !btn.classList.contains('disabled')) {
          hasNextButton = true;
          foundBy = selector;
          break;
        }
      }

      // Estrategia 4: Buscar texto de "siguiente" en botones
      if (!hasNextButton) {
        const allButtons = Array.from(document.querySelectorAll('button, a'));
        const nextButton = allButtons.find(btn => {
          const text = btn.textContent.toLowerCase();
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          return (
            (text.includes('siguiente') ||
             text.includes('next') ||
             text === '>' ||
             text === '→' ||
             ariaLabel.includes('siguiente') ||
             ariaLabel.includes('next')) &&
            !btn.disabled &&
            !btn.classList.contains('disabled')
          );
        });
        if (nextButton) {
          hasNextButton = true;
          foundBy = 'text search';
        }
      }

      // Estrategia 5: NUEVA - Buscar botones numéricos (1, 2, 3, ...)
      // Ikigai usa paginación numérica, buscar si existe un número mayor a la página actual
      let hasNumericNext = false;
      const allButtons = Array.from(document.querySelectorAll('button, a'));
      const numericButtons = allButtons.filter(btn => {
        const text = btn.textContent.trim();
        return /^\d+$/.test(text); // Solo números
      });

      // Buscar si hay un botón con número mayor a currentPage
      const nextPageNumber = currentPage + 1;
      const hasNextPageButton = numericButtons.some(btn => {
        const pageNum = parseInt(btn.textContent.trim());
        return pageNum === nextPageNumber && 
               !btn.disabled && 
               !btn.classList.contains('disabled');
      });

      if (hasNextPageButton) {
        hasNumericNext = true;
        foundBy = foundBy || 'numeric pagination';
      }

      // Debug: Listar TODOS los botones y enlaces relacionados con paginación
      const paginationButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
        const text = el.textContent.toLowerCase();
        return text.includes('siguiente') || 
               text.includes('next') || 
               text.includes('página') || 
               text.includes('page') ||
               text.includes('cargar') ||
               text.includes('load') ||
               text.includes('más') ||
               text.includes('more') ||
               /^\d+$/.test(text.trim()) ||
               text === '>' ||
               text === '→';
      });

      const paginationDebug = paginationButtons.map(el => ({
        tag: el.tagName,
        text: el.textContent.trim(),
        classes: el.className,
        disabled: el.disabled || el.classList.contains('disabled'),
        href: el.href || null,
        ariaLabel: el.getAttribute('aria-label')
      }));

      console.log('[Ikigai Eval] Página actual:', currentPage);
      console.log('[Ikigai Eval] Indicadores de carga encontrados:', loadingIndicators.length);
      console.log('[Ikigai Eval] Botones "Cargar más" encontrados:', loadMoreButtons.length);
      console.log('[Ikigai Eval] Botones numéricos encontrados:', numericButtons.length);
      console.log('[Ikigai Eval] ¿Existe botón página', nextPageNumber + '?:', hasNextPageButton);
      console.log('[Ikigai Eval] Botones de paginación encontrados:', paginationDebug.length);

      // Determinar si hay más contenido
      const hasMore = hasLoadingIndicator || hasLoadMoreButton || hasNextButton || hasNumericNext;
      const detectionMethod = hasLoadingIndicator ? 'loading indicator' :
                             hasLoadMoreButton ? 'load more button' :
                             hasNumericNext ? 'numeric pagination' :
                             hasNextButton ? foundBy || 'next button' :
                             'none';

      return {
        hasMore,
        foundBy: detectionMethod,
        paginationDebug,
        hasLoadingIndicator,
        hasLoadMoreButton,
        hasNextButton,
        hasNumericNext,
        currentPage,
        nextPageNumber
      };
    }, page);

    await browser.close();

    console.log(`[Ikigai Search] ${results.length} resultados encontrados (después de ${scrollAttempts} scrolls)`);
    console.log(`[Ikigai Search] ¿Hay más páginas?: ${paginationInfo.hasMore}`);
    console.log(`[Ikigai Search] Método de detección: ${paginationInfo.foundBy}`);
    console.log(`[Ikigai Search] - Loading indicator: ${paginationInfo.hasLoadingIndicator}`);
    console.log(`[Ikigai Search] - Load more button: ${paginationInfo.hasLoadMoreButton}`);
    console.log(`[Ikigai Search] - Next button: ${paginationInfo.hasNextButton}`);
    console.log(`[Ikigai Search] - Numeric next (página ${paginationInfo.nextPageNumber}): ${paginationInfo.hasNumericNext}`);
    console.log(`[Ikigai Search] Elementos de paginación encontrados:`, paginationInfo.paginationDebug.length);
    if (paginationInfo.paginationDebug.length > 0) {
      console.log(`[Ikigai Search] Detalles:`, JSON.stringify(paginationInfo.paginationDebug, null, 2));
    }

    return res.status(200).json({
      results,
      page,
      hasMore: paginationInfo.hasMore,
      scrollAttempts,
      paginationDebug: paginationInfo.paginationDebug,
      detectionMethod: paginationInfo.foundBy
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
  const baseUrl = 'https://viralikigai.foodib.net/series/';
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

  // NOTA: NO incluimos el parámetro 'buscar' aquí
  // La búsqueda por texto se hace de forma interactiva usando el campo de búsqueda del sitio

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
