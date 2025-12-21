import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
        console.log(`Fetching chapter ${chapter} of ${slug}...`);

        // Configurar chromium para Vercel
        chromium.setHeadlessMode = true;
        chromium.setGraphicsMode = false;

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1280, height: 720 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // Bloquear recursos innecesarios para acelerar
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            // Bloquear CSS, fuentes y scripts de publicidad
            if (['stylesheet', 'font'].includes(resourceType)) {
                req.abort();
            } else if (req.url().includes('google') || req.url().includes('analytics') || req.url().includes('yandex')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar a la página del capítulo
        await page.goto(`https://tumanga.org/leer/${slug}-${chapter}`, {
            waitUntil: 'domcontentloaded',
            timeout: 8000
        });

        // Esperar un poco para que el JavaScript decodifique las imágenes
        await page.waitForFunction(() => {
            const imgs = document.querySelectorAll('#lector img');
            return imgs.length > 0;
        }, { timeout: 5000 }).catch(() => {
            console.log('Timeout waiting for images, trying to extract anyway...');
        });

        // Extraer URLs de imágenes
        const pages = await page.evaluate(() => {
            const images = document.querySelectorAll('#lector img');
            const urls = [];

            images.forEach(img => {
                const src = img.src || img.dataset?.src || img.getAttribute('data-src');
                if (src && (src.includes('tumanga') || src.includes('pic_source') || src.includes('social-google'))) {
                    urls.push(src);
                }
            });

            return urls;
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
