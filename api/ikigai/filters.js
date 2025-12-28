import { GENRES, TYPES, STATUSES, SORT_OPTIONS } from './proxyConfig.js';

/**
 * Endpoint para listar todos los filtros disponibles en Ikigai
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[Ikigai Filters] Obteniendo filtros disponibles...');

  try {
    const filters = {
      genres: GENRES.map(g => ({
        id: g.id,
        name: g.name,
        slug: g.slug
      })),
      types: TYPES.map(t => ({
        id: t.id,
        name: t.name
      })),
      statuses: STATUSES.map(s => ({
        id: s.id,
        name: s.name
      })),
      sortOptions: SORT_OPTIONS.map(s => ({
        value: s.value,
        name: s.name
      }))
    };

    console.log('[Ikigai Filters] ✅ Géneros:', filters.genres.length);
    console.log('[Ikigai Filters] ✅ Tipos:', filters.types.length);
    console.log('[Ikigai Filters] ✅ Estados:', filters.statuses.length);
    console.log('[Ikigai Filters] ✅ Ordenamiento:', filters.sortOptions.length);

    return res.status(200).json({
      ...filters,
      apiBaseUrl: 'https://panel.ikigaimangas.com/api/swf/series',
      source: 'ikigai-api-direct'
    });

  } catch (error) {
    console.error('[Ikigai Filters] ❌ Error:', error.message);
    return res.status(500).json({
      error: 'Error al obtener filtros',
      details: error.message
    });
  }
}
