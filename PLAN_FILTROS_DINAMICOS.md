# 📋 Plan: Filtros Dinámicos por Fuente

## 🎯 Objetivo

Crear sistema de filtros que **cambian según la fuente seleccionada** (TuManga o ManhwaWeb).

---

## 📊 Estructura Actual (TuManga)

### Archivo: `src/services/tumanga.js`

```javascript
export const TUMANGA_GENRES = [
    { name: "Romance 💞", id: "romance", searchParam: "Romance" },
    { name: "Acción 💥", id: "accion", searchParam: "Acción" },
    // ... 21 géneros total
];

export const TUMANGA_MOODS = [
    { name: "Quiero llorar 😭", id: "cry", genres: ["drama", "tragedia"], ... },
    // ... 5 moods total
];

export const TUMANGA_FORMATS = [
    { name: "Manga 🇯🇵", id: "manga" },
    // ... 4 formatos
];
```

### En App.jsx:
```javascript
const [selectedGenres, setSelectedGenres] = useState([]);
const [selectedFormats, setSelectedFormats] = useState([]);
const [selectedMood, setSelectedMood] = useState(null);
```

---

## 🆕 Nueva Estructura Propuesta

### 1. Crear Archivo de Filtros de ManhwaWeb

**Archivo:** `src/services/manhwawebFilters.js`

```javascript
// Géneros de ManhwaWeb (según la página real)
export const MANHWAWEB_GENRES = [
    { name: "Acción 💥", id: "accion", value: "3" },
    { name: "Aventura 🗺️", id: "aventura", value: "4" },
    { name: "Comedia 🤣", id: "comedia", value: "5" },
    { name: "Drama 🎭", id: "drama", value: "6" },
    { name: "Recuentos de la vida 📖", id: "recuentos", value: "7" },
    { name: "Romance 💞", id: "romance", value: "8" },
    { name: "Venganza ⚔️", id: "venganza", value: "9" },
    { name: "Harem 👯", id: "harem", value: "10" },
    { name: "Fantasía 🧚", id: "fantasia", value: "11" },
    { name: "Sobrenatural 👻", id: "sobrenatural", value: "12" },
    { name: "Tragedia 🥀", id: "tragedia", value: "13" },
    { name: "Psicológico 🧠", id: "psicologico", value: "14" },
    { name: "Horror 💀", id: "horror", value: "15" },
    { name: "Thriller 🔪", id: "thriller", value: "16" },
    { name: "Historias cortas 📄", id: "historias-cortas", value: "17" },
    { name: "Ecchi 😳", id: "ecchi", value: "18" },
    { name: "Gore 🩸", id: "gore", value: "19" },
    { name: "Girls love 🌸", id: "girls-love", value: "20" },
    { name: "Boys love 💕", id: "boys-love", value: "21" },
    { name: "Reencarnación ✨", id: "reencarnacion", value: "22" },
    { name: "Sistema de niveles 📊", id: "sistema-niveles", value: "23" },
    { name: "Ciencia ficción 🚀", id: "ciencia-ficcion", value: "24" },
    { name: "Apocalíptico 🌋", id: "apocaliptico", value: "25" },
    { name: "Artes marciales 🥋", id: "artes-marciales", value: "26" },
    { name: "Superpoderes 💪", id: "superpoderes", value: "27" },
    { name: "Cultivación 🌱", id: "cultivacion", value: "28" },
    { name: "Milf 💋", id: "milf", value: "29" }
];

// Tipos de obra
export const MANHWAWEB_TYPES = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Manhwa 🇰🇷", id: "manhwa", value: "manhwa" },
    { name: "Manga 🇯🇵", id: "manga", value: "manga" },
    { name: "Manhua 🇨🇳", id: "manhua", value: "manhua" },
    { name: "Doujinshi 📚", id: "doujinshi", value: "doujinshi" },
    { name: "Novela 📖", id: "novela", value: "novela" },
    { name: "One shot ⭐", id: "oneshot", value: "oneshot" }
];

// Estado de publicación
export const MANHWAWEB_STATUS = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Publicándose 📝", id: "ongoing", value: "ongoing" },
    { name: "Pausado ⏸️", id: "paused", value: "paused" },
    { name: "Finalizado ✅", id: "completed", value: "completed" }
];

// Contenido erótico
export const MANHWAWEB_EROTIC = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Sí 🔞", id: "yes", value: "yes" },
    { name: "No 👍", id: "no", value: "no" }
];

// Demografía
export const MANHWAWEB_DEMOGRAPHICS = [
    { name: "Ver todo", id: "all", value: "" },
    { name: "Seinen 🎯", id: "seinen", value: "seinen" },
    { name: "Shonen ⚡", id: "shonen", value: "shonen" },
    { name: "Josei 🌺", id: "josei", value: "josei" },
    { name: "Shojo 🌸", id: "shojo", value: "shojo" }
];

// Orden
export const MANHWAWEB_SORT_BY = [
    { name: "Alfabético", id: "alphabetic", value: "alphabetic" },
    { name: "Creación", id: "creation", value: "creation" },
    { name: "Núm. Capítulos", id: "chapters", value: "chapters" }
];

export const MANHWAWEB_SORT_ORDER = [
    { name: "DESC ⬇️", id: "desc", value: "desc" },
    { name: "ASC ⬆️", id: "asc", value: "asc" }
];

// Moods para ManhwaWeb (basados en sus géneros)
export const MANHWAWEB_MOODS = [
    {
        name: "Quiero llorar 😭",
        id: "cry",
        genres: ["drama", "tragedia"],
        toast: "Busca los pañuelos, que hoy se llora... 😭",
        color: "from-blue-400 to-blue-600"
    },
    {
        name: "Colapso de amor 😍",
        id: "love",
        genres: ["romance", "comedia"],
        toast: "Prepárate para el colapso de azúcar, divina... 😍",
        color: "from-pink-400 to-rose-600"
    },
    {
        name: "Chisme y traición 🐍",
        id: "tea",
        genres: ["drama", "psicologico"],
        toast: "Prepárate, que el chisme viene fuerte... 🐍☕",
        color: "from-indigo-400 to-purple-600"
    },
    {
        name: "¡A devorar! 💅",
        id: "devour",
        genres: ["accion", "fantasia", "superpoderes"],
        toast: "¡Poder total activado! Vas a devorar... 💅",
        color: "from-potaxie-green to-teal-600"
    },
    {
        name: "Noche de terror 🕯️",
        id: "fear",
        genres: ["horror", "thriller"],
        toast: "No mires atrás... el misterio te espera... 🕯️",
        color: "from-gray-700 to-gray-900"
    },
    {
        name: "Poder sin límites ⚡",
        id: "power",
        genres: ["sistema-niveles", "cultivacion", "reencarnacion"],
        toast: "¡Level up! Prepárate para el OP... ⚡",
        color: "from-yellow-400 to-orange-600"
    }
];
```

---

### 2. Crear Servicio Unificador de Filtros

**Archivo:** `src/services/filterService.js`

```javascript
import { 
    TUMANGA_GENRES, 
    TUMANGA_FORMATS, 
    TUMANGA_MOODS 
} from './tumanga';

import {
    MANHWAWEB_GENRES,
    MANHWAWEB_TYPES,
    MANHWAWEB_STATUS,
    MANHWAWEB_EROTIC,
    MANHWAWEB_DEMOGRAPHICS,
    MANHWAWEB_SORT_BY,
    MANHWAWEB_SORT_ORDER,
    MANHWAWEB_MOODS
} from './manhwawebFilters';

/**
 * Obtiene los filtros disponibles según la fuente
 */
export const getFiltersForSource = (source) => {
    if (source === 'tumanga') {
        return {
            genres: TUMANGA_GENRES,
            formats: TUMANGA_FORMATS,
            moods: TUMANGA_MOODS,
            hasAdvancedFilters: false
        };
    }
    
    if (source === 'manhwaweb') {
        return {
            genres: MANHWAWEB_GENRES,
            types: MANHWAWEB_TYPES,
            status: MANHWAWEB_STATUS,
            erotic: MANHWAWEB_EROTIC,
            demographics: MANHWAWEB_DEMOGRAPHICS,
            sortBy: MANHWAWEB_SORT_BY,
            sortOrder: MANHWAWEB_SORT_ORDER,
            moods: MANHWAWEB_MOODS,
            hasAdvancedFilters: true
        };
    }
    
    // Fallback a TuManga
    return getFiltersForSource('tumanga');
};

/**
 * Obtiene moods según la fuente
 */
export const getMoodsForSource = (source) => {
    const filters = getFiltersForSource(source);
    return filters.moods;
};
```

---

### 3. Actualizar Estado en App.jsx

**Cambios en App.jsx:**

```javascript
// ANTES
const [selectedGenres, setSelectedGenres] = useState([]);
const [selectedFormats, setSelectedFormats] = useState([]);
const [selectedMood, setSelectedMood] = useState(null);

// DESPUÉS
const [selectedGenres, setSelectedGenres] = useState([]);
const [selectedFormats, setSelectedFormats] = useState([]); // TuManga
const [selectedMood, setSelectedMood] = useState(null);

// NUEVO: Filtros específicos de ManhwaWeb
const [selectedType, setSelectedType] = useState('');
const [selectedStatus, setSelectedStatus] = useState('');
const [selectedErotic, setSelectedErotic] = useState('');
const [selectedDemographic, setSelectedDemographic] = useState('');
const [selectedSortBy, setSelectedSortBy] = useState('');
const [selectedSortOrder, setSelectedSortOrder] = useState('');

// Obtener filtros dinámicos según fuente
const currentFilters = getFiltersForSource(selectedSource);
```

---

### 4. Resetear Filtros al Cambiar Fuente

```javascript
const handleSourceChange = (sourceId) => {
    // Cambiar fuente
    setSelectedSource(sourceId);
    
    // Resetear TODOS los filtros
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedMood(null);
    setSelectedType('');
    setSelectedStatus('');
    setSelectedErotic('');
    setSelectedDemographic('');
    setSelectedSortBy('');
    setSelectedSortOrder('');
    setSearchResults([]);
    
    showToast(`Fuente cambiada a ${getSourceById(sourceId).name} ${getSourceById(sourceId).icon}`);
};
```

---

### 5. UI de Filtros Dinámicos

**En App.jsx (sección de filtros):**

```jsx
{/* Moods (ambas fuentes) */}
<div className="mb-6">
    <h4>¿Qué mood traes hoy? ✨</h4>
    <div className="flex flex-wrap gap-2">
        {currentFilters.moods.map(mood => (
            <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood)}
                className={`... ${selectedMood?.id === mood.id ? 'activo' : ''}`}
            >
                {mood.name}
            </button>
        ))}
    </div>
</div>

{/* Géneros (ambas fuentes) */}
<div className="mb-6">
    <h4>Géneros 🎯</h4>
    <div className="flex flex-wrap gap-2">
        {currentFilters.genres.map(genre => (
            <button
                key={genre.id}
                onClick={() => handleGenreToggle(genre.id)}
                className={`... ${selectedGenres.includes(genre.id) ? 'activo' : ''}`}
            >
                {genre.name}
            </button>
        ))}
    </div>
</div>

{/* Formatos (solo TuManga) */}
{selectedSource === 'tumanga' && (
    <div className="mb-6">
        <h4>Formato 📚</h4>
        <div className="flex flex-wrap gap-2">
            {currentFilters.formats.map(format => (
                <button key={format.id} ...>
                    {format.name}
                </button>
            ))}
        </div>
    </div>
)}

{/* Filtros Avanzados (solo ManhwaWeb) */}
{selectedSource === 'manhwaweb' && (
    <>
        {/* Tipo */}
        <div className="mb-6">
            <h4>Tipo 📋</h4>
            <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="..."
            >
                {currentFilters.types.map(type => (
                    <option key={type.id} value={type.value}>
                        {type.name}
                    </option>
                ))}
            </select>
        </div>
        
        {/* Estado */}
        <div className="mb-6">
            <h4>Estado 📝</h4>
            <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="..."
            >
                {currentFilters.status.map(status => (
                    <option key={status.id} value={status.value}>
                        {status.name}
                    </option>
                ))}
            </select>
        </div>
        
        {/* Erótico */}
        <div className="mb-6">
            <h4>Erótico 🔞</h4>
            <div className="flex gap-2">
                {currentFilters.erotic.map(option => (
                    <button
                        key={option.id}
                        onClick={() => setSelectedErotic(option.value)}
                        className={`... ${selectedErotic === option.value ? 'activo' : ''}`}
                    >
                        {option.name}
                    </button>
                ))}
            </div>
        </div>
        
        {/* Demografía */}
        <div className="mb-6">
            <h4>Demografía 🎯</h4>
            <div className="flex flex-wrap gap-2">
                {currentFilters.demographics.map(demo => (
                    <button
                        key={demo.id}
                        onClick={() => setSelectedDemographic(demo.value)}
                        className={`... ${selectedDemographic === demo.value ? 'activo' : ''}`}
                    >
                        {demo.name}
                    </button>
                ))}
            </div>
        </div>
        
        {/* Ordenar */}
        <div className="mb-6">
            <h4>Ordenar por 🔢</h4>
            <div className="flex gap-2">
                <select
                    value={selectedSortBy}
                    onChange={(e) => setSelectedSortBy(e.target.value)}
                    className="flex-1 ..."
                >
                    {currentFilters.sortBy.map(sort => (
                        <option key={sort.id} value={sort.value}>
                            {sort.name}
                        </option>
                    ))}
                </select>
                
                <select
                    value={selectedSortOrder}
                    onChange={(e) => setSelectedSortOrder(e.target.value)}
                    className="..."
                >
                    {currentFilters.sortOrder.map(order => (
                        <option key={order.id} value={order.value}>
                            {order.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    </>
)}
```

---

### 6. Actualizar Función de Búsqueda

```javascript
const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    // ... código existente de searchTerm ...
    
    setLoading(true);
    
    // Construir filtros según la fuente
    let filters = {};
    
    if (selectedSource === 'tumanga') {
        filters = {
            genres: selectedGenres,
            formats: selectedFormats
        };
    } else if (selectedSource === 'manhwaweb') {
        filters = {
            genres: selectedGenres,
            type: selectedType,
            status: selectedStatus,
            erotic: selectedErotic,
            demographic: selectedDemographic,
            sortBy: selectedSortBy,
            sortOrder: selectedSortOrder
        };
    }
    
    let results = await unifiedSearch(searchTerm, filters, selectedSource);
    
    // ... resto del código ...
};
```

---

### 7. Actualizar Oracle.jsx

Similar a App.jsx, el Oráculo debe obtener moods dinámicos:

```javascript
import { getMoodsForSource } from '../services/filterService';

// Dentro del componente
const currentMoods = getMoodsForSource(selectedSource);

// Renderizar
{currentMoods.map(mood => (
    <button key={mood.id} ...>
        {mood.name}
    </button>
))}
```

---

## 📦 Resumen de Archivos a Crear/Modificar

### Crear:
1. ✅ `src/services/manhwawebFilters.js` - Todos los filtros de ManhwaWeb
2. ✅ `src/services/filterService.js` - Unificador de filtros

### Modificar:
3. ✅ `src/App.jsx` - Agregar estados de filtros ManhwaWeb, UI dinámica
4. ✅ `src/components/Oracle.jsx` - Moods dinámicos
5. ✅ `src/services/manhwaweb.js` - `searchManhwaWeb` acepta nuevos filtros
6. ✅ `api/manhwaweb/search.js` - Puppeteer aplica filtros en búsqueda

---

## 🎯 Comportamiento Esperado

### Usuario selecciona TuManga 📚:
```
Filtros visibles:
✅ Moods (5)
✅ Géneros (21)
✅ Formatos (4)
```

### Usuario selecciona ManhwaWeb 🌐:
```
Filtros visibles:
✅ Moods (6 - incluye "Poder sin límites")
✅ Géneros (27)
✅ Tipo (Manhwa, Manga, etc.)
✅ Estado (Publicándose, Finalizado, etc.)
✅ Erótico (Sí/No)
✅ Demografía (Seinen, Shonen, etc.)
✅ Ordenar (Alfabético, Creación, etc.)
```

### Al cambiar de fuente:
```
1. Todos los filtros se resetean
2. UI cambia instantáneamente
3. Toast informa al usuario
4. Búsqueda se limpia
```

---

## 🚀 Implementación por Fases

### Fase 1: Base (Archivos y Estructura)
1. Crear `manhwawebFilters.js`
2. Crear `filterService.js`
3. Testing unitario

### Fase 2: UI Básica
1. Modificar App.jsx con filtros dinámicos
2. Implementar reset al cambiar fuente
3. Testing visual

### Fase 3: Integración Backend
1. Actualizar `searchManhwaWeb` para recibir filtros
2. Actualizar API de Puppeteer para aplicar filtros
3. Testing de búsqueda

### Fase 4: Oracle
1. Actualizar Oracle.jsx con moods dinámicos
2. Testing

### Fase 5: Pulido
1. Ajustes de UX
2. Animaciones
3. Testing completo

---

## ⏱️ Estimación

- **Fase 1:** 30 min
- **Fase 2:** 1 hora
- **Fase 3:** 1.5 horas (complejo, Puppeteer)
- **Fase 4:** 30 min
- **Fase 5:** 30 min

**Total:** ~4 horas de desarrollo

---

## 🎨 Diseño Visual

Los filtros de ManhwaWeb tendrán:
- **Selectores dropdown** para Tipo, Estado
- **Botones toggle** para Erótico, Demografía
- **Dual select** para Ordenar (criterio + dirección)
- **Mismo estilo** que filtros actuales (cohesión)

---

**¿Aprobamos este plan?** Si estás de acuerdo, empezamos con la Fase 1. 🥑✨
