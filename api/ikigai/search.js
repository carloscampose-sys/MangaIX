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
      'Origin': 'https://viralikigai.eurofiyati.online',
      'Referer': 'https://viralikigai.eurofiyati.online/',
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
      console.log('[Ikigai Search] API directa falló, intentando alternativa...');

      // Usar corsproxy.io que maneja mejor los parámetros
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      console.log('[Ikigai Search] Proxy URL:', proxyUrl);

      const proxyResponse = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!proxyResponse.ok) {
        // Intentar con otro proxy como fallback
        console.log('[Ikigai Search] corsproxy falló, intentando thingproxy...');
        const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${apiUrl}`;

        const thingProxyResponse = await fetch(thingProxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!thingProxyResponse.ok) {
          console.error('[Ikigai Search] Todos los proxies fallaron');
          return res.status(500).json({
            error: 'Error en la API de Ikigai',
            details: 'Todos los métodos fallaron'
          });
        }

        const thingProxyData = await thingProxyResponse.json();
        return processAndReturnResults(thingProxyData, page, res);
      }

      const proxyData = await proxyResponse.json();
      return processAndReturnResults(proxyData, page, res);
    }

    const data = await response.json();
    return processAndReturnResults(data, page, res);

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
function processAndReturnResults(data, page, res) {
  console.log('[Ikigai Search] API Response - Total:', data.total, 'Current Page:', data.current_page);

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
 */
function buildApiUrl(query, filters, page) {
  const baseUrl = 'https://panel.ikigaimangas.com/api/swf/series';
  const params = new URLSearchParams();

  // Página
  params.append('page', page);

  // Query de búsqueda
  if (query) {
    params.append('search', query);
  }

  // Géneros (array de IDs)
  if (filters.genres && filters.genres.length > 0) {
    filters.genres.forEach(genreId => {
      params.append('genres_ids[]', genreId);
    });
  }

  // Tipos (comic, novel)
  if (filters.types && filters.types.length > 0) {
    filters.types.forEach(type => {
      params.append('types[]', type);
    });
  }

  // Estados (IDs de estado)
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
