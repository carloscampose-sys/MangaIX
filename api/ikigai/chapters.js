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
    const baseUrl = `https://viralikigai.foodib.net/series/${slug}`;

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

    // Navegar a la página de la serie
    const url = baseUrl;
    console.log(`[Ikigai Chapters] Navegando a: ${url}`);

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (navError) {
      console.log(`[Ikigai Chapters] Timeout en navegación, continuando...`);
    }

    // CRÍTICO: Esperar a que Cloudflare complete su challenge
    try {
      await page.waitForFunction(() => {
        const title = document.title;
        const bodyText = document.body ? document.body.innerText : '';

        return !title.includes('500') &&
          !title.includes('Just a moment') &&
          !title.includes('Error') &&
          !bodyText.includes('Checking your browser') &&
          bodyText.length > 100;
      }, { timeout: 20000 });

      console.log(`[Ikigai Chapters] ✓ Challenge completado`);
    } catch (e) {
      console.warn(`[Ikigai Chapters] Timeout challenge, reintentando...`);

      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (reloadError) {
        console.error(`[Ikigai Chapters] Error reload`);
        await browser.close();
        return res.status(500).json({
          error: 'Error cargando página',
          details: 'No se pudo superar el challenge de Cloudflare'
        });
      }
    }

    // Espera adicional para Qwik
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[Ikigai Chapters] Intentando cargar todos los capítulos con scroll...');

    // Hacer scroll para cargar todos los capítulos (scroll infinito)
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 30; // Máximo 30 scrolls

    while (scrollAttempts < maxScrollAttempts) {
      // Hacer scroll hasta el final
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Esperar a que cargue contenido nuevo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar si hay un botón "Cargar más" y hacer clic
      const loadMoreClicked = await page.evaluate(() => {
        const loadMoreSelectors = [
          'button:contains("Cargar")',
          'button:contains("Ver más")',
          'button:contains("Load")',
          '.load-more',
          '[class*="load"]',
          '[class*="more"]'
        ];

        for (const selector of loadMoreSelectors) {
          try {
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
          } catch (e) {
            // Continuar con el siguiente selector
          }
        }
        return false;
      });

      if (loadMoreClicked) {
        console.log('[Ikigai Chapters] Botón "Cargar más" clickeado');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Verificar si la altura cambió (se cargó más contenido)
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);

      if (currentHeight === previousHeight) {
        // No hay más contenido para cargar
        console.log('[Ikigai Chapters] No se detectó más contenido nuevo');
        break;
      }

      previousHeight = currentHeight;
      scrollAttempts++;
      console.log(`[Ikigai Chapters] Scroll ${scrollAttempts}: altura ${currentHeight}px`);
    }

    console.log(`[Ikigai Chapters] Scroll completado después de ${scrollAttempts} intentos`);

    // Extraer todos los capítulos de la página
    const allChapters = await page.evaluate(() => {
      console.log('[Ikigai Chapters Eval] Buscando capítulos...');

      // Buscar TODOS los enlaces de la página
      const allLinks = Array.from(document.querySelectorAll('a'));
      console.log('[Ikigai Chapters Eval] Total enlaces en página:', allLinks.length);

      // Filtrar enlaces que parecen ser capítulos
      const chapterLinks = allLinks.filter(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent || '';

        // ACTUALIZADO: Filtrar enlaces que parecen ser capítulos
        // Ikigai usa /capitulo/{ID}/ para los capítulos
        return (
          href.includes('/capitulo/') ||  // NUEVO: patrón principal de Ikigai
          href.includes('/leer/') ||
          href.includes('/read/') ||
          href.includes('/cap') ||
          href.includes('/chapter') ||
          text.match(/cap[íi]tulo\s*\d+/i) ||
          text.match(/chapter\s*\d+/i) ||
          text.match(/cap\s*\d+/i) ||
          text.match(/^#?\s*\d+(\.\d+)?$/)
        );
      });

      console.log('[Ikigai Chapters Eval] Enlaces filtrados:', chapterLinks.length);

      // Procesar enlaces encontrados
      return chapterLinks.map((link, index) => {
        const href = link.getAttribute('href');
        if (!href) return null;

        let chapter = '';

        // Estrategia 1: Extraer del texto del enlace (más confiable)
        const text = link.textContent || '';
        const textPatterns = [
          /cap[íi]tulo\s*(\d+\.?\d*)/i,
          /chapter\s*(\d+\.?\d*)/i,
          /cap\s*\.*\s*(\d+\.?\d*)/i,
          /#\s*(\d+\.?\d*)/,
          /^\s*(\d+\.?\d*)\s*$/  // Solo número
        ];

        for (const pattern of textPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            chapter = match[1];
            break;
          }
        }

        // Estrategia 2: Si el enlace es de tipo /capitulo/{ID}/
        // usar el índice del enlace como número de capítulo
        if (!chapter && href.includes('/capitulo/')) {
          // Intentar extraer del texto primero
          const textMatch = text.match(/(\d+\.?\d*)/);
          if (textMatch && textMatch[1]) {
            chapter = textMatch[1];
          }
        }

        // Estrategia 3: Extraer del URL (como fallback)
        if (!chapter) {
          const urlPatterns = [
            /-(\d+\.?\d*)\/?$/,  // Número al final: serie-123/
            /-(\d+\.?\d*)-/,  // Número en medio: serie-123-algo
            /cap(?:itulo)?-(\d+\.?\d*)/i,  // capitulo-123 o cap-123
            /chapter-(\d+\.?\d*)/i,  // chapter-123
            /\/(\d+\.?\d*)\/?$/  // /123/ al final
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

        const title = link.textContent?.trim() || `Capítulo ${chapter}`;

        return {
          chapter,
          title: title.substring(0, 200), // Limitar longitud
          url: href.startsWith('http') ? href : `https://viralikigai.foodib.net${href}`
        };
      }).filter(item => item !== null && item.chapter);
    });

    console.log(`[Ikigai Chapters] Total capítulos encontrados: ${allChapters.length}`);

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
      scrollAttempts
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
