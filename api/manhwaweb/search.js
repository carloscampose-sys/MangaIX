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

    // Recibir todos los filtros desde el frontend (géneros, tipo, estado, erótico, demografía, ordenar)
    const { query, genres, type, status, erotic, demographic, sortBy, sortOrder } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter' });
    }
    
    // Parsear géneros si vienen como string separado por comas
    // Ejemplo: "accion,aventura,comedia" → ["accion", "aventura", "comedia"]
    const genreIds = genres ? (typeof genres === 'string' ? genres.split(',') : genres) : [];

    let browser = null;

    try {
        console.log(`[ManhwaWeb Search] Searching for: "${query}"`);
        console.log(`[ManhwaWeb Search] Filters:`, { genreIds, type, status, erotic, demographic, sortBy, sortOrder });
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

        // ManhwaWeb requiere que la búsqueda se ejecute con interacción
        // Primero vamos a la biblioteca, luego escribimos en el input de búsqueda
        const libraryUrl = `https://manhwaweb.com/library`;
        console.log(`[ManhwaWeb Search] Navigating to library first: ${libraryUrl}`);

        await page.goto(libraryUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Esperar a que el input de búsqueda esté disponible
        console.log('[ManhwaWeb Search] Esperando input de búsqueda...');
        
        try {
            // Buscar el input de búsqueda con diferentes selectores
            const searchInput = await page.waitForSelector('input[type="search"], input[name*="buscar"], input[placeholder*="Buscar"], input[class*="search"]', { timeout: 5000 });
            
            if (searchInput) {
                console.log('[ManhwaWeb Search] Input encontrado, escribiendo query...');
                await searchInput.type(query, { delay: 50 });
                
                // Presionar Enter
                await page.keyboard.press('Enter');
                console.log('[ManhwaWeb Search] Enter presionado, esperando resultados...');
                
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.log('[ManhwaWeb Search] No se encontró input de búsqueda, intentando URL directa...');
            const searchUrl = `https://manhwaweb.com/library?buscar=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }
        
        // Aplicar filtros si existen
        if (genreIds.length > 0 || type || status || erotic || demographic || sortBy) {
            console.log('[ManhwaWeb Search] Aplicando filtros...');
            
            try {
                // Buscar y hacer clic en botón de filtros si existe
                const filterButton = await page.$('button[class*="filter"], button[class*="filtro"]');
                if (filterButton) {
                    await filterButton.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Aplicar filtros de géneros (checkboxes)
                if (genreIds.length > 0) {
                    console.log('[ManhwaWeb Search] Aplicando géneros:', genreIds);
                    for (const genreId of genreIds) {
                        // Buscar checkbox por value o por texto
                        const checkbox = await page.$(`input[type="checkbox"][value="${genreId}"], input[name="genders"][value="${genreId}"]`);
                        if (checkbox) {
                            const isChecked = await page.evaluate(el => el.checked, checkbox);
                            if (!isChecked) {
                                await checkbox.click();
                                await new Promise(resolve => setTimeout(resolve, 100));
                            }
                        }
                    }
                }
                
                // Aplicar filtro de tipo
                if (type) {
                    console.log('[ManhwaWeb Search] Aplicando tipo:', type);
                    const typeSelect = await page.$('select[name*="type"], select[name*="tipo"]');
                    if (typeSelect) {
                        await typeSelect.select(type);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                // Aplicar filtro de estado
                if (status) {
                    console.log('[ManhwaWeb Search] Aplicando estado:', status);
                    const statusSelect = await page.$('select[name*="status"], select[name*="estado"]');
                    if (statusSelect) {
                        await statusSelect.select(status);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                // Aplicar filtro demográfico
                if (demographic) {
                    console.log('[ManhwaWeb Search] Aplicando demografía:', demographic);
                    const demoSelect = await page.$('select[name*="demographic"], select[name*="demografia"]');
                    if (demoSelect) {
                        await demoSelect.select(demographic);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                // Aplicar ordenamiento
                if (sortBy) {
                    console.log('[ManhwaWeb Search] Aplicando orden:', sortBy, sortOrder);
                    const sortSelect = await page.$('select[name*="sort"], select[name*="orden"]');
                    if (sortSelect) {
                        await sortSelect.select(sortBy);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    if (sortOrder) {
                        const orderSelect = await page.$('select[name*="order"], select[name*="direction"]');
                        if (orderSelect) {
                            await orderSelect.select(sortOrder);
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                }
                
                // Buscar botón de aplicar filtros
                const applyButton = await page.$('button[type="submit"], button[class*="aplicar"], button[class*="apply"]');
                if (applyButton) {
                    console.log('[ManhwaWeb Search] Haciendo clic en aplicar filtros...');
                    await applyButton.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                console.log('[ManhwaWeb Search] Filtros aplicados');
            } catch (filterError) {
                console.log('[ManhwaWeb Search] Error aplicando filtros:', filterError.message);
                console.log('[ManhwaWeb Search] Continuando sin filtros...');
            }
        }

        // Esperar a que la página cargue completamente
        console.log('[ManhwaWeb Search] Esperando carga de contenido...');
        
        // Esperar a que se carguen las tarjetas (timeout reducido)
        await page.waitForFunction(() => {
            const links = document.querySelectorAll('a[href*="/manhwa/"]');
            return links.length > 3; // Reducido a 3 para ser más rápido
        }, { timeout: 15000 }).catch(() => {
            console.log('[ManhwaWeb Search] Timeout esperando resultados, intentando extraer de todos modos...');
        });

        // Pausa reducida para lazy loading
        console.log('[ManhwaWeb Search] Esperando carga de imágenes lazy...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Reducido de 3s a 1.5s
        
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
