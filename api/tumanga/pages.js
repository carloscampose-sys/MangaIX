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
            waitUntil: 'networkidle2',
            timeout: 8000
        });

        // Esperar a que las imágenes reales se carguen (no los loaders)
        await page.waitForFunction(() => {
            const imgs = document.querySelectorAll('#lector img');
            if (imgs.length === 0) return false;

            // Verificar que al menos una imagen NO sea el loader
            for (const img of imgs) {
                const src = img.src || img.dataset?.src || '';
                if (src && !src.includes('loader') && (src.includes('pic_source') || src.includes('social-google'))) {
                    return true;
                }
            }
            return false;
        }, { timeout: 6000 }).catch(() => {
            console.log('Timeout waiting for real images...');
        });

        // Pequeña pausa adicional para asegurar que todas las imágenes se decodifiquen
        await new Promise(resolve => setTimeout(resolve, 500));

        // Extraer URLs de imágenes (excluyendo loaders)
        const pages = await page.evaluate(() => {
            const images = document.querySelectorAll('#lector img');
            const urls = [];

            images.forEach(img => {
                const src = img.src || img.dataset?.src || img.getAttribute('data-src');
                // Excluir loaders y solo incluir imágenes reales
                if (src && !src.includes('loader') && !src.includes('assets/img')) {
                    if (src.includes('pic_source') || src.includes('social-google') || src.includes('tumanga.org/pic')) {
                        urls.push(src);
                    }
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
