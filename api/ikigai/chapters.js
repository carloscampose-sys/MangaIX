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
          timeout: 30000
        });

        // Esperar a que carguen capítulos - Ikigai usa links a /leer/
        try {
          await page.waitForSelector('a[href*="/leer/"]', { timeout: 15000 });
          console.log('[Ikigai Chapters] Capítulos encontrados');
        } catch (e) {
          console.log(`[Ikigai Chapters] No se encontraron capítulos en página ${currentPage}`);
          break;
        }

        // Extraer capítulos de esta página
        // Estructura: cada capítulo está en un li con un link a /leer/[slug]-[chapter]
        const chaptersOnPage = await page.evaluate(() => {
          // Buscar todos los links a capítulos
          const chapterLinks = document.querySelectorAll('a[href*="/leer/"]');

          return Array.from(chapterLinks).map(link => {
            const href = link.href;

            // Extraer número de capítulo del href
            // Formato: /leer/slug-172 o /leer/slug-capitulo-172
            const urlMatch = href.match(/\/leer\/[^\/]+-(\d+)/);
            const chapter = urlMatch ? urlMatch[1] : '';

            if (!chapter) return null;

            // El texto del link suele tener el número del capítulo
            const linkText = link.textContent.trim();

            // Buscar título adicional si existe
            const title = linkText.includes('Capítulo')
              ? linkText
              : `Capítulo ${chapter}`;

            return {
              chapter,
              title,
              url: href
            };
          }).filter(Boolean);
        });

        console.log(`[Ikigai Chapters] Página ${currentPage}: ${chaptersOnPage.length} capítulos encontrados`);

        allChapters.push(...chaptersOnPage);

        // Verificar si hay siguiente página
        // Ikigai usa parámetro ?pagina=N
        const hasNext = await page.evaluate((currentPageNum) => {
          // Buscar links de paginación que contengan pagina=N+1
          const nextPageNum = currentPageNum + 1;
          const paginationLinks = document.querySelectorAll('a[href*="pagina="]');

          for (const link of paginationLinks) {
            if (link.href.includes(`pagina=${nextPageNum}`)) {
              return true;
            }
          }

          // También verificar si hay un botón o link "siguiente"
          const allLinks = document.querySelectorAll('a');
          for (const link of allLinks) {
            const text = link.textContent.toLowerCase().trim();
            if (text === 'siguiente' || text === 'next' || text === '→' || text === '>') {
              return true;
            }
          }

          return false;
        }, currentPage);

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
