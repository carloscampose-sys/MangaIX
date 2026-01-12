import ApiClient from '../../lib/manhwaweb/api-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  console.log('[ManhwaWeb Search Direct] req.query completo:', JSON.stringify(req.query, null, 2));

  if (action === 'nuevos') {
    try {
      const data = await ApiClient.getNuevos();

      const results = (data.ultimos_mangas_creados || []).map(item => ({
        slug: item.real_id || item._id,
        title: item.name_esp || item.the_real_name,
        cover: item._imagen,
        type: item._tipo,
        status: item._status,
        erotic: item._erotico === 'si',
        demographic: item._demografi || 'seinen',
        genres: (item._categoris || []).map(c => Object.values(c)[0]),
        chapters_count: item._numero_cap || 0,
        source: 'manhwaweb'
      }));

      return res.status(200).json({
        success: true,
        results,
        count: results.length,
        top: data.top || null
      });
    } catch (error) {
      console.error('[ManhwaWeb Nuevos] Error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message,
        results: []
      });
    }
  }

  const { query, genres, type, status, erotic, demographic, sortBy, sortOrder, page = 1 } = req.query;

  if (!query && !genres) {
    return res.status(200).json({
      success: true,
      results: [],
      count: 0
    });
  }

  try {
    console.log(`[ManhwaWeb Search Direct] Query: "${query}", Page: ${page}`);
    console.log(`[ManhwaWeb Search Direct] Filters:`, { type, status, erotic, demographic, sortBy, sortOrder });

    const params = {};
    if (query) params.buscar = query;
    if (type !== undefined) params.tipo = type;
    if (demographic !== undefined) params.demografia = demographic;
    if (status !== undefined) params.estado = status;
    if (erotic !== undefined) params.erotico = erotic;
    if (genres) {
      const genreIds = typeof genres === 'string' ? genres.split(',') : genres;
      params.genders = genreIds.map(g => {
        const num = parseInt(g);
        return isNaN(num) ? g : num;
      }).join(',');
    }
    if (sortBy !== undefined) params.order_item = sortBy;
    if (sortOrder !== undefined) params.order_dir = sortOrder;
    params.page = parseInt(page);

    console.log('[ManhwaWeb Search Direct] params a enviar a API:', JSON.stringify(params, null, 2));

    const startTime = Date.now();
    const data = await ApiClient.search(params);
    const elapsed = Date.now() - startTime;

    console.log(`[ManhwaWeb Search Direct] API response time: ${elapsed}ms`);

    const results = (data.data || []).map((item, index) => ({
      id: `manhwaweb-${item.real_id || item._id}-${Date.now()}-${index}`,
      slug: item.real_id || item._id,
      title: item.name_esp || item.the_real_name,
      cover: item._imagen,
      type: item._tipo,
      status: item._status,
      erotic: item._erotico === 'si',
      demographic: item._demografi || 'seinen',
      genres: (item._categoris || []).map(c => Object.values(c)[0]),
      chapters_count: item._numero_cap || 0,
      source: 'manhwaweb'
    }));

    return res.status(200).json({
      success: true,
      results,
      count: results.length,
      next: data.next || false,
      hasMore: results.length >= 30
    });

  } catch (error) {
    console.error('[ManhwaWeb Search Direct] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      results: []
    });
  }
}
