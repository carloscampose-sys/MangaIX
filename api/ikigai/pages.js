import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, chapter, chapterUrl } = req.body;

  if (!slug || !chapter) {
    return res.status(400).json({ error: 'Slug and chapter are required' });
  }

  let browser = null;

  try {
    // Si se proporciona chapterUrl (URL completa del capítulo), usarla directamente
    // De lo contrario, intentar construir URLs con patrones comunes
    const possibleUrls = chapterUrl
      ? [chapterUrl]  // Usar URL directa si está disponible
      : [
        `https://viralikigai.foodib.net/capitulo/${slug}-${chapter}`,
        `https://viralikigai.foodib.net/leer/${slug}-${chapter}`,
        `https://viralikigai.foodib.net/leer/${slug}/${chapter}`,
        `https://viralikigai.foodib.net/read/${slug}-${chapter}`,
        `https://viralikigai.foodib.net/read/${slug}/${chapter}`,
        `https://viralikigai.foodib.net/series/${slug}/${chapter}`
      ];

    console.log('[Ikigai Pages] Intentando cargar capítulo...');
    if (chapterUrl) {
      console.log('[Ikigai Pages] Usando URL directa del capítulo:', chapterUrl);
    }

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

    // Anti-detección
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

      if (blockedResources.some(r => url.includes(r))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Intentar cargar con cada URL hasta encontrar una que funcione
    let urlLoaded = null;
    for (const testUrl of possibleUrls) {
      try {
        console.log(`[Ikigai Pages] Intentando URL: ${testUrl}`);

        const response = await page.goto(testUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        if (response && response.ok()) {
          urlLoaded = testUrl;
          console.log(`[Ikigai Pages] URL cargada exitosamente: ${testUrl}`);
          break;
        }
      } catch (e) {
        console.log(`[Ikigai Pages] URL falló: ${testUrl} - ${e.message}`);
        continue;
      }
    }

    if (!urlLoaded) {
      await browser.close();
      return res.status(404).json({
        error: 'No se pudo cargar el capítulo',
        details: 'Ninguna URL funcionó',
        triedUrls: possibleUrls
      });
    }

    // Esperar challenge de Cloudflare
    try {
      await page.waitForFunction(() => {
        const title = document.title;
        const bodyText = document.body ? document.body.innerText : '';

        return !title.includes('500') &&
          !title.includes('Just a moment') &&
          !title.includes('Error') &&
          !bodyText.includes('Checking your browser') &&
          bodyText.length > 100;
      }, { timeout: 25000 });

      console.log('[Ikigai Pages] ✓ Challenge completado');
    } catch (e) {
      console.warn('[Ikigai Pages] Timeout esperando challenge, continuando...');
    }

    // Esperar a que cargue el contenido inicial (Qwik framework)
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[Ikigai Pages] Iniciando detección de imágenes...');

    // PASO 1: Hacer scroll completo para activar lazy loading
    console.log('[Ikigai Pages] Haciendo scroll para activar lazy loading...');
    await page.evaluate(async () => {
      // Scroll gradual hacia abajo para activar lazy loading
      const scrollStep = 500;
      const scrollDelay = 500;
      
      let currentScroll = 0;
      const maxScroll = document.body.scrollHeight;
      
      while (currentScroll < maxScroll) {
        window.scrollTo(0, currentScroll);
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
        currentScroll += scrollStep;
        
        // Actualizar maxScroll por si se cargó más contenido
        const newMaxScroll = document.body.scrollHeight;
        if (newMaxScroll > maxScroll) {
          maxScroll = newMaxScroll;
        }
      }
      
      // Scroll final hasta el final
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Volver al inicio
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    console.log('[Ikigai Pages] Scroll completado, esperando carga de imágenes...');

    // PASO 2: Esperar a que se carguen las imágenes (timeout más largo)
    try {
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img');
        
        // Contar imágenes que tienen src válido (no importa si están cargadas)
        const validImages = Array.from(images).filter(img => {
          const src = img.src || img.dataset.src || img.dataset.original || '';
          return src && 
                 src.startsWith('http') && 
                 !src.includes('avatar') &&
                 !src.includes('logo') &&
                 !src.includes('loader') &&
                 !src.includes('placeholder');
        });
        
        console.log(`[Client] Imágenes válidas encontradas: ${validImages.length}`);
        return validImages.length > 0;
      }, { timeout: 15000 });
      
      console.log('[Ikigai Pages] ✓ Imágenes detectadas');
    } catch (e) {
      console.warn('[Ikigai Pages] Timeout esperando imágenes, continuando con las disponibles...');
    }

    // PASO 3: Esperar un poco más para que terminen de cargar
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[Ikigai Pages] Extrayendo URLs de imágenes...');

    // Extraer URLs de imágenes (versión mejorada)
    const imageUrls = await page.evaluate(() => {
      const images = document.querySelectorAll('img');

      const urls = Array.from(images)
        .map(img => {
          // Obtener URL de múltiples fuentes posibles
          let src = img.src || 
                   img.dataset.src || 
                   img.dataset.original || 
                   img.dataset.lazy ||
                   img.getAttribute('data-src') ||
                   img.getAttribute('data-original') ||
                   '';

          // También revisar srcset
          if (!src && img.srcset) {
            const srcsetUrls = img.srcset.split(',').map(s => s.trim().split(' ')[0]);
            src = srcsetUrls[0] || '';
          }

          // Si la URL es relativa, convertirla a absoluta
          if (src && !src.startsWith('http')) {
            try {
              src = new URL(src, window.location.origin).href;
            } catch (e) {
              return null;
            }
          }

          // Filtrar imágenes que no son páginas del manga
          if (src &&
            src.startsWith('http') &&
            !src.includes('avatar') &&
            !src.includes('logo') &&
            !src.includes('loader') &&
            !src.includes('placeholder') &&
            !src.includes('icon') &&
            !src.includes('banner')) {
            
            // Log para debug
            console.log(`[Client] Imagen encontrada: ${src.substring(0, 80)}...`);
            return src;
          }

          return null;
        })
        .filter(src => src !== null);

      // Eliminar duplicados y ordenar
      const uniqueUrls = [...new Set(urls)];
      
      console.log(`[Client] Total imágenes únicas: ${uniqueUrls.length}`);
      return uniqueUrls;
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
