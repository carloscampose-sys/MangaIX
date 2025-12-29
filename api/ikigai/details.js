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

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });

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
    const details = await page.evaluate(() => {
      // Título
      const titleSelectors = ['.obra-titulo', '.title', 'h1', '.series-title'];
      let title = '';
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          title = el.textContent.trim();
          break;
        }
      }

      // Portada
      const coverSelectors = ['.obra-portada img', '.cover img', '.poster img', 'img.series-cover'];
      let cover = '';
      for (const selector of coverSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          cover = el.src;
          break;
        }
      }

      // Sinopsis
      const synopsisSelectors = ['.sinopsis-container', '.synopsis', '.description', '.summary'];
      let synopsis = '';
      for (const selector of synopsisSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          synopsis = el.textContent.trim();
          break;
        }
      }

      // Autor
      const authorSelectors = ['.autor', '.author', '.creador', 'span:contains("Autor")'];
      let author = '';
      for (const selector of authorSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          author = el.textContent.trim();
          break;
        }
      }

      // Estado
      const statusSelectors = ['.estado', '.status', 'span:contains("Estado")'];
      let status = '';
      for (const selector of statusSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          status = el.textContent.trim();
          break;
        }
      }

      // Géneros
      const genreSelectors = ['.genero-tag', '.genre', '.tag', '.category'];
      let genreElements = [];
      for (const selector of genreSelectors) {
        genreElements = document.querySelectorAll(selector);
        if (genreElements.length > 0) break;
      }

      const genres = Array.from(genreElements).map(el => el.textContent.trim());

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
