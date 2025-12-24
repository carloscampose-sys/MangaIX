# Plan: Animación de Carga en Búsqueda 🐱

## Objetivo
Implementar una animación de carga idéntica a `PageLoader.jsx` pero usando la imagen del gato durmiendo (`public/search loading.png`) cuando el usuario realiza una búsqueda.

---

## Análisis del Estado Actual

### ✅ Componentes Existentes

#### 1. **PageLoader.jsx** (Animación de paginación)
**Ubicación:** `src/components/PageLoader.jsx`

**Características:**
- Overlay full-screen con backdrop blur
- Imagen de nutria/hurón (`/otter.png`)
- Animaciones de rotación y escala
- Barra de progreso con efecto shine
- Puntos animados en el texto ("Loading Page...")
- Porcentaje de progreso (0-100%)
- Efecto glow detrás de la imagen

**Cuándo se activa:**
- Al hacer clic en "Siguiente" o "Anterior" en la paginación
- Controlado por `isPaginationLoading` state
- Se muestra en `<PageLoader isLoading={isPaginationLoading} />`

#### 2. **LoadingScreen.jsx** (Pantalla inicial)
**Ubicación:** `src/components/LoadingScreen.jsx`

**Características:**
- Pantalla de carga inicial de la app
- Emojis orbitando
- Aguacate central con corazón
- Tema potaxie verde
- Diferente propósito (carga inicial vs búsqueda)

### ❌ Problema Actual

En `App.jsx`, cuando se ejecuta una búsqueda:
- Existe un estado `loading` (línea 22)
- Se establece a `true` al iniciar búsqueda (línea 151)
- Se establece a `false` al terminar
- **PERO:** No hay componente visual que muestre este estado
- Los resultados simplemente aparecen después de la búsqueda

---

## Solución Propuesta

### Fase 1: Crear el componente SearchLoader

**Archivo nuevo:** `src/components/SearchLoader.jsx`

**Características (idénticas a PageLoader):**
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchLoader = ({ isLoading }) => {
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
        } else {
            setDots('');
        }
    }, [isLoading]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-6 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 border-potaxie-green/20 dark:border-potaxie-green/30"
                    >
                        {/* Gato durmiendo animado */}
                        <motion.div
                            animate={{
                                rotate: [0, 15, -15, 0],
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
                                src="/search loading.png"
                                alt="Searching"
                                className="w-32 h-32 object-contain"
                                style={{
                                    filter: 'drop-shadow(0 0 20px rgba(167, 208, 140, 0.5))'
                                }}
                            />
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-potaxie-green/20 rounded-full blur-2xl -z-10"></div>
                        </motion.div>

                        {/* Texto animado */}
                        <div className="text-center">
                            <h3 className="text-xl font-black text-potaxie-green dark:text-potaxie-400">
                                Searching{dots}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                Buscando obras increíbles
                            </p>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-80 max-w-full">
                            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-potaxie-green via-teal-500 to-potaxie-green rounded-full relative"
                                >
                                    {/* Shine effect */}
                                    <motion.div
                                        animate={{
                                            x: [-100, 300]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    />
                                </motion.div>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {progress < 100 ? 'Buscando...' : 'Completado!'}
                                </span>
                                <span className="text-sm font-black text-potaxie-green dark:text-potaxie-400">
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
```

**Diferencias con PageLoader:**
| Aspecto | PageLoader | SearchLoader |
|---------|-----------|--------------|
| **Imagen** | `/otter.png` (nutria) | `/search loading.png` (gato) |
| **Título** | "Loading Page..." | "Searching..." |
| **Subtítulo** | "Obteniendo nuevos resultados" | "Buscando obras increíbles" |
| **Estado texto** | "Cargando..." / "Completado!" | "Buscando..." / "Completado!" |

### Fase 2: Integrar en App.jsx

**Archivo:** `src/App.jsx`

**Cambios necesarios:**

#### 2.1 Importar el componente
```jsx
// Línea ~8 (después de PageLoader)
import { SearchLoader } from './components/SearchLoader';
```

#### 2.2 Añadir el componente al JSX
Encontrar la ubicación correcta donde renderizar `SearchLoader`.

**Ubicación sugerida:** Junto a `PageLoader` al final del componente, antes del cierre de `</ThemeProvider>`.

```jsx
{/* Loader de paginación */}
<PageLoader isLoading={isPaginationLoading} />

{/* Loader de búsqueda - NUEVO */}
<SearchLoader isLoading={loading} />
```

**Línea aproximada:** Cerca de la línea 1000+ (al final del return)

---

## Flujo de Funcionamiento

### Búsqueda Normal
```
Usuario escribe "Jinx" y presiona Enter
↓
handleSearch() se ejecuta
↓
setLoading(true) → SearchLoader aparece con animación fade-in
↓
Gato durmiendo rota suavemente
Barra de progreso 0% → 100%
Texto "Searching..." con puntos animados
↓
await unifiedSearch() ejecuta búsqueda
↓
setLoading(false) → SearchLoader desaparece con fade-out
↓
Resultados se muestran
```

### Paginación (sin cambios)
```
Usuario hace clic en "Siguiente"
↓
goToNextPage() se ejecuta
↓
setIsPaginationLoading(true) → PageLoader aparece
↓
Nutria/hurón animado
↓
await handleSearch(null, nextPage)
↓
setIsPaginationLoading(false) → PageLoader desaparece
↓
Nuevos resultados de página 2
```

---

## Comparación de Estados

| Estado | Cuándo se activa | Loader usado | Imagen |
|--------|------------------|--------------|--------|
| `isInitialLoading` | Al cargar la app | `LoadingScreen` | Aguacate + emojis |
| `loading` | Al buscar (nueva búsqueda) | `SearchLoader` ⭐ NUEVO | Gato durmiendo |
| `isPaginationLoading` | Al cambiar de página | `PageLoader` | Nutria/hurón |

---

## Checklist de Implementación

### Fase 1: Crear SearchLoader
- [ ] Crear archivo `src/components/SearchLoader.jsx`
- [ ] Copiar estructura de `PageLoader.jsx`
- [ ] Cambiar imagen a `/search loading.png`
- [ ] Actualizar textos:
  - [ ] Título: "Searching..."
  - [ ] Subtítulo: "Buscando obras increíbles"
  - [ ] Estado: "Buscando..." / "Completado!"
- [ ] Verificar que las animaciones funcionen

### Fase 2: Integrar en App.jsx
- [ ] Importar `SearchLoader` en `App.jsx`
- [ ] Añadir `<SearchLoader isLoading={loading} />` al JSX
- [ ] Verificar que no interfiera con `PageLoader`

### Fase 3: Pruebas
- [ ] Probar búsqueda simple (escribir texto + Enter)
- [ ] Probar búsqueda con filtros (seleccionar géneros)
- [ ] Probar búsqueda con moods
- [ ] Probar cambio de fuente (TuManga ↔ ManhwaWeb)
- [ ] Verificar que la paginación sigue usando `PageLoader`
- [ ] Verificar que no hay loaders duplicados
- [ ] Verificar animaciones suaves (fade in/out)
- [ ] Verificar en modo claro y oscuro
- [ ] Verificar en móvil (responsive)

---

## Notas Técnicas

### Estados en App.jsx
```javascript
const [loading, setLoading] = useState(false);                    // Para búsquedas
const [isPaginationLoading, setIsPaginationLoading] = useState(false); // Para paginación
```

### Cuándo se activa `loading`
1. **handleSearch()** - Línea ~151
   ```javascript
   setLoading(true);
   // ... búsqueda ...
   setLoading(false);
   ```

2. **Casos de uso:**
   - Usuario escribe y presiona Enter
   - Usuario selecciona géneros y busca
   - Usuario cambia filtros y busca
   - Usuario resetea filtros y busca automáticamente

### Z-index Hierarchy
```
LoadingScreen: z-[1000]   (pantalla inicial)
SearchLoader:  z-50       (búsqueda)
PageLoader:    z-50       (paginación)
Modales:       z-40       (DetailModal, etc.)
```

### Tiempo de Animación
- **Fade in:** 0.3s
- **Fade out:** 0.3s
- **Rotación/escala:** 2s loop infinito
- **Progreso:** 150ms por tick
- **Puntos:** 500ms por punto

---

## Casos Especiales

### ManhwaWeb (búsquedas lentas)
En `handleSearch()` línea ~154, hay un toast especial:
```javascript
if (selectedSource === 'manhwaweb') {
  showToast('🌐 ManhwaWeb puede tardar 30-60s... Ten paciencia 🥑');
}
```

El `SearchLoader` seguirá mostrándose durante todo este tiempo, dando feedback visual al usuario.

### Búsquedas sin resultados
Si la búsqueda retorna 0 resultados:
- `loading` se establece a `false`
- `SearchLoader` desaparece
- Se muestra mensaje "No se encontraron resultados"

---

## Archivos a Modificar

### Crear Nuevo
1. **`src/components/SearchLoader.jsx`**
   - Componente completo basado en PageLoader
   - ~135 líneas de código

### Modificar Existente
2. **`src/App.jsx`**
   - Añadir import (1 línea)
   - Añadir componente al JSX (1 línea)
   - Total: 2 líneas

---

## Resultado Visual Esperado

```
┌─────────────────────────────────────────┐
│  Overlay semi-transparente con blur     │
│                                         │
│      ┌─────────────────────────┐       │
│      │  [Card con sombra]      │       │
│      │                         │       │
│      │    🐱💤 (rotando)      │       │
│      │   (con glow verde)      │       │
│      │                         │       │
│      │    Searching...         │       │
│      │  Buscando obras         │       │
│      │                         │       │
│      │ ████████░░░░░░  65%    │       │
│      │  (con shine effect)     │       │
│      │  Buscando...       65%  │       │
│      │                         │       │
│      └─────────────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Resumen

**Objetivo:** Añadir feedback visual durante búsquedas usando el mismo sistema de PageLoader.

**Cambios:**
- ✅ 1 archivo nuevo (`SearchLoader.jsx`)
- ✅ 2 líneas en `App.jsx`
- ✅ Mismo diseño que PageLoader
- ✅ Diferente imagen y textos

**Ventajas:**
- Consistencia visual con la paginación
- Feedback claro al usuario
- Especialmente útil para ManhwaWeb (búsquedas lentas)
- Animaciones suaves y profesionales
- Responsive y accesible

**Sin efectos secundarios:**
- No afecta PageLoader existente
- No afecta LoadingScreen existente
- Estados independientes (`loading` vs `isPaginationLoading`)
