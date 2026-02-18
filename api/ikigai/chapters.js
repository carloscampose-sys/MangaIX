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

      console.log(`[Ikigai Chapters] Página ${currentPage}`);

      // Usar proxy para evitar bloqueo 403 (corsproxy primero, codetabs como fallback)
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

      let response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      // Fallback a codetabs si corsproxy falla
      if (!response.ok) {
        console.log(`[Ikigai Chapters] corsproxy falló en página ${currentPage}, intentando codetabs...`);
        const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiUrl)}`;
        response = await fetch(codetabsUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      }

      if (!response.ok) {
        console.error(`[Ikigai Chapters] Error en página ${currentPage}:`, response.status);
        break;
      }

      // Verificar que la respuesta sea JSON válido
      const text = await response.text();
      if (!text || text.startsWith('A server') || text.startsWith('<!') || text.startsWith('<html')) {
        console.error(`[Ikigai Chapters] Respuesta inválida en página ${currentPage}:`, text.substring(0, 50));
        break;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(`[Ikigai Chapters] JSON inválido en página ${currentPage}:`, text.substring(0, 50));
        break;
      }

      const chapters = data.data || [];

      console.log(`[Ikigai Chapters] Página ${currentPage}: ${chapters.length} capítulos`);

      const transformedChapters = chapters.map(ch => ({
        id: `ikigai-${slug}-ch-${ch.name}-${ch.id}`,
        chapter: ch.name,
        title: ch.title ? `Capítulo ${ch.name} - ${ch.title}` : `Capítulo ${ch.name}`,
        url: `https://visualikigai.radiot.space/capitulo/${ch.id}/`,
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
