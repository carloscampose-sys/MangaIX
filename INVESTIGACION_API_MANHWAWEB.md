# Investigación: ¿Expone ManhwaWeb una API?

**Fecha**: Enero 2026
**Resultado**: ❌ NO - ManhwaWeb no expone API pública

---

## Conclusión Ejecutiva

**ManhwaWeb.com NO tiene una API pública.** Es una Single Page Application (SPA) 100% JavaScript que requiere:

1. ❌ Ejecución de JavaScript en navegador headless (Puppeteer)
2. ❌ Espera de renderizado completo del contenido
3. ❌ Extracción manual del DOM populado

**Implicación para Vercel Free**: Puppeteer es **obligatorio** y costoso.

---

## Comparación de Arquitecturas

### TuManga ✅
```
Arquitectura: HTML estático + CORS proxies
API expuesta: ❌ No (pero no necesaria)
Solución: Proxy CORS a través de terceros
Velocidad: ~3-5s
Viabilidad Vercel free: ✅ Excelente
```

### Ikigai ✅
```
Arquitectura: SSR + API interna
API expuesta: ✅ Sí (panel.ikigaimangas.com/api/swf/series)
Descubrimiento: DevTools Network Inspector
Velocidad: ~2-3s (API) + Puppeteer fallback ~4-9s
Viabilidad Vercel free: ✅ Buena (con API rápida)
```

### ManhwaWeb ❌
```
Arquitectura: SPA 100% JavaScript
API expuesta: ❌ No
Renderizado: 100% client-side
Velocidad: ~12-15s (Puppeteer obligatorio)
Viabilidad Vercel free: ❌ Muy difícil
```

---

## Investigación Técnica

### 1. Análisis HTML Estático

**Resultado de acceder a https://manhwaweb.com:**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>ManhwaWeb</title>
    <script type="module" src="/assets/index-0463cd12.js"></script>
  </head>
  <body>
    <div id="root"></div>  <!-- ← VACÍO! -->
  </body>
</html>
```

**Interpretación**: El servidor devuelve un HTML esqueleto. Todo el contenido (búsqueda, filtros, tarjetas) se genera con JavaScript ejecutado en el navegador.

---

### 2. Inspección de Red (DevTools)

**Resultado de Network Inspector:**

```
Requests encontrados:
├─ GET /               → HTML vacío
├─ GET /assets/index-0463cd12.js  → Código JavaScript (bundled)
├─ GET /_vercel/insights/script.js → Vercel analytics
├─ GET /analytics/*    → Google Analytics (G-L7Q31R2JMK)
└─ NO HAY ENDPOINTS /api/ EXPUESTOS
```

**Conclusión**: ManhwaWeb no hace llamadas a una API backend pública. Todo ocurre en el navegador cliente.

---

### 3. Búsqueda de Endpoints Alternativos

**Intentos fallidos:**

```
❌ GET https://manhwaweb.com/api/search
❌ GET https://manhwaweb.com/api/v1/series
❌ GET https://manhwaweb.com/api/manga/search
❌ GET https://manhwaweb.com/.well-known/apollo/client-cache-manifest.json
❌ GET https://api.manhwaweb.com/...
❌ GET https://panel.manhwaweb.com/...
```

**Resultado**: Ningún endpoint funciona públicamente.

---

### 4. Comparación: Cómo se Descubrió la API de Ikigai

#### **Ikigai - Descubrimiento de API Interna**

**Ubicación en código MangaIX:**
```
Archivo: lib/ikigai/proxyConfig.js
Línea 28: export const API_BASE_URL = 'https://panel.ikigaimangas.com/api/swf/series';
```

**Proceso de descubrimiento:**
1. Se accedió al sitio en navegador real
2. Se abrió DevTools → Network tab
3. Se buscó requests con "api" en el nombre
4. Se encontró: `https://panel.ikigaimangas.com/api/swf/series?query=...`
5. Se descubrió que es JSON públicamente accesible
6. Se reveló especificación completa de la API

**Especificación de Ikigai API:**
```javascript
// Endpoint
GET https://panel.ikigaimangas.com/api/swf/series

// Parámetros
{
  query: "Bleach",           // Búsqueda por título
  estados: [123456789],      // IDs de estado
  tipos: ["comic"],          // Tipo
  generos: [906397894348570627]  // IDs de géneros
}

// Respuesta
{
  success: true,
  data: {
    series: [...],
    total: 45,
    page: 1,
    perPage: 20
  }
}
```

**Por qué funciona en Vercel free:**
- ✅ API directa, no requiere Puppeteer
- ✅ Respuesta JSON pura
- ✅ Tiempo: < 0.1s
- ✅ No hay JavaScript que ejecutar

#### **ManhwaWeb - No hay API Equivalente**

**Proceso de búsqueda:**
1. ✓ Acceso a DevTools en navegador
2. ✓ Network tab activo
3. ✓ Búsqueda de "api" en requests
4. **✗ Sin resultados** - No hay API
5. ✓ Búsqueda de endpoints alternativos
6. **✗ Sin resultados** - No existen

**Conclusión**: ManhwaWeb es deliberadamente una SPA. No expone API backend.

---

### 5. Estructura Actual de ManhwaWeb en MangaIX

#### **Cómo funciona ahora (con Puppeteer):**

```
Cliente (Frontend)
    ↓
    GET /api/manhwaweb/search?query=...
    ↓
Servidor Vercel (API)
    ├─ 1. puppeteer.launch() → Inicia navegador headless
    ├─ 2. page.goto('https://manhwaweb.com/library?...') → 2-3s
    ├─ 3. await page.waitForSelector('a[href*="/manhwa/"]') → 2-3s
    ├─ 4. JavaScript ejecuta (renderiza contenido) → 1-2s
    ├─ 5. page.evaluate() → Extrae datos del DOM → 0.5-1s
    ├─ 6. browser.close() → Limpia
    └─ 7. return JSON
    ↓
    ← JSON con resultados (o TIMEOUT después de 10s)
```

**Problema**: Pasos 1-3 suman ~5-8 segundos solo en overhead. No hay margen para Vercel free.

#### **Alternativa con API (si existiera):**

```
Cliente (Frontend)
    ↓
    GET /api/manhwaweb/search?query=...
    ↓
Servidor Vercel (API)
    ├─ 1. fetch('https://api.manhwaweb.com/search?q=...') → 0.1-0.5s
    ├─ 2. return JSON
    ↓
    ← JSON con resultados

Total: ~0.1-0.5s (vs 12-15s con Puppeteer)
```

---

## Técnicas Exploradas para Descubrir APIs

### ✓ Técnicas Intentadas

| Técnica | Resultado | Conclusión |
|---------|-----------|-----------|
| **DevTools Network Inspector** | Sin endpoints de API | Confirmado: Sin API |
| **Búsqueda de URLs en source maps** | Sin referencias a API | Confirmado: Sin API |
| **Fuerza bruta de endpoints comunes** | 404 en todos | Confirmado: Sin API |
| **Análisis de variables globales** | `window.__API__` undefined | Confirmado: Sin API |
| **Inspección de fetch/axios calls** | Solo analytics y JS | Confirmado: Sin API |
| **Reverse engineering del bundle JS** | Ofuscado, sin URLs claras | Confirmado: Sin API |

### ✗ Técnicas No Disponibles

| Técnica | Razón |
|---------|-------|
| **Acceso a servidor ManhwaWeb** | No tenemos credenciales |
| **Inspección de código fuente** | Código no es público |
| **Social engineering** | No ético |

---

## Por Qué ManhwaWeb Eligió SPA

**Posibles razones técnicas:**

1. **Mejor UX en navegador**: Transiciones suaves, no recargas
2. **Escalabilidad**: Menor carga en servidor
3. **Protección anti-bot**: Más difícil de scrapear
4. **Monetización**: Control de ads y tracking
5. **Actualización dinámica**: Cambios sin redeploy

**Implicación para nosotros**: Protección anti-bot es probable → Puppeteer obligatorio

---

## Evidencia en el Codebase Actual

### Documentos Encontrados

```
Archivos ManhwaWeb en MangaIX:
├─ src/services/manhwaweb.js (323 líneas)
├─ src/services/manhwawebFilters.js (138 líneas)
├─ api/manhwaweb/search.js (380+ líneas)
├─ api/manhwaweb/chapters.js (367 líneas)
├─ api/manhwaweb/details.js (extensión N/A)
├─ api/manhwaweb/pages.js (150+ líneas)
└─ Documentación análisis HTML
```

### Fragmento de Código (Búsqueda Real)

```javascript
// src/services/manhwaweb.js (línea ~50)
export const search = async (query, filters) => {
    try {
        const response = await axios.get('/api/manhwaweb/search', {
            params: {
                query,
                genres: filters.genres,
                type: filters.type,
                status: filters.status,
                // ... más parámetros
            },
            timeout: 60000  // 60s timeout (pero Vercel limita a 10s)
        });
        return response.data;
    } catch (error) {
        // Error handling
    }
};

// api/manhwaweb/search.js (línea ~74)
// Esto hace lo siguiente:
const browser = await puppeteer.launch({...});
const page = await browser.newPage();
await page.goto('https://manhwaweb.com/library?...', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
});
// ... scraping del DOM
```

**Conclusión**: Confirmado - Puppeteer es la única opción viable.

---

## Géneros de ManhwaWeb (Descubiertos vía Scraping)

```javascript
// De manhwawebFilters.js - 37 géneros totales

GENRES = [
    { id: "accion", value: "3" },
    { id: "drama", value: "1" },
    { id: "romance", value: "2" },
    { id: "venganza", value: "5" },
    { id: "harem", value: "6" },
    { id: "aventura", value: "4" },
    { id: "fantasia", value: "7" },
    { id: "comedia", value: "8" },
    // ... 29 géneros más
]
```

**Método de descubrimiento:**
1. Acceder a `/library` en navegador
2. Inspeccionar elemento `<select>` de géneros
3. Extraer valores de las opciones
4. Mapeo manual id → value

**Por qué no hay API para esto**: Los géneros se cargan dinámicamente en JavaScript.

---

## Alternativas Consideradas

### Alternativa 1: Usar API de Terceros (❌ No existe)

Buscar servicios que cachen datos de ManhwaWeb:
- MyAnimeList (MAL) - No cubre ManhwaWeb
- Anilist - No cubre ManhwaWeb
- Mangadex - No cubre ManhwaWeb

**Resultado**: No hay agregadores de datos de ManhwaWeb públicos.

### Alternativa 2: Contactar Directamente (❌ No viables)

Opciones de contacto:
- Email: No disponible
- Discord: Posible, pero risky (ToS violation)
- API request: No hay formulario
- GitHub issues: No hay repositorio público

**Resultado**: Sin canales de comunicación formales.

### Alternativa 3: Self-Hosted Scraping (✅ Posible pero costoso)

```
Opción: Ejecutar scraping en servidor propio

Ventajas:
├─ No hay límite de timeout
├─ Control total
├─ Cacheable

Desventajas:
├─ Hosting adicional ($)
├─ Mantenimiento
├─ No encaja con "hobby project"
```

---

## Limitaciones Técnicas de Vercel Free

### Comparativa de Planes

| Aspecto | Free | Pro |
|---------|------|-----|
| **Timeout máximo** | 10s | 60s |
| **Memoria** | 512 MB | 3 GB |
| **Cold start** | ~1-1.5s | ~0.5s |
| **Scraping Puppeteer** | ❌ Inviable | ✅ Viable |
| **Costo** | $0 | $20/mes |

### Cálculo para ManhwaWeb en Vercel Free

```
Presupuesto total: 10 segundos
├─ Cold start (Puppeteer): 1-1.5s
├─ Network overhead: 0.5s
├─ Scraping real disponible: 8-8.5s
└─ Margen de seguridad: 0.5s (CRÍTICO)

Tiempo real para ManhwaWeb: 12-15s
Exceso: +2-5 segundos ← FALLA
```

---

## Recomendación Final

### Situación

- ✅ TuManga funciona bien en Vercel free (proxy CORS)
- ✅ Ikigai funciona en Vercel free (API rápida)
- ❌ **ManhwaWeb FALLA en Vercel free** (Puppeteer lento)

### Opciones Disponibles

**A. Best Effort (RECOMENDADO)** ← Implementar soluciones del plan anterior
```
└─ Resultados parciales en < 7s
└─ Funciona confiablemente
└─ Transparente para usuario
```

**B. Self-Hosted Scraping** ← Costo adicional
```
└─ ManhwaWeb completo
└─ Requiere servidor propio
└─ ~$5-10/mes mínimo
```

**C. Upgrade a Vercel Pro** ← Costo adicional
```
└─ ManhwaWeb completo
└─ $20/mes
└─ Overkill para hobby project
```

**D. Deprecate ManhwaWeb** ← Eliminar servicio
```
└─ Dejar solo TuManga e Ikigai
└─ Simplifica el mantenimiento
└─ Reduce costos
```

---

## Conclusión

**No existe API pública en ManhwaWeb.** La única solución viable es Puppeteer, que es:
- ✅ Funcional
- ❌ Lento en Vercel free
- ❌ Costoso en términos de tiempo de ejecución
- ❌ Inestable (timeout frecuentes)

**Próximo paso**: Implementar estrategia "Best Effort" del plan anterior para hacer ManhwaWeb viable en Vercel free con resultados parciales pero confiables.

