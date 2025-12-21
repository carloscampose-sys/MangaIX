# Plan: Backend para Cargar Imágenes de TuManga

## Problema Actual
TuManga usa ofuscación dinámica - la clave de decodificación (`kpk`) se inyecta en el DOM mediante JavaScript. El scraping desde el cliente (browser) a través de proxies CORS no ejecuta JavaScript, por lo que no podemos obtener las imágenes.

## Solución Propuesta
Crear una **API serverless** que use un navegador headless para:
1. Cargar la página del capítulo
2. Esperar a que JavaScript se ejecute
3. Extraer las URLs de las imágenes decodificadas
4. Retornarlas al frontend

---

## Opción Recomendada: Cloudflare Workers (GRATIS)

### ¿Por qué Cloudflare Workers?
| Característica | Vercel Free | Cloudflare Workers |
|----------------|-------------|-------------------|
| Timeout | 10 segundos | 30+ segundos |
| Browser API | Requiere config compleja | Nativo |
| Costo | Gratis (limitado) | Gratis |
| Cold start | ~4 segundos | Más rápido |

### Arquitectura
```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Cloudflare Worker   │────▶│  TuManga    │
│  (Vercel)   │◀────│  (Browser Rendering) │◀────│   .org      │
└─────────────┘     └──────────────────────┘     └─────────────┘
```

---

## Pasos de Implementación

### Fase 1: Configurar Cloudflare Workers (30 min)

1. **Crear cuenta en Cloudflare** (si no tienes)
   - https://dash.cloudflare.com/sign-up

2. **Instalar Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Crear proyecto del Worker**
   ```bash
   mkdir tumanga-api
   cd tumanga-api
   wrangler init
   ```

### Fase 2: Crear el Worker con Browser Rendering (1 hora)

**Archivo: `src/index.js`**
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Endpoint: /api/pages?slug=one-punch-man&chapter=163
    if (url.pathname === '/api/pages') {
      const slug = url.searchParams.get('slug');
      const chapter = url.searchParams.get('chapter');

      if (!slug || !chapter) {
        return new Response(JSON.stringify({ error: 'Missing slug or chapter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const pages = await getChapterPages(env, slug, chapter);
        return new Response(JSON.stringify({ pages }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('TuManga API - Use /api/pages?slug=xxx&chapter=xxx', {
      headers: corsHeaders
    });
  }
};

async function getChapterPages(env, slug, chapter) {
  const browser = await env.BROWSER.fetch('https://tumanga.org/leer/' + slug + '-' + chapter, {
    cf: {
      cacheEverything: true,
      cacheTtl: 3600
    }
  });

  // Usar Puppeteer via Browser Rendering API
  const puppeteer = await import('@cloudflare/puppeteer');
  const browserInstance = await puppeteer.launch(env.BROWSER);
  const page = await browserInstance.newPage();

  await page.goto(`https://tumanga.org/leer/${slug}-${chapter}`, {
    waitUntil: 'networkidle0',
    timeout: 20000
  });

  // Esperar a que las imágenes se carguen
  await page.waitForSelector('#lector img', { timeout: 10000 });

  // Extraer URLs de imágenes
  const imageUrls = await page.evaluate(() => {
    const images = document.querySelectorAll('#lector img');
    return Array.from(images).map(img => img.src || img.dataset.src);
  });

  await browserInstance.close();

  return imageUrls.filter(url => url && url.includes('tumanga'));
}
```

**Archivo: `wrangler.toml`**
```toml
name = "tumanga-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[browser]
binding = "BROWSER"
```

### Fase 3: Desplegar el Worker (5 min)

```bash
wrangler deploy
```

Obtendrás una URL como: `https://tumanga-api.tu-usuario.workers.dev`

### Fase 4: Actualizar el Frontend (30 min)

Modificar `src/services/tumanga.js`:

```javascript
// Nueva constante para la API
const WORKER_API = 'https://tumanga-api.tu-usuario.workers.dev';

/**
 * Obtiene las imágenes de un capítulo usando el Worker de Cloudflare
 */
export const getTuMangaPages = async (slug, chapter) => {
  try {
    console.log(`Fetching chapter ${chapter} from Worker API...`);

    const response = await fetch(
      `${WORKER_API}/api/pages?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(chapter)}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.pages && data.pages.length > 0) {
      console.log(`Found ${data.pages.length} pages`);
      return data.pages;
    }

    return [];
  } catch (error) {
    console.error('Error fetching from Worker:', error);
    return [];
  }
};
```

---

## Alternativa: Vercel con Puppeteer (Más Limitado)

Si prefieres mantener todo en Vercel, puedes intentar con Puppeteer, pero ten en cuenta el límite de 10 segundos.

### Estructura del proyecto
```
potaxie-web/
├── api/
│   └── tumanga/
│       └── pages.js     ← Serverless function
├── src/
│   └── ...
└── vercel.json
```

**Archivo: `api/tumanga/pages.js`**
```javascript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug, chapter } = req.query;

  if (!slug || !chapter) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(`https://tumanga.org/leer/${slug}-${chapter}`, {
      waitUntil: 'domcontentloaded',
      timeout: 8000  // 8 segundos para dejar margen
    });

    // Extraer imágenes rápidamente
    const pages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('#lector img');
      return Array.from(imgs).map(img => img.src || img.dataset.src);
    });

    return res.status(200).json({ pages: pages.filter(Boolean) });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
}
```

**Archivo: `vercel.json`**
```json
{
  "functions": {
    "api/tumanga/pages.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**Dependencias necesarias:**
```bash
npm install puppeteer-core @sparticuz/chromium
```

---

## Comparativa Final

| Aspecto | Cloudflare Workers | Vercel + Puppeteer |
|---------|-------------------|-------------------|
| Costo | Gratis | Gratis |
| Timeout | 30+ seg | 10 seg |
| Confiabilidad | Alta | Media (puede timeout) |
| Complejidad setup | Media | Media |
| Mantenimiento | Bajo | Bajo |
| **Recomendación** | **✓ PREFERIDO** | Alternativa |

---

## Pasos Siguientes

1. [ ] Crear cuenta Cloudflare (si no tienes)
2. [ ] Instalar Wrangler CLI
3. [ ] Crear el Worker con el código proporcionado
4. [ ] Desplegar: `wrangler deploy`
5. [ ] Actualizar `tumanga.js` con la URL del Worker
6. [ ] Probar en desarrollo local
7. [ ] Hacer deploy a Vercel

---

## Notas Importantes

1. **Caché**: El Worker puede cachear resultados por capítulo para reducir llamadas
2. **Rate Limiting**: Considera añadir rate limiting para evitar abusos
3. **Fallback**: Mantén el fallback de abrir en nueva pestaña
4. **Monitoreo**: Cloudflare tiene dashboard gratuito para ver métricas
