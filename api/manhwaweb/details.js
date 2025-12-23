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

        // Esperar a que la página cargue - ManhwaWeb es un SPA
        console.log('[ManhwaWeb Details] Esperando carga de contenido SPA...');
        
        // Esperar a que React/Vue renderice contenido
        // Estrategia mejorada: esperar más tiempo y verificar contenido específico
        let contentLoaded = false;
        const maxAttempts = 10; // 10 intentos * 1.5 segundos = 15 segundos máximo
        
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Aumentado de 1000 a 1500ms
            
            const hasContent = await page.evaluate(() => {
                // Verificar si hay contenido significativo renderizado
                const bodyText = document.body.innerText || '';
                const hasImages = document.querySelectorAll('img').length > 2;
                const hasParagraphs = document.querySelectorAll('p').length > 2;
                const hasH1 = document.querySelector('h1')?.textContent?.length > 5;
                const bodyLength = bodyText.length;
                
                // También verificar que no estemos en una página de error
                const isErrorPage = bodyText.toLowerCase().includes('404') || 
                                   bodyText.toLowerCase().includes('not found');
                
                return (bodyLength > 500 || (hasImages && hasParagraphs && hasH1)) && !isErrorPage;
            });
            
            if (hasContent) {
                console.log(`[ManhwaWeb Details] Contenido cargado después de ${(i + 1) * 1.5} segundos`);
                contentLoaded = true;
                break;
            }
        }
        
        if (!contentLoaded) {
            console.warn('[ManhwaWeb Details] Contenido no cargó completamente, continuando de todas formas...');
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
            const longParagraphs = Array.from(document.querySelectorAll('p'))
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
            
            return {
                sampleClasses: [...new Set(allClasses)].slice(0, 20),
                sampleIds: allIds,
                h1Text,
                h2Text,
                firstPText,
                bodyTextLength: document.body.innerText?.length || 0,
                paragraphCount: document.querySelectorAll('p').length,
                longParagraphs,
                hasDescriptionClass: !!document.querySelector('.description, [class*="description"]'),
                hasSynopsisClass: !!document.querySelector('.synopsis, [class*="synopsis"]')
            };
        });
        
        console.log('[ManhwaWeb Details] Debug Info:', JSON.stringify(debugInfo, null, 2));

        // Extraer datos de la página
        console.log('[ManhwaWeb Details] Extrayendo información...');
        const details = await page.evaluate(() => {
            // Función helper para limpiar texto
            const cleanText = (text) => {
                if (!text) return '';
                return text.replace(/\s+/g, ' ').trim();
            };

            // Título
            const titleEl = document.querySelector('h1, .title, [class*="title"]');
            const title = titleEl ? cleanText(titleEl.textContent) : '';

            // EXTRAER METADATA Y SINOPSIS POR SEPARADO
            
            // 1. GÉNEROS
            let genres = [];
            const genreSelectors = [
                '.genres a',
                '.genre a',
                '[class*="genre"] a',
                '[class*="Genre"] a',
                '.tags a',
                '[class*="tag"] a'
            ];
            
            for (const selector of genreSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    genres = Array.from(elements).map(el => cleanText(el.textContent));
                    console.log(`[Géneros] Encontrados ${genres.length} géneros`);
                    break;
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
                '[class*="author"]',
                '[class*="Author"]'
            ];
            
            for (const selector of authorSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const authorText = cleanText(el.textContent);
                    if (authorText && !authorText.toLowerCase().includes('autor')) {
                        authors = [authorText];
                        console.log('[Autor] Encontrado:', authorText);
                        break;
                    }
                }
            }
            
            // 5. SINOPSIS/DESCRIPCIÓN (SOLO LA HISTORIA, SIN METADATA)
            let description = '';
            
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
                    const paragraphs = Array.from(div.querySelectorAll('p'));
                    if (paragraphs.length > 0) {
                        const combinedText = paragraphs.map(p => p.textContent).join(' ').trim();
                        if (combinedText.length > 100 && combinedText.length < 2000) {
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
                    return text.length > 100 && text.length < 2000;
                });
                
                if (longParagraphs.length > 0) {
                    // Preferir el primer párrafo largo que NO esté en header/nav/footer
                    const validParagraph = longParagraphs.find(p => {
                        const parent = p.closest('header, nav, footer, aside');
                        return !parent;
                    });
                    
                    if (validParagraph) {
                        description = cleanText(validParagraph.textContent);
                        console.log('[Descripción] Encontrada en párrafo largo fuera de nav/header/footer');
                    } else if (longParagraphs[0]) {
                        description = cleanText(longParagraphs[0].textContent);
                        console.log('[Descripción] Encontrada en primer párrafo largo disponible');
                    }
                }
            }

            // Estrategia 4: Buscar por texto que contenga palabras clave de sinopsis
            if (!description) {
                const allText = Array.from(document.querySelectorAll('p, div')).map(el => ({
                    text: el.textContent.trim(),
                    element: el
                }));
                
                const keywords = ['historia', 'protagonista', 'mundo', 'aventura', 'poder', 'vida'];
                const textWithKeywords = allText.find(item => {
                    const lower = item.text.toLowerCase();
                    return item.text.length > 100 && 
                           item.text.length < 2000 &&
                           keywords.some(keyword => lower.includes(keyword));
                });
                
                if (textWithKeywords) {
                    description = cleanText(textWithKeywords.text);
                    console.log('[Descripción] Encontrada usando keywords');
                }
            }
            
            // LIMPIAR DESCRIPCIÓN: Eliminar metadata que pueda haberse colado
            if (description) {
                // Eliminar líneas que contengan palabras clave de metadata
                const metadataKeywords = [
                    'género', 'genero', 'romance', 'comedia', 'acción', 'drama', 'fantasía',
                    'estado', 'publicandose', 'finalizado', 'completado',
                    'nombres asociados', 'alternative', 'también conocido',
                    'autor', 'autores', 'artista'
                ];
                
                const lines = description.split('\n');
                const cleanLines = lines.filter(line => {
                    const lower = line.toLowerCase().trim();
                    // Mantener solo líneas que NO sean metadata (más de 30 caracteres y no contienen keywords)
                    return line.length > 30 && !metadataKeywords.some(kw => lower.startsWith(kw));
                });
                
                description = cleanLines.join(' ').trim();
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
        });

        await browser.close();
        browser = null;

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
