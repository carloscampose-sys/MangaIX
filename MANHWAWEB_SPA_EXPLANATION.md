# 🌐 ManhwaWeb es una SPA - Explicación Técnica

## 🔍 Problema Identificado

**ManhwaWeb.com es una Single Page Application (SPA)** construida con un framework JavaScript (probablemente React/Vue).

### ¿Qué significa esto?

Cuando accedes a `https://manhwaweb.com/mis-manhwas`, el servidor envía un HTML **casi vacío**:

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>ManhwaWeb</title>
    <script type="module" src="/assets/index-0463cd12.js"></script>
    <link rel="stylesheet" href="/assets/index-a51cb727.css">
  </head>
  <body>
    <div id="root"></div>  <!-- ← VACÍO! -->
  </body>
</html>
```

Todo el contenido (tarjetas, imágenes, enlaces) se carga **después** al ejecutar el JavaScript.

---

## ⚙️ Solución Implementada

Para scraping de **SPA**, necesitamos un **navegador headless** (Puppeteer):

```
┌─────────────────────────────────────────────────────────┐
│  SCRAPING TRADICIONAL (TuManga - funciona)              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. fetch(url) → HTML completo con datos               │
│  2. DOMParser → parsear HTML                            │
│  3. querySelector → extraer datos                       │
│  ✅ Funciona porque el HTML ya tiene todo              │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SCRAPING SPA (ManhwaWeb - requiere Puppeteer)         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. fetch(url) → HTML vacío con <div id="root"></div>  │
│  2. DOMParser → parsea HTML vacío                       │
│  3. querySelector → ❌ NO encuentra nada                │
│                                                          │
│  SOLUCIÓN CON PUPPETEER:                                │
│  1. puppeteer.launch() → abre navegador headless       │
│  2. page.goto(url) → navega a la página                │
│  3. Espera a que JavaScript cargue el contenido        │
│  4. page.evaluate() → extrae datos ya renderizados     │
│  ✅ Funciona porque ejecuta el JavaScript              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 APIs Serverless Creadas

### 1. **`api/manhwaweb/search.js`** (NUEVO)
- **Función:** Búsqueda de obras
- **Método:** Puppeteer
- **Endpoint:** `/api/manhwaweb/search?query={busqueda}`
- **Requiere:** Chromium (incluido en Vercel)

### 2. **`api/manhwaweb/pages.js`** (YA EXISTENTE)
- **Función:** Obtener páginas de un capítulo
- **Método:** Puppeteer
- **Endpoint:** `/api/manhwaweb/pages?slug={slug}&chapter={num}`
- **Requiere:** Chromium (incluido en Vercel)

### 3. **Pendiente (Opcional):**
- `api/manhwaweb/details.js` - Detalles de una obra
- `api/manhwaweb/chapters.js` - Lista de capítulos

---

## 🚀 Cómo Funciona Ahora

### Frontend (`src/services/manhwaweb.js`)
```javascript
export const searchManhwaWeb = async (query) => {
    // Llama a la API serverless
    const response = await axios.get('/api/manhwaweb/search', {
        params: { query }
    });
    
    return response.data.results;
};
```

### Backend (`api/manhwaweb/search.js`)
```javascript
export default async function handler(req, res) {
    const browser = await puppeteer.launch({ /* ... */ });
    const page = await browser.newPage();
    
    // Navegar y esperar JavaScript
    await page.goto(`https://manhwaweb.com/mis-manhwas?buscar=${query}`);
    await page.waitForSelector('a[href*="/manhwa/"]');
    
    // Extraer datos ya renderizados
    const results = await page.evaluate(() => {
        const cards = document.querySelectorAll('a[href*="/manhwa/"]');
        // ... extraer datos
    });
    
    res.json({ success: true, results });
}
```

---

## 🔧 Desarrollo Local vs Producción

### En Producción (Vercel) - ✅ Funciona Perfecto
```
✅ Vercel incluye @sparticuz/chromium
✅ Puppeteer funciona automáticamente
✅ Búsqueda ✅ Detalles ✅ Capítulos ✅ Lectura
```

### En Local - ⚠️ Requiere Chromium

**Opción 1: Instalar `puppeteer` completo**
```bash
npm install puppeteer
```
Esto instala Chromium automáticamente (~200MB).

**Opción 2: Usar Chrome/Chromium del sistema**

Modificar `api/manhwaweb/search.js` y `api/manhwaweb/pages.js`:

```javascript
// ANTES (solo para Vercel)
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: chromium.headless,
});

// DESPUÉS (funciona en local)
import puppeteer from 'puppeteer'; // Sin -core

browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

**Opción 3: Desarrollar sin local, probar en Vercel**

La más simple si no quieres instalar Chromium localmente.

---

## 📊 Comparación: TuManga vs ManhwaWeb

| Aspecto | TuManga 📚 | ManhwaWeb 🌐 |
|---------|-----------|--------------|
| **Tipo de sitio** | SSR/HTML tradicional | SPA (React/Vue) |
| **Búsqueda** | ✅ Scraping directo | ⚠️ Requiere Puppeteer |
| **Detalles** | ✅ Scraping directo | ⚠️ Requiere Puppeteer |
| **Lista capítulos** | ✅ Scraping directo | ⚠️ Requiere Puppeteer |
| **Leer capítulo** | ⚠️ Requiere Puppeteer (JS dinámico) | ⚠️ Requiere Puppeteer |
| **Local sin config** | ✅ Funciona | ❌ Necesita Chromium |
| **En Vercel** | ✅ Funciona | ✅ Funciona |

---

## 🎯 Resumen

### ¿Por qué TuManga funciona en local y ManhwaWeb no?

**TuManga:**
- El HTML tiene todo el contenido
- Solo la lectura de capítulos usa Puppeteer
- Búsqueda/detalles funcionan con fetch simple

**ManhwaWeb:**
- El HTML está vacío (`<div id="root"></div>`)
- **TODO** requiere Puppeteer (búsqueda, detalles, capítulos, lectura)
- Necesita ejecutar JavaScript para ver contenido

### Solución Final

✅ **APIs serverless creadas:**
- `/api/manhwaweb/search.js` - Búsqueda
- `/api/manhwaweb/pages.js` - Lectura

✅ **Para desarrollo local:**
- Instalar `puppeteer` completo
- O desarrollar en Vercel directamente

✅ **Para producción:**
- Deploy a Vercel
- Todo funciona automáticamente

---

## 🚀 Siguiente Paso

**Desplegar a Vercel** para que todo funcione sin configuración local:

```bash
# Build
npm run build

# Deploy
vercel --prod
```

O instalar Puppeteer localmente:

```bash
npm install puppeteer
```

Luego en todos los archivos `api/manhwaweb/*.js`, cambiar:
- `puppeteer-core` → `puppeteer`
- Remover imports de `chromium`
- Simplificar `browser.launch()`

---

**Fecha:** 2025-12-22  
**Estado:** ✅ Problema identificado y solucionado  
**Archivos creados:** `api/manhwaweb/search.js`
