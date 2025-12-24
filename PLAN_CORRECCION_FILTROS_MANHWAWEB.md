# 📋 Plan: Corrección Completa de Filtros ManhwaWeb

**Fecha**: 23 de diciembre de 2025
**Objetivo**: Corregir todos los valores de filtros para que coincidan con la API real de ManhwaWeb
**Archivo a modificar**: `manhwawebFilters.js`

---

## 🎯 Problemas Identificados

Basándose en las URLs reales de ManhwaWeb, se encontraron los siguientes errores:

### 1. **TIPO** - Valores Incorrectos

| Filtro | Valor Actual ❌ | Valor Correcto ✅ |
|--------|----------------|------------------|
| Ver todo | "" | "" ✓ |
| Manhwa | "manhwa" | "manhwa" ✓ |
| Manga | "manga" | "manga" ✓ |
| Manhua | "manhua" | "manhua" ✓ |
| Doujinshi | "doujinshi" | "doujinshi" ✓ |
| Novela | "novela" | "novela" ✓ |
| One shot | "oneshot" | **"one_shot"** (con guión bajo) |

### 2. **ESTADO** - Valores Incorrectos

| Filtro | Valor Actual ❌ | Valor Correcto ✅ |
|--------|----------------|------------------|
| Ver todo | "" | "" ✓ |
| Publicándose | "ongoing" | **"publicandose"** (sin tilde) |
| Pausado | "paused" | **"pausado"** ✓ |
| Finalizado | "completed" | **"finalizado"** |

### 3. **ERÓTICO** - Valores Incorrectos

| Filtro | Valor Actual ❌ | Valor Correcto ✅ |
|--------|----------------|------------------|
| Ver todo | "" | "" ✓ |
| Sí | "yes" | **"si"** (español) |
| No | "no" | "no" ✓ |

### 4. **DEMOGRAFÍA** - Valores Correctos ✓

| Filtro | Valor Actual | Estado |
|--------|--------------|--------|
| Ver todo | "" | ✓ |
| Seinen | "seinen" | ✓ |
| Shonen | "shonen" | ✓ |
| Josei | "josei" | ✓ |
| Shojo | "shojo" | ✓ |

### 5. **ORDENAR POR** - Valores Incorrectos

| Filtro | Valor Actual ❌ | Valor Correcto ✅ |
|--------|----------------|------------------|
| **Criterio...** (default) | - | **ELIMINAR** |
| Alfabético | "alphabetic" | **"alfabetico"** |
| Creación | "creation" | **"creacion"** |
| Núm. Capítulos | "chapters" | **"num_chapter"** (con guión bajo) |

### 6. **ORDEN (ASC/DESC)** - Correctos ✓

| Filtro | Valor Actual | Estado |
|--------|--------------|--------|
| DESC ⬇️ | "desc" | ✓ |
| ASC ⬆️ | "asc" | ✓ |

---

## 📝 Plan de Corrección (5 Pasos)

### PASO 1: Corregir MANHWAWEB_TYPES

**Ubicación**: `manhwawebFilters.js` líneas 41-49

**Cambio**:
```javascript
// ANTES
{ name: "One shot ⭐", id: "oneshot", value: "oneshot" }

// DESPUÉS
{ name: "One shot ⭐", id: "oneshot", value: "one_shot" }  // Con guión bajo
```

---

### PASO 2: Corregir MANHWAWEB_STATUS

**Ubicación**: `manhwawebFilters.js` líneas 52-57

**Cambios**:
```javascript
// ANTES
{ name: "Publicándose 📝", id: "ongoing", value: "ongoing" },
{ name: "Finalizado ✅", id: "completed", value: "completed" }

// DESPUÉS
{ name: "Publicándose 📝", id: "ongoing", value: "publicandose" },  // Sin tilde
{ name: "Finalizado ✅", id: "completed", value: "finalizado" }     // En español
```

---

### PASO 3: Corregir MANHWAWEB_EROTIC

**Ubicación**: `manhwawebFilters.js` líneas 60-64

**Cambio**:
```javascript
// ANTES
{ name: "Sí 🔞", id: "yes", value: "yes" },

// DESPUÉS
{ name: "Sí 🔞", id: "yes", value: "si" },  // En español
```

---

### PASO 4: Corregir MANHWAWEB_SORT_BY

**Ubicación**: `manhwawebFilters.js` líneas 76-80

**Cambios**:
```javascript
// ANTES
export const MANHWAWEB_SORT_BY = [
    { name: "Alfabético", id: "alphabetic", value: "alphabetic" },
    { name: "Creación", id: "creation", value: "creation" },
    { name: "Núm. Capítulos", id: "chapters", value: "chapters" }
];

// DESPUÉS
export const MANHWAWEB_SORT_BY = [
    { name: "Alfabético", id: "alfabetico", value: "alfabetico" },        // Sin tilde
    { name: "Creación", id: "creacion", value: "creacion" },              // Sin tilde
    { name: "Núm. Capítulos", id: "num_chapter", value: "num_chapter" }   // Con guión bajo
];
```

---

### PASO 5: Actualizar Estado Inicial en App.jsx

**Ubicación**: `App.jsx` línea ~35-36

**Cambio**:
```javascript
// ANTES
const [selectedSortBy, setSelectedSortBy] = useState('');  // Vacío (muestra "Criterio...")

// DESPUÉS
const [selectedSortBy, setSelectedSortBy] = useState('alfabetico');  // Por defecto alfabético
```

---

## 🌐 URLs Resultantes

### Ejemplo: Romance + Comedia, Manhwa, Publicándose, Erótico Sí, Alfabético DESC

**Antes** (valores incorrectos):
```
/library?buscar=&tipo=manhwa&demografia=&estado=ongoing&erotico=yes&genders=2&genders=18&order_item=alphabetic&order_dir=desc
                                               ↑          ↑                         ↑
                                          Incorrectos ❌
```

**Después** (valores correctos):
```
/library?buscar=&tipo=manhwa&demografia=&estado=publicandose&erotico=si&genders=2&genders=18&order_item=alfabetico&order_dir=desc
                                               ↑              ↑                           ↑
                                          Correctos ✅
```

---

## 📊 Resumen de Correcciones

| Filtro | Cambios | Líneas |
|--------|---------|--------|
| MANHWAWEB_TYPES | 1 cambio | 1 |
| MANHWAWEB_STATUS | 2 cambios | 2 |
| MANHWAWEB_EROTIC | 1 cambio | 1 |
| MANHWAWEB_SORT_BY | 3 cambios | 3 |
| App.jsx (estado inicial) | 1 cambio | 1 |
| **TOTAL** | **8 cambios** | **8 líneas** |

---

## 🔍 Valores Correctos (Referencia Completa)

### TIPO (tipo=)
```
Ver todo     → "" (vacío)
Manhwa       → "manhwa"
Manga        → "manga"
Manhua       → "manhua"
Doujinshi    → "doujinshi"
Novela       → "novela"
One shot     → "one_shot"  ← Guión bajo
```

### ESTADO (estado=)
```
Ver todo        → "" (vacío)
Publicándose    → "publicandose"  ← Sin tilde
Pausado         → "pausado"
Finalizado      → "finalizado"    ← En español
```

### ERÓTICO (erotico=)
```
Ver todo    → "" (vacío)
Sí          → "si"  ← En español
No          → "no"
```

### DEMOGRAFÍA (demografia=)
```
Ver todo    → "" (vacío)
Seinen      → "seinen"  ✓
Shonen      → "shonen"  ✓
Josei       → "josei"   ✓
Shojo       → "shojo"   ✓
```

### ORDENAR POR (order_item=)
```
Alfabético       → "alfabetico"    ← Sin tilde
Creación         → "creacion"      ← Sin tilde
Núm. Capítulos   → "num_chapter"   ← Guión bajo
```

### ORDEN (order_dir=)
```
DESC ⬇️    → "desc"  ✓
ASC ⬆️     → "asc"   ✓
```

---

## 🧪 Testing Requerido

### Después de Implementar

Probar en **Vercel** (producción) cada filtro:

#### Tipo
- [ ] Ver todo → `tipo=`
- [ ] Manhwa → `tipo=manhwa`
- [ ] One shot → `tipo=one_shot`

#### Estado
- [ ] Ver todo → `estado=`
- [ ] Publicándose → `estado=publicandose`
- [ ] Finalizado → `estado=finalizado`

#### Erótico
- [ ] Ver todo → `erotico=`
- [ ] Sí → `erotico=si`
- [ ] No → `erotico=no`

#### Ordenar
- [ ] Alfabético → `order_item=alfabetico`
- [ ] Creación → `order_item=creacion`
- [ ] Núm. Capítulos → `order_item=num_chapter`

#### Orden
- [ ] DESC → `order_dir=desc`
- [ ] ASC → `order_dir=asc`

#### Combinaciones
- [ ] Romance + Comedia + Manhwa + Publicándose + Erótico Sí + Alfabético DESC
- [ ] Horror + Thriller + Manga + Finalizado + Erótico No + Creación ASC
- [ ] Mood "Poder sin límites" + todos los filtros

---

## ⏱️ Tiempo Estimado

| Paso | Tiempo |
|------|--------|
| PASO 1: Corregir TYPES | 2 min |
| PASO 2: Corregir STATUS | 2 min |
| PASO 3: Corregir EROTIC | 1 min |
| PASO 4: Corregir SORT_BY | 2 min |
| PASO 5: Actualizar estado inicial | 1 min |
| Testing en Vercel | 10 min |
| **TOTAL** | **18 min** |

---

## 🚀 Orden de Implementación

1. ✅ Corregir `MANHWAWEB_TYPES` (One shot)
2. ✅ Corregir `MANHWAWEB_STATUS` (Publicándose, Finalizado)
3. ✅ Corregir `MANHWAWEB_EROTIC` (Sí)
4. ✅ Corregir `MANHWAWEB_SORT_BY` (todos los valores)
5. ✅ Actualizar estado inicial de `selectedSortBy` en App.jsx
6. ✅ Build y deploy a Vercel
7. ✅ Testing completo

---

## 📌 Notas Importantes

1. **Tildes**: ManhwaWeb usa parámetros **sin tildes** en español
   - ❌ "publicándose" → ✅ "publicandose"
   - ❌ "creación" → ✅ "creacion"
   - ❌ "alfabético" → ✅ "alfabetico"

2. **Guiones bajos**: Algunos valores usan `_` en lugar de `-`
   - ❌ "oneshot" → ✅ "one_shot"
   - ❌ "chapters" → ✅ "num_chapter"

3. **Español vs Inglés**: La mayoría está en español
   - ❌ "yes" → ✅ "si"
   - ❌ "completed" → ✅ "finalizado"

4. **Estado por defecto**: Cambiar de vacío a "alfabetico"
   - ❌ `selectedSortBy = ''` → ✅ `selectedSortBy = 'alfabetico'`

---

## 🎯 Resultado Esperado

Después de implementar estas correcciones, **todas las búsquedas en ManhwaWeb** generarán URLs exactamente iguales a las de la web real, asegurando resultados correctos.

---

**Estado**: 📋 Plan completo y listo para implementar
**Complejidad**: Baja (cambios de strings)
**Impacto**: Crítico (arregla todos los filtros de ManhwaWeb)
**Testing**: Requiere Vercel (producción)
