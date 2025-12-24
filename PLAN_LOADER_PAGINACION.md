# 📋 Plan: Indicador de Carga Animado para Paginación

**Fecha**: 23 de diciembre de 2025
**Objetivo**: Mostrar un loader animado al cambiar de página que dirija al usuario a la sección de resultados
**Archivos a modificar**: `App.jsx`, crear `PageLoader.jsx`

---

## 🎯 Objetivo

Cuando el usuario cambia de página (Next/Previous):
1. ✅ Mostrar loader animado con imagen `loading.png` (sin fondo)
2. ✅ Texto animado "Loading Page..."
3. ✅ Barra de progreso simulada (0% → 100%)
4. ✅ Scroll automático a la sección de resultados
5. ✅ Ocultar loader cuando los resultados carguen
6. ❌ NO hacer scroll al inicio de la página

---

## 🎨 Diseño del Loader

### Estructura Visual

```
┌─────────────────────────────────────────┐
│                                         │
│         [Imagen loading.png]            │
│            (sin fondo)                  │
│            (animación)                  │
│                                         │
│        Loading Page...                  │
│        (texto con puntos animados)      │
│                                         │
│    ████████████░░░░░░░░░  67%          │
│    (barra de progreso animada)          │
│                                         │
└─────────────────────────────────────────┘
```

### Especificaciones de Diseño

1. **Imagen**:
   - Fuente: `design-references/loading.png`
   - Tamaño: 150px × 150px
   - Fondo: Transparente (eliminar el fondo de color)
   - Animación: Rotación suave o pulse

2. **Texto "Loading Page"**:
   - Font: Bold, 18px
   - Color: `text-potaxie-green` o `text-indigo-600`
   - Animación: Puntos que parpadean ("Loading Page..." → "Loading Page.." → "Loading Page.")

3. **Barra de Progreso**:
   - Ancho: 300px
   - Alto: 8px
   - Color fondo: `bg-gray-200 dark:bg-gray-700`
   - Color activo: `bg-gradient-to-r from-potaxie-green to-teal-500`
   - Porcentaje: Mostrado a la derecha (67%)
   - Duración: Simulada, completar en ~1-2 segundos

4. **Overlay**:
   - Fondo: `bg-white/80 dark:bg-gray-900/80` (semi-transparente)
   - Backdrop blur: `backdrop-blur-sm`
   - Posición: Fixed, cubre la sección de resultados

---

## 📁 Estructura de Archivos

### Nuevo Componente: `PageLoader.jsx`

```
src/
├── components/
│   ├── PageLoader.jsx       ← NUEVO
│   ├── LoadingScreen.jsx    (ya existe)
│   └── ...
├── design-references/
│   └── loading.png          (ya existe)
└── App.jsx
```

---

## 🔧 Implementación Paso a Paso

### PASO 1: Crear Componente `PageLoader.jsx`

**Ubicación**: `src/components/PageLoader.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import loadingImage from '../design-references/loading.png';

export const PageLoader = ({ isLoading }) => {
    const [progress, setProgress] = useState(0);
    const [dots, setDots] = useState('');

    // Simular progreso de carga
    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    // Progreso más rápido al inicio, más lento al final
                    const increment = prev < 60 ? 15 : prev < 90 ? 5 : 2;
                    return Math.min(prev + increment, 100);
                });
            }, 150);

            return () => clearInterval(interval);
        }
    }, [isLoading]);

    // Animar puntos del texto
    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setDots(prev => {
                    if (prev === '...') return '';
                    return prev + '.';
                });
            }, 500);

            return () => clearInterval(interval);
        }
    }, [isLoading]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                >
                    <div className="flex flex-col items-center gap-6 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
                        {/* Imagen animada */}
                        <motion.div
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            <img
                                src={loadingImage}
                                alt="Loading"
                                className="w-32 h-32 object-contain"
                                style={{
                                    filter: 'drop-shadow(0 0 20px rgba(167, 208, 140, 0.3))'
                                }}
                            />
                        </motion.div>

                        {/* Texto animado */}
                        <div className="text-center">
                            <h3 className="text-xl font-black text-potaxie-green dark:text-potaxie-400">
                                Loading Page{dots}
                            </h3>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-80 max-w-full">
                            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full bg-gradient-to-r from-potaxie-green to-teal-500 rounded-full"
                                />
                            </div>
                            <div className="mt-2 text-center">
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
```

---

### PASO 2: Modificar `App.jsx`

#### 2.1 Importar el Componente

**Ubicación**: Después de línea 8

```javascript
import { PageLoader } from './components/PageLoader';
```

#### 2.2 Agregar Estado de Paginación Loading

**Ubicación**: Después de línea 43

```javascript
const [isPaginationLoading, setIsPaginationLoading] = useState(false);
```

#### 2.3 Crear Referencia a Resultados

**Ubicación**: Después de línea 46

```javascript
const resultsRef = useRef(null);
```

**No olvidar importar `useRef`**:
```javascript
import React, { useState, useEffect, useRef } from 'react';
```

#### 2.4 Modificar `goToNextPage`

**Ubicación**: Líneas 274-285

**Antes**:
```javascript
const goToNextPage = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    setLoading(true);

    // Hacer scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Ejecutar búsqueda pasando la página directamente
    handleSearch(null, nextPage);
};
```

**Después**:
```javascript
const goToNextPage = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    setIsPaginationLoading(true);

    // Scroll a la sección de resultados (no al inicio)
    if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Ejecutar búsqueda pasando la página directamente
    await handleSearch(null, nextPage);

    // Ocultar loader
    setIsPaginationLoading(false);
};
```

#### 2.5 Modificar `goToPreviousPage`

**Ubicación**: Líneas 288-300

**Antes**:
```javascript
const goToPreviousPage = async () => {
    if (currentPage > 1) {
        const prevPage = currentPage - 1;
        setCurrentPage(prevPage);
        setLoading(true);

        // Hacer scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Ejecutar búsqueda pasando la página directamente
        handleSearch(null, prevPage);
    }
};
```

**Después**:
```javascript
const goToPreviousPage = async () => {
    if (currentPage > 1) {
        const prevPage = currentPage - 1;
        setCurrentPage(prevPage);
        setIsPaginationLoading(true);

        // Scroll a la sección de resultados (no al inicio)
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Ejecutar búsqueda pasando la página directamente
        await handleSearch(null, prevPage);

        // Ocultar loader
        setIsPaginationLoading(false);
    }
};
```

#### 2.6 Modificar `handleSearch` para ser async

**Ubicación**: Línea 117

**Antes**:
```javascript
const handleSearch = async (e, pageOverride = null) => {
```

**Después** (mantener async, solo asegurar que retorna Promise):
```javascript
const handleSearch = async (e, pageOverride = null) => {
    // ... código existente

    // Al final de la función, después de loadDescriptionsInBackground
    return; // Asegurar que retorna
};
```

#### 2.7 Agregar ref a la Sección de Resultados

**Ubicación**: Línea ~810 (donde empieza la grid de resultados)

**Antes**:
```javascript
<motion.div
    layout
    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
>
```

**Después**:
```javascript
<motion.div
    ref={resultsRef}
    layout
    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
>
```

#### 2.8 Renderizar el PageLoader

**Ubicación**: Antes del cierre del `<main>` (línea ~1050)

```jsx
{/* Page Loader para paginación */}
<PageLoader isLoading={isPaginationLoading} />
```

---

### PASO 3: Procesar Imagen `loading.png`

#### 3.1 Opciones para Eliminar Fondo

**Opción A: CSS Filter (Rápido)**
```css
style={{
    filter: 'drop-shadow(0 0 20px rgba(167, 208, 140, 0.3))',
    mixBlendMode: 'multiply' // Elimina blancos
}}
```

**Opción B: Usar herramienta online**
- Subir `loading.png` a https://remove.bg
- Descargar versión sin fondo
- Reemplazar archivo original

**Opción C: Usar nueva imagen**
Si la imagen tiene fondo de color sólido, puedo crear una nueva versión sin fondo usando mix-blend-mode o backdrop-filter.

---

## 📊 Flujo de Uso

### Escenario: Usuario hace click en "Siguiente"

```
1. Usuario: Click "Siguiente" (página 1 → 2)
   ↓
2. Sistema: setIsPaginationLoading(true)
   ↓
3. UI: Muestra PageLoader (overlay con loader animado)
   ↓
4. Sistema: Scroll suave a resultsRef (sección de resultados)
   ↓
5. Sistema: await handleSearch(null, 2)
   ↓
6. API: Obtiene resultados de página 2
   ↓
7. UI: Progreso: 0% → 30% → 60% → 90% → 100%
   ↓
8. Sistema: setIsPaginationLoading(false)
   ↓
9. UI: Oculta PageLoader (fade out)
   ↓
10. Usuario: Ve nuevos resultados en la misma posición
```

---

## 🎨 Animaciones

### 1. Imagen Loading
```javascript
animate={{
    rotate: [0, 360],        // Rotación completa
    scale: [1, 1.1, 1]       // Pulse sutil
}}
transition={{
    duration: 2,             // 2 segundos por ciclo
    repeat: Infinity,        // Infinito
    ease: "easeInOut"
}}
```

### 2. Texto "Loading Page..."
```javascript
// Puntos animados
setInterval(() => {
    setDots(prev => prev === '...' ? '' : prev + '.');
}, 500);
```

### 3. Barra de Progreso
```javascript
// Progreso simulado (rápido al inicio, lento al final)
const increment = prev < 60 ? 15 : prev < 90 ? 5 : 2;
```

### 4. Fade In/Out
```javascript
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
```

---

## 🎯 Ventajas del Diseño

1. ✅ **UX Mejorada**: Usuario sabe que algo está pasando
2. ✅ **No Pierde Contexto**: No vuelve al inicio, se queda en resultados
3. ✅ **Feedback Visual**: Barra de progreso da sensación de rapidez
4. ✅ **Profesional**: Animaciones suaves y diseño coherente
5. ✅ **Reutilizable**: Componente independiente, fácil de usar en otros lugares

---

## 🧪 Testing

### Checklist de Pruebas

- [ ] Click "Siguiente" → Muestra loader
- [ ] Loader muestra imagen sin fondo
- [ ] Texto "Loading Page..." con puntos animados
- [ ] Barra de progreso va de 0% a 100%
- [ ] Scroll va a sección de resultados (no al inicio)
- [ ] Loader desaparece cuando carga termina
- [ ] Nuevos resultados se muestran correctamente
- [ ] Click "Anterior" → Mismo comportamiento
- [ ] Funciona en mobile y desktop
- [ ] Funciona en dark mode

---

## 📝 Archivos a Crear/Modificar

| Archivo | Acción | Líneas |
|---------|--------|--------|
| `components/PageLoader.jsx` | **CREAR** | ~120 líneas |
| `App.jsx` | Importar PageLoader | 1 línea |
| `App.jsx` | Agregar estado `isPaginationLoading` | 1 línea |
| `App.jsx` | Agregar ref `resultsRef` | 1 línea |
| `App.jsx` | Modificar `goToNextPage` | ~15 líneas |
| `App.jsx` | Modificar `goToPreviousPage` | ~15 líneas |
| `App.jsx` | Agregar ref a grid resultados | 1 línea |
| `App.jsx` | Renderizar `<PageLoader />` | 1 línea |

**Total**: 1 archivo nuevo + 8 modificaciones en App.jsx

---

## ⏱️ Estimación de Tiempo

| Tarea | Tiempo |
|-------|--------|
| Crear `PageLoader.jsx` | 20 min |
| Modificar `App.jsx` | 15 min |
| Procesar imagen (quitar fondo) | 5 min |
| Testing | 10 min |
| **TOTAL** | **50 min** |

---

## 🎨 Paleta de Colores

```javascript
// Loader
background: 'bg-white dark:bg-gray-800'
shadow: 'shadow-2xl'

// Texto
color: 'text-potaxie-green dark:text-potaxie-400'

// Barra progreso fondo
background: 'bg-gray-200 dark:bg-gray-700'

// Barra progreso activa
background: 'bg-gradient-to-r from-potaxie-green to-teal-500'

// Overlay
background: 'bg-white/80 dark:bg-gray-900/80'
backdrop: 'backdrop-blur-sm'

// Imagen glow
filter: 'drop-shadow(0 0 20px rgba(167, 208, 140, 0.3))'
```

---

## 💡 Mejoras Opcionales (Futuro)

1. **Progreso Real**: Usar porcentaje real de carga de API
2. **Mensajes Aleatorios**: "Buscando obras...", "Cargando resultados...", etc.
3. **Animación de Entrada**: Slide from bottom en lugar de fade
4. **Sonido**: Pequeño sonido al completar carga
5. **Confetti**: Animación de confeti al llegar a 100%

---

## 🚀 Orden de Implementación Recomendado

1. ✅ **PASO 1**: Crear `PageLoader.jsx` con estructura básica
2. ✅ **PASO 2**: Importar y agregar estados en `App.jsx`
3. ✅ **PASO 3**: Modificar funciones de paginación
4. ✅ **PASO 4**: Agregar ref a grid de resultados
5. ✅ **PASO 5**: Renderizar loader
6. ✅ **PASO 6**: Testing y ajustes visuales
7. ✅ **PASO 7**: Procesar imagen si es necesario

---

**Estado**: 📋 Plan completo y listo para implementar
**Complejidad**: Media
**Riesgo**: Bajo (cambios aislados)
**Impacto**: Alto (mejora significativa de UX)
**Prioridad**: Alta (feature solicitado por usuario)
