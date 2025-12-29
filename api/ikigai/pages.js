import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, chapter } = req.body;

  if (!slug || !chapter) {
    return res.status(400).json({ error: 'Slug and chapter are required' });
  }

  let browser = null;

  try {
    // Construir URL del capítulo (ajustar según estructura real)
    const chapterUrl = `https://viralikigai.eurofiyati.online/leer/${slug}-${chapter}`;
    console.log('[Ikigai Pages] URL:', chapterUrl);

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

    // Bloquear ads y recursos innecesarios
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'facebook', 'google-analytics', 'doubleclick', 'tracking'];
      const url = request.url().toLowerCase();
      const resourceType = request.resourceType();

      // Bloquear ads y analytics
      if (blockedResources.some(r => url.includes(r))) {
        request.abort();
        return;
      }

      // Bloquear imágenes de ads
      if (resourceType === 'image' && url.includes('ad')) {
        request.abort();
        return;
      }

      request.continue();
    });

    await page.goto(chapterUrl, {
      waitUntil: 'networkidle2',
      timeout: 8000
    });

    // Esperar a que carguen imágenes REALES (no loaders)
    const imageSelectors = [
      '#lector img',
      '.pagina img',
      '.reader img',
      '.chapter-images img',
      'img.chapter-page',
      '.manga-image img'
    ];

    let imagesLoaded = false;
    for (const selector of imageSelectors) {
      try {
        await page.waitForFunction(
          (sel) => {
            const images = document.querySelectorAll(sel);
            return images.length > 0 &&
                   Array.from(images).some(img =>
                     img.complete &&
                     img.naturalHeight > 0 &&
                     !img.src.includes('loader') &&
                     !img.src.includes('placeholder')
                   );
          },
          { timeout: 6000 },
          selector
        );
        imagesLoaded = true;
        console.log(`[Ikigai Pages] Selector encontrado: ${selector}`);
        break;
      } catch (e) {
        // Selector no válido, continuar
      }
    }

    if (!imagesLoaded) {
      console.log('[Ikigai Pages] No se encontraron imágenes válidas');
      await browser.close();
      return res.status(200).json({ pages: [], total: 0 });
    }

    // Extraer URLs de imágenes
    const imageUrls = await page.evaluate(() => {
      const selectors = [
        '#lector img',
        '.pagina img',
        '.reader img',
        '.chapter-images img',
        'img.chapter-page',
        '.manga-image img'
      ];

      let images = [];
      for (const selector of selectors) {
        images = document.querySelectorAll(selector);
        if (images.length > 0) break;
      }

      return Array.from(images)
        .map(img => img.src)
        .filter(src =>
          src &&
          !src.includes('loader') &&
          !src.includes('placeholder') &&
          !src.includes('base64') &&
          src.startsWith('http')
        );
    });

    console.log(`[Ikigai Pages] ${imageUrls.length} imágenes encontradas`);

    await browser.close();

    return res.status(200).json({
      pages: imageUrls,
      total: imageUrls.length
    });

  } catch (error) {
    console.error('[Ikigai Pages] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error obteniendo páginas',
      details: error.message
    });
  }
}
