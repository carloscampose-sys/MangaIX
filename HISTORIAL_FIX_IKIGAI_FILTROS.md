# Historial de Solución - Búsqueda por Filtros en Ikigai

**Fecha:** 2025-12-28
**Problema:** Búsqueda por filtros en Ikigai falla por bloqueo de Cloudflare

---

## 📋 ÍNDICE

1. [Análisis del Problema](#análisis-del-problema)
2. [Comparación con otras fuentes](#comparación-con-otras-fuentes)
3. [Estrategias de Solución](#estrategias-de-solución)
4. [Estrategia 1: puppeteer-extra-plugin-stealth](#estrategia-1-puppeteer-extra-plugin-stealth)
5. [Análisis de alternativas descartadas](#análisis-de-alternativas-descartadas)
6. [Alternativa 3A: Proxy Rotatorio Gratuito](#alternativa-3a-proxy-rotatorio-gratuito)
7. [Implementación Final](#implementación-final)

---

## 🔍 ANÁLISIS DEL PROBLEMA

### Estado Inicial

**Logs de error iniciales:**
```
[Ikigai Search] URL: https://viralikigai.foodib.net/series/
[Ikigai Search] ❌ Timeout esperando contenido: Waiting failed: 21000ms exceeded
[Ikigai Search] Estado de la página: {
  "title": "Just a moment...",
  "bodyLength": 229,
  "seriesLinksCount": 0,
  "hasCloudflareText": false
}
```

**Causa raíz:** Cloudflare Challenge bloquea las solicitudes antes de que nuestro código se ejecute.

### Diagnóstico

| Problema | Explicación |
|-----------|-------------|
| **IP de Vercel** | Vercel usa IPs de datacenter (AWS) que Cloudflare detecta inmediatamente como bots |
| **Anti-detección insuficiente** | El código usaba `puppeteer-core` en lugar de `puppeteer-extra` |
| **Plugin stealth no usado** | `puppeteer-extra-plugin-stealth` estaba instalado pero NO se importaba |
| **Timeouts cortos** | Home: 12s, Challenge: 35s (insuficientes para Cloudflare agresivo) |
| **Detección CF incompleta** | No detectaba todos los patrones de challenge |

---

## 📊 COMPARACIÓN CON OTRAS FUENTES

### TuManga (TuMangaOnline)

**Estado:** ✅ Funciona perfectamente

**Arquitectura:**
```
Cliente → Proxies CORS → TuManga
```

**Características:**
- ✅ Sin Cloudflare (o muy laxo)
- ✅ Proxies CORS rotatorios (4 servicios)
- ✅ Scraping directo con Axios
- ✅ No requiere Puppeteer para búsqueda/detalles
- ✅ Solo usa Puppeteer para páginas de capítulos

**Filtros disponibles:**
- 47 géneros con IDs numéricos
- Búsqueda por texto
- Ordenamiento (title, year, date)
- Paginación

### ManhwaWeb

**Estado:** ✅ Funciona perfectamente

**Arquitectura:**
```
Cliente → API/ManhwaWeb → Puppeteer → ManhwaWeb
```

**Características:**
- ✅ Sin Cloudflare
- ✅ SPA (Single Page Application) requiere JS
- ✅ Anti-detección simple (sin stealth plugin)
- ✅ Puppeteer serverless en Vercel

**Filtros disponibles:**
- 27 géneros
- Tipo (Manhwa, Manga, etc.)
- Estado (En curso, Pausado, Finalizado)
- Demografía (Seinen, Shonen, etc.)
- Ordenamiento (Alfabético, Creación, etc.)

### Ikigai

**Estado:** ❌ Búsqueda con filtros falla

**Arquitectura:**
```
Cliente → API/Ikigai → Puppeteer → Cloudflare Challenge → ❌ BLOCKED
```

**Problema:**
- ❌ Cloudflare agresivo con JavaScript Challenge
- ❌ IP de datacenter detectada por CF
- ❌ Anti-detección máxima insuficiente

**Filtros disponibles:**
- 50+ géneros
- Tipos (Comic, Novela)
- Estados (Abandonada, Cancelada, Completa, En Curso, Hiatus)
- Ordenamiento (Nombre, Creado en, Actualización, Favoritos, Valoración, Vistas)

---

## 💡 ESTRATEGIAS DE SOLUCIÓN

### Estrategia 1: puppeteer-extra-plugin-stealth ⭐

**Descripción:** Usar el plugin stealth ya instalado pero no implementado

**Cambios:**
```javascript
// Antes
import puppeteer from 'puppeteer-core';

// Ahora
import puppeteer from 'puppeteer-extra';
import puppeteerPluginStealth from 'puppeteer-extra-plugin-stealth';
puppeteer.use(puppeteerPluginStealth());
```

**Configuración adicional:**
- Remover `--disable-blink-features=AutomationControlled` (plugin lo maneja)
- Remover `--disable-web-security`
- Permitir images, stylesheets, fonts (antes se bloqueaban)
- Aumentar timeouts: Home 45s, Post-home 20s, Challenge 60s
- Mejorar detección de Cloudflare con más patrones

**Resultado:** ❌ Falló por error de dependencias en Vercel
```
Error: Cannot find module 'puppeteer-extra-plugin-stealth/evasions/chrome.app'
```

**Causa:** El plugin tiene dependencias faltantes en Vercel serverless.

---

### Estrategia 2: Cookies Persistentes

**Descripción:** Guardar cookies de Cloudflare entre solicitudes para reutilizar sesión

**Problemas con Vercel:**
1. **Serverless** = No filesystem persistente
2. **Container nuevo** cada request = Cookies se pierden
3. **IP siempre datacenter** = Cloudflare detecta igual
4. **Cookies expiran** = 10-30 minutos máximo
5. **Challenge cambia** cada request

**Conclusión:** Imposible en Vercel.

---

### Estrategia 3: Proxy Residencial

**Descripción:** Usar proxy con IP residencial (real) en lugar de IP de datacenter

**Proveedores:**
- **Smartproxy** - $75/mes (100 proxies)
- **Oxylabs** - $99/mes
- **Proxy-Seller** - $5-15/mes (1 proxy)
- **Bright Data** - $500+/mes (caro)

**Implementación:**
```javascript
browser = await puppeteer.launch({
  args: [
    ...chromium.args,
    `--proxy-server=${process.env.IKIGAI_PROXY_URL}`
  ]
});
```

**Costo:** $5-50/mes
**Probabilidad éxito:** ~95%

---

### Estrategia 4: Scraping Directo

**Descripción:** Hacer scraping con Axios sin navegador

**Problemas:**
- Cloudflare requiere ejecutar JavaScript Challenge
- Ikigai usa Qwik framework (SSR + hidratación)
- Sin JS el contenido está vacío
- TLS fingerprint de Node.js diferente a browser real

**Conclusión:** Imposible.

---

### Estrategia 5: VPS Propia

**Descripción:** Comprar VPS barata y mover backend de scraping

**Arquitectura:**
```
Usuario → Vercel (solo frontend) → Tu VPS → Puppeteer → Ikigai
                                          ↓
                                     Resultados
```

**Proveedores VPS:**
- **Hetzner** - $4.50/mes (IP en India)
- **DigitalOcean** - $4/mes (IP en NYC)
- **Linode** - $5/mes

**Costo:** $5-20/mes
**Probabilidad éxito:** ~85%
**Implementación:** Muy alta (2-3 horas)

---

### Estrategia 6: Servicios Externos (ScrapingBee, ZenRows)

**ScrapingBee:**
| Plan | Créditos | Precio | Duración (100 users) |
|------|-----------|---------|----------------------|
| Free | 1,000 | $49 | 6.6 días |
| Growth | 10,000 | $99 | 13 días |
| Scale | 100,000 | $399 | ~4 meses |

**ZenRows:**
| Plan | Requests | Precio |
|------|-----------|---------|
| Free | 50/mes | $0 |
| Starter | 500/mes | $49/mes |

**Implementación:**
```javascript
import axios from 'axios';

const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
  params: {
    api_key: process.env.SCRAPINGBEE_KEY,
    url: 'https://viralikigai.foodib.net/series/',
    render_js: true,
    country_code: 'us'
  }
});

const html = response.data;
// Parsear HTML...
```

**Costo:** $0-99/mes
**Probabilidad éxito:** ~95%

---

## ❌ ANÁLISIS DE ALTERNATIVAS DESCARTADAS

### Por qué Cookies Persistentes NO funcionarán

| Razón | Explicación |
|--------|-------------|
| **Vercel serverless** | Cada request es un container NUEVO. No hay persistencia. |
| **IP datacenter** | La IP siempre será de AWS datacenter. CF la marca inmediatamente. |
| **Challenge cambia** | Cloudflare genera un challenge DIFERENTE en cada navegación. |
| **Cookies expiran** | 10-30 minutos máximo antes de requerir nuevo challenge. |
| **TLS fingerprint** | Cloudflare detecta a nivel de red antes de ver cookies. |

**Veredicto:** 0% de éxito en Vercel.

---

### Por qué Scraping Directo NO funcionará

| Razón | Explicación |
|--------|-------------|
| **JavaScript Challenge** | Cloudflare requiere ejecutar código JS. Axios no puede ejecutarlo. |
| **Qwik Framework** | Ikigai usa Qwik que requiere JS para hidratación. Sin JS = contenido vacío. |
| **TLS fingerprinting** | Node.js tiene fingerprint TLS distinto a Chrome real. Cloudflare lo detecta. |
| **Challenge page** | Siempre devuelve "Just a moment..." sin contenido real. |

**Veredicto:** 0% de éxito.

---

## 🔄 ALTERNATIVA 3A: PROXY ROTATORIO GRATUITO

### Concepto

Usar User-Agents rotatorios para parecer diferentes usuarios en cada request.

**NOTA IMPORTANTE:** Esta estrategia NO usa proxies externos porque no hay proxies gratuitos que funcionen con Cloudflare. La rotación es SOLO de User-Agents.

### Implementación

#### 1. Archivo de configuración: `api/ikigai/proxyConfig.js`

```javascript
/**
 * Lista de User-Agents adicionales para rotar
 */
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/116.0.0.0'
];

/**
 * Obtiene un User-Agent rotatorio basado en seed
 */
export function getRotatingUserAgent(seed) {
  return USER_AGENTS[seed % USER_AGENTS.length];
}
```

#### 2. Sistema de reintentos en `api/ikigai/search.js`

**Características:**
- Máximo 3 reintentos
- User-Agent diferente en cada intento
- 2 segundos de espera entre reintentos
- Mensaje de error claro si fallan todos los intentos

```javascript
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  // User-Agent rotatorio basado en página + intento
  const selectedUA = getRotatingUserAgent(page + attempt);

  browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      `--user-agent=${selectedUA}`
    ],
    // ...
  });

  const result = await attemptScraping(query, filters, page, attempt);
  await browser.close();

  if (result.success) {
    return res.status(200).json({ results: result.results, ... });
  } else if (result.blockedByCloudflare) {
    // Reintentar con User-Agent diferente
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    // Último intento: retornar error
    return res.status(500).json({ error: 'Error tras 3 intentos' });
  }
}
```

#### 3. Archivos modificados

| Archivo | Cambios |
|---------|----------|
| **api/ikigai/proxyConfig.js** | Nuevo archivo con UAs rotatorios |
| **api/ikigai/search.js** | Loop de 3 reintentos, UA rotatorio |
| **api/ikigai/chapters.js** | UA rotatorio por página |
| **api/ikigai/details.js** | UA rotatorio por timestamp |
| **api/ikigai/pages.js** | UA rotatorio por timestamp |

### Probabilidad de éxito esperada

| Escenario | Éxito |
|-----------|--------|
| Mejor caso | ~30-40% |
| Caso promedio | ~15-25% |
| Peor caso | ~5-10% |

**Causa de baja probabilidad:**
- IP sigue siendo de datacenter (Vercel)
- Solo cambia User-Agent, no IP real
- Cloudflare detecta IP datacenter antes de ver UA

---

## 🎯 RECOMENDACIONES FINALES

### Para producción (usuarios reales)

| Opción | Costo | Éxito | Implementación | Recomendado |
|--------|---------|---------|--------------|--------------|
| **VPS Propia + Proxy Residencial** | $10-35/mes | ~95% | Alta | ✅✅✅ |
| **ScrapingBee Growth** | $99/mes | ~95% | Baja | ✅✅ |
| **ZenRows Starter** | $49/mes | ~90% | Baja | ⚠️ |

### Para pruebas/prototipado

| Opción | Costo | Éxito | Implementación | Recomendado |
|--------|---------|---------|--------------|--------------|
| **TryCloudflare Free** | $0 (50 req) | ~90% | Baja | ⚠️ |
| **ScrapingBee Free** | $0 (1000 req) | ~95% | Baja | ✅ |
| **ZenRows Free** | $0 (50 req) | ~90% | Baja | ⚠️ |

### Solución temporal (mientras se implementa solución definitiva)

```javascript
// En el frontend (ikigai.js)
export async function searchIkigai(query, filters, page) {
  if (filters && Object.keys(filters).length > 0) {
    // Mostrar advertencia
    showToast('La búsqueda por filtros en Ikigai está temporalmente no disponible. Usando búsqueda simple.', 'warning');

    // Solo usar query, ignorar filtros
    return searchIkigaiSimple(query, page);
  }

  return searchIkigaiFull(query, filters, page);
}
```

---

## 📚 ARCHIVOS CREADOS/MODIFICADOS

### Nuevos archivos
- `api/ikigai/proxyConfig.js` - Configuración de User-Agents rotatorios

### Archivos modificados
- `api/ikigai/search.js` - Sistema de reintentos completo
- `api/ikigai/chapters.js` - UA rotatorio
- `api/ikigai/details.js` - UA rotatorio
- `api/ikigai/pages.js` - UA rotatorio

### Archivos de documentación
- `PLAN_SOLUCION_IKIGAI_FILTROS.md` - Plan detallado de estrategias
- `HISTORIAL_FIX_IKIGAI_FILTROS.md` - Este archivo

---

## 📓 APRENDIZAJES

1. **Cloudflare es muy agresivo** - Las técnicas estándar de anti-detección no son suficientes
2. **IP de datacenter = Bloqueo** - Vercel usa IPs AWS que CF detecta inmediatamente
3. **Plugins stealth no funcionan** - Tienen dependencias faltantes en Vercel serverless
4. **Cookies persistentes no son viables** - Imposible sin filesystem persistente
5. **Scraping directo no es opción** - Cloudflare requiere JavaScript
6. **Proxies gratuitos no existen** - Los pocos que hay ya están bloqueados por CF
7. **Soluciones efectivas cuestan $** - VPS propia ($10-35/mes) o servicio externo ($49-99/mes)
8. **User-Agent rotatorio tiene baja probabilidad** - Solo cambia fingerprint, no IP

---

## 🔄 RUTA DE ESCAPE (Siguientes pasos si 3A falla)

1. **Prueba 3A** (implementada) → Si falla:
2. **Prueba TryCloudflare Free** → Si funciona:
   - Usar para prototipado
   - Evaluar si el crecimiento justifica ScrapingBee Growth ($99/mes)
3. **Si falla todo** → Opciones:
   - **Opción A:** Comprar VPS barata ($5-20/mes) + implementar backend propio
   - **Opción B:** Implementar cache inteligente con Vercel KV + VPS (solo para Ikigai)
   - **Opción C:** Migrar backend de Ikigai a servicio externo (ScrapingBee)
   - **Opción D:** Desactivar búsqueda por filtros en Ikigai temporalmente y usar solo TuManga/ManhwaWeb

---

## ✅ ESTADO ACTUAL

**Estrategia 3A implementada:** ✅ COMPLETO
**Probabilidad de éxito estimada:** ~30-40%
**Costo:** $0
**Siguiente paso:** Probar y evaluar resultados

---

**Fin del historial - 2025-12-28**

---

## 🟢 ESTADO ACTUAL - 2025-12-28

### Última Implementación: Estrategia 3A (Proxy Rotatorio Gratuito)

**Archivos creados/modificados:**
1. ✅ `api/ikigai/proxyConfig.js` - Configuración con 12 User-Agents rotatorios
2. ✅ `api/ikigai/search.js` - Sistema de reintentos completo
   - Loop de 3 intentos máximo
   - User-Agent diferente en cada intento (page + attempt)
   - Espera de 2 segundos entre reintentos
   - Mensaje de error claro cuando fallan los 3 intentos
   - Bloque `finally` para asegurar que el browser siempre se cierre

3. ✅ `api/ikigai/chapters.js` - User-Agent rotatorio por página
4. ✅ `api/ikigai/details.js` - User-Agent rotatorio por timestamp
5. ✅ `api/ikigai/pages.js` - User-Agent rotatorio por timestamp

**Cambios técnicos realizados:**
- Variable `browser` ahora se declara fuera del loop (`let browser = null`) con valor inicial
- Se pasa como parámetro a `attemptScraping(browser, query, filters, page, attempt)`
- Se agrega bloque `finally` para cierre garantizado del browser
- Se mejora detección de errores cuando fallan los 3 intentos

**Características implementadas:**
- ✅ 12 User-Agents rotatorios (Chrome/Firefox/Edge en Windows/Mac/Linux)
- ✅ Máximo 3 reintentos
- ✅ 2 segundos de espera entre reintentos
- ✅ Mensajes de error claros

**Limitación conocida:**
- ⚠️ NO usa proxies externos (no hay proxies gratuitos funcionales para Cloudflare)
- ⚠️ Solo rota User-Agents (la IP sigue siendo de Vercel datacenter)
- ⚠️ Probabilidad de éxito estimada: ~30-40%

---

## 📊 RESULTADOS ESPERADOS

| Escenario | Probabilidad Éxito | Notas |
|-----------|----------------|--------|
| Mejor caso | ~30-40% | Diferentes fingerprints, misma IP datacenter |
| Caso promedio | ~15-25% | Menos fingerprinting repetitivo |
| Peor caso | ~5-10% | Cloudflare aprende patrones |

**Próximo paso:**
- Probar la búsqueda con filtros
- Si Cloudflare sigue bloqueando después de 3 intentos:
  - Considerar **TryCloudflare Free** (50 req gratis)
  - Considerar **ScrapingBee Free** (1000 req gratis)
  - Evaluar si el crecimiento justifica ScrapingBee Growth ($99/mes)

---

## 📋 ARCHIVOS FINALES

**Archivos de código:**
```
api/ikigai/
├── proxyConfig.js       (nuevo)
├── search.js            (modificado - reintentos completos)
├── chapters.js          (modificado - UA rotatorio)
├── details.js           (modificado - UA rotatorio)
└── pages.js             (modificado - UA rotatorio)
```

**Archivos de documentación:**
```
PLAN_FIX_IKIGAI_FILTROS.md      (plan detallado de estrategias)
HISTORIAL_FIX_IKIGAI_FILTROS.md  (este archivo)
```

---