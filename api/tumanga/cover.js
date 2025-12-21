import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache 24h

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { slug } = req.query;

    if (!slug) {
        return res.status(400).json({ error: 'Missing slug parameter' });
    }

    let browser = null;

    try {
        chromium.setHeadlessMode = true;
        chromium.setGraphicsMode = false;

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 800, height: 600 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // Bloquear recursos innecesarios
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('google') || url.includes('analytics') || url.includes('yandex') || url.includes('ads')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(`https://tumanga.org/online/${slug}`, {
            waitUntil: 'networkidle2',
            timeout: 8000
        });

        // Esperar a que la imagen de portada cargue
        await page.waitForFunction(() => {
            const img = document.querySelector('.cover img, .portada img, .manga-cover img, .thumb img');
            return img && img.src && !img.src.includes('loader');
        }, { timeout: 5000 }).catch(() => {});

        // Extraer URL de la portada
        const cover = await page.evaluate(() => {
            const selectors = ['.cover img', '.portada img', '.manga-cover img', '.thumb img', '.info img'];
            for (const selector of selectors) {
                const img = document.querySelector(selector);
                if (img && img.src && !img.src.includes('loader')) {
                    return img.src;
                }
            }
            return null;
        });

        return res.status(200).json({
            success: true,
            cover: cover
        });

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message,
            cover: null
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
