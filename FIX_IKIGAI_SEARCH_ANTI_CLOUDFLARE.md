# Fix: Ikigai Search con Anti-Cloudflare

## Problema Identificado

La búsqueda por filtros en Ikigai dejó de funcionar debido a que **Cloudflare estaba bloqueando completamente las solicitudes de Puppeteer** en Vercel.

### Evidencia del Problema
```
seriesLinksCount: 0
bodyLength: 5725 (página de challenge de Cloudflare)
title: "Just a moment..."
bodyText: "Enable JavaScript and cookies to continue"
```

La página nunca cargaba - Cloudflare detectaba Puppeteer y mostraba el challenge JavaScript que nunca se completaba.

## Solución Implementada

Apliqué las **mismas técnicas anti-detección** que ya funcionaban exitosamente en `api/ikigai/chapters.js`:

### 1. Anti-Detección Avanzada
```javascript
// User agents rotativos por página
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0'
];

// Flags de Chromium para evitar detección
'--disable-blink-features=AutomationControlled'

// Sobrescribir propiedades del navegador
Object.defineProperty(navigator, 'webdriver', { get: () => false });
window.navigator.chrome = { runtime: {} };
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
```

### 2. Función Especializada para Cloudflare
```javascript
async function waitForCloudflareChallenge(page, timeout = 25000) {
  // Espera a que desaparezca el challenge
  await page.waitForFunction(() => {
    return !title.includes('Just a moment') &&
           !bodyText.includes('Checking your browser');
  });
  
  // Espera a que aparezca el contenido real
  await page.waitForFunction(() => {
    const seriesLinks = document.querySelectorAll('a[href*="/series/"]');
    return seriesLinks.length > 0 && bodyText.length > 1000;
  });
}
```

### 3. Navegación en Dos Pasos
```javascript
// PASO 1: Establecer sesión en la home
await puppeteerPage.goto('https://viralikigai.foodib.net/');
await new Promise(resolve => setTimeout(resolve, 3000));

// PASO 2: Navegar a la URL con filtros
await puppeteerPage.goto(targetUrl);
await waitForCloudflareChallenge(puppeteerPage);
```

### 4. Timeouts Optimizados
- Home: 30s (networkidle0) → 20s (domcontentloaded) fallback
- Filtros: 45s (networkidle0) → 35s (domcontentloaded) fallback
- Challenge: 25s con recuperación si hay enlaces

### 5. Bloqueo de Recursos
```javascript
await puppeteerPage.setRequestInterception(true);
puppeteerPage.on('request', (request) => {
  const blockedResources = ['ads', 'analytics', 'doubleclick', 'tracking'];
  if (blockedResources.some(r => url.includes(r))) {
    request.abort();
  }
});
```

## Cambios Realizados

### Archivo: `api/ikigai/search.js`

**Antes:**
- User agent estático
- Sin anti-detección
- Navegación directa a URL con filtros
- Esperas fijas de 20-40 segundos
- Sin función especializada para Cloudflare

**Después:**
- User agents rotativos
- Anti-detección completa (webdriver, chrome, plugins)
- Navegación en dos pasos (home → filtros)
- Función `waitForCloudflareChallenge()` con recuperación
- Timeouts optimizados con fallbacks
- Bloqueo de recursos innecesarios

## Formato de URL Confirmado

El formato de URL ya era correcto:
```
https://viralikigai.foodib.net/series/?generos[]=906397894527549443&tipos[]=comic&estados[]=906428048651190273&ordenar=name&pagina=2
```

El problema NO era la construcción de la URL, sino que **Cloudflare bloqueaba antes de que la página cargara**.

## Resultados Esperados

Con estas mejoras, la búsqueda por filtros en Ikigai debería:

✅ Superar el challenge de Cloudflare
✅ Cargar correctamente las páginas con filtros
✅ Extraer los resultados de búsqueda
✅ Funcionar la paginación (página siguiente)

## Testing

Para probar:
1. Seleccionar fuente "Ikigai"
2. Aplicar filtros de género (ej: Acción)
3. Hacer búsqueda
4. Verificar que aparecen resultados
5. Probar "Cargar más" para página 2

## Notas Técnicas

- La función `waitForCloudflareChallenge()` es la misma que funciona en `chapters.js`
- Los timeouts son más agresivos que antes pero con fallbacks
- Si Cloudflare sigue bloqueando, la API retorna error claro: `"Cloudflare bloqueó la solicitud"`
- El método se identifica como `"anti-cloudflare"` en los logs

## Próximos Pasos (si sigue fallando)

Si Cloudflare sigue bloqueando después de este fix:

**Opción 1:** Usar `puppeteer-extra` con `puppeteer-extra-plugin-stealth`
- Más sofisticado que las técnicas manuales
- Requiere cambiar dependencias

**Opción 2:** Servicio anti-Cloudflare pagado
- ScraperAPI, Bright Data, etc.
- $20-50/mes pero garantizado

**Opción 3:** Deshabilitar búsqueda por filtros en Ikigai temporalmente
- Mostrar mensaje claro al usuario
- Mantener solo otras fuentes (TuManga, ManhwaWeb)
