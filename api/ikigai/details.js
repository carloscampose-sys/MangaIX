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

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // CRÍTICO: Manejar botón "Ver más" en sinopsis
    const possibleSelectors = [
      'button:has-text("Ver más")',
      '.ver-mas-btn',
      'a:has-text("Ver más")',
      '.expand-synopsis',
      'button.expand-btn',
      '.btn-expand',
      '.show-more-btn'
    ];

    let verMasButton = null;
    let usedSelector = null;

    for (const selector of possibleSelectors) {
      try {
        verMasButton = await page.$(selector);
        if (verMasButton) {
          usedSelector = selector;
          console.log(`[Ikigai Details] Botón "Ver más" encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Selector no válido, continuar
      }
    }

    if (verMasButton) {
      try {
        await verMasButton.click();
        await page.waitForTimeout(500); // Esperar expansión
        console.log('[Ikigai Details] Sinopsis expandida');
      } catch (e) {
        console.log('[Ikigai Details] Error al hacer click en Ver más:', e.message);
      }
    } else {
      console.log('[Ikigai Details] No se encontró botón "Ver más"');
    }

    // Extraer detalles completos
    // Ikigai usa estructura simple: h1 para título, img para portada, etc.
    const details = await page.evaluate(() => {
      // Título - buscar h1 principal
      const titleEl = document.querySelector('h1');
      const title = titleEl ? titleEl.textContent.trim() : '';

      // Portada - buscar primera imagen grande (no avatars ni iconos)
      const allImages = document.querySelectorAll('img');
      let cover = '';
      for (const img of allImages) {
        const src = img.src || '';
        // Buscar imagen de CDN de ikigai (portadas están en image.ikigaimangas.cloud)
        if (src.includes('ikigaimangas.cloud') || src.includes('cloudflare')) {
          cover = src;
          break;
        }
      }
      // Fallback: primera imagen con srcset (suelen ser las de alta calidad)
      if (!cover) {
        const imgWithSrcset = document.querySelector('img[srcset]');
        if (imgWithSrcset) cover = imgWithSrcset.src;
      }

      // Sinopsis - buscar párrafos después del título
      // La sinopsis suele estar en un contenedor con texto largo
      let synopsis = '';
      const paragraphs = document.querySelectorAll('p');
      for (const p of paragraphs) {
        const text = p.textContent.trim();
        // Sinopsis suele tener más de 100 caracteres
        if (text.length > 100 && !text.includes('Capítulo')) {
          synopsis = text;
          break;
        }
      }

      // Estado - buscar links que contengan "estados[]"
      const statusLink = document.querySelector('a[href*="estados[]"]');
      let status = '';
      if (statusLink) {
        status = statusLink.textContent.trim();
      }

      // Géneros - buscar links que contengan "generos[]"
      const genreLinks = document.querySelectorAll('a[href*="generos[]"]');
      const genres = Array.from(genreLinks).map(link => link.textContent.trim());

      // Autor/Equipo - buscar links a grupos
      const authorLink = document.querySelector('a[href*="/grupos/"]');
      const author = authorLink ? authorLink.textContent.trim() : '';

      return {
        title,
        cover,
        synopsis,
        author,
        status,
        genres
      };
    });

    console.log('[Ikigai Details] Detalles extraídos:', details.title);

    await browser.close();

    return res.status(200).json(details);

  } catch (error) {
    console.error('[Ikigai Details] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error obteniendo detalles',
      details: error.message
    });
  }
}
