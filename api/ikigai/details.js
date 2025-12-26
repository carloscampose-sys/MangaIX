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
    const url = `https://viralikigai.foodib.net/series/${slug}`;

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
    console.log('[Ikigai Details] Navegando a:', url);

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (e) {
      console.log('[Ikigai Details] Timeout en navegación, continuando...');
    }

    // CRÍTICO: Esperar a que Cloudflare complete su challenge JavaScript
    console.log('[Ikigai Details] Esperando challenge de Cloudflare...');

    try {
      // Esperar a que la página sea válida (no error 500)
      await page.waitForFunction(() => {
        const title = document.title;
        const bodyText = document.body ? document.body.innerText : '';

        // Verificar que NO sea página de error o challenge
        return !title.includes('500') &&
          !title.includes('Just a moment') &&
          !title.includes('Error') &&
          !bodyText.includes('Checking your browser') &&
          bodyText.length > 100;
      }, { timeout: 20000 });

      console.log('[Ikigai Details] ✓ Cloudflare challenge completado');
    } catch (e) {
      console.warn('[Ikigai Details] Timeout esperando challenge, reintentando...');

      // Intentar recargar
      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (reloadError) {
        console.error('[Ikigai Details] Error en reload:', reloadError.message);
      }
    }

    // Espera adicional para renderizado completo
    await new Promise(resolve => setTimeout(resolve, 3000));

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

    // Extraer detalles completos con selectores más flexibles
    const details = await page.evaluate(() => {
      console.log('[Ikigai Details Eval] Buscando elementos...');

      // Buscar título - múltiples estrategias
      let title = '';
      const titleSelectors = [
        'h1',
        'h2',
        '[class*="title"]',
        '[class*="titulo"]',
        '[class*="name"]',
        '[class*="nombre"]'
      ];

      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim().length > 0 && el.textContent.trim().length < 200) {
          title = el.textContent.trim();
          console.log('[Ikigai Details Eval] Título encontrado con selector:', selector);
          break;
        }
      }

      // Si no se encontró, usar el primer h1 o h2 que tenga contenido
      if (!title) {
        const headings = document.querySelectorAll('h1, h2');
        for (const h of headings) {
          const text = h.textContent.trim();
          if (text.length > 0 && text.length < 200) {
            title = text;
            console.log('[Ikigai Details Eval] Título encontrado en heading:', text.substring(0, 50));
            break;
          }
        }
      }

      // Buscar portada - estrategia mejorada
      let cover = '';
      const images = Array.from(document.querySelectorAll('img'));

      // Primero buscar imágenes con palabras clave en src o alt
      for (const img of images) {
        const src = img.src || img.srcset?.split(' ')[0] || '';
        const alt = img.alt || '';

        if (src && (
          src.includes('cover') ||
          src.includes('portada') ||
          src.includes('poster') ||
          alt.toLowerCase().includes('cover') ||
          alt.toLowerCase().includes('portada')
        )) {
          cover = src;
          console.log('[Ikigai Details Eval] Portada encontrada por keyword:', src.substring(0, 80));
          break;
        }
      }

      // Si no se encontró, buscar la imagen más grande
      if (!cover) {
        let largestImg = null;
        let maxSize = 0;

        for (const img of images) {
          const src = img.src || img.srcset?.split(' ')[0];
          if (!src) continue;

          // Evitar avatares, logos, botones
          if (src.includes('avatar') || src.includes('logo') || src.includes('btn') ||
            src.includes('icon') || img.width < 100 || img.height < 100) {
            continue;
          }

          const size = img.naturalWidth * img.naturalHeight;
          if (size > maxSize) {
            maxSize = size;
            largestImg = src;
          }
        }

        if (largestImg) {
          cover = largestImg;
          console.log('[Ikigai Details Eval] Portada encontrada (imagen más grande)');
        }
      }

      // Buscar sinopsis - estrategia exhaustiva
      let synopsis = '';

      // Primero buscar con selectores específicos
      const synopsisSelectors = [
        'p:not(.line-clamp-3)',  // Buscar párrafos NO truncados primero
        '[class*="synopsis"]',
        '[class*="description"]',
        '[class*="sinopsis"]',
        '[class*="descripcion"]',
        '[id*="synopsis"]',
        '[id*="description"]',
        '[id*="sinopsis"]',
        'p.line-clamp-3',  // Como último recurso, el truncado
      ];

      for (const selector of synopsisSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent.trim();
          // Buscar texto entre 50 y 5000 caracteres
          if (text.length > 50 && text.length < 5000) {
            // Evitar textos que claramente no son sinopsis
            if (!text.includes('Iniciar sesión') &&
              !text.includes('Registrarse') &&
              !text.includes('Con el tiempo se añadirán') &&
              !text.match(/^\d+\s*(de cada|mil)/) &&
              !text.includes('Política de privacidad')) {
              synopsis = text;
              console.log('[Ikigai Details Eval] Sinopsis encontrada con selector:', selector, 'longitud:', text.length);
              break;
            }
          }
        }
        if (synopsis && synopsis.length > 100) break; // Solo salir si encontramos una sinopsis decente
      }

      // Si no se encontró, buscar párrafos largos
      if (!synopsis || synopsis.length < 30) {
        console.log('[Ikigai Details Eval] Buscando párrafos largos...');
        const paragraphs = Array.from(document.querySelectorAll('p'));

        // Ordenar por longitud (más largos primero)
        paragraphs.sort((a, b) => b.textContent.length - a.textContent.length);

        for (const p of paragraphs) {
          const text = p.textContent.trim();
          // Buscar párrafos entre 100 y 5000 caracteres
          if (text.length >= 100 && text.length <= 5000) {
            // Evitar párrafos que parecen ser navegación o metadata
            if (!text.includes('Iniciar sesión') &&
              !text.includes('Registrarse') &&
              !text.includes('Con el tiempo se añadirán') &&
              !text.includes('Política de privacidad') &&
              !text.match(/^\d+\s*(de cada|mil)/)) {
              synopsis = text;
              console.log('[Ikigai Details Eval] Sinopsis encontrada en párrafo, longitud:', text.length);
              break;
            }
          }
        }
      }

      // Limpiar sinopsis
      if (synopsis) {
        synopsis = synopsis
          .replace(/ver más/gi, '')
          .replace(/leer más/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Buscar autor
      let author = 'Desconocido';
      const authorPatterns = [
        /Autor[:\s]+([^\n]+)/i,
        /Author[:\s]+([^\n]+)/i,
        /Artista[:\s]+([^\n]+)/i,
        /Artist[:\s]+([^\n]+)/i
      ];

      const bodyText = document.body.textContent;
      for (const pattern of authorPatterns) {
        const match = bodyText.match(pattern);
        if (match && match[1]) {
          author = match[1].trim().substring(0, 100);
          console.log('[Ikigai Details Eval] Autor encontrado:', author);
          break;
        }
      }

      // Buscar estado
      let status = '';
      const statusSelectors = [
        '[class*="status"]',
        '[class*="estado"]',
        '[class*="state"]'
      ];

      for (const selector of statusSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          status = el.textContent.trim();
          if (status.length > 0 && status.length < 50) {
            console.log('[Ikigai Details Eval] Estado encontrado:', status);
            break;
          }
        }
      }

      // Buscar géneros
      const genreSelectors = [
        'a[href*="genero"]',
        'a[href*="genre"]',
        '[class*="tag"]',
        '[class*="genre"]',
        '[class*="genero"]',
        '[class*="badge"]'
      ];

      let genres = [];
      for (const selector of genreSelectors) {
        const elements = document.querySelectorAll(selector);
        const found = Array.from(elements)
          .map(el => el.textContent.trim())
          .filter(g => g && g.length > 0 && g.length < 50 && !g.match(/^\d+$/));

        if (found.length > 0) {
          genres = found;
          console.log('[Ikigai Details Eval] Géneros encontrados:', genres.length);
          break;
        }
      }

      return {
        title: title || 'Título no disponible',
        cover: cover || '',
        synopsis: synopsis || 'Sin sinopsis disponible',
        author,
        status,
        genres: genres.slice(0, 10)
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
