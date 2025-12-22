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

    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }

    let browser = null;

    try {
        console.log(`[ManhwaWeb Search] Searching for: "${query}"`);
        console.log(`[ManhwaWeb Search] Environment: ${isVercel ? 'Vercel' : 'Local'}`);

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

        // Bloquear publicidad y analytics
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('google') || 
                url.includes('analytics') || 
                url.includes('ads') ||
                url.includes('juicyads') ||
                url.includes('exoclick') ||
                url.includes('pubadx') ||
                url.includes('cloudflareinsights')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar a la página de búsqueda
        const searchUrl = `https://manhwaweb.com/mis-manhwas?buscar=${encodeURIComponent(query)}`;
        console.log(`[ManhwaWeb Search] Navigating to: ${searchUrl}`);

        await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Esperar a que se carguen las tarjetas (con timeout más largo)
        await page.waitForFunction(() => {
            const links = document.querySelectorAll('a[href*="/manhwa/"]');
            return links.length > 0;
        }, { timeout: 20000 }).catch(() => {
            console.log('[ManhwaWeb Search] Timeout waiting for results, trying to extract anyway...');
        });

        // Pequeña pausa adicional
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extraer resultados
        const results = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('a[href*="/manhwa/"]')).filter(a => a.querySelector('img'));
            const data = [];

            cards.forEach((card, index) => {
                const href = card.getAttribute('href');
                if (!href) return;

                const slug = href.split('/manhwa/')[1];
                if (!slug) return;

                // Extraer título
                const titleEl = card.querySelector('p.text-xs_');
                const title = titleEl?.textContent?.trim();
                if (!title) return;

                // Extraer imagen
                const img = card.querySelector('img');
                const cover = img?.getAttribute('src') || '';

                data.push({
                    slug,
                    title,
                    cover,
                    index
                });
            });

            return data;
        });

        console.log(`[ManhwaWeb Search] Found ${results.length} results`);

        return res.status(200).json({
            success: true,
            results: results,
            count: results.length
        });

    } catch (error) {
        console.error('[ManhwaWeb Search] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message,
            results: []
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
