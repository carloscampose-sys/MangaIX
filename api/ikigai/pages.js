import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, chapter, chapterId } = req.body;

  // Se requiere chapterId (el ID largo) para construir la URL correcta
  if (!chapterId) {
    return res.status(400).json({ error: 'chapterId is required' });
  }

  let browser = null;

  try {
    // La URL de lectura usa el ID del capítulo, no el número
    const chapterUrl = `https://viralikigai.learnixs.site/capitulo/${chapterId}/`;
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
      timeout: 30000
    });

    // Esperar a que carguen imágenes del capítulo
    // Ikigai carga imágenes desde su CDN (image.ikigaimangas.cloud o cloudflare)
    try {
      await page.waitForFunction(
        () => {
          const images = document.querySelectorAll('img');
          // Buscar imágenes del CDN de ikigai
          const chapterImages = Array.from(images).filter(img =>
            img.src &&
            (img.src.includes('ikigaimangas.cloud') || img.src.includes('cloudflare')) &&
            !img.src.includes('avatar') &&
            !img.src.includes('icon')
          );
          return chapterImages.length > 0;
        },
        { timeout: 15000 }
      );
      console.log('[Ikigai Pages] Imágenes del capítulo cargadas');
    } catch (e) {
      console.log('[Ikigai Pages] Timeout esperando imágenes');
    }

    // Extraer URLs de imágenes
    // Las imágenes del manga están en el CDN de ikigai
    const imageUrls = await page.evaluate(() => {
      const images = document.querySelectorAll('img');

      return Array.from(images)
        .map(img => img.src || img.dataset.src)
        .filter(src =>
          src &&
          (src.includes('ikigaimangas.cloud') || src.includes('cloudflare')) &&
          !src.includes('avatar') &&
          !src.includes('icon') &&
          !src.includes('logo') &&
          !src.includes('loader') &&
          !src.includes('placeholder') &&
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
