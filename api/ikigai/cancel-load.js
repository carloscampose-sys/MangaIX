/**
 * API Route: Ikigai Cancel Load
 * Cancela la carga actual de series
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Ikigai Cancel Load] Carga cancelada por el usuario');
    
    return res.status(200).json({
      cancelled: true,
      message: 'Carga cancelada por el usuario'
    });

  } catch (error) {
    console.error('[Ikigai Cancel Load] Error:', error);
    return res.status(500).json({
      error: 'Error al cancelar carga',
      details: error.message
    });
  }
}
