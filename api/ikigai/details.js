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

    // CRÍTICO: Manejar botón "Ver más" en sinopsis
    const possibleVerMasSelectors = [
      'button:has-text("Ver más")',
      'button:has-text("ver más")',
      'button:has-text("Ver Más")',
      '.ver-mas-btn',
      'a:has-text("Ver más")',
      '.expand-synopsis',
      'button.expand-btn',
      '.show-more',
      'button.show-more'
    ];

    let verMasButton = null;
    for (const selector of possibleVerMasSelectors) {
      try {
        // Usar método diferente según el selector
        if (selector.includes(':has-text')) {
          // Usar XPath para buscar por texto
          const buttons = await page.$$('button');
          for (const button of buttons) {
            const text = await page.evaluate(el => el.textContent, button);
            if (text && text.toLowerCase().includes('ver más')) {
              verMasButton = button;
              console.log(`[Ikigai Details] Botón "Ver más" encontrado por texto`);
              break;
            }
          }
          if (verMasButton) break;
        } else {
          verMasButton = await page.$(selector);
          if (verMasButton) {
            console.log(`[Ikigai Details] Botón "Ver más" encontrado: ${selector}`);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (verMasButton) {
      try {
        await verMasButton.click();
        await page.waitForTimeout(500);
        console.log('[Ikigai Details] Sinopsis expandida');
      } catch (e) {
        console.warn('[Ikigai Details] Error al expandir sinopsis:', e.message);
      }
    }

    // Extraer detalles completos
    const details = await page.evaluate(() => {
      // Múltiples selectores posibles para cada campo
      const titleSelectors = [
        'h1',
        '.serie-title',
        '.manga-title',
        '.title',
        'header h1',
        'header h2'
      ];

      const coverSelectors = [
        '.serie-cover img',
        '.manga-cover img',
        '.cover img',
        'aside img',
        '.thumbnail img',
        'img[alt*="portada"]'
      ];

      const synopsisSelectors = [
        '.synopsis',
        '.sinopsis',
        '.description',
        '.descripcion',
        '.summary',
        '[class*="synopsis"]',
        '[class*="description"]'
      ];

      const authorSelectors = [
        '.author',
        '.autor',
        '[class*="author"]',
        '.creator'
      ];

      const statusSelectors = [
        '.status',
        '.estado',
        '[class*="status"]',
        '.publication-status'
      ];

      const genreSelectors = [
        '.genre',
        '.genero',
        '.genres a',
        '.generos a',
        '[class*="genre"] a',
        '.tag',
        '.tags a'
      ];

      // Función helper para buscar elemento con múltiples selectores
      const findElement = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return element;
        }
        return null;
      };

      const findElements = (selectors) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) return Array.from(elements);
        }
        return [];
      };

      const titleElement = findElement(titleSelectors);
      const coverElement = findElement(coverSelectors);
      const synopsisElement = findElement(synopsisSelectors);
      const authorElement = findElement(authorSelectors);
      const statusElement = findElement(statusSelectors);
      const genreElements = findElements(genreSelectors);

      const title = titleElement?.textContent?.trim() || '';
      const cover = coverElement?.src || coverElement?.dataset?.src || '';
      const synopsis = synopsisElement?.textContent?.trim() || '';
      const author = authorElement?.textContent?.trim() || 'Desconocido';
      const status = statusElement?.textContent?.trim() || '';
      const genres = genreElements.map(el => el.textContent.trim()).filter(g => g);

      return {
        title,
        cover,
        synopsis,
        author,
        status,
        genres
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
