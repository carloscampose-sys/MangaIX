# PLAN DETALLADO PARA SOLUCIONAR BÚSQUEDA POR FILTROS DE IKIGAI

## 📋 ANÁLISIS DEL PROBLEMA

### Estado Actual
- **Fuente:** Ikigai (`https://viralikigai.foodib.net/series/`)
- **Problema:** Cloudflare Challenge bloquea todas las solicitudes
- **Síntomas:** Timeout de 35s esperando challenge, página muestra "Just a moment..."
- **Logs:** `Waiting failed: 21000ms exceeded`, `hasCloudflareText: false`, `seriesLinksCount: 0`

### Comparación con otras fuentes

| Aspecto | Ikigai | TuManga | ManhwaWeb |
|---------|--------|---------|-----------|
| **Protección** | Cloudflare agresivo | Ninguna | Ninguna |
| **Método actual** | Puppeteer + anti-detección máximo | Proxies CORS + Puppeteer (solo capítulos) | Puppeteer simple |
| **Éxito** | ❌ Falla con filtros | ✅ Funciona | ✅ Funciona |
| **Anti-detección** | Máximo pero insuficiente | No necesita | No necesita |

### Arquitectura actual de Ikigai
```
Cliente → API/ikigai/search → Puppeteer → Cloudflare Challenge → ❌ Bloqueado
```

---

## 🔍 ANÁLISIS DE FALLAS EN EL CÓDIGO ACTUAL

### 1. `puppeteer-extra-plugin-stealth` NO se usa
**Archivo:** `api/ikigai/search.js:1-2`
```javascript
import puppeteer from 'puppeteer-core';  // ❌ puppeteer-core NO tiene plugins
import chromium from '@sparticuz/chromium';
```

**Problema:** El paquete `puppeteer-extra-plugin-stealth` está instalado pero **NO se usa**. El código importa `puppeteer-core` en lugar de `puppeteer-extra`.

**Evidencia de instalación:**
```json
"puppeteer-extra": "^3.3.6",
"puppeteer-extra-plugin-stealth": "^2.11.2"
```

### 2. Bloqueo de recursos demasiado agresivo
**Archivo:** `api/ikigai/search.js:194-207`
```javascript
await puppeteerPage.setRequestInterception(true);
puppeteerPage.on('request', (request) => {
  const blockedResources = ['image', 'stylesheet', 'font'];  // ❌ BLOQUEA STYLESHEETS
  // ...
});
```

**Problema:** Bloquear `stylesheet` y `font` puede hacer que Cloudflare detecte que es un bot (la página no se ve completa).

### 3. Espera inicial de 12s en home es insuficiente
**Archivo:** `api/ikigai/search.js:209-223`
```javascript
await puppeteerPage.goto('https://viralikigai.foodib.net/', {
  waitUntil: 'domcontentloaded',  // ❌ 'domcontentloaded' es muy rápido
  timeout: 30000
});
await new Promise(resolve => setTimeout(resolve, 12000));  // ❌ Solo 12s
```

**Problema:** Cloudflare puede necesitar más tiempo para validar la "sesión".

### 4. Timeout de challenge muy corto
**Archivo:** `api/ikigai/search.js:278-280`
```javascript
console.log('[Ikigai Search] Esperando challenge de Cloudflare (35s timeout)...');
const challengeSuccess = await waitForCloudflareChallenge(puppeteerPage, 35000);
```

**Problema:** 35s puede ser insuficiente si la red es lenta o Cloudflare está bajo carga.

### 5. No hay persistencia de cookies entre solicitudes
**Problema:** Cada solicitud crea un navegador nuevo, por lo que Cloudflare siempre ve una "nueva" sesión.

### 6. Detección de Cloudflare incompleta
**Archivo:** `api/ikigai/search.js:16-22`
```javascript
const isCloudflare = title.includes('500') ||
  title.includes('Just a moment') ||
  title.includes('Un momento') ||
  title.includes('Error') ||
  bodyText.includes('Checking your browser') ||
  bodyText.includes('Verifying you are human') ||
  bodyText.includes('Enable JavaScript and cookies to continue');
```

**Problema:** Los logs muestran `hasCloudflareText: false` pero claramente está bloqueado. Cloudflare ha cambiado su texto.

---

## 💡 ESTRATEGIAS DE SOLUCIÓN

### ESTRATEGIA 1: USAR puppeteer-extra-plugin-stealth (RECOMENDADA) ⭐

**Dificultad:** Media
**Probabilidad de éxito:** Alta (~85%)
**Costo:** $0
**Tiempo de implementación:** ~30 minutos

#### Descripción
El plugin `puppeteer-extra-plugin-stealth` ya está instalado en el proyecto. Solo hay que:
1. Cambiar la importación de `puppeteer-core` a `puppeteer-extra`
2. Aplicar el plugin stealth
3. Ajustar el bloqueo de recursos

#### Ventajas
- Ya está instalado (costo $0)
- Especializado en evadir Cloudflare
- Mantiene la arquitectura actual
- Compatible con Vercel

#### Desventajas
- Cloudflare puede seguir bloqueando si es muy agresivo
- Aumenta ligeramente el tiempo de carga

#### Pasos de implementación

**Paso 1: Actualizar imports en `api/ikigai/search.js`**
```javascript
import puppeteer from 'puppeteer-extra';  // ✅ Cambiado de puppeteer-core
import puppeteerPluginStealth from 'puppeteer-extra-plugin-stealth';  // ✅ Nuevo
import chromium from '@sparticuz/chromium';

// Aplicar plugin stealth
puppeteer.use(puppeteerPluginStealth());
```

**Paso 2: Ajustar el lanzamiento del navegador**
```javascript
browser = await puppeteer.launch({
  args: [
    ...chromium.args,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // Remover: '--disable-blink-features=AutomationControlled' (el plugin lo maneja)
    // Remover: '--disable-web-security' (puede causar detección)
    // Mantener args que no interfieren con stealth
  ],
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
  ignoreHTTPSErrors: true,
  defaultViewport: { width: 1920, height: 1080 }
});
```

**Paso 3: Reducir bloqueo de recursos**
```javascript
await puppeteerPage.setRequestInterception(true);
puppeteerPage.on('request', (request) => {
  const url = request.url().toLowerCase();

  // Bloquear SOLAMENTE publicidad y analytics
  if (url.includes('ads') || url.includes('analytics') || url.includes('tracking')) {
    request.abort();
  } else {
    request.continue();  // ✅ Permitir images, stylesheets, fonts
  }
});
```

**Paso 4: Aumentar tiempos de espera**
```javascript
// Esperar más tiempo en home para establecer sesión
await puppeteerPage.goto('https://viralikigai.foodib.net/', {
  waitUntil: 'networkidle2',  // ✅ Esperar a que la red esté inactiva
  timeout: 45000  // ✅ Aumentar a 45s
});

await new Promise(resolve => setTimeout(resolve, 20000));  // ✅ Aumentar a 20s

// Aumentar timeout de challenge
const challengeSuccess = await waitForCloudflareChallenge(puppeteerPage, 60000);  // ✅ 60s
```

**Paso 5: Mejorar detección de Cloudflare**
```javascript
const isCloudflare = title.includes('500') ||
  title.includes('Just a moment') ||
  title.includes('Un momento') ||
  title.includes('Error') ||
  title.includes('Attention Required') ||  // ✅ Nuevo
  bodyText.includes('Checking your browser') ||
  bodyText.includes('Verifying you are human') ||
  bodyText.includes('Enable JavaScript and cookies to continue') ||
  bodyText.includes('Ray ID') ||  // ✅ Nuevo (detecta texto de CF)
  bodyText.includes('Performance & security by Cloudflare');  // ✅ Nuevo
```

---

### ESTRATEGIA 2: COOKIES PERSISTENTES Y SESSION MANAGEMENT

**Dificultad:** Alta
**Probabilidad de éxito:** Media (~60%)
**Costo:** $0
**Tiempo de implementación:** ~2 horas

#### Descripción
Implementar un sistema de persistencia de cookies entre solicitudes para que Cloudflare reconozca la sesión.

#### Ventajas
- Cloudflare ve una "sesión" consistente
- Reduce la probabilidad de bloqueo en solicitudes consecutivas
- No requiere servicios externos

#### Desventajas
- Complejo de implementar en serverless (Vercel)
- Las cookies pueden expirar
- Requiere almacenamiento externo (Redis/database)

#### Pasos de implementación

**Opción A: Almacenamiento en Redis (Requiere Redis instalado)**
```javascript
// En lugar de crear navegador nuevo cada vez:
// 1. Reutilizar la misma instancia si existe
// 2. Guardar cookies en Redis
// 3. Restaurar cookies en cada solicitud

import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getBrowserInstance() {
  const cookies = await redis.get('ikigai-cookies');
  // Crear navegador y aplicar cookies
}

async function saveCookies(browser) {
  const cookies = await page.cookies();
  await redis.set('ikigai-cookies', JSON.stringify(cookies));
}
```

**Opción B: Uso de puppeteer-cluster**
```javascript
import { Cluster } from 'puppeteer-cluster';

const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_BROWSER,
  maxConcurrency: 2,
  puppeteerOptions: {
    executablePath: await chromium.executablePath(),
    headless: true
  }
});

await cluster.task(async ({ page, data }) => {
  // Reutilizar browser instance con cookies
});
```

**Problema:** Vercel no soporta Redis ni procesos persistentes bien. No recomendado para Vercel.

---

### ESTRATEGIA 3: USAR PROXY RESIDENCIAL

**Dificultad:** Alta
**Probabilidad de éxito:** Muy Alta (~95%)
**Costo:** $5-50/mes
**Tiempo de implementación:** ~1 hora

#### Descripción
Usar un proxy residencial (IP real de usuario residencial) en lugar de IP de servidor (Vercel/cloud datacenter).

#### Servicios recomendados:
- **Bright Data (Luminati)** - $500+/mes (caro pero efectivo)
- **Oxylabs** - $99+/mes
- **Smartproxy** - $75+/mes
- **Proxy-Seller** - $5+/mes (más económico)

#### Ventajas
- IP indistinguible de usuario real
- Cloudflare no bloquea IPs residenciales
- Alta tasa de éxito

#### Desventajas
- Costo mensual recurrente
- Requiere configuración adicional
- Posible latencia extra

#### Pasos de implementación

```javascript
browser = await puppeteer.launch({
  args: [
    ...chromium.args,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    `--proxy-server=${process.env.IKIGAI_PROXY_URL}`  // ✅ Configurar proxy
  ],
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
  ignoreHTTPSErrors: true,
  defaultViewport: { width: 1920, height: 1080 }
});
```

Variables de entorno en Vercel:
```
IKIGAI_PROXY_URL=http://username:password@proxy-provider.com:port
```

---

### ESTRATEGIA 4: SCRAPING DIRECTO SIN PUPPETEER

**Dificultad:** Media
**Probabilidad de éxito:** Baja (~20%)
**Costo:** $0
**Tiempo de implementación:** ~1 hora

#### Descripción
Intentar hacer scraping directo usando axios sin navegador, similar a TuManga.

#### Ventajas
- Más rápido
- Menos recursos
- No requiere anti-detección compleja

#### Desventajas
- **Muy baja probabilidad de éxito** con Cloudflare
- Ikigai usa Qwik framework que requiere JavaScript
- Cloudflare siempre detectará requests sin browser

#### Pasos de implementación

```javascript
import axios from 'axios';

// Similar a TuManga - usar proxies CORS
const PROXY_URLS = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://proxy.cors.sh/',
];

async function fetchWithProxy(url) {
  for (const proxy of PROXY_URLS) {
    try {
      const response = await axios.get(`${proxy}${encodeURIComponent(url)}`);
      return response.data;
    } catch (error) {
      continue;
    }
  }
  throw new Error('Todos los proxies fallaron');
}

// Intentar scraping directo
const html = await fetchWithProxy(targetUrl);
// Parsear HTML y extraer datos
```

**Veredicto:** No recomendado. Cloudflare bloqueará inmediatamente.

---

### ESTRATEGIA 5: COMBINACIÓN MÁXIMA (STEAALTH + PROXY + COOKIES)

**Dificultad:** Muy Alta
**Probabilidad de éxito:** Muy Alta (~98%)
**Costo:** $5-50/mes
**Tiempo de implementación:** ~4 horas

#### Descripción
Implementar TODO a la vez:
1. puppeteer-extra-plugin-stealth
2. Proxy residencial
3. Cookies persistentes
4. Mejores timeouts
5. Detección mejorada de Cloudflare

#### Ventajas
- Máxima probabilidad de éxito
- Más robusto ante cambios de Cloudflare

#### Desventajas
- Costo recurrente
- Complejidad alta
- Tiempo de implementación largo

---

### ESTRATEGIA 6: USAR SERVICIO DE SCRAPING EXTERNO (SERILOK)

**Dificultad:** Baja
**Probabilidad de éxito:** Muy Alta (~99%)
**Costo:** $0-50/mes
**Tiempo de implementación:** ~30 minutos

#### Descripción
Usar servicios de scraping especializados que manejan Cloudflare:
- **ScrapingBee** - $49+/mes (gratuito para primeras 1000 requests/mes)
- **ZenRows** - $49+/mes
- **Zyte (ex-Scrapy Cloud)** - $29+/mes
- **Apify** - $49+/mes

Estos servicios:
- Tienen infraestructura anti-detección profesional
- Manejan Cloudflare, captchas, etc.
- Devuelven el HTML limpio
- Ofrecen proxies rotativos

#### Ejemplo con ScrapingBee:

```javascript
import axios from 'axios';

async function scrapeWithScrapingBee(url) {
  const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
    params: {
      api_key: process.env.SCRAPINGBEE_API_KEY,
      url: url,
      render_js: true,  // Renderizar JavaScript
      premium_proxy: true,  // Usar proxy residencial
      country_code: 'us'
    }
  });

  return response.data;
}

// Usar en lugar de Puppeteer
const html = await scrapeWithScrapingBee(targetUrl);
```

#### Ventajas
- Muy alta probabilidad de éxito
- Fácil de implementar
- No requiere mantenimiento complejo

#### Desventajas
- Costo mensual
- Dependencia de terceros
- Límites de requests (tier de pago)

---

## 🏆 RECOMENDACIÓN

### ESTRATEGIA RECOMENDADA: ESTRATEGIA 1 (PUPPETEER-EXTRA-PLUGIN-STEALTH)

**Por qué:**
1. ✅ Ya está instalado (costo $0)
2. ✅ Probabilidad de éxito alta (~85%)
3. ✅ Fácil de implementar (~30 minutos)
4. ✅ No requiere servicios externos
5. ✅ Mantiene arquitectura actual
6. ✅ Compatible con Vercel

**Si falla:**
- Probar ESTRATEGIA 2 (Cookies persistentes) + Estrategia 1
- Como último recurso: ESTRATEGIA 6 (ScrapingBee)

---

## 📝 PLAN DE IMPLEMENTACIÓN DETALLADO (ESTRATEGIA 1)

### FASE 1: ACTUALIZAR IMPORTS
- [ ] Cambiar `puppeteer-core` a `puppeteer-extra`
- [ ] Importar y aplicar `puppeteer-extra-plugin-stealth`

### FASE 2: AJUSTAR CONFIGURACIÓN DEL NAVEGADOR
- [ ] Remover `--disable-blink-features=AutomationControlled`
- [ ] Remover `--disable-web-security`
- [ ] Mantener args compatibles con stealth

### FASE 3: MEJORAR BLOQUEO DE RECURSOS
- [ ] Permitir `image`, `stylesheet`, `font`
- [ ] Bloquear solo publicidad y analytics

### FASE 4: AUMENTAR TIMEOUTS
- [ ] Home: `waitUntil: 'networkidle2'` + timeout 45s
- [ ] Espera post-home: 20s (en lugar de 12s)
- [ ] Challenge: 60s (en lugar de 35s)

### FASE 5: MEJORAR DETECCIÓN DE CLOUDFLARE
- [ ] Agregar detección de 'Attention Required'
- [ ] Agregar detección de 'Ray ID'
- [ ] Agregar detección de 'Performance & security by Cloudflare'

### FASE 6: PROBAR Y VALIDAR
- [ ] Testear búsqueda sin filtros
- [ ] Testear búsqueda con 1 filtro
- [ ] Testear búsqueda con múltiples filtros
- [ ] Testear paginación

### FASE 7: MONITOREO Y AJUSTES
- [ ] Agregar logs más detallados
- [ ] Implementar retry con backoff
- [ ] Agregar métricas de éxito/fallo

---

## 🚨 FALLBACK GRACEFUL

Si después de implementar todas las estrategias sigue fallando:

### Opción A: Mostrar mensaje de error amigable
```javascript
if (!challengeSuccess) {
  return res.status(200).json({
    results: [],
    page,
    hasMore: false,
    error: 'La búsqueda por filtros en Ikigai está temporalmente no disponible. Por favor, usa la búsqueda simple o prueba otra fuente.',
    searchMethod: 'cloudflare-blocked'
  });
}
```

### Opción B: Fallback a búsqueda simple sin filtros
```javascript
if (!challengeSuccess && filters && Object.keys(filters).length > 0) {
  console.log('[Ikigai Search] Filtrando resultados en cliente (fallback)...');
  // Hacer búsqueda simple y filtrar en cliente
  const simpleResults = await searchSimple(query, 1);
  const filteredResults = filterInClient(simpleResults, filters);
  return res.json({ results: filteredResults, ... });
}
```

### Opción C: Deshabilitar búsqueda por filtros temporalmente
```javascript
// En ikigai.js (frontend)
if (hasFilters) {
  showToast('La búsqueda por filtros en Ikigai no está disponible temporalmente');
  return [];
}
```

---

## 📊 COMPARATIVO FINAL

| Estrategia | Éxito | Costo | Tiempo | Complejidad | Recomendada |
|------------|-------|-------|--------|-------------|-------------|
| 1: Stealth plugin | ~85% | $0 | 30min | Media | ✅ SÍ |
| 2: Cookies persistentes | ~60% | $0 | 2h | Alta | ❌ |
| 3: Proxy residencial | ~95% | $5-50/mes | 1h | Media | 💡 Si falla 1 |
| 4: Scraping directo | ~20% | $0 | 1h | Media | ❌ |
| 5: Combinación máxima | ~98% | $5-50/mes | 4h | Muy Alta | 💡 Si falla 1+3 |
| 6: Servicio externo | ~99% | $0-50/mes | 30min | Baja | 💡 Último recurso |

---

## 🎯 ACCIONES INMEDIATAS

1. Implementar **Estrategia 1** (Stealth plugin)
2. Probar exhaustivamente
3. Si falla: Agregar **Estrategia 3** (Proxy)
4. Si aún falla: Considerar **Estrategia 6** (ScrapingBee)

**NO perder tiempo con Estrategias 2, 4 hasta tener confirmación de que 1+3 fallan.**
