# Plan Detallado: Navegación Entre Capítulos en el Lector

**Fecha**: 23 de diciembre de 2025  
**Objetivo**: Agregar botones de navegación (anterior/siguiente) en el lector de capítulos  
**Componentes afectados**: `Reader.jsx` y `DetailModal.jsx`

---

## 📋 Análisis de la Situación Actual

### Flujo Actual

```
DetailModal.jsx
├── Estado: chaptersBySource (lista de capítulos por fuente)
├── Estado: selectedChapter (capítulo actual)
├── Estado: selectedChapterSource (fuente actual)
├── Función: openReader(chapter, source) → Abre el lector
└── Renderiza: <Reader pages={...} title={...} chapter={...} onClose={...} />

Reader.jsx
├── Props recibidas: pages, title, chapter, onClose
├── Estado interno: currentPage (página actual dentro del capítulo)
└── Al finalizar: Solo botón "VOLVER AL SANTUARIO"
```

### Problema Identificado

**El Reader NO tiene acceso a**:
- ❌ La lista completa de capítulos
- ❌ El índice del capítulo actual
- ❌ Información del capítulo anterior/siguiente
- ❌ Funciones para navegar entre capítulos

**Por lo tanto, NO puede**:
- ❌ Saber si hay capítulo anterior/siguiente
- ❌ Cargar las páginas del siguiente capítulo
- ❌ Cambiar de capítulo sin cerrar el lector

---

## 🎯 Solución Propuesta

### Arquitectura de la Solución

```
DetailModal.jsx (Maneja la lógica de navegación)
│
├── Estado: currentChapterIndex (índice del capítulo actual)
├── Función: goToNextChapter() → Carga siguiente capítulo
├── Función: goToPreviousChapter() → Carga capítulo anterior
│
└── Pasa al Reader:
    ├── pages (páginas actuales)
    ├── chapter (número de capítulo actual)
    ├── title (título de la obra)
    ├── onClose (cerrar lector)
    ├── onNextChapter (ir al siguiente) ← NUEVO
    ├── onPreviousChapter (ir al anterior) ← NUEVO
    ├── hasNextChapter (boolean) ← NUEVO
    └── hasPreviousChapter (boolean) ← NUEVO

Reader.jsx (Renderiza los botones)
│
└── Sección final (después de las páginas):
    ├── Botón: "← CAPÍTULO ANTERIOR" (si hasPreviousChapter)
    ├── Botón: "VOLVER AL SANTUARIO" (siempre)
    └── Botón: "SIGUIENTE CAPÍTULO →" (si hasNextChapter)
```

---

## 🔧 Cambios Técnicos Detallados

### PASO 1: Modificar `DetailModal.jsx`

#### 1.1 Agregar nuevo estado para el índice del capítulo

```jsx
// Línea ~37 (después de isOpeningReader)
const [currentChapterIndex, setCurrentChapterIndex] = useState(-1);
```

#### 1.2 Modificar `openReader` para guardar el índice

```jsx
// Línea ~115
const openReader = async (chapter, source) => {
    if (!manga?.slug) return;

    // NUEVO: Encontrar el índice del capítulo en la lista
    const chapters = chaptersBySource[source || selectedChapterSource] || [];
    const chapterIndex = chapters.findIndex(ch => ch.chapter === chapter.chapter);
    setCurrentChapterIndex(chapterIndex);

    setSelectedChapter(chapter.chapter);
    setIsOpeningReader(true);

    try {
        const pages = await unifiedGetPages(manga.slug, chapter.chapter, source || selectedChapterSource);
        if (pages && pages.length > 0) {
            setReaderPages(pages);
        } else {
            const sourceInfo = getSourceById(source || selectedChapterSource);
            showToast(`No se pudieron cargar las páginas. Intenta en ${sourceInfo.name} directamente 😭💅`);
            
            if (chapter.url) {
                window.open(chapter.url, '_blank');
            }
        }
    } catch (error) {
        console.error('Error opening reader:', error);
        showToast("¡Error de conexión! Intenta de nuevo 💅");
    }
    setIsOpeningReader(false);
};
```

#### 1.3 Crear función `goToNextChapter`

```jsx
// Después de openReader (línea ~140)
const goToNextChapter = async () => {
    const chapters = chaptersBySource[selectedChapterSource] || [];
    
    if (currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1) {
        const nextChapter = chapters[currentChapterIndex + 1];
        setCurrentChapterIndex(currentChapterIndex + 1);
        setSelectedChapter(nextChapter.chapter);
        setIsOpeningReader(true);
        
        try {
            const pages = await unifiedGetPages(manga.slug, nextChapter.chapter, selectedChapterSource);
            if (pages && pages.length > 0) {
                setReaderPages(pages);
                showToast(`¡Siguiente capítulo cargado! Cap ${nextChapter.chapter} 🥑`);
            } else {
                showToast("No se pudieron cargar las páginas del siguiente capítulo 😭");
            }
        } catch (error) {
            console.error('Error loading next chapter:', error);
            showToast("Error cargando el siguiente capítulo 💅");
        }
        
        setIsOpeningReader(false);
    }
};
```

#### 1.4 Crear función `goToPreviousChapter`

```jsx
// Después de goToNextChapter
const goToPreviousChapter = async () => {
    const chapters = chaptersBySource[selectedChapterSource] || [];
    
    if (currentChapterIndex > 0) {
        const prevChapter = chapters[currentChapterIndex - 1];
        setCurrentChapterIndex(currentChapterIndex - 1);
        setSelectedChapter(prevChapter.chapter);
        setIsOpeningReader(true);
        
        try {
            const pages = await unifiedGetPages(manga.slug, prevChapter.chapter, selectedChapterSource);
            if (pages && pages.length > 0) {
                setReaderPages(pages);
                showToast(`¡Capítulo anterior cargado! Cap ${prevChapter.chapter} 🥑`);
            } else {
                showToast("No se pudieron cargar las páginas del capítulo anterior 😭");
            }
        } catch (error) {
            console.error('Error loading previous chapter:', error);
            showToast("Error cargando el capítulo anterior 💅");
        }
        
        setIsOpeningReader(false);
    }
};
```

#### 1.5 Calcular si hay capítulos anterior/siguiente

```jsx
// Antes del Reader (línea ~380)
const chapters = chaptersBySource[selectedChapterSource] || [];
const hasNextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1;
const hasPreviousChapter = currentChapterIndex > 0;
```

#### 1.6 Actualizar el componente Reader

```jsx
// Línea ~382
{readerPages && (
    <Reader
        pages={readerPages}
        title={manga.title}
        chapter={selectedChapter}
        onClose={() => {
            setReaderPages(null);
            setCurrentChapterIndex(-1);
        }}
        onNextChapter={goToNextChapter}
        onPreviousChapter={goToPreviousChapter}
        hasNextChapter={hasNextChapter}
        hasPreviousChapter={hasPreviousChapter}
        isLoadingChapter={isOpeningReader}
    />
)}
```

---

### PASO 2: Modificar `Reader.jsx`

#### 2.1 Actualizar las props

```jsx
// Línea 4
export const Reader = ({ 
    pages, 
    title, 
    chapter, 
    onClose,
    onNextChapter,           // NUEVO
    onPreviousChapter,       // NUEVO
    hasNextChapter,          // NUEVO
    hasPreviousChapter,      // NUEVO
    isLoadingChapter         // NUEVO
}) => {
```

#### 2.2 Agregar iconos necesarios

```jsx
// Línea 2
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, ArrowLeft, ArrowRight, Home } from 'lucide-react';
```

#### 2.3 Modificar la sección final (después de las páginas)

```jsx
// Línea 80 - Reemplazar el contenido del div
<div className="py-10 sm:py-16 md:py-20 flex flex-col items-center gap-4 sm:gap-6 px-4">
    {/* Mensaje de finalización */}
    <div className="text-white font-black text-base sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <span className="p-2 sm:p-3 bg-potaxie-green rounded-full animate-bounce">🥑</span>
        <span className="text-center">¡DEVORASTE ESTE CAPÍTULO!</span>
        <span className="p-2 sm:p-3 bg-potaxie-green rounded-full animate-bounce">🥑</span>
    </div>
    
    {/* Navegación de capítulos */}
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-2xl">
        {/* Botón Capítulo Anterior */}
        {hasPreviousChapter && (
            <button
                onClick={onPreviousChapter}
                disabled={isLoadingChapter}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-2xl text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">CAPÍTULO ANTERIOR</span>
                <span className="sm:hidden">ANTERIOR</span>
            </button>
        )}
        
        {/* Botón Volver al Santuario */}
        <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-black rounded-xl sm:rounded-2xl hover:scale-105 transition-transform shadow-2xl text-sm sm:text-base flex items-center justify-center gap-2"
        >
            <Home size={20} />
            <span className="hidden sm:inline">VOLVER AL SANTUARIO</span>
            <span className="sm:hidden">INICIO</span>
        </button>
        
        {/* Botón Siguiente Capítulo */}
        {hasNextChapter && (
            <button
                onClick={onNextChapter}
                disabled={isLoadingChapter}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-potaxie-green hover:bg-potaxie-green-dark text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-2xl text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
                <span className="hidden sm:inline">SIGUIENTE CAPÍTULO</span>
                <span className="sm:hidden">SIGUIENTE</span>
                <ArrowRight size={20} />
            </button>
        )}
    </div>
    
    {/* Indicador de carga */}
    {isLoadingChapter && (
        <div className="flex items-center gap-2 text-white text-sm animate-pulse">
            <div className="w-2 h-2 bg-potaxie-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-potaxie-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-potaxie-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-2">Cargando siguiente capítulo...</span>
        </div>
    )}
</div>
```

---

## 🎨 Diseño Visual de los Botones

### Layout Desktop (≥640px)

```
┌────────────────────────────────────────────────────────────┐
│                 ¡DEVORASTE ESTE CAPÍTULO! 🥑               │
├────────────────────────────────────────────────────────────┤
│  [← CAPÍTULO ANTERIOR]  [🏠 VOLVER AL SANTUARIO]  [SIGUIENTE CAPÍTULO →]  │
└────────────────────────────────────────────────────────────┘
```

### Layout Mobile (<640px)

```
┌──────────────────────┐
│   ¡DEVORASTE! 🥑     │
├──────────────────────┤
│  [← ANTERIOR]        │
│  [🏠 INICIO]         │
│  [SIGUIENTE →]       │
└──────────────────────┘
```

### Colores y Estilos

| Botón | Color | Hover | Icono |
|-------|-------|-------|-------|
| **Anterior** | `bg-gray-700` | `bg-gray-600` | `ArrowLeft` |
| **Inicio** | `bg-white` | `scale-105` | `Home` |
| **Siguiente** | `bg-potaxie-green` | `bg-potaxie-green-dark` | `ArrowRight` |

---

## 🚀 Casos de Uso

### Caso 1: Usuario en el Primer Capítulo
```
Estado: currentChapterIndex = 0
Botones visibles:
- ❌ Capítulo Anterior (oculto)
- ✅ Volver al Santuario
- ✅ Siguiente Capítulo
```

### Caso 2: Usuario en un Capítulo Intermedio
```
Estado: currentChapterIndex = 5 (de 10)
Botones visibles:
- ✅ Capítulo Anterior
- ✅ Volver al Santuario
- ✅ Siguiente Capítulo
```

### Caso 3: Usuario en el Último Capítulo
```
Estado: currentChapterIndex = 9 (de 10)
Botones visibles:
- ✅ Capítulo Anterior
- ✅ Volver al Santuario
- ❌ Siguiente Capítulo (oculto)
```

### Caso 4: Cargando Nuevo Capítulo
```
Estado: isLoadingChapter = true
Comportamiento:
- 🔒 Botones Anterior/Siguiente deshabilitados
- ✅ Botón Inicio siempre disponible
- 🔄 Indicador de carga visible
```

---

## ⚡ Mejoras de UX

### 1. **Transiciones Suaves**
```jsx
// Cuando cambia el capítulo, hacer scroll al inicio
useEffect(() => {
    if (readerPages) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}, [readerPages]);
```

### 2. **Atajos de Teclado** (Opcional - Fase 2)
```jsx
// En Reader.jsx
useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight') next(); // Página siguiente
        if (e.key === 'ArrowLeft') prev();  // Página anterior
        if (e.key === 'Escape') onClose();
        
        // NUEVO: Ctrl + ArrowRight = Siguiente capítulo
        if (e.ctrlKey && e.key === 'ArrowRight' && hasNextChapter) {
            onNextChapter();
        }
        
        // NUEVO: Ctrl + ArrowLeft = Capítulo anterior
        if (e.ctrlKey && e.key === 'ArrowLeft' && hasPreviousChapter) {
            onPreviousChapter();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [hasNextChapter, hasPreviousChapter]);
```

### 3. **Toast Notifications**
```jsx
// Cuando se carga un capítulo exitosamente
showToast(`¡Capítulo ${nextChapter.chapter} cargado! 🥑`);
```

### 4. **Scroll Automático**
```jsx
// En Reader.jsx, cuando cambian las páginas
useEffect(() => {
    if (pages && pages.length > 0) {
        // Hacer scroll al inicio del contenedor
        const scrollContainer = document.querySelector('.overflow-y-auto.custom-scrollbar');
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}, [pages]);
```

---

## 🧪 Testing

### Checklist de Pruebas

#### Funcionalidad Básica
- [ ] Al abrir un capítulo, se muestra correctamente
- [ ] Botón "Siguiente Capítulo" funciona y carga el siguiente
- [ ] Botón "Capítulo Anterior" funciona y carga el anterior
- [ ] Botón "Volver al Santuario" cierra el lector
- [ ] Los botones se ocultan correctamente según la posición

#### Edge Cases
- [ ] Primer capítulo: solo muestra "Siguiente" e "Inicio"
- [ ] Último capítulo: solo muestra "Anterior" e "Inicio"
- [ ] Capítulo único: solo muestra "Inicio"
- [ ] Error al cargar capítulo: muestra toast de error

#### UX
- [ ] Loading spinner aparece al cambiar de capítulo
- [ ] Botones deshabilitados durante la carga
- [ ] Scroll automático al inicio al cambiar de capítulo
- [ ] Toast notifications funcionan correctamente

#### Responsive
- [ ] Desktop: botones en fila horizontal
- [ ] Mobile: botones en columna vertical
- [ ] Textos se adaptan (completo en desktop, corto en mobile)
- [ ] Touch targets son suficientemente grandes (44px mínimo)

#### Performance
- [ ] No hay re-renders innecesarios
- [ ] Las páginas se cargan eficientemente
- [ ] La transición entre capítulos es fluida

---

## 📊 Impacto en el Código

### Archivos Modificados
- ✏️ `src/components/Reader.jsx` (~30 líneas agregadas/modificadas)
- ✏️ `src/components/DetailModal.jsx` (~60 líneas agregadas)

### Nuevos Estados en DetailModal
- `currentChapterIndex: number` - Índice del capítulo actual en la lista

### Nuevas Funciones en DetailModal
- `goToNextChapter(): Promise<void>` - Navega al siguiente capítulo
- `goToPreviousChapter(): Promise<void>` - Navega al capítulo anterior

### Nuevas Props en Reader
- `onNextChapter?: () => void` - Callback para siguiente capítulo
- `onPreviousChapter?: () => void` - Callback para capítulo anterior
- `hasNextChapter?: boolean` - Indica si hay siguiente capítulo
- `hasPreviousChapter?: boolean` - Indica si hay capítulo anterior
- `isLoadingChapter?: boolean` - Indica si está cargando un capítulo

---

## 🎯 Resultado Final

### Antes
```
[Páginas del capítulo]
↓
¡DEVORASTE ESTE CAPÍTULO! 🥑
[VOLVER AL SANTUARIO]
```

### Después
```
[Páginas del capítulo]
↓
¡DEVORASTE ESTE CAPÍTULO! 🥑
[← ANTERIOR] [🏠 INICIO] [SIGUIENTE →]
```

### Beneficios
1. ✅ **Lectura continua** sin salir del lector
2. ✅ **Menos clics** para leer múltiples capítulos
3. ✅ **Mejor UX** - navegación intuitiva
4. ✅ **Responsive** - funciona en mobile y desktop
5. ✅ **Feedback visual** - loading states y toasts
6. ✅ **Manejo de errores** - fallbacks y mensajes claros

---

## 💡 Mejoras Futuras (Opcional)

### Fase 2: Funcionalidades Avanzadas

1. **Precarga del siguiente capítulo**
   - Cargar el siguiente capítulo en background
   - Transición instantánea al cambiar

2. **Historial de lectura**
   - Guardar el capítulo actual
   - Retomar desde donde se quedó

3. **Modo autoplay**
   - Avanzar automáticamente al siguiente capítulo al finalizar

4. **Progress bar**
   - Mostrar progreso dentro del capítulo
   - Indicador de "X de Y capítulos leídos"

5. **Gestos táctiles** (Mobile)
   - Swipe izquierda/derecha para cambiar de capítulo

---

## ⏱️ Estimación de Tiempo

| Tarea | Tiempo Estimado |
|-------|----------------|
| Modificar DetailModal.jsx | 20 minutos |
| Modificar Reader.jsx | 15 minutos |
| Testing básico | 10 minutos |
| Ajustes de diseño | 10 minutos |
| Testing completo | 15 minutos |
| **TOTAL** | **70 minutos (~1.2 horas)** |

---

## 📝 Checklist de Implementación

- [ ] Agregar estado `currentChapterIndex` en DetailModal
- [ ] Modificar función `openReader` para guardar índice
- [ ] Crear función `goToNextChapter`
- [ ] Crear función `goToPreviousChapter`
- [ ] Calcular `hasNextChapter` y `hasPreviousChapter`
- [ ] Actualizar props del componente Reader
- [ ] Modificar Reader para recibir nuevas props
- [ ] Agregar iconos necesarios en Reader
- [ ] Diseñar sección de navegación en Reader
- [ ] Agregar loading state y toast notifications
- [ ] Testing en desktop
- [ ] Testing en mobile
- [ ] Ajustes finales de UX

---

**Estado**: ✅ Plan completo y listo para implementar  
**Complejidad**: Media  
**Riesgo**: Bajo (cambios aislados, no afecta otras funcionalidades)  
**Valor para el usuario**: Alto (mejora significativa en la experiencia de lectura)
