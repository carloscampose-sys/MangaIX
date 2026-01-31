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

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const apiUrl = `https://panel.ikigaimangas.com/api/swf/series/${slug}`;
    console.log('[Ikigai Details] API URL:', apiUrl);

    // Usar proxy para evitar bloqueo 403 (corsproxy primero, codetabs como fallback)
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
