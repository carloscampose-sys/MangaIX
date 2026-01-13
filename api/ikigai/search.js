import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  if (query && query.trim()) {
    console.log('[Ikigai Search] Búsqueda por título detectada, usando Puppeteer...');
    return handleSearchWithPuppeteer(query, filters, page, res);
  }

  console.log('[Ikigai Search] Búsqueda solo con filtros, usando API...');
  return handleSearchWithAPI(filters, page, res);
}

async function handleSearchWithPuppeteer(query, filters, page, res) {
  let browser = null;

  try {
    if (!query || query.trim() === '') {
      return res.status(200).json({
        results: [],
        page: 1,
        totalPages: 1,
        total: 0,
        hasMore: false
      });
    }

    const queryEncoded = encodeURIComponent(query.trim());
    let searchUrl = `https://viralikigai.techbee.site/series/?buscar=${queryEncoded}&pagina=${page}`;

    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach(genreId => {
        searchUrl += `&generos[]=${genreId}`;
      });
    }

    console.log('[Ikigai Search Puppeteer] URL:', searchUrl);

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const puppeteerPage = await browser.newPage();

    await puppeteerPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await puppeteerPage.setRequestInterception(true);
    puppeteerPage.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'facebook', 'google-analytics', 'doubleclick', 'tracking'];
      const url = request.url().toLowerCase();
      const resourceType = request.resourceType();

      if (blockedResources.some(r => url.includes(r))) {
        request.abort();
        return;
      }

      if (resourceType === 'image' && url.includes('ad')) {
        request.abort();
        return;
      }

      request.continue();
    });

    await puppeteerPage.goto(searchUrl, {
      waitUntil: 'networkidle0',
      timeout: 45000
    });

    console.log('[Ikigai Search Puppeteer] Esperando carga de Qwik framework...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const searchResults = await puppeteerPage.evaluate(() => {
      const selectors = [
        '.card',
        '.serie-card',
        '[class*="card"]',
        '[class*="serie"]',
        '.grid > div',
        'article',
        '.result-card'
      ];

      let cards = [];
      for (const selector of selectors) {
        const found = Array.from(document.querySelectorAll(selector));
        const validCards = found.filter(card => {
          const hasImage = card.querySelector('img');
          const hasTitle = card.querySelector('h1, h2, h3, .title, [class*="title"]');
          return hasImage || hasTitle;
        });

        if (validCards.length > 0) {
          cards = validCards;
          break;
        }
      }

      const results = [];

      cards.forEach(card => {
        try {
          const imgSelectors = [
            'img.cover',
            'img[alt*="portada"]',
            'img[src*="ikigaimangas"]',
            'img[src*="imagedelivery.net"]',
            'img'
          ];
          let imgElement = null;
          for (const selector of imgSelectors) {
            imgElement = card.querySelector(selector);
            if (imgElement && (imgElement.src || imgElement.dataset?.src)) {
              break;
            }
          }

          const cover = imgElement?.src || imgElement?.dataset?.src || '';

          const titleSelectors = [
            '.title',
            'h3',
            'h2',
            'h1',
            '.name',
            '[class*="title"]',
            '[class*="name"]',
            'a[title]'
          ];
          let titleElement = null;
          for (const selector of titleSelectors) {
            titleElement = card.querySelector(selector);
            const text = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
            if (text) {
              break;
            }
          }

          const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';

          const linkElement = card.querySelector('a[href]');
          const href = linkElement?.href || '';
          const slugMatch = href.match(/\/([^\/]+)\/?$/);
          const slug = slugMatch ? slugMatch[1] : href.split('/').pop() || '';

          const genreElements = card.querySelectorAll('.genre, .tag, span[class*="genre"], [class*="tag"]');
          const genres = Array.from(genreElements)
            .map(g => g.textContent?.trim())
            .filter(Boolean);

          const statusElement = card.querySelector('.status, .estado, [class*="status"]');
          const status = statusElement?.textContent?.trim() || '';

          const typeElement = card.querySelector('.type, .tipo, [class*="type"]');
          const type = typeElement?.textContent?.trim() || '';

          if (title) {
            results.push({
              title,
              slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              cover,
              genres,
              status,
              type
            });
          }
        } catch (error) {
        }
      });

      return results;
    });

    console.log(`[Ikigai Search Puppeteer] ${searchResults.length} resultados extraídos`);

    await browser.close();

    const results = searchResults.map((item, index) => ({
      id: `ikigai-${item.slug}-${Date.now()}-${index}`,
      slug: item.slug,
      title: item.title,
      cover: item.cover,
      source: 'ikigai',
      type: item.type || 'comic',
      status: item.status || 'En Curso',
      chapterCount: 0,
      genres: item.genres || []
    }));

    if (filters.exactMatch && query && query.trim()) {
      const normalizedQuery = normalizeTitle(query.trim());
      console.log('[Ikigai Search Puppeteer] Filtrando por coincidencia exacta:', normalizedQuery);

      results = results.filter(serie =>
        normalizeTitle(serie.title).toLowerCase() === normalizedQuery.toLowerCase()
      );

      console.log(`[Ikigai Search Puppeteer] ${results.length} resultados después de filtro exacto`);
    }

    if (results.length === 0 && filters.exactMatch && query && query.trim()) {
      console.log('[Ikigai Search Puppeteer] No se encontró coincidencia exacta');
      return res.status(200).json({
        results: [],
        message: 'No se encontró una obra con ese título exacto',
        page: 1,
        totalPages: 1,
        total: 0,
        hasMore: false
      });
    }

    return res.status(200).json({
      results,
      page: page,
      totalPages: page + 1,
      total: results.length,
      hasMore: results.length > 0
    });

  } catch (error) {
    console.error('[Ikigai Search Puppeteer] Error:', error);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}

async function handleSearchWithAPI(filters, page, res) {
  if (!filters.genres || filters.genres.length === 0) {
    console.log('[Ikigai Search API] No hay filtros, retornando array vacío');
    return res.status(200).json({
      results: [],
      page: 1,
      totalPages: 1,
      total: 0,
      hasMore: false
    });
  }

  try {
    const apiUrl = buildApiUrl('', filters, page);
    console.log('[Ikigai Search API] API URL:', apiUrl);

    const browserHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://viralikigai.techbee.site',
      'Referer': `https://viralikigai.techbee.site/`,
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: browserHeaders
    });

    console.log('[Ikigai Search API] Response status:', response.status);

    if (!response.ok) {
      console.log('[Ikigai Search API] API directa falló, intentando alternativa...');

      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      console.log('[Ikigai Search API] Proxy URL:', proxyUrl);

      const proxyResponse = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!proxyResponse.ok) {
        console.log('[Ikigai Search API] corsproxy falló, intentando allorigins.win...');
        const alloriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

        const alloriginsResponse = await fetch(alloriginsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (alloriginsResponse.ok) {
          console.log('[Ikigai Search API] allorigins.win funcionó');
          const alloriginsData = await alloriginsResponse.json();
          return processAndReturnResults(alloriginsData, page, res, '', filters);
        }

        console.log('[Ikigai Search API] allorigins falló, intentando thingproxy...');
        const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(apiUrl)}`;

        const thingProxyResponse = await fetch(thingProxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!thingProxyResponse.ok) {
          console.error('[Ikigai Search API] Todos los proxies fallaron');
          return res.status(500).json({
            error: 'Error en la API de Ikigai',
            details: 'Todos los métodos fallaron'
          });
        }

        const thingProxyData = await thingProxyResponse.json();
        return processAndReturnResults(thingProxyData, page, res, '', filters);
      }

      const proxyData = await proxyResponse.json();
      return processAndReturnResults(proxyData, page, res, '', filters);
    }

    const data = await response.json();
    return processAndReturnResults(data, page, res, '', filters);

  } catch (error) {
    console.error('[Ikigai Search API] Error:', error);

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}

function processAndReturnResults(data, page, res, query, filters) {
  console.log('[Ikigai Search] API Response - Total:', data.total, 'Current Page:', data.current_page);

  let results = (data.data || []).map(serie => ({
    id: `ikigai-${serie.slug}-${serie.id}`,
    slug: serie.slug,
    title: serie.name,
    cover: serie.cover || '',
    source: 'ikigai',
    type: serie.type,
    status: serie.status,
    chapterCount: serie.chapter_count,
    genres: (serie.genres || []).map(g => g.name),
    description: serie.summary || serie.synopsis || '',
    author: serie.team?.name || ''
  }));

  if (filters.exactMatch && query && query.trim()) {
    const normalizedQuery = normalizeTitle(query.trim());
    console.log('[Ikigai Search] Filtrando por coincidencia exacta:', normalizedQuery);

    results = results.filter(serie =>
      normalizeTitle(serie.title).toLowerCase() === normalizedQuery.toLowerCase()
    );

    console.log(`[Ikigai Search] ${results.length} resultados después de filtro exacto`);
  }

  if (results.length === 0 && filters.exactMatch && query && query.trim()) {
    console.log('[Ikigai Search] No se encontró coincidencia exacta');
    return res.status(200).json({
      results: [],
      message: 'No se encontró una obra con ese título exacto',
      page: 1,
      totalPages: 1,
      total: 0,
      hasMore: false
    });
  }

  console.log(`[Ikigai Search] ${results.length} resultados transformados`);

  return res.status(200).json({
    results,
    page: data.current_page,
    totalPages: data.last_page,
    total: data.total,
    hasMore: data.current_page < data.last_page
  });
}

function buildApiUrl(query, filters, page) {
  const baseUrl = 'https://panel.ikigaimangas.com/api/swf/series';
  const params = new URLSearchParams();

  params.append('page', page);

  if (query) {
    params.append('buscar', query);
  }

  if (filters.genres && filters.genres.length > 0) {
    params.append('genres', filters.genres[0]);
  }

  if (filters.types && filters.types.length > 0) {
    params.append('type', filters.types[0]);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    params.append('status', filters.statuses[0]);
  }

  if (filters.sortBy) {
    params.append('order_by', filters.sortBy);
  }

  params.append('nsfw', 'true');

  return `${baseUrl}?${params.toString()}`;
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
