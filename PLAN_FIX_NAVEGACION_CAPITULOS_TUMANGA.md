# 📋 Plan: Fix Navegación de Capítulos en TuManga

**Fecha**: 23 de diciembre de 2025
**Problema**: En TuManga, los botones "Siguiente" y "Anterior" están invertidos
**Archivos afectados**: `DetailModal.jsx`

---

## 🐛 Problema Identificado

### Síntoma Reportado

Cuando lees el **Capítulo 1** de una obra de TuManga:
- ❌ **NO** aparece el botón "SIGUIENTE CAPÍTULO" (debería aparecer)
- ❌ **SÍ** aparece el botón "CAPÍTULO ANTERIOR" (no debería aparecer)

### Causa Raíz

**Orden de capítulos en TuManga**:
```
Array de capítulos: [Cap 100, Cap 99, ..., Cap 2, Cap 1]
                      ↑ índice 0              ↑ índice 99
```

TuManga lista los capítulos **del más reciente al más antiguo** (orden descendente).

**Lógica Actual** (líneas 443-444):
```javascript
const hasNextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1;
const hasPreviousChapter = currentChapterIndex > 0;
```

**Problema**: Esta lógica asume que:
- Siguiente = índice MAYOR (ir hacia adelante en el array)
- Anterior = índice MENOR (ir hacia atrás en el array)

Pero en TuManga:
- Siguiente capítulo (Cap 2) = índice MENOR (ir hacia atrás en el array)
- Capítulo anterior (Cap 0?) = No existe

---

## 🔍 Análisis Detallado

### Caso: Leyendo Capítulo 1

```javascript
chapters = [
    { number: '100' },  // índice 0
    { number: '99' },   // índice 1
    // ...
    { number: '2' },    // índice 98
    { number: '1' }     // índice 99 ← Usuario lee este
];

currentChapterIndex = 99  // Capítulo 1

// Lógica ACTUAL (incorrecta)
hasNextChapter = 99 < 99  // false ❌ (debería ser true)
hasPreviousChapter = 99 > 0  // true ❌ (debería ser false)
```

**Resultado actual**:
- ✅ Botón "Anterior" aparece (INCORRECTO)
- ❌ Botón "Siguiente" NO aparece (INCORRECTO)

### Caso: Leyendo Capítulo 100

```javascript
currentChapterIndex = 0  // Capítulo 100

// Lógica ACTUAL (incorrecta)
hasNextChapter = 0 < 99  // true ❌ (debería ser false)
hasPreviousChapter = 0 > 0  // false ❌ (debería ser true)
```

**Resultado actual**:
- ❌ Botón "Siguiente" aparece (INCORRECTO - no hay Cap 101)
- ✅ Botón "Anterior" NO aparece (INCORRECTO - debería volver a Cap 99)

---

## ✅ Solución Propuesta

### Opción A: Lógica Invertida (Simple)

**Código**:
```javascript
// Invertir la lógica para TuManga (orden descendente)
const hasNextChapter = currentChapterIndex > 0;  // Hay siguiente si podemos ir hacia atrás
const hasPreviousChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1;  // Hay anterior si podemos ir hacia adelante
```

**Pros**: Simple, solo invertir las condiciones
**Contras**: No es claro, podría confundir en el futuro

---

### Opción B: Detectar Orden de Capítulos (Recomendada)

**Código**:
```javascript
// Detectar si los capítulos están en orden descendente
const isDescendingOrder = chapters.length > 1 &&
    parseFloat(chapters[0].number) > parseFloat(chapters[1].number);

// Lógica adaptativa según el orden
let hasNextChapter, hasPreviousChapter;

if (isDescendingOrder) {
    // Orden descendente (Cap 100 → Cap 1): TuManga
    hasNextChapter = currentChapterIndex > 0;  // Siguiente = ir hacia atrás en array
    hasPreviousChapter = currentChapterIndex < chapters.length - 1;  // Anterior = ir hacia adelante
} else {
    // Orden ascendente (Cap 1 → Cap 100): ManhwaWeb u otros
    hasNextChapter = currentChapterIndex < chapters.length - 1;  // Siguiente = ir hacia adelante
    hasPreviousChapter = currentChapterIndex > 0;  // Anterior = ir hacia atrás
}
```

**Pros**:
- Funciona con cualquier fuente (TuManga y ManhwaWeb)
- Auto-detecta el orden
- Código claro y documentado

**Contras**: Más líneas de código

---

### Opción C: Basado en la Fuente

**Código**:
```javascript
// Usar selectedChapterSource para determinar el orden
const isDescendingOrder = selectedChapterSource === 'tumanga';

if (isDescendingOrder) {
    hasNextChapter = currentChapterIndex > 0;
    hasPreviousChapter = currentChapterIndex < chapters.length - 1;
} else {
    hasNextChapter = currentChapterIndex < chapters.length - 1;
    hasPreviousChapter = currentChapterIndex > 0;
}
```

**Pros**: Explícito, sabemos qué fuente usa qué orden
**Contras**: Hardcodeado, si otra fuente usa orden descendente hay que actualizarlo

---

## 📊 Tabla de Casos de Uso

### Opción B (Recomendada): Lógica con Detección Automática

| Capítulo | Índice | isDescending | hasNext | hasPrevious | Resultado |
|----------|--------|--------------|---------|-------------|-----------|
| Cap 1 (TuManga) | 99 | true | true ✅ | false ✅ | Solo "Siguiente" |
| Cap 2 (TuManga) | 98 | true | true ✅ | true ✅ | Ambos botones |
| Cap 100 (TuManga) | 0 | true | false ✅ | true ✅ | Solo "Anterior" |
| Cap 1 (ManhwaWeb) | 0 | false | true ✅ | false ✅ | Solo "Siguiente" |
| Cap 2 (ManhwaWeb) | 1 | false | true ✅ | true ✅ | Ambos botones |
| Cap 100 (ManhwaWeb) | 99 | false | false ✅ | true ✅ | Solo "Anterior" |

---

## 🔧 Implementación (Opción B)

### Ubicación
**Archivo**: `src/components/DetailModal.jsx`
**Líneas**: 443-444

### Código Actual (Incorrecto)
```javascript
const chapters = chaptersBySource[selectedChapterSource] || [];
const hasNextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1;
const hasPreviousChapter = currentChapterIndex > 0;
```

### Código Nuevo (Correcto)
```javascript
const chapters = chaptersBySource[selectedChapterSource] || [];

// Detectar si los capítulos están en orden descendente (TuManga) o ascendente (ManhwaWeb)
const isDescendingOrder = chapters.length > 1 &&
    parseFloat(chapters[0].number) > parseFloat(chapters[1].number);

// Lógica de navegación adaptativa según el orden de capítulos
let hasNextChapter, hasPreviousChapter;

if (isDescendingOrder) {
    // Orden descendente (Cap 100 → Cap 1): Típico de TuManga
    // "Siguiente" = número menor = índice mayor en el array
    // "Anterior" = número mayor = índice menor en el array
    hasNextChapter = currentChapterIndex > 0;  // Puede ir hacia atrás en el array
    hasPreviousChapter = currentChapterIndex < chapters.length - 1;  // Puede ir hacia adelante
} else {
    // Orden ascendente (Cap 1 → Cap 100): Típico de ManhwaWeb
    // "Siguiente" = número mayor = índice mayor en el array
    // "Anterior" = número menor = índice menor en el array
    hasNextChapter = currentChapterIndex < chapters.length - 1;  // Puede ir hacia adelante
    hasPreviousChapter = currentChapterIndex > 0;  // Puede ir hacia atrás
}
```

---

## 🧪 Testing

### Test 1: TuManga - Capítulo 1
```
Capítulos: [100, 99, 98, ..., 2, 1]
Leyendo: Capítulo 1 (índice 99)
Orden: Descendente

Esperado:
✅ hasNextChapter = true (puede ir al Cap 2)
✅ hasPreviousChapter = false (no hay Cap 0)

UI:
✅ Botón "SIGUIENTE CAPÍTULO" visible
❌ Botón "CAPÍTULO ANTERIOR" oculto
```

### Test 2: TuManga - Capítulo 50
```
Capítulos: [100, 99, 98, ..., 50, ..., 2, 1]
Leyendo: Capítulo 50 (índice 50)
Orden: Descendente

Esperado:
✅ hasNextChapter = true (puede ir al Cap 49)
✅ hasPreviousChapter = true (puede volver al Cap 51)

UI:
✅ Ambos botones visibles
```

### Test 3: TuManga - Capítulo 100
```
Capítulos: [100, 99, 98, ..., 2, 1]
Leyendo: Capítulo 100 (índice 0)
Orden: Descendente

Esperado:
✅ hasNextChapter = false (no hay Cap 101)
✅ hasPreviousChapter = true (puede volver al Cap 99)

UI:
❌ Botón "SIGUIENTE CAPÍTULO" oculto
✅ Botón "CAPÍTULO ANTERIOR" visible
```

### Test 4: ManhwaWeb - Capítulo 1
```
Capítulos: [1, 2, 3, ..., 99, 100]
Leyendo: Capítulo 1 (índice 0)
Orden: Ascendente

Esperado:
✅ hasNextChapter = true (puede ir al Cap 2)
✅ hasPreviousChapter = false (no hay Cap 0)

UI:
✅ Botón "SIGUIENTE CAPÍTULO" visible
❌ Botón "CAPÍTULO ANTERIOR" oculto
```

---

## 📝 Cambios Necesarios

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `DetailModal.jsx` | 443-444 | Reemplazar con lógica adaptativa |

**Total**: 1 archivo, ~15 líneas nuevas (reemplazando 2)

---

## ⏱️ Tiempo Estimado

| Tarea | Tiempo |
|-------|--------|
| Implementar lógica adaptativa | 5 min |
| Testing en TuManga | 5 min |
| Testing en ManhwaWeb | 5 min |
| **TOTAL** | **15 min** |

---

## 🎯 Resultado Esperado

### Antes ❌

```
TuManga - Capítulo 1:
- Botón "Siguiente": NO aparece ❌
- Botón "Anterior": SÍ aparece ❌

TuManga - Capítulo 100:
- Botón "Siguiente": SÍ aparece ❌
- Botón "Anterior": NO aparece ❌
```

### Después ✅

```
TuManga - Capítulo 1:
- Botón "Siguiente": SÍ aparece ✅ (ir al Cap 2)
- Botón "Anterior": NO aparece ✅ (no hay Cap 0)

TuManga - Capítulo 100:
- Botón "Siguiente": NO aparece ✅ (no hay Cap 101)
- Botón "Anterior": SÍ aparece ✅ (volver al Cap 99)

ManhwaWeb - Cualquier capítulo:
- Funciona correctamente ✅
```

---

## 💡 Explicación Visual

### TuManga (Orden Descendente)

```
Array: [Cap 100, Cap 99, ..., Cap 2, Cap 1]
        ↑ índice 0                  ↑ índice 99

Usuario lee Cap 1 (índice 99):
  - Siguiente Cap 2 → índice 98 (MENOR) ✓
  - No hay anterior

Usuario lee Cap 100 (índice 0):
  - No hay siguiente
  - Anterior Cap 99 → índice 1 (MAYOR) ✓
```

### ManhwaWeb (Orden Ascendente)

```
Array: [Cap 1, Cap 2, ..., Cap 99, Cap 100]
        ↑ índice 0                  ↑ índice 99

Usuario lee Cap 1 (índice 0):
  - Siguiente Cap 2 → índice 1 (MAYOR) ✓
  - No hay anterior

Usuario lee Cap 100 (índice 99):
  - No hay siguiente
  - Anterior Cap 99 → índice 98 (MENOR) ✓
```

---

## 🚀 Orden de Implementación

1. ✅ Leer `DetailModal.jsx` líneas 440-460
2. ✅ Agregar detección de orden (descendente vs ascendente)
3. ✅ Implementar lógica condicional para `hasNextChapter` y `hasPreviousChapter`
4. ✅ Agregar comentarios explicativos
5. ✅ Testing con TuManga (varios capítulos)
6. ✅ Testing con ManhwaWeb (verificar que no se rompió)
7. ✅ Crear documento de implementación

---

## 📌 Recomendación

**Usar Opción B** (Detección automática de orden) porque:
- ✅ Funciona con TuManga y ManhwaWeb
- ✅ No requiere hardcodear la fuente
- ✅ Se adapta automáticamente
- ✅ Código claro y bien documentado

---

**Estado**: 📋 Plan completo
**Complejidad**: Baja
**Impacto**: Alto (arregla navegación rota)
**Prioridad**: Alta (afecta experiencia de lectura)
