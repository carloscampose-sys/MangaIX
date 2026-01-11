import ApiClient from './api-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Missing slug' });
  
  try {
    const data = await ApiClient.getDetails(slug);
    
    if (!data._id) {
      return res.status(404).json({ error: 'Manhwa no encontrado' });
    }
    
    const details = {
      slug: data.real_id || data._id,
      title: data.name_esp || data.the_real_name,
      cover: data._imagen,
      description: data._sinopsis || '',
      type: data._tipo,
      status: data._status,
      erotic: data._erotico === 'si',
      demographic: data._demografi || 'seinen',
      genres: (data._categoris || []).map(c => Object.values(c)[0]),
      author: data._extras?.autores?.[0] || 'Desconocido',
      chapters: (data.chapters || []).map(ch => ({
        chapter: ch.chapter,
        title: `Capítulo ${ch.chapter}`,
        date: new Date(ch.create).toISOString(),
        url: ch.link,
        images_count: ch.img?.length || 0
      })),
      chapters_count: data._numero_cap || 0,
      source: 'manhwaweb1'
    };
    
    return res.status(200).json({
      success: true,
      details
    });
  } catch (error) {
    console.error('[ManhwaWeb1 Details] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: null
    });
  }
}
