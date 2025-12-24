# Plan Detallado: Implementar Filtros Completos de TuManga

**Fecha**: 23 de diciembre de 2025  
**Objetivo**: Implementar el sistema completo de filtros de TuManga con géneros (47), ordenamiento y paginación  
**Archivos afectados**: `tumanga.js`, `filterService.js`

---

## 📋 Análisis de la Situación Actual

### Estado Actual de los Filtros en TuManga

**Archivo**: `src/services/tumanga.js` (líneas 53-76)

```javascript
export const TUMANGA_GENRES = [
    { name: "Romance 💞", id: "romance", searchParam: "Romance" },
    // ... solo 22 géneros definidos
];
```

**Problemas identificados**:
1. ❌ Solo 22 géneros de 47 disponibles
2. ❌ No usa IDs numéricos (usa nombres como searchParam)
3. ❌ No implementa ordenamiento (Título, Año, Fecha)
4. ❌ No implementa modo ASC/DESC
5. ❌ No implementa paginación correcta
6. ❌ La función `searchTuManga` no construye URLs con filtros

### URL de TuManga Analizada

**Formato completo**:
```
https://tumanga.org/biblioteca?title=BUSQUEDA&c[]=1&c[]=2&order_by=title&order_mode=asc&page=0
```

**Parámetros**:
- `title`: Búsqueda por texto (opcional)
- `c[]`: Géneros (IDs numéricos, múltiples)
- `order_by`: `title`, `year`, `date`
- `order_mode`: `asc`, `desc`
- `page`: Número de página (0-based: 0, 1, 2, ...)

---

## 🎯 Plan de Implementación

### FASE 1: Actualizar Lista Completa de Géneros ✅

#### Archivo: `src/services/tumanga.js`

**Reemplazar** `TUMANGA_GENRES` (líneas 53-76) con la lista completa de 47 géneros:

```javascript
// Géneros completos de TuManga con sus IDs numéricos
export const TUMANGA_GENRES = [
    { name: "Acción 💥", id: 1, displayName: "Acción" },
    { name: "Aventura 🗺️", id: 2, displayName: "Aventura" },
    { name: "Comedia 🤣", id: 3, displayName: "Comedia" },
    { name: "Drama 🎭", id: 4, displayName: "Drama" },
    { name: "Recuentos de la vida 📖", id: 5, displayName: "Recuentos de la vida" },
    { name: "Ecchi 🔥", id: 6, displayName: "Ecchi" },
    { name: "Fantasía 🧚", id: 7, displayName: "Fantasía" },
    { name: "Magia ✨", id: 8, displayName: "Magia" },
    { name: "Sobrenatural 👻", id: 9, displayName: "Sobrenatural" },
    { name: "Horror 💀", id: 10, displayName: "Horror" },
    { name: "Misterio 🔍", id: 11, displayName: "Misterio" },
    { name: "Psicológico 🧠", id: 12, displayName: "Psicológico" },
    { name: "Romance 💞", id: 13, displayName: "Romance" },
    { name: "Sci-fi 🚀", id: 14, displayName: "Sci-fi" },
    { name: "Thriller 🔪", id: 15, displayName: "Thriller" },
    { name: "Deporte ⚽", id: 16, displayName: "Deporte" },
    { name: "Girls Love 🌸", id: 17, displayName: "Girls Love" },
    { name: "Boys Love 💕", id: 18, displayName: "Boys Love" },
    { name: "Harem 👯", id: 19, displayName: "Harem" },
    { name: "Mecha 🤖", id: 20, displayName: "Mecha" },
    { name: "Supervivencia 🏃", id: 21, displayName: "Supervivencia" },
    { name: "Reencarnación 🔄", id: 22, displayName: "Reencarnación" },
    { name: "Gore 🩸", id: 23, displayName: "Gore" },
    { name: "Apocalíptico 🌋", id: 24, displayName: "Apocalíptico" },
    { name: "Tragedia 🥀", id: 25, displayName: "Tragedia" },
    { name: "Vida Escolar 🎒", id: 26, displayName: "Vida Escolar" },
    { name: "Historia 🏰", id: 27, displayName: "Historia" },
    { name: "Militar 🪖", id: 28, displayName: "Militar" },
    { name: "Policiaco 👮", id: 29, displayName: "Policiaco" },
    { name: "Crimen 🔫", id: 30, displayName: "Crimen" },
    { name: "Superpoderes 💪", id: 31, displayName: "Superpoderes" },
    { name: "Vampiros 🧛", id: 32, displayName: "Vampiros" },
    { name: "Artes Marciales 🥋", id: 33, displayName: "Artes Marciales" },
    { name: "Samurái ⚔️", id: 34, displayName: "Samurái" },
    { name: "Género Bender 🔀", id: 35, displayName: "Género Bender" },
    { name: "VR 🎮", id: 36, displayName: "VR" },
    { name: "Ciberpunk 🌃", id: 37, displayName: "Ciberpunk" },
    { name: "Música 🎵", id: 38, displayName: "Música" },
    { name: "Parodia 🎭", id: 39, displayName: "Parodia" },
    { name: "Animación 🎬", id: 40, displayName: "Animación" },
    { name: "Demonios 😈", id: 41, displayName: "Demonios" },
    { name: "Familia 👨‍👩‍👧", id: 42, displayName: "Familia" },
    { name: "Extranjero 🌍", id: 43, displayName: "Extranjero" },
    { name: "Niños 👶", id: 44, displayName: "Niños" },
    { name: "Realidad 📺", id: 45, displayName: "Realidad" },
    { name: "Telenovela 📻", id: 46, displayName: "Telenovela" },
    { name: "Guerra ⚔️", id: 47, displayName: "Guerra" }
];
```

---

### FASE 2: Agregar Filtros de Ordenamiento ✅

#### Archivo: `src/services/tumanga.js`

**Agregar después de TUMANGA_GENRES** (línea ~100):

```javascript
// Opciones de ordenamiento para TuManga
export const TUMANGA_SORT_BY = [
    { name: "Título", id: "title", value: "title" },
    { name: "Año", id: "year", value: "year" },
    { name: "Fecha Añadido", id: "date", value: "date" }
];

// Opciones de modo de ordenamiento
export const TUMANGA_SORT_ORDER = [
    { name: "Ascendente (A-Z, 0-9)", id: "asc", value: "asc", icon: "↑" },
    { name: "Descendente (Z-A, 9-0)", id: "desc", value: "desc", icon: "↓" }
];
```

---

### FASE 3: Reescribir Función `searchTuManga` ✅

#### Archivo: `src/services/tumanga.js` (líneas 227-274)

**Reemplazar completamente la función**:

```javascript
/**
 * Busca mangas en TuManga con filtros opcionales
 * @param {string} query - Término de búsqueda
 * @param {object} filters - Filtros aplicados
 * @param {array} filters.genres - Array de IDs de géneros (números)
 * @param {string} filters.sortBy - 'title', 'year', o 'date'
 * @param {string} filters.sortOrder - 'asc' o 'desc'
 * @param {number} filters.page - Número de página (0-based)
 * @returns {Promise<array>} Array de mangas encontrados
 */
export const searchTuManga = async (query = '', filters = {}) => {
    try {
        console.log(`[TuManga] Buscando: "${query}"`, filters);

        // Construir URL con parámetros
        const url = buildTuMangaSearchURL(query, filters);
        console.log(`[TuManga] URL construida: ${url}`);

        const response = await fetchWithProxy(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        const results = [];

        // Seleccionar elementos de manga
        doc.querySelectorAll('.gm_h .item, ul.gm_h li.item').forEach((el, index) => {
            const link = el.querySelector('a');
            const href = link?.getAttribute('href');

            if (href && href.startsWith('/online/')) {
                const slug = href.replace('/online/', '');
                const title = el.querySelector('h2')?.textContent?.trim();
                const img = el.querySelector('img');
                const coverUrl = img?.getAttribute('data-src') || img?.getAttribute('src');

                if (title && slug) {
                    const uniqueId = `tumanga-${slug}-${Date.now()}-${index}`;
                    results.push({
                        id: uniqueId,
                        slug,
                        title,
                        cover: coverUrl?.startsWith('http') ? coverUrl : `${BASE_URL}${coverUrl}`,
                        source: 'tumanga'
                    });
                }
            }
        });

        console.log(`[TuManga] Encontrados ${results.length} resultados`);
        return results;
    } catch (error) {
        console.error('[TuManga] Error en búsqueda:', error);
        return [];
    }
};

/**
 * Construye la URL de búsqueda de TuManga con todos los parámetros
 * @param {string} query - Término de búsqueda
 * @param {object} filters - Filtros a aplicar
 * @returns {string} URL completa
 */
function buildTuMangaSearchURL(query = '', filters = {}) {
    const baseUrl = `${BASE_URL}/biblioteca`;
    const params = new URLSearchParams();

    // 1. Título (búsqueda por texto)
    params.append('title', query || '');

    // 2. Géneros (c[]=1&c[]=2&c[]=3)
    if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
        filters.genres.forEach(genreId => {
            params.append('c[]', genreId);
        });
    }

    // 3. Ordenar por (title, year, date)
    const sortBy = filters.sortBy || 'title';
    params.append('order_by', sortBy);

    // 4. Modo de ordenamiento (asc, desc)
    const sortOrder = filters.sortOrder || 'asc';
    params.append('order_mode', sortOrder);

    // 5. Página (0-based: 0, 1, 2, ...)
    const page = filters.page || 0;
    params.append('page', page);

    return `${baseUrl}?${params.toString()}`;
}
```

---

### FASE 4: Actualizar `filterService.js` ✅

#### Archivo: `src/services/filterService.js`

**Línea 7-11**: Importar los nuevos filtros

```javascript
import { 
    TUMANGA_GENRES, 
    TUMANGA_SORT_BY,      // ⬅️ NUEVO
    TUMANGA_SORT_ORDER,   // ⬅️ NUEVO
    TUMANGA_MOODS 
} from './tumanga';
```

**Línea 30-43**: Actualizar función `getFiltersForSource`

```javascript
if (source === 'tumanga') {
    return {
        genres: TUMANGA_GENRES,
        sortBy: TUMANGA_SORT_BY,           // ⬅️ NUEVO
        sortOrder: TUMANGA_SORT_ORDER,     // ⬅️ NUEVO
        moods: TUMANGA_MOODS,
        hasAdvancedFilters: true,          // ⬅️ CAMBIO: antes era false
        hasSortOptions: true,              // ⬅️ NUEVO
        hasPagination: true,               // ⬅️ NUEVO
        // Campos vacíos para consistencia
        types: [],
        status: [],
        erotic: [],
        demographics: [],
        formats: []
    };
}
```

**Línea 97-112**: Actualizar `validateFiltersForSource`

```javascript
if (source === 'tumanga') {
    // Permitir genres, sortBy, sortOrder, page
    if (filters.genres) validatedFilters.genres = filters.genres;
    if (filters.sortBy) validatedFilters.sortBy = filters.sortBy;       // ⬅️ NUEVO
    if (filters.sortOrder) validatedFilters.sortOrder = filters.sortOrder; // ⬅️ NUEVO
    if (filters.page !== undefined) validatedFilters.page = filters.page;  // ⬅️ NUEVO
}
```

**Línea 120-126**: Actualizar `getEmptyFiltersForSource`

```javascript
if (source === 'tumanga') {
    return {
        genres: [],
        sortBy: 'title',      // ⬅️ NUEVO (valor por defecto)
        sortOrder: 'asc',     // ⬅️ NUEVO (valor por defecto)
        page: 0               // ⬅️ NUEVO (valor por defecto)
    };
}
```

---

### FASE 5: Implementar Paginación en la UI ✅

#### Archivo: `src/App.jsx` (donde se manejan los filtros)

**Agregar estado de paginación**:

```javascript
const [currentPage, setCurrentPage] = useState(0);
```

**Modificar función de búsqueda para incluir página**:

```javascript
const handleSearch = async () => {
    setIsLoading(true);
    
    const searchFilters = {
        genres: selectedGenres.map(g => g.id), // IDs numéricos para TuManga
        sortBy: selectedSortBy || 'title',
        sortOrder: selectedSortOrder || 'asc',
        page: currentPage
    };
    
    const results = await unifiedSearch(searchQuery, searchFilters, selectedSource);
    setMangaList(results);
    setIsLoading(false);
};
```

**Agregar botones de paginación** (al final de la lista de resultados):

```jsx
{/* Paginación (solo para TuManga) */}
{selectedSource === 'tumanga' && mangaList.length > 0 && (
    <div className="flex justify-center gap-4 mt-8 mb-8">
        <button
            onClick={() => {
                if (currentPage > 0) {
                    setCurrentPage(currentPage - 1);
                    handleSearch();
                }
            }}
            disabled={currentPage === 0}
            className="px-6 py-3 bg-potaxie-green text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
        >
            ← Página Anterior
        </button>
        
        <span className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl flex items-center">
            Página {currentPage + 1}
        </span>
        
        <button
            onClick={() => {
                setCurrentPage(currentPage + 1);
                handleSearch();
            }}
            disabled={mangaList.length < 24} // Si hay menos de 24, probablemente es la última
            className="px-6 py-3 bg-potaxie-green text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
        >
            Página Siguiente →
        </button>
    </div>
)}
```

---

## 📊 Estructura de Datos

### Géneros de TuManga (47 totales)

```javascript
{
    name: "Acción 💥",        // Nombre con emoji para UI
    id: 1,                    // ID numérico para la API
    displayName: "Acción"     // Nombre sin emoji para búsquedas
}
```

### Filtros de Ordenamiento

```javascript
// sortBy
{
    name: "Título",
    id: "title",
    value: "title"
}

// sortOrder
{
    name: "Ascendente (A-Z, 0-9)",
    id: "asc",
    value: "asc",
    icon: "↑"
}
```

### Objeto de Filtros Completo

```javascript
{
    genres: [1, 3, 13],          // IDs numéricos
    sortBy: 'title',             // 'title', 'year', 'date'
    sortOrder: 'asc',            // 'asc', 'desc'
    page: 0                      // 0, 1, 2, ...
}
```

---

## 🎨 Ejemplos de URLs Generadas

### Ejemplo 1: Búsqueda simple con 1 género
```
Filtros: { genres: [1] }
URL: https://tumanga.org/biblioteca?title=&c[]=1&order_by=title&order_mode=asc&page=0
```

### Ejemplo 2: Múltiples géneros + ordenamiento
```
Filtros: { genres: [1, 3, 13], sortBy: 'date', sortOrder: 'desc' }
URL: https://tumanga.org/biblioteca?title=&c[]=1&c[]=3&c[]=13&order_by=date&order_mode=desc&page=0
```

### Ejemplo 3: Búsqueda con texto + página 2
```
Query: "dragon"
Filtros: { genres: [1, 2], page: 2 }
URL: https://tumanga.org/biblioteca?title=dragon&c[]=1&c[]=2&order_by=title&order_mode=asc&page=2
```

### Ejemplo 4: Ordenar por año descendente
```
Filtros: { sortBy: 'year', sortOrder: 'desc' }
URL: https://tumanga.org/biblioteca?title=&order_by=year&order_mode=desc&page=0
```

---

## 🧪 Testing

### Checklist de Pruebas

#### Géneros
- [ ] Seleccionar 1 género → Buscar → Verificar resultados
- [ ] Seleccionar 3 géneros → Buscar → Verificar resultados
- [ ] Seleccionar 10+ géneros → Buscar → Verificar resultados
- [ ] Verificar que URL tiene `c[]=1&c[]=2&c[]=3`

#### Ordenamiento
- [ ] Ordenar por Título ASC → Verificar orden alfabético
- [ ] Ordenar por Título DESC → Verificar orden inverso
- [ ] Ordenar por Año ASC → Verificar por año
- [ ] Ordenar por Fecha DESC → Verificar los más recientes primero

#### Paginación
- [ ] Primera página (page=0) → Ver resultados
- [ ] Click "Siguiente" → page=1 → Verificar nuevos resultados
- [ ] Click "Anterior" → Volver a page=0
- [ ] Ir a página 5 → Verificar que funciona

#### Combinaciones
- [ ] Géneros + Ordenamiento + Paginación
- [ ] Búsqueda por texto + Filtros
- [ ] Cambiar filtros y volver a página 0

---

## 📝 Cambios Detallados por Archivo

### 1. `src/services/tumanga.js`

| Línea | Cambio | Descripción |
|-------|--------|-------------|
| 53-99 | Reemplazar | Lista completa de 47 géneros con IDs numéricos |
| ~100 | Agregar | `TUMANGA_SORT_BY` (3 opciones) |
| ~105 | Agregar | `TUMANGA_SORT_ORDER` (2 opciones) |
| 227-274 | Reemplazar | Nueva función `searchTuManga` con filtros |
| ~275 | Agregar | Nueva función `buildTuMangaSearchURL` |

**Total**: ~150 líneas modificadas/agregadas

---

### 2. `src/services/filterService.js`

| Línea | Cambio | Descripción |
|-------|--------|-------------|
| 7-11 | Modificar | Importar `TUMANGA_SORT_BY` y `TUMANGA_SORT_ORDER` |
| 30-43 | Modificar | Agregar sortBy, sortOrder, flags en TuManga |
| 97-100 | Modificar | Validar sortBy, sortOrder, page para TuManga |
| 120-126 | Modificar | Valores por defecto para TuManga |

**Total**: ~20 líneas modificadas

---

### 3. `src/App.jsx` (o donde estén los filtros)

| Sección | Cambio | Descripción |
|---------|--------|-------------|
| Estado | Agregar | `currentPage` state |
| handleSearch | Modificar | Incluir page en filtros |
| UI | Agregar | Componente de paginación |
| useEffect | Agregar | Reset page al cambiar filtros |

**Total**: ~80 líneas agregadas

---

## 🎯 Resultado Final

### Antes ❌

```
TuManga:
- 22 géneros de 47
- Sin ordenamiento
- Sin paginación
- URLs simples sin parámetros
```

### Después ✅

```
TuManga:
- 47 géneros completos
- Ordenar por: Título, Año, Fecha
- Modo: ASC / DESC
- Paginación funcional (0, 1, 2, ...)
- URLs completas con todos los parámetros
```

---

## 💡 Mejoras Adicionales (Opcionales)

### Fase 6: Guardar Filtros en LocalStorage

```javascript
// Guardar filtros al cambiar
useEffect(() => {
    localStorage.setItem('tumanga_filters', JSON.stringify({
        genres: selectedGenres,
        sortBy: selectedSortBy,
        sortOrder: selectedSortOrder
    }));
}, [selectedGenres, selectedSortBy, selectedSortOrder]);

// Cargar filtros al iniciar
useEffect(() => {
    const saved = localStorage.getItem('tumanga_filters');
    if (saved) {
        const filters = JSON.parse(saved);
        setSelectedGenres(filters.genres || []);
        setSelectedSortBy(filters.sortBy || 'title');
        setSelectedSortOrder(filters.sortOrder || 'asc');
    }
}, []);
```

### Fase 7: Indicador de Resultados por Página

```jsx
<div className="text-center text-zinc-400 mb-4">
    Mostrando {mangaList.length} resultados en página {currentPage + 1}
</div>
```

### Fase 8: Scroll al Inicio al Cambiar Página

```javascript
const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleSearch();
};
```

---

## ⏱️ Estimación de Tiempo

| Fase | Tiempo Estimado |
|------|----------------|
| FASE 1: Actualizar géneros | 15 min |
| FASE 2: Agregar ordenamiento | 5 min |
| FASE 3: Reescribir searchTuManga | 20 min |
| FASE 4: Actualizar filterService | 10 min |
| FASE 5: Implementar paginación UI | 30 min |
| Testing | 20 min |
| **TOTAL** | **100 min (~1.7 horas)** |

---

## 🚀 Plan de Deployment

### Commit Sugerido

```bash
git add src/services/tumanga.js src/services/filterService.js src/App.jsx
git commit -m "feat: Implementar sistema completo de filtros para TuManga

FASE 1: Lista completa de géneros
- 47 géneros con IDs numéricos
- Formato: { name, id, displayName }

FASE 2: Opciones de ordenamiento
- Ordenar por: Título, Año, Fecha Añadido
- Modo: ASC / DESC

FASE 3: Nueva función de búsqueda
- Construcción correcta de URL con parámetros
- Soporte para múltiples géneros (c[]=1&c[]=2)
- Parámetros order_by y order_mode

FASE 4: Actualización de filterService
- Importar nuevos filtros
- Validación de filtros TuManga
- Valores por defecto

FASE 5: Paginación funcional
- Sistema de páginas (0-based)
- Botones anterior/siguiente
- Reset al cambiar filtros

Beneficios:
- Búsqueda mucho más precisa
- 47 géneros disponibles (antes 22)
- Ordenamiento por título, año o fecha
- Navegación por páginas ilimitadas"

git push origin main
```

---

## 📚 Documentación de la API

### Parámetros de URL de TuManga

| Parámetro | Tipo | Valores | Ejemplo |
|-----------|------|---------|---------|
| `title` | string | Cualquier texto | `dragon` |
| `c[]` | number | 1-47 (IDs de géneros) | `c[]=1&c[]=2` |
| `order_by` | string | `title`, `year`, `date` | `title` |
| `order_mode` | string | `asc`, `desc` | `asc` |
| `page` | number | 0, 1, 2, ... | `0` |

### Ejemplos de Uso

```javascript
// Buscar Acción + Aventura, ordenar por fecha reciente
await searchTuManga('', {
    genres: [1, 2],
    sortBy: 'date',
    sortOrder: 'desc',
    page: 0
});

// Buscar "dragon", solo Romance, por título A-Z
await searchTuManga('dragon', {
    genres: [13],
    sortBy: 'title',
    sortOrder: 'asc',
    page: 0
});

// Página 3 de todos los mangas por año más reciente
await searchTuManga('', {
    genres: [],
    sortBy: 'year',
    sortOrder: 'desc',
    page: 3
});
```

---

**Estado**: ✅ Plan completo y detallado  
**Complejidad**: Media-Alta  
**Riesgo**: Bajo (cambios aislados)  
**Impacto**: Muy Alto (mejora masiva en búsqueda)  
**Prioridad**: Alta (feature muy solicitado)
