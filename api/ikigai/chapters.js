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

        // Esperar a que cargue el contenido (Qwik framework)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Buscar enlaces de capítulos
        // Estos típicamente contienen /leer/ o /read/ en la URL
        // También pueden estar en otras rutas
        try {
          await page.waitForSelector('a[href*="/leer/"], a[href*="/read/"], a[class*="chapter"], a[class*="capitulo"]', { timeout: 4000 });
          console.log(`[Ikigai Chapters] Enlaces de capítulos encontrados en página ${currentPage}`);
        } catch (e) {
          console.warn(`[Ikigai Chapters] No se encontraron capítulos en página ${currentPage}`);
          hasMorePages = false;
          break;
        }

        // Extraer capítulos de esta página
        const chaptersOnPage = await page.evaluate(() => {
          // Buscar todos los enlaces que apuntan a /leer/ o /read/
          // También buscar por clases que indiquen capítulos
          const chapterLinks = document.querySelectorAll('a[href*="/leer/"], a[href*="/read/"], a[class*="chapter"], a[class*="capitulo"]');

          return Array.from(chapterLinks).map(link => {
            const href = link.getAttribute('href');
            if (!href) return null;

            // Extraer número de capítulo de la URL
            // Formatos posibles:
            // /leer/serie-123-1/ (capítulo 1)
            // /leer/serie-123-capitulo-1/
            // /read/serie-name-1/
            let chapter = '';

            // Primero intentar con el patrón más específico (número al final)
            const urlMatch = href.match(/-(\d+\.?\d*)\/?\s*$/);
            if (urlMatch) {
              chapter = urlMatch[1];
            } else {
              // Intentar buscar "capitulo-X" o "chapter-X" o "cap-X"
              const chapterMatch = href.match(/(?:capitulo|chapter|cap)-(\d+\.?\d*)/i);
              if (chapterMatch) {
                chapter = chapterMatch[1];
              }
            }

            // Si no se pudo extraer del URL, intentar del texto del enlace
            if (!chapter) {
              const text = link.textContent || '';
              const textPatterns = [
                /cap[íi]tulo\s*(\d+\.?\d*)/i,
                /chapter\s*(\d+\.?\d*)/i,
                /cap\s*(\d+\.?\d*)/i,
                /#\s*(\d+\.?\d*)/,
                /(\d+\.?\d*)/
              ];

              for (const pattern of textPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                  chapter = match[1];
                  break;
                }
              }
            }

            if (!chapter) return null;

            const title = link.textContent?.trim() || `Capítulo ${chapter}`;

            return {
              chapter,
              title: title,
              url: href.startsWith('http') ? href : `https://viralikigai.eurofiyati.online${href}`
            };
          }).filter(item => item !== null && item.chapter);
        });

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
          await new Promise(resolve => setTimeout(resolve, 500));
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
