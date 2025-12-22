# Plan de Implementación: Sistema Multi-Fuente (TuManga + ManhwaWeb)

## 📋 Análisis de Arquitectura Actual (TuManga)

### Estructura Actual Identificada:

#### 1. **Servicio de Scraping** (`src/services/tumanga.js`)
- **Funciones principales:**
  - `searchTuManga()` - Búsqueda de obras
  - `getTuMangaDetails()` - Detalles de una obra
  - `getTuMangaChapters()` - Lista de capítulos
  - `getTuMangaPages()` - Páginas de un capítulo (usa API serverless)
  - `getRandomManga()` - Obtener manga aleatorio para Oráculo

- **Características:**
  - Sistema de proxies CORS con fallback automático
  - Constantes exportadas: `TUMANGA_GENRES`, `TUMANGA_FORMATS`, `TUMANGA_MOODS`
  - Decodificación XOR para URLs de imágenes
  - Normalización de títulos

#### 2. **API Serverless** (`api/tumanga/pages.js`)
- Usa Puppeteer con Chromium headless en Vercel
- Extrae las páginas del capítulo ejecutando JavaScript del sitio
- Bloquea publicidad y analytics
- Retorna array de URLs de imágenes

#### 3. **Proxy de Imágenes** (`api/image-proxy.js` + `src/utils/imageProxy.js`)
- Soluciona problemas CORS en producción
- Cachea imágenes por 24 horas
- Detecta automáticamente localhost vs producción

#### 4. **Componentes UI:**

**a) App.jsx (Búsqueda principal)**
- Input de búsqueda
- Filtros por género, formato y mood
- Llama a `searchTuManga()` y muestra resultados en grid
- Estado: `searchResults`, `selectedGenres`, `selectedFormats`, `selectedMood`

**b) Oracle.jsx (Recomendaciones aleatorias)**
- Selección de género/mood
- Llama a `getRandomManga()` con géneros filtrados
- Muestra resultado en tarjeta especial

**c) DetailModal.jsx**
- Carga detalles completos con `getTuMangaDetails()`
- Carga capítulos con `getTuMangaChapters()`
- Lista de botones de capítulos
- Al hacer clic en capítulo: llama `getTuMangaPages()` y abre Reader

**d) Reader.jsx**
- Recibe array de páginas (URLs)
- Scroll vertical con todas las imágenes
- Controles de navegación

#### 5. **Estructura de Datos:**
```javascript
// Manga básico (búsqueda)
{
  id: 'tumanga-slug-timestamp-index',
  slug: 'obra-slug',
  title: 'Título',
  cover: 'https://...',
  source: 'tumanga'
}

// Manga con detalles
{
  ...básico,
  description: '...',
  genres: ['Romance', 'Drama'],
  status: 'ongoing' | 'completed',
  author: '...',
  lastChapter: '123',
  chaptersCount: 123
}

// Capítulo
{
  id: 'tumanga-slug-ch-NUM-timestamp-index',
  slug: 'obra-slug',
  chapter: '12.5',
  title: 'Capítulo 12.5',
  url: 'https://tumanga.org/leer/...'
}
```

---

## 🎯 Plan de Arquitectura Multi-Fuente

### FASE 1: Estructura Base y Abstracción

#### 1.1 Crear Sistema de Fuentes Centralizado

**Archivo:** `src/services/sources.js`
```javascript
export const SOURCES = {
  TUMANGA: {
    id: 'tumanga',
    name: 'TuManga',
    icon: '📚',
    baseUrl: 'https://tumanga.org',
    color: 'bg-blue-500',
    features: ['search', 'details', 'chapters', 'read']
  },
  MANHWAWEB: {
    id: 'manhwaweb',
    name: 'ManhwaWeb',
    icon: '🌐',
    baseUrl: 'https://manhwaweb.com',
    color: 'bg-purple-500',
    features: ['search', 'details', 'chapters', 'read']
  }
};

export const DEFAULT_SOURCE = SOURCES.TUMANGA.id;
```

#### 1.2 Crear Servicio para ManhwaWeb

**Archivo:** `src/services/manhwaweb.js`
- Estructura similar a `tumanga.js`
- Funciones espejo:
  - `searchManhwaWeb(query, filters)`
  - `getManhwaWebDetails(slug)`
  - `getManhwaWebChapters(slug)`
  - `getManhwaWebPages(slug, chapter)`
  - `getRandomManhwaWeb(genreIds)`

**Pendiente:** Investigar estructura HTML de manhwaweb.com para scraping

#### 1.3 API Serverless para ManhwaWeb

**Archivo:** `api/manhwaweb/pages.js`
- Similar a `api/tumanga/pages.js`
- Adaptado a la estructura de manhwaweb.com

#### 1.4 Unificador de Servicios

**Archivo:** `src/services/unified.js`
```javascript
import * as tumanga from './tumanga';
import * as manhwaweb from './manhwaweb';

const serviceMap = {
  tumanga,
  manhwaweb
};

export async function unifiedSearch(query, filters, source) {
  const service = serviceMap[source];
  return await service.search(query, filters);
}

export async function unifiedGetDetails(slug, source) {
  const service = serviceMap[source];
  return await service.getDetails(slug);
}

// ... etc para todas las funciones
```

---

### FASE 2: Adaptación de UI

#### 2.1 Selector de Fuente en Búsqueda (App.jsx)

**Ubicación:** Encima o dentro de la barra de búsqueda

**Diseño propuesto:**
```jsx
<div className="flex gap-2 mb-4">
  {Object.values(SOURCES).map(source => (
    <button
      key={source.id}
      onClick={() => setSelectedSource(source.id)}
      className={`px-4 py-2 rounded-full font-bold transition-all ${
        selectedSource === source.id
          ? source.color + ' text-white'
          : 'bg-gray-200 text-gray-600'
      }`}
    >
      {source.icon} {source.name}
    </button>
  ))}
</div>
```

**Estado nuevo:**
- `selectedSource` (string: 'tumanga' | 'manhwaweb')
- Por defecto: 'tumanga'

**Lógica:**
- `handleSearch()` usa `selectedSource` para llamar al servicio correcto
- Los resultados incluyen `source` en cada manga
- Las tarjetas muestran badge con la fuente

#### 2.2 Selector de Fuente en Oráculo (Oracle.jsx)

**Ubicación:** Junto a los géneros/moods

**Similar al de búsqueda:**
```jsx
<div className="mb-6">
  <h4>Fuente de destino ✨</h4>
  <div className="flex gap-2">
    {/* botones de fuente */}
  </div>
</div>
```

**Lógica:**
- `handleSummon()` usa fuente seleccionada para `getRandomManga()`

#### 2.3 Filtro de Capítulos por Fuente (DetailModal.jsx)

**Problema actual:** Si una obra existe en múltiples fuentes, el modal debe poder cargar capítulos de ambas

**Solución propuesta:**

1. **Estado ampliado:**
```javascript
const [chaptersBySource, setChaptersBySource] = useState({
  tumanga: [],
  manhwaweb: []
});
const [selectedChapterSource, setSelectedChapterSource] = useState('tumanga');
```

2. **Carga paralela de capítulos:**
```javascript
const loadAllChapters = async (slug) => {
  const [tumangaCh, manhwawebCh] = await Promise.all([
    getTuMangaChapters(slug).catch(() => []),
    getManhwaWebChapters(slug).catch(() => [])
  ]);
  
  setChaptersBySource({
    tumanga: tumangaCh,
    manhwaweb: manhwawebCh
  });
};
```

3. **UI con tabs:**
```jsx
<div className="mb-4">
  <h3>Lectura Directa ✨</h3>
  
  {/* Tabs de fuentes */}
  <div className="flex gap-2 mb-3">
    {Object.values(SOURCES).map(source => {
      const count = chaptersBySource[source.id]?.length || 0;
      return (
        <button
          key={source.id}
          onClick={() => setSelectedChapterSource(source.id)}
          disabled={count === 0}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
            selectedChapterSource === source.id
              ? source.color + ' text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {source.icon} {source.name} ({count})
        </button>
      );
    })}
  </div>
  
  {/* Lista de capítulos */}
  <div className="flex flex-wrap gap-2">
    {chaptersBySource[selectedChapterSource]?.map(ch => (
      <button
        key={ch.id}
        onClick={() => openReader(ch, selectedChapterSource)}
        className="px-4 py-2 bg-gray-100 rounded-xl"
      >
        Cap {ch.chapter}
      </button>
    ))}
  </div>
</div>
```

4. **Función openReader adaptada:**
```javascript
const openReader = async (chapter, source) => {
  setIsOpeningReader(true);
  setSelectedChapter(chapter.chapter);
  
  const service = source === 'tumanga' ? getTuMangaPages : getManhwaWebPages;
  const pages = await service(manga.slug, chapter.chapter);
  
  if (pages && pages.length > 0) {
    setReaderPages(pages);
  } else {
    showToast("Error al cargar capítulo");
  }
  
  setIsOpeningReader(false);
};
```

#### 2.4 Badge de Fuente en ManhwaCard

**Añadir indicador visual:**
```jsx
<div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[8px] font-bold bg-black/60 text-white backdrop-blur">
  {SOURCES[manga.source]?.icon} {SOURCES[manga.source]?.name}
</div>
```

---

### FASE 3: Géneros y Filtros Multi-Fuente

#### 3.1 Mapeo de Géneros

**Problema:** TuManga y ManhwaWeb pueden tener géneros diferentes

**Solución:**

**Archivo:** `src/services/genres.js`
```javascript
// Géneros universales
export const UNIVERSAL_GENRES = [
  { 
    id: 'romance',
    name: 'Romance 💞',
    mapping: {
      tumanga: 'romance',
      manhwaweb: 'romance' // Investigar nombre exacto
    }
  },
  { 
    id: 'action',
    name: 'Acción 💥',
    mapping: {
      tumanga: 'accion',
      manhwaweb: 'action'
    }
  },
  // ... más géneros
];

// Función para obtener géneros por fuente
export function getGenresForSource(source) {
  return UNIVERSAL_GENRES.map(g => ({
    id: g.id,
    name: g.name,
    sourceParam: g.mapping[source]
  }));
}
```

**Uso en App.jsx:**
```javascript
const genres = getGenresForSource(selectedSource);
```

---

### FASE 4: Gestión de IDs y Duplicados

#### 4.1 Formato de IDs Mejorado

**Estructura:**
```
{source}-{slug}-{timestamp}
```

Ejemplos:
- `tumanga-jinx-1234567890`
- `manhwaweb-solo-leveling-1234567891`

#### 4.2 Detección de Duplicados en Biblioteca

**Problema:** Una obra puede estar en ambas fuentes

**Solución en LibraryContext:**
```javascript
// Guardar referencia cruzada
const findDuplicates = (manga) => {
  return library.filter(m => 
    normalizeTitle(m.title) === normalizeTitle(manga.title) &&
    m.source !== manga.source
  );
};
```

**UI:** Mostrar en DetailModal si hay versión en otra fuente

---

### FASE 5: Persistencia y Migración

#### 5.1 Actualizar localStorage

**Estructura actual:** Los mangas guardados solo tienen `slug` de TuManga

**Nueva estructura:**
```javascript
{
  id: 'tumanga-jinx-123',
  slug: 'jinx',
  source: 'tumanga', // NUEVO
  title: 'Jinx',
  // ... resto
}
```

#### 5.2 Migración de datos existentes

**En LibraryContext.jsx:**
```javascript
useEffect(() => {
  const saved = localStorage.getItem('library');
  if (saved) {
    const parsed = JSON.parse(saved);
    
    // Migrar datos antiguos sin 'source'
    const migrated = parsed.map(manga => ({
      ...manga,
      source: manga.source || 'tumanga' // Por defecto tumanga
    }));
    
    setLibrary(migrated);
  }
}, []);
```

---

## 🗺️ Roadmap de Implementación

### Sprint 1: Investigación y Base (ACTUAL)
- ✅ Analizar estructura de TuManga
- 🔄 Investigar estructura de ManhwaWeb (scraping HTML)
- ⏳ Crear archivo `sources.js`
- ⏳ Crear estructura base de `manhwaweb.js`

### Sprint 2: Backend y Scraping
- Implementar todas las funciones de scraping en `manhwaweb.js`
- Crear API serverless `api/manhwaweb/pages.js`
- Crear servicio unificador `unified.js`
- Probar extracción de datos de ManhwaWeb

### Sprint 3: UI - Búsqueda y Oráculo
- Implementar selector de fuente en App.jsx
- Implementar selector de fuente en Oracle.jsx
- Adaptar filtros y géneros multi-fuente
- Añadir badges de fuente en tarjetas

### Sprint 4: UI - Detalle y Lectura
- Implementar tabs de fuente en DetailModal
- Adaptar carga de capítulos por fuente
- Mejorar Reader con info de fuente
- Testing de flujo completo

### Sprint 5: Pulido y Optimización
- Migración de datos de biblioteca
- Detección de duplicados
- Caché y performance
- Testing exhaustivo
- Documentación

---

## 🎨 Consideraciones de Diseño

### Consistencia Visual
- Cada fuente tiene color distintivo (tumanga: azul, manhwaweb: púrpura)
- Iconos consistentes en toda la app
- Transiciones suaves entre fuentes

### UX
- Fuente seleccionada se persiste en sessionStorage
- Al abrir DetailModal, mostrar automáticamente fuente con más capítulos
- Mostrar claramente qué fuente tiene contenido disponible
- Loading states específicos por fuente

### Performance
- Carga paralela de datos cuando sea posible
- Cache de búsquedas recientes por fuente
- Lazy loading de capítulos por fuente

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Cambios en estructura HTML de sitios
**Mitigación:** 
- Parsers flexibles con múltiples selectores fallback
- Logs detallados para debugging
- Sistema de notificación si scraping falla

### Riesgo 2: Bloqueo por exceso de requests
**Mitigación:**
- Rate limiting en requests
- Rotación de proxies
- Cache agresivo de datos

### Riesgo 3: Inconsistencia de datos entre fuentes
**Mitigación:**
- Normalización de títulos
- Mapping de géneros universal
- Validación de datos antes de mostrar

---

## 📝 Próximos Pasos Inmediatos

1. **Investigar ManhwaWeb:**
   - Estructura HTML de listado de obras
   - Estructura de página de detalles
   - Estructura de página de capítulo
   - Sistema de carga de imágenes

2. **Crear servicios base:**
   - `src/services/sources.js`
   - `src/services/manhwaweb.js` (estructura vacía)
   - `src/services/unified.js`

3. **Actualizar imageProxy:**
   - Soporte para URLs de manhwaweb.com

4. **Testing incremental:**
   - Probar búsqueda básica de ManhwaWeb
   - Verificar detalles
   - Probar capítulos
   - Probar lectura

---

## 💡 Notas Adicionales

- **Compatibilidad hacia atrás:** Los mangas existentes en biblioteca seguirán funcionando
- **Extensibilidad:** La arquitectura permite agregar más fuentes fácilmente
- **Testing:** Usar obras populares conocidas para verificar ambas fuentes (ej: "Solo Leveling")
- **Documentación:** Mantener README actualizado con nueva funcionalidad
