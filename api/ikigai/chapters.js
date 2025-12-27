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
 * Espera a que se complete el challenge de Cloudflare y el contenido cargue
 * @param {Page} page - Puppeteer page object
 * @param {number} timeout - Tiempo máximo de espera en ms
 * @returns {Promise<boolean>} - true si completó, false si falló
 */
async function waitForCloudflareChallenge(page, timeout = 20000) {
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
    }, { timeout: timeout / 2 });
    
    console.log('[waitForCloudflareChallenge] ✓ Challenge de Cloudflare superado');
    
    // Paso 2: Esperar a que el contenido real cargue (Qwik es reactivo)
    await page.waitForFunction(() => {
      const bodyText = document.body ? document.body.innerText : '';
      const capituloLinks = document.querySelectorAll('a[href*="/capitulo/"]');
      
      // Verificar que hay contenido sustancial Y enlaces de capítulos
      return bodyText.length > 5000 && capituloLinks.length > 0;
    }, { timeout: timeout / 2 });
    
    console.log('[waitForCloudflareChallenge] ✓ Contenido cargado');
    
    // Espera adicional para asegurar renderizado completo de Qwik
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return true;
  } catch (error) {
    console.error('[waitForCloudflareChallenge] ❌ Error:', error.message);
    
    // Debug: Ver qué hay en la página
    const debugInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body ? document.body.innerText.length : 0,
        capituloLinks: document.querySelectorAll('a[href*="/capitulo/"]').length,
        allLinks: document.querySelectorAll('a').length,
        url: window.location.href
      };
    });
    console.log('[waitForCloudflareChallenge] Estado de la página:', JSON.stringify(debugInfo, null, 2));
    
    // Si hay muy poco contenido, es probable que Cloudflare siga bloqueando
    if (debugInfo.bodyLength < 1000) {
      console.error('[waitForCloudflareChallenge] ❌ Página bloqueada por Cloudflare');
      return false;
    }
    
    // Si hay contenido pero no capítulos, esperar más
    if (debugInfo.bodyLength > 1000 && debugInfo.capituloLinks === 0) {
      console.warn('[waitForCloudflareChallenge] ⚠️ Contenido cargado pero sin capítulos, esperando más...');
      await new Promise(resolve => setTimeout(resolve, 5000));
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
        waitUntil: 'networkidle0',
        timeout: 40000
      });
    } catch (navError) {
      console.log(`[Ikigai Chapters] Timeout en networkidle0, intentando con domcontentloaded...`);
      await page.goto(firstPageUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    }

    // Esperar a que Cloudflare complete su challenge
    const challengeSuccess = await waitForCloudflareChallenge(page, 25000);
    if (!challengeSuccess) {
      await browser.close();
      return res.status(500).json({
        error: 'Error cargando página',
        details: 'No se pudo superar el challenge de Cloudflare en página 1'
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
      console.log(`[Ikigai Chapters] ===== PROCESANDO PÁGINA ${pageNum} =====`);

      try {
        const pageUrl = `${baseUrl}?pagina=${pageNum}`;
        console.log(`[Ikigai Chapters] Navegando a: ${pageUrl}`);
        
        // Navegar a la página con networkidle0 para asegurar que todo cargue
        try {
          await page.goto(pageUrl, {
            waitUntil: 'networkidle0',
            timeout: 40000
          });
        } catch (navError) {
          console.warn(`[Ikigai Chapters] Timeout en networkidle0, intentando con domcontentloaded...`);
          await page.goto(pageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
        }
        
        console.log(`[Ikigai Chapters] Navegación completada para página ${pageNum}`);
        
        // CRÍTICO: Esperar challenge de Cloudflare en CADA página
        console.log(`[Ikigai Chapters] Esperando challenge de Cloudflare para página ${pageNum}...`);
        const challengeSuccess = await waitForCloudflareChallenge(page, 25000);
        
        if (!challengeSuccess) {
          console.error(`[Ikigai Chapters] ❌ Challenge de Cloudflare falló en página ${pageNum}, saltando...`);
          continue;
        }
        
        console.log(`[Ikigai Chapters] ✓ Challenge completado para página ${pageNum}`);

        // Extraer capítulos
        const pageChapters = await extractChaptersFromPage(page);
        console.log(`[Ikigai Chapters] Página ${pageNum}: ${pageChapters.length} capítulos encontrados`);
        
        if (pageChapters.length > 0) {
          console.log(`[Ikigai Chapters] ✅ Rango: Cap ${pageChapters[0]?.chapter} - Cap ${pageChapters[pageChapters.length - 1]?.chapter}`);
          allChaptersArrays.push(pageChapters);
        } else {
          console.error(`[Ikigai Chapters] ❌ No se encontraron capítulos en página ${pageNum}`);
          
          // Debug
          const debugInfo = await page.evaluate(() => {
            const allLinks = document.querySelectorAll('a');
            const capituloLinks = document.querySelectorAll('a[href*="/capitulo/"]');
            return {
              url: window.location.href,
              totalLinks: allLinks.length,
              capituloLinks: capituloLinks.length,
              bodyLength: document.body.innerText.length,
              title: document.title
            };
          });
          console.log(`[Ikigai Chapters] Debug:`, JSON.stringify(debugInfo, null, 2));
        }

      } catch (error) {
        console.error(`[Ikigai Chapters] ❌ Error en página ${pageNum}:`, error.message);
        
        // Intentar extraer capítulos de todas formas
        try {
          const pageChapters = await extractChaptersFromPage(page);
          if (pageChapters.length > 0) {
            console.log(`[Ikigai Chapters] ✅ Recuperados ${pageChapters.length} capítulos después del error`);
            allChaptersArrays.push(pageChapters);
          }
        } catch (e) {
          console.error(`[Ikigai Chapters] No se pudieron recuperar capítulos:`, e.message);
        }
        
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
