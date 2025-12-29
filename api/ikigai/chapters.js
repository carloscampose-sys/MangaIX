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
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // Bloquear recursos innecesarios
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'facebook', 'google-analytics'];
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
          timeout: 6000
        });

        // Esperar a que carguen capítulos
        const chapterSelectors = [
          '.capitulo-item',
          '.chapter-item',
          '.list-group-item',
          'a[href*="/leer/"]',
          'li.chapter'
        ];

        let chaptersLoaded = false;
        for (const selector of chapterSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            chaptersLoaded = true;
            console.log(`[Ikigai Chapters] Selector encontrado: ${selector}`);
            break;
          } catch (e) {
            // Selector no válido, continuar
          }
        }

        if (!chaptersLoaded) {
          console.log(`[Ikigai Chapters] No se encontraron capítulos en página ${currentPage}`);
          break;
        }

        // Extraer capítulos de esta página
        const chaptersOnPage = await page.evaluate(() => {
          // Intentar múltiples selectores para capítulos
          const selectors = [
            '.capitulo-item',
            '.chapter-item',
            '.list-group-item',
            'li.chapter',
            'a[href*="/leer/"]'
          ];

          let items = [];
          for (const selector of selectors) {
            items = document.querySelectorAll(selector);
            if (items.length > 0) break;
          }

          return Array.from(items).map(item => {
            // Encontrar link
            const link = item.tagName === 'A' ? item : item.querySelector('a');
            if (!link) return null;

            const href = link.href;

            // Extraer texto del capítulo
            const chapterSelectors = [
              '.capitulo-numero',
              '.chapter-number',
              '.num-cap',
              'strong',
              'span'
            ];
            let chapterText = '';
            for (const selector of chapterSelectors) {
              const el = item.querySelector(selector);
              if (el) {
                chapterText = el.textContent.trim();
                break;
              }
            }

            if (!chapterText) {
              chapterText = link.textContent.trim();
            }

            // Extraer número de capítulo
            const chapterMatch = chapterText.match(/\d+/);
            const chapter = chapterMatch ? chapterMatch[0] : '';

            // Título opcional
            const titleSelectors = [
              '.capitulo-titulo',
              '.chapter-title',
              'span:not(:contains("Capítulo"))'
            ];
            let title = '';
            for (const selector of titleSelectors) {
              const el = item.querySelector(selector);
              if (el && !el.textContent.includes('Capítulo')) {
                title = el.textContent.trim();
                break;
              }
            }

            return {
              chapter,
              title: `Capítulo ${chapter}${title ? ' - ' + title : ''}`,
              url: href
            };
          }).filter(Boolean); // Filtrar nulls
        });

        console.log(`[Ikigai Chapters] Página ${currentPage}: ${chaptersOnPage.length} capítulos encontrados`);

        allChapters.push(...chaptersOnPage);

        // Verificar si hay siguiente página
        const hasNextSelectors = [
          'button.next-page',
          'a.siguiente',
          'a[rel="next"]',
          '.pagination .next'
        ];

        let hasNext = false;
        for (const selector of hasNextSelectors) {
          try {
            const btn = await page.$(selector);
            if (btn) {
              const isDisabled = await page.evaluate(el => {
                return el.disabled || el.classList.contains('disabled');
              }, btn);
              if (!isDisabled) {
                hasNext = true;
                break;
              }
            }
          } catch (e) {
            // Selector no válido, continuar
          }
        }

        // También verificar por URL de navegación
        if (!hasNext) {
          hasNext = await page.evaluate(() => {
            const paginationLinks = document.querySelectorAll('.pagination a');
            for (const link of paginationLinks) {
              const text = link.textContent.trim();
              const pageUrl = link.href;
              if (text === 'Siguiente' || text === 'Next') {
                return true;
              }
            }
            return false;
          });
        }

        if (hasNext && chaptersOnPage.length > 0) {
          currentPage++;
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
      const numA = parseInt(a.chapter) || 0;
      const numB = parseInt(b.chapter) || 0;
      return numB - numA;
    });

    // Eliminar duplicados
    const uniqueChapters = allChapters.reduce((acc, current) => {
      const exists = acc.find(ch => ch.chapter === current.chapter);
      if (!exists) acc.push(current);
      return acc;
    }, []);

    console.log(`[Ikigai Chapters] Total capítulos: ${uniqueChapters.length}`);

    await browser.close();

    return res.status(200).json({
      chapters: uniqueChapters,
      total: uniqueChapters.length
    });

  } catch (error) {
    console.error('[Ikigai Chapters] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error obteniendo capítulos',
      details: error.message
    });
  }
}
