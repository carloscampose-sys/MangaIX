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
        // ManhwaWeb usa parámetros URL para filtros, no necesitamos clicks
        let libraryUrl = 'https://manhwaweb.com/library';
        const urlParams = new URLSearchParams();
        
        // Agregar búsqueda si existe (ahora es opcional)
        if (query && query.trim() !== '' && query.trim() !== 'undefined') {
            urlParams.append('buscar', query.trim());
            console.log('[ManhwaWeb Search] Búsqueda en URL:', query.trim());
        } else {
            urlParams.append('buscar', ''); // ManhwaWeb requiere el parámetro aunque esté vacío
            console.log('[ManhwaWeb Search] Búsqueda por filtros únicamente (sin texto)');
        }
        
        // ============================================================
        // CONVERSIÓN DE GÉNEROS: ID → VALOR NUMÉRICO (IDs REALES DE MANHWAWEB)
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
        
        // Agregar tipo (ManhwaWeb usa 'tipo' en español)
        if (type) {
            urlParams.append('tipo', type);
            console.log('[ManhwaWeb Search] Tipo en URL:', type);
        } else {
            urlParams.append('tipo', '');
        }
        
        // Agregar estado (ManhwaWeb usa 'estado' en español)
        if (status) {
            urlParams.append('estado', status);
            console.log('[ManhwaWeb Search] Estado en URL:', status);
        } else {
            urlParams.append('estado', '');
        }
        
        // Agregar erótico (ManhwaWeb usa 'erotico' en español)
        if (erotic) {
            urlParams.append('erotico', erotic);
            console.log('[ManhwaWeb Search] Erótico en URL:', erotic);
        } else {
            urlParams.append('erotico', '');
        }
        
        // Agregar demografía (ManhwaWeb usa 'demografia' en español)
        if (demographic) {
            urlParams.append('demografia', demographic);
            console.log('[ManhwaWeb Search] Demografía en URL:', demographic);
        } else {
            urlParams.append('demografia', '');
        }
        
        // Agregar ordenamiento (ManhwaWeb usa 'order_item' y 'order_dir')
        if (sortBy) {
            urlParams.append('order_item', sortBy);
            urlParams.append('order_dir', sortOrder || 'desc');
            console.log('[ManhwaWeb Search] Orden en URL:', sortBy, sortOrder);
        } else {
            urlParams.append('order_item', 'alfabetico');
            urlParams.append('order_dir', 'desc');
        }
        
        // Agregar paginación (page=1, page=2, etc.)
        // Usamos pageParam (no page) porque page es el objeto Puppeteer
        const pageNumber = pageParam ? parseInt(pageParam, 10) : 1;
        console.log('[ManhwaWeb Search] Página recibida:', pageParam, 'tipo:', typeof pageParam);
        console.log('[ManhwaWeb Search] Página parseada:', pageNumber);
        
        if (isNaN(pageNumber)) {
            console.error('[ManhwaWeb Search] ERROR: pageNumber es NaN, usando 1 por defecto');
            urlParams.append('page', 1);
        } else {
            urlParams.append('page', pageNumber);
        }
        
        // Construir URL final
        const finalUrl = urlParams.toString() ? `${libraryUrl}?${urlParams.toString()}` : libraryUrl;
        console.log(`[ManhwaWeb Search] Navegando con filtros: ${finalUrl}`);
        
        await page.goto(finalUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Esperar a que la página cargue completamente
        console.log('[ManhwaWeb Search] Esperando carga de contenido...');
        
        // Esperar a que se carguen las tarjetas iniciales
        await page.waitForFunction(() => {
            const links = document.querySelectorAll('a[href*="/manhwa/"]');
            return links.length > 0;
        }, { timeout: 15000 }).catch(() => {
            console.log('[ManhwaWeb Search] Timeout esperando resultados, intentando extraer de todos modos...');
        });

        // ============================================================
        // HACER SCROLL PARA CARGAR MÁS RESULTADOS (lazy loading)
        // Soluciona el problema de obtener solo 1 resultado en filtros como "Comedia"
        // ManhwaWeb usa infinite scroll, debemos hacer scroll para cargar todos
        // ============================================================
        console.log('[ManhwaWeb Search] Haciendo scroll para cargar más resultados...');
        let previousCount = 0;
        let currentCount = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 8; // Limitar a 8 intentos (8 segundos total)
        // Cada scroll carga ~10-20 resultados adicionales
        
        do {
            previousCount = currentCount;
            
            // Scroll hacia abajo hasta el final de la página
            // Esto activa el lazy loading de ManhwaWeb
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            // Esperar 1 segundo a que se carguen nuevos elementos del lazy loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Contar elementos actuales
            currentCount = await page.evaluate(() => {
                return document.querySelectorAll('a[href*="/manhwa/"]').length;
            });
            
            scrollAttempts++;
            console.log(`[ManhwaWeb Search] Scroll ${scrollAttempts}/${maxScrollAttempts}: ${currentCount} resultados`);
            
            // Salir si no hay más elementos nuevos o alcanzamos el límite de scrolls
            // currentCount > previousCount = hay nuevos elementos cargados
        } while (currentCount > previousCount && scrollAttempts < maxScrollAttempts);
        
        console.log(`[ManhwaWeb Search] Scroll completado. Total: ${currentCount} resultados`);
        
        // Pausa final para que se carguen las imágenes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
