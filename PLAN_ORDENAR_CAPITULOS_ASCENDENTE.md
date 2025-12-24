# 📋 Plan: Ordenar Capítulos en Orden Ascendente (Cap 1 primero)

**Fecha**: 23 de diciembre de 2025
**Objetivo**: Mostrar la lista de capítulos con el Capítulo 1 al inicio
**Archivo a modificar**: `DetailModal.jsx`

---

## 🎯 Objetivo

Actualmente, TuManga devuelve los capítulos en orden descendente:
```
[Cap 100, Cap 99, Cap 98, ..., Cap 2, Cap 1]
```

Queremos mostrarlos en orden ascendente:
```
[Cap 1, Cap 2, Cap 3, ..., Cap 99, Cap 100]
```

---

## 🔍 Análisis del Código Actual

### Ubicación: `DetailModal.jsx` líneas 88-92

```javascript
// Guardar capítulos en el objeto por fuente
setChaptersBySource(prev => ({
    ...prev,
    [source]: chapters || []  // ← Se guardan tal cual vienen de la API
}));
```

**Problema**: Los capítulos se almacenan en el orden que vienen de la API (descendente para TuManga).

### Dónde se Muestran

**Ubicación**: `DetailModal.jsx` línea 406

```javascript
chaptersBySource[selectedChapterSource].map((ch) => (
    <button key={ch.id} onClick={() => openReader(ch, selectedChapterSource)}>
        Cap {ch.number}
    </button>
))
```

---

## ✅ Solución Propuesta

### Opción A: Ordenar al Guardar (Recomendada)

Ordenar los capítulos **al guardarlos** en `chaptersBySource`:

```javascript
// Guardar capítulos en el objeto por fuente - ORDENADOS ASCENDENTE
setChaptersBySource(prev => ({
    ...prev,
    [source]: chapters ? [...chapters].sort((a, b) => {
        // Ordenar por número de capítulo ascendente (1, 2, 3, ...)
        const numA = parseFloat(a.number) || 0;
        const numB = parseFloat(b.number) || 0;
        return numA - numB;  // Ascendente
    }) : []
}));
```

**Pros**:
- Se ordena una sola vez al cargar
- Toda la app usa el mismo orden
- Performance óptima

**Contras**: Ninguno

---

### Opción B: Ordenar al Mostrar

Ordenar los capítulos **al renderizarlos** en la UI:

```javascript
{chaptersBySource[selectedChapterSource]
    ?.sort((a, b) => parseFloat(a.number) - parseFloat(b.number))
    .map((ch) => (
        // ...
    ))
}
```

**Pros**: No modifica el estado
**Contras**: Ordena cada vez que renderiza (menos eficiente)

---

## 🔧 Implementación Detallada (Opción A)

### Paso 1: Actualizar setChaptersBySource

**Ubicación**: `DetailModal.jsx` líneas 88-92

**Código Actual**:
```javascript
setChaptersBySource(prev => ({
    ...prev,
    [source]: chapters || []
}));
```

**Código Nuevo**:
```javascript
// Guardar capítulos ordenados ascendentemente (Cap 1 primero)
setChaptersBySource(prev => ({
    ...prev,
    [source]: chapters ? [...chapters].sort((a, b) => {
        // Convertir números de capítulo a float para comparar
        // Soporta capítulos como "1", "1.5", "2", etc.
        const numA = parseFloat(a.number) || 0;
        const numB = parseFloat(b.number) || 0;
        return numA - numB;  // Orden ascendente (menor a mayor)
    }) : []
}));
```

---

## 📊 Ejemplo de Ordenamiento

### Antes (Orden de TuManga API)
```javascript
chapters = [
    { id: "cap-100", number: "100", chapter: "100" },
    { id: "cap-99", number: "99", chapter: "99" },
    // ...
    { id: "cap-2", number: "2", chapter: "2" },
    { id: "cap-1", number: "1", chapter: "1" }
]
```

### Después (Orden Ascendente)
```javascript
chapters = [
    { id: "cap-1", number: "1", chapter: "1" },      // ← Capítulo 1 primero
    { id: "cap-2", number: "2", chapter: "2" },
    // ...
    { id: "cap-99", number: "99", chapter: "99" },
    { id: "cap-100", number: "100", chapter: "100" }
]
```

---

## 🎯 Casos Especiales

### Capítulos Decimales

Si una obra tiene capítulos como "1", "1.5", "2":

```javascript
parseFloat("1") = 1
parseFloat("1.5") = 1.5
parseFloat("2") = 2

Orden: 1 < 1.5 < 2 ✓
```

### Capítulos con Texto

Si un capítulo tiene número inválido:

```javascript
parseFloat("especial") = NaN
parseFloat("1") = 1

NaN || 0 = 0  // Capítulos sin número válido van al inicio
```

---

## 🧪 Testing

### Test 1: TuManga - Obra con 100 capítulos

**Antes**:
```
UI muestra: [Cap 100] [Cap 99] ... [Cap 2] [Cap 1]
             ↑ Primero                     ↑ Último
```

**Después**:
```
UI muestra: [Cap 1] [Cap 2] ... [Cap 99] [Cap 100]
             ↑ Primero                    ↑ Último
```

### Test 2: TuManga - Obra con capítulos decimales

**Antes**:
```
[Cap 10] [Cap 9.5] [Cap 9] ... [Cap 1.5] [Cap 1]
```

**Después**:
```
[Cap 1] [Cap 1.5] ... [Cap 9] [Cap 9.5] [Cap 10]
```

### Test 3: ManhwaWeb - Verificar que no se rompa

**Verificar**: ManhwaWeb ya viene ordenado ascendente, debe seguir igual.

---

## 🔄 Impacto en Navegación

### Antes (Orden Descendente)

```
Array: [Cap 100, Cap 99, ..., Cap 2, Cap 1]
        ↑ índice 0              ↑ índice 99

Lees Cap 1 (índice 99):
  - Siguiente Cap 2 → índice 98 (índice MENOR)
  - Botones invertidos ❌
```

### Después (Orden Ascendente)

```
Array: [Cap 1, Cap 2, ..., Cap 99, Cap 100]
        ↑ índice 0              ↑ índice 99

Lees Cap 1 (índice 0):
  - Siguiente Cap 2 → índice 1 (índice MAYOR)
  - Botones correctos ✅
```

**Ventaja**: La lógica actual de navegación (`currentChapterIndex + 1` para siguiente) funciona correctamente.

---

## 📝 Cambios Necesarios

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `DetailModal.jsx` | 88-92 | Agregar `.sort()` al guardar capítulos |

**Total**: 1 archivo, ~7 líneas agregadas (reemplazando 1)

---

## ⏱️ Tiempo Estimado

| Tarea | Tiempo |
|-------|--------|
| Implementar ordenamiento | 3 min |
| Testing TuManga | 5 min |
| Testing ManhwaWeb | 2 min |
| **TOTAL** | **10 min** |

---

## 🎯 Resultado Esperado

### Lista de Capítulos (UI)

**Antes**:
```
┌─────────────────────────┐
│ [Cap 100] [Cap 99]      │
│ [Cap 98] [Cap 97]       │
│ ...                     │
│ [Cap 2] [Cap 1]         │ ← Al final
└─────────────────────────┘
```

**Después**:
```
┌─────────────────────────┐
│ [Cap 1] [Cap 2]         │ ← Al inicio
│ [Cap 3] [Cap 4]         │
│ ...                     │
│ [Cap 99] [Cap 100]      │
└─────────────────────────┘
```

### Navegación de Botones

**Capítulo 1**:
- ✅ Botón "SIGUIENTE CAPÍTULO" (ir al Cap 2)
- ❌ Botón "CAPÍTULO ANTERIOR" (no existe Cap 0)

**Capítulo 50**:
- ✅ Botón "SIGUIENTE CAPÍTULO" (ir al Cap 51)
- ✅ Botón "CAPÍTULO ANTERIOR" (volver al Cap 49)

**Capítulo 100** (último):
- ❌ Botón "SIGUIENTE CAPÍTULO" (no existe Cap 101)
- ✅ Botón "CAPÍTULO ANTERIOR" (volver al Cap 99)

---

## 💡 Beneficios Adicionales

1. **UX Intuitiva**: Usuarios esperan ver Cap 1 primero
2. **Lógica Simplificada**: No necesitamos invertir la lógica de navegación
3. **Consistencia**: TuManga y ManhwaWeb usan el mismo orden
4. **Scroll Automático**: Scroll hacia arriba muestra Cap 1 primero

---

## 🚀 Orden de Implementación

1. ✅ Modificar `setChaptersBySource` (línea 89-92)
2. ✅ Agregar función de ordenamiento con `parseFloat`
3. ✅ Comentar el código para documentar
4. ✅ Build y testing local
5. ✅ Testing en diferentes obras de TuManga
6. ✅ Verificar ManhwaWeb no se rompe
7. ✅ Crear documento de implementación

---

**Estado**: 📋 Plan completo
**Complejidad**: Muy baja
**Impacto**: Alto (mejora UX significativamente)
**Prioridad**: Alta
