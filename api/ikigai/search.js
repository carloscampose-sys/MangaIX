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
      console.log('[Ikigai Search] API directa falló, intentando alternativa...');

      // Usar corsproxy.io - NO encodear la URL (ya tiene los params correctos)
      const proxyUrl = `https://corsproxy.io/?${apiUrl}`;
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
        return processAndReturnResults(thingProxyData, page, res, query, filters);
      }

      const proxyData = await proxyResponse.json();
      return processAndReturnResults(proxyData, page, res, query, filters);
    }

    const data = await response.json();
    return processAndReturnResults(data, page, res, query, filters);

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
function processAndReturnResults(data, page, res, query, filters) {
  console.log('[Ikigai Search] API Response - Total:', data.total, 'Current Page:', data.current_page);

  // Transformar resultados al formato esperado por la app
  let results = (data.data || []).map(serie => ({
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

  // Filtrar por coincidencia exacta si el checkbox está marcado
  if (filters.exactMatch && query && query.trim()) {
    const normalizedQuery = normalizeTitle(query.trim());
    console.log('[Ikigai Search] Filtrando por coincidencia exacta:', normalizedQuery);

    results = results.filter(serie =>
      normalizeTitle(serie.title).toLowerCase() === normalizedQuery.toLowerCase()
    );

    console.log(`[Ikigai Search] ${results.length} resultados después de filtro exacto`);
  }

  // Si no hay resultados y checkbox marcado, enviar mensaje informativo
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

/**
 * Construye la URL de la API con los filtros
 *
 * Parámetros correctos de la API de Ikigai:
 * - page: número de página
 * - search: texto de búsqueda
 * - genres: ID de género (solo uno a la vez)
 * - type: tipo de contenido (comic/novel)
 * - status: estado de publicación
 * - order_by: ordenamiento
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

  // Género (la API solo acepta un género a la vez)
  if (filters.genres && filters.genres.length > 0) {
    params.append('genres', filters.genres[0]);
  }

  // Tipo (comic, novel) - solo uno a la vez
  if (filters.types && filters.types.length > 0) {
    params.append('type', filters.types[0]);
  }

  // Estado - solo uno a la vez
  if (filters.statuses && filters.statuses.length > 0) {
    params.append('status', filters.statuses[0]);
  }

  // Ordenamiento
  if (filters.sortBy) {
    params.append('order_by', filters.sortBy);
  }

  // Habilitar contenido adulto en resultados
  params.append('nsfw', 'true');

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Normaliza un título para comparaciones
 * - Minúsculas
 * - Sin acentos
 * - Sin caracteres especiales
 * - Espacios normalizados
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^\w\s-]/g, '')  // Remove special chars (keep alphanumeric, space, hyphen)
    .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
    .trim();
}
