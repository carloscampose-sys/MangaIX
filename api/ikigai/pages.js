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

    // User agent de navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

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
      waitUntil: 'networkidle0',
      timeout: 45000
    });

    // El sitio usa Qwik framework - necesita tiempo para cargar JavaScript
    console.log('[Ikigai Pages] Esperando carga de Qwik framework...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Hacer scroll para activar lazy loading de imágenes
    console.log('[Ikigai Pages] Haciendo scroll para cargar imágenes...');
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    while (scrollAttempts < maxScrollAttempts) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 800));

      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === previousHeight) {
        // Intentar un scroll más para asegurar
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      }
      previousHeight = currentHeight;
      scrollAttempts++;
    }

    // Volver al inicio
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Debug: Ver qué imágenes hay en la página
    const debugInfo = await page.evaluate(() => {
      const allImages = document.querySelectorAll('img');
      return {
        totalImages: allImages.length,
        imageSrcs: Array.from(allImages).slice(0, 20).map(img => ({
          src: img.src?.substring(0, 100),
          dataSrc: img.dataset?.src?.substring(0, 100),
          className: img.className
        }))
      };
    });
    console.log('[Ikigai Pages] Debug info:', JSON.stringify(debugInfo, null, 2));

    // Extraer URLs de imágenes del capítulo
    // Buscar imágenes grandes que sean del manga (no avatares, iconos, etc.)
    const imageUrls = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const validImages = [];

      Array.from(images).forEach(img => {
        const src = img.src || img.dataset?.src || '';

        // Filtrar imágenes del CDN de Ikigai
        const isIkigaiCdn = src.includes('ikigaimangas.cloud') ||
                           src.includes('ikigai') ||
                           src.includes('imagedelivery.net');

        // Excluir imágenes pequeñas o de UI
        const isNotUiElement = !src.includes('avatar') &&
                              !src.includes('icon') &&
                              !src.includes('logo') &&
                              !src.includes('loader') &&
                              !src.includes('placeholder') &&
                              !src.includes('60:60') &&  // Thumbnails pequeños
                              !src.includes('btn_') &&   // Botones
                              !src.includes('/misc/');   // Recursos misc

        // Verificar que la imagen es grande (probable página de manga)
        const isLargeImage = img.naturalWidth > 200 || img.width > 200 ||
                            src.includes('/chapters/') ||
                            src.includes('/pages/');

        if (src && src.startsWith('http') && isIkigaiCdn && isNotUiElement) {
          validImages.push(src);
        }
      });

      // Eliminar duplicados
      return [...new Set(validImages)];
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
