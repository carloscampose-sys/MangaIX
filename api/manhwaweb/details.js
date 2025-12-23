/**
 * API Serverless para obtener detalles completos de una obra de ManhwaWeb
 * 
 * Esta API usa Puppeteer para scrapear la página de detalles y extraer:
 * - Sinopsis/descripción de la historia
 * - Autor/artista
 * - Géneros
 * - Estado (publicándose, pausado, finalizado)
 * - Número de capítulos
 * 
 * @version 1.0.0
 * @date 2025-12-22
 */

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
        console.log(`[ManhwaWeb Details] Obteniendo detalles de: "${slug}"`);
        console.log(`[ManhwaWeb Details] Environment: ${isVercel ? 'Vercel' : 'Local'}`);

        // Configuración diferente para Vercel vs Local
        const browserConfig = isVercel ? {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        } : {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };

        console.log('[ManhwaWeb Details] Iniciando browser...');
        browser = await puppeteer.launch(browserConfig);

        const page = await browser.newPage();

        // Configurar headers para parecer un navegador real
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navegar a la página de detalles
        const url = `https://manhwaweb.com/manhwa/${slug}`;
        console.log(`[ManhwaWeb Details] Navegando a: ${url}`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',  // Más rápido que networkidle0
            timeout: 30000
        });

        // ===== PASO 1: ESPERA INTELIGENTE HASTA QUE EL CONTENIDO REALMENTE CARGUE =====
        console.log('[ManhwaWeb Details] Esperando carga de contenido SPA...');
        
        let contentLoaded = false;
        
        try {
            // Esperar hasta que el contenido REAL se renderice
            await page.waitForFunction(() => {
                const h1 = document.querySelector('h1');
                const h2 = document.querySelector('h2');
                const paragraphs = document.querySelectorAll('p');
                const bodyText = document.body.innerText || '';
                
                // Validaciones
                const hasTitle = (h1?.textContent?.trim().length > 5) || (h2?.textContent?.trim().length > 10);
                const hasParagraphs = paragraphs.length >= 3;
                const bodyLength = bodyText.length;
                const hasSubstantialContent = bodyLength > 1000;
                
                // Verificar que NO sea página de error
                const isErrorPage = bodyText.toLowerCase().includes('404') || 
                                   bodyText.toLowerCase().includes('not found') ||
                                   bodyText.toLowerCase().includes('no existe');
                
                console.log('[Puppeteer] Esperando contenido...', {
                    hasTitle,
                    hasParagraphs,
                    paragraphCount: paragraphs.length,
                    bodyLength,
                    hasSubstantialContent
                });
                
                return hasTitle && hasParagraphs && hasSubstantialContent && !isErrorPage;
            }, { 
                timeout: 20000, // 20 segundos máximo
                polling: 1000   // Verificar cada segundo
            });
            
            console.log('[ManhwaWeb Details] ✅ Contenido principal cargado');
            contentLoaded = true;
            
        } catch (timeoutError) {
            console.warn('[ManhwaWeb Details] ⚠️ Timeout esperando contenido completo:', timeoutError.message);
            console.warn('[ManhwaWeb Details] Intentando extraer lo que haya disponible...');
        }
        
        // ===== PASO 2: SCROLL PARA ACTIVAR LAZY LOADING =====
        console.log('[ManhwaWeb Details] Haciendo scroll para activar lazy loading...');
        
        try {
            await page.evaluate(() => {
                // Scroll a la mitad de la página
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            
            // Esperar a que cargue contenido lazy
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Scroll de vuelta arriba
            await page.evaluate(() => {
                window.scrollTo(0, 0);
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('[ManhwaWeb Details] ✅ Scroll completado');
            
        } catch (scrollError) {
            console.warn('[ManhwaWeb Details] Error en scroll:', scrollError.message);
        }

        // ===== PASO 4: FALLBACK CON JSON-LD =====
        console.log('[ManhwaWeb Details] Buscando JSON-LD estructurado...');
        
        const jsonLdData = await page.evaluate(() => {
            // Buscar script con tipo application/ld+json
            const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            
            const parsedData = [];
            for (const script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    parsedData.push(data);
                } catch (e) {
                    console.log('[JSON-LD] Error parseando:', e.message);
                }
            }
            
            return parsedData;
        });
        
        if (jsonLdData && jsonLdData.length > 0) {
            console.log('[ManhwaWeb Details] JSON-LD encontrado:', JSON.stringify(jsonLdData, null, 2));
            
            // Intentar extraer datos del JSON-LD
            for (const data of jsonLdData) {
                if (data.name || data.title) {
                    console.log('[JSON-LD] Título encontrado:', data.name || data.title);
                }
                if (data.description) {
                    console.log('[JSON-LD] Descripción encontrada:', data.description.substring(0, 100));
                }
                if (data.author) {
                    console.log('[JSON-LD] Autor encontrado:', data.author?.name || data.author);
                }
            }
        } else {
            console.log('[ManhwaWeb Details] No se encontró JSON-LD');
        }
        
        // Debug: Capturar estructura HTML para entender los selectores
        const debugInfo = await page.evaluate(() => {
            const allClasses = Array.from(document.querySelectorAll('[class]'))
                .map(el => el.className)
                .filter(c => c && typeof c === 'string')
                .slice(0, 50);
            
            const allIds = Array.from(document.querySelectorAll('[id]'))
                .map(el => el.id)
                .filter(id => id)
                .slice(0, 20);
            
            const h1Text = document.querySelector('h1')?.textContent || 'NO H1';
            const h2Text = document.querySelector('h2')?.textContent || 'NO H2';
            const firstPText = document.querySelector('p')?.textContent?.substring(0, 100) || 'NO P';
            
            // Encontrar todos los párrafos con texto largo
            const allParagraphs = Array.from(document.querySelectorAll('p'));
            const longParagraphs = allParagraphs
                .filter(p => p.textContent.trim().length > 100)
                .map((p, i) => ({
                    index: i,
                    length: p.textContent.trim().length,
                    className: p.className,
                    id: p.id,
                    parentClass: p.parentElement?.className || '',
                    text: p.textContent.trim().substring(0, 150) + '...'
                }))
                .slice(0, 5);
            
            // Si no hay párrafos largos, mostrar los primeros 5 párrafos de cualquier longitud
            const sampleParagraphs = longParagraphs.length > 0 ? longParagraphs : 
                allParagraphs.slice(0, 5).map((p, i) => ({
                    index: i,
                    length: p.textContent.trim().length,
                    className: p.className,
                    id: p.id,
                    parentClass: p.parentElement?.className || '',
                    text: p.textContent.trim().substring(0, 100)
                }));
            
            return {
                sampleClasses: [...new Set(allClasses)].slice(0, 20),
                sampleIds: allIds,
                h1Text,
                h2Text,
                firstPText,
                bodyTextLength: document.body.innerText?.length || 0,
                paragraphCount: document.querySelectorAll('p').length,
                longParagraphs,
                sampleParagraphs, // Nuevos: mostrar párrafos de muestra
                hasDescriptionClass: !!document.querySelector('.description, [class*="description"]'),
                hasSynopsisClass: !!document.querySelector('.synopsis, [class*="synopsis"]')
            };
        });
        
        console.log('[ManhwaWeb Details] Debug Info:', JSON.stringify(debugInfo, null, 2));

        // Extraer datos de la página
        console.log('[ManhwaWeb Details] Extrayendo información...');
        const details = await page.evaluate((jsonLdDataParam) => {
            // Función helper para limpiar texto
            const cleanText = (text) => {
                if (!text) return '';
                return text.replace(/\s+/g, ' ').trim();
            };

            // Título - Buscar en H1, H2 o clases con "title"
            let title = '';
            const h1 = document.querySelector('h1');
            const h2 = document.querySelector('h2');
            const titleEl = document.querySelector('.title, [class*="title"]');
            
            if (h1 && h1.textContent.trim().length > 5) {
                title = cleanText(h1.textContent);
                console.log('[Título] Encontrado en H1:', title);
            } else if (h2 && h2.textContent.trim().length > 10) {
                title = cleanText(h2.textContent);
                console.log('[Título] Encontrado en H2:', title);
            } else if (titleEl) {
                title = cleanText(titleEl.textContent);
                console.log('[Título] Encontrado con clase .title:', title);
            }

            // EXTRAER METADATA Y SINOPSIS POR SEPARADO
            
            // 1. GÉNEROS
            let genres = [];
            const genreSelectors = [
                '.genres a',
                '.genre a',
                '[class*="genre"] a',
                '[class*="Genre"] a',
                '.tags a',
                '[class*="tag"] a',
                '.genre', // Sin <a>
                '.tag',
                '[class*="demographic"]', // Seinen, Shounen, etc.
                '[class*="type"]' // Manhwa, Manhua, etc.
            ];
            
            for (const selector of genreSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    const foundGenres = Array.from(elements)
                        .map(el => cleanText(el.textContent))
                        .filter(g => g && g.length > 2 && g.length < 30);
                    
                    if (foundGenres.length > 0) {
                        genres = [...new Set([...genres, ...foundGenres])]; // Evitar duplicados
                        console.log(`[Géneros] Encontrados con selector "${selector}":`, foundGenres);
                    }
                }
            }
            
            // Buscar también géneros en el texto (keywords comunes)
            if (genres.length === 0) {
                const bodyText = document.body.innerText || '';
                const commonGenres = [
                    'Seinen', 'Shounen', 'Josei', 'Shoujo',
                    'Acción', 'Romance', 'Comedia', 'Drama', 'Fantasía',
                    'Aventura', 'Misterio', 'Horror', 'Slice of Life',
                    'Sobrenatural', 'Psicológico', 'Thriller',
                    'Manhwa', 'Manhua', 'Manga', 'Webtoon'
                ];
                
                for (const genre of commonGenres) {
                    // Buscar patrón: el género aparece solo o precedido por espacio/puntuación
                    const regex = new RegExp(`(?:^|\\s|,)${genre}(?:\\s|,|$)`, 'i');
                    if (regex.test(bodyText) && !genres.includes(genre)) {
                        genres.push(genre);
                    }
                }
                
                if (genres.length > 0) {
                    console.log('[Géneros] Encontrados en texto:', genres);
                }
            }
            
            // 2. ESTADO (Publicándose, Finalizado, etc.)
            let status = '';
            const statusKeywords = ['estado', 'status', 'publicando', 'finalizado', 'completado', 'en emisión'];
            const allElements = Array.from(document.querySelectorAll('div, span, p'));
            
            for (const el of allElements) {
                const text = el.textContent.trim().toLowerCase();
                if (statusKeywords.some(kw => text.includes(kw)) && text.length < 50) {
                    const parent = el.closest('div');
                    if (parent) {
                        status = cleanText(parent.textContent);
                        console.log('[Estado] Encontrado:', status);
                        break;
                    }
                }
            }
            
            // 3. NOMBRES ASOCIADOS (títulos alternativos)
            let alternativeTitles = [];
            const titleKeywords = ['nombres asociados', 'alternative', 'otros nombres', 'también conocido'];
            
            for (const el of allElements) {
                const text = el.textContent.trim().toLowerCase();
                if (titleKeywords.some(kw => text.includes(kw))) {
                    const parent = el.closest('div');
                    if (parent) {
                        const titles = parent.textContent
                            .split('\n')
                            .map(t => t.trim())
                            .filter(t => t && !titleKeywords.some(kw => t.toLowerCase().includes(kw)));
                        alternativeTitles = titles.slice(0, 5); // Máximo 5
                        console.log('[Títulos alternativos] Encontrados:', alternativeTitles.length);
                        break;
                    }
                }
            }
            
            // 4. AUTORES
            let authors = [];
            const authorSelectors = [
                '.author',
                '.authors',
                '.artist',
                '[class*="author"]',
                '[class*="Author"]',
                '[class*="artist"]',
                '[class*="Artist"]',
                '.creator',
                '[class*="creator"]',
                '[data-author]', // Atributo data
                '[data-artist]'
            ];
            
            for (const selector of authorSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    elements.forEach(el => {
                        const authorText = cleanText(el.textContent);
                        // Filtrar texto que no sea realmente un autor
                        const lower = authorText.toLowerCase();
                        
                        // Lista de palabras prohibidas (no pueden ser autores)
                        const invalidWords = [
                            'autor', 'autores', 'artist', 'by', 'de',
                            'género', 'genero', 'géneros', 'generos',
                            'estado', 'status',
                            'todos', 'all', 'ver', 'see', 'más', 'more',
                            'capítulo', 'chapter', 'leer', 'read',
                            'suscríbete', 'subscribe', 'comentar', 'comment'
                        ];
                        
                        const hasInvalidWords = invalidWords.some(word => lower.includes(word));
                        
                        // Validaciones para que sea un nombre válido
                        const isValidAuthor = authorText && 
                                             authorText.length >= 3 && 
                                             authorText.length < 100 &&
                                             !hasInvalidWords &&
                                             !/^\d+$/.test(authorText) && // No solo números
                                             !/^[^a-zA-Z0-9]+$/.test(authorText) && // Debe tener letras/números
                                             authorText.split(/\s+/).length <= 6; // Máximo 6 palabras
                        
                        if (isValidAuthor && !authors.includes(authorText)) {
                            authors.push(authorText);
                            console.log('[Autor] Encontrado con selector:', authorText);
                        } else if (authorText && authorText.length > 0) {
                            console.log('[Autor] Rechazado (inválido):', authorText);
                        }
                    });
                    
                    if (authors.length > 0) break;
                }
            }
            
            // Estrategia 2: Buscar en el texto con patrones más flexibles
            if (authors.length === 0) {
                const bodyText = document.body.innerText || '';
                
                // Patrones más estrictos para capturar autores
                const patterns = [
                    // "Autores: Nombre" - debe estar seguido de Géneros, Estado, Nombres o Capítulos
                    /Autor(?:es)?[:\s]+([A-Z][^\n\r]{1,50}?)(?=\s*(?:Género|Estado|Nombre|Capítulo))/i,
                    // "Autores Nombre" sin dos puntos - nombre debe empezar con mayúscula
                    /Autor(?:es)?\s+([A-Z][a-zA-Z0-9\s]{2,40})(?=\s*(?:Género|Estado))/,
                    // "Artist: Nombre"
                    /Artist[:\s]+([A-Z][^\n\r]{1,50}?)(?=\s*(?:Genre|Status|Alternative|Chapter))/i,
                    // "By Nombre" - nombre debe empezar con mayúscula
                    /By[:\s]+([A-Z][a-zA-Z0-9\s]{2,40})(?=\s*(?:Genre|Status|$))/
                ];
                
                for (const pattern of patterns) {
                    const match = bodyText.match(pattern);
                    if (match && match[1]) {
                        const authorName = cleanText(match[1]);
                        // Verificar que no sea metadata u otro campo
                        const lower = authorName.toLowerCase();
                        
                        // Palabras prohibidas ampliadas
                        const invalidWords = [
                            'género', 'genero', 'estado', 'nombre', 'capítulo',
                            'todos', 'all', 'ver', 'más', 'leer', 'desconocido',
                            'unknown', 'n/a', 'none', 'sin', 'without',
                            'vida', 'life', 'recuentos', 'romance', 'comedia',
                            'acción', 'drama', 'fantasía', 'aventura', 'misterio',
                            'seinen', 'shounen', 'josei', 'shoujo',
                            'manhwa', 'manhua', 'manga', 'webtoon'
                        ];
                        
                        const hasInvalidWords = invalidWords.some(word => lower.includes(word));
                        
                        // El nombre debe empezar con mayúscula (nombres propios)
                        const startsWithCapital = /^[A-Z]/.test(authorName);
                        
                        const isValid = authorName.length >= 3 && 
                                       authorName.length < 100 &&
                                       !hasInvalidWords &&
                                       startsWithCapital && // NUEVO: debe empezar con mayúscula
                                       !/^\d+$/.test(authorName) && // No solo números
                                       !/^[^a-zA-Z0-9]+$/.test(authorName) && // Debe tener letras/números
                                       authorName.split(/\s+/).length <= 6; // Máximo 6 palabras
                        
                        if (isValid && !authors.includes(authorName)) {
                            authors.push(authorName);
                            console.log('[Autor] Encontrado en texto con patrón:', authorName);
                            break;
                        } else {
                            console.log('[Autor] Rechazado (inválido) del patrón:', authorName);
                        }
                    }
                }
            }
            
            // Estrategia 3: Buscar spans o divs que contengan solo un nombre (probable autor)
            if (authors.length === 0) {
                const invalidWords = [
                    'género', 'genero', 'estado', 'capítulo', 'nombre',
                    'todos', 'all', 'ver', 'más', 'leer', 'desconocido',
                    'comentar', 'suscríbete', 'iniciar', 'sesión',
                    'vida', 'life', 'recuentos', 'romance', 'comedia',
                    'acción', 'drama', 'fantasía', 'aventura', 'misterio',
                    'seinen', 'shounen', 'josei', 'shoujo',
                    'manhwa', 'manhua', 'manga', 'webtoon'
                ];
                
                const possibleAuthors = Array.from(document.querySelectorAll('span, div'))
                    .map(el => cleanText(el.textContent))
                    .filter(text => {
                        // Nombre corto, sin números, sin keywords de metadata
                        const words = text.split(/\s+/);
                        const lower = text.toLowerCase();
                        const hasInvalidWords = invalidWords.some(word => lower.includes(word));
                        const startsWithCapital = /^[A-Z]/.test(text);
                        
                        return text.length >= 3 && 
                               text.length < 50 &&
                               words.length <= 4 && // Máximo 4 palabras
                               !hasInvalidWords &&
                               startsWithCapital && // Debe empezar con mayúscula
                               !/^\d+$/.test(text) && // No solo números
                               !/^[^a-zA-Z0-9]+$/.test(text); // Debe tener letras/números
                    });
                
                // Buscar en el contexto si alguno aparece después de "Autor" o "Artist"
                const bodyText = document.body.innerText || '';
                for (const possibleAuthor of possibleAuthors) {
                    const contextPattern = new RegExp(`Autor(?:es)?[:\\s]+${possibleAuthor}`, 'i');
                    if (contextPattern.test(bodyText)) {
                        authors.push(possibleAuthor);
                        console.log('[Autor] Encontrado por contexto:', possibleAuthor);
                        break;
                    }
                }
            }
            
            // Log final de autores
            console.log('[Autores] Total encontrados:', authors.length, authors);
            
            // 5. SINOPSIS/DESCRIPCIÓN (SOLO LA HISTORIA, SIN METADATA)
            let description = '';
            
            // ===== ESTRATEGIA 0: BUSCAR TEXTO ENTRE TÍTULO Y LISTA DE CAPÍTULOS =====
            // Esta es la estrategia más específica para ManhwaWeb
            const h2Element = document.querySelector('h2');
            if (h2Element && !description) {
                console.log('[Descripción] Intentando estrategia de texto entre título y capítulos...');
                
                // Obtener todo el texto del body
                const bodyText = document.body.innerText || '';
                
                // Buscar la posición del título
                const titleText = h2Element.textContent.trim();
                const titleIndex = bodyText.indexOf(titleText);
                
                // Buscar la posición de "Ocultar previews" (inicio de lista de capítulos)
                const chapterListIndex = bodyText.indexOf('Ocultar previews');
                
                if (titleIndex !== -1 && chapterListIndex !== -1 && chapterListIndex > titleIndex) {
                    // Extraer el texto entre el título y la lista de capítulos
                    const textBetween = bodyText.substring(titleIndex + titleText.length, chapterListIndex).trim();
                    
                    console.log('[Descripción] Texto entre título y capítulos:', textBetween.substring(0, 200));
                    
                    // Validar que sea texto sustancial (no solo metadata)
                    if (textBetween.length > 100 && textBetween.length < 2000) {
                        // Limpiar metadata (géneros, estado, etc.)
                        const lines = textBetween.split('\n').map(l => l.trim()).filter(l => l);
                        
                        // Filtrar líneas que sean metadata
                        const metadataKeywords = ['género', 'genero', 'estado', 'autor', 'romance', 'comedia', 'manhwa', 'seinen'];
                        const contentLines = lines.filter(line => {
                            const lower = line.toLowerCase();
                            const isMetadata = metadataKeywords.some(kw => lower.includes(kw)) && line.length < 50;
                            return !isMetadata && line.length > 20;
                        });
                        
                        if (contentLines.length > 0) {
                            description = contentLines.join(' ').trim();
                            console.log('[Descripción] ✅ Encontrada entre título y capítulos:', description.substring(0, 100));
                        }
                    }
                }
            }
            
            // Estrategia 1: Selectores CSS comunes
            const descSelectors = [
                '.description',
                '.synopsis', 
                '.summary',
                '.about',
                '.story',
                '.overview',
                '[class*="description"]',
                '[class*="Description"]',
                '[class*="synopsis"]',
                '[class*="Synopsis"]',
                '[class*="summary"]',
                '[class*="Summary"]',
                '[class*="about"]',
                '[class*="About"]',
                '[class*="story"]',
                '[class*="Story"]',
                '[class*="overview"]',
                '[class*="content"]',
                '[class*="Content"]',
                'div[class*="text"] p',
                'div[class*="Text"] p',
                '.info p',
                '.detail p',
                '.manga-info p',
                '.manhwa-info p'
            ];
            
            for (const selector of descSelectors) {
                try {
                    const el = document.querySelector(selector);
                    if (el && el.textContent.length > 50) {
                        description = cleanText(el.textContent);
                        console.log(`[Descripción] Encontrada con selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Ignorar errores de selectores inválidos
                }
            }

            // Estrategia 2: Buscar por estructura (div que contenga párrafos largos)
            if (!description) {
                const divs = Array.from(document.querySelectorAll('div'));
                for (const div of divs) {
                    // Excluir divs de comentarios
                    if (div.closest('#comments, .comments, [class*="comment"], [id*="comment"], [class*="intensedebate"], [class*="disqus"]')) {
                        continue;
                    }
                    
                    const paragraphs = Array.from(div.querySelectorAll('p'));
                    if (paragraphs.length > 0) {
                        const combinedText = paragraphs.map(p => p.textContent).join(' ').trim();
                        const lower = combinedText.toLowerCase();
                        
                        // Verificar que no sea sección de comentarios
                        const isCommentSection = lower.includes('comentar') || 
                                                lower.includes('suscríbete') || 
                                                lower.includes('intensedebate') ||
                                                lower.includes('iniciar sesión');
                        
                        if (combinedText.length > 100 && combinedText.length < 2000 && !isCommentSection) {
                            description = cleanText(combinedText);
                            console.log('[Descripción] Encontrada en div con múltiples párrafos');
                            break;
                        }
                    }
                }
            }

            // Estrategia 3: Buscar cualquier párrafo largo (como última opción)
            if (!description) {
                const paragraphs = Array.from(document.querySelectorAll('p'));
                const longParagraphs = paragraphs.filter(p => {
                    const text = p.textContent.trim();
                    const lower = text.toLowerCase();
                    
                    // Excluir secciones de comentarios, login, RSS, etc.
                    const excludeKeywords = [
                        'comentar', 'comment', 'intensedebate', 'disqus',
                        'suscríbete', 'subscribe', 'rss', 'feed',
                        'iniciar sesión', 'login', 'sign in', 'register',
                        'olvidaste', 'forgot password', 'lost password',
                        'admin options', 'disable comments',
                        'publicando anónimamente', 'posting anonymously',
                        'se muestra junto a tus comentarios',
                        'twitter', 'facebook', 'share'
                    ];
                    
                    const isCommentSection = excludeKeywords.some(kw => lower.includes(kw));
                    
                    return text.length > 100 && 
                           text.length < 2000 && 
                           !isCommentSection;
                });
                
                if (longParagraphs.length > 0) {
                    // Preferir el primer párrafo largo que NO esté en header/nav/footer/comments
                    const validParagraph = longParagraphs.find(p => {
                        const parent = p.closest('header, nav, footer, aside, #comments, .comments, [class*="comment"], [id*="comment"]');
                        return !parent;
                    });
                    
                    if (validParagraph) {
                        description = cleanText(validParagraph.textContent);
                        console.log('[Descripción] Encontrada en párrafo largo fuera de nav/header/footer/comments');
                    } else if (longParagraphs[0]) {
                        description = cleanText(longParagraphs[0].textContent);
                        console.log('[Descripción] Encontrada en primer párrafo largo disponible');
                    }
                }
            }

            // Estrategia 4: Buscar por texto que contenga palabras clave de sinopsis
            if (!description) {
                const allText = Array.from(document.querySelectorAll('p, div'))
                    .filter(el => {
                        // Excluir elementos de comentarios
                        return !el.closest('#comments, .comments, [class*="comment"], [id*="comment"], [class*="intensedebate"]');
                    })
                    .map(el => ({
                        text: el.textContent.trim(),
                        element: el
                    }));
                
                const keywords = ['historia', 'protagonista', 'mundo', 'aventura', 'poder', 'vida', 'año', 'cuando'];
                const excludeKeywords = ['comentar', 'suscríbete', 'intensedebate', 'iniciar sesión'];
                
                const textWithKeywords = allText.find(item => {
                    const lower = item.text.toLowerCase();
                    const hasStoryKeywords = keywords.some(keyword => lower.includes(keyword));
                    const hasExcludeKeywords = excludeKeywords.some(keyword => lower.includes(keyword));
                    
                    return item.text.length > 100 && 
                           item.text.length < 2000 &&
                           hasStoryKeywords &&
                           !hasExcludeKeywords;
                });
                
                if (textWithKeywords) {
                    description = cleanText(textWithKeywords.text);
                    console.log('[Descripción] Encontrada usando keywords');
                }
            }
            
            // ===== PASO 3: EXTRACCIÓN DIRECTA DEL DOM (FALLBACK MEJORADO) =====
            if (!description) {
                console.log('[Descripción] Intentando extracción directa del DOM...');
                
                // Buscar todos los divs que NO estén en nav/footer/header/comments
                const allDivs = Array.from(document.querySelectorAll('div'))
                    .filter(div => {
                        // Excluir elementos de navegación, comentarios, etc.
                        const inExcludedElement = div.closest('nav, footer, header, aside, [id*="comment"], [class*="comment"], [class*="intensedebate"], [class*="navbar"]');
                        return !inExcludedElement;
                    });
                
                // Buscar el div con el texto más largo y sustancial
                let bestCandidate = null;
                let bestScore = 0;
                
                for (const div of allDivs) {
                    const text = div.innerText?.trim() || '';
                    const childDivCount = div.querySelectorAll('div').length;
                    
                    // ===== FILTRO CRÍTICO: Excluir listas de capítulos =====
                    const hasChapterList = text.includes('Ocultar previews') || 
                                          text.includes('Desmarcar todos') ||
                                          text.includes('Invertir orden') ||
                                          /Capítulo \d+/i.test(text) ||
                                          /Chapter \d+/i.test(text);
                    
                    if (hasChapterList) {
                        console.log('[Descripción] Rechazado (lista de capítulos):', text.substring(0, 50));
                        continue;
                    }
                    
                    // Calcular score basado en:
                    // - Longitud del texto
                    // - Pocos divs hijos (no es un contenedor)
                    // - Ratio de palabras vs caracteres especiales
                    const wordCount = text.split(/\s+/).length;
                    const specialCharCount = (text.match(/[@#$%&*()_+=[\]{}|;:'",.<>?/\\]/g) || []).length;
                    const wordRatio = wordCount / (text.length || 1);
                    
                    // Penalizar si tiene muchos números (probablemente es lista)
                    const numberCount = (text.match(/\d+/g) || []).length;
                    const numberPenalty = numberCount > 10 ? 0.5 : 1;
                    
                    const score = (text.length > 100 && text.length < 3000) ? 
                                 (text.length * wordRatio * (1 / (childDivCount + 1)) * numberPenalty) : 0;
                    
                    if (score > bestScore && specialCharCount < text.length * 0.1) {
                        bestScore = score;
                        bestCandidate = text;
                    }
                }
                
                if (bestCandidate && bestCandidate.length > 100) {
                    description = cleanText(bestCandidate);
                    console.log('[Descripción] Encontrada por extracción directa del DOM');
                }
            }
            
            // LIMPIAR DESCRIPCIÓN: Eliminar metadata y secciones no deseadas
            if (description) {
                console.log('[Limpieza] Descripción original (primeros 500 chars):', description.substring(0, 500));
                
                // PASO 1: Eliminar prefijos comunes (MANHWA, MANHUA, MANGA, Seinen, título)
                // Ejemplo: "MANHUASeinenYuan Zun" → ""
                const prefixPatterns = [
                    /^(MANHWA|MANHUA|MANGA|WEBTOON|COMIC)\s*/i,
                    /^(Shounen|Seinen|Josei|Shoujo)\s*/i,
                    /^(Acción|Romance|Comedia|Drama|Fantasía)\s*/i
                ];
                
                for (const pattern of prefixPatterns) {
                    description = description.replace(pattern, '');
                }
                
                // Si empieza con el título de la obra, eliminarlo
                if (title && description.toLowerCase().startsWith(title.toLowerCase())) {
                    description = description.substring(title.length).trim();
                }
                
                console.log('[Limpieza] Después de eliminar prefijos:', description.substring(0, 200));
                
                // PASO 2: Cortar en keywords específicas (incluso si están en medio del texto)
                const cutoffKeywords = [
                    'Ver más',
                    'Géneros',
                    'Generos',
                    'Estado',
                    'Nombres asociados',
                    'Autores',
                    'Autor',
                    'Cerrar mensaje', 
                    'Suscríbete', 
                    'Comentar como', 
                    'Comments by',
                    // ===== CRÍTICO: Lista de capítulos =====
                    'Ocultar previews',
                    'Desmarcar todos',
                    'Invertir orden',
                    'Capítulo 1',
                    'Capitulo 1',
                    'Chapter 1'
                ];
                
                let shortestCutIndex = description.length;
                let foundKeyword = null;
                
                for (const keyword of cutoffKeywords) {
                    const idx = description.indexOf(keyword);
                    if (idx > 50 && idx < shortestCutIndex) { // Al menos 50 caracteres de sinopsis
                        shortestCutIndex = idx;
                        foundKeyword = keyword;
                    }
                }
                
                if (foundKeyword) {
                    console.log(`[Limpieza] Cortando en: "${foundKeyword}" (posición ${shortestCutIndex})`);
                    description = description.substring(0, shortestCutIndex).trim();
                }
                
                // PASO 2: Limpiar línea por línea si tiene saltos
                const lines = description.split('\n').map(l => l.trim()).filter(l => l);
                
                if (lines.length > 1) {
                    const metadataKeywords = [
                        'género', 'genero', 'géneros', 'generos',
                        'estado', 'publicandose', 'publicándose',
                        'nombres asociados', 'alternative',
                        'autor', 'autores', 'artista',
                        'comentar', 'suscríbete', 'intensedebate',
                        'iniciar sesión', 'twitter', 'facebook'
                    ];
                    
                    const cleanLines = lines.filter(line => {
                        const lower = line.toLowerCase();
                        const hasUnwantedKeywords = metadataKeywords.some(kw => lower.includes(kw));
                        const isTooShort = line.length < 40;
                        return !hasUnwantedKeywords && !isTooShort;
                    });
                    
                    if (cleanLines.length > 0) {
                        description = cleanLines.join(' ').trim();
                    }
                }
                
                // PASO 3: Limpieza final de caracteres extraños
                description = description
                    .replace(/\s+/g, ' ') // Múltiples espacios → un espacio
                    .replace(/\s+([.,!?])/g, '$1') // Espacios antes de puntuación
                    .trim();
                
                console.log('[Limpieza] Descripción limpia (primeros 300 chars):', description.substring(0, 300));
            }

            // Usar el autor ya extraído o buscar de nuevo
            let author = authors.length > 0 ? authors.join(', ') : '';
            if (!author) {
                const authorSelectors2 = [
                    '.author',
                    '[class*="author"]',
                    '[class*="artist"]'
                ];
                
                for (const selector of authorSelectors2) {
                    const el = document.querySelector(selector);
                    if (el) {
                        author = cleanText(el.textContent);
                        break;
                    }
                }
            }

            // Si no se encontraron géneros antes, buscar de nuevo
            if (genres.length === 0) {
                const genreElements = document.querySelectorAll('.genre, .tag, [class*="genre"], [class*="tag"]');
                genreElements.forEach(el => {
                    const text = cleanText(el.textContent);
                    if (text && text.length < 30 && !genres.includes(text)) {
                        genres.push(text);
                    }
                });
            }

            // Normalizar estado extraído
            let statusNormalized = 'ongoing';
            if (status) {
                const statusLower = status.toLowerCase();
                if (statusLower.includes('finali') || statusLower.includes('complet')) {
                    statusNormalized = 'completed';
                } else if (statusLower.includes('pausa') || statusLower.includes('hiatus')) {
                    statusNormalized = 'paused';
                } else if (statusLower.includes('publicando') || statusLower.includes('en emisión')) {
                    statusNormalized = 'ongoing';
                }
            }

            // Número de capítulos
            let chaptersCount = 0;
            const chapterElements = document.querySelectorAll('[class*="chapter"], [href*="/chapter"]');
            chaptersCount = chapterElements.length;

            // Imagen de portada
            let cover = '';
            const imgEl = document.querySelector('img[class*="cover"], img[class*="poster"], img[alt*="cover"]');
            if (imgEl) {
                cover = imgEl.src || imgEl.getAttribute('data-src') || '';
            }

            // ===== PASO 4: USAR JSON-LD COMO FALLBACK =====
            if (jsonLdDataParam && jsonLdDataParam.length > 0) {
                console.log('[JSON-LD Fallback] Aplicando datos de JSON-LD...');
                
                for (const data of jsonLdDataParam) {
                    // Título
                    if (!title && (data.name || data.title)) {
                        title = data.name || data.title;
                        console.log('[JSON-LD Fallback] Título desde JSON-LD:', title);
                    }
                    
                    // Descripción
                    if (!description && data.description) {
                        description = data.description;
                        console.log('[JSON-LD Fallback] Descripción desde JSON-LD');
                    }
                    
                    // Autor
                    if (!author && data.author) {
                        author = data.author?.name || (typeof data.author === 'string' ? data.author : '');
                        console.log('[JSON-LD Fallback] Autor desde JSON-LD:', author);
                    }
                    
                    // Géneros
                    if (genres.length === 0 && data.genre) {
                        if (Array.isArray(data.genre)) {
                            genres.push(...data.genre);
                        } else if (typeof data.genre === 'string') {
                            genres.push(data.genre);
                        }
                        console.log('[JSON-LD Fallback] Géneros desde JSON-LD:', genres);
                    }
                    
                    // Cover/imagen
                    if (!cover && (data.image || data.thumbnail)) {
                        cover = data.image || data.thumbnail;
                        if (typeof cover === 'object') {
                            cover = cover.url || cover['@url'] || '';
                        }
                        console.log('[JSON-LD Fallback] Cover desde JSON-LD');
                    }
                }
            }
            
            return {
                title,
                description,
                author,
                genres,
                status: statusNormalized,
                statusRaw: status, // Estado sin procesar
                alternativeTitles, // Títulos alternativos
                chaptersCount,
                cover
            };
        }, jsonLdData);

        await browser.close();
        browser = null;

        // ===== PASO 5: LOGGING MEJORADO PARA DEBUG =====
        console.log('[ManhwaWeb Details] ===== DEBUG SNAPSHOT =====');
        console.log('[ManhwaWeb Details] URL:', url);
        console.log('[ManhwaWeb Details] Contenido cargado:', contentLoaded ? '✅ SÍ' : '⚠️ NO (timeout)');
        console.log('[ManhwaWeb Details] -------- RESULTADOS --------');
        console.log('[ManhwaWeb Details] Título extraído:', details.title || '❌ VACÍO');
        console.log('[ManhwaWeb Details] Autor extraído:', details.author || '❌ VACÍO');
        console.log('[ManhwaWeb Details] Géneros encontrados:', details.genres.length > 0 ? `✅ ${details.genres.length} (${details.genres.join(', ')})` : '❌ NINGUNO');
        console.log('[ManhwaWeb Details] Estado extraído:', details.statusRaw || 'N/A');
        console.log('[ManhwaWeb Details] Sinopsis extraída:', details.description ? `✅ ${details.description.length} caracteres` : '❌ VACÍA');
        console.log('[ManhwaWeb Details] Sinopsis (primeros 200 chars):', details.description?.substring(0, 200) || 'VACÍO');
        console.log('[ManhwaWeb Details] Cover encontrado:', details.cover ? '✅ SÍ' : '❌ NO');
        console.log('[ManhwaWeb Details] ============================');
        
        console.log('[ManhwaWeb Details] Detalles extraídos:', {
            title: details.title,
            descriptionLength: details.description.length,
            author: details.author,
            genresCount: details.genres.length,
            status: details.status,
            chaptersCount: details.chaptersCount
        });

        // Si no se encontró descripción, usar placeholder
        if (!details.description) {
            details.description = "Esta obra está disponible en ManhwaWeb. ¡Descúbrela! 🥑";
        }

        return res.status(200).json({
            success: true,
            details: {
                slug,
                ...details,
                source: 'manhwaweb'
            }
        });

    } catch (error) {
        console.error('[ManhwaWeb Details] Error:', error.message);
        
        if (browser) {
            await browser.close();
        }

        return res.status(500).json({
            success: false,
            error: error.message,
            details: {
                slug,
                title: slug.replace(/-/g, ' ').replace(/_/g, ' '),
                description: "No se pudo obtener la sinopsis. Inténtalo de nuevo más tarde.",
                author: '',
                genres: [],
                status: 'ongoing',
                chaptersCount: 0,
                cover: '',
                source: 'manhwaweb'
            }
        });
    }
}
