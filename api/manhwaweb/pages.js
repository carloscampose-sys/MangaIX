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
        console.log(`[ManhwaWeb] Fetching chapter ${chapter} of ${slug}...`);
        console.log(`[ManhwaWeb] Environment: ${isVercel ? 'Vercel' : 'Local'}`);

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

        // Bloquear publicidad y analytics para acelerar la carga
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            // Bloquear publicidad, analytics y scripts innecesarios
            if (url.includes('google') || 
                url.includes('analytics') || 
                url.includes('yandex') || 
                url.includes('ads') ||
                url.includes('pubadx') ||
                url.includes('cloudflareinsights')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Construir URL del capítulo
        // Formato correcto: https://manhwaweb.com/leer/{slug-chapter}
        const chapterUrl = `https://manhwaweb.com/leer/${slug}-${chapter}`;
        console.log(`[ManhwaWeb] Navigating to: ${chapterUrl}`);

        // Navegar a la página del capítulo
        await page.goto(chapterUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Esperar a que las imágenes se carguen
        // Las imágenes tienen width > 200px y están en imageshack.com o manhwaweb.com
        await page.waitForFunction(() => {
            const imgs = document.querySelectorAll('img');
            const chapterImages = Array.from(imgs).filter(img => {
                const src = img.src || '';
                return src && 
                       !src.includes('logo') && 
                       !src.includes('icon') && 
                       !src.includes('avatar') &&
                       img.width > 200;
            });
            return chapterImages.length > 5; // Esperar al menos 5 imágenes del capítulo
        }, { timeout: 20000 }).catch(() => {
            console.log('[ManhwaWeb] Timeout waiting for images, continuing anyway...');
        });

        // Pequeña pausa adicional para asegurar que todas las imágenes lazy se carguen
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extraer URLs de imágenes del capítulo
        const pages = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            const urls = [];

            images.forEach(img => {
                const src = img.src || img.dataset?.src || img.getAttribute('data-src');
                
                // Filtrar solo imágenes del capítulo (no logos, iconos, etc.)
                if (src && 
                    !src.includes('logo') && 
                    !src.includes('icon') && 
                    !src.includes('avatar') &&
                    img.width > 200) {
                    
                    // Validar que sea de imageshack o manhwaweb
                    if (src.includes('imageshack.com') || src.includes('manhwaweb.com')) {
                        urls.push(src);
                    }
                }
            });

            return urls;
        });

        console.log(`[ManhwaWeb] Found ${pages.length} pages`);

        // Validar que se encontraron imágenes
        if (pages.length === 0) {
            console.error('[ManhwaWeb] No images found on page');
            return res.status(404).json({
                success: false,
                error: 'No se encontraron imágenes en el capítulo',
                pages: []
            });
        }

        return res.status(200).json({
            success: true,
            pages: pages,
            count: pages.length
        });

    } catch (error) {
        console.error('[ManhwaWeb] Error:', error.message);
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
