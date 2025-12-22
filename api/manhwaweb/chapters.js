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

    const { slug } = req.query;

    if (!slug) {
        return res.status(400).json({ error: 'Missing slug parameter' });
    }

    let browser = null;

    try {
        console.log(`[ManhwaWeb Chapters] Getting chapters for: ${slug}`);
        console.log(`[ManhwaWeb Chapters] Environment: ${isVercel ? 'Vercel' : 'Local'}`);

        // Configuración diferente para Vercel vs Local
        if (isVercel) {
            chromium.setHeadlessMode = true;
            chromium.setGraphicsMode = false;

            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 1280, height: 720 },
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
        } else {
            const puppeteerLocal = await import('puppeteer');
            browser = await puppeteerLocal.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: { width: 1280, height: 720 }
            });
        }

        const page = await browser.newPage();

        // Bloquear publicidad
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('google') || 
                url.includes('analytics') || 
                url.includes('ads') ||
                url.includes('pubadx') ||
                url.includes('cloudflareinsights')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navegar a la página de la obra
        const manhwaUrl = `https://manhwaweb.com/manhwa/${slug}`;
        console.log(`[ManhwaWeb Chapters] Navigating to: ${manhwaUrl}`);

        await page.goto(manhwaUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Esperar a que carguen los capítulos
        console.log('[ManhwaWeb Chapters] Esperando carga de capítulos...');
        
        await page.waitForFunction(() => {
            // Buscar enlaces que contengan "leer" o números de capítulo
            const links = document.querySelectorAll('a[href*="/leer/"], button[class*="chapter"], div[class*="chapter"]');
            return links.length > 0;
        }, { timeout: 15000 }).catch(() => {
            console.log('[ManhwaWeb Chapters] Timeout esperando capítulos, intentando extraer de todos modos...');
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        // Extraer capítulos
        const chapters = await page.evaluate((slug) => {
            const results = [];
            
            // Buscar enlaces de lectura
            const chapterLinks = document.querySelectorAll('a[href*="/leer/"]');
            
            chapterLinks.forEach((link, index) => {
                try {
                    const href = link.getAttribute('href');
                    if (!href) return;
                    
                    // Extraer número de capítulo del href
                    // Formato: /leer/slug-NUMERO
                    const match = href.match(/\/leer\/[^-]+-(\d+(?:\.\d+)?)/);
                    const chapterNum = match ? match[1] : String(index + 1);
                    
                    // Buscar texto descriptivo
                    let chapterText = link.textContent.trim();
                    if (!chapterText || chapterText.length > 50) {
                        chapterText = `Capítulo ${chapterNum}`;
                    }
                    
                    results.push({
                        chapter: chapterNum,
                        title: chapterText,
                        url: href.startsWith('http') ? href : `https://manhwaweb.com${href}`
                    });
                } catch (error) {
                    console.error(`Error procesando capítulo ${index}:`, error.message);
                }
            });
            
            // Ordenar por número de capítulo (de menor a mayor)
            results.sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter));
            
            return results;
        }, slug);

        console.log(`[ManhwaWeb Chapters] Found ${chapters.length} chapters`);

        if (chapters.length === 0) {
            console.log('[ManhwaWeb Chapters] No chapters found');
        }

        return res.status(200).json({
            success: true,
            chapters: chapters,
            count: chapters.length
        });

    } catch (error) {
        console.error('[ManhwaWeb Chapters] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message,
            chapters: []
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
