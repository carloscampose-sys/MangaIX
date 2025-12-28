import axios from 'axios';

/**
 * Busca series en Ikigai usando el endpoint API directo
 * NO requiere Puppeteer, usa Axios directo
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] BÚSQUEDA CON API DIRECTA (AXIOS)');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ============================================');

  try {
    // Construir URL con parámetros
    const baseUrl = 'https://panel.ikigaimangas.com/api/swf/series';
    const params = new URLSearchParams();

    // Siempre incluir nsfw=true
    params.append('nsfw', 'true');

    // Página
    params.append('page', page.toString());

    // Búsqueda por texto
    if (query && query.trim()) {
      params.append('search', query.trim());
    }

    // Filtros de género
    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach(genreId => {
        params.append('genre', genreId);
      });
    }

    // Filtros de tipo
    if (filters.types && filters.types.length > 0) {
      filters.types.forEach(typeId => {
        params.append('type', typeId);
      });
    }

    // Filtros de estado
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(statusId => {
        params.append('status', statusId);
      });
    }

    // Ordenamiento
    if (filters.sortBy) {
      params.append('order', filters.sortBy);
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log('[Ikigai Search] URL:', url);

    // Hacer petición directa con Axios
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    });

    const data = response.data;
    console.log('[Ikigai Search] Response recibida');
    console.log('[Ikigai Search] Total:', data.total);
    console.log('[Ikigai Search] Items en página:', data.data?.length || 0);

    // Mapear resultados al formato esperado
    const results = (data.data || []).map((item) => {
      const result = {
        id: `ikigai-${item.id}`,
        slug: item.slug,
        title: item.name,
        cover: item.cover || item.cover_path || '',
        source: 'ikigai',
        type: item.type,
        status: item.status?.name || '',
        genres: (item.genres || []).map(g => g.name || g.slug),
        chapterCount: item.chapter_count,
        isMature: item.is_mature,
        team: item.team?.name || '',
        ranking: item.ranking
      };

      // Usar la mejor calidad de imagen disponible
      if (item.cover_srcset) {
        const srcsetParts = item.cover_srcset.split(', ');
        if (srcsetParts.length > 1) {
          result.cover = srcsetParts[1].split(' ')[0];
        } else {
          result.cover = srcsetParts[0].split(' ')[0];
        }
      }

      return result;
    });

    console.log('[Ikigai Search] ✅ Éxito');
    console.log('[Ikigai Search] ✅ Resultados transformados:', results.length);

    if (results.length > 0) {
      console.log('[Ikigai Search] Primeros 3 resultados:');
      results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. "${r.title}" (${r.slug})`);
      });
    }

    return res.status(200).json({
      results,
      page: data.current_page || page,
      hasMore: !!data.next_page_url,
      total: data.total,
      lastPage: data.last_page,
      searchMethod: 'api-direct'
    });

  } catch (error) {
    console.error('[Ikigai Search] ❌ Error:', error.message);

    if (error.response) {
      console.error('[Ikigai Search] Status:', error.response.status);
      console.error('[Ikigai Search] Data:', JSON.stringify(error.response.data, null, 2));
      return res.status(error.response.status).json({
        error: 'Error en la API de Ikigai',
        status: error.response.status,
        details: error.response.data
      });
    }

    if (error.request) {
      console.error('[Ikigai Search] No response recibida');
      return res.status(503).json({
        error: 'No se pudo conectar con la API de Ikigai',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}
