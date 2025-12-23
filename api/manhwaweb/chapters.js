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
        const startTime = Date.now();
        
        console.log('[Chapters] ===== INICIO EXTRACCIÓN DE CAPÍTULOS =====');
        console.log('[Chapters] URL:', manhwaUrl);
        console.log('[Chapters] Timestamp:', new Date().toISOString());

        await page.goto(manhwaUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // ==================================================
        // PASO 2.1: Esperar a que cargue la lista inicial
        // ==================================================
        console.log('[Chapters] Esperando lista inicial de capítulos...');
        
        try {
            await page.waitForSelector('a[href*="/leer/"]', { timeout: 10000 });
            console.log('[Chapters] ✅ Lista inicial cargada');
        } catch (error) {
            console.error('[Chapters] ❌ Error: No se encontraron capítulos iniciales');
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // ==================================================
        // PASO 2.2: Buscar el botón "Ver todo"
        // ==================================================
        console.log('[Chapters] Buscando botón "Ver todo"...');

        const showAllSelectors = [
            'button:has-text("Ver todo")',
            'button:has-text("Ver más")',
            'button:has-text("Mostrar todos")',
            'button:has-text("Show all")',
            'a:has-text("Ver todo")',
            'a:has-text("Ver más")',
            '[class*="show-all"]',
            '[class*="ver-todo"]',
            '[class*="expand-all"]',
            '[class*="toggle-all"]',
            '[id*="show-all"]',
            '[id*="ver-todo"]'
        ];

        let showAllButton = null;
        let selectorUsed = null;

        for (const selector of showAllSelectors) {
            try {
                showAllButton = await page.$(selector);
                if (showAllButton) {
                    selectorUsed = selector;
                    console.log('[Chapters] ✅ Botón "Ver todo" encontrado con selector:', selector);
                    break;
                }
            } catch (e) {
                // Selector inválido, continuar
            }
        }

        // ==================================================
        // PASO 2.3: Si NO se encuentra el botón, buscar con evaluate
        // ==================================================
        if (!showAllButton) {
            console.log('[Chapters] Buscando botón con texto...');
            
            showAllButton = await page.evaluateHandle(() => {
                // Buscar botones por texto
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const texts = ['ver todo', 'ver más', 'mostrar todos', 'show all', 'expand', 'ver todos'];
                
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase().trim();
                    if (texts.some(t => text.includes(t))) {
                        console.log('[Puppeteer] Botón encontrado por texto:', btn.textContent);
                        return btn;
                    }
                }
                
                return null;
            });
            
            const isNull = await page.evaluate(el => el === null, showAllButton);
            if (!isNull) {
                console.log('[Chapters] ✅ Botón encontrado por texto');
                selectorUsed = 'text-search';
            } else {
                showAllButton = null;
            }
        }

        let initialCount = 0;
        let finalCount = 0;

        // ==================================================
        // PASO 2.4: Si existe el botón, hacer clic
        // ==================================================
        if (showAllButton) {
            console.log('[Chapters] Haciendo clic en "Ver todo"...');
            
            // Contar capítulos iniciales
            initialCount = await page.evaluate(() => {
                return document.querySelectorAll('a[href*="/leer/"]').length;
            });
            
            console.log('[Chapters] Capítulos iniciales:', initialCount);
            
            try {
                // Hacer clic
                await showAllButton.click();
                console.log('[Chapters] ✅ Click realizado');
                
                // ==================================================
                // PASO 2.5: Esperar a que carguen MÁS capítulos
                // ==================================================
                console.log('[Chapters] Esperando que carguen más capítulos...');
                
                await page.waitForFunction((initialCount) => {
                    const currentCount = document.querySelectorAll('a[href*="/leer/"]').length;
                    console.log('[Puppeteer] Capítulos actuales:', currentCount);
                    return currentCount > initialCount;
                }, { 
                    timeout: 15000,  // 15 segundos
                    polling: 500     // Verificar cada 500ms
                }, initialCount);
                
                console.log('[Chapters] ✅ Nuevos capítulos detectados');
                
                // Esperar un poco más para asegurar que todos cargaron
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Contar capítulos finales
                finalCount = await page.evaluate(() => {
                    return document.querySelectorAll('a[href*="/leer/"]').length;
                });
                
                console.log('[Chapters] ✅ Capítulos expandidos:', initialCount, '→', finalCount);
                console.log('[Chapters] Capítulos adicionales cargados:', finalCount - initialCount);
                
            } catch (clickError) {
                console.warn('[Chapters] ⚠️ Error al hacer clic o esperar:', clickError.message);
                console.warn('[Chapters] Continuando con capítulos visibles...');
            }
            
        } else {
            console.log('[Chapters] ℹ️ No se encontró botón "Ver todo"');
            console.log('[Chapters] Intentando estrategia de scroll...');
            
            // ==================================================
            // PASO 3: FALLBACK - SCROLL INFINITO
            // ==================================================
            try {
                // Contar capítulos antes del scroll
                const beforeScroll = await page.evaluate(() => {
                    return document.querySelectorAll('a[href*="/leer/"]').length;
                });
                
                console.log('[Chapters] Implementando scroll infinito...');
                console.log('[Chapters] Capítulos antes del scroll:', beforeScroll);
                
                // Hacer scroll progresivo
                await page.evaluate(async () => {
                    const scrollContainer = document.querySelector('.chapters-list') || 
                                           document.querySelector('[class*="chapter"]') || 
                                           document.body;
                    
                    let previousHeight = 0;
                    let currentHeight = scrollContainer.scrollHeight;
                    let attempts = 0;
                    const maxAttempts = 10; // Máximo 10 intentos
                    
                    console.log('[Puppeteer] Iniciando scroll infinito...');
                    
                    while (previousHeight !== currentHeight && attempts < maxAttempts) {
                        previousHeight = currentHeight;
                        
                        // Scroll hacia abajo
                        scrollContainer.scrollTo(0, currentHeight);
                        console.log('[Puppeteer] Scroll a:', currentHeight);
                        
                        // Esperar a que cargue más contenido
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        currentHeight = scrollContainer.scrollHeight;
                        attempts++;
                        
                        console.log('[Puppeteer] Intento', attempts, '- Altura:', currentHeight);
                    }
                    
                    console.log('[Puppeteer] Scroll infinito completado después de', attempts, 'intentos');
                });
                
                // Contar capítulos después del scroll
                const afterScroll = await page.evaluate(() => {
                    return document.querySelectorAll('a[href*="/leer/"]').length;
                });
                
                console.log('[Chapters] Capítulos después de scroll:', beforeScroll, '→', afterScroll);
                console.log('[Chapters] Capítulos adicionales cargados:', afterScroll - beforeScroll);
                
                initialCount = beforeScroll;
                finalCount = afterScroll;
                
            } catch (scrollError) {
                console.warn('[Chapters] ⚠️ Error en scroll infinito:', scrollError.message);
                console.warn('[Chapters] Continuando con capítulos actuales...');
            }
        }

        // ==================================================
        // PASO 2.6: Extraer TODOS los capítulos
        // ==================================================
        console.log('[Chapters] Extrayendo capítulos...');

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
                    const match = href.match(/\/leer\/[^-]+-([\d]+(?:\.[\d]+)?)/);
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

        console.log('[Chapters] Total de capítulos extraídos:', chapters.length);
        
        // ==================================================
        // PASO 4: LOGGING DETALLADO - RESUMEN FINAL
        // ==================================================
        const finalChapterCount = await page.evaluate(() => {
            return document.querySelectorAll('a[href*="/leer/"]').length;
        });

        console.log('[Chapters] ===== RESUMEN =====');
        console.log('[Chapters] URL:', manhwaUrl);
        console.log('[Chapters] Botón "Ver todo" encontrado:', !!showAllButton ? '✅ SÍ' : '❌ NO');
        if (showAllButton) {
            console.log('[Chapters] Selector usado:', selectorUsed);
            console.log('[Chapters] Capítulos antes del click:', initialCount);
            console.log('[Chapters] Capítulos después del click:', finalCount);
        }
        console.log('[Chapters] Capítulos en el DOM final:', finalChapterCount);
        console.log('[Chapters] Capítulos extraídos para la API:', chapters.length);
        console.log('[Chapters] Tiempo total:', Date.now() - startTime, 'ms');
        console.log('[Chapters] ======================');

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
