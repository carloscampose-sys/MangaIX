/**
 * ================================================
 * IKIGAI SEARCH API - Endpoint de búsqueda con Puppeteer
 * ================================================
 *
 * FECHA: 2025-12-28
 * CAMBIO: Implementado Puppeteer para scraping directo
 *
 * ANTES: Tenía código mezclado de ScrapingBee y Puppeteer con conflictos de merge
 *
 * AHORA: Usa Puppeteer para hacer scraping directo a viralikigai.eurofiyati.online
 *        Maneja Cloudflare con timeout y validaciones
 *        Construye URL con query params correctos
 *
 * DOMINIO: https://viralikigai.eurofiyati.online/series/
 *
 * PARÁMETROS SOPORTADOS:
 * - buscar: texto de búsqueda
 * - generos[]: array de IDs de géneros (múltiples)
 * - tipos[]: array de tipos (comic, novel) (múltiples)
 * - estados[]: array de IDs de estados (múltiples)
 * - ordenar: opción de ordenamiento (name, created_at, etc.)
 * - pagina: número de página
 */

import puppeteer from 'puppeteer-extra';
import chromium from '@sparticuz/chromium';
import { getRotatingUserAgent } from './proxyConfig.js';

// ========================================
// HELPER FUNCTION - CLOUDFLARE CHALLENGE
// ========================================

/**
 * Espera a que se complete el challenge de Cloudflare
 * @param {Page} page - Puppeteer page object
 * @param {number} timeout - Tiempo máximo de espera en ms
 * @returns {Promise<boolean>} - true si completó, false si falló
 */
async function waitForCloudflareChallenge(page, timeout = 30000) {
  try {
    // Paso 1: Esperar a que desaparezca el challenge de Cloudflare
    await page.waitForFunction(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText : '';

      return !title.includes('500') &&
        !title.includes('Just a moment') &&
        !title.includes('Error') &&
        !bodyText.includes('Checking your browser') &&
        !bodyText.includes('Verifying you are human');
    }, { timeout: timeout * 0.6 });

    console.log('[Ikigai Search] ✓ Challenge de Cloudflare superado');

    // Paso 2: Esperar a que aparezcan enlaces de series
    await page.waitForFunction(() => {
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
      const bodyText = document.body ? document.body.innerText : '';

      return seriesLinks.length > 5 && bodyText.length > 1000;
    }, { timeout: timeout * 0.4 });

    console.log('[Ikigai Search] ✓ Contenido cargado');

    // Espera adicional para renderizado completo de Qwik
    await new Promise(resolve => setTimeout(resolve, 2000));

    return true;
  } catch (error) {
    console.error('[Ikigai Search] ❌ Error:', error.message);

    // Debug: Ver qué hay en la página
    const debugInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body ? document.body.innerText.length : 0,
        seriesLinksCount: document.querySelectorAll('a[href*="/series/"]').length,
        allLinksCount: document.querySelectorAll('a').length,
        url: window.location.href
      };
    });
    console.log('[Ikigai Search] Estado de la página:', JSON.stringify(debugInfo, null, 2));

    // Si hay enlaces de series, considerar exitoso aunque haya timeout
    if (debugInfo.seriesLinksCount > 0) {
      console.log('[Ikigai Search] ✓ Recuperado: hay enlaces de series');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }

    return false;
  }
}

// ========================================
// MAIN HANDLER
// ========================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ===========================================');
  console.log('[Ikigai Search] BÚSQUEDA CON PUPPETEER');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ===========================================');

  let browser = null;

  try {
    // Configurar Puppeteer
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const puppeteerPage = await browser.newPage();

    // User Agent rotatorio usando proxyConfig
    const selectedUA = getRotatingUserAgent(Date.now());
    await puppeteerPage.setUserAgent(selectedUA);

    // Anti-detección: inyectar código antes de navegar
    await puppeteerPage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    // Bloquear SOLAMENTE publicidad y analytics
    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const url = request.url().toLowerCase();

      // Bloquear solamente publicidad y analytics
      if (url.includes('ads') ||
          url.includes('analytics') ||
          url.includes('tracking') ||
          url.includes('doubleclick')) {
        request.abort();
      } else {
        request.continue();  // Permitir todo lo demás para mejor detección
      }
    });

    // PASO 1: Construir URL con parámetros de búsqueda
    const baseUrl = 'https://viralikigai.eurofiyati.online/series/';
    const urlParams = new URLSearchParams();

    // Búsqueda por texto (Ikigai usa 'buscar')
    if (query && query.trim()) {
      urlParams.append('buscar', query.trim());
    }

    // Filtros de géneros (Ikigai usa 'generos[]')
    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach(genreId => {
        if (genreId) {
          urlParams.append('generos[]', genreId);
        }
      });
    }

    // Filtros de tipos (Ikigai usa 'tipos[]')
    if (filters.types && filters.types.length > 0) {
      filters.types.forEach(typeId => {
        if (typeId) {
          urlParams.append('tipos[]', typeId);
        }
      });
    }

    // Filtros de estados (Ikigai usa 'estados[]')
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(statusId => {
        if (statusId) {
          urlParams.append('estados[]', statusId);
        }
      });
    }

    // Ordenamiento (Ikigai usa 'ordenar')
    if (filters.sortBy) {
      urlParams.append('ordenar', filters.sortBy);
    }

    // Paginación (Ikigai usa 'pagina')
    if (page > 1) {
      urlParams.append('pagina', page.toString());
    }

    const queryString = urlParams.toString();
    const targetUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    console.log('[Ikigai Search] URL construida:', targetUrl);

    // PASO 2: Navegar a la URL con filtros
    console.log('[Ikigai Search] Navegando a URL con filtros...');

    try {
      await puppeteerPage.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      console.log('[Ikigai Search] Navegación completada');
    } catch (navError) {
      console.log('[Ikigai Search] Error navegando:', navError.message);
    }

    // PASO 3: Esperar challenge de Cloudflare
    console.log('[Ikigai Search] Esperando challenge de Cloudflare...');
    const challengeSuccess = await waitForCloudflareChallenge(puppeteerPage);

    if (!challengeSuccess) {
      await browser.close();
      return res.status(503).json({
        error: 'Cloudflare está bloqueando Ikigai',
        details: 'No se pudo completar el challenge de Cloudflare'
      });
    }

    console.log('[Ikigai Search] ✓ Challenge completado');

    // PASO 4: Extraer resultados
    console.log('[Ikigai Search] Extrayendo resultados...');
    const results = await puppeteerPage.evaluate(() => {
      // Buscar enlaces de series
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

      // Filtrar enlaces válidos
      const validLinks = Array.from(allLinks).filter(link => {
        const href = link.getAttribute('href');
        if (!href || href === '/series/' || href === '/series') return false;

        // Excluir páginas especiales
        const excludePatterns = ['/clasificacion', '/lists/', '/grupos/', '/generos/', '/tags/'];
        if (excludePatterns.some(pattern => href.includes(pattern))) return false;

        // Verificar que tenga contenido relevante
        const slugPart = href.split('/series/')[1];
        if (!slugPart || slugPart.length <= 1) return false;

        return href.split('/series/')[1]?.length > 1;
      });

      // Extraer datos de cada enlace
      const extractedResults = validLinks.map((link, index) => {
        const href = link.getAttribute('href');

        // Extraer slug
        let slug = '';
        if (href.includes('/series/')) {
          const slugPart = href.split('/series/')[1];
          slug = slugPart?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        }

        if (!slug) return null;

        // Extraer título con múltiples selectores
        let title = '';
        const titleSelectors = ['h3', 'h2', 'h1', '.title', '[class*="title"]', 'span', 'div'];
        for (const selector of titleSelectors) {
          const titleEl = link.querySelector(selector);
          if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 1) {
            title = titleEl.textContent.trim();
            break;
          }
        }

        // Si no se encontró título, usar el del href o el atributo title
        if (!title) {
          title = link.getAttribute('title') || link.getAttribute('alt') || '';
        }

        // Extraer portada
        const imgElement = link.querySelector('img');
        const cover = imgElement?.src ||
                     imgElement?.getAttribute('src') ||
                     imgElement?.getAttribute('data-src') ||
                     imgElement?.getAttribute('data-srcset')?.split(' ')[0] || '';

        // Generar ID único
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

      // Eliminar duplicados por slug
      const uniqueResults = [];
      const seenSlugs = new Set();

      extractedResults.forEach(result => {
        if (!seenSlugs.has(result.slug)) {
          seenSlugs.add(result.slug);
          uniqueResults.push(result);
        }
      });

      return uniqueResults;
    });

    console.log('[Ikigai Search] Resultados extraídos:', results.length);
    if (results.length > 0) {
      console.log('[Ikigai Search] Primeros 3 resultados:');
      results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. "${r.title}" (${r.slug})`);
      });
    }

    // PASO 5: Detectar paginación
    const paginationInfo = await puppeteerPage.evaluate((currentPage) => {
      const paginationLinks = document.querySelectorAll('a[href*="pagina="]');
      let maxPageFound = currentPage;
      let nextPageExists = false;

      paginationLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const match = href.match(/pagina=(\d+)/);
        if (match) {
          const pageNum = parseInt(match[1]);
          if (!isNaN(pageNum)) {
            if (pageNum > maxPageFound) {
              maxPageFound = pageNum;
            }
            if (pageNum > currentPage) {
              nextPageExists = true;
            }
          }
        }
      });

      return { nextPageExists, maxPageFound, currentPage };
    }, page);

    console.log('[Ikigai Search] Paginación:', paginationInfo);

    await browser.close();

    // Retornar respuesta con estructura esperada por el frontend
    return res.status(200).json({
      results,
      page,
      hasMore: paginationInfo.nextPageExists,
      total: results.length
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
