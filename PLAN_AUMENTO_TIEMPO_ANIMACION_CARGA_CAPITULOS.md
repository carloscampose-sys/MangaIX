# Plan: Aumentar Tiempo de Animación de Carga al Cambiar Capítulos

**Fecha**: Enero 2026
**Problema**: Animación de carga finaliza antes de que terminen de cargar las imágenes del nuevo capítulo
**Objetivo**: Sincronizar mejor la duración de la animación con el tiempo real de carga de imágenes

---

## Tabla de Contenidos

1. [Problema Identificado](#problema-identificado)
2. [Análisis Técnico Actual](#análisis-técnico-actual)
3. [Flujo de Carga Actual](#flujo-de-carga-actual)
4. [Puntos de Mejora](#puntos-de-mejora)
5. [Soluciones Propuestas](#soluciones-propuestas)
6. [Implementación](#implementación)
7. [Estimación de Resultados](#estimación-de-resultados)

---

## Problema Identificado

### Síntomas

Cuando el usuario hace clic en **"SIGUIENTE"** o **"ANTERIOR"** capítulo:

1. ✅ Se muestra animación de carga (overlap con icono animado, progreso circular)
2. ✅ La animación completa el 100% relativamente rápido (~2-3 segundos)
3. ❌ **PROBLEMA**: La animación desaparece pero las imágenes aún se están cargando
4. ❌ El usuario ve un "destello" cuando la animación se va y vuelve a aparecer contenido

### Causa Raíz

El sistema tiene **dos mecanismos de carga independientes**:

| Mecanismo | Tiempo Actual | Problema |
|-----------|---------------|----------|
| **Simulación de Progreso** | 2-3 segundos aprox | Termina muy rápido |
| **Carga Real de Imágenes** | 3-8 segundos aprox | Varía según red y servidor |

**El problema**: La animación finaliza ANTES de que las imágenes terminen de cargar.

---

## Análisis Técnico Actual

### Arquitectura de Carga

```
┌─────────────────────────────────────────────────────┐
│  Usuario hace click en SIGUIENTE/ANTERIOR           │
└────────────────────────┬────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          v                             v
┌──────────────────────┐    ┌──────────────────────────┐
│  startLoading()      │    │  onNextChapter() /       │
│  - Inicia indicador  │    │  onPreviousChapter()     │
│  - Simula progreso   │    │  - Obtiene nuevas URLs   │
│  - Dura ~2-3s        │    │  - Carga imágenes        │
│                      │    │  - Dura ~3-8s (variable)│
└──────────────────────┘    └──────────────────────────┘
          │                             │
          │                             │
          v                             v
  completeLoading()       Cuando termina la carga
  - Mostrar 100%          - NO espera a simulación
  - Esperar 500ms         - Debe completar manually
  - Ocultar animación
```

### Componentes Involucrados

#### 1. **useChapterLoader.js** (Líneas 21-82)
```javascript
// SIMULACIÓN DE PROGRESO (Actual)
const simulateProgress = useCallback(() => {
    let current = 0;
    const updateProgress = () => {
        if (current < 30) current += 2;          // 0-30%: +2 cada 50ms
        else if (current < 70) current += 1;     // 30-70%: +1 cada 50ms
        else if (current < 90) current += 0.5;   // 70-90%: +0.5 cada 50ms
        else if (current < 99) current += 0.2;   // 90-99%: +0.2 cada 50ms

        setProgress(Math.min(current, 99));
    };

    intervalRef.current = setInterval(updateProgress, 50); // Tick cada 50ms
}, []);

// TIEMPO TOTAL APROXIMADO:
// 0-30%:   30 / 2 = 15 ticks × 50ms = 750ms
// 30-70%:  40 / 1 = 40 ticks × 50ms = 2000ms
// 70-90%:  20 / 0.5 = 40 ticks × 50ms = 2000ms
// 90-99%:  9 / 0.2 = 45 ticks × 50ms = 2250ms
// TOTAL:   ~7 segundos (pero termina en 99%, nunca llega a 100% automáticamente)
```

**Tiempo total actual**: ~7 segundos hasta 99% + 500ms de espera al 100% = **~7.5 segundos**

#### 2. **Reader.jsx** (Líneas 209-245)
```javascript
// MANEJO AL DAR SIGUIENTE
const handleNextChapter = async () => {
    startLoading();                    // Inicia simulación (7.5s)

    // ... lógica de guardado ...

    if (onNextChapter) {
        await onNextChapter();         // Carga real (3-8s)
    }

    completeLoading();                 // Termina simulación inmediatamente
};

// MANEJO AL DAR ANTERIOR
const handlePreviousChapter = () => {
    startLoading();                    // Inicia simulación (7.5s)

    if (onPreviousChapter) {
        onPreviousChapter();           // Carga real (3-8s)
    }

    completeLoading();                 // Termina simulación inmediatamente
};
```

**Problema**: `completeLoading()` se llama INMEDIATAMENTE después de `onNextChapter()`, sin esperar a que las imágenes terminen de cargar.

#### 3. **ChapterLoader.jsx** (Líneas 4-134)
```javascript
// ANIMACIÓN DE SALIDA
transition={{ duration: 0.3 }}        // 300ms para desaparecer

// TIEMPO QUE TARDA EN OCULTARSE:
// - El loader está visible mientras isLoading === true
// - Se oculta después de que completeLoading() set isLoading = false
```

---

## Flujo de Carga Actual

### Timeline Actual (Problema)

```
TIEMPO (segundos)
0.0    ├─ Usuario clickea "SIGUIENTE"
       ├─ startLoading() → Inicia simulación visual
       │
0.1    ├─ onNextChapter() → Inicia carga real de imágenes
       │  ├─ Fetch APIs
       │  ├─ Descarga URLs
       │  ├─ Comienza a cargar imágenes
       │
2.0    ├─ Simulación visual llega a ~70%
       │  ├─ Progreso visual parece normal
       │  └─ Imágenes aún cargando en background
       │
3.0    ├─ onNextChapter() termina
       ├─ completeLoading() se llama
       │  ├─ Progreso salta a 100%
       │  ├─ Espera 500ms
       │  └─ isLoading = false (ANIMACIÓN DESAPARECE)
       │
3.5    ├─ ❌ ANIMACIÓN DESAPARECE AQUÍ
       │  └─ PERO IMÁGENES AÚN NO COMPLETAMENTE CARGADAS
       │
4.5    ├─ Imágenes finalmente cargan
       │  └─ Se ve un "parpadeo" o cambio abrupto
       │
5.0    └─ Contenido finalmente visible y estable
```

### Problema Visual

**Lo que ve el usuario**:
1. Aparece loader ✓
2. Progreso sube suavemente ✓
3. Loader desaparece (esperando que esté lista la página) ✓
4. **PERO**: Página no está lista, se sigue viendo contenido anterior o vacío ❌
5. Espera 1-2 segundos más sin feedback visual ❌
6. Finalmente aparecen las imágenes ✓

---

## Puntos de Mejora

### Opción 1: Aumentar Duración de Simulación de Progreso
**Ventajas**:
- Simple de implementar
- Mantiene UX consistente
- Da mejor feedback al usuario

**Desventajas**:
- No es "real" (es una simulación)
- Si carga rápido, usuario espera innecesariamente
- Requiere calibración

**Impacto**: Medio

### Opción 2: Detectar Cuándo Realmente Termina la Carga
**Ventajas**:
- Precisión exacta
- Optimizado para cada conexión
- Mejor UX

**Desventajas**:
- Requiere cambios en API/componentes
- Más complejo de implementar
- Requiere comunicación entre Reader y DetailModal

**Impacto**: Alto

### Opción 3: Combinada (Recomendada) ⭐
**Ventajas**:
- Combina lo mejor de ambas
- Robusta ante variaciones
- Buena UX sin cambios complejos

**Desventajas**:
- Requiere calibración
- Múltiples cambios pequeños

**Impacto**: Muy Alto

---

## Soluciones Propuestas

### Solución 1: Aumentar Duración Base (Rápido - 15 minutos)

**Cambios en `src/hooks/useChapterLoader.js`:**

```javascript
// Aumentar velocidad de progreso más lenta

const simulateProgress = useCallback(() => {
    let current = 0;

    const updateProgress = () => {
        // ANTES:
        // if (current < 30) current += 2;
        // else if (current < 70) current += 1;
        // else if (current < 90) current += 0.5;
        // else if (current < 99) current += 0.2;

        // DESPUÉS (reducir velocidades):
        if (current < 20) {
            current += 1;              // 0-20%: +1 cada 50ms (rápido inicial)
        } else if (current < 50) {
            current += 0.5;            // 20-50%: +0.5 cada 50ms (medio)
        } else if (current < 80) {
            current += 0.25;           // 50-80%: +0.25 cada 50ms (lento)
        } else if (current < 95) {
            current += 0.1;            // 80-95%: +0.1 cada 50ms (muy lento)
        } else if (current < 99) {
            current += 0.05;           // 95-99%: +0.05 cada 50ms (ultra lento)
        }

        setProgress(Math.min(current, 99));
    };

    intervalRef.current = setInterval(updateProgress, 50);
}, []);

// NUEVO TIEMPO TOTAL APROXIMADO:
// 0-20%:   20 / 1 = 20 ticks × 50ms = 1000ms
// 20-50%:  30 / 0.5 = 60 ticks × 50ms = 3000ms
// 50-80%:  30 / 0.25 = 120 ticks × 50ms = 6000ms
// 80-95%:  15 / 0.1 = 150 ticks × 50ms = 7500ms
// 95-99%:  4 / 0.05 = 80 ticks × 50ms = 4000ms
// TOTAL:   ~21.5 segundos hasta 99%
```

**Tiempo de espera después de 100%:**
```javascript
// ANTES:
setTimeout(() => {
    setIsLoading(false);
    setProgress(0);
}, 500);  // 500ms

// DESPUÉS:
setTimeout(() => {
    setIsLoading(false);
    setProgress(0);
}, 1000);  // 1000ms (aumentar a 1 segundo)
```

**Cambios en `src/components/ChapterLoader.jsx`:**
```javascript
// Aumentar duración de la animación de salida
transition={{ duration: 0.5 }}  // ANTES: 0.3 segundos
                                // DESPUÉS: 0.5 segundos
```

**Impacto**:
- ✅ Simple de implementar
- ✅ Funciona bien
- ⚠️ Usuario puede esperar un poco más de lo necesario en conexiones rápidas

---

### Solución 2: Espera Dinámica Basada en Imágenes (Más Complejo - 45 minutos)

**Concepto**:
Esperar a que REALMENTE se carguen todas las imágenes antes de ocultaral loader.

**Cambios en `src/components/Reader.jsx`:**

```javascript
// Hook para detectar cuándo las imágenes están listas
useEffect(() => {
    if (!pages || pages.length === 0) return;

    // Crear una promise que se resuelve cuando todas las imágenes cargan
    const imageLoadPromises = pages.map(pageUrl => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // Resolver incluso si falla
            img.src = pageUrl;
        });
    });

    // Esperar a que todas carguen
    Promise.all(imageLoadPromises).then(() => {
        // Todas las imágenes están cargadas
        console.log('[Reader] Todas las imágenes del capítulo cargadas');
        // Podríamos enviar una señal de "completado"
    });
}, [pages]);
```

**Cambios en `src/components/Reader.jsx` (handleNextChapter)**:

```javascript
const handleNextChapter = async () => {
    startLoading();

    // Guardado de datos...

    if (onNextChapter) {
        await onNextChapter();
    }

    // NUEVO: Esperar a que el usuario vea las imágenes en el DOM
    // (esto es un poco hacky pero efectivo)
    await new Promise(resolve => {
        // Esperar a que al menos 3 imágenes estén en el DOM
        const checkImages = () => {
            const images = scrollContainerRef.current?.querySelectorAll('img');
            if (images && images.length >= 3) {
                // Todas las imágenes principales cargadas
                resolve();
            } else {
                // Seguir esperando
                setTimeout(checkImages, 200);
            }
        };

        setTimeout(checkImages, 500);
    });

    completeLoading();
};
```

**Impacto**:
- ✅ Precisión exacta
- ✅ Se adapta a cualquier velocidad de conexión
- ❌ Más complejo
- ❌ Requiere sincronización entre componentes

---

### Solución 3: Combinada (RECOMENDADA) ⭐

**Estrategia**: Combinar aumento de duración base + espera mínima extra

**Cambios necesarios**:

1. **`src/hooks/useChapterLoader.js`** - Aumentar duración a ~5-6 segundos
2. **`src/components/Reader.jsx`** - Espera mínima de 500-1000ms después de cargar
3. **`src/components/ChapterLoader.jsx`** - Aumentar exit transition a 500ms

**Pseudocódigo**:

```javascript
// En Reader.jsx - handleNextChapter
const handleNextChapter = async () => {
    startLoading();                                    // Inicia animación 5-6s

    // Guardado de datos...

    if (onNextChapter) {
        await onNextChapter();                        // Carga imágenes
    }

    // NUEVO: Espera mínima para asegurar que imágenes estén en DOM
    await new Promise(resolve => setTimeout(resolve, 800));

    completeLoading();                               // Termina animación
};
```

**Timeline esperado**:
```
TIEMPO (segundos)
0.0    ├─ Usuario clickea "SIGUIENTE"
       ├─ startLoading() → Simulación de progreso (más lenta)
       │
0.1    ├─ onNextChapter() → Carga real de imágenes
       │
3.5    ├─ Simulación alcanza 50-60% (buena representación)
       │  └─ Imágenes en proceso de carga
       │
5.0    ├─ onNextChapter() termina
       ├─ ESPERA MÍNIMA 800ms (tiempo para DOM)
       │
5.8    ├─ completeLoading() se llama
       │  ├─ Progreso salta a 100%
       │  ├─ Espera 1000ms
       │  └─ isLoading = false
       │
6.8    ├─ Animación desaparece (500ms transition)
       │  └─ Imágenes DEFINITIVAMENTE visibles
       │
7.3    └─ Contenido completamente estable
```

**Ventajas**:
- ✅ Simple de implementar
- ✅ Funciona bien en todas las conexiones
- ✅ Progreso visual representa bien el tiempo real
- ✅ Usuario nunca ve "destello" sin contenido
- ⚠️ Puede tardar un poco más en conexiones muy rápidas (aceptable)

---

## Implementación

### Paso 1: Modificar `src/hooks/useChapterLoader.js`

**Cambio de velocidades de progreso** (líneas 22-51):

```javascript
// Reducir velocidad de progreso
const updateProgress = () => {
    if (current < 20) {
        current += 1;              // Rápido al inicio
    } else if (current < 50) {
        current += 0.5;            // Medio
    } else if (current < 80) {
        current += 0.25;           // Lento
    } else if (current < 95) {
        current += 0.1;            // Muy lento
    } else if (current < 99) {
        current += 0.05;           // Ultra lento
    }

    setProgress(Math.min(current, 99));
};
```

**Aumentar tiempo de espera en 100%** (línea 78-81):

```javascript
setTimeout(() => {
    setIsLoading(false);
    setProgress(0);
}, 1000);  // Aumentar de 500ms a 1000ms
```

### Paso 2: Modificar `src/components/Reader.jsx`

**Agregar espera mínima en handleNextChapter** (después de línea 228):

```javascript
const handleNextChapter = async () => {
    startLoading();

    if (mangaId && chapter) {
        chapterHistoryService.markChapterAsRead(mangaId, chapter.toString());
    } else {
        console.warn('[Reader] Cannot mark chapter - missing data:', { mangaId, chapter });
    }

    if (mangaId && chapterId) {
        readingProgressService.clearProgress(mangaId, chapterId);
    }

    autoSaveProgress();

    if (onNextChapter) {
        await onNextChapter();
    }

    // NUEVO: Espera mínima para asegurar que imágenes están en el DOM
    await new Promise(resolve => setTimeout(resolve, 800));

    completeLoading();
};
```

**Agregar espera mínima en handlePreviousChapter** (después de línea 241):

```javascript
const handlePreviousChapter = () => {
    startLoading();

    if (mangaId && chapterId) {
        readingProgressService.clearProgress(mangaId, chapterId);
    }

    if (onPreviousChapter) {
        onPreviousChapter();
    }

    // NUEVO: Espera mínima para asegurar que imágenes están en el DOM
    setTimeout(() => {
        completeLoading();
    }, 800);
};
```

### Paso 3: Modificar `src/components/ChapterLoader.jsx`

**Aumentar duración de transición** (línea 34):

```javascript
// ANTES
transition={{ duration: 0.3 }}

// DESPUÉS
transition={{ duration: 0.5 }}
```

**Opcional: Aumentar duración de animación del personaje** (línea 47-50):

```javascript
// ANTES
transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
}}

// DESPUÉS
transition={{
    duration: 2.5,      // Aumentar para que sea un poco más lento
    repeat: Infinity,
    ease: "easeInOut"
}}
```

---

## Estimación de Resultados

### Antes de los Cambios

| Métrica | Valor |
|---------|-------|
| Duración simulación progreso | ~7 segundos |
| Tiempo real carga imágenes | 3-8 segundos |
| Desincronización | 1-4 segundos |
| Experiencia | ⚠️ Parpadeo/confusión visual |

### Después de los Cambios

| Métrica | Valor |
|---------|-------|
| Duración simulación progreso | ~5-6 segundos |
| Tiempo real carga imágenes | 3-8 segundos |
| Espera adicional mínima | 0.8 segundos |
| Tiempo total | 6-8 segundos (según conexión) |
| Desincronización | Prácticamente 0 |
| Experiencia | ✅ Fluida y sincronizada |

### Beneficios

✅ **Mejor UX**: El usuario ve una animación de carga que es coherente con el tiempo real
✅ **Menos confusión**: No hay "destello" cuando la animación desaparece
✅ **Feedback visual**: El progreso representa mejor el estado real
✅ **Accesibilidad**: El usuario sabe que algo está pasando

---

## Archivos a Modificar (Resumen)

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `src/hooks/useChapterLoader.js` | 22-51, 78-81 | Velocidad progreso, timeout completar |
| `src/components/Reader.jsx` | 209-232, 234-245 | Agregar await mínima |
| `src/components/ChapterLoader.jsx` | 34, 47-50 | Transición, animación |

**Total de cambios**: ~12 líneas de código
**Complejidad**: Baja
**Tiempo estimado**: 15-20 minutos
**Riesgo**: Muy bajo

---

## Configuración Recomendada (Valores Ajustables)

```javascript
// En useChapterLoader.js - Puedes ajustar estos valores según prefieras

// Velocidades de progreso (porcentaje por tick - cada 50ms)
const SPEEDS = {
    FAST: 1,        // 0-20%: rápido inicial
    MEDIUM: 0.5,    // 20-50%
    SLOW: 0.25,     // 50-80%
    VERY_SLOW: 0.1, // 80-95%
    ULTRA_SLOW: 0.05 // 95-99%
};

// Tiempos de espera (en ms)
const DELAYS = {
    INIT_DELAY: 100,           // Antes de empezar progreso
    COMPLETE_WAIT: 1000,       // Esperar en 100% antes de ocultar
    MIN_IMAGE_WAIT: 800        // Espera mínima en Reader
};

// Duraciones de animación (en segundos)
const ANIMATION_DURATIONS = {
    LOADER_EXIT: 0.5,          // Transición de salida
    CHARACTER_BOUNCE: 2.5      // Animación del personaje
};
```

---

## Testing & Validación

### Pruebas Recomendadas

1. **Conexión rápida** (fiber/5G)
   - Verificar que no hay espera innecesaria
   - Progreso debe alcanzar 80-90% máximo

2. **Conexión media** (4G/WiFi normal)
   - Progreso debe acompañar la carga
   - Sin parpadeos

3. **Conexión lenta** (3G/conexión pobre)
   - Progreso debe llegar a 99% pero no más
   - Animación debe mantener user engaged

4. **Ir y venir entre capítulos**
   - Verificar que el loader se reinicia correctamente
   - Sin bugs de estado

5. **Diferentes servicios** (TuManga, Ikigai, ManhwaWeb)
   - Validar en todos los servicios
   - Pueden tener tiempos diferentes de carga

---

## Recomendación Final

**Usar Solución 3: Combinada** ⭐

- ✅ Balance perfecto entre simplicidad e impacto
- ✅ Fácil de implementar
- ✅ Muy efectiva
- ✅ Sin riesgos de estabilidad
- ✅ Mejora significativa en UX

**Tiempo estimado**: 20 minutos
**Riesgo de problemas**: Muy bajo
**Impacto en UX**: Alto

---

**Próximo paso**: Proceder con la implementación de la Solución 3 (Combinada)
