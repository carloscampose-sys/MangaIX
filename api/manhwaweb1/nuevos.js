import ApiClient from './api-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
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
      source: 'manhwaweb1'
    }));
    
    return res.status(200).json({
      success: true,
      results,
      count: results.length,
      top: data.top || null
    });
  } catch (error) {
    console.error('[ManhwaWeb1 Nuevos] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      results: []
    });
  }
}
