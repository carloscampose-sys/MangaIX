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
    const url = `https://viralikigai.eurofiyati.online/series/${slug}`;

    console.log('[Ikigai Details] URL:', url);

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

    // Anti-detección: inyectar código antes de navegar
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

    // Navegar con estrategia flexible para evitar timeouts
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (e) {
      console.log('[Ikigai Details] Timeout en navegación, continuando...');
    }

    // Esperar a que cargue el contenido (Qwik framework necesita más tiempo)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // CRÍTICO: Manejar botón "Ver más" en sinopsis
    // Buscar todos los botones y buscar por texto
    try {
      // Intentar múltiples selectores para el botón
      const buttonSelectors = [
        'button:has-text("Ver más")',
        'button:has-text("ver más")',
        'a:has-text("Ver más")',
        'button[class*="expand"]',
        'button[class*="more"]'
      ];

      let buttonFound = false;

      // Primero buscar con selectores específicos
      for (const selector of buttonSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 1000 });
          await page.click(selector);
          console.log(`[Ikigai Details] Botón "Ver más" encontrado con selector: ${selector}`);
          await new Promise(resolve => setTimeout(resolve, 500));
          buttonFound = true;
          break;
        } catch (e) {
          // Intentar siguiente selector
        }
      }

      // Si no funcionó, buscar manualmente
      if (!buttonFound) {
        const buttons = await page.$$('button, a');
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text && (text.toLowerCase().includes('ver más') || text.toLowerCase().includes('leer más'))) {
            console.log('[Ikigai Details] Botón "Ver más" encontrado manualmente');
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('[Ikigai Details] Sinopsis expandida');
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[Ikigai Details] No se encontró botón "Ver más" o error al expandir:', e.message);
    }

    // Logging adicional para debugging
    console.log('[Ikigai Details] Iniciando extracción de datos...');

    // Verificar contenido de la página
    const htmlLength = await page.evaluate(() => document.documentElement.outerHTML.length);
    console.log('[Ikigai Details] Tamaño HTML:', htmlLength);

    // Extraer detalles completos
    const details = await page.evaluate(() => {
      console.log('[Ikigai Details Eval] Buscando elementos...');

      // Buscar título - generalmente un h1 o h2 prominente
      const titleElement = document.querySelector('h1') ||
                          document.querySelector('h2') ||
                          document.querySelector('[class*="title"]');
      const title = titleElement?.textContent?.trim() || '';
      console.log('[Ikigai Details Eval] Título encontrado:', title);

      // Buscar portada - primera imagen grande que no sea avatar
      const images = document.querySelectorAll('img');
      let cover = '';
      for (const img of images) {
        const src = img.src || img.srcset?.split(' ')[0];
        // Evitar avatares y logos pequeños
        if (src && !src.includes('avatar') && !src.includes('logo') && img.naturalHeight > 100) {
          cover = src;
          console.log('[Ikigai Details Eval] Portada encontrada:', src);
          break;
        }
      }

      // Buscar sinopsis - buscar por varios patrones
      let synopsis = '';
      const possibleSynopsisElements = [
        document.querySelector('p[class*="synopsis"]'),
        document.querySelector('p[class*="description"]'),
        document.querySelector('p[class*="sinopsis"]'),
        document.querySelector('div[class*="synopsis"]'),
        document.querySelector('div[class*="description"]'),
        document.querySelector('div[class*="sinopsis"]'),
        document.querySelector('div[id*="synopsis"]'),
        document.querySelector('div[id*="description"]'),
        // Buscar párrafos largos (más de 100 caracteres)
        ...Array.from(document.querySelectorAll('p')).filter(p => p.textContent.length > 100)
      ];

      for (const el of possibleSynopsisElements) {
        if (el && el.textContent.trim().length > 50) {
          synopsis = el.textContent.trim();
          // Limpiar texto duplicado si existe
          synopsis = synopsis.replace(/ver más/gi, '').trim();
          console.log('[Ikigai Details Eval] Sinopsis encontrada, longitud:', synopsis.length);
          break;
        }
      }

      // Si no se encontró sinopsis, buscar en todo el contenido
      if (!synopsis || synopsis.length < 30) {
        console.log('[Ikigai Details Eval] Sinopsis corta, buscando en divs...');
        const contentDivs = Array.from(document.querySelectorAll('div')).filter(div => {
          const text = div.textContent || '';
          return text.length > 150 && text.length < 1000;
        });

        console.log('[Ikigai Details Eval] Divs candidatos:', contentDivs.length);

        if (contentDivs.length > 0) {
          synopsis = contentDivs[0].textContent.trim();
          console.log('[Ikigai Details Eval] Sinopsis alternativa, longitud:', synopsis.length);
        }
      }

      // Buscar autor - puede estar en metadatos o texto
      const authorElement = document.querySelector('[class*="author"]') ||
                           document.querySelector('[class*="autor"]') ||
                           Array.from(document.querySelectorAll('*')).find(el =>
                             el.textContent.includes('Autor:') || el.textContent.includes('Author:')
                           );
      const author = authorElement?.textContent?.replace(/Autor:|Author:/gi, '').trim() || 'Desconocido';

      // Buscar estado
      const statusElement = document.querySelector('[class*="status"]') ||
                           document.querySelector('[class*="estado"]');
      const status = statusElement?.textContent?.trim() || '';

      // Buscar géneros - generalmente son enlaces o badges
      const genreElements = document.querySelectorAll('a[href*="genero"], a[href*="genre"], [class*="tag"], [class*="genre"]');
      const genres = Array.from(genreElements)
        .map(el => el.textContent.trim())
        .filter(g => g && g.length > 0 && g.length < 50); // Filtrar textos muy largos

      return {
        title,
        cover,
        synopsis: synopsis || 'Sin sinopsis disponible',
        author,
        status,
        genres: genres.slice(0, 10) // Máximo 10 géneros
      };
    });

    await browser.close();

    console.log(`[Ikigai Details] Detalles extraídos para: ${details.title}`);

    return res.status(200).json(details);

  } catch (error) {
    console.error('[Ikigai Details] Error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[Ikigai Details] Error cerrando browser:', e);
      }
    }

    return res.status(500).json({
      error: 'Error obteniendo detalles',
      details: error.message
    });
  }
}
