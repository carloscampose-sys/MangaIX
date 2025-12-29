/**
 * API Route: Ikigai Chapters
 * Usa la API directa de panel.ikigaimangas.com
 * Obtiene TODOS los capítulos iterando la paginación
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

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    console.log(`[Ikigai Chapters] Obteniendo capítulos para: ${slug}`);

    let allChapters = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 50; // Límite de seguridad

    while (hasMorePages && currentPage <= maxPages) {
      const apiUrl = `https://panel.ikigaimangas.com/api/swf/series/${slug}/chapters?page=${currentPage}`;
      console.log(`[Ikigai Chapters] Página ${currentPage}: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://viralikigai.eurofiyati.online/'
        }
      });

      if (!response.ok) {
        console.error(`[Ikigai Chapters] API Error en página ${currentPage}:`, response.status);
        break;
      }

      const data = await response.json();
      const chapters = data.data || [];

      console.log(`[Ikigai Chapters] Página ${currentPage}: ${chapters.length} capítulos`);

      // Transformar capítulos
      // IMPORTANTE: La URL de lectura usa el ID del capítulo, no el número
      const transformedChapters = chapters.map(ch => ({
        id: `ikigai-${slug}-ch-${ch.name}-${ch.id}`,
        chapter: ch.name,
        title: ch.title ? `Capítulo ${ch.name} - ${ch.title}` : `Capítulo ${ch.name}`,
        url: `https://viralikigai.eurofiyati.online/capitulo/${ch.id}/`,
        publishedAt: ch.published_at,
        likeCount: ch.like_count,
        chapterId: ch.id,  // ID numérico largo para la URL de lectura
        source: 'ikigai'
      }));

      allChapters.push(...transformedChapters);

      // Verificar si hay más páginas
      const meta = data.meta || {};
      if (currentPage >= (meta.last_page || 1)) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    }

    // Ordenar capítulos por número (descendente: más reciente primero)
    allChapters.sort((a, b) => {
      const numA = parseFloat(a.chapter) || 0;
      const numB = parseFloat(b.chapter) || 0;
      return numB - numA;
    });

    console.log(`[Ikigai Chapters] Total capítulos: ${allChapters.length}`);

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
