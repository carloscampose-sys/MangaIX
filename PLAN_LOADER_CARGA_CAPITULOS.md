# Plan: Loader Animado para Carga de Capítulos

## Objetivo
Implementar una pantalla de carga animada que se muestre mientras se cargan los capítulos en el lector, con una imagen de personaje, texto animado y un círculo de progreso con porcentaje.

## Referencia Visual
- Imagen de referencia proporcionada por el usuario
- Imagen a usar: `public/Carga cap.png` (hurón/panda rojo leyendo)

## Componentes a Crear

### 1. Componente `ChapterLoader.jsx`
**Ubicación**: `src/components/ChapterLoader.jsx`

**Características**:
- Pantalla de carga centrada con fondo semi-transparente
- Imagen del personaje (`Carga cap.png`)
- Texto "Cargando capítulo" con puntos suspensivos animados (...)
- Círculo de progreso animado con porcentaje en el centro
- Animaciones suaves con Framer Motion

**Estructura Visual**:
```
┌─────────────────────────────────┐
│                                 │
│         [IMAGEN PERSONAJE]      │
│                                 │
│     Cargando capítulo...        │
│                                 │
│         ╱─────────╲             │
│        │    45%    │             │
│         ╲─────────╱             │
│      (círculo animado)          │
│                                 │
└─────────────────────────────────┘
```

**Props**:
- `progress` (number): Porcentaje de carga (0-100)
- `isVisible` (boolean): Controla la visibilidad del loader

### 2. Hook Personalizado `useChapterLoader.js`
**Ubicación**: `src/hooks/useChapterLoader.js`

**Funcionalidad**:
- Simular progreso de carga realista
- Incremento gradual del porcentaje
- Velocidad variable (rápido al inicio, más lento al final)
- Reset automático al completar

**Estados**:
- `progress`: Porcentaje actual (0-100)
- `isLoading`: Estado de carga activo

**Métodos**:
- `startLoading()`: Inicia la simulación de carga
- `completeLoading()`: Completa instantáneamente al 100%
- `resetLoading()`: Reinicia el progreso a 0

## Modificaciones en Componentes Existentes

### 3. Modificar `Reader.jsx`
**Cambios necesarios**:

1. **Importar el nuevo componente**:
```javascript
import { ChapterLoader } from './ChapterLoader';
import { useChapterLoader } from '../hooks/useChapterLoader';
```

2. **Agregar hook de carga**:
```javascript
const { progress, isLoading, startLoading, completeLoading, resetLoading } = useChapterLoader();
```

3. **Modificar handlers de navegación**:
```javascript
const handleNextChapter = async () => {
    startLoading(); // Iniciar loader
    
    if (mangaId && chapterId) {
        readingProgressService.clearProgress(mangaId, chapterId);
    }
    
    autoSaveProgress();
    
    if (onNextChapter) {
        await onNextChapter();
    }
    
    completeLoading(); // Completar loader
};

const handlePreviousChapter = async () => {
    startLoading(); // Iniciar loader
    
    if (mangaId && chapterId) {
        readingProgressService.clearProgress(mangaId, chapterId);
    }
    
    if (onPreviousChapter) {
        await onPreviousChapter();
    }
    
    completeLoading(); // Completar loader
};
```

4. **Agregar loader al JSX**:
```javascript
return (
    <motion.div>
        {/* Contenido existente del Reader */}
        
        {/* Nuevo: Loader de capítulos */}
        <ChapterLoader 
            progress={progress} 
            isVisible={isLoading} 
        />
    </motion.div>
);
```

### 4. Modificar `DetailModal.jsx`
**Cambios necesarios**:

1. **Agregar estado de progreso de carga**:
```javascript
const [loadingProgress, setLoadingProgress] = useState(0);
```

2. **Modificar `openReader`, `goToNextChapter`, `goToPreviousChapter`**:
- Simular progreso mientras se cargan las páginas
- Actualizar `loadingProgress` durante la carga

3. **Pasar props al Reader**:
```javascript
<Reader
    // ... props existentes
    loadingProgress={loadingProgress}
    isLoadingChapter={isOpeningReader}
/>
```

## Detalles de Implementación

### Animaciones

#### 1. Puntos Suspensivos Animados
```javascript
// Animación de "..." que aparecen y desaparecen
const dots = [".", "..", "..."];
// Ciclo cada 500ms
```

#### 2. Círculo de Progreso
**Características**:
- SVG circular con `stroke-dasharray` y `stroke-dashoffset`
- Animación suave con Framer Motion
- Colores: Verde potaxie (#A7D08C) para el progreso
- Fondo gris claro para el círculo base
- Grosor: 8-10px
- Diámetro: 120-150px

**Cálculo del progreso**:
```javascript
const circumference = 2 * Math.PI * radius;
const offset = circumference - (progress / 100) * circumference;
```

#### 3. Imagen del Personaje
**Características**:
- Animación de "bounce" suave
- Escala ligeramente (0.95 → 1.05)
- Duración: 2s
- Loop infinito
- Easing: ease-in-out

#### 4. Texto del Porcentaje
**Características**:
- Fuente grande y bold
- Color: Gris oscuro o negro
- Animación de cambio de número suave
- Formato: "45%"

### Estilos y Responsive

#### Desktop (lg+)
- Imagen: 200-250px
- Círculo: 150px diámetro
- Texto: 18-20px
- Porcentaje: 32-36px

#### Tablet (md)
- Imagen: 150-180px
- Círculo: 120px diámetro
- Texto: 16-18px
- Porcentaje: 28-32px

#### Mobile (sm)
- Imagen: 120-150px
- Círculo: 100px diámetro
- Texto: 14-16px
- Porcentaje: 24-28px

### Simulación de Progreso Realista

**Fases de carga**:
1. **Fase 1 (0-30%)**: Rápido - 50ms por incremento
2. **Fase 2 (30-70%)**: Medio - 100ms por incremento
3. **Fase 3 (70-90%)**: Lento - 200ms por incremento
4. **Fase 4 (90-100%)**: Muy lento - 300ms por incremento

**Implementación**:
```javascript
const simulateProgress = () => {
    let current = 0;
    const interval = setInterval(() => {
        if (current < 30) {
            current += 2; // Rápido
        } else if (current < 70) {
            current += 1; // Medio
        } else if (current < 90) {
            current += 0.5; // Lento
        } else if (current < 100) {
            current += 0.2; // Muy lento
        }
        
        setProgress(Math.min(current, 99)); // Nunca llegar a 100 automáticamente
        
        if (current >= 99) {
            clearInterval(interval);
        }
    }, 50);
};
```

## Casos de Uso

### 1. Abrir Capítulo desde DetailModal
```
Usuario hace clic en "Cap 1"
→ Loader aparece (0%)
→ Progreso simula carga (0% → 99%)
→ Páginas se cargan en background
→ Al completar: 100% y fade out
→ Reader muestra el capítulo
```

### 2. Siguiente Capítulo
```
Usuario hace clic en "SIGUIENTE"
→ Auto-guarda progreso
→ Loader aparece (0%)
→ Progreso simula carga
→ Capítulo siguiente se carga
→ Loader desaparece
→ Nuevo capítulo se muestra
```

### 3. Capítulo Anterior
```
Usuario hace clic en "ANTERIOR"
→ Loader aparece (0%)
→ Progreso simula carga
→ Capítulo anterior se carga
→ Loader desaparece
→ Capítulo anterior se muestra
```

## Estructura de Archivos

```
src/
├── components/
│   ├── ChapterLoader.jsx          # NUEVO
│   ├── Reader.jsx                 # MODIFICAR
│   └── DetailModal.jsx            # MODIFICAR
├── hooks/
│   └── useChapterLoader.js        # NUEVO
└── ...

public/
└── Carga cap.png                  # EXISTENTE (usar esta)
```

## Checklist de Implementación

### Fase 1: Crear Componentes Base
- [ ] Crear `ChapterLoader.jsx`
  - [ ] Estructura básica del componente
  - [ ] Importar imagen `Carga cap.png`
  - [ ] Layout centrado con flexbox
  - [ ] Fondo semi-transparente

### Fase 2: Implementar Animaciones
- [ ] Texto "Cargando capítulo" con puntos animados
- [ ] Animación bounce de la imagen
- [ ] Círculo de progreso SVG
- [ ] Animación del porcentaje
- [ ] Transiciones de entrada/salida con Framer Motion

### Fase 3: Hook de Carga
- [ ] Crear `useChapterLoader.js`
- [ ] Implementar simulación de progreso
- [ ] Métodos start/complete/reset
- [ ] Fases de velocidad variable

### Fase 4: Integración con Reader
- [ ] Importar ChapterLoader en Reader.jsx
- [ ] Agregar hook useChapterLoader
- [ ] Modificar handleNextChapter
- [ ] Modificar handlePreviousChapter
- [ ] Agregar loader al JSX

### Fase 5: Integración con DetailModal
- [ ] Agregar estado de progreso
- [ ] Modificar openReader
- [ ] Modificar goToNextChapter
- [ ] Modificar goToPreviousChapter
- [ ] Pasar props al Reader

### Fase 6: Responsive y Pulido
- [ ] Estilos responsive (mobile, tablet, desktop)
- [ ] Ajustar tamaños de imagen
- [ ] Ajustar tamaños de círculo
- [ ] Ajustar tamaños de texto
- [ ] Testing en diferentes dispositivos

### Fase 7: Testing
- [ ] Probar carga inicial de capítulo
- [ ] Probar navegación siguiente
- [ ] Probar navegación anterior
- [ ] Probar en mobile
- [ ] Probar en tablet
- [ ] Probar en desktop
- [ ] Verificar animaciones suaves
- [ ] Verificar que no bloquea la UI

## Consideraciones Técnicas

### Performance
- Usar `requestAnimationFrame` para animaciones suaves
- Lazy loading de la imagen del personaje
- Optimizar re-renders con `React.memo` si es necesario

### Accesibilidad
- Agregar `role="status"` al loader
- Agregar `aria-live="polite"` para lectores de pantalla
- Texto alternativo descriptivo para la imagen

### UX
- Loader debe aparecer solo si la carga toma más de 200ms
- Mínimo de 500ms de visualización para evitar flashes
- Transiciones suaves de entrada/salida (300ms)
- No bloquear interacción del usuario (poder cancelar)

## Colores y Tema

### Colores Principales
- **Progreso**: `#A7D08C` (potaxie-green)
- **Fondo círculo**: `#E5E7EB` (gray-200)
- **Texto**: `#1F2937` (gray-800)
- **Fondo overlay**: `rgba(0, 0, 0, 0.7)` con backdrop-blur

### Modo Oscuro (Opcional)
- **Progreso**: `#A7D08C` (mantener)
- **Fondo círculo**: `#374151` (gray-700)
- **Texto**: `#F9FAFB` (gray-50)
- **Fondo overlay**: `rgba(0, 0, 0, 0.85)` con backdrop-blur

## Notas Adicionales

1. **Imagen del personaje**: Ya existe en `public/Carga cap.png` - es un hurón/panda rojo adorable leyendo un libro
2. **Sincronización**: El progreso debe sincronizarse con la carga real de páginas cuando sea posible
3. **Fallback**: Si la carga es muy rápida (<200ms), no mostrar el loader
4. **Error handling**: Si falla la carga, mostrar mensaje de error en lugar del loader
5. **Cancelación**: Permitir cerrar el Reader mientras carga (cancelar la carga)

## Resultado Esperado

Una experiencia de carga fluida y visualmente atractiva que:
- Informa al usuario que algo está pasando
- Muestra progreso visual claro
- Mantiene la estética "potaxie" del sitio
- Es responsive en todos los dispositivos
- No bloquea la interacción del usuario
- Proporciona feedback constante durante la espera
