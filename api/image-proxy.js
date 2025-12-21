export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        // Decodificar la URL
        const imageUrl = decodeURIComponent(url);

        // Hacer la petición a la imagen con headers que simulan un navegador
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://tumanga.org/',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch image' });
        }

        // Obtener el content-type de la imagen
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Configurar cache para 24 horas
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        res.setHeader('Content-Type', contentType);

        // Convertir la respuesta a buffer y enviarla
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return res.send(buffer);
    } catch (error) {
        console.error('Image proxy error:', error);
        return res.status(500).json({ error: 'Failed to proxy image' });
    }
}
