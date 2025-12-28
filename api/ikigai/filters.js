/**
 * ================================================
 * IKIGAI FILTERS API - Endpoint de filtros
 * ================================================
 *
 * FECHA: 2025-12-28
 * CAMBIO: Nuevo endpoint para listar filtros disponibles
 *
 * PROPÓSITO:
 * Proporcionar al frontend la lista completa de:
 * - Géneros disponibles (con sus IDs)
 * - Tipos de contenido (comic/novel)
 * - Estados de publicación
 * - Opciones de ordenamiento
 *
 * IMPORTANTE:
 * - Este endpoint usa los datos de lib/ikigai/proxyConfig.js
 * - Los IDs de géneros, tipos y estados coinciden con el API de Ikigai
 * - El frontend necesita estos IDs para construir las peticiones de búsqueda
 *
 * URL DEL ENDPOINT:
 * - Frontend llama: /api/ikigai/filters (GET)
 * - Este archivo responde con JSON de filtros disponibles
 *
 * LÍMITES DE VERCEL:
 * - Plan gratuito: Máximo 12 funciones serverless
 * - Este archivo cuenta como 1 función
 */

import { GENRES, TYPES, STATUSES, SORT_OPTIONS } from '../../lib/ikigai/proxyConfig.js';

/**
 * Endpoint para listar todos los filtros disponibles en Ikigai
 *
 * @param {object} req - Request de Vercel
 * @param {object} res - Response de Vercel
 * @returns {Promise<void>}
 *
 * Respuesta esperada:
 * {
 *   genres: [{ id, name, slug }, ...],    // Lista de géneros
 *   types: [{ id, name }, ...],            // Tipos de contenido
 *   statuses: [{ id, name }, ...],        // Estados de publicación
 *   sortOptions: [{ value, name }, ...],   // Opciones de ordenamiento
 *   apiBaseUrl: 'https://panel.ikigaimangas.com/api/swf/series',
 *   source: 'ikigai-api-direct'
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[Ikigai Filters] Obteniendo filtros disponibles...');

  try {
    // Construir objeto de filtros con todas las opciones disponibles
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

    // Retornar filtros al frontend
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
