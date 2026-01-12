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

    // Recibir todos los filtros desde el frontend (géneros, tipo, estado, erótico, demografía, ordenar, página)
    // IMPORTANTE: Renombrado 'page' a 'pageParam' para evitar conflicto con el objeto Puppeteer 'page'
    // que se crea más adelante con browser.newPage()
    const { query, genres, type, status, erotic, demographic, sortBy, sortOrder, page: pageParam } = req.query;

    // Permitir búsquedas solo con filtros (sin query de texto)
    // if (!query && !genres) {
    //     return res.status(400).json({ error: 'Missing query or genres parameter' });
    // }
    
    // Parsear géneros si vienen como string separado por comas
    // Ejemplo: "accion,aventura,comedia" → ["accion", "aventura", "comedia"]
    // NOTA: Estos son los IDs (nombres), luego se convierten a valores numéricos
    const genreIds = genres ? (typeof genres === 'string' ? genres.split(',') : genres) : [];
    
    // ⚡ CONFIGURACIÓN DE PAGINACIÓN Y OPTIMIZACIÓN
    const CONFIG = {
        resultsPerPage: 20,        // Objetivo: 20 resultados por página
        maxScrolls: 2,             // Reducir de 8 a 2 scrolls
        minScrollWait: 100,         // Espera mínima: 100ms
        maxScrollWait: 500,         // Espera máxima: 500ms (vs 1000ms fija)
        convergenceThreshold: 2,     // 2 iteraciones sin cambios = convergencia
        timeoutNavigation: 15000,   // Timeout navegación: 15s (vs 30s)
        timeoutResults: 8000        // Timeout extracción: 8s (vs 20s)
    };

    console.log('[ManhwaWeb Search] Configuración:', {
        resultsPerPage: CONFIG.resultsPerPage,
        maxScrolls: CONFIG.maxScrolls,
        scrollWait: `${CONFIG.minScrollWait}-${CONFIG.maxScrollWait}ms`,
        timeoutNavigation: `${CONFIG.timeoutNavigation}ms`,
        timeoutResults: `${CONFIG.timeoutResults}ms`
    });
    
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

        // NUEVA ESTRATEGIA: Construir URL con todos los parámetros
        // ManhwaWeb usa parámetros URL para filtros
        // IMPORTANTE: El ORDEN de los parámetros importa en ManhwaWeb
        // Orden correcto: buscar → tipo → demografia → estado → erotico → genders → order_item → order_dir
        let libraryUrl = 'https://manhwaweb.com/library';
        const urlParams = new URLSearchParams();

        const hasTextQuery = query && query.trim() !== '' && query.trim() !== 'undefined';

        if (hasTextQuery) {
            console.log('[ManhwaWeb Search] Búsqueda con texto:', query.trim());
        } else {
            console.log('[ManhwaWeb Search] Búsqueda por filtros únicamente (sin texto)');
        }

        // 1. BUSCAR (siempre incluir, aunque esté vacío)
        urlParams.append('buscar', hasTextQuery ? query.trim() : '');

        // 2. TIPO (antes de géneros)
        urlParams.append('tipo', type || '');

        // 3. DEMOGRAFÍA (antes de estado)
        urlParams.append('demografia', demographic || '');

        // 4. ESTADO
        urlParams.append('estado', status || '');

        // 5. ERÓTICO
        urlParams.append('erotico', erotic || '');

        // ============================================================
        // 6. GÉNEROS (genders) - DESPUÉS de los filtros básicos
        // ============================================================
        // ManhwaWeb usa 'genders' repetido para múltiples géneros
        // URL real con 2 géneros: ?genders=18&genders=2
        if (genreIds.length > 0) {
            // MAPEO REAL Y COMPLETO DE MANHWAWEB (verificado del sitio real)
            const genreMap = {
                'drama': '1',
                'romance': '2',
                'accion': '3',
                'venganza': '5',
                'harem': '6',
                'milf': '8',
                'comedia': '18',
                'tragedia': '25',
                'girls-love': '27',
                'historias-cortas': '28',
                'aventura': '29',
                'ecchi': '30',
                'sobrenatural': '31',
                'horror': '32',
                'ciencia-ficcion': '33',
                'gore': '34',
                'cultivacion': '35',
                'sistema-niveles': '37',
                'apocaliptico': '38',
                'artes-marciales': '39',
                'superpoderes': '40',
                'reencarnacion': '41',
                'recuentos': '42',
                'psicologico': '43',
                'thriller': '44',
                'boys-love': '45',
                'fantasia': '23'
            };
            
            // Agregar cada género como parámetro 'genders' separado
            genreIds.forEach(genreId => {
                const genreValue = genreMap[genreId] || genreId;
                urlParams.append('genders', genreValue);
            });
            
            console.log('[ManhwaWeb Search] Géneros seleccionados:', genreIds);
            console.log('[ManhwaWeb Search] IDs numéricos:', genreIds.map(id => genreMap[id] || id));
        }

        // 7. ORDENAMIENTO (order_item y order_dir) - DESPUÉS de géneros
        urlParams.append('order_item', sortBy || 'alfabetico');
        urlParams.append('order_dir', sortOrder || 'desc');
        console.log('[ManhwaWeb Search] Orden en URL:', sortBy || 'alfabetico', sortOrder || 'desc');

        // 8. PAGINACIÓN - AL FINAL (pero sin incluirlo si es página 1)
        // La URL de ejemplo no tiene parámetro 'page', así que lo omitimos
        const pageNumber = pageParam ? parseInt(pageParam, 10) : 1;
        console.log('[ManhwaWeb Search] Página recibida:', pageParam, 'tipo:', typeof pageParam);
        console.log('[ManhwaWeb Search] Página parseada:', pageNumber);

        // Solo agregar page si es > 1
        if (pageNumber > 1) {
            urlParams.append('page', pageNumber);
        }
        
        // Construir URL final
        const finalUrl = urlParams.toString() ? `${libraryUrl}?${urlParams.toString()}` : libraryUrl;
        console.log(`[ManhwaWeb Search] Navegando con filtros: ${finalUrl}`);
        
        await page.goto(finalUrl, {
            waitUntil: 'domcontentloaded',
            timeout: CONFIG.timeoutNavigation  // ⚡ 15s en lugar de 30s
        });

        // Esperar a que la página cargue completamente
        console.log('[ManhwaWeb Search] Esperando carga de contenido...');
        
        // Si hay búsqueda de texto, usar el campo de búsqueda del sitio
        if (hasTextQuery) {
            console.log('[ManhwaWeb Search] Usando campo de búsqueda del sitio...');
            
            // Esperar a que el campo de búsqueda esté disponible
            // Intentar múltiples selectores comunes para input de búsqueda
            const searchInputFound = await page.waitForSelector('input[type="text"], input[type="search"], input[placeholder*="uscar"], input[placeholder*="ombre"]', { timeout: 10000 })
                .catch(() => null);
            
            if (searchInputFound) {
                console.log('[ManhwaWeb Search] Campo de búsqueda encontrado');
                
                // Escribir el término de búsqueda
                await page.type('input[type="text"], input[type="search"]', query.trim(), { delay: 100 });
                
                // Esperar un momento para que se procese
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Intentar presionar Enter o hacer click en el botón de búsqueda
                await page.keyboard.press('Enter');
                
                // Esperar a que se actualicen los resultados
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log('[ManhwaWeb Search] Búsqueda enviada');
            } else {
                console.warn('[ManhwaWeb Search] No se encontró el campo de búsqueda, continuando sin búsqueda de texto...');
            }
        }
        
        // Esperar a que se carguen las tarjetas iniciales
        // Aumentar timeout y usar selectores alternativos
        await page.waitForFunction(() => {
            // Intentar múltiples selectores posibles
            const links1 = document.querySelectorAll('a[href*="/manhwa/"]');
            const links2 = document.querySelectorAll('a[href*="/obra/"]');
            const links3 = document.querySelectorAll('.element a[href]');
            return links1.length > 0 || links2.length > 0 || links3.length > 0;
        }, { timeout: 20000 }).catch(() => {
            console.log('[ManhwaWeb Search] Timeout esperando resultados, intentando extraer de todos modos...');
        });

        // ============================================================
        // ⚡ SCROLL INTELIGENTE CON WAIT DINÁMICO
        // Soluciona el problema de timeout en Vercel (10s límite)
        // Estrategia: Scroll inteligente + early exit + wait dinámico
        // ============================================================
        console.log('[ManhwaWeb Search] ⚡ Iniciando scroll inteligente...');
        
        let previousCount = 0;
        let currentCount = 0;
        let scrollAttempts = 0;
        let noChangeCount = 0;  // Contador de iteraciones sin cambios
        
        do {
            previousCount = currentCount;
            
            // Scroll hacia abajo
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            // ⚡ WAIT DINÁMICO: Esperar hasta que cargue algo nuevo
            const waitStart = Date.now();
            await page.evaluate((minWait, maxWait) => {
                return new Promise(resolve => {
                    const startTime = Date.now();
                    let lastCount = 0;
                    const checkInterval = 50;  // Verificar cada 50ms
                    
                    const interval = setInterval(() => {
                        const currentCount = Math.max(
                            document.querySelectorAll('a[href*="/manhwa/"]').length,
                            document.querySelectorAll('a[href*="/obra/"]').length,
                            document.querySelectorAll('.element a[href]').length
                        );
                        
                        const elapsed = Date.now() - startTime;
                        
                        // Si hay nuevos elementos, resolver
                        if (currentCount > lastCount) {
                            clearInterval(interval);
                            resolve();
                            return;
                        }
                        
                        // Si superamos el tiempo máximo, resolver
                        if (elapsed >= maxWait) {
                            clearInterval(interval);
                            resolve();
                            return;
                        }
                        
                        // Si superamos el tiempo mínimo sin cambios, continuar esperando
                        if (elapsed >= minWait) {
                            clearInterval(interval);
                            resolve();
                            return;
                        }
                        
                        lastCount = currentCount;
                    }, checkInterval);
                });
            }, CONFIG.minScrollWait, CONFIG.maxScrollWait);
            
            const waitDuration = Date.now() - waitStart;
            
            // Contar elementos actuales
            currentCount = await page.evaluate(() => {
                const links1 = document.querySelectorAll('a[href*="/manhwa/"]');
                const links2 = document.querySelectorAll('a[href*="/obra/"]');
                const links3 = document.querySelectorAll('.element a[href]');
                return Math.max(links1.length, links2.length, links3.length);
            });
            
            scrollAttempts++;
            
            // ⚡ EARLY EXIT 1: Si ya tenemos suficientes resultados, detener
            if (currentCount >= CONFIG.resultsPerPage) {
                console.log(`[ManhwaWeb Search] ⚡ Early exit: Objetivo ${CONFIG.resultsPerPage} alcanzado en ${scrollAttempts} scrolls`);
                break;
            }
            
            // ⚡ EARLY EXIT 2: Detectar convergencia (sin cambios)
            if (currentCount === previousCount) {
                noChangeCount++;
                if (noChangeCount >= CONFIG.convergenceThreshold) {
                    console.log(`[ManhwaWeb Search] ⚡ Convergencia: No hay más elementos tras ${noChangeCount} intentos`);
                    break;
                }
            } else {
                noChangeCount = 0;  // Resetear contador si hubo cambios
            }
            
            console.log(`[ManhwaWeb Search] ⚡ Scroll ${scrollAttempts}/${CONFIG.maxScrolls}: ${currentCount} resultados (espera: ${waitDuration}ms)`);
            
        } while (scrollAttempts < CONFIG.maxScrolls);
        
        console.log(`[ManhwaWeb Search] Scroll completado. Total: ${currentCount} resultados`);
        
        // Pausa final reducida (500ms en lugar de 1000ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ⚡ Eliminar debug innecesario para reducir tiempo


        // ⚡ EXTRAER Y PAGINAR RESULTADOS
        const extractedResults = await page.evaluate(() => {
            // Intentar múltiples selectores posibles
            let cards = Array.from(document.querySelectorAll('a[href*="/manhwa/"]')).filter(a => a.querySelector('img'));

            // Si no encuentra con /manhwa/, intentar con /obra/
            if (cards.length === 0) {
                cards = Array.from(document.querySelectorAll('a[href*="/obra/"]')).filter(a => a.querySelector('img'));
            }

            // Si aún no encuentra, intentar con .element
            if (cards.length === 0) {
                cards = Array.from(document.querySelectorAll('.element a[href]')).filter(a => a.querySelector('img'));
            }
            
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
                    // Silencioso en producción para reducir logs
                }
            });

            return data;
        });

        // ⚡ CALCULAR PAGINACIÓN
        const startIndex = (pageNumber - 1) * CONFIG.resultsPerPage;
        const endIndex = startIndex + CONFIG.resultsPerPage;
        const paginatedResults = extractedResults.slice(startIndex, endIndex);
        const hasMore = extractedResults.length > endIndex;
        const totalPages = Math.ceil(extractedResults.length / CONFIG.resultsPerPage);

        console.log(`[ManhwaWeb Search] ⚡ Paginación:`, {
            totalExtracted: extractedResults.length,
            page: pageNumber,
            totalPages,
            range: `${startIndex + 1}-${Math.min(endIndex, extractedResults.length)}`,
            returned: paginatedResults.length,
            hasMore
        });

        return res.status(200).json({
            success: true,
            results: paginatedResults,
            count: paginatedResults.length,
            page: pageNumber,
            totalPages,
            hasMore,  // ⚡ Indica si hay más páginas
            totalFound: extractedResults.length  // ⚡ Total de resultados encontrados
        });

    } catch (error) {
        // ⚡ Timeout específico para Vercel
        if (error.message.includes('timeout')) {
            console.error('[ManhwaWeb Search] ❌ Timeout en Vercel (10s límite)');
            // Intentar devolver resultados parciales si existen
            if (typeof extractedResults !== 'undefined' && extractedResults.length > 0) {
                const pageNumber = pageParam ? parseInt(pageParam, 10) : 1;
                const startIndex = (pageNumber - 1) * CONFIG.resultsPerPage;
                const endIndex = startIndex + CONFIG.resultsPerPage;
                const paginatedResults = extractedResults.slice(startIndex, endIndex);
                
                return res.status(200).json({
                    success: true,
                    results: paginatedResults,
                    count: paginatedResults.length,
                    page: pageNumber,
                    hasMore: extractedResults.length > endIndex,
                    totalFound: extractedResults.length,
                    partial: true  // ⚡ Flag que indica que son resultados parciales
                });
            }
        }
        
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
