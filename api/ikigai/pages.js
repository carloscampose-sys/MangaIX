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
    // Construir URL del capítulo - intentar múltiples formatos posibles
    const possibleUrls = [
      `https://viralikigai.eurofiyati.online/leer/${slug}-${chapter}`,
      `https://viralikigai.eurofiyati.online/leer/${slug}/${chapter}`,
      `https://viralikigai.eurofiyati.online/read/${slug}-${chapter}`,
      `https://viralikigai.eurofiyati.online/read/${slug}/${chapter}`,
      `https://viralikigai.eurofiyati.online/series/${slug}/${chapter}`
    ];

    console.log('[Ikigai Pages] Intentando cargar capítulo...');

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

      if (blockedResources.some(r => url.includes(r))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Intentar cargar con cada URL hasta encontrar una que funcione
    let urlLoaded = null;
    for (const chapterUrl of possibleUrls) {
      try {
        console.log(`[Ikigai Pages] Intentando URL: ${chapterUrl}`);

        const response = await page.goto(chapterUrl, {
          waitUntil: 'networkidle2',
          timeout: 10000
        });

        if (response && response.ok()) {
          urlLoaded = chapterUrl;
          console.log(`[Ikigai Pages] URL cargada exitosamente: ${chapterUrl}`);
          break;
        }
      } catch (e) {
        console.log(`[Ikigai Pages] URL falló: ${chapterUrl}`);
        continue;
      }
    }

    if (!urlLoaded) {
      await browser.close();
      return res.status(404).json({
        error: 'No se pudo cargar el capítulo',
        details: 'Ninguna URL funcionó'
      });
    }

    // Esperar a que carguen imágenes REALES (no loaders)
    // Intentar múltiples selectores
    const possibleImageContainers = [
      '#lector img',
      '#reader img',
      '.lector img',
      '.reader img',
      '.pagina img',
      '.page img',
      '.chapter-content img',
      '.capitulo-content img',
      'main img',
      'article img'
    ];

    let imageSelector = null;
    for (const selector of possibleImageContainers) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });

        // Verificar que al menos una imagen esté realmente cargada
        const hasRealImages = await page.evaluate((sel) => {
          const images = document.querySelectorAll(sel);
          return Array.from(images).some(img =>
            img.complete &&
            img.naturalHeight > 0 &&
            !img.src.includes('loader') &&
            !img.src.includes('placeholder')
          );
        }, selector);

        if (hasRealImages) {
          imageSelector = selector;
          console.log(`[Ikigai Pages] Selector de imágenes encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!imageSelector) {
      // Fallback: esperar un poco más y buscar cualquier imagen
      await page.waitForTimeout(2000);

      // Buscar todas las imágenes en la página
      imageSelector = 'img';
      console.log('[Ikigai Pages] Usando selector genérico de imágenes');
    }

    // Esperar a que las imágenes terminen de cargar
    await page.waitForFunction((selector) => {
      const images = document.querySelectorAll(selector);
      if (images.length === 0) return false;

      const loadedImages = Array.from(images).filter(img =>
        img.complete &&
        img.naturalHeight > 0 &&
        !img.src.includes('loader') &&
        !img.src.includes('placeholder') &&
        img.src.startsWith('http')
      );

      return loadedImages.length > 0;
    }, { timeout: 8000 }, imageSelector);

    // Extraer URLs de imágenes
    const imageUrls = await page.evaluate((selector) => {
      const images = document.querySelectorAll(selector);

      const urls = Array.from(images)
        .map(img => {
          // Intentar múltiples fuentes de URL
          let src = img.src || img.dataset.src || img.dataset.original || '';

          // Si la URL es relativa, convertirla a absoluta
          if (src && !src.startsWith('http')) {
            src = new URL(src, window.location.origin).href;
          }

          return src;
        })
        .filter(src =>
          src &&
          src.startsWith('http') &&
          !src.includes('loader') &&
          !src.includes('placeholder') &&
          !src.includes('avatar') &&
          !src.includes('logo')
        );

      // Eliminar duplicados
      return [...new Set(urls)];
    }, imageSelector);

    await browser.close();

    console.log(`[Ikigai Pages] ${imageUrls.length} imágenes encontradas`);

    if (imageUrls.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron imágenes en el capítulo',
        details: 'El capítulo puede no tener imágenes o el selector es incorrecto'
      });
    }

    return res.status(200).json({
      pages: imageUrls,
      total: imageUrls.length
    });

  } catch (error) {
    console.error('[Ikigai Pages] Error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[Ikigai Pages] Error cerrando browser:', e);
      }
    }

    return res.status(500).json({
      error: 'Error obteniendo páginas',
      details: error.message
    });
  }
}
