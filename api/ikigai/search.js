import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Cache para almacenar APIs descubiertas
let discoveredAPIs = {
  searchEndpoint: null,
  searchMethod: 'POST',
  searchHeaders: {},
  lastDiscovery: null
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;
  const hasSearchQuery = query && query.trim();

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] ESTRATEGIA HÍBRIDA: Interactiva + API Discovery');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ============================================');

  // PASO 1: Intentar usar API directa si ya la conocemos
  if (hasSearchQuery && discoveredAPIs.searchEndpoint) {
    console.log('[Ikigai Search] Intentando API directa conocida...');
    
    try {
      const apiResult = await tryDirectAPI(query, filters, page);
      if (apiResult && apiResult.results && apiResult.results.length > 0) {
        console.log(`[Ikigai Search] ✅ API directa exitosa: ${apiResult.results.length} resultados`);
        return res.status(200).json(apiResult);
      } else {
        console.log('[Ikigai Search] ❌ API directa no retornó resultados, usando búsqueda interactiva...');
      }
    } catch (error) {
      console.log('[Ikigai Search] ❌ API directa falló:', error.message);
      console.log('[Ikigai Search] Continuando con búsqueda interactiva...');
    }
  }

  // PASO 2: Usar Puppeteer para descubrir/usar API
  let browser = null;

  try {
    // Iniciar Puppeteer con configuración anti-detección
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-blink-features=AutomationControlled'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const puppeteerPage = await browser.newPage();

    // Configurar User Agent real
    await puppeteerPage.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Anti-detección
    await puppeteerPage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    // INTERCEPTAR TODAS LAS PETICIONES DE RED
    const networkRequests = [];
    const apiRequests = [];

    await puppeteerPage.setRequestInterception(true);
    
    puppeteerPage.on('request', (request) => {
      const url = request.url().toLowerCase();
      const method = request.method();
      const postData = request.postData();

      // Capturar peticiones que podrían ser APIs
      if (url.includes('/api/') || 
          url.includes('/search') || 
          url.includes('/buscar') ||
          url.includes('/series') ||
          (method === 'POST' && postData)) {
        
        const apiRequest = {
          method,
          url: request.url(),
          headers: request.headers(),
          postData,
          timestamp: Date.now()
        };
        
        apiRequests.push(apiRequest);
        console.log(`[Ikigai API Discovery] ${method} ${request.url()}`);
        if (postData) {
          console.log(`[Ikigai API Discovery] Body:`, postData.substring(0, 200));
        }
      }

      // Bloquear ads pero permitir todo lo demás
      const blockedResources = ['ads', 'analytics', 'doubleclick', 'tracking'];
      if (blockedResources.some(resource => url.includes(resource))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Capturar respuestas también
    puppeteerPage.on('response', async (response) => {
      const url = response.url().toLowerCase();
      const status = response.status();
      
      if ((url.includes('/api/') || 
           url.includes('/search') || 
           url.includes('/buscar')) && 
          status === 200) {
        
        try {
          const responseText = await response.text();
          console.log(`[Ikigai API Discovery] Response ${status} from ${response.url()}`);
          console.log(`[Ikigai API Discovery] Response preview:`, responseText.substring(0, 300));
          
          // Intentar parsear como JSON
          try {
            const jsonData = JSON.parse(responseText);
            if (jsonData && (jsonData.results || jsonData.data || Array.isArray(jsonData))) {
              console.log(`[Ikigai API Discovery] ✅ JSON válido encontrado en ${response.url()}`);
              
              // Guardar API descubierta
              const matchingRequest = apiRequests.find(req => req.url === response.url());
              if (matchingRequest) {
                discoveredAPIs = {
                  searchEndpoint: response.url(),
                  searchMethod: matchingRequest.method,
                  searchHeaders: matchingRequest.headers,
                  lastDiscovery: Date.now(),
                  sampleRequest: matchingRequest,
                  sampleResponse: jsonData
                };
                console.log(`[Ikigai API Discovery] 🎯 API guardada: ${response.url()}`);
              }
            }
          } catch (e) {
            // No es JSON válido
          }
        } catch (e) {
          console.log(`[Ikigai API Discovery] Error leyendo respuesta:`, e.message);
        }
      }
    });

    // PASO 3: Estrategia URL con parámetros (más simple y efectiva)
    if (hasSearchQuery) {
      console.log('[Ikigai Search] ESTRATEGIA 1: Búsqueda por URL con parámetros');
      
      try {
        const urlSearchResult = await performURLSearch(puppeteerPage, query, apiRequests);
        
        if (urlSearchResult && urlSearchResult.length > 0) {
          await browser.close();
          console.log(`[Ikigai Search] ✅ Búsqueda por URL exitosa: ${urlSearchResult.length} resultados`);
          
          return res.status(200).json({
            results: urlSearchResult,
            page,
            hasMore: false,
            searchMethod: 'url-search',
            apiDiscovery: {
              foundAPI: !!discoveredAPIs.searchEndpoint,
              endpoint: discoveredAPIs.searchEndpoint,
              requestsCaptured: apiRequests.length
            }
          });
        } else {
          console.log('[Ikigai Search] ❌ Búsqueda por URL no retornó resultados');
        }
      } catch (error) {
        console.log('[Ikigai Search] ❌ Error en búsqueda por URL:', error.message);
      }
    }

    // PASO 4: Fallback - navegar con parámetro URL y descubrir API
    console.log('[Ikigai Search] Navegando para descubrir API...');
    
    // Navegar a la página principal de series
    await puppeteerPage.goto('https://viralikigai.foodib.net/series/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('[Ikigai Search] Página cargada, esperando contenido...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Si hay búsqueda, intentar realizarla para capturar la API
    if (hasSearchQuery) {
      console.log('[Ikigai Search] Realizando búsqueda para descubrir API...');
      
      try {
        // Buscar campo de búsqueda
        const searchSelectors = [
          'input[type="search"]',
          'input[placeholder*="buscar"]',
          'input[placeholder*="search"]',
          'input[name*="search"]',
          'input[name*="buscar"]',
          'input[id*="search"]',
          'input[id*="buscar"]',
          '.search input',
          '[class*="search"] input'
        ];

        let searchInput = null;
        for (const selector of searchSelectors) {
          try {
            searchInput = await puppeteerPage.waitForSelector(selector, { timeout: 2000 });
            if (searchInput) {
              console.log(`[Ikigai Search] Campo encontrado con selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continuar con el siguiente selector
          }
        }

        if (searchInput) {
          console.log('[Ikigai Search] Escribiendo en campo de búsqueda...');
          
          // Limpiar campo y escribir
          await searchInput.click({ clickCount: 3 }); // Seleccionar todo
          await searchInput.type(query, { delay: 100 });
          
          // Esperar un momento para que se registren las peticiones
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Presionar Enter
          await puppeteerPage.keyboard.press('Enter');
          
          // Esperar respuestas de API
          console.log('[Ikigai Search] Esperando respuestas de API...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
        } else {
          console.log('[Ikigai Search] ❌ No se encontró campo de búsqueda');
        }
      } catch (error) {
        console.log('[Ikigai Search] Error en búsqueda interactiva:', error.message);
      }
    }

    // PASO 4: Analizar APIs descubiertas
    console.log(`[Ikigai Search] APIs capturadas: ${apiRequests.length}`);
    
    if (apiRequests.length > 0) {
      console.log('[Ikigai Search] Peticiones API encontradas:');
      apiRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`     Body: ${req.postData.substring(0, 100)}...`);
        }
      });
    }

    // PASO 5: Si descubrimos API, intentar usarla directamente
    if (discoveredAPIs.searchEndpoint && hasSearchQuery) {
      console.log('[Ikigai Search] Intentando usar API recién descubierta...');
      
      try {
        const apiResult = await tryDirectAPI(query, filters, page);
        if (apiResult && apiResult.results && apiResult.results.length > 0) {
          await browser.close();
          console.log(`[Ikigai Search] ✅ API recién descubierta exitosa: ${apiResult.results.length} resultados`);
          return res.status(200).json({
            ...apiResult,
            discoveredAPI: true,
            apiEndpoint: discoveredAPIs.searchEndpoint
          });
        }
      } catch (error) {
        console.log('[Ikigai Search] ❌ API recién descubierta falló:', error.message);
      }
    }

    // PASO 5: Fallback - probar múltiples variaciones de slug
    if (hasSearchQuery) {
      console.log('[Ikigai Search] ESTRATEGIA 2: Entrada alternativa');
      
      try {
        const alternativeResult = await tryAlternativeEntry(puppeteerPage, query);
        
        if (alternativeResult && alternativeResult.length > 0) {
          await browser.close();
          console.log(`[Ikigai Search] ✅ Entrada alternativa exitosa: ${alternativeResult.length} resultados`);
          
          return res.status(200).json({
            results: alternativeResult,
            page,
            hasMore: false,
            searchMethod: 'alternative-entry',
            apiDiscovery: {
              foundAPI: !!discoveredAPIs.searchEndpoint,
              endpoint: discoveredAPIs.searchEndpoint,
              requestsCaptured: apiRequests.length
            }
          });
        } else {
          console.log('[Ikigai Search] ❌ Entrada alternativa no retornó resultados');
        }
      } catch (error) {
        console.log('[Ikigai Search] ❌ Error en entrada alternativa:', error.message);
      }
    }
    if (hasSearchQuery) {
      console.log('[Ikigai Search] ESTRATEGIA 2: Múltiples variaciones de slug');
      
      try {
        const slugResult = await tryMultipleSlugVariations(puppeteerPage, query);
        
        if (slugResult && slugResult.length > 0) {
          await browser.close();
          console.log(`[Ikigai Search] ✅ Variación de slug exitosa: ${slugResult.length} resultados`);
          
          return res.status(200).json({
            results: slugResult,
            page,
            hasMore: false,
            searchMethod: 'slug-variation',
            apiDiscovery: {
              foundAPI: !!discoveredAPIs.searchEndpoint,
              endpoint: discoveredAPIs.searchEndpoint,
              requestsCaptured: apiRequests.length
            }
          });
        } else {
          console.log('[Ikigai Search] ❌ Variaciones de slug no encontraron resultados');
        }
      } catch (error) {
        console.log('[Ikigai Search] ❌ Error en variaciones de slug:', error.message);
      }
    }

    // PASO 6: Fallback final - extraer resultados de la página actual
    console.log('[Ikigai Search] Fallback: extrayendo resultados de página...');
    
    // Esperar a que aparezcan resultados
    try {
      await puppeteerPage.waitForSelector('a[href*="/series/"]', { timeout: 10000 });
    } catch (e) {
      console.log('[Ikigai Search] No se encontraron enlaces de series');
    }

    // Extraer resultados usando el método original
    const results = await puppeteerPage.evaluate(() => {
      const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
      
      const validLinks = Array.from(seriesLinks).filter(link => {
        const href = link.getAttribute('href');
        if (!href || href === '/series/' || href === '/series') return false;
        
        const excludePatterns = ['/clasificacion', '/lists/', '/grupos/'];
        if (excludePatterns.some(pattern => href.includes(pattern))) return false;
        
        const hasImage = link.querySelector('img') !== null;
        const hasTitle = link.querySelector('h3, h2, h1') !== null;
        const hasText = link.textContent && link.textContent.trim().length > 2;
        
        return (hasImage || hasTitle || hasText) && href.split('/series/')[1]?.length > 1;
      });

      return validLinks.map((link, index) => {
        const href = link.getAttribute('href');
        
        const titleElement = link.querySelector('h3') || link.querySelector('h2') || link.querySelector('h1');
        const title = titleElement?.textContent?.trim() || link.getAttribute('title') || '';
        
        const imgElement = link.querySelector('img');
        const cover = imgElement?.src || imgElement?.getAttribute('src') || '';
        
        let slug = '';
        if (href.includes('/series/')) {
          const slugPart = href.split('/series/')[1];
          slug = slugPart?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        }
        
        if (!slug) return null;
        
        const finalTitle = title || slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        return {
          id: `ikigai-${slug}-${Date.now()}-${index}`,
          slug,
          title: finalTitle,
          cover,
          source: 'ikigai'
        };
      }).filter(item => item !== null);
    });

    await browser.close();

    console.log(`[Ikigai Search] Resultados extraídos: ${results.length}`);
    console.log(`[Ikigai Search] API descubierta: ${discoveredAPIs.searchEndpoint ? 'SÍ' : 'NO'}`);

    return res.status(200).json({
      results,
      page,
      hasMore: false, // Por simplicidad en esta implementación
      apiDiscovery: {
        foundAPI: !!discoveredAPIs.searchEndpoint,
        endpoint: discoveredAPIs.searchEndpoint,
        requestsCaptured: apiRequests.length
      }
    });

  } catch (error) {
    console.error('[Ikigai Search] Error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[Ikigai Search] Error cerrando browser:', e);
      }
    }

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}

/**
 * Intenta entrada alternativa para evitar Cloudflare
 */
async function tryAlternativeEntry(puppeteerPage, query) {
  console.log('[Ikigai Alternative] Probando entrada alternativa...');
  
  // Estrategia: Ir primero a la página principal, establecer sesión, luego buscar
  try {
    // Paso 1: Ir a página principal para establecer sesión
    console.log('[Ikigai Alternative] Estableciendo sesión en página principal...');
    await puppeteerPage.goto('https://viralikigai.foodib.net/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Esperar a que se establezca la sesión
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Paso 2: Navegar a la página de series (sin búsqueda)
    console.log('[Ikigai Alternative] Navegando a página de series...');
    await puppeteerPage.goto('https://viralikigai.foodib.net/series/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Paso 3: Obtener todas las series disponibles y filtrar localmente
    console.log('[Ikigai Alternative] Obteniendo todas las series disponibles...');
    
    // Hacer scroll para cargar más contenido
    for (let i = 0; i < 3; i++) {
      await puppeteerPage.evaluate((scrollStep) => {
        window.scrollTo(0, document.body.scrollHeight * scrollStep / 3);
      }, i + 1);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Extraer todas las series y filtrar por búsqueda
    const results = await puppeteerPage.evaluate((searchQuery) => {
      const seriesLinks = document.querySelectorAll('a[href*="/series/"], a[href*="/serie/"]');
      
      console.log(`[Ikigai Alternative] Enlaces de series encontrados: ${seriesLinks.length}`);
      
      const allSeries = Array.from(seriesLinks).map((link, index) => {
        const href = link.getAttribute('href');
        if (!href) return null;
        
        // Extraer slug
        let slug = '';
        if (href.includes('/series/')) {
          slug = href.split('/series/')[1]?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        } else if (href.includes('/serie/')) {
          slug = href.split('/serie/')[1]?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        }
        
        if (!slug || slug.length < 2) return null;
        
        // Extraer título
        let title = '';
        const titleSelectors = ['h1', 'h2', 'h3', '.title', '[class*="title"]'];
        
        for (const selector of titleSelectors) {
          const titleEl = link.querySelector(selector);
          if (titleEl && titleEl.textContent.trim()) {
            title = titleEl.textContent.trim();
            break;
          }
        }
        
        if (!title) {
          title = link.getAttribute('title') || 
                 link.textContent.trim() || 
                 slug.split('-').map(word => 
                   word.charAt(0).toUpperCase() + word.slice(1)
                 ).join(' ');
        }
        
        // Extraer imagen
        const imgElement = link.querySelector('img');
        const cover = imgElement?.src || imgElement?.getAttribute('data-src') || '';
        
        return {
          id: `ikigai-${slug}-${Date.now()}-${index}`,
          slug,
          title: title.substring(0, 100),
          cover,
          source: 'ikigai',
          searchMethod: 'alternative-entry'
        };
      }).filter(item => item !== null);
      
      // Filtrar por búsqueda si se proporciona
      if (!searchQuery || searchQuery.trim() === '') {
        return allSeries.slice(0, 20); // Limitar resultados si no hay búsqueda
      }
      
      const queryWords = searchQuery.toLowerCase().split(' ');
      
      const filteredResults = allSeries.filter(series => {
        const titleLower = series.title.toLowerCase();
        const slugLower = series.slug.toLowerCase();
        
        // Debe coincidir al menos una palabra
        return queryWords.some(word => 
          titleLower.includes(word) || 
          slugLower.includes(word) ||
          word.length >= 3 && (titleLower.includes(word.substring(0, 3)) || slugLower.includes(word.substring(0, 3)))
        );
      });
      
      // Calcular relevancia y ordenar
      filteredResults.forEach(series => {
        let relevance = 0;
        const titleLower = series.title.toLowerCase();
        
        queryWords.forEach(word => {
          if (titleLower.includes(word)) {
            relevance += word.length * 3; // Más peso por coincidencia completa
          } else if (titleLower.includes(word.substring(0, 3))) {
            relevance += 1; // Menos peso por coincidencia parcial
          }
        });
        
        series.relevance = relevance;
      });
      
      return filteredResults
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 15); // Limitar a 15 resultados más relevantes
        
    }, query);
    
    console.log(`[Ikigai Alternative] Series filtradas: ${results.length}`);
    
    if (results.length > 0) {
      console.log('[Ikigai Alternative] Primeros 3 resultados:');
      results.slice(0, 3).forEach((result, i) => {
        console.log(`  ${i + 1}. "${result.title}" (${result.slug}) - Relevancia: ${result.relevance || 0}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.log('[Ikigai Alternative] ❌ Error:', error.message);
    return null;
  }
}

/**
 * Realiza búsqueda usando parámetros URL (método más simple)
 */
async function performURLSearch(puppeteerPage, query, apiRequests) {
  console.log('[Ikigai URL Search] Iniciando búsqueda por URL...');
  
  // Construir URL de búsqueda
  const searchUrl = `https://viralikigai.foodib.net/series/?buscar=${encodeURIComponent(query)}`;
  console.log('[Ikigai URL Search] URL de búsqueda:', searchUrl);

  try {
    // Navegar directamente a la URL de búsqueda
    console.log('[Ikigai URL Search] Navegando a URL de búsqueda...');
    const response = await puppeteerPage.goto(searchUrl, {
      waitUntil: 'networkidle0',
      timeout: 45000 // Más tiempo para Cloudflare
    });

    console.log(`[Ikigai URL Search] Respuesta: ${response.status()}`);

    if (response.status() === 403) {
      console.log('[Ikigai URL Search] ❌ Bloqueado por Cloudflare (403)');
      return null;
    }

    // Esperar más tiempo para que se procese la búsqueda
    console.log('[Ikigai URL Search] Esperando procesamiento de búsqueda...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Verificar URL actual
    const currentUrl = puppeteerPage.url();
    console.log('[Ikigai URL Search] URL actual:', currentUrl);

    // Hacer scroll para activar lazy loading
    console.log('[Ikigai URL Search] Activando lazy loading con scroll...');
    await puppeteerPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await puppeteerPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 2 / 3);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await puppeteerPage.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Buscar resultados con múltiples selectores
    console.log('[Ikigai URL Search] Buscando resultados...');
    
    const results = await puppeteerPage.evaluate((searchQuery) => {
      // Selectores más amplios para encontrar series
      const selectors = [
        'a[href*="/series/"]',
        'a[href*="/serie/"]', 
        '[href*="/series/"]',
        '[href*="/serie/"]'
      ];

      let allLinks = [];
      
      for (const selector of selectors) {
        const links = document.querySelectorAll(selector);
        allLinks.push(...Array.from(links));
      }

      console.log(`[Ikigai URL Search] Enlaces encontrados: ${allLinks.length}`);

      // Filtrar enlaces válidos
      const validLinks = allLinks.filter(link => {
        const href = link.getAttribute('href');
        if (!href) return false;
        
        // Excluir patrones no deseados
        const excludePatterns = [
          '/clasificacion', '/lists/', '/grupos/', '/generos/', 
          '/tags/', '/autores/', '/usuarios/', '/perfil/'
        ];
        
        if (excludePatterns.some(pattern => href.includes(pattern))) return false;
        
        // Debe tener contenido útil
        const hasImage = link.querySelector('img') !== null;
        const hasTitle = link.textContent && link.textContent.trim().length > 2;
        
        return hasImage || hasTitle;
      });

      console.log(`[Ikigai URL Search] Enlaces válidos: ${validLinks.length}`);

      // Extraer información de cada enlace
      const extractedResults = validLinks.map((link, index) => {
        const href = link.getAttribute('href');
        
        // Extraer slug
        let slug = '';
        if (href.includes('/series/')) {
          slug = href.split('/series/')[1]?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        } else if (href.includes('/serie/')) {
          slug = href.split('/serie/')[1]?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
        }
        
        if (!slug || slug.length < 2) return null;

        // Extraer título
        let title = '';
        
        // Buscar en múltiples elementos
        const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.name', '[class*="title"]', '[class*="name"]'];
        for (const selector of titleSelectors) {
          const titleEl = link.querySelector(selector);
          if (titleEl && titleEl.textContent.trim()) {
            title = titleEl.textContent.trim();
            break;
          }
        }
        
        // Fallback: usar atributos o texto del enlace
        if (!title) {
          title = link.getAttribute('title') || 
                 link.getAttribute('alt') || 
                 link.textContent.trim() || '';
        }
        
        // Último fallback: generar desde slug
        if (!title) {
          title = slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }

        // Extraer imagen
        const imgElement = link.querySelector('img');
        const cover = imgElement?.src || 
                     imgElement?.getAttribute('src') || 
                     imgElement?.getAttribute('data-src') || 
                     imgElement?.getAttribute('data-original') || '';

        // Calcular relevancia
        let relevance = 0;
        if (searchQuery && title) {
          const queryWords = searchQuery.toLowerCase().split(' ');
          const titleLower = title.toLowerCase();
          
          queryWords.forEach(word => {
            if (titleLower.includes(word)) {
              relevance += word.length * 2; // Más peso por coincidencia exacta
            }
            // Coincidencia parcial
            if (titleLower.includes(word.substring(0, 3))) {
              relevance += 1;
            }
          });
        }

        return {
          id: `ikigai-${slug}-${Date.now()}-${index}`,
          slug,
          title: title.substring(0, 100), // Limitar longitud
          cover,
          source: 'ikigai',
          relevance,
          searchMethod: 'url-search'
        };
      }).filter(item => item !== null);

      // Ordenar por relevancia y eliminar duplicados
      const uniqueResults = [];
      const seenSlugs = new Set();
      
      extractedResults
        .sort((a, b) => b.relevance - a.relevance)
        .forEach(result => {
          if (!seenSlugs.has(result.slug)) {
            seenSlugs.add(result.slug);
            uniqueResults.push(result);
          }
        });

      console.log(`[Ikigai URL Search] Resultados únicos: ${uniqueResults.length}`);
      
      return uniqueResults;
    }, query);

    console.log(`[Ikigai URL Search] Resultados procesados: ${results.length}`);
    
    // Log de los primeros resultados
    if (results.length > 0) {
      console.log('[Ikigai URL Search] Primeros 5 resultados:');
      results.slice(0, 5).forEach((result, i) => {
        console.log(`  ${i + 1}. "${result.title}" (${result.slug}) - Relevancia: ${result.relevance}`);
      });
    }

    return results;

  } catch (error) {
    console.log('[Ikigai URL Search] ❌ Error:', error.message);
    return null;
  }
}

/**
 * Genera múltiples variaciones de slug para una búsqueda
 */
function generateSlugVariations(query) {
  const baseSlug = query.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Remover guiones al inicio/final

  const variations = [
    baseSlug,
    `${baseSlug}-manhwa`,
    `${baseSlug}-manga`,
    `${baseSlug}-webtoon`,
    `el-${baseSlug}`,
    `la-${baseSlug}`,
    `un-${baseSlug}`,
    `una-${baseSlug}`,
    baseSlug.replace(/-/g, ''), // Sin guiones
    baseSlug.replace(/-/g, '_'), // Guiones bajos
  ];

  // Agregar variaciones con palabras intercambiadas si hay múltiples palabras
  const words = baseSlug.split('-');
  if (words.length > 1) {
    variations.push(words.reverse().join('-')); // Palabras invertidas
  }

  // Remover duplicados y vacíos
  return [...new Set(variations)].filter(v => v.length > 0);
}

/**
 * Intenta acceder directamente usando múltiples variaciones de slug
 */
async function tryMultipleSlugVariations(puppeteerPage, query) {
  console.log('[Ikigai Slug] Generando variaciones de slug...');
  
  const variations = generateSlugVariations(query);
  console.log('[Ikigai Slug] Variaciones generadas:', variations);

  for (const slug of variations) {
    try {
      console.log(`[Ikigai Slug] Probando: ${slug}`);
      
      const url = `https://viralikigai.foodib.net/series/${slug}`;
      const response = await puppeteerPage.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // Verificar si la página existe (no es 404)
      if (response.status() === 200) {
        console.log(`[Ikigai Slug] ✅ Encontrado: ${slug}`);
        
        // Esperar a que se cargue el contenido
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extraer información de la serie
        const seriesInfo = await puppeteerPage.evaluate((currentSlug) => {
          // Buscar título
          const titleSelectors = ['h1', 'h2', '.title', '.series-title', '[class*="title"]'];
          let title = '';
          
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              title = element.textContent.trim();
              break;
            }
          }

          // Buscar imagen de portada
          const imgSelectors = ['img[class*="cover"]', 'img[class*="poster"]', '.cover img', '.poster img', 'img'];
          let cover = '';
          
          for (const selector of imgSelectors) {
            const img = document.querySelector(selector);
            if (img && img.src && !img.src.includes('icon') && !img.src.includes('logo')) {
              cover = img.src;
              break;
            }
          }

          return {
            title: title || currentSlug.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            cover,
            slug: currentSlug
          };
        }, slug);

        if (seriesInfo.title) {
          return [{
            id: `ikigai-${slug}-${Date.now()}`,
            slug: slug,
            title: seriesInfo.title,
            cover: seriesInfo.cover,
            source: 'ikigai',
            searchMethod: 'slug-variation',
            directMatch: true
          }];
        }
      } else {
        console.log(`[Ikigai Slug] ❌ ${slug} - Status: ${response.status()}`);
      }
    } catch (error) {
      console.log(`[Ikigai Slug] ❌ Error con ${slug}:`, error.message);
    }
  }

  console.log('[Ikigai Slug] ❌ Ninguna variación de slug funcionó');
  return null;
}

/**
 * Realiza búsqueda interactiva simulando comportamiento humano
 */
async function performInteractiveSearch(puppeteerPage, query, apiRequests) {
  console.log('[Ikigai Interactive] Iniciando búsqueda interactiva...');
  
  // Navegar a la página principal de series
  console.log('[Ikigai Interactive] Navegando a página de series...');
  await puppeteerPage.goto('https://viralikigai.foodib.net/series/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Esperar a que la página se cargue completamente
  console.log('[Ikigai Interactive] Esperando carga completa...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Buscar campo de búsqueda con múltiples selectores
  const searchSelectors = [
    'input[type="search"]',
    'input[placeholder*="buscar"]',
    'input[placeholder*="search"]',
    'input[placeholder*="Buscar"]',
    'input[placeholder*="Search"]',
    'input[name*="search"]',
    'input[name*="buscar"]',
    'input[name*="query"]',
    'input[id*="search"]',
    'input[id*="buscar"]',
    'input[class*="search"]',
    'input[class*="buscar"]',
    '.search input',
    '.buscar input',
    '[class*="search"] input',
    '[class*="buscar"] input',
    'input[type="text"]' // Último recurso
  ];

  let searchInput = null;
  let usedSelector = null;

  // Listar todos los inputs para debugging
  const allInputs = await puppeteerPage.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    return Array.from(inputs).map(input => ({
      type: input.type,
      name: input.name,
      placeholder: input.placeholder,
      id: input.id,
      className: input.className,
      value: input.value
    }));
  });
  
  console.log('[Ikigai Interactive] Inputs encontrados en la página:', JSON.stringify(allInputs, null, 2));

  // Intentar cada selector
  for (const selector of searchSelectors) {
    try {
      searchInput = await puppeteerPage.waitForSelector(selector, { timeout: 2000 });
      if (searchInput) {
        usedSelector = selector;
        console.log(`[Ikigai Interactive] ✓ Campo encontrado con selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Continuar con el siguiente selector
    }
  }

  if (!searchInput) {
    console.log('[Ikigai Interactive] ❌ No se encontró campo de búsqueda');
    return null;
  }

  // Limpiar campo y escribir término de búsqueda
  console.log(`[Ikigai Interactive] Escribiendo "${query}" en campo de búsqueda...`);
  
  // Hacer clic en el campo para enfocarlo
  await searchInput.click();
  
  // Seleccionar todo el texto existente y borrarlo
  await puppeteerPage.keyboard.down('Control');
  await puppeteerPage.keyboard.press('KeyA');
  await puppeteerPage.keyboard.up('Control');
  
  // Escribir el nuevo término letra por letra (simular humano)
  await searchInput.type(query, { delay: 150 });
  
  // Esperar un momento después de escribir
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Intentar múltiples formas de activar la búsqueda
  console.log('[Ikigai Interactive] Activando búsqueda...');
  
  // Método 1: Presionar Enter
  try {
    await puppeteerPage.keyboard.press('Enter');
    console.log('[Ikigai Interactive] ✓ Enter presionado');
  } catch (e) {
    console.log('[Ikigai Interactive] ❌ Error presionando Enter:', e.message);
  }

  // Método 2: Buscar y hacer clic en botón de búsqueda
  const searchButtonSelectors = [
    'button[type="submit"]',
    'button[class*="search"]',
    'button[class*="buscar"]',
    '.search-button',
    '.buscar-button',
    '[class*="search"] button',
    '[class*="buscar"] button'
  ];

  for (const buttonSelector of searchButtonSelectors) {
    try {
      const searchButton = await puppeteerPage.waitForSelector(buttonSelector, { timeout: 1000 });
      if (searchButton) {
        await searchButton.click();
        console.log(`[Ikigai Interactive] ✓ Botón clickeado: ${buttonSelector}`);
        break;
      }
    } catch (e) {
      // Continuar con el siguiente selector
    }
  }

  // Esperar resultados de búsqueda
  console.log('[Ikigai Interactive] Esperando resultados...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Verificar si la URL cambió (indica que la búsqueda se activó)
  const currentUrl = puppeteerPage.url();
  console.log('[Ikigai Interactive] URL actual después de buscar:', currentUrl);

  // Intentar hacer scroll para activar lazy loading
  console.log('[Ikigai Interactive] Haciendo scroll para activar lazy loading...');
  await puppeteerPage.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  await puppeteerPage.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Extraer resultados
  console.log('[Ikigai Interactive] Extrayendo resultados...');
  
  // Esperar a que aparezcan enlaces de series
  try {
    await puppeteerPage.waitForSelector('a[href*="/series/"]', { timeout: 5000 });
  } catch (e) {
    console.log('[Ikigai Interactive] No se encontraron enlaces de series inmediatamente');
  }

  const results = await puppeteerPage.evaluate((searchQuery) => {
    const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
    
    const validLinks = Array.from(seriesLinks).filter(link => {
      const href = link.getAttribute('href');
      if (!href || href === '/series/' || href === '/series') return false;
      
      const excludePatterns = ['/clasificacion', '/lists/', '/grupos/', '/generos/'];
      if (excludePatterns.some(pattern => href.includes(pattern))) return false;
      
      const hasImage = link.querySelector('img') !== null;
      const hasTitle = link.querySelector('h3, h2, h1, .title') !== null;
      const hasText = link.textContent && link.textContent.trim().length > 2;
      
      return (hasImage || hasTitle || hasText) && href.split('/series/')[1]?.length > 1;
    });

    console.log(`[Ikigai Interactive] Enlaces válidos encontrados: ${validLinks.length}`);

    return validLinks.map((link, index) => {
      const href = link.getAttribute('href');
      
      // Buscar título en múltiples elementos
      const titleSelectors = ['h3', 'h2', 'h1', '.title', '.series-title', '[class*="title"]'];
      let titleElement = null;
      
      for (const selector of titleSelectors) {
        titleElement = link.querySelector(selector);
        if (titleElement) break;
      }
      
      const title = titleElement?.textContent?.trim() || 
                   link.getAttribute('title') || 
                   link.getAttribute('alt') || '';
      
      const imgElement = link.querySelector('img');
      const cover = imgElement?.src || 
                   imgElement?.getAttribute('src') || 
                   imgElement?.getAttribute('data-src') || '';
      
      let slug = '';
      if (href.includes('/series/')) {
        const slugPart = href.split('/series/')[1];
        slug = slugPart?.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || '';
      }
      
      if (!slug) return null;
      
      const finalTitle = title || slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      // Calcular relevancia basada en la búsqueda
      let relevance = 0;
      if (searchQuery) {
        const queryWords = searchQuery.toLowerCase().split(' ');
        const titleLower = finalTitle.toLowerCase();
        
        queryWords.forEach(word => {
          if (titleLower.includes(word)) {
            relevance += word.length;
          }
        });
      }

      return {
        id: `ikigai-${slug}-${Date.now()}-${index}`,
        slug,
        title: finalTitle,
        cover,
        source: 'ikigai',
        relevance,
        searchMethod: 'interactive'
      };
    }).filter(item => item !== null)
      .sort((a, b) => b.relevance - a.relevance); // Ordenar por relevancia
  }, query);

  console.log(`[Ikigai Interactive] Resultados extraídos: ${results.length}`);
  
  // Log de los primeros resultados para debugging
  if (results.length > 0) {
    console.log('[Ikigai Interactive] Primeros 3 resultados:');
    results.slice(0, 3).forEach((result, i) => {
      console.log(`  ${i + 1}. "${result.title}" (${result.slug}) - Relevancia: ${result.relevance}`);
    });
  }

  return results;
}

/**
 * Intenta usar la API directa de Ikigai
 */
async function tryDirectAPI(query, filters, page) {
  if (!discoveredAPIs.searchEndpoint) {
    throw new Error('No hay endpoint de API conocido');
  }

  console.log(`[Ikigai Direct API] Usando: ${discoveredAPIs.searchEndpoint}`);
  
  // Construir body basado en la muestra capturada
  let requestBody;
  
  if (discoveredAPIs.sampleRequest && discoveredAPIs.sampleRequest.postData) {
    try {
      // Intentar usar el formato de la petición original
      const sampleData = JSON.parse(discoveredAPIs.sampleRequest.postData);
      requestBody = {
        ...sampleData,
        query: query,
        buscar: query,
        search: query,
        page: page,
        pagina: page
      };
    } catch (e) {
      // Si no se puede parsear, usar formato genérico
      requestBody = {
        query: query,
        buscar: query,
        page: page,
        filters: filters
      };
    }
  } else {
    requestBody = {
      query: query,
      buscar: query,
      page: page,
      filters: filters
    };
  }

  console.log(`[Ikigai Direct API] Request body:`, JSON.stringify(requestBody, null, 2));

  const response = await fetch(discoveredAPIs.searchEndpoint, {
    method: discoveredAPIs.searchMethod,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      ...discoveredAPIs.searchHeaders
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`API response: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[Ikigai Direct API] Response:`, JSON.stringify(data, null, 2).substring(0, 500));

  // Normalizar respuesta al formato esperado
  let results = [];
  
  if (data.results) {
    results = data.results;
  } else if (data.data) {
    results = data.data;
  } else if (Array.isArray(data)) {
    results = data;
  }

  return {
    results: results,
    page: page,
    hasMore: data.hasMore || false,
    directAPI: true
  };
}
