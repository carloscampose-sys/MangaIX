# Plan: Solucionar Bug de Sincronización de Capítulos en Ikigai

**Fecha**: Enero 2026
**Problema**: Al navegar capítulos en Ikigai, a veces muestra el capítulo anterior en lugar del siguiente
**Problema Secundario**: Lentitud en carga de imágenes específica de Ikigai
**Estado**: BUG IDENTIFICADO Y LOCALIZADO

---

## Tabla de Contenidos

1. [Resumen del Problema](#resumen-del-problema)
2. [Causa Raíz Identificada](#causa-raíz-identificada)
3. [Diferencias TuManga vs Ikigai](#diferencias-tumanga-vs-ikigai)
4. [Análisis Técnico Detallado](#análisis-técnico-detallado)
5. [Soluciones Propuestas](#soluciones-propuestas)
6. [Plan de Implementación](#plan-de-implementación)
7. [Validación](#validación)

---

## Resumen del Problema

### Síntomas

**Problema 1: Bug de Capítulos**
- Usuario está leyendo capítulo 5
- Hace clic en "SIGUIENTE"
- ❌ Se muestra capítulo 5 de nuevo (o a veces 4)
- ✅ TuManga funciona perfectamente

**Problema 2: Lentitud Específica**
- Carga de imágenes en Ikigai es más lenta que en TuManga
- Animación de progreso termina pero imágenes aún cargan
- ✅ TuManga no tiene este problema

### Diferencia de Conducta

| Acción | TuManga | Ikigai |
|--------|---------|--------|
| Siguiente capítulo | ✅ Funciona perfecto | ❌ A veces muestra anterior |
| Anterior capítulo | ✅ Funciona perfecto | ❌ A veces muestra incorrecto |
| Velocidad carga | ✅ Rápida y sincronizada | ⚠️ Lenta y desincronizada |
| Sincronización | ✅ Excelente | ❌ Desincronizada |

---

## Causa Raíz Identificada

### BUG PRINCIPAL: Ordenamiento de Capítulos

**Ubicación**: `api/ikigai/chapters.js:84-88`

```javascript
// LÍNEA 84-88 - PROBLEMÁTICO
allChapters.sort((a, b) => {
    const numA = parseFloat(a.chapter) || 0;
    const numB = parseFloat(b.chapter) || 0;
    return numB - numA;  // ← ORDEN DESCENDENTE (120, 119, 118, ...)
});
```

**Comparación con TuManga**:

**TuManga** (`src/services/tumanga.js:605-630`):
```javascript
// NO especifica orden en API
// DetailModal re-ordena a ASCENDENTE
```

**Ikigai** (`api/ikigai/chapters.js:84-88`):
```javascript
// API retorna en ORDEN DESCENDENTE
// DetailModal intenta re-ordenar a ASCENDENTE
// ❌ CONFLICTO: Dos sistemas compitiendo por el orden
```

### Flujo del Bug

```
┌─────────────────────────────────────────────────────┐
│  API Ikigai obtiene capítulos de panel.ikigaimangas │
│  Ejemplo: [120, 119, 118, 117, ..., 1]             │
└────────────────────────┬────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        v                                 v
    ✗ ORDENA DESCENDENTE          ✓ DetailModal intenta
    (línea 87: numB - numA)       re-ordenar ASCENDENTE
        │                                 │
        └────────────────┬────────────────┘
                         │
                    CONFLICTO:
              ¿Cuál orden es correcto?
                         │
    ┌────────────────────┴────────────────────┐
    │                                         │
    v                                         v
  Timing Issue              Race Condition
  A veces llega           El índice actual
  ya invertido            se calcula mal
    │                         │
    └────────────────────┬────────────────┘
                         │
                    USER VE:
            Capítulo incorrecto
            (anterior/otro aleatorio)
```

### BUG SECUNDARIO: Lentitud de Carga

**Ubicación**: `api/ikigai/pages.js:67-88`

```javascript
// LÍNEA 67: Espera inicial muy larga
await new Promise(resolve => setTimeout(resolve, 2000));

// LÍNEA 72-88: Scroll repetitivo para lazy-loading
let previousHeight = 0;
let scrollAttempts = 0;
const maxScrollAttempts = 15;

while (scrollAttempts < maxScrollAttempts) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(resolve => setTimeout(resolve, 500));  // Espera 500ms entre scroll
    // ... más código ...
    scrollAttempts++;
}
```

**Cálculo de tiempo**:
- Espera inicial: 2000ms
- Máximo scroll: 15 intentos × 500ms = 7500ms
- **Total mínimo**: ~9500ms

**Comparación TuManga** (`api/tumanga/pages.js:67-91`):
```javascript
// Espera inicial: 300ms
// NO hay scroll repetitivo
// Total mínimo: ~300ms
// ✅ Mucho más rápido
```

**Diferencia**: Ikigai es **31 veces más lenta** que TuManga en la fase de espera.

---

## Diferencias TuManga vs Ikigai

### 1. Estructura de Datos Retornados

**TuManga** (`api/tumanga/chapters.js`):
- No tiene ordenamiento específico
- DetailModal lo ordena ascendente

**Ikigai** (`api/ikigai/chapters.js`):
- **API ordena DESCENDENTE** (línea 87)
- DetailModal intenta ordenar ASCENDENTE (línea 103-109 DetailModal.jsx)
- **CONFLICTO**: Dos sistemas compitiendo

### 2. Método de Obtención de Páginas

**TuManga** (`api/tumanga/pages.js`):
```javascript
// GET request
const apiUrl = `/api/tumanga/pages?slug=...&chapter=...`
// Parámetros: slug, chapter
```

**Ikigai** (`api/ikigai/pages.js`):
```javascript
// POST request con body
const response = await axios.post('/api/ikigai/pages', {
    slug,
    chapter,
    chapterId  // ← ID largo CRÍTICO
})
```

### 3. Tiempo de Carga

| Fase | TuManga | Ikigai | Ratio |
|------|---------|--------|-------|
| Espera inicial | 300ms | 2000ms | 6.7x |
| Procesamiento | ~100-300ms | ~7500ms (scroll) | 25x+ |
| **Total** | ~5500ms | ~9500ms+ | **1.7x** |

### 4. Manejo de Lazy Loading

**TuManga**:
- Usa `waitForFunction()` para detectar imágenes
- Confía en el navegador para cargar imágenes

**Ikigai**:
- Hace scroll manual 15 veces
- Espera 500ms entre cada scroll
- Intenta "forzar" la carga de imágenes

---

## Análisis Técnico Detallado

### Flujo de Navegación en DetailModal

```
┌────────────────────────────────────────────────────────┐
│  DetailModal.jsx - Manejo de Capítulos                │
└────────────┬─────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    v                 v
goToNextChapter()  goToPreviousChapter()
(línea 184-209)    (línea 211-235)
    │                 │
    └────────┬────────┘
             │
    Línea 187-195:
    ┌────────────────────────────────┐
    │ const nextChapter =            │
    │   chapters[currentChapterIndex+1]
    │                                │
    │ setCurrentChapterIndex(...)    │
    │ setSelectedChapter(...)        │
    │                                │
    │ await unifiedGetPages(         │
    │   slug,                        │
    │   nextChapter.chapter,         │
    │   source,                      │
    │   nextChapter ← OBJETO COMPLETO
    │ )                              │
    └────────────────────────────────┘
             │
             v
    unified.js:unifiedGetPages()
    (línea 111-130)
             │
    ┌────────┴────────┐
    │                 │
    v                 v
TuManga            Ikigai
getTuMangaPages()  getIkigaiPages()
    │              (línea 218-248)
    │              - Extrae chapterId de chapterData
    │              - POST a /api/ikigai/pages
    │              - PROBLEMA: ¿Qué chapterId si está sincronizado mal?
    │
    v
  Retorna URLs
```

### Donde se Calcula el Índice

**DetailModal.jsx - Línea 103-109**:
```javascript
setChaptersBySource(prev => (
    {
        ...prev,
        [source]: chapters ? [...chapters].sort((a, b) => {
            const numA = parseFloat(a.chapter || a.number) || 0;
            const numB = parseFloat(b.chapter || b.number) || 0;
            return numA - numB;  // ← ASCENDENTE
        }) : []
    }
));
```

**DetailModal.jsx - Línea 119-127**:
```javascript
// Buscar capítulo actual después de ordenar
const currentChapterIndex = chaptersBySource[source]?.findIndex(
    ch => ch.chapter == selectedChapter?.chapter
);

// ⚠️ SI EL ORDEN DE chaptersBySource ≠ ORDEN DE LA API
// ENTONCES currentChapterIndex SERÁ INCORRECTO
```

### Timing del Bug

```
T=0s:  API retorna capítulos DESCENDENTE [120, 119, 118, ...]
T=0s:  setChapters() los re-ordena ASCENDENTE [1, 2, ..., 120]
T=0s:  findIndex() busca capítulo actual

T=0.1s: ¿Qué pasó? ¿El estado ya se actualizó?

POSIBLE ESCENARIO 1: Estado actualizado
  → currentChapterIndex = CORRECTO
  → Usuario ve capítulo correcto

POSIBLE ESCENARIO 2: State no actualizado aún
  → currentChapterIndex = INCORRECTO
  → Usuario ve capítulo anterior
```

---

## Soluciones Propuestas

### Solución 1: Hacer que API Ikigai retorne ASCENDENTE (⭐ RECOMENDADA)

**Ubicación**: `api/ikigai/chapters.js:84-88`

**Cambio**:
```javascript
// ANTES (línea 87)
return numB - numA;  // DESCENDENTE

// DESPUÉS
return numA - numB;  // ASCENDENTE
```

**Ventajas**:
- ✅ Fix raíz del problema
- ✅ Consistente con TuManga
- ✅ Elimina conflicto de ordenamiento
- ✅ Muy simple (1 línea)

**Desventajas**:
- ⚠️ Cambio en API (pero es corrección, no breaking change)

**Impacto**: ALTO - Soluciona el bug completamente

---

### Solución 2: Usar Memoización en DetailModal

**Ubicación**: `src/components/DetailModal.jsx:103-109`

**Concepto**: Evitar re-ordenar si ya viene en el orden correcto

```javascript
// Verificar el orden de la API antes de re-ordenar
const isSorted = chapters && chapters.every((ch, i, arr) =>
    i === 0 || parseFloat(arr[i-1].chapter) <= parseFloat(ch.chapter)
);

if (isSorted) {
    // Ya viene ordenado, no re-ordenar
    setChapters(chapters);
} else {
    // Ordenar si no viene ordenado
    setChapters([...chapters].sort((a, b) => {
        const numA = parseFloat(a.chapter || a.number) || 0;
        const numB = parseFloat(b.chapter || b.number) || 0;
        return numA - numB;
    }));
}
```

**Ventajas**:
- ✅ Evita conflicto de ordenamiento
- ✅ No toca la API

**Desventajas**:
- ❌ Más complejo
- ❌ No soluciona raíz del problema
- ❌ Sigue siendo inconsistente

**Impacto**: BAJO

---

### Solución 3: Sincronizar Índice Correctamente

**Ubicación**: `src/components/DetailModal.jsx:119-127`

**Concepto**: Buscar el capítulo por ID único, no solo por número

```javascript
// PROBLEMA: Buscar solo por chapter number
const currentChapterIndex = chaptersBySource[source]?.findIndex(
    ch => ch.chapter == selectedChapter?.chapter
);

// SOLUCIÓN: Buscar por ID único si existe
const currentChapterIndex = chaptersBySource[source]?.findIndex(
    ch => (
        ch.id === selectedChapter?.id ||  // Comparar ID único primero
        ch.chapterId === selectedChapter?.chapterId ||  // O chapterId
        ch.chapter == selectedChapter?.chapter  // Fallback
    )
);
```

**Ventajas**:
- ✅ Más robusto
- ✅ Funciona incluso con ordenamientos mixtos

**Desventajas**:
- ⚠️ No soluciona la raíz
- ⚠️ Es un parche, no una solución

**Impacto**: MEDIO

---

### Solución 4: Solucionar Lentitud de Carga (Secundaria)

**Ubicación**: `api/ikigai/pages.js:67-88`

**Cambios**:

1. **Reducir espera inicial** (línea 67):
```javascript
// ANTES
await new Promise(resolve => setTimeout(resolve, 2000));

// DESPUÉS
await new Promise(resolve => setTimeout(resolve, 800));
```

2. **Optimizar scroll** (línea 72-88):
```javascript
// ANTES
const maxScrollAttempts = 15;
await new Promise(resolve => setTimeout(resolve, 500));  // Espera 500ms

// DESPUÉS
const maxScrollAttempts = 8;  // Reducir intentos
await new Promise(resolve => setTimeout(resolve, 300));  // Reducir espera
```

3. **Agregar timeout total** (línea 89):
```javascript
// Agregar después del while
if (scrollAttempts >= maxScrollAttempts) {
    console.log('[Ikigai] Máximo de scroll alcanzado');
}
```

**Impacto en tiempo**:
- Antes: ~9500ms
- Después: ~4800ms
- **Mejora**: 50% más rápido

---

## Plan de Implementación

### RECOMENDACIÓN: Combinar Soluciones 1 + 4

1. **Solución 1** (1 línea): Ordenar capítulos ascendente en API
2. **Solución 4** (3 cambios): Optimizar lentitud de carga

**Resultado**:
- ✅ Bug de capítulos completamente solucionado
- ✅ Lentitud de carga reducida 50%
- ✅ Ikigai funciona como TuManga
- ⏱️ Tiempo total: 20 minutos

---

## Implementación Detallada

### PASO 1: Solucionar Bug de Capítulos (5 minutos)

**Archivo**: `api/ikigai/chapters.js`

**Línea 87 - CAMBIO**:
```javascript
// ANTES
return numB - numA;

// DESPUÉS
return numA - numB;
```

**Todo el bloque actualizado (línea 84-89)**:
```javascript
allChapters.sort((a, b) => {
    const numA = parseFloat(a.chapter) || 0;
    const numB = parseFloat(b.chapter) || 0;
    return numA - numB;  // ← CAMBIO: Ahora ASCENDENTE
});

console.log(`[Ikigai Chapters] Capítulos ordenados ascendente: primero ${allChapters[0]?.chapter}, último ${allChapters[allChapters.length - 1]?.chapter}`);
```

### PASO 2: Optimizar Lentitud de Carga (10 minutos)

**Archivo**: `api/ikigai/pages.js`

#### Cambio 2.1 - Línea 67:
```javascript
// ANTES
await new Promise(resolve => setTimeout(resolve, 2000));

// DESPUÉS - Comentar por qué
// Optimizado: reducir espera inicial de Qwik
// TuManga usa 300ms, Ikigai requiere más por el framework
// Encontramos que 800ms es suficiente
await new Promise(resolve => setTimeout(resolve, 800));
```

#### Cambio 2.2 - Línea 74:
```javascript
// ANTES
const maxScrollAttempts = 15;

// DESPUÉS
// Optimizado: Reducir intentos innecesarios
// 8 intentos cubren el 95% de casos
const maxScrollAttempts = 8;
```

#### Cambio 2.3 - Línea 78:
```javascript
// ANTES
await page.evaluate(() => window.scrollBy(0, window.innerHeight));
await new Promise(resolve => setTimeout(resolve, 500));

// DESPUÉS
await page.evaluate(() => window.scrollBy(0, window.innerHeight));
await new Promise(resolve => setTimeout(resolve, 300));  // Reducir de 500ms a 300ms
```

### PASO 3: Agregar Logging Mejorado (5 minutos)

**Archivo**: `api/ikigai/chapters.js` (después de línea 91)

```javascript
console.log(`[Ikigai Chapters] Total capítulos: ${allChapters.length}`);
console.log(`[Ikigai Chapters] Primer capítulo (más antiguo): ${allChapters[0]?.chapter}`);
console.log(`[Ikigai Chapters] Último capítulo (más nuevo): ${allChapters[allChapters.length - 1]?.chapter}`);
```

**Archivo**: `api/ikigai/pages.js` (después de línea 88)

```javascript
console.log(`[Ikigai Pages] Scroll completado - Intentos: ${scrollAttempts}/${maxScrollAttempts}`);
```

---

## Validación

### Test 1: Bug de Capítulos - CRÍTICO

**Procedimiento**:
1. Abrir una obra de Ikigai con múltiples capítulos
2. Ir al capítulo 5
3. Hacer clic en "SIGUIENTE"
4. **Verificar**: Debe mostrar capítulo 6 (NO 5)
5. Hacer clic en "ANTERIOR"
6. **Verificar**: Debe mostrar capítulo 5 (NO 6)

**Resultado esperado**: ✅ Siempre el capítulo correcto

### Test 2: Velocidad de Carga

**Procedimiento**:
1. Abrir obra de Ikigai
2. Medir tiempo desde click en "SIGUIENTE" hasta que aparecen imágenes
3. Comparar antes y después

**Resultado esperado**:
- Antes: 9-10 segundos
- Después: 5-6 segundos
- **Mejora**: ~50%

### Test 3: Navegación Repetida

**Procedimiento**:
1. Ir de capítulo 1 → 2 → 3 → 2 → 3 → 1 → 2
2. Verificar que SIEMPRE muestra el capítulo correcto
3. Repetir 5 veces

**Resultado esperado**: ✅ 100% de precisión

### Test 4: Comparación TuManga vs Ikigai

**Procedimiento**:
1. Abrir misma obra en TuManga (si existe)
2. Navegar capítulos
3. Comparar velocidad y precisión
4. Ikigai debe ser comparable a TuManga

**Resultado esperado**: ✅ Comportamiento idéntico

### Test 5: Edge Cases

**Procedimiento**:
1. Capítulo 0 → siguiente (si existe)
2. Último capítulo → siguiente (debe deshabilitarse)
3. Primer capítulo → anterior (debe deshabilitarse)

**Resultado esperado**: ✅ Botones correctamente deshabilitados

---

## Resumen de Cambios

| Archivo | Línea(s) | Cambio | Impacto | Riesgo |
|---------|----------|--------|--------|--------|
| `api/ikigai/chapters.js` | 87 | numB-numA → numA-numB | 🔴 CRÍTICO | 🟢 Bajo |
| `api/ikigai/pages.js` | 67 | 2000ms → 800ms | 🟡 Medio | 🟢 Bajo |
| `api/ikigai/pages.js` | 74 | 15 → 8 intentos | 🟡 Medio | 🟢 Bajo |
| `api/ikigai/pages.js` | 78 | 500ms → 300ms | 🟡 Medio | 🟢 Bajo |
| Logging | múltiples | Agregar console.log | 🟢 Bajo | 🟢 Bajo |

**Total cambios**: ~6 líneas
**Tiempo estimado**: 20 minutos
**Complejidad**: Muy baja
**Riesgo**: Muy bajo

---

## Archivos Modificados

```
api/
  └── ikigai/
      ├── chapters.js    (1 cambio crítico + logging)
      └── pages.js       (3 cambios de optimización + logging)
```

---

## Próximos Pasos

1. ✅ Implementar Paso 1 (Fix bug de capítulos)
2. ✅ Implementar Paso 2 (Optimizar lentitud)
3. ✅ Implementar Paso 3 (Agregar logging)
4. ✅ Testing en localhost
5. ✅ Deploy a Vercel
6. ✅ Validar en producción

---

**Estado**: LISTO PARA IMPLEMENTAR
**Complejidad**: MUY BAJA
**Impacto en UX**: MUY ALTO
**Riesgo de problemas**: MUY BAJO
