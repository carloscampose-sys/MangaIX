import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  if (action === 'search') {
    return handleSearch(req, res);
  }
  if (action === 'details') {
    return handleDetails(req, res);
  }
  if (action === 'chapters') {
    return handleChapters(req, res);
  }
  if (action === 'pages') {
    return handlePages(req, res);
  }
  if (action === 'load-series-progressive') {
    return handleLoadSeriesProgressive(req, res);
  }
  if (action === 'cancel-load') {
    return handleCancelLoad(req, res);
  }

  return res.status(400).json({ error: 'Missing or invalid action parameter' });
}

async function handleSearch(req, res) {
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
    let searchUrl = `https://visualikigai.radiot.space/series/?buscar=${queryEncoded}&pagina=${page}`;

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
      'Origin': 'https://visualikigai.radiot.space',
      'Referer': `https://visualikigai.radiot.space/`,
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
      console.log('[Ikigai Search API] API directa falló, intentando corsproxy...');

      // Intentar corsproxy primero
      const corsproxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      console.log('[Ikigai Search API] Proxy URL:', corsproxyUrl);

      let proxyResponse = await fetch(corsproxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      // Fallback a codetabs si corsproxy falla
      if (!proxyResponse.ok) {
        console.log('[Ikigai Search API] corsproxy falló, intentando codetabs...');
        const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`;
        proxyResponse = await fetch(codetabsUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      }

      if (!proxyResponse.ok) {
        console.error('[Ikigai Search API] Todos los proxies fallaron');
        return res.status(500).json({
          error: 'Error en la API de Ikigai',
          details: 'Todos los métodos fallaron'
        });
      }

      // Verificar respuesta del proxy
      const proxyText = await proxyResponse.text();
      if (!proxyText || proxyText.startsWith('A server') || proxyText.startsWith('<!')) {
        console.error('[Ikigai Search API] Respuesta inválida del proxy:', proxyText.substring(0, 50));
        return res.status(502).json({
          error: 'Respuesta inválida del proxy',
          details: proxyText.substring(0, 100)
        });
      }

      try {
        const proxyData = JSON.parse(proxyText);
        return processAndReturnResults(proxyData, page, res, '', filters);
      } catch (e) {
        console.error('[Ikigai Search API] JSON inválido del proxy');
        return res.status(502).json({ error: 'JSON inválido', details: proxyText.substring(0, 100) });
      }
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

async function handleDetails(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const apiUrl = `https://panel.ikigaimangas.com/api/swf/series/${slug}`;
    console.log('[Ikigai Details] API URL:', apiUrl);

    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

    let response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    // Fallback a codetabs si corsproxy falla
    if (!response.ok) {
      console.log('[Ikigai Details] corsproxy falló, intentando codetabs...');
      const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`;
      response = await fetch(codetabsUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
    }

    if (!response.ok) {
      console.error('[Ikigai Details] Error:', response.status);
      return res.status(response.status).json({
        error: 'Error en la API de Ikigai',
        details: response.statusText
      });
    }

    // Verificar que la respuesta sea JSON válido
    const text = await response.text();
    if (!text || text.startsWith('A server') || text.startsWith('<!') || text.startsWith('<html')) {
      console.error('[Ikigai Details] Respuesta inválida:', text.substring(0, 50));
      return res.status(502).json({
        error: 'Respuesta inválida del proxy',
        details: text.substring(0, 100)
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[Ikigai Details] JSON inválido:', text.substring(0, 50));
      return res.status(502).json({
        error: 'JSON inválido del proxy',
        details: text.substring(0, 100)
      });
    }

    const serie = data.series;

    if (!serie) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }

    console.log('[Ikigai Details] Serie encontrada:', serie.name);

    const details = {
      title: serie.name,
      slug: serie.slug,
      cover: serie.cover || '',
      synopsis: serie.summary || '',
      author: serie.team?.name || '',
      status: serie.status || '',
      type: serie.type || '',
      genres: (serie.genres || []).map(g => g.name),
      viewCount: serie.view_count,
      bookmarkCount: serie.bookmark_count,
      rating: serie.rating,
      ratingCount: serie.rating_count,
      chapterCount: serie.chapter_count,
      firstChapter: serie.first_chapter,
      lastChapter: serie.last_chapter,
      isMature: serie.is_mature,
      source: 'ikigai'
    };

    return res.status(200).json(details);

  } catch (error) {
    console.error('[Ikigai Details] Error:', error);
    return res.status(500).json({
      error: 'Error obteniendo detalles',
      details: error.message
    });
  }
}

async function handleChapters(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    console.log(`[Ikigai Chapters] Obteniendo capítulos para: ${slug}`);

    let allChapters = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 50;

    while (hasMorePages && currentPage <= maxPages) {
      const apiUrl = `https://panel.ikigaimangas.com/api/swf/series/${slug}/chapters?page=${currentPage}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

      console.log(`[Ikigai Chapters] Página ${currentPage}`);

      let response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      // Fallback a codetabs si corsproxy falla
      if (!response.ok) {
        console.log(`[Ikigai Chapters] corsproxy falló en página ${currentPage}, intentando codetabs...`);
        const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`;
        response = await fetch(codetabsUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      }

      if (!response.ok) {
        console.error(`[Ikigai Chapters] Error en página ${currentPage}:`, response.status);
        break;
      }

      // Verificar que la respuesta sea JSON válido
      const text = await response.text();
      if (!text || text.startsWith('A server') || text.startsWith('<!') || text.startsWith('<html')) {
        console.error(`[Ikigai Chapters] Respuesta inválida en página ${currentPage}:`, text.substring(0, 50));
        break;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(`[Ikigai Chapters] JSON inválido en página ${currentPage}:`, text.substring(0, 50));
        break;
      }

      const chapters = data.data || [];

      console.log(`[Ikigai Chapters] Página ${currentPage}: ${chapters.length} capítulos`);

      const transformedChapters = chapters.map(ch => ({
        id: `ikigai-${slug}-ch-${ch.name}-${ch.id}`,
        chapter: ch.name,
        title: ch.title ? `Capítulo ${ch.name} - ${ch.title}` : `Capítulo ${ch.name}`,
        url: `https://visualikigai.radiot.space/capitulo/${ch.id}/`,
        publishedAt: ch.published_at,
        likeCount: ch.like_count,
        chapterId: ch.id,
        source: 'ikigai'
      }));

      allChapters.push(...transformedChapters);

      const meta = data.meta || {};
      if (currentPage >= (meta.last_page || 1)) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    }

    allChapters.sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return numA - numB;
    });

    console.log(`[Ikigai Chapters] Total capítulos: ${allChapters.length}`);
    console.log(`[Ikigai Chapters] Capítulos ordenados ascendente - Primero: ${allChapters[0]?.chapter}, Último: ${allChapters[allChapters.length - 1]?.chapter}`);

    return res.status(200).json({
      chapters: allChapters,
      total: allChapters.length
    });

  } catch (error) {
    console.error('[Ikigai Chapters] Error:', error);
    return res.status(500).json({
      error: 'Error obteniendo capítulos',
      details: error.message
    });
  }
}

async function handlePages(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, chapter, chapterId } = req.body;

  if (!chapterId) {
    return res.status(400).json({ error: 'chapterId is required' });
  }

  let browser = null;

  try {
    const chapterUrl = `https://visualikigai.radiot.space/capitulo/${chapterId}/`;
    console.log('[Ikigai Pages] URL:', chapterUrl);

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

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.setRequestInterception(true);
    page.on('request', (request) => {
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

    await page.goto(chapterUrl, {
      waitUntil: 'networkidle0',
      timeout: 20000
    });

    console.log('[Ikigai Pages] Esperando carga de Qwik framework...');
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('[Ikigai Pages] Haciendo scroll para cargar imágenes...');
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 8;

    while (scrollAttempts < maxScrollAttempts) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 300));

      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === previousHeight) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 300));
        break;
      }
      previousHeight = currentHeight;
      scrollAttempts++;
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 300));

    console.log(`[Ikigai Pages] Scroll completado - Intentos: ${scrollAttempts}/${maxScrollAttempts}`);

    const imageUrls = await page.evaluate(() => {
      const validImages = [];

      const selectors = [
        'img[src*="chapters/"]',
        'img[src*="pages/"]',
        'img[src*="imagedelivery"]',
        'img[src*="ikigaimangas"]',
        'div.chapter img',
        'div.reader img',
        '.chapter-pages img',
        'img[data-src]',
        'img'
      ];

      for (const selector of selectors) {
        const images = document.querySelectorAll(selector);

        if (images.length > 0) {
          Array.from(images).forEach(img => {
            const src = img.src || img.dataset?.src || '';

            if (!src || !src.startsWith('http')) return;

            const isNotUI = !src.includes('avatar') &&
                           !src.includes('logo') &&
                           !src.includes('icon') &&
                           !src.includes('loader') &&
                           !src.includes('placeholder') &&
                           img.height !== 60 &&
                           img.width !== 60 &&
                           !src.includes('btn_') &&
                           !src.includes('/misc/');

            const isValidCdn = src.includes('ikigaimangas.cloud') ||
                              src.includes('imagedelivery.net') ||
                              src.includes('ikigai') ||
                              src.includes('/chapters/') ||
                              src.includes('/pages/');

            if (isValidCdn && isNotUI) {
              validImages.push(src);
            }
          });

          if (validImages.length > 0) {
            break;
          }
        }
      }

      return [...new Set(validImages)];
    });

    console.log(`[Ikigai Pages] ${imageUrls.length} imágenes encontradas`);

    await browser.close();

    return res.status(200).json({
      pages: imageUrls,
      total: imageUrls.length
    });

  } catch (error) {
    console.error('[Ikigai Pages] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error obteniendo páginas',
      details: error.message
    });
  }
}

async function handleLoadSeriesProgressive(req, res) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chunk = 5, startPage = 1 } = req.query;

  try {
    console.log(`[Ikigai Progressive Load] Chunk: ${chunk}, StartPage: ${startPage}`);

    const pagesToLoad = [];
    for (let i = 0; i < parseInt(chunk); i++) {
      pagesToLoad.push(parseInt(startPage) + i);
    }

    const allResults = await Promise.allSettled(
      pagesToLoad.map(async (page) => {
        const apiUrl = `https://panel.ikigaimangas.com/api/swf/series?page=${page}&nsfw=true`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

        try {
          let response = await fetch(proxyUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });

          // Fallback a codetabs si corsproxy falla
          if (!response.ok) {
            console.log(`[Ikigai Progressive Load] corsproxy falló para página ${page}, intentando codetabs...`);
            const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`;
            response = await fetch(codetabsUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
              throw new Error(`Error en página ${page}: ${response.status}`);
            }
          }

          // Verificar que la respuesta sea JSON válido
          const text = await response.text();
          if (!text || text.startsWith('A server') || text.startsWith('<!') || text.startsWith('<html')) {
            throw new Error(`Respuesta inválida en página ${page}: ${text.substring(0, 50)}`);
          }

          try {
            return JSON.parse(text);
          } catch (parseError) {
            throw new Error(`JSON inválido en página ${page}: ${text.substring(0, 50)}`);
          }
        } catch (error) {
          console.error(`[Ikigai Progressive Load] Error página ${page}:`, error.message);
          return null;
        }
      })
    );

    const series = allResults
      .filter(r => r.status === 'fulfilled' && r.value?.data)
      .flatMap(r => r.value.data);

    const loadedPages = allResults.filter(r => r.status === 'fulfilled' && r.value).length;
    const actualStartPage = parseInt(startPage);

    let totalSeries = null;
    const firstSuccessfulResult = allResults.find(
      r => r.status === 'fulfilled' && r.value?.total
    );

    if (firstSuccessfulResult) {
      totalSeries = firstSuccessfulResult.value.total;
      console.log(`[Ikigai Progressive Load] Total series desde API: ${totalSeries}`);
    }

    const totalPages = totalSeries ? Math.ceil(totalSeries / 15) : 338;
    const percent = totalSeries
      ? ((actualStartPage - 1) * 15 + series.length) / totalSeries * 100
      : ((actualStartPage - 1 + loadedPages) / totalPages) * 100;

    const timeElapsed = Date.now() - startTime;
    const timePerPage = timeElapsed / loadedPages;
    const pagesRemaining = totalPages - (actualStartPage - 1) - loadedPages;
    const estimatedTimeRemaining = Math.ceil((pagesRemaining * timePerPage) / 1000);

    console.log(`[Ikigai Progressive Load] Series: ${series.length}, Total: ${totalSeries || 'N/A'}, Percent: ${percent.toFixed(1)}%, ETA: ${estimatedTimeRemaining}s`);

    return res.status(200).json({
      series,
      loaded: actualStartPage - 1 + loadedPages,
      nextPage: actualStartPage + loadedPages,
      isComplete: (actualStartPage - 1 + loadedPages) >= totalPages,
      percent,
      totalSeries,
      estimatedTimeRemaining
    });

  } catch (error) {
    console.error('[Ikigai Progressive Load] Error:', error);
    return res.status(500).json({
      error: 'Error en carga progresiva',
      details: error.message
    });
  }
}

async function handleCancelLoad(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Ikigai Cancel Load] Carga cancelada por el usuario');

    return res.status(200).json({
      cancelled: true,
      message: 'Carga cancelada por el usuario'
    });

  } catch (error) {
    console.error('[Ikigai Cancel Load] Error:', error);
    return res.status(500).json({
      error: 'Error al cancelar carga',
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
