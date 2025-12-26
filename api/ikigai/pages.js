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

    // Esperar a que cargue el contenido (Qwik framework)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Buscar imágenes del capítulo
    // Generalmente son imágenes grandes en el contenido principal
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('img');
      // Contar imágenes grandes (probablemente páginas del manga)
      const largeImages = Array.from(images).filter(img =>
        img.naturalHeight > 200 &&
        !img.src.includes('avatar') &&
        !img.src.includes('logo') &&
        !img.src.includes('loader') &&
        !img.src.includes('placeholder')
      );
      return largeImages.length > 0;
    }, { timeout: 8000 });

    console.log('[Ikigai Pages] Imágenes detectadas, extrayendo URLs...');

    // Extraer URLs de imágenes
    const imageUrls = await page.evaluate(() => {
      const images = document.querySelectorAll('img');

      const urls = Array.from(images)
        .map(img => {
          // Obtener URL de la imagen
          let src = img.src || img.srcset?.split(' ')[0] || img.dataset.src || img.dataset.original || '';

          // Si la URL es relativa, convertirla a absoluta
          if (src && !src.startsWith('http')) {
            try {
              src = new URL(src, window.location.origin).href;
            } catch (e) {
              return null;
            }
          }

          // Verificar que sea una imagen grande (página del manga)
          // y no un avatar, logo, o placeholder
          if (src &&
              src.startsWith('http') &&
              img.naturalHeight > 200 &&
              !src.includes('avatar') &&
              !src.includes('logo') &&
              !src.includes('loader') &&
              !src.includes('placeholder')) {
            return src;
          }

          return null;
        })
        .filter(src => src !== null);

      // Eliminar duplicados
      return [...new Set(urls)];
    });

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
