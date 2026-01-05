/**
 * API Route: Ikigai Search
 * Usa la API directa de panel.ikigaimangas.com con headers de navegador
 */

export default async function handler(req, res) {
  // Configurar CORS
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

  try {
    // Construir URL de la API
    const apiUrl = buildApiUrl(query, filters, page);
    console.log('[Ikigai Search] API URL:', apiUrl);

    // Headers completos que simulan un navegador real
    const browserHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://viralikigai.learnixs.site',
      'Referer': 'https://viralikigai.learnixs.site/',
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

    // Llamar a la API de Ikigai
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: browserHeaders
    });

    console.log('[Ikigai Search] Response status:', response.status);

    if (!response.ok) {
      // Si la API directa falla, intentar con proxy alternativo
      console.log('[Ikigai Search] API directa falló, intentando alternativas...');

      // Probar primero con allorigins.win (preserva mejor los query params)
      try {
        const alloriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        console.log('[Ikigai Search] Intentando allorigins.win...');

        const alloriginsResponse = await fetch(alloriginsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (alloriginsResponse.ok) {
          const alloriginsData = await alloriginsResponse.json();
          console.log('[Ikigai Search] ✓ allorigins.win funcionó');
          return processAndReturnResults(alloriginsData, page, res, query);
        }
      } catch (e) {
        console.log('[Ikigai Search] allorigins.win falló:', e.message);
      }

      // Fallback: corsproxy.io
      try {
        const proxyUrl = `https://corsproxy.io/?${apiUrl}`;
        console.log('[Ikigai Search] Intentando corsproxy.io...');

        const proxyResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          console.log('[Ikigai Search] ✓ corsproxy.io funcionó');
          return processAndReturnResults(proxyData, page, res, query);
        }
      } catch (e) {
        console.log('[Ikigai Search] corsproxy.io falló:', e.message);
      }

      // Último fallback: thingproxy
      try {
        const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${apiUrl}`;
        console.log('[Ikigai Search] Intentando thingproxy...');

        const thingProxyResponse = await fetch(thingProxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (thingProxyResponse.ok) {
          const thingProxyData = await thingProxyResponse.json();
          console.log('[Ikigai Search] ✓ thingproxy funcionó');
          return processAndReturnResults(thingProxyData, page, res, query);
        }
      } catch (e) {
        console.log('[Ikigai Search] thingproxy falló:', e.message);
      }

      // Si todos fallaron
      console.error('[Ikigai Search] Todos los proxies fallaron');
      return res.status(500).json({
        error: 'Error en la API de Ikigai',
        details: 'Todos los métodos de proxy fallaron'
      });
    }

    const data = await response.json();
    return processAndReturnResults(data, page, res, query);

  } catch (error) {
    console.error('[Ikigai Search] Error:', error);

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}

/**
 * Procesa los datos y retorna la respuesta
 */
function processAndReturnResults(data, page, res, query = '') {
  console.log('[Ikigai Search] API Response - Total:', data.total, 'Current Page:', data.current_page);

  // Detectar si la API está ignorando el parámetro search
  if (data.total > 2000 && query && query.trim()) {
    console.warn('[Ikigai Search] ⚠️ High result count with query - search parameter ignored by proxy');
    console.warn('[Ikigai Search] Applying client-side filtering for query:', query);

    // Filtrado client-side: buscar en nombre y slug
    const queryLower = query.toLowerCase().trim();
    const filteredData = (data.data || []).filter(serie => {
      const titleMatch = serie.name.toLowerCase().includes(queryLower);
      const slugMatch = serie.slug.toLowerCase().includes(queryLower.replace(/\s+/g, '-'));
      return titleMatch || slugMatch;
    });

    console.log(`[Ikigai Search] Client-side filtered: ${filteredData.length} results (from ${data.data?.length || 0})`);

    // Transformar resultados filtrados
    const results = filteredData.map(serie => ({
      id: `ikigai-${serie.slug}-${serie.id}`,
      slug: serie.slug,
      title: serie.name,
      cover: serie.cover || '',
      source: 'ikigai',
      type: serie.type,
      status: serie.status,
      chapterCount: serie.chapter_count,
      genres: (serie.genres || []).map(g => g.name)
    }));

    return res.status(200).json({
      results,
      page: 1,
      totalPages: 1,
      total: results.length,
      hasMore: false,
      warning: 'Results filtered server-side due to proxy limitation'
    });
  }

  // Transformar resultados al formato esperado por la app
  const results = (data.data || []).map(serie => ({
    id: `ikigai-${serie.slug}-${serie.id}`,
    slug: serie.slug,
    title: serie.name,
    cover: serie.cover || '',
    source: 'ikigai',
    // Datos adicionales útiles
    type: serie.type,
    status: serie.status,
    chapterCount: serie.chapter_count,
    genres: (serie.genres || []).map(g => g.name)
  }));

  console.log(`[Ikigai Search] ${results.length} resultados transformados`);

  return res.status(200).json({
    results,
    page: data.current_page,
    totalPages: data.last_page,
    total: data.total,
    hasMore: data.current_page < data.last_page
  });
}

/**
 * Construye la URL de la API con los filtros
 *
 * Parámetros correctos de la API de Ikigai:
 * - page: número de página
 * - search: texto de búsqueda
 * - genres_ids[]: Array de IDs de géneros (soporta múltiples)
 * - types[]: Array de tipos de contenido (comic/novel, soporta múltiples)
 * - statuses_ids[]: Array de IDs de estados (soporta múltiples)
 * - order_by: ordenamiento (name, created_at, etc.)
 */
function buildApiUrl(query, filters, page) {
  const baseUrl = 'https://panel.ikigaimangas.com/api/swf/series';
  const params = new URLSearchParams();

  // Página
  params.append('page', page);

  // Query de búsqueda por título
  if (query && query.trim()) {
    params.append('search', query.trim());
  }

  // Géneros como array (soporta múltiples)
  if (filters.genres && filters.genres.length > 0) {
    filters.genres.forEach(genreId => {
      params.append('genres_ids[]', genreId);
    });
  }

  // Tipos como array (soporta múltiples)
  if (filters.types && filters.types.length > 0) {
    filters.types.forEach(typeId => {
      params.append('types[]', typeId);
    });
  }

  // Estados como array (soporta múltiples)
  if (filters.statuses && filters.statuses.length > 0) {
    filters.statuses.forEach(statusId => {
      params.append('statuses_ids[]', statusId);
    });
  }

  // Ordenamiento
  if (filters.sortBy) {
    params.append('order_by', filters.sortBy);
  }

  return `${baseUrl}?${params.toString()}`;
}
