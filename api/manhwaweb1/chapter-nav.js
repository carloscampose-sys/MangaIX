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
    const data = await ApiClient.getChapterNav(slug, chapter);
    
    const result = {
      success: true,
      title: data.name,
      current: { slug, chapter: parseFloat(chapter) },
      previous: data.chapterAnterior ? {
        url: data.chapterAnterior
      } : null,
      next: data.chapterSiguiente ? {
        url: data.chapterSiguiente
      } : null,
      platform: data.actual,
      erotic: data.erotico === 'si'
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ManhwaWeb1 Chapter Nav] Error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      current: { slug, chapter: parseFloat(chapter) },
      previous: null,
      next: null
    });
  }
}
