import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
    const baseUrl = `https://viralikigai.eurofiyati.online/series/${slug}`;

    console.log(`[Ikigai Chapters] Iniciando extracción para: ${slug}`);

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

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

    let allChapters = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 20; // Seguridad: límite máximo

    while (hasMorePages && currentPage <= maxPages) {
      const url = currentPage === 1
        ? baseUrl
        : `${baseUrl}?pagina=${currentPage}`;

      console.log(`[Ikigai Chapters] Página ${currentPage}: ${url}`);

      try {
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 8000
        });

        // Esperar a que carguen capítulos
        // Intentar múltiples selectores posibles
        const possibleChapterSelectors = [
          '.chapter',
          '.capitulo',
          '.episode',
          'li.chapter',
          'li.capitulo',
          '.chapter-item',
          '.capitulo-item',
          'a[href*="/leer/"]',
          'a[href*="/read/"]',
          '.chapters-list li',
          '.capitulos-list li'
        ];

        let chapterSelector = null;
        for (const selector of possibleChapterSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 4000 });
            chapterSelector = selector;
            console.log(`[Ikigai Chapters] Selector de capítulos encontrado: ${selector}`);
            break;
          } catch (e) {
            continue;
          }
        }

        if (!chapterSelector) {
          console.warn(`[Ikigai Chapters] No se encontraron capítulos en página ${currentPage}`);
          hasMorePages = false;
          break;
        }

        // Extraer capítulos de esta página
        const chaptersOnPage = await page.evaluate((selector) => {
          const items = document.querySelectorAll(selector);

          return Array.from(items).map(item => {
            // Intentar extraer el link
            let link = null;
            if (item.tagName === 'A') {
              link = item;
            } else {
              link = item.querySelector('a');
            }

            if (!link?.href) return null;

            // Intentar extraer el número de capítulo de múltiples formas
            const linkText = link.textContent || '';
            const linkHref = link.href || '';

            // Buscar número en el texto
            const textMatch = linkText.match(/cap[íi]tulo\s*(\d+\.?\d*)|chapter\s*(\d+\.?\d*)|#\s*(\d+\.?\d*)|(\d+\.?\d*)/i);

            // Buscar número en la URL
            const urlMatch = linkHref.match(/\/leer\/[^\/]+-(\d+\.?\d*)|\/read\/[^\/]+-(\d+\.?\d*)|chapter-(\d+\.?\d*)|capitulo-(\d+\.?\d*)/i);

            let chapter = '';
            if (textMatch) {
              chapter = textMatch[1] || textMatch[2] || textMatch[3] || textMatch[4];
            } else if (urlMatch) {
              chapter = urlMatch[1] || urlMatch[2] || urlMatch[3] || urlMatch[4];
            }

            if (!chapter) return null;

            const title = linkText.trim() || `Capítulo ${chapter}`;

            return {
              chapter,
              title: title,
              url: link.href
            };
          }).filter(item => item !== null && item.chapter);
        }, chapterSelector);

        console.log(`[Ikigai Chapters] Página ${currentPage}: ${chaptersOnPage.length} capítulos encontrados`);

        if (chaptersOnPage.length === 0) {
          hasMorePages = false;
          break;
        }

        allChapters.push(...chaptersOnPage);

        // Verificar si hay siguiente página
        const hasNextButton = await page.evaluate(() => {
          // Buscar botón de siguiente página
          const nextSelectors = [
            'button.next-page',
            'a.next-page',
            'button.siguiente',
            'a.siguiente',
            '.pagination .next',
            '.pagination a[rel="next"]',
            'a[aria-label="Next"]',
            'button[aria-label="Next"]'
          ];

          for (const selector of nextSelectors) {
            const btn = document.querySelector(selector);
            if (btn && !btn.disabled && !btn.classList.contains('disabled')) {
              return true;
            }
          }

          // También verificar si hay enlace a la página siguiente
          const currentPageNum = new URLSearchParams(window.location.search).get('pagina') || '1';
          const nextPageNum = parseInt(currentPageNum) + 1;
          const nextPageLink = document.querySelector(`a[href*="pagina=${nextPageNum}"]`);

          return !!nextPageLink;
        });

        if (hasNextButton && chaptersOnPage.length > 0) {
          currentPage++;
          // Pequeña pausa entre páginas
          await page.waitForTimeout(500);
        } else {
          hasMorePages = false;
        }

      } catch (error) {
        console.error(`[Ikigai Chapters] Error en página ${currentPage}:`, error.message);
        hasMorePages = false;
      }
    }

    // Ordenar capítulos por número (descendente: 172 → 1)
    allChapters.sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return numB - numA;
    });

    // Eliminar duplicados (por número de capítulo)
    const uniqueChapters = allChapters.reduce((acc, current) => {
      const exists = acc.find(ch => ch.chapter === current.chapter);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    console.log(`[Ikigai Chapters] Total capítulos únicos: ${uniqueChapters.length}`);

    await browser.close();

    return res.status(200).json({
      chapters: uniqueChapters,
      total: uniqueChapters.length,
      pagesScanned: currentPage - 1
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
