# 📋 Plan FASE 5: UI de Ordenamiento y Paginación para TuManga

**Fecha**: 23 de diciembre de 2025
**Estado**: 🔄 Pendiente de implementación
**Archivos a modificar**: `src/App.jsx`
**Dependencias**: ✅ Fases 1-4 completadas

---

## 🎯 Objetivo

Implementar la interfaz de usuario para los controles de **ordenamiento** (sortBy, sortOrder) y **paginación** específicos para TuManga, permitiendo al usuario:

1. **Ordenar resultados** por Título, Año o Fecha Añadido
2. **Seleccionar orden** Ascendente o Descendente
3. **Navegar entre páginas** con botones Anterior/Siguiente
4. **Ver indicadores** de página actual y disponibilidad de más páginas

---

## 📊 Estado Actual vs Estado Deseado

### ❌ Estado Actual
```javascript
// App.jsx tiene:
- ✅ Paginación implementada (líneas 39, 285-310, 844-911)
- ✅ Estados: currentPage, hasMorePages
- ✅ Funciones: goToNextPage(), goToPreviousPage()
- ❌ NO tiene estados para sortBy y sortOrder de TuManga
- ❌ NO tiene UI de selectores de ordenamiento para TuManga
- ❌ Los filtros solo incluyen genres y formats para TuManga
```

### ✅ Estado Deseado
```javascript
// App.jsx tendrá:
- ✅ Estados: selectedTuMangaSortBy, selectedTuMangaSortOrder
- ✅ UI: Selectores de ordenamiento en panel de filtros (solo TuManga)
- ✅ handleSearch incluye sortBy y sortOrder en filtros de TuManga
- ✅ Reset de página al cambiar ordenamiento
- ✅ Paginación ya funcional (solo necesita integración)
```

---

## 🔍 Análisis del Código Actual

### Líneas Relevantes en App.jsx

#### Estados Actuales (líneas 19-40)
```javascript
const [selectedGenres, setSelectedGenres] = useState([]);
const [selectedFormats, setSelectedFormats] = useState([]);
const [selectedMood, setSelectedMood] = useState(null);
const [selectedSource, setSelectedSource] = useState(DEFAULT_SOURCE);

// Estados de ManhwaWeb
const [selectedType, setSelectedType] = useState('');
const [selectedStatus, setSelectedStatus] = useState('');
// ...

// Estado de paginación (✅ ya existe)
const [currentPage, setCurrentPage] = useState(1);
const [hasMorePages, setHasMorePages] = useState(false);
```

#### Construcción de Filtros (líneas 166-183)
```javascript
if (selectedSource === 'tumanga') {
    filters = {
        genres: selectedGenres,
        formats: selectedFormats
        // ❌ FALTA: sortBy, sortOrder
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
```

#### clearFilters (líneas 336-349)
```javascript
const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedMood(null);
    setSearchQuery('');
    // Limpiar filtros de ManhwaWeb también
    setSelectedType('');
    // ...
    setCurrentPage(1); // ✅ Ya resetea página
    // ❌ FALTA: resetear sortBy y sortOrder de TuManga
};
```

---

## 📝 Plan de Implementación Paso a Paso

### PASO 1: Agregar Estados de Ordenamiento para TuManga

**Ubicación**: Después de la línea 36 en `App.jsx`

**Código a agregar**:
```javascript
// Estados de ordenamiento específicos de TuManga
const [selectedTuMangaSortBy, setSelectedTuMangaSortBy] = useState('title');
const [selectedTuMangaSortOrder, setSelectedTuMangaSortOrder] = useState('asc');
```

**Razón**: Separar los estados de TuManga de ManhwaWeb para evitar conflictos

---

### PASO 2: Importar Constantes de Ordenamiento

**Ubicación**: Línea 10 (imports)

**Código actual**:
```javascript
import { searchTuManga, TUMANGA_GENRES, TUMANGA_FORMATS, TUMANGA_MOODS } from './services/tumanga';
```

**Código modificado**:
```javascript
import {
    searchTuManga,
    TUMANGA_GENRES,
    TUMANGA_FORMATS,
    TUMANGA_MOODS,
    TUMANGA_SORT_BY,      // ⬅️ NUEVO
    TUMANGA_SORT_ORDER    // ⬅️ NUEVO
} from './services/tumanga';
```

---

### PASO 3: Modificar Construcción de Filtros en handleSearch

**Ubicación**: Líneas 168-172

**Código actual**:
```javascript
if (selectedSource === 'tumanga') {
    filters = {
        genres: selectedGenres,
        formats: selectedFormats
    };
}
```

**Código modificado**:
```javascript
if (selectedSource === 'tumanga') {
    filters = {
        genres: selectedGenres,
        formats: selectedFormats,
        sortBy: selectedTuMangaSortBy,      // ⬅️ NUEVO
        sortOrder: selectedTuMangaSortOrder // ⬅️ NUEVO
    };
}
```

---

### PASO 4: Actualizar clearFilters

**Ubicación**: Líneas 336-349

**Código a agregar** (después de `setSelectedMood(null);`):
```javascript
// Resetear ordenamiento de TuManga
setSelectedTuMangaSortBy('title');
setSelectedTuMangaSortOrder('asc');
```

---

### PASO 5: Actualizar Reset al Cambiar Fuente

**Ubicación**: Líneas 461-482 (botones de fuente)

**Código actual**:
```javascript
setSelectedSource(source.id);
setSearchResults([]);
setSelectedGenres([]);
setSelectedFormats([]);
setSelectedMood(null);
setSelectedType('');
// ...
setCurrentPage(1);
```

**Código a agregar** (después de `setSelectedMood(null);`):
```javascript
// Resetear ordenamiento de TuManga
setSelectedTuMangaSortBy('title');
setSelectedTuMangaSortOrder('asc');
```

---

### PASO 6: Agregar UI de Ordenamiento en Panel de Filtros

**Ubicación**: Después de la sección de Formatos (línea ~620), antes de Géneros

**Código a agregar**:
```jsx
{/* Ordenamiento (solo TuManga) */}
{selectedSource === 'tumanga' && (
    <div>
        <div className="flex items-center gap-2 mb-4 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Ordenar Resultados</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Selector de criterio (Título, Año, Fecha) */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Ordenar por
                </label>
                <select
                    value={selectedTuMangaSortBy}
                    onChange={(e) => {
                        setSelectedTuMangaSortBy(e.target.value);
                        setCurrentPage(1); // Reset página al cambiar orden
                    }}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-white/50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-indigo-300"
                >
                    {TUMANGA_SORT_BY.map(sort => (
                        <option key={sort.id} value={sort.value}>
                            {sort.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Selector de orden (ASC/DESC) */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Orden
                </label>
                <select
                    value={selectedTuMangaSortOrder}
                    onChange={(e) => {
                        setSelectedTuMangaSortOrder(e.target.value);
                        setCurrentPage(1); // Reset página al cambiar orden
                    }}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-white/50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-indigo-300"
                >
                    {TUMANGA_SORT_ORDER.map(order => (
                        <option key={order.id} value={order.value}>
                            {order.icon} {order.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* Indicador visual del orden actual */}
        <div className="mt-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-2">
                <span className="text-base">
                    {TUMANGA_SORT_ORDER.find(o => o.value === selectedTuMangaSortOrder)?.icon || '↑'}
                </span>
                Ordenando por{' '}
                <span className="text-indigo-900 dark:text-indigo-200">
                    {TUMANGA_SORT_BY.find(s => s.value === selectedTuMangaSortBy)?.name || 'Título'}
                </span>
                {' '}
                <span className="lowercase">
                    {selectedTuMangaSortOrder === 'asc' ? '(A→Z)' : '(Z→A)'}
                </span>
            </p>
        </div>
    </div>
)}
```

**Posición exacta**: Entre la sección de Formatos (línea ~620) y Géneros (línea ~623)

---

### PASO 7: Mejorar Indicador de Paginación Existente

**Ubicación**: Líneas 851-864 (información de paginación)

**Código actual**:
```javascript
<div className="text-xs text-gray-500 dark:text-gray-400 font-bold text-center">
    Mostrando {searchResults.length} manhwas en esta página
    {hasMorePages && (
        <span className="text-potaxie-green ml-1 block sm:inline">
            • Continúa navegando para ver más 📚
        </span>
    )}
    {!hasMorePages && currentPage > 1 && (
        <span className="text-gray-400 ml-1 block sm:inline">
            • Has llegado al final 🎉
        </span>
    )}
</div>
```

**Código mejorado** (agregar información de orden):
```javascript
<div className="text-xs text-gray-500 dark:text-gray-400 font-bold text-center space-y-1">
    <div>
        Mostrando {searchResults.length} manhwas en página {currentPage}
    </div>

    {/* Indicador de orden (solo TuManga) */}
    {selectedSource === 'tumanga' && (
        <div className="text-indigo-600 dark:text-indigo-400">
            {TUMANGA_SORT_ORDER.find(o => o.value === selectedTuMangaSortOrder)?.icon || '↑'}
            {' '}
            Ordenado por{' '}
            {TUMANGA_SORT_BY.find(s => s.value === selectedTuMangaSortBy)?.name || 'Título'}
        </div>
    )}

    {hasMorePages && (
        <span className="text-potaxie-green block">
            • Continúa navegando para ver más 📚
        </span>
    )}
    {!hasMorePages && currentPage > 1 && (
        <span className="text-gray-400 block">
            • Has llegado al final 🎉
        </span>
    )}
</div>
```

---

## 🎨 Diseño Visual de la UI

### Sección de Ordenamiento

```
┌─────────────────────────────────────────────────┐
│ • Ordenar Resultados                             │
├─────────────────────────────────────────────────┤
│                                                  │
│  Ordenar por              Orden                  │
│  ┌──────────────┐        ┌──────────────┐       │
│  │ Título     ▼ │        │ ↑ Ascend... ▼│       │
│  └──────────────┘        └──────────────┘       │
│                                                  │
│  ┌─────────────────────────────────────┐        │
│  │ ↑ Ordenando por Título (A→Z)        │        │
│  └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Indicador en Paginación

```
┌─────────────────────────────────────────────────┐
│      Mostrando 24 manhwas en página 2           │
│      ↑ Ordenado por Fecha Añadido               │
│      • Continúa navegando para ver más 📚       │
│                                                  │
│   [← Anterior]  [ Página 2+ ]  [Siguiente →]   │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Testing y Validación

### Checklist de Pruebas

#### Funcionalidad de Ordenamiento
- [ ] Seleccionar "Título" + "Ascendente" → Buscar → Verificar orden A-Z
- [ ] Seleccionar "Título" + "Descendente" → Buscar → Verificar orden Z-A
- [ ] Seleccionar "Año" + "Ascendente" → Buscar → Verificar orden por año
- [ ] Seleccionar "Fecha Añadido" + "Descendente" → Verificar más recientes primero
- [ ] Cambiar ordenamiento mientras hay resultados → Verificar que se ejecuta nueva búsqueda
- [ ] Verificar que página se resetea a 1 al cambiar ordenamiento

#### Funcionalidad de Paginación (ya implementada)
- [ ] Página 1 → Ver resultados
- [ ] Click "Siguiente" → Ir a página 2
- [ ] Click "Anterior" → Volver a página 1
- [ ] Botón "Anterior" deshabilitado en página 1
- [ ] Botón "Siguiente" deshabilitado cuando no hay más páginas

#### Integración Completa
- [ ] Seleccionar géneros + ordenamiento → Buscar → Verificar resultados correctos
- [ ] Seleccionar géneros + ordenamiento + navegar páginas → Todo funciona
- [ ] Cambiar fuente a ManhwaWeb → Verificar que ordenamiento de TuManga desaparece
- [ ] Volver a TuManga → Verificar que ordenamiento reaparece con valores por defecto
- [ ] Click "Resetear Todo" → Verificar que ordenamiento vuelve a "Título/Ascendente"

#### UI/UX
- [ ] Selectores se ven bien en móvil
- [ ] Selectores se ven bien en desktop
- [ ] Indicador de orden actual es visible y claro
- [ ] Transiciones suaves al cambiar orden
- [ ] No hay saltos visuales al cambiar valores

---

## 📋 Resumen de Cambios

### Estados Nuevos (2)
```javascript
const [selectedTuMangaSortBy, setSelectedTuMangaSortBy] = useState('title');
const [selectedTuMangaSortOrder, setSelectedTuMangaSortOrder] = useState('asc');
```

### Imports Nuevos (2)
```javascript
TUMANGA_SORT_BY
TUMANGA_SORT_ORDER
```

### Modificaciones de Código (4 lugares)
1. **handleSearch** - Agregar sortBy y sortOrder a filtros
2. **clearFilters** - Resetear estados de ordenamiento
3. **Cambio de fuente** - Resetear estados de ordenamiento
4. **Indicador de paginación** - Mostrar orden actual

### UI Nueva (2 secciones)
1. **Panel de filtros** - Selectores de ordenamiento (~80 líneas)
2. **Indicador en paginación** - Info de orden actual (~10 líneas)

---

## 📊 Estimación de Tiempo

| Tarea | Tiempo | Complejidad |
|-------|--------|-------------|
| PASO 1: Agregar estados | 2 min | Baja |
| PASO 2: Importar constantes | 1 min | Baja |
| PASO 3: Modificar handleSearch | 3 min | Baja |
| PASO 4: Actualizar clearFilters | 2 min | Baja |
| PASO 5: Reset al cambiar fuente | 2 min | Baja |
| PASO 6: Agregar UI ordenamiento | 15 min | Media |
| PASO 7: Mejorar indicador | 5 min | Baja |
| **Testing completo** | 15 min | Media |
| **TOTAL** | **45 min** | **Media** |

---

## 🚀 Orden de Ejecución Recomendado

### Opción 1: Incremental (Recomendado)
1. ✅ PASO 1 → PASO 2 → PASO 3 (Backend lógico)
2. ✅ PASO 4 → PASO 5 (Limpieza de estados)
3. ✅ PASO 6 (UI principal)
4. ✅ PASO 7 (UI secundaria)
5. ✅ Testing completo

### Opción 2: Backend primero
1. ✅ PASO 1, 2, 3, 4, 5 (Todo el backend)
2. ✅ PASO 6, 7 (Todo el frontend)
3. ✅ Testing

---

## 🎯 Resultado Final Esperado

### Antes ❌
```
TuManga:
- ✅ 47 géneros
- ✅ Paginación funcional
- ❌ Sin controles de ordenamiento en UI
- ❌ Siempre ordena por defecto (título ASC)
```

### Después ✅
```
TuManga:
- ✅ 47 géneros
- ✅ Paginación funcional
- ✅ Selectores de ordenamiento en UI
- ✅ 3 opciones: Título, Año, Fecha
- ✅ 2 modos: Ascendente, Descendente
- ✅ Indicadores visuales de orden actual
- ✅ Reset automático de página al cambiar orden
```

---

## 💡 Mejoras Adicionales (Opcionales)

### Mejora 1: Guardar Preferencias en LocalStorage
```javascript
useEffect(() => {
    if (selectedSource === 'tumanga') {
        localStorage.setItem('tumanga_sort', JSON.stringify({
            sortBy: selectedTuMangaSortBy,
            sortOrder: selectedTuMangaSortOrder
        }));
    }
}, [selectedTuMangaSortBy, selectedTuMangaSortOrder, selectedSource]);
```

### Mejora 2: Botones en vez de Selects (más visual)
```jsx
<div className="flex gap-2">
    {TUMANGA_SORT_BY.map(sort => (
        <button
            key={sort.id}
            onClick={() => setSelectedTuMangaSortBy(sort.value)}
            className={selectedTuMangaSortBy === sort.value ? 'active' : ''}
        >
            {sort.name}
        </button>
    ))}
</div>
```

### Mejora 3: Animación al Cambiar Orden
```jsx
<motion.div
    key={selectedTuMangaSortBy}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
>
    {/* Indicador de orden */}
</motion.div>
```

---

## 🔄 Compatibilidad

### ManhwaWeb
- ✅ No afectado (usa sus propios estados `selectedSortBy` y `selectedSortOrder`)
- ✅ UI de ordenamiento solo aparece para TuManga

### TuManga
- ✅ Backend ya preparado (Fases 1-4)
- ✅ Solo falta la UI

### Sistema Unificado
- ✅ `unifiedSearch` ya recibe los filtros correctamente
- ✅ No requiere cambios adicionales

---

## 📝 Notas Importantes

1. **Estados Separados**: Usamos `selectedTuMangaSortBy` en vez de reutilizar `selectedSortBy` de ManhwaWeb para evitar conflictos

2. **Reset de Página**: Es CRÍTICO resetear `currentPage` a 1 al cambiar el ordenamiento, o el usuario podría quedarse en una página que no existe

3. **Valores por Defecto**: Usar 'title' y 'asc' como valores iniciales (coincide con backend)

4. **Condicional en UI**: Usar `{selectedSource === 'tumanga' && ...}` para mostrar controles solo en TuManga

5. **Paginación Ya Funciona**: No hay que modificar la paginación, solo integrar el ordenamiento

---

## 🎉 Beneficios de la Implementación

1. ✅ **UX Mejorada**: Usuario puede ordenar resultados como prefiera
2. ✅ **Búsqueda Precisa**: Combinación de géneros + orden = resultados óptimos
3. ✅ **Navegación Fluida**: Paginación + ordenamiento = exploración completa
4. ✅ **Consistencia**: Misma experiencia que ManhwaWeb (que ya tiene ordenamiento)
5. ✅ **Reutilizable**: Estructura preparada para futuras fuentes

---

**Estado**: 📋 Plan completo y listo para implementar
**Complejidad**: Media
**Riesgo**: Bajo (cambios aislados en UI)
**Impacto**: Alto (completa el sistema de filtros)
**Prioridad**: Alta (última pieza del puzzle)

**Siguiente**: Ejecutar los 7 pasos en orden y hacer testing completo
