import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Detecta el número total de páginas de capítulos
 * @param {Page} page - Puppeteer page object
 * @returns {Promise<number>} - Total de páginas (mínimo 1)
 */
async function detectTotalPages(page) {
  try {
    const totalPages = await page.evaluate(() => {
      // Buscar enlaces con parámetro "pagina="
      const paginationLinks = Array.from(document.querySelectorAll('a[href*="pagina="]'));
      
      if (paginationLinks.length === 0) {
        // Intentar con selectores de paginación comunes
        const paginationSelectors = [
          '.pagination a',
          '[class*="pagination"] a',
          '[class*="pager"] a',
          'nav a[href*="pagina"]'
        ];
        
        for (const selector of paginationSelectors) {
          const links = Array.from(document.querySelectorAll(selector));
          if (links.length > 0) {
            paginationLinks.push(...links);
            break;
          }
        }
      }
      
      if (paginationLinks.length === 0) {
        console.log('[detectTotalPages] No se encontraron controles de paginación');
        return 1;
      }
      
      // Extraer números de página de los enlaces
      const pageNumbers = [];
      paginationLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const match = href.match(/pagina=(\d+)/);
        if (match && match[1]) {
          const pageNum = parseInt(match[1], 10);
          if (!isNaN(pageNum)) {
            pageNumbers.push(pageNum);
          }
        }
      });
      
      if (pageNumbers.length === 0) {
        console.log('[detectTotalPages] No se encontraron números de página válidos');
        return 1;
      }
      
      // Retornar el número más alto
      const maxPage = Math.max(...pageNumbers);
      console.log('[detectTotalPages] Páginas encontradas:', pageNumbers, 'Máximo:', maxPage);
      return maxPage;
    });
    
    // Validar que esté en el rango 1-100
    if (totalPages < 1 || totalPages > 100) {
      console.warn(`[detectTotalPages] Número de páginas fuera de rango: ${totalPages}, usando 1`);
      return 1;
    }
    
    return totalPages;
  } catch (error) {
    console.error('[detectTotalPages] Error:', error.message);
    return 1;
  }
}

/**
 * Extrae todos los capítulos de la página actual
 * @param {Page} page - Puppeteer page object
 * @returns {Promise<Array>} - Array de capítulos
 */
async function extractChaptersFromPage(page) {
  try {
    const chapters = await page.evaluate(() => {
      // Buscar TODOS los enlaces de la página
      const allLinks = Array.from(document.querySelectorAll('a'));
      
      // Filtrar enlaces que parecen ser capítulos
      const chapterLinks = allLinks.filter(link => {
        const href = link.getAttribute('href') || '';
        return href.includes('/capitulo/');
      });
      
      // Procesar enlaces encontrados
      return chapterLinks.map(link => {
        const href = link.getAttribute('href');
        if (!href) return null;
        
        let chapter = '';
        const text = link.textContent || '';
        
        // Estrategia 1: Extraer del texto del enlace
        const textPatterns = [
          /cap[íi]tulo\s*(\d+\.?\d*)/i,
          /chapter\s*(\d+\.?\d*)/i,
          /cap\s*\.*\s*(\d+\.?\d*)/i,
          /#\s*(\d+\.?\d*)/,
          /^\s*(\d+\.?\d*)\s*$/
        ];
        
        for (const pattern of textPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            chapter = match[1];
            break;
          }
        }
        
        // Estrategia 2: Extraer cualquier número del texto
        if (!chapter) {
          const textMatch = text.match(/(\d+\.?\d*)/);
          if (textMatch && textMatch[1]) {
            chapter = textMatch[1];
          }
        }
        
        // Estrategia 3: Extraer del URL
        if (!chapter) {
          const urlPatterns = [
            /-(\d+\.?\d*)\/?$/,
            /-(\d+\.?\d*)-/,
            /cap(?:itulo)?-(\d+\.?\d*)/i,
            /chapter-(\d+\.?\d*)/i,
            /\/(\d+\.?\d*)\/?$/
          ];
          
          for (const pattern of urlPatterns) {
            const match = href.match(pattern);
            if (match && match[1]) {
              chapter = match[1];
              break;
            }
          }
        }
        
        // Si no se pudo extraer número, descartar
        if (!chapter) {
          return null;
        }
        
        // Validar que el número sea razonable (entre 0 y 9999)
        const chapterNum = parseFloat(chapter);
        if (isNaN(chapterNum) || chapterNum < 0 || chapterNum > 9999) {
          return null;
        }
        
        const title = text.trim() || `Capítulo ${chapter}`;
        
        return {
          chapter,
          title: title.substring(0, 200),
          url: href.startsWith('http') ? href : `https://viralikigai.foodib.net${href}`
        };
      }).filter(item => item !== null && item.chapter);
    });
    
    return chapters;
  } catch (error) {
    console.error('[extractChaptersFromPage] Error:', error.message);
    return [];
  }
}

/**
 * Consolida, deduplica y ordena capítulos
 * @param {Array<Array>} allChapters - Array de arrays de capítulos
 * @returns {Array} - Lista consolidada y ordenada
 */
function consolidateChapters(allChapters) {
  // Flatten: Combinar todos los arrays en uno solo
  const flatChapters = allChapters.flat();
  
  // Deduplicate: Usar Map con chapter como key
  const chapterMap = new Map();
  flatChapters.forEach(chapter => {
    if (!chapterMap.has(chapter.chapter)) {
      chapterMap.set(chapter.chapter, chapter);
    }
  });
  
  // Convertir Map a array
  const uniqueChapters = Array.from(chapterMap.values());
  
  // Sort: Ordenar por número de capítulo descendente
  uniqueChapters.sort((a, b) => {
    const numA = parseFloat(a.chapter) || 0;
    const numB = parseFloat(b.chapter) || 0;
    return numB - numA;
  });
  
  // Log duplicados eliminados
  const duplicatesRemoved = flatChapters.length - uniqueChapters.length;
  if (duplicatesRemoved > 0) {
    console.log(`[consolidateChapters] Duplicados eliminados: ${duplicatesRemoved}`);
  }
  
  return uniqueChapters;
}

/**
 * Espera a que se complete el challenge de Cloudflare
 * @param {Page} page - Puppeteer page object
 * @param {number} timeout - Tiempo máximo de espera en ms
 * @returns {Promise<boolean>} - true si completó, false si falló
 */
async function waitForCloudflareChallenge(page, timeout = 15000) {
  try {
    await page.waitForFunction(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText : '';
      
      return !title.includes('500') &&
        !title.includes('Just a moment') &&
        !title.includes('Error') &&
        !bodyText.includes('Checking your browser') &&
        bodyText.length > 100;
    }, { timeout });
    
    console.log('[waitForCloudflareChallenge] ✓ Challenge completado');
    
    // Espera reducida para renderizado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return true;
  } catch (error) {
    console.warn('[waitForCloudflareChallenge] Timeout esperando challenge');
    // No hacer reload, simplemente esperar un poco más y continuar
    await new Promise(resolve => setTimeout(resolve, 3000));
    return true; // Continuar de todas formas
  }
}

// ========================================
// MAIN HANDLER
// ========================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  let browser = null;

  try {
    const baseUrl = `https://viralikigai.foodib.net/series/${slug}`;

    console.log(`[Ikigai Chapters] Iniciando extracción para: ${slug}`);
    console.log(`[Ikigai Chapters] URL base: ${baseUrl}`);

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // User Agent real
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Anti-detección
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    // Bloquear ads
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'doubleclick', 'tracking'];
      const url = request.url().toLowerCase();

      if (blockedResources.some(resource => url.includes(resource))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Array para acumular capítulos de todas las páginas
    const allChaptersArrays = [];

    // Navegar a la primera página
    const firstPageUrl = `${baseUrl}?pagina=1`;
    console.log(`[Ikigai Chapters] Navegando a página 1: ${firstPageUrl}`);

    try {
      await page.goto(firstPageUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (navError) {
      console.log(`[Ikigai Chapters] Timeout en navegación a página 1, continuando...`);
    }

    // Esperar a que Cloudflare complete su challenge
    const challengeSuccess = await waitForCloudflareChallenge(page);
    if (!challengeSuccess) {
      await browser.close();
      return res.status(500).json({
        error: 'Error cargando página',
        details: 'No se pudo superar el challenge de Cloudflare'
      });
    }

    // Detectar total de páginas
    const totalPages = await detectTotalPages(page);
    console.log(`[Ikigai Chapters] Total de páginas detectadas: ${totalPages}`);

    // Extraer capítulos de la primera página (ya estamos en ella)
    const firstPageChapters = await extractChaptersFromPage(page);
    console.log(`[Ikigai Chapters] Página 1: ${firstPageChapters.length} capítulos encontrados`);
    allChaptersArrays.push(firstPageChapters);

    // Navegar por las páginas restantes (2 a N)
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
      console.log(`[Ikigai Chapters] Procesando página ${pageNum}...`);

      try {
        // Hacer clic en el enlace de paginación en lugar de navegar
        const clickedSuccessfully = await page.evaluate((targetPage) => {
          // Buscar el enlace de la página específica
          const links = Array.from(document.querySelectorAll('a[href*="pagina="]'));
          const targetLink = links.find(link => {
            const href = link.getAttribute('href') || '';
            const match = href.match(/pagina=(\d+)/);
            return match && parseInt(match[1], 10) === targetPage;
          });
          
          if (targetLink) {
            targetLink.click();
            return true;
          }
          return false;
        }, pageNum);

        if (!clickedSuccessfully) {
          console.warn(`[Ikigai Chapters] No se encontró enlace para página ${pageNum}, usando navegación directa`);
          const pageUrl = `${baseUrl}?pagina=${pageNum}`;
          await page.goto(pageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
        }

        // Esperar a que cargue el contenido nuevo
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extraer capítulos
        const pageChapters = await extractChaptersFromPage(page);
        console.log(`[Ikigai Chapters] Página ${pageNum}: ${pageChapters.length} capítulos encontrados`);
        allChaptersArrays.push(pageChapters);

      } catch (error) {
        console.error(`[Ikigai Chapters] Error en página ${pageNum}:`, error.message);
        console.log(`[Ikigai Chapters] Continuando con siguiente página...`);
        continue;
      }
    }

    // Consolidar, deduplicar y ordenar capítulos
    const consolidatedChapters = consolidateChapters(allChaptersArrays);

    console.log(`[Ikigai Chapters] Total capítulos únicos: ${consolidatedChapters.length}`);
    console.log(`[Ikigai Chapters] Páginas procesadas: ${totalPages}`);

    await browser.close();

    return res.status(200).json({
      chapters: consolidatedChapters,
      total: consolidatedChapters.length,
      pagesScanned: totalPages
    });

  } catch (error) {
    console.error('[Ikigai Chapters] Error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[Ikigai Chapters] Error cerrando browser:', e);
      }
    }

    return res.status(500).json({
      error: 'Error obteniendo capítulos',
      details: error.message
    });
  }
}
