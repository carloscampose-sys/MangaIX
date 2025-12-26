# Plan de Implementación: Integración de Ikigai Mangas

**Proyecto:** MangaIX
**Nueva Fuente:** Ikigai Mangas (https://viralikigai.eurofiyati.online/series/)
**Fecha:** 2025-12-25
**Objetivo:** Agregar Ikigai Mangas como tercera fuente de scraping junto a TuManga y ManhwaWeb

---

## 📋 Tabla de Contenidos

1. [Resumen de la Arquitectura Actual](#resumen-arquitectura)
2. [Análisis de Ikigai Mangas](#analisis-ikigai)
3. [Plan de Implementación](#plan-implementacion)
4. [Detalles Técnicos Críticos](#detalles-tecnicos)
5. [Testing y Validación](#testing)
6. [Archivos a Crear/Modificar](#archivos)
7. [Consideraciones Importantes](#consideraciones)
8. [Resultado Final Esperado](#resultado-final)

---

<a name="resumen-arquitectura"></a>
## 📋 RESUMEN DE LA ARQUITECTURA ACTUAL

### Estructura de Servicios Existentes

#### Archivos de Servicio
- **`tumanga.js`** (813 líneas)
  - Scraping client-side con CORS proxies
  - Fallback a API serverless con Puppeteer
  - XOR decoding para imágenes encriptadas
  - 47 géneros con IDs numéricos (1-47)
  - 5 moods predefinidos

- **`manhwaweb.js`** (356 líneas)
  - Scraping 100% vía API serverless con Puppeteer (obligatorio)
  - Manejo de SPA con infinite scroll
  - Botón "Ver todo" para expandir capítulos
  - 37 géneros con IDs string → valores numéricos
  - 6 moods predefinidos
  - Bloqueado en localhost (requiere Vercel)

- **`unified.js`** (162 líneas)
  - Capa de abstracción que unifica todos los servicios
  - Pattern Facade/Adapter
  - Funciones: `unifiedSearch`, `unifiedGetDetails`, `unifiedGetChapters`, `unifiedGetPages`, `unifiedGetRandom`

- **`filterService.js`** (153 líneas)
  - Manejo centralizado de filtros por fuente
  - `getFiltersForSource(source)` retorna configuración específica
  - Validación de filtros por fuente

#### API Routes Serverless (Vercel)
- **TuManga:**
  - `api/tumanga/pages.js` - Extracción de imágenes con Puppeteer

- **ManhwaWeb:**
  - `api/manhwaweb/search.js` (370 líneas) - Búsqueda con infinite scroll
  - `api/manhwaweb/chapters.js` (367 líneas) - Capítulos con botón "Ver todo"
  - `api/manhwaweb/details.js` - Detalles de obra
  - `api/manhwaweb/pages.js` - Imágenes de capítulos

#### Componentes UI
- **`App.jsx`** (1000+ líneas)
  - Selector de fuentes (TuManga ↔ ManhwaWeb)
  - Sistema de filtros dinámico por fuente
  - Panel expandible de filtros
  - Grid de resultados con paginación
  - Lazy loading de descripciones

- **`Oracle.jsx`** (350 líneas)
  - Sistema de recomendación aleatoria
  - Selector de fuente
  - Moods dinámicos por fuente
  - Grid de géneros (primeros 16)
  - Animación de confetti

### Flujo de Datos
```
┌─────────────┐
│  App.jsx    │ → Usuario selecciona fuente y aplica filtros
└──────┬──────┘
       ↓
┌─────────────┐
│ unified.js  │ → Detecta fuente y delega a servicio específico
└──────┬──────┘
       ↓
┌─────────────┐
│ tumanga.js  │ → CORS proxies (client) + API fallback
│ manhwaweb.js│ → API serverless obligatorio
│ ikigai.js   │ → [NUEVO] API serverless obligatorio
└──────┬──────┘
       ↓
┌─────────────┐
│ API Routes  │ → Puppeteer scraping en Vercel serverless
└─────────────┘
```

---

<a name="analisis-ikigai"></a>
## 🔍 ANÁLISIS DE IKIGAI MANGAS

### Características de la Página

#### URL Base
```
https://viralikigai.eurofiyati.online/series/
```

#### Ejemplo de Obra
**"La basura de la familia del conde"**
- URL base: `https://viralikigai.eurofiyati.online/series/la-basura-de-la-familia-del-conde/`
- Total de capítulos: 172
- Distribuidos en 8 páginas de paginación interna

#### Paginación de Capítulos (Crítico)
```
Página 1: https://.../ → Capítulos 172-149 (24 caps)
Página 2: https://.../?pagina=2 → Capítulos 148-125 (24 caps)
Página 3: https://.../?pagina=3 → Capítulos 124-101 (24 caps)
...
Página 8: https://.../?pagina=8 → Capítulos 4-1 (4 caps)
```

**Nota:** La página de inicio muestra los capítulos MÁS RECIENTES primero.

### Sistema de Filtros

#### 1. Por Tipos (Deseleccionado por defecto)
```
Comic  → ?tipos[]=comic
Novela → ?tipos[]=novel

Múltiple → ?tipos[]=novel&tipos[]=comic
```

#### 2. Por Estados
```javascript
{
  "Abandonada": "906428048651190273",
  "Cancelada": "906426661911756802",
  "Completa": "906409532796731395",
  "En Curso": "911437469204086787",
  "Hiatus": "906409397258190851"
}

// Ejemplo múltiple
?estados[]=906409532796731395&estados[]=911437469204086787
```

#### 3. Por Géneros (50+ géneros)
```javascript
{
  "+18": "906409351272792067",
  "Acción": "906397904327999491",
  "Adulto": "906409527934582787",
  "Apocalíptico": "906409378635186179",
  "Artes Marciales": "906397904169861123",
  "Aventura": "906397904061530115",
  "Bender": "1093357252096753667",
  "Boys Love": "906409351330037763",
  "Ciencia Ficción": "906409468787720195",
  "Comedia": "906398112851165187",
  "Demonios": "906397904115531779",
  "Deporte": "906410143226462211",
  "Drama": "906397903933407235",
  "Ecchi": "906409370648543235",
  "Familia": "906409382485884931",
  "Fantasía": "906397894348570627",
  "Girls Love": "906409644012961795",
  "Gore": "906409472386203651",
  "Harem": "906397904221962243",
  "Harem Inverso": "906424352006438914",
  "Histórico": "906398112923385859",
  "Horror": "906423434084679682",
  "Isekai": "906409454067646467",
  "Josei": "906409501957390339",
  "Maduro": "906409612041551875",
  "Magia": "906409459593347075",
  "Mecha": "906409472453410819",
  "Militar": "906409472453410819",
  "Misterio": "906409374254727171",
  "Psicológico": "906409351382073347",
  "Realidad Virtual": "906424676182294530",
  "Recuentos de la vida": "906409508165124099",
  "Reencarnación": "906409400553046019",
  "Regresión": "906397894469255171",
  "Romance": "906397894527549443",
  "Seinen": "906397903999959043",
  "Shonen": "906398112991150083",
  "Shoujo": "906397894408372227",
  "Sistema": "906409408107216899",
  "Smut": "906409419999641603",
  "Supernatural": "906410027513937923",
  "Supervivencia": "906409454130921475",
  "Tragedia": "906409449984655363",
  "Transmigración": "906409378688663555",
  "Vida Escolar": "906409508232822787",
  "Yaoi": "906409432216403971",
  "Yuri": "906409472567017475"
}

// Ejemplo múltiple
?generos[]=906397904169861123&generos[]=906409527934582787
```

#### 4. Ordenar Por
```javascript
{
  "Nombre": "name",
  "Creado en": "created_at",
  "Actualización más reciente": "last_chapter_date",
  "Número de favoritos": "bookmark_count",
  "Número de valoración": "rating_count",
  "Número de vistas": "view_count"
}

// Ejemplo
?generos[]=906409351272792067&ordenar=name
```

#### 5. Paginación de Resultados
```
Página 1: ?pagina=1
Página 2: ?pagina=2
...
Página 19: ?pagina=19
```

### Características Especiales

#### Sinopsis con "Ver más"
- Algunas obras tienen sinopsis larga con botón "Ver más"
- El botón expande el texto completo
- Debe ser manejado en el scraping para capturar la sinopsis completa

#### Múltiples Páginas de Capítulos
- Obras con muchos capítulos (100+) tienen paginación interna
- Se debe iterar todas las páginas para obtener la lista completa
- Solo cambia el parámetro `?pagina=N` en la URL

---

<a name="plan-implementacion"></a>
## 🎯 PLAN DE IMPLEMENTACIÓN

### FASE 1: Análisis y Mapeo de Estructura

#### 1.1 Analizar la página de Ikigai Mangas
**Objetivo:** Identificar selectores CSS para scraping

**Elementos a identificar:**
- ✅ Selectores CSS para resultados de búsqueda
- ✅ Estructura de las portadas (URLs de imágenes)
- ✅ Selectores para título de obra
- ✅ Selectores para sinopsis (con botón "Ver más")
- ✅ Selectores para capítulos en lista
- ✅ Selectores para paginación de capítulos
- ✅ Selectores para imágenes dentro de capítulos
- ✅ Estructura de botones de navegación entre páginas

**Herramientas:**
- Puppeteer para inspección
- DevTools de Chrome

#### 1.2 Definir estructura de datos

**Resultado de búsqueda:**
```javascript
{
  id: "ikigai-{slug}-{timestamp}",
  slug: "la-basura-de-la-familia-del-conde",
  title: "La basura de la familia del Conde",
  cover: "https://...",
  source: "ikigai",
  description: "..." // Se carga después (lazy loading)
}
```

**Capítulo:**
```javascript
{
  id: "ikigai-{slug}-ch-{num}-{timestamp}",
  slug: "la-basura-de-la-familia-del-conde",
  chapter: "172",
  title: "Capítulo 172",
  url: "https://viralikigai.eurofiyati.online/...",
  source: "ikigai"
}
```

**Detalles de obra:**
```javascript
{
  title: "La basura de la familia del Conde",
  slug: "la-basura-de-la-familia-del-conde",
  cover: "https://...",
  synopsis: "Sinopsis completa...",
  author: "Autor",
  status: "En Curso",
  genres: ["Acción", "Fantasía", "Drama"],
  source: "ikigai"
}
```

---

### FASE 2: Crear Servicio Ikigai

#### 2.1 Crear `src/services/ikigai.js`

**Ubicación:** `C:\Users\Isma\Documents\Proyectos Perosnakes\MangaIX\src\services\ikigai.js`

**Tamaño estimado:** ~400-500 líneas

**Funciones principales:**

```javascript
// 1. Búsqueda con filtros
async function searchIkigai(query = '', filters = {}, page = 1)
// Delega a /api/ikigai/search
// Retorna: array de resultados

// 2. Obtener detalles de una obra
async function getIkigaiDetails(slug)
// Delega a /api/ikigai/details
// Retorna: objeto con detalles completos (incluyendo sinopsis expandida)

// 3. Obtener lista de capítulos (con paginación interna)
async function getIkigaiChapters(slug)
// Delega a /api/ikigai/chapters
// IMPORTANTE: Itera todas las páginas de capítulos automáticamente
// Retorna: array completo de capítulos ordenado (descendente: 172→1)

// 4. Obtener páginas de un capítulo
async function getIkigaiPages(slug, chapter)
// Delega a /api/ikigai/pages
// Retorna: array de URLs de imágenes

// 5. Obtener obra aleatoria (para el oráculo)
async function getRandomIkigai(genreIds = [])
// Busca con géneros, obtiene resultados aleatorios
// Retorna: objeto de obra con detalles completos
```

**Características especiales:**
- **Delegación completa a API serverless** (como ManhwaWeb)
- Detección de entorno (bloquear en localhost)
- Manejo de errores con mensajes descriptivos
- Logging para debugging

**Estructura básica:**
```javascript
import { detectEnvironment } from '../utils/environment';

// Configuración
const IKIGAI_BASE_URL = 'https://viralikigai.eurofiyati.online';

// Función principal de búsqueda
export async function searchIkigai(query = '', filters = {}, page = 1) {
  const { isLocal, apiUrl } = detectEnvironment();

  if (isLocal) {
    console.warn('[Ikigai] No disponible en localhost');
    return [];
  }

  try {
    const response = await fetch(`${apiUrl}/api/ikigai/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, filters, page })
    });

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[Ikigai] Error en búsqueda:', error);
    return [];
  }
}

// ... resto de funciones
```

#### 2.2 Crear `src/services/ikigaiFilters.js`

**Ubicación:** `C:\Users\Isma\Documents\Proyectos Perosnakes\MangaIX\src\services\ikigaiFilters.js`

**Tamaño estimado:** ~250-300 líneas

**Estructura completa:**

```javascript
// ========================================
// TIPOS
// ========================================
export const IKIGAI_TYPES = [
  { name: "Comic", id: "comic", value: "comic" },
  { name: "Novela", id: "novel", value: "novel" }
];

// ========================================
// ESTADOS
// ========================================
export const IKIGAI_STATUSES = [
  { name: "Abandonada", id: "abandoned", value: "906428048651190273" },
  { name: "Cancelada", id: "cancelled", value: "906426661911756802" },
  { name: "Completa", id: "completed", value: "906409532796731395" },
  { name: "En Curso", id: "ongoing", value: "911437469204086787" },
  { name: "Hiatus", id: "hiatus", value: "906409397258190851" }
];

// ========================================
// GÉNEROS (50+ géneros)
// ========================================
export const IKIGAI_GENRES = [
  { name: "+18", id: "18", value: "906409351272792067", displayName: "+18" },
  { name: "Acción 💥", id: "accion", value: "906397904327999491", displayName: "Acción" },
  { name: "Adulto 🔞", id: "adulto", value: "906409527934582787", displayName: "Adulto" },
  { name: "Apocalíptico 🌋", id: "apocaliptico", value: "906409378635186179", displayName: "Apocalíptico" },
  { name: "Artes Marciales 🥋", id: "artes-marciales", value: "906397904169861123", displayName: "Artes Marciales" },
  { name: "Aventura 🗺️", id: "aventura", value: "906397904061530115", displayName: "Aventura" },
  { name: "Bender", id: "bender", value: "1093357252096753667", displayName: "Bender" },
  { name: "Boys Love 💙", id: "boys-love", value: "906409351330037763", displayName: "Boys Love" },
  { name: "Ciencia Ficción 🚀", id: "ciencia-ficcion", value: "906409468787720195", displayName: "Ciencia Ficción" },
  { name: "Comedia 😂", id: "comedia", value: "906398112851165187", displayName: "Comedia" },
  { name: "Demonios 👹", id: "demonios", value: "906397904115531779", displayName: "Demonios" },
  { name: "Deporte ⚽", id: "deporte", value: "906410143226462211", displayName: "Deporte" },
  { name: "Drama 🎭", id: "drama", value: "906397903933407235", displayName: "Drama" },
  { name: "Ecchi 😏", id: "ecchi", value: "906409370648543235", displayName: "Ecchi" },
  { name: "Familia 👨‍👩‍👧", id: "familia", value: "906409382485884931", displayName: "Familia" },
  { name: "Fantasía ✨", id: "fantasia", value: "906397894348570627", displayName: "Fantasía" },
  { name: "Girls Love 💖", id: "girls-love", value: "906409644012961795", displayName: "Girls Love" },
  { name: "Gore 🔪", id: "gore", value: "906409472386203651", displayName: "Gore" },
  { name: "Harem 👥", id: "harem", value: "906397904221962243", displayName: "Harem" },
  { name: "Harem Inverso", id: "harem-inverso", value: "906424352006438914", displayName: "Harem Inverso" },
  { name: "Histórico 📜", id: "historico", value: "906398112923385859", displayName: "Histórico" },
  { name: "Horror 👻", id: "horror", value: "906423434084679682", displayName: "Horror" },
  { name: "Isekai 🌍", id: "isekai", value: "906409454067646467", displayName: "Isekai" },
  { name: "Josei 👩", id: "josei", value: "906409501957390339", displayName: "Josei" },
  { name: "Maduro", id: "maduro", value: "906409612041551875", displayName: "Maduro" },
  { name: "Magia 🔮", id: "magia", value: "906409459593347075", displayName: "Magia" },
  { name: "Mecha 🤖", id: "mecha", value: "906409472453410819", displayName: "Mecha" },
  { name: "Militar 🪖", id: "militar", value: "906409472453410819", displayName: "Militar" },
  { name: "Misterio 🔍", id: "misterio", value: "906409374254727171", displayName: "Misterio" },
  { name: "Psicológico 🧠", id: "psicologico", value: "906409351382073347", displayName: "Psicológico" },
  { name: "Realidad Virtual 🕶️", id: "realidad-virtual", value: "906424676182294530", displayName: "Realidad Virtual" },
  { name: "Recuentos de la vida", id: "recuentos-vida", value: "906409508165124099", displayName: "Recuentos de la vida" },
  { name: "Reencarnación ♻️", id: "reencarnacion", value: "906409400553046019", displayName: "Reencarnación" },
  { name: "Regresión ⏪", id: "regresion", value: "906397894469255171", displayName: "Regresión" },
  { name: "Romance 💕", id: "romance", value: "906397894527549443", displayName: "Romance" },
  { name: "Seinen", id: "seinen", value: "906397903999959043", displayName: "Seinen" },
  { name: "Shonen 🔥", id: "shonen", value: "906398112991150083", displayName: "Shonen" },
  { name: "Shoujo 🌸", id: "shoujo", value: "906397894408372227", displayName: "Shoujo" },
  { name: "Sistema 📊", id: "sistema", value: "906409408107216899", displayName: "Sistema" },
  { name: "Smut 🔥", id: "smut", value: "906409419999641603", displayName: "Smut" },
  { name: "Supernatural 👻", id: "supernatural", value: "906410027513937923", displayName: "Supernatural" },
  { name: "Supervivencia 🏝️", id: "supervivencia", value: "906409454130921475", displayName: "Supervivencia" },
  { name: "Tragedia 😢", id: "tragedia", value: "906409449984655363", displayName: "Tragedia" },
  { name: "Transmigración 🔄", id: "transmigracion", value: "906409378688663555", displayName: "Transmigración" },
  { name: "Vida Escolar 🎒", id: "vida-escolar", value: "906409508232822787", displayName: "Vida Escolar" },
  { name: "Yaoi 💙", id: "yaoi", value: "906409432216403971", displayName: "Yaoi" },
  { name: "Yuri 💖", id: "yuri", value: "906409472567017475", displayName: "Yuri" }
];

// ========================================
// ORDENAR POR
// ========================================
export const IKIGAI_SORT_OPTIONS = [
  { name: "Nombre", value: "name" },
  { name: "Creado en", value: "created_at" },
  { name: "Actualización más reciente", value: "last_chapter_date" },
  { name: "Número de favoritos", value: "bookmark_count" },
  { name: "Número de valoración", value: "rating_count" },
  { name: "Número de vistas", value: "view_count" }
];

// ========================================
// MOODS (6 moods personalizados)
// ========================================
export const IKIGAI_MOODS = [
  {
    name: "Quiero acción 🔥",
    id: "action",
    genres: ["accion", "artes-marciales", "aventura"],
    genreValues: ["906397904327999491", "906397904169861123", "906397904061530115"],
    toast: "¡Prepárate para la adrenalina! 🔥",
    color: "from-red-400 to-red-600"
  },
  {
    name: "Quiero llorar 😭",
    id: "cry",
    genres: ["drama", "tragedia"],
    genreValues: ["906397903933407235", "906409449984655363"],
    toast: "Busca los pañuelos, que hoy se llora... 😭",
    color: "from-blue-400 to-blue-600"
  },
  {
    name: "Quiero romance 💕",
    id: "romance",
    genres: ["romance", "shoujo"],
    genreValues: ["906397894527549443", "906397894408372227"],
    toast: "El amor está en el aire... 💕",
    color: "from-pink-400 to-pink-600"
  },
  {
    name: "Quiero reír 😂",
    id: "laugh",
    genres: ["comedia", "recuentos-vida"],
    genreValues: ["906398112851165187", "906409508165124099"],
    toast: "¡A reír se ha dicho! 😂",
    color: "from-yellow-400 to-yellow-600"
  },
  {
    name: "Quiero misterio 🔍",
    id: "mystery",
    genres: ["misterio", "psicologico", "horror"],
    genreValues: ["906409374254727171", "906409351382073347", "906423434084679682"],
    toast: "El suspenso te espera... 🔍",
    color: "from-purple-400 to-purple-600"
  },
  {
    name: "Quiero fantasía ✨",
    id: "fantasy",
    genres: ["fantasia", "magia", "isekai"],
    genreValues: ["906397894348570627", "906409459593347075", "906409454067646467"],
    toast: "¡Explora mundos mágicos! ✨",
    color: "from-indigo-400 to-indigo-600"
  }
];

// ========================================
// EXPORTAR FILTROS COMPLETOS
// ========================================
export const IKIGAI_FILTERS = {
  types: IKIGAI_TYPES,
  statuses: IKIGAI_STATUSES,
  genres: IKIGAI_GENRES,
  sortOptions: IKIGAI_SORT_OPTIONS,
  moods: IKIGAI_MOODS
};
```

---

### FASE 3: Crear API Routes Serverless

#### 3.1 Crear `api/ikigai/search.js`

**Ubicación:** `C:\Users\Isma\Documents\Proyectos Perosnakes\MangaIX\api\ikigai\search.js`

**Tamaño estimado:** ~350-400 líneas

**Funcionalidad:**

```javascript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = '', filters = {}, page = 1 } = req.body;

  let browser = null;

  try {
    // 1. Construir URL con filtros
    const searchUrl = buildSearchUrl(query, filters, page);

    // 2. Iniciar Puppeteer
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // 3. Bloquear ads y recursos innecesarios
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const blockedResources = ['ads', 'analytics', 'facebook', 'google-analytics'];
      const url = request.url().toLowerCase();

      if (blockedResources.some(resource => url.includes(resource))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // 4. Navegar a la URL
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 8000
    });

    // 5. Esperar a que carguen los resultados
    await page.waitForSelector('.resultado-obra', { timeout: 6000 });

    // 6. Extraer resultados
    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('.resultado-obra');
      return Array.from(items).map(item => {
        const link = item.querySelector('a');
        const title = item.querySelector('.titulo')?.textContent.trim();
        const cover = item.querySelector('img')?.src;
        const slug = link?.href.split('/series/')[1]?.replace('/', '');

        return {
          id: `ikigai-${slug}-${Date.now()}`,
          slug,
          title,
          cover,
          source: 'ikigai'
        };
      });
    });

    await browser.close();

    return res.status(200).json({
      results,
      page,
      hasMore: results.length > 0
    });

  } catch (error) {
    console.error('[Ikigai Search] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
}

// Función helper para construir URL
function buildSearchUrl(query, filters, page) {
  const baseUrl = 'https://viralikigai.eurofiyati.online/series/';
  const params = new URLSearchParams();

  // Tipos
  if (filters.types?.length) {
    filters.types.forEach(type => params.append('tipos[]', type));
  }

  // Estados
  if (filters.statuses?.length) {
    filters.statuses.forEach(status => params.append('estados[]', status));
  }

  // Géneros
  if (filters.genres?.length) {
    filters.genres.forEach(genre => params.append('generos[]', genre));
  }

  // Ordenar
  if (filters.sortBy) {
    params.append('ordenar', filters.sortBy);
  }

  // Página
  if (page > 1) {
    params.append('pagina', page);
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
```

#### 3.2 Crear `api/ikigai/details.js`

**Ubicación:** `C:\Users\Isma\Documents\Proyectos Perosnakes\MangaIX\api\ikigai\details.js`

**Tamaño estimado:** ~200-250 líneas

**Funcionalidad:**

```javascript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  let browser = null;

  try {
    const url = `https://viralikigai.eurofiyati.online/series/${slug}`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });

    // CRÍTICO: Manejar botón "Ver más" en sinopsis
    const possibleSelectors = [
      'button:has-text("Ver más")',
      '.ver-mas-btn',
      'a:has-text("Ver más")',
      '.expand-synopsis',
      'button.expand-btn'
    ];

    let verMasButton = null;
    for (const selector of possibleSelectors) {
      try {
        verMasButton = await page.$(selector);
        if (verMasButton) {
          console.log(`[Ikigai Details] Botón "Ver más" encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Selector no válido, continuar
      }
    }

    if (verMasButton) {
      await verMasButton.click();
      await page.waitForTimeout(500); // Esperar expansión
      console.log('[Ikigai Details] Sinopsis expandida');
    }

    // Extraer detalles completos
    const details = await page.evaluate(() => {
      const title = document.querySelector('.obra-titulo')?.textContent.trim();
      const cover = document.querySelector('.obra-portada img')?.src;
      const synopsis = document.querySelector('.sinopsis-container')?.textContent.trim();
      const author = document.querySelector('.autor')?.textContent.trim();
      const status = document.querySelector('.estado')?.textContent.trim();

      const genreElements = document.querySelectorAll('.genero-tag');
      const genres = Array.from(genreElements).map(el => el.textContent.trim());

      return {
        title,
        cover,
        synopsis,
        author,
        status,
        genres
      };
    });

    await browser.close();

    return res.status(200).json(details);

  } catch (error) {
    console.error('[Ikigai Details] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error obteniendo detalles',
      details: error.message
    });
  }
}
```

#### 3.3 Crear `api/ikigai/chapters.js` ⚠️ **CRÍTICO**

**Ubicación:** `C:\Users\Isma\Documents\Proyectos Perosnakes\MangaIX\api\ikigai\chapters.js`

**Tamaño estimado:** ~300-350 líneas

**Funcionalidad:** Iterar todas las páginas de capítulos automáticamente

```javascript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  let browser = null;

  try {
    const baseUrl = `https://viralikigai.eurofiyati.online/series/${slug}`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    let allChapters = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 20; // Seguridad: límite máximo

    console.log(`[Ikigai Chapters] Iniciando extracción para: ${slug}`);

    while (hasMorePages && currentPage <= maxPages) {
      const url = currentPage === 1
        ? baseUrl
        : `${baseUrl}?pagina=${currentPage}`;

      console.log(`[Ikigai Chapters] Página ${currentPage}: ${url}`);

      try {
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 6000
        });

        // Esperar a que carguen capítulos
        await page.waitForSelector('.capitulo-item', { timeout: 5000 });

        // Extraer capítulos de esta página
        const chaptersOnPage = await page.evaluate(() => {
          const items = document.querySelectorAll('.capitulo-item');
          return Array.from(items).map(item => {
            const link = item.querySelector('a');
            const chapterText = item.querySelector('.capitulo-numero')?.textContent.trim();
            const title = item.querySelector('.capitulo-titulo')?.textContent.trim() || '';

            // Extraer número de capítulo
            const chapterMatch = chapterText?.match(/\d+/);
            const chapter = chapterMatch ? chapterMatch[0] : '';

            return {
              chapter,
              title: `Capítulo ${chapter}${title ? ' - ' + title : ''}`,
              url: link?.href
            };
          });
        });

        console.log(`[Ikigai Chapters] Página ${currentPage}: ${chaptersOnPage.length} capítulos encontrados`);

        allChapters.push(...chaptersOnPage);

        // Verificar si hay siguiente página
        const hasNextButton = await page.evaluate(() => {
          const nextBtn = document.querySelector('button.next-page, a.siguiente');
          return nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('disabled');
        });

        if (hasNextButton && chaptersOnPage.length > 0) {
          currentPage++;
        } else {
          hasMorePages = false;
        }

      } catch (error) {
        console.error(`[Ikigai Chapters] Error en página ${currentPage}:`, error.message);
        hasMorePages = false;
      }
    }

    // Ordenar capítulos por número (descendente: 172 → 1)
    allChapters.sort((a, b) => {
      const numA = parseInt(a.chapter) || 0;
      const numB = parseInt(b.chapter) || 0;
      return numB - numA;
    });

    // Eliminar duplicados
    const uniqueChapters = allChapters.reduce((acc, current) => {
      const exists = acc.find(ch => ch.chapter === current.chapter);
      if (!exists) acc.push(current);
      return acc;
    }, []);

    console.log(`[Ikigai Chapters] Total capítulos: ${uniqueChapters.length}`);

    await browser.close();

    return res.status(200).json({
      chapters: uniqueChapters,
      total: uniqueChapters.length
    });

  } catch (error) {
    console.error('[Ikigai Chapters] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error obteniendo capítulos',
      details: error.message
    });
  }
}
```

**Optimizaciones posibles:**
- Implementar cache de capítulos (10-15 minutos)
- Mostrar progreso de carga al usuario
- Paralelizar extracción (requiere múltiples instancias de Puppeteer)

#### 3.4 Crear `api/ikigai/pages.js`

**Ubicación:** `C:\Users\Isma\Documents\Proyectos Perosnakes\MangaIX\api\ikigai\pages.js`

**Tamaño estimado:** ~150-200 líneas

**Funcionalidad:**

```javascript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, chapter } = req.body;

  if (!slug || !chapter) {
    return res.status(400).json({ error: 'Slug and chapter are required' });
  }

  let browser = null;

  try {
    // Construir URL del capítulo (ajustar según estructura real)
    const chapterUrl = `https://viralikigai.eurofiyati.online/leer/${slug}-${chapter}`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // Bloquear ads
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const blockedResources = ['ads', 'analytics'];
      if (blockedResources.some(r => request.url().includes(r))) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(chapterUrl, {
      waitUntil: 'networkidle2',
      timeout: 8000
    });

    // Esperar a que carguen imágenes REALES (no loaders)
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('#lector img, .pagina img');
      return images.length > 0 &&
             Array.from(images).some(img => img.complete && img.naturalHeight > 0);
    }, { timeout: 6000 });

    // Extraer URLs de imágenes
    const imageUrls = await page.evaluate(() => {
      const images = document.querySelectorAll('#lector img, .pagina img');
      return Array.from(images)
        .map(img => img.src)
        .filter(src =>
          src &&
          !src.includes('loader') &&
          !src.includes('placeholder') &&
          src.startsWith('http')
        );
    });

    await browser.close();

    console.log(`[Ikigai Pages] ${imageUrls.length} imágenes encontradas`);

    return res.status(200).json({
      pages: imageUrls,
      total: imageUrls.length
    });

  } catch (error) {
    console.error('[Ikigai Pages] Error:', error);

    if (browser) await browser.close();

    return res.status(500).json({
      error: 'Error obteniendo páginas',
      details: error.message
    });
  }
}
```

---

### FASE 4: Integrar en el Sistema

#### 4.1 Actualizar `src/services/unified.js`

**Cambios:** Agregar Ikigai a todas las funciones

```javascript
import {
  searchTuManga,
  getTuMangaDetails,
  getTuMangaChapters,
  getTuMangaPages,
  getRandomTuManga
} from './tumanga';

import {
  searchManhwaWeb,
  getManhwaWebDetails,
  getManhwaWebChapters,
  getManhwaWebPages,
  getRandomManhwaWeb
} from './manhwaweb';

// NUEVO
import {
  searchIkigai,
  getIkigaiDetails,
  getIkigaiChapters,
  getIkigaiPages,
  getRandomIkigai
} from './ikigai';

// ========================================
// BÚSQUEDA
// ========================================
export async function unifiedSearch(query, filters, source, page = 1) {
  switch (source) {
    case 'tumanga':
      return await searchTuManga(query, filters, page);
    case 'manhwaweb':
      return await searchManhwaWeb(query, filters, page);
    case 'ikigai': // NUEVO
      return await searchIkigai(query, filters, page);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

// ========================================
// DETALLES
// ========================================
export async function unifiedGetDetails(slug, source) {
  switch (source) {
    case 'tumanga':
      return await getTuMangaDetails(slug);
    case 'manhwaweb':
      return await getManhwaWebDetails(slug);
    case 'ikigai': // NUEVO
      return await getIkigaiDetails(slug);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

// ========================================
// CAPÍTULOS
// ========================================
export async function unifiedGetChapters(slug, source) {
  switch (source) {
    case 'tumanga':
      return await getTuMangaChapters(slug);
    case 'manhwaweb':
      return await getManhwaWebChapters(slug);
    case 'ikigai': // NUEVO
      return await getIkigaiChapters(slug);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

// ========================================
// PÁGINAS
// ========================================
export async function unifiedGetPages(slug, chapter, source) {
  switch (source) {
    case 'tumanga':
      return await getTuMangaPages(slug, chapter);
    case 'manhwaweb':
      return await getManhwaWebPages(slug, chapter);
    case 'ikigai': // NUEVO
      return await getIkigaiPages(slug, chapter);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

// ========================================
// ALEATORIO (ORÁCULO)
// ========================================
export async function unifiedGetRandom(genreIds, source) {
  switch (source) {
    case 'tumanga':
      return await getRandomTuManga(genreIds);
    case 'manhwaweb':
      return await getRandomManhwaWeb(genreIds);
    case 'ikigai': // NUEVO
      return await getRandomIkigai(genreIds);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}
```

#### 4.2 Actualizar `src/services/filterService.js`

**Cambios:** Agregar Ikigai a todas las funciones

```javascript
import { TUMANGA_FILTERS } from './tumangaFilters';
import { MANHWAWEB_FILTERS } from './manhwawebFilters';
import { IKIGAI_FILTERS } from './ikigaiFilters'; // NUEVO

// ========================================
// OBTENER FILTROS POR FUENTE
// ========================================
export function getFiltersForSource(source) {
  switch (source) {
    case 'tumanga':
      return TUMANGA_FILTERS;
    case 'manhwaweb':
      return MANHWAWEB_FILTERS;
    case 'ikigai': // NUEVO
      return IKIGAI_FILTERS;
    default:
      return TUMANGA_FILTERS;
  }
}

// ========================================
// OBTENER MOODS POR FUENTE
// ========================================
export function getMoodsForSource(source) {
  const filters = getFiltersForSource(source);
  return filters.moods || [];
}

// ========================================
// OBTENER GÉNEROS POR FUENTE
// ========================================
export function getGenresForSource(source) {
  const filters = getFiltersForSource(source);
  return filters.genres || [];
}

// ========================================
// VALIDAR FILTROS POR FUENTE
// ========================================
export function validateFiltersForSource(filters, source) {
  const validFilters = getFiltersForSource(source);

  // Implementar lógica de validación
  // ...

  return true;
}
```

---

### FASE 5: Actualizar UI

#### 5.1 Actualizar `src/App.jsx`

**Ubicación de cambios:** Líneas 498-550 (selector de fuentes)

**Cambio 1: Agregar botón Ikigai**

```jsx
{/* Selector de fuentes */}
<div className="flex gap-2 justify-center mb-4 flex-wrap">
  {/* TuManga */}
  <button
    onClick={() => handleSourceChange('tumanga')}
    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300
      ${selectedSource === 'tumanga'
        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
        : 'bg-white/10 hover:bg-white/20 text-white'
      }`}
  >
    TuManga 📚
  </button>

  {/* ManhwaWeb */}
  <button
    onClick={() => handleSourceChange('manhwaweb')}
    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300
      ${selectedSource === 'manhwaweb'
        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg scale-105'
        : 'bg-white/10 hover:bg-white/20 text-white'
      }
      ${isLocalhost ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={isLocalhost}
  >
    ManhwaWeb 📖
    {isLocalhost && <span className="text-xs ml-1">(Solo en producción)</span>}
  </button>

  {/* NUEVO: Ikigai Mangas */}
  <button
    onClick={() => handleSourceChange('ikigai')}
    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300
      ${selectedSource === 'ikigai'
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
        : 'bg-white/10 hover:bg-white/20 text-white'
      }
      ${isLocalhost ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={isLocalhost}
  >
    Ikigai Mangas 🌸
    {isLocalhost && <span className="text-xs ml-1">(Solo en producción)</span>}
  </button>
</div>
```

**Cambio 2: Actualizar función `handleSourceChange`**

```javascript
const handleSourceChange = (newSource) => {
  setSelectedSource(newSource);

  // Resetear todos los filtros
  setSelectedGenres([]);
  setSelectedMood(null);
  setSearchQuery('');
  setResults([]);
  setCurrentPage(1);

  // Resetear filtros avanzados (para ManhwaWeb/Ikigai)
  if (newSource === 'manhwaweb' || newSource === 'ikigai') {
    setSelectedType('');
    setSelectedStatus('');
    setSelectedErotic('');
    setSelectedDemographic('');
    setSortBy('');
    setSortOrder('');
  }

  // Toast de confirmación
  const sourceNames = {
    tumanga: 'TuManga',
    manhwaweb: 'ManhwaWeb',
    ikigai: 'Ikigai Mangas' // NUEVO
  };

  toast.success(`Cambiado a ${sourceNames[newSource]} 📚`);
};
```

**Cambio 3: Agregar soporte para filtro "Tipos" (Ikigai)**

Dentro del panel de filtros, agregar sección condicional:

```jsx
{/* Filtros avanzados - Solo para ManhwaWeb e Ikigai */}
{(selectedSource === 'manhwaweb' || selectedSource === 'ikigai') && (
  <div className="space-y-4">

    {/* NUEVO: Filtro de Tipos (solo Ikigai) */}
    {selectedSource === 'ikigai' && (
      <div>
        <label className="block text-white/80 mb-2 font-medium">
          Tipos
        </label>
        <div className="flex gap-2">
          {currentFilters.types?.map(type => (
            <button
              key={type.id}
              onClick={() => toggleArrayFilter(selectedTypes, setSelectedTypes, type.value)}
              className={`px-4 py-2 rounded-lg transition-all
                ${selectedTypes.includes(type.value)
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Resto de filtros avanzados... */}

  </div>
)}
```

**Notas:**
- Los filtros se renderizan dinámicamente usando `getFiltersForSource()`
- No se requieren cambios adicionales en el panel de géneros y moods
- La paginación ya está implementada y funcionará automáticamente

#### 5.2 Actualizar `src/components/Oracle.jsx`

**Ubicación de cambios:** Líneas 241-264 (selector de fuentes)

**Cambio: Agregar botón Ikigai**

```jsx
{/* Selector de fuente */}
<div className="flex gap-2 mb-6 justify-center">
  <button
    onClick={() => setSelectedSource('tumanga')}
    className={`px-4 py-2 rounded-lg font-medium transition-all
      ${selectedSource === 'tumanga'
        ? 'bg-blue-500 text-white shadow-lg'
        : 'bg-white/10 text-white hover:bg-white/20'
      }`}
  >
    TuManga
  </button>

  <button
    onClick={() => setSelectedSource('manhwaweb')}
    className={`px-4 py-2 rounded-lg font-medium transition-all
      ${selectedSource === 'manhwaweb'
        ? 'bg-green-500 text-white shadow-lg'
        : 'bg-white/10 text-white hover:bg-white/20'
      }`}
  >
    ManhwaWeb
  </button>

  {/* NUEVO: Ikigai */}
  <button
    onClick={() => setSelectedSource('ikigai')}
    className={`px-4 py-2 rounded-lg font-medium transition-all
      ${selectedSource === 'ikigai'
        ? 'bg-purple-500 text-white shadow-lg'
        : 'bg-white/10 text-white hover:bg-white/20'
      }`}
  >
    Ikigai
  </button>
</div>
```

**Notas:**
- El resto del componente se adapta automáticamente
- `getMoodsForSource()` cargará los 6 moods de Ikigai
- `getGenresForSource()` cargará los 50+ géneros de Ikigai
- `unifiedGetRandom()` llamará a `getRandomIkigai()`
- Los colores de confetti se pueden ajustar para Ikigai

**Opcional: Ajustar colores de confetti**

```javascript
const confettiColors = selectedSource === 'ikigai'
  ? ['#A855F7', '#EC4899', '#F472B6'] // Púrpura/Rosa para Ikigai
  : selectedSource === 'manhwaweb'
    ? ['#10B981', '#14B8A6', '#06B6D4'] // Verde/Teal para ManhwaWeb
    : ['#3B82F6', '#8B5CF6', '#EC4899']; // Azul/Púrpura para TuManga
```

---

<a name="detalles-tecnicos"></a>
## 🔧 DETALLES TÉCNICOS CRÍTICOS

### 1. Manejo de Paginación de Capítulos

**Problema:** Obras con 172 capítulos distribuidos en 8 páginas

**Solución implementada en `api/ikigai/chapters.js`:**

```javascript
// Estrategia: Loop automático con detección de botón "Siguiente"
let currentPage = 1;
let hasMorePages = true;

while (hasMorePages && currentPage <= 20) {
  const url = currentPage === 1
    ? baseUrl
    : `${baseUrl}?pagina=${currentPage}`;

  // Navegar y extraer capítulos
  await page.goto(url);
  const chapters = await extractChaptersFromPage();
  allChapters.push(...chapters);

  // Verificar si hay siguiente página
  const hasNext = await page.$('button.next-page:not([disabled])');
  hasMorePages = !!hasNext;
  currentPage++;
}

// Ordenar descendente (172 → 1)
allChapters.sort((a, b) => Number(b.chapter) - Number(a.chapter));
```

**Optimizaciones:**
- Límite de seguridad: 20 páginas máximo
- Timeout por página: 5-6 segundos
- Eliminación de duplicados
- Cache de resultados (10-15 min) - considerar implementar

**Experiencia de usuario:**
- Mostrar loader específico: "Cargando capítulos (página X)..."
- Indicador de progreso si >5 páginas

### 2. Manejo de Sinopsis con "Ver más"

**Problema:** Sinopsis truncada con botón expandible

**Solución en `api/ikigai/details.js`:**

```javascript
// Buscar botón con múltiples selectores (adaptabilidad)
const possibleSelectors = [
  'button:has-text("Ver más")',
  '.ver-mas-btn',
  'a:has-text("Ver más")',
  '.expand-synopsis',
  'button.expand-btn'
];

let verMasButton = null;
for (const selector of possibleSelectors) {
  verMasButton = await page.$(selector);
  if (verMasButton) break;
}

// Click y espera
if (verMasButton) {
  await verMasButton.click();
  await page.waitForTimeout(500);
}

// Extraer sinopsis completa
const synopsis = await page.$eval('.sinopsis-container', el => el.textContent.trim());
```

### 3. Construcción de URL de Búsqueda

**Formato complejo:** Arrays múltiples con parámetros repetidos

```javascript
function buildSearchUrl(query, filters, page) {
  const baseUrl = 'https://viralikigai.eurofiyati.online/series/';
  const params = new URLSearchParams();

  // Tipos (array)
  if (filters.types?.length) {
    filters.types.forEach(type => params.append('tipos[]', type));
  }

  // Estados (array con IDs largos)
  if (filters.statuses?.length) {
    filters.statuses.forEach(status => params.append('estados[]', status));
  }

  // Géneros (array con IDs largos)
  if (filters.genres?.length) {
    filters.genres.forEach(genre => params.append('generos[]', genre));
  }

  // Ordenar (string único)
  if (filters.sortBy) {
    params.append('ordenar', filters.sortBy);
  }

  // Página
  if (page > 1) {
    params.append('pagina', page);
  }

  return `${baseUrl}?${params.toString()}`;
}
```

**Ejemplo de URL resultante:**
```
https://viralikigai.eurofiyati.online/series/?
  tipos[]=comic&
  estados[]=906409532796731395&
  generos[]=906397904327999491&generos[]=906397904169861123&
  ordenar=last_chapter_date&
  pagina=1
```

### 4. Mapeo de Géneros para Moods

**Sistema de dos niveles** (como ManhwaWeb):

```javascript
{
  name: "Quiero acción 🔥",
  id: "action",
  genres: ["accion", "artes-marciales", "aventura"], // IDs amigables
  genreValues: ["906397904327999491", "906397904169861123", "906397904061530115"], // IDs reales
  toast: "¡Prepárate para la adrenalina! 🔥",
  color: "from-red-400 to-red-600"
}
```

**Conversión en App.jsx:**
```javascript
const selectedGenreValues = selectedMood
  ? selectedMood.genreValues // Usar valores pre-mapeados
  : selectedGenres; // Usar géneros seleccionados directamente
```

### 5. Detección de Imágenes Reales (No Loaders)

**En `api/ikigai/pages.js`:**

```javascript
// Esperar a que las imágenes estén REALMENTE cargadas
await page.waitForFunction(() => {
  const images = document.querySelectorAll('#lector img, .pagina img');
  return images.length > 0 &&
         Array.from(images).some(img =>
           img.complete &&
           img.naturalHeight > 0 &&
           !img.src.includes('loader') &&
           !img.src.includes('placeholder')
         );
}, { timeout: 6000 });

// Extraer solo URLs válidas
const imageUrls = await page.evaluate(() => {
  const images = document.querySelectorAll('#lector img, .pagina img');
  return Array.from(images)
    .map(img => img.src)
    .filter(src =>
      src &&
      !src.includes('loader') &&
      !src.includes('placeholder') &&
      src.startsWith('http')
    );
});
```

### 6. Bloqueo de Ads y Optimización

**En todas las API routes:**

```javascript
await page.setRequestInterception(true);
page.on('request', (request) => {
  const blockedResources = [
    'ads',
    'analytics',
    'facebook',
    'google-analytics',
    'doubleclick',
    'tracking'
  ];

  const url = request.url().toLowerCase();
  const resourceType = request.resourceType();

  // Bloquear ads y analytics
  if (blockedResources.some(r => url.includes(r))) {
    request.abort();
    return;
  }

  // Opcional: Bloquear imágenes de ads
  if (resourceType === 'image' && url.includes('ad')) {
    request.abort();
    return;
  }

  request.continue();
});
```

### 7. Sistema de Estado para Carga de Capítulos

**Opcional: Mejorar UX con estados de carga**

```javascript
// En App.jsx
const [chaptersLoadingState, setChaptersLoadingState] = useState({
  isLoading: false,
  currentPage: 0,
  totalPages: 0
});

// Mostrar en UI
{chaptersLoadingState.isLoading && (
  <div className="text-white text-center">
    Cargando capítulos...
    {chaptersLoadingState.totalPages > 0 && (
      <span> ({chaptersLoadingState.currentPage}/{chaptersLoadingState.totalPages})</span>
    )}
  </div>
)}
```

---

<a name="testing"></a>
## 🧪 TESTING Y VALIDACIÓN

### Checklist de Tests

#### 7.1 Tests de Scraping - Búsqueda

- [ ] **Búsqueda básica sin filtros**
  - Verificar que retorna resultados
  - Verificar estructura de datos correcta
  - Verificar que las portadas cargan

- [ ] **Búsqueda con 1 género**
  - Ejemplo: Solo "Acción"
  - Verificar URL construida correctamente
  - Verificar resultados relevantes

- [ ] **Búsqueda con múltiples géneros (2-3)**
  - Ejemplo: "Acción" + "Fantasía" + "Aventura"
  - Verificar parámetros `generos[]=...` múltiples
  - Verificar resultados combinados

- [ ] **Búsqueda con tipos**
  - Solo "Comic"
  - Solo "Novela"
  - Ambos seleccionados
  - Verificar filtrado correcto

- [ ] **Búsqueda con estados**
  - "En Curso"
  - "Completa"
  - Múltiples estados
  - Verificar IDs largos en URL

- [ ] **Búsqueda con ordenamiento**
  - Por nombre
  - Por fecha de creación
  - Por actualización reciente
  - Por favoritos/valoración/vistas
  - Verificar orden correcto en resultados

- [ ] **Paginación de resultados**
  - Página 1
  - Página 2
  - Página 3+
  - Verificar botones Previous/Next
  - Verificar que no hay duplicados

#### 7.2 Tests de Detalles

- [ ] **Obtener detalles de obra**
  - Verificar título carga
  - Verificar portada carga
  - Verificar autor y estado
  - Verificar géneros mapeados

- [ ] **Sinopsis corta (sin "Ver más")**
  - Verificar que captura texto completo
  - Sin errores de truncado

- [ ] **Sinopsis larga (con "Ver más")**
  - Verificar que encuentra el botón
  - Verificar que hace click
  - Verificar que captura texto expandido completo

- [ ] **Verificar portada carga correctamente**
  - URL de imagen válida
  - Imagen no es placeholder
  - Imagen se visualiza en UI

#### 7.3 Tests de Capítulos ⚠️ **CRÍTICO**

- [ ] **Obra con pocos capítulos (1-24, una sola página)**
  - Ejemplo: Buscar obra con ~20 capítulos
  - Verificar que extrae todos
  - Verificar que no intenta página 2

- [ ] **Obra con muchos capítulos (100+, múltiples páginas)**
  - Ejemplo: "La basura de la familia del conde" (172 caps)
  - Verificar que itera las 8 páginas
  - Verificar tiempo de carga aceptable (<10s)

- [ ] **Verificar orden correcto (descendente: 172→1)**
  - Capítulo más reciente primero
  - Capítulo 1 al final
  - Sin saltos en numeración

- [ ] **Verificar eliminación de duplicados**
  - No hay capítulos repetidos
  - IDs únicos

- [ ] **Verificar límite de seguridad (20 páginas máx)**
  - Si una obra tiene más de 20 páginas, se detiene
  - No entra en loop infinito

#### 7.4 Tests de Páginas (Imágenes de Capítulos)

- [ ] **Abrir capítulo**
  - URL del capítulo correcta
  - Página carga sin errores

- [ ] **Cargar imágenes correctamente**
  - Todas las imágenes extraídas
  - URLs válidas (HTTPS)
  - Sin loaders o placeholders

- [ ] **Verificar orden de páginas**
  - Página 1 primero
  - Secuencia correcta

- [ ] **Navegación entre capítulos**
  - Botón "Anterior" funciona
  - Botón "Siguiente" funciona
  - Se mantiene en la misma obra

#### 7.5 Tests de Oráculo

- [ ] **Seleccionar fuente Ikigai**
  - Botón visible y funcional
  - Cambia moods y géneros correctamente

- [ ] **Usar cada mood (6 moods)**
  - "Quiero acción 🔥"
  - "Quiero llorar 😭"
  - "Quiero romance 💕"
  - "Quiero reír 😂"
  - "Quiero misterio 🔍"
  - "Quiero fantasía ✨"
  - Verificar que cada mood retorna resultados relevantes

- [ ] **Usar selección de género individual**
  - Seleccionar 1 género del grid
  - Verificar recomendación aleatoria
  - Verificar que es del género seleccionado

- [ ] **Verificar recomendación aleatoria**
  - No siempre el mismo resultado
  - Detalles completos mostrados
  - Botón "Ver detalles" funciona

- [ ] **Animación de confetti**
  - Se muestra al obtener recomendación
  - Colores correctos (púrpura/rosa para Ikigai)

#### 7.6 Tests de UI

- [ ] **Botón Ikigai visible**
  - Posicionado después de ManhwaWeb
  - Texto "Ikigai Mangas 🌸"
  - Colores: púrpura/rosa

- [ ] **Selección de fuente**
  - Click cambia fuente activa
  - Resetea filtros correctamente
  - Toast de confirmación

- [ ] **Filtros se muestran al seleccionar Ikigai**
  - Moods (6) visibles
  - Géneros (50+) en scroll
  - Tipos (Comic/Novela) visibles
  - Estados (5) visibles
  - Ordenamiento (6 opciones)

- [ ] **Panel de filtros expandible**
  - Botón con badge de contador
  - Abre/cierra suavemente
  - Muestra todos los filtros

- [ ] **Aplicar múltiples filtros**
  - Seleccionar mood + ordenamiento
  - Seleccionar géneros + estado
  - Verificar que se aplican todos

- [ ] **Reset de filtros**
  - Botón "Resetear filtros"
  - Limpia todas las selecciones
  - Mantiene la fuente seleccionada

#### 7.7 Tests de Responsive

- [ ] **Mobile (<640px)**
  - Botones apilados verticalmente
  - Filtros legibles
  - Grid de resultados (1-2 columnas)

- [ ] **Tablet (640px-1024px)**
  - Botones en fila
  - Filtros en 2 columnas
  - Grid de resultados (2-3 columnas)

- [ ] **Desktop (>1024px)**
  - Layout completo
  - Filtros en múltiples columnas
  - Grid de resultados (4-5 columnas)

#### 7.8 Tests de Performance

- [ ] **Tiempo de búsqueda**
  - Sin filtros: <3s
  - Con filtros: <5s
  - Paginación: <2s

- [ ] **Tiempo de carga de capítulos**
  - Obras pequeñas (<30 caps): <3s
  - Obras medianas (30-100 caps): <5s
  - Obras grandes (100+ caps): <10s

- [ ] **Tiempo de carga de imágenes**
  - Capítulo promedio (20 imgs): <5s
  - Lazy loading funciona correctamente

- [ ] **Cache de resultados**
  - Búsquedas repetidas más rápidas
  - Cache de capítulos (10-15 min)

#### 7.9 Tests de Errores

- [ ] **Sin conexión**
  - Mensaje de error amigable
  - No crash de la app

- [ ] **Página no encontrada (404)**
  - Detección de slug inválido
  - Mensaje descriptivo

- [ ] **Timeout de Puppeteer**
  - Manejo graceful
  - Reintentos automáticos (opcional)

- [ ] **Localhost bloqueado**
  - Botón deshabilitado
  - Warning visible
  - Mensaje explicativo

---

<a name="archivos"></a>
## 📁 RESUMEN DE ARCHIVOS A CREAR/MODIFICAR

### ARCHIVOS NUEVOS (6)

#### Servicios
1. **`src/services/ikigai.js`**
   - Tamaño: ~400-500 líneas
   - Funciones: search, getDetails, getChapters, getPages, getRandom
   - Patrón: Delegación total a API serverless

2. **`src/services/ikigaiFilters.js`**
   - Tamaño: ~250-300 líneas
   - Contenido: TYPES, STATUSES, GENRES (50+), SORT_OPTIONS, MOODS (6)
   - Exporta: IKIGAI_FILTERS

#### API Routes
3. **`api/ikigai/search.js`**
   - Tamaño: ~350-400 líneas
   - Funcionalidad: Búsqueda con Puppeteer + construcción de URL compleja
   - Características: Bloqueo de ads, paginación de resultados

4. **`api/ikigai/details.js`**
   - Tamaño: ~200-250 líneas
   - Funcionalidad: Extracción de detalles + manejo de botón "Ver más"
   - Características: Múltiples selectores, sinopsis expandida

5. **`api/ikigai/chapters.js`**
   - Tamaño: ~300-350 líneas
   - Funcionalidad: Iteración automática de páginas de capítulos
   - Características: Loop con detección de "Siguiente", ordenamiento, deduplicación
   - **CRÍTICO:** Este es el más complejo

6. **`api/ikigai/pages.js`**
   - Tamaño: ~150-200 líneas
   - Funcionalidad: Extracción de imágenes de capítulo
   - Características: Detección de imágenes reales (no loaders)

### ARCHIVOS A MODIFICAR (4)

#### Servicios
7. **`src/services/unified.js`**
   - Cambios: ~30 líneas adicionales
   - Modificaciones:
     - Import de ikigai.js
     - Case 'ikigai' en todas las funciones (5 funciones)

8. **`src/services/filterService.js`**
   - Cambios: ~20 líneas adicionales
   - Modificaciones:
     - Import de ikigaiFilters.js
     - Case 'ikigai' en getFiltersForSource()

#### UI
9. **`src/App.jsx`**
   - Cambios: ~50-60 líneas adicionales
   - Modificaciones:
     - Botón "Ikigai Mangas 🌸" en selector
     - Lógica en handleSourceChange()
     - Sección de filtro "Tipos" (condicional para Ikigai)
     - Estado selectedTypes (si no existe)

10. **`src/components/Oracle.jsx`**
    - Cambios: ~30 líneas adicionales
    - Modificaciones:
      - Botón "Ikigai" en selector
      - Colores de confetti para Ikigai (opcional)

### ARCHIVOS QUE NO SE MODIFICAN (pero se usan)

- `src/utils/environment.js` - Detección de entorno (localhost)
- `src/components/ManhwaCard.jsx` - Tarjetas de resultado
- `src/components/SearchLoader.jsx` - Loader de búsqueda
- `src/components/OracleResultCard.jsx` - Tarjeta de resultado del oráculo
- `api/image-proxy.js` - Proxy de imágenes (CORS)

---

<a name="consideraciones"></a>
## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. Performance

**Problema:** Obras con muchos capítulos requieren tiempo

**Soluciones:**
- Implementar loading states específicos
  ```jsx
  {isLoadingChapters && (
    <div>Cargando capítulos (página {currentPage}/{totalPages})...</div>
  )}
  ```
- Cache de lista de capítulos (10-15 minutos)
  ```javascript
  // Estructura de cache
  {
    'ikigai-slug-chapters': {
      data: [...chapters],
      timestamp: Date.now(),
      ttl: 900000 // 15 min
    }
  }
  ```
- Mostrar spinner en tarjeta de obra mientras se cargan capítulos

### 2. CORS y Puppeteer

**Restricciones:**
- Ikigai requiere Puppeteer (como ManhwaWeb)
- No funcionará en localhost
- Solo en Vercel con `@sparticuz/chromium`

**Implementación:**
```javascript
// En ikigai.js
const { isLocal } = detectEnvironment();

if (isLocal) {
  console.warn('[Ikigai] No disponible en localhost');
  toast.error('Ikigai Mangas solo está disponible en producción');
  return [];
}
```

**UI:**
```jsx
// En App.jsx
<button
  disabled={isLocalhost}
  className={isLocalhost ? 'opacity-50 cursor-not-allowed' : ''}
>
  Ikigai Mangas 🌸
  {isLocalhost && <span className="text-xs">(Solo en producción)</span>}
</button>
```

### 3. Compatibilidad de Filtros

**Ventaja:** Ikigai tiene MÁS filtros que TuManga/ManhwaWeb
- 50+ géneros vs 37-47 de otras fuentes
- Filtros de Tipos (Comic/Novela)
- 6 opciones de ordenamiento vs 3-4

**Adaptación:** La UI ya es dinámica
```javascript
// Automático
const currentFilters = getFiltersForSource(selectedSource);

// Renderizado condicional
{currentFilters.types && (
  <div>Filtro de Tipos</div>
)}
```

### 4. Selectores CSS Frágiles

**Problema:** Los sitios web cambian su estructura

**Mitigación:**
- Usar múltiples selectores como fallback
  ```javascript
  const possibleSelectors = [
    '.capitulo-item',
    '.chapter-item',
    'a[href*="/leer/"]',
    '.lista-capitulos > li'
  ];
  ```
- Logging extensivo para debugging
  ```javascript
  console.log(`[Ikigai] Selector usado: ${selectorUsed}`);
  ```
- Monitorear errores en producción
- Implementar system de alertas si scraping falla

### 5. Orden de Implementación Recomendado

**Secuencia óptima:**

1. **Primero: `ikigaiFilters.js`**
   - Define toda la estructura de datos
   - Fácil de verificar (solo constantes)
   - Referencia para el resto del código

2. **Segundo: API routes (search, details, chapters, pages)**
   - Testear cada endpoint individualmente
   - Usar Postman o Thunder Client
   - Verificar respuestas antes de integrar

3. **Tercero: `ikigai.js`**
   - Implementar funciones que llaman a las APIs
   - Manejar errores y loading states
   - Testear con console.logs

4. **Cuarto: Integración (unified.js, filterService.js)**
   - Agregar cases 'ikigai'
   - Verificar que delega correctamente
   - Testear con búsquedas reales

5. **Quinto: UI updates (App.jsx, Oracle.jsx)**
   - Agregar botones y filtros
   - Verificar visual y responsiveness
   - Testear flujo completo

6. **Sexto: Testing exhaustivo**
   - Seguir checklist de testing
   - Corregir bugs encontrados
   - Optimizar performance

### 6. Testing en Desarrollo

**Estrategia para localhost:**

**Opción 1: Mock API responses**
```javascript
// En ikigai.js
if (isLocal) {
  return MOCK_SEARCH_RESULTS; // Data de prueba
}
```

**Opción 2: Usar Vercel dev con tunnel**
```bash
vercel dev --listen 3000
```

**Opción 3: Deploy a staging**
```bash
vercel --prod=false
```

### 7. Límites de Vercel Serverless

**Restricciones:**
- Timeout: 10 segundos (hobby), 60s (pro)
- Memoria: 1024MB (hobby), 3008MB (pro)
- Puppeteer consume ~200-300MB por instancia

**Optimizaciones:**
- Cerrar browser inmediatamente después de uso
- No lanzar múltiples instancias en paralelo
- Implementar reintentos con backoff exponencial

### 8. Manejo de Errores

**Estrategia completa:**

```javascript
// En API route
try {
  // Scraping logic
} catch (error) {
  console.error('[Ikigai] Error:', error);

  if (browser) await browser.close();

  // Respuestas específicas por tipo de error
  if (error.name === 'TimeoutError') {
    return res.status(504).json({
      error: 'Timeout al cargar la página'
    });
  }

  if (error.message.includes('net::ERR')) {
    return res.status(502).json({
      error: 'Error de red'
    });
  }

  return res.status(500).json({
    error: 'Error interno',
    details: error.message
  });
}
```

```javascript
// En servicio (ikigai.js)
try {
  const response = await fetch('/api/ikigai/search', ...);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error desconocido');
  }

  return data.results;
} catch (error) {
  console.error('[Ikigai] Error:', error);
  toast.error(`Error en búsqueda: ${error.message}`);
  return [];
}
```

---

<a name="resultado-final"></a>
## 🎯 RESULTADO FINAL ESPERADO

### Funcionalidades Completas

✅ **Selector de Fuentes**
- Botón "Ikigai Mangas 🌸" visible
- Posicionado después de ManhwaWeb
- Colores: Gradiente púrpura a rosa
- Deshabilitado en localhost con warning

✅ **Sistema de Búsqueda**
- Búsqueda por título (opcional)
- 50+ géneros seleccionables (multi-select)
- Filtro de Tipos: Comic, Novela
- Filtro de Estados: Abandonada, Cancelada, Completa, En Curso, Hiatus
- 6 opciones de ordenamiento
- Paginación de resultados (múltiples páginas)

✅ **Sistema de Moods**
- 6 moods personalizados:
  - Quiero acción 🔥
  - Quiero llorar 😭
  - Quiero romance 💕
  - Quiero reír 😂
  - Quiero misterio 🔍
  - Quiero fantasía ✨
- Cada mood mapea a 2-3 géneros relevantes
- Toast personalizado por mood

✅ **Visualización de Obras**
- Grid responsive de resultados
- Portadas cargando correctamente
- Títulos completos
- Sinopsis completa (botón "Ver más" manejado)
- Lazy loading de descripciones (progresivo)

✅ **Lista de Capítulos**
- Extracción completa (todas las páginas iteradas)
- Orden descendente: capítulo más reciente primero
- Sin duplicados
- Loading state específico para capítulos largos

✅ **Lector de Capítulos**
- Imágenes cargando correctamente
- Sin loaders o placeholders
- Orden secuencial correcto
- Navegación entre capítulos (anterior/siguiente)

✅ **Oráculo (Sistema de Recomendación)**
- Botón "Ikigai" en selector de fuentes
- 6 moods seleccionables
- Grid de géneros (primeros 16)
- Recomendación aleatoria funcional
- Confetti con colores púrpura/rosa
- Tarjeta de resultado con detalles completos

✅ **Experiencia de Usuario**
- Animaciones suaves (transitions)
- Loading states informativos
- Toasts de confirmación/error
- Responsive (mobile, tablet, desktop)
- Tema dark consistente

### Arquitectura Técnica

✅ **Servicios**
- `ikigai.js`: Servicio principal con 5 funciones
- `ikigaiFilters.js`: Definición completa de filtros
- Integración en `unified.js` y `filterService.js`

✅ **API Routes Serverless**
- `/api/ikigai/search`: Búsqueda con Puppeteer
- `/api/ikigai/details`: Detalles + sinopsis expandida
- `/api/ikigai/chapters`: Iteración automática de páginas
- `/api/ikigai/pages`: Extracción de imágenes

✅ **UI Components**
- Botón Ikigai en `App.jsx`
- Botón Ikigai en `Oracle.jsx`
- Filtros dinámicos (auto-adaptación)
- Panel expandible de filtros

### Calidad y Robustez

✅ **Manejo de Errores**
- Timeouts configurados
- Fallbacks para selectores
- Mensajes descriptivos al usuario
- Logging extensivo para debugging

✅ **Performance**
- Bloqueo de ads y analytics
- Cache de resultados (considerar)
- Lazy loading de descripciones
- Optimización de Puppeteer

✅ **Compatibilidad**
- Funciona en Vercel serverless
- Bloqueado en localhost (con warning)
- Responsive en todos los dispositivos
- Compatible con flujo existente

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y aprobar el plan**
   - ¿Algún ajuste necesario?
   - ¿Falta alguna funcionalidad?

2. **Comenzar implementación**
   - Seguir orden recomendado
   - Testear cada componente individualmente

3. **Deploy a staging**
   - Verificar en ambiente real
   - Testear scraping con Puppeteer

4. **Testing exhaustivo**
   - Seguir checklist completo
   - Corregir bugs encontrados

5. **Deploy a producción**
   - Monitorear errores
   - Recoger feedback de usuarios

---

## 📞 CONTACTO Y SOPORTE

Si surgen dudas durante la implementación:
- Revisar este documento como referencia
- Comparar con implementaciones de TuManga/ManhwaWeb
- Consultar logs de Puppeteer para debugging
- Testear endpoints individualmente con Postman

---

**Fin del plan de implementación**

Este documento debe ser usado como guía completa para la integración de Ikigai Mangas en MangaIX.
