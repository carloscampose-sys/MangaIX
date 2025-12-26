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

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });

    // Esperar a que cargue el contenido (Qwik framework)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // CRÍTICO: Manejar botón "Ver más" en sinopsis
    // Buscar todos los botones y buscar por texto
    try {
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && text.toLowerCase().includes('ver más')) {
          console.log('[Ikigai Details] Botón "Ver más" encontrado');
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('[Ikigai Details] Sinopsis expandida');
          break;
        }
      }
    } catch (e) {
      console.warn('[Ikigai Details] No se encontró botón "Ver más" o error al expandir:', e.message);
    }

    // Extraer detalles completos
    const details = await page.evaluate(() => {
      // Buscar título - generalmente un h1 o h2 prominente
      const titleElement = document.querySelector('h1') ||
                          document.querySelector('h2') ||
                          document.querySelector('[class*="title"]');
      const title = titleElement?.textContent?.trim() || '';

      // Buscar portada - primera imagen grande que no sea avatar
      const images = document.querySelectorAll('img');
      let cover = '';
      for (const img of images) {
        const src = img.src || img.srcset?.split(' ')[0];
        // Evitar avatares y logos pequeños
        if (src && !src.includes('avatar') && !src.includes('logo') && img.naturalHeight > 100) {
          cover = src;
          break;
        }
      }

      // Buscar sinopsis - buscar por varios patrones
      let synopsis = '';
      const possibleSynopsisElements = [
        document.querySelector('p[class*="synopsis"]'),
        document.querySelector('p[class*="description"]'),
        document.querySelector('div[class*="synopsis"]'),
        document.querySelector('div[class*="description"]'),
        // Buscar el primer párrafo largo (más de 100 caracteres)
        ...Array.from(document.querySelectorAll('p')).filter(p => p.textContent.length > 100)
      ];

      for (const el of possibleSynopsisElements) {
        if (el && el.textContent.trim().length > 50) {
          synopsis = el.textContent.trim();
          break;
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
