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
        // Intentar esperar por múltiples indicadores de que el contenido cargó
        let contentLoaded = false;
        const maxAttempts = 6; // 6 intentos * 1 segundo = 6 segundos máximo
        
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const hasContent = await page.evaluate(() => {
                // Verificar si hay contenido significativo renderizado
                const bodyText = document.body.innerText || '';
                const hasImages = document.querySelectorAll('img').length > 2;
                const hasParagraphs = document.querySelectorAll('p').length > 2;
                const bodyLength = bodyText.length;
                
                return bodyLength > 500 || hasImages || hasParagraphs;
            });
            
            if (hasContent) {
                console.log(`[ManhwaWeb Details] Contenido cargado después de ${i + 1} segundos`);
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
            
            return {
                sampleClasses: [...new Set(allClasses)].slice(0, 20),
                sampleIds: allIds,
                h1Text,
                h2Text,
                firstPText,
                bodyTextLength: document.body.innerText?.length || 0
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

            // Sinopsis/Descripción
            let description = '';
            const descSelectors = [
                '.description',
                '.synopsis', 
                '.summary',
                '[class*="description"]',
                '[class*="synopsis"]',
                '[class*="summary"]',
                'p[class*="text"]'
            ];
            
            for (const selector of descSelectors) {
                const el = document.querySelector(selector);
                if (el && el.textContent.length > 50) {
                    description = cleanText(el.textContent);
                    break;
                }
            }

            // Si no encontró descripción, buscar cualquier párrafo largo
            if (!description) {
                const paragraphs = Array.from(document.querySelectorAll('p'));
                const longParagraph = paragraphs.find(p => p.textContent.length > 100);
                if (longParagraph) {
                    description = cleanText(longParagraph.textContent);
                }
            }

            // Autor
            let author = '';
            const authorSelectors = [
                '.author',
                '[class*="author"]',
                '[class*="artist"]'
            ];
            
            for (const selector of authorSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    author = cleanText(el.textContent);
                    break;
                }
            }

            // Géneros
            const genres = [];
            const genreElements = document.querySelectorAll('.genre, .tag, [class*="genre"], [class*="tag"]');
            genreElements.forEach(el => {
                const text = cleanText(el.textContent);
                if (text && text.length < 30) {
                    genres.push(text);
                }
            });

            // Estado
            let status = 'ongoing';
            const statusEl = document.querySelector('.status, [class*="status"]');
            if (statusEl) {
                const statusText = cleanText(statusEl.textContent).toLowerCase();
                if (statusText.includes('finali') || statusText.includes('complet')) {
                    status = 'completed';
                } else if (statusText.includes('pausa') || statusText.includes('hiatus')) {
                    status = 'paused';
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
                status,
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
