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

        // Intentar página principal primero (sin login)
        // Si no funciona, probaremos otras rutas
        const searchUrl = `https://manhwaweb.com/?buscar=${encodeURIComponent(query)}`;
        console.log(`[ManhwaWeb Search] Navigating to: ${searchUrl}`);

        await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Esperar a que la página cargue completamente
        console.log('[ManhwaWeb Search] Esperando carga de contenido...');
        
        // Esperar a que se carguen las tarjetas
        await page.waitForFunction(() => {
            const links = document.querySelectorAll('a[href*="/manhwa/"]');
            console.log(`Esperando... Enlaces encontrados: ${links.length}`);
            return links.length > 5; // Esperar al menos 5 resultados
        }, { timeout: 30000 }).catch(() => {
            console.log('[ManhwaWeb Search] Timeout esperando resultados, intentando extraer de todos modos...');
        });

        // Pausa para asegurar que lazy loading termine
        console.log('[ManhwaWeb Search] Esperando carga de imágenes lazy...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Log de debugging
        const debugInfo = await page.evaluate(() => {
            return {
                totalLinks: document.querySelectorAll('a').length,
                manhwaLinks: document.querySelectorAll('a[href*="/manhwa/"]').length,
                images: document.querySelectorAll('img').length,
                bodyText: document.body.innerText.substring(0, 200)
            };
        });
        
        console.log('[ManhwaWeb Search] Debug info:', debugInfo);

        // Extraer resultados con debugging mejorado
        const results = await page.evaluate(() => {
            // Intentar múltiples selectores
            let cards = Array.from(document.querySelectorAll('a[href*="/manhwa/"]')).filter(a => a.querySelector('img'));
            
            console.log(`[Puppeteer] Total de enlaces con /manhwa/: ${document.querySelectorAll('a[href*="/manhwa/"]').length}`);
            console.log(`[Puppeteer] Enlaces con imagen: ${cards.length}`);
            
            const data = [];

            cards.forEach((card, index) => {
                try {
                    const href = card.getAttribute('href');
                    if (!href) return;

                    const slug = href.split('/manhwa/')[1];
                    if (!slug) return;

                    // Extraer título - intentar múltiples selectores
                    let title = null;
                    const titleSelectors = ['p.text-xs_', 'p[class*="text-"]', 'h3', 'h4', 'p', 'span'];
                    
                    for (const selector of titleSelectors) {
                        const el = card.querySelector(selector);
                        if (el && el.textContent.trim()) {
                            title = el.textContent.trim();
                            break;
                        }
                    }
                    
                    // Si no hay título, usar el slug limpio
                    if (!title) {
                        title = slug.split('_')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }

                    // Extraer imagen
                    const img = card.querySelector('img');
                    const cover = img?.getAttribute('src') || img?.getAttribute('data-src') || '';

                    data.push({
                        slug,
                        title,
                        cover,
                        index
                    });
                } catch (error) {
                    console.error(`[Puppeteer] Error procesando tarjeta ${index}:`, error.message);
                }
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
