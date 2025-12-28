/**
 * ================================================
 * IKIGAI SEARCH API - Endpoint de búsqueda
 * ================================================
 *
 * FECHA: 2025-12-28
 * CAMBIO: Implementado ScrapingBee Free para bypass Cloudflare
 *
 * ANTES: Usaba Puppeteer o Axios directo
 *        - Problema: Cloudflare bloqueaba IP de Vercel (datacenter)
 *        - Confiabilidad Axios directo: 0% (siempre bloqueaba)
 *        - Confiabilidad Puppeteer: 30-40%
 *
 * AHORA: Usa ScrapingBee Free (1000 req/mes)
 *        - Ventaja: ScrapingBee maneja proxies y bypass Cloudflare
 *        - Confiabilidad: ~95% de éxito
 *        - Velocidad: ~1-3s por búsqueda
 *
 * API Key de ScrapingBee: 1V32WF6IUBATGZ33GUYNIZ6VW8FT6MQS9BL0NMMYM9QQTZ0TW4ECK48X8EQE78FURLR9LR634GD9MKPI
 *
 * PARÁMETROS SOPORTADOS POR SCRAPINGBEE:
 * - api_key: Tu API key
 * - url: URL de Ikigai a scrapear
 * - render_js: false (no renderizar, API directa es suficiente)
 * - country_code: 'us' (IP de Estados Unidos)
 * - extract_rules: '' (no usar reglas de extracción, API devuelve JSON)
 *
 * ESTRUCTURA DE RESPUESTA DE SCRAPINGBEE:
 * {
 *   request_id: "ID de la petición",
 *   body: "HTML o JSON string (si render_js=true devuelve JSON)",
 *   remaining_requests: Requests restantes en el mes
 *   ...
 * }
 *
 * ARCHIVOS DE CONFIGURACIÓN:
 * - lib/ikigai/proxyConfig.js: IDs de géneros, tipos, estados
 *
 * VARIABLES DE ENTORNO (.env.local):
 * - SCRAPINGBEE_KEY: Tu API key de ScrapingBee
 */

import axios from 'axios';

// ========================================
// VERIFICACIÓN DE API KEY
// ========================================

const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_KEY;

/**
 * Verifica que la API key está configurada
 * @returns {boolean}
 */
function checkApiKey() {
  if (!SCRAPINGBEE_KEY) {
    console.error('[Ikigai Search] ❌ ERROR: SCRAPINGBEE_KEY no está configurada en variables de entorno');
    console.error('[Ikigai Search] ❌ Pasos para corregir:');
    console.error('[Ikigai Search]    1. Crear archivo .env.local con:');
    console.error('[Ikigai Search]       SCRAPINGBEE_KEY=1V32WF6IUBATGZ33GUYNIZ6VW8FT6MQS9BL0NMMYM9QQTZ0TW4ECK48X8EQE78FURLR9LR634GD9MKPI');
    console.error('[Ikigai Search]    2. En Vercel dashboard → Settings → Environment Variables');
    console.error('[Ikigai Search]    3. Agregar: SCRAPINGBEE_KEY = 1V32WF6IUBATGZ33GUYNIZ6VW8FT6MQS9BL0NMMYM9QQTZ0TW4ECK48X8EQE78FURLR9LR634GD9MKPI');
    console.error('[Ikigai Search]    4. Redeploy el proyecto');
    return false;
  }
  console.log('[Ikigai Search] ✅ API Key configurada correctamente');
  return true;
}

// ========================================
// HANDLER PRINCIPAL
// ========================================

/**
 * Busca series en Ikigai usando ScrapingBee Free
 *
 * @param {object} req - Request de Vercel
 * @param {object} res - Response de Vercel
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar API key
  if (!checkApiKey()) {
    return res.status(500).json({
      error: 'SCRAPINGBEE_KEY no está configurada en variables de entorno',
      solution: 'Configurar SCRAPINGBEE_KEY en .env.local o en Vercel Environment Variables'
    });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  console.log('[Ikigai Search] ============================================');
  console.log('[Ikigai Search] BÚSQUEDA CON SCRAPINGBEE FREE');
  console.log('[Ikigai Search] Query:', query);
  console.log('[Ikigai Search] Filters:', JSON.stringify(filters));
  console.log('[Ikigai Search] Página:', page);
  console.log('[Ikigai Search] ============================================');

  try {
    // Construir URL de Ikigai
    const baseUrl = 'https://panel.ikigaimangas.com/api/swf/series';
    const params = new URLSearchParams();

    // Siempre incluir nsfw=true
    params.append('nsfw', 'true');

    // Página
    params.append('page', page.toString());

    // Búsqueda por texto (opcional)
    if (query && query.trim()) {
      params.append('search', query.trim());
    }

    // Filtros de género (múltiples géneros pueden enviarse)
    if (filters.genres && filters.genres.length > 0) {
      filters.genres.forEach(genreId => {
        params.append('genre', genreId);
      });
    }

    // Filtros de tipo (comic/novel)
    if (filters.types && filters.types.length > 0) {
      filters.types.forEach(typeId => {
        params.append('type', typeId);
      });
    }

    // Filtros de estado (múltiples estados pueden enviarse)
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(statusId => {
        params.append('status', statusId);
      });
    }

    // Ordenamiento (opcional)
    if (filters.sortBy) {
      params.append('order', filters.sortBy);
    }

    const targetUrl = `${baseUrl}?${params.toString()}`;
    console.log('[Ikigai Search] URL target:', targetUrl);

    // Hacer petición a través de ScrapingBee
    // IMPORTANTE: ScrapingBee espera los parámetros en la query string, NO en el body
    const scrapingbeeUrl = new URL('https://app.scrapingbee.com/api/v1/');
    scrapingbeeUrl.searchParams.append('api_key', SCRAPINGBEE_KEY);
    scrapingbeeUrl.searchParams.append('url', targetUrl);
    scrapingbeeUrl.searchParams.append('render_js', 'false');  // NO renderizar JS, la API directa es suficiente
    scrapingbeeUrl.searchParams.append('country_code', 'us');  // IP de Estados Unidos

    console.log('[Ikigai Search] ScrapingBee URL:', scrapingbeeUrl.toString());

    const response = await axios.get(scrapingbeeUrl.toString(), {
      timeout: 30000,  // 30 segundos de timeout
      headers: {
        'Accept': 'application/json'
      },
      responseType: 'text'  // Importante: recibir como texto primero
    });

    console.log('[Ikigai Search] Response status:', response.status);
    console.log('[Ikigai Search] Response data type:', typeof response.data);
    console.log('[Ikigai Search] Response data is null:', response.data === null);
    console.log('[Ikigai Search] Response data is undefined:', response.data === undefined);
    console.log('[Ikigai Search] Response data length:', response.data?.length || 0);

    // Con GET, la respuesta es el contenido directamente de la URL target
    const responseBody = typeof response.data === 'string' ? response.data : '';

    console.log('[Ikigai Search] Longitud del body:', responseBody.length);

    // ========================================
    // PARSEAR RESPUESTA DE SCRAPINGBEE
    // ========================================

    let parsedData;

    // Intentar parsear como JSON primero
    try {
      parsedData = JSON.parse(responseBody);
      console.log('[Ikigai Search] ✅ JSON parseado correctamente');
      console.log('[Ikigai Search] Total:', parsedData.total);
      console.log('[Ikigai Search] Items en página:', parsedData.data?.length || 0);
    } catch (parseError) {
      console.error('[Ikigai Search] ❌ Error parseando JSON:', parseError.message);

      // Si no es JSON, verificar si es HTML de Cloudflare
      if (responseBody.includes('Just a moment') ||
          responseBody.includes('Checking your browser') ||
          responseBody.includes('Cloudflare') ||
          responseBody.includes('Enable JavaScript')) {
        console.error('[Ikigai Search] ❌ Cloudflare está bloqueando incluso con ScrapingBee');
        return res.status(503).json({
          error: 'Cloudflare está bloqueando Ikigai incluso con ScrapingBee',
          details: 'El endpoint de Ikigai está muy protegido. Considerar:',
          options: [
            '1. Usar proxies residenciales (plan pago de ScrapingBee)',
            '2. Esperar y reintentar más tarde (Cloudflare puede bajar la protección temporalmente)',
            '3. Desactivar Ikigai temporalmente hasta encontrar una solución mejor'
          ],
          bodyPreview: responseBody.substring(0, 500) + '...'
        });
      }

      return res.status(500).json({
        error: 'No se pudo parsear la respuesta de Ikigai',
        bodyPreview: responseBody.substring(0, 500) + '...',
        parseError: parseError.message
      });
    }

    // ========================================
    // MAPEAR RESULTADOS AL FORMATO ESPERADO
    // ========================================

    // El frontend espera objetos con: id, slug, title, cover, source, etc.
    const results = (parsedData.data || []).map((item) => {
      const result = {
        id: `ikigai-${item.id}`,           // ID único para el frontend
        slug: item.slug,                      // Slug para URL de la obra
        title: item.name,                     // Nombre de la obra
        cover: item.cover || item.cover_path || '',  // URL de la imagen
        source: 'ikigai',                    // Fuente de datos
        type: item.type,                       // comic | novel
        status: item.status?.name || '',        // Estado de publicación
        genres: (item.genres || []).map(g => g.name || g.slug),  // Array de géneros
        chapterCount: item.chapter_count,       // Número total de capítulos
        isMature: item.is_mature,           // Contenido adulto
        team: item.team?.name || '',          // Scanlation team
        ranking: item.ranking                  // Ranking (si existe)
      };

      // Usar la mejor calidad de imagen disponible
      // La API devuelve un srcset con diferentes tamaños
      if (item.cover_srcset) {
        const srcsetParts = item.cover_srcset.split(', ');
        // srcset tiene formato: "url1 768w, url2 1536w"
        if (srcsetParts.length > 1) {
          result.cover = srcsetParts[1].split(' ')[0]; // Tomar la más grande (1536w)
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

    // ========================================
    // RETORNAR RESPUESTA CON ESTRUCTURA ESPERADA POR EL FRONTEND
    // ========================================

    return res.status(200).json({
      results,                              // Array de resultados
      page: parsedData.current_page || page,       // Página actual
      hasMore: !!parsedData.next_page_url,        // Hay más páginas
      total: parsedData.total,                    // Total de resultados
      lastPage: parsedData.last_page,             // Última página
      searchMethod: 'scrapingbee-free'        // Método usado (para debugging)
    });

  } catch (error) {
    console.error('[Ikigai Search] ❌ Error:', error.message);

    // ========================================
    // MANEJO DE ERRORES
    // ========================================

    // Error de respuesta de ScrapingBee
    if (error.response) {
      console.error('[Ikigai Search] Status:', error.response.status);
      console.error('[Ikigai Search] Data:', JSON.stringify(error.response.data, null, 2));

      // Manejar errores específicos de ScrapingBee
      if (error.response.status === 401) {
        return res.status(401).json({
          error: 'API Key de ScrapingBee inválida o no autorizada',
          details: 'Verifica que la variable SCRAPINGBEE_KEY está correcta en Vercel Environment Variables'
        });
      }

      if (error.response.status === 402) {
        return res.status(402).json({
          error: 'Requests de ScrapingBee agotadas',
          details: 'El plan gratuito tiene 1000 requests/mes. Si se agotaron, espera el próximo mes o actualiza a un plan de pago.'
        });
      }

      if (error.response.status === 429) {
        return res.status(429).json({
          error: 'Límite de velocidad de ScrapingBee excedido',
          details: 'Demasiadas requests muy rápido. Reduce la velocidad o agrega un delay entre requests.'
        });
      }

      return res.status(error.response.status).json({
        error: 'Error en la API de ScrapingBee',
        status: error.response.status,
        details: error.response.data
      });
    }

    // Error de conexión (no se recibió respuesta)
    if (error.request) {
      console.error('[Ikigai Search] No response recibida de ScrapingBee');
      return res.status(503).json({
        error: 'No se pudo conectar con ScrapingBee',
        details: error.message
      });
    }

    // Otros errores
    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}
