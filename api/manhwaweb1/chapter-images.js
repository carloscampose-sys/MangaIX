import ApiClient from './api-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { slug, chapter } = req.query;
  
  if (!slug || !chapter) {
    return res.status(400).json({ error: 'Missing slug or chapter parameter' });
  }
  
  try {
    const data = await ApiClient.getChapterImages(slug, chapter);
    
    if (!data.chapter) {
      return res.status(404).json({ error: 'Capítulo no encontrado' });
    }
    
    const images = data.chapter.img || [];
    
    return res.status(200).json({
      success: true,
      title: data.name || `Capítulo ${chapter}`,
      chapter: parseFloat(chapter),
      images,
      count: images.length,
      erotic: data.erotico === 'si',
      joint: data.joint || []
    });
  } catch (error) {
    console.error('[ManhwaWeb1 Chapter Images] Error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      images: []
    });
  }
}
