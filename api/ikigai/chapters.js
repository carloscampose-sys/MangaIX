/**
 * API Route: Ikigai Chapters
 * Usa la API directa con proxy CORS
 */

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
    console.log(`[Ikigai Chapters] Obteniendo capítulos para: ${slug}`);

    let allChapters = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 50;

    while (hasMorePages && currentPage <= maxPages) {
      const apiUrl = `https://panel.ikigaimangas.com/api/swf/series/${slug}/chapters?page=${currentPage}`;
      const proxyUrl = `https://corsproxy.io/?${apiUrl}`;

      console.log(`[Ikigai Chapters] Página ${currentPage}`);

      let response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${apiUrl}`;
        response = await fetch(thingProxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      }

      if (!response.ok) {
        console.error(`[Ikigai Chapters] Error en página ${currentPage}:`, response.status);
        break;
      }

      const data = await response.json();
      const chapters = data.data || [];

      console.log(`[Ikigai Chapters] Página ${currentPage}: ${chapters.length} capítulos`);

      const transformedChapters = chapters.map(ch => ({
        id: `ikigai-${slug}-ch-${ch.name}-${ch.id}`,
        chapter: ch.name,
        title: ch.title ? `Capítulo ${ch.name} - ${ch.title}` : `Capítulo ${ch.name}`,
        url: `https://viralikigai.milkchoco.online/capitulo/${ch.id}/`,
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
