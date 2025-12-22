/**
 * Obtiene la URL de imagen usando el proxy si es necesario
 * En local usa la URL directa, en producción usa el proxy para evitar CORS
 */
export const getImageUrl = (url) => {
    if (!url) return null;

    // Si es un loader o asset genérico, retornar null
    if (url.includes('loader') || url.includes('/assets/img/')) {
        return null;
    }

    // Verificar si estamos en localhost
    const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Si es de tumanga y estamos en producción, usar el proxy
    if (url.includes('tumanga.org') && !isLocalhost) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }

    // Si es de manhwaweb (imageshack) y estamos en producción, usar el proxy
    if (url.includes('imageshack.com') && !isLocalhost) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }

    // En otros casos, usar la URL directa
    return url;
};

/**
 * Placeholder SVG en base64 (no depende de servicios externos)
 */
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiB2aWV3Qm94PSIwIDAgMzAwIDQ1MCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiMxZjI5MzciLz48dGV4dCB4PSIxNTAiIHk9IjIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2MCI+8J+lkTwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjI2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIj5TaW4gcG9ydGFkYTwvdGV4dD48L3N2Zz4=';
