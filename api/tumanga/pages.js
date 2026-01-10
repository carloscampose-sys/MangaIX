import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Detectar si estamos en Vercel o en local
const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { slug, chapter } = req.query;

    if (!slug || !chapter) {
        return res.status(400).json({ error: 'Missing slug or chapter parameter' });
    }

    let browser = null;

    try {
        console.log(`[TuManga] Fetching chapter ${chapter} of ${slug}...`);
        console.log(`[TuManga] Environment: ${isVercel ? 'Vercel' : 'Local'}`);

        // Configuración diferente para Vercel vs Local
        if (isVercel) {
            // Configurar chromium para Vercel
            chromium.setHeadlessMode = true;
            chromium.setGraphicsMode = false;

            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 1280, height: 720 },
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
        } else {
            // Usar puppeteer local
            const puppeteerLocal = await import('puppeteer');
            browser = await puppeteerLocal.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: { width: 1280, height: 720 }
            });
        }

        const page = await browser.newPage();

        // Bloquear solo publicidad, permitir scripts necesarios
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            // Bloquear publicidad y analytics
            if (url.includes('google') || url.includes('analytics') || url.includes('yandex') || url.includes('ads')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar a la página del capítulo
        await page.goto(`https://tumanga.org/leer/${slug}-${chapter}`, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
        });

        // Esperar a que las imágenes reales se carguen (no los loaders)
        console.log('[TuManga] Esperando a que se carguen las imágenes reales...');
        await page.waitForFunction(() => {
            const imgs = document.querySelectorAll('#lector img');
            if (imgs.length === 0) return false;

            // Verificar que al menos una imagen NO sea el loader
            for (const img of imgs) {
                const src = img.src || img.dataset?.src || '';
                // Ser más flexible: aceptar cualquier URL que parezca una imagen real
                if (src && !src.includes('loader') && !src.includes('assets/img') && src.length > 50) {
                    return true;
                }
            }
            return false;
        }, { timeout: 5000 }).catch(() => {
            console.log('[TuManga] Timeout esperando imágenes reales, continuando con extracción...');
        });

        // Pequeña pausa adicional para asegurar que todas las imágenes se decodifiquen
        await new Promise(resolve => setTimeout(resolve, 300));

        // Extraer URLs de imágenes (excluyendo loaders)
        const pages = await page.evaluate(() => {
            const urls = [];

            // Intentar múltiples selectores para mayor compatibilidad
            const selectors = [
                '#lector img',
                'img.page',
                'img[data-image-id]',
                '.manga-reader img',
                '.reader img'
            ];

            for (const selector of selectors) {
                const images = document.querySelectorAll(selector);
                if (images.length > 0) {
                    console.log(`[TuManga] Usando selector: ${selector} (${images.length} imágenes)`);

                    images.forEach(img => {
                        const src = img.src || img.dataset?.src || img.getAttribute('data-src');
                        // Ser más flexible con el filtrado
                        if (src && !src.includes('loader') && !src.includes('assets/img') && src.length > 50) {
                            urls.push(src);
                        }
                    });

                    if (urls.length > 0) break; // Usar el primer selector que funcione
                }
            }

            return [...new Set(urls)]; // Eliminar duplicados
        });

        console.log(`Found ${pages.length} pages`);

        return res.status(200).json({
            success: true,
            pages: pages,
            count: pages.length
        });

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message,
            pages: []
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
