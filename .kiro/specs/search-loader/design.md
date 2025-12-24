# Design Document: Search Loader Animation

## Overview

Este diseño implementa una animación de carga específica para búsquedas en la aplicación El Santuario Potaxie. La solución reutiliza la estructura del componente PageLoader existente pero con una imagen y texto diferentes, y garantiza que la posición de scroll se mantenga durante las búsquedas (a diferencia de la paginación que sí hace scroll).

## Architecture

La arquitectura sigue el patrón existente de loaders en la aplicación:

```
App.jsx
├── SearchLoader (nuevo componente)
│   ├── Props: isLoading
│   └── Renderiza: overlay + animación + imagen "search loading.png"
├── PageLoader (componente existente)
│   ├── Props: isLoading
│   └── Renderiza: overlay + animación + imagen "otter.png"
└── Estados:
    ├── loading (para búsquedas)
    └── isPaginationLoading (para paginación)
```

### Flujo de Datos

1. **Búsqueda Inicial**: Usuario ejecuta búsqueda → `handleSearch()` → `setLoading(true)` → SearchLoader visible → búsqueda completa → `setLoading(false)`

2. **Paginación**: Usuario cambia página → `goToNextPage()`/`goToPreviousPage()` → `setIsPaginationLoading(true)` → PageLoader visible → scroll a resultados → `setIsPaginationLoading(false)`

## Components and Interfaces

### SearchLoader Component

```typescript
interface SearchLoaderProps {
  isLoading: boolean;
}

// Componente funcional de React
const SearchLoader: React.FC<SearchLoaderProps> = ({ isLoading }) => {
  // Estados internos para animación
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  
  // Efectos para animar progreso y puntos
  // Renderiza overlay con framer-motion AnimatePresence
  // Muestra imagen "/search loading.png"
  // Muestra texto "Searching{dots}"
  // Muestra barra de progreso animada
}
```

### Modificaciones en App.jsx

```typescript
// Importar nuevo componente
import { SearchLoader } from './components/SearchLoader';

// En el render, antes de PageLoader:
<SearchLoader isLoading={loading} />
<PageLoader isLoading={isPaginationLoading} />

// En handleSearch: NO modificar el scroll
// El estado 'loading' ya existe y se usa correctamente

// En goToNextPage/goToPreviousPage: mantener el scroll a resultsRef
// El estado 'isPaginationLoading' ya existe y se usa correctamente
```

## Data Models

No se requieren nuevos modelos de datos. Se utilizan los estados existentes:

```typescript
// Estados existentes en App.jsx
const [loading, setLoading] = useState(false);           // Para búsquedas
const [isPaginationLoading, setIsPaginationLoading] = useState(false); // Para paginación
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquina.*

### Property 1: SearchLoader renderiza contenido correcto
*Para cualquier* renderizado de SearchLoader cuando isLoading es true, el componente debe mostrar la imagen con src "/search loading.png", el texto debe contener "Searching", debe existir una barra de progreso, y debe tener un overlay con backdrop-blur.
**Validates: Requirements 1.2, 1.3, 1.4, 2.5**

### Property 2: handleSearch activa SearchLoader
*Para cualquier* ejecución de handleSearch sin pageOverride (búsqueda inicial), el estado loading debe establecerse en true inmediatamente después de la invocación.
**Validates: Requirements 2.1, 4.1**

### Property 3: Búsqueda completada desactiva SearchLoader
*Para cualquier* búsqueda que se completa (exitosa o con error), el estado loading debe establecerse en false al finalizar.
**Validates: Requirements 2.2**

### Property 4: Scroll position se preserva durante búsqueda
*Para cualquier* búsqueda ejecutada, la posición de scroll del viewport antes de mostrar SearchLoader debe ser igual a la posición después de ocultar SearchLoader (tolerancia de ±5px por redondeo del navegador).
**Validates: Requirements 2.3, 3.1, 3.2, 3.4**

### Property 5: scrollIntoView no se ejecuta durante búsquedas
*Para cualquier* ejecución de handleSearch sin pageOverride, la función scrollIntoView no debe ser invocada en resultsRef.
**Validates: Requirements 3.3**

### Property 6: Paginación usa PageLoader exclusivamente
*Para cualquier* ejecución de goToNextPage o goToPreviousPage, el estado isPaginationLoading debe establecerse en true y el estado loading debe permanecer en false.
**Validates: Requirements 2.4, 4.2**

### Property 7: Exclusividad mutua de loaders
*Para cualquier* momento en el tiempo durante la ejecución de la aplicación, los estados loading e isPaginationLoading no deben ser ambos true simultáneamente.
**Validates: Requirements 4.4**

## Error Handling

### Casos de Error

1. **Imagen no encontrada**: Si "search loading.png" no existe, el navegador mostrará el alt text. No se requiere manejo especial ya que es un error de deployment.

2. **Búsqueda falla**: El estado loading debe establecerse en false en el bloque finally o catch de handleSearch para garantizar que el loader se oculta incluso si hay error.

3. **Estados inconsistentes**: Si por algún bug ambos loaders se activan, el último en el DOM (PageLoader) tendrá precedencia visual debido al z-index.

### Estrategia de Recuperación

```typescript
const handleSearch = async (e, pageOverride = null) => {
  try {
    setLoading(true);
    // ... lógica de búsqueda
  } catch (error) {
    console.error('Search error:', error);
    showToast('Error en la búsqueda');
  } finally {
    setLoading(false); // Garantiza que el loader se oculta
  }
};
```

## Testing Strategy

### Dual Testing Approach

La estrategia de testing combina pruebas unitarias para casos específicos y pruebas basadas en propiedades para verificar comportamientos universales:

- **Unit Tests**: Verifican ejemplos específicos, casos edge y condiciones de error
- **Property Tests**: Verifican que las propiedades universales se mantienen en todos los inputs

Ambos tipos de pruebas son complementarios y necesarios para cobertura comprehensiva.

### Unit Tests

**Framework**: React Testing Library + Jest (ya configurado en el proyecto)

**Casos a probar**:

1. **SearchLoader renderiza correctamente**
   - Renderizar con isLoading=true y verificar imagen, texto, barra de progreso
   - Renderizar con isLoading=false y verificar que no se muestra nada

2. **Animaciones de progreso**
   - Verificar que el progreso aumenta de 0 a 100
   - Verificar que los dots se animan (...) 

3. **Integración con App**
   - Simular búsqueda y verificar que SearchLoader aparece
   - Simular paginación y verificar que PageLoader aparece (no SearchLoader)

4. **Manejo de errores**
   - Simular error en búsqueda y verificar que loader se oculta

### Property-Based Tests

**Framework**: fast-check (para JavaScript/TypeScript)

**Configuración**: Mínimo 100 iteraciones por propiedad

**Propiedades a implementar**:

Cada propiedad debe etiquetarse con:
```javascript
// Feature: search-loader, Property N: [descripción]
```

1. **Property 1: SearchLoader renderiza contenido correcto**
   - Generar: estados booleanos aleatorios para isLoading
   - Verificar: cuando true, todos los elementos requeridos están presentes

2. **Property 2: handleSearch activa SearchLoader**
   - Generar: queries de búsqueda aleatorias, filtros aleatorios
   - Verificar: loading = true después de invocar handleSearch

3. **Property 3: Búsqueda completada desactiva SearchLoader**
   - Generar: búsquedas que completan (mock de API)
   - Verificar: loading = false después de completar

4. **Property 4: Scroll position se preserva**
   - Generar: posiciones de scroll aleatorias (0-10000px)
   - Verificar: posición antes === posición después (±5px)

5. **Property 5: scrollIntoView no se ejecuta**
   - Generar: búsquedas aleatorias
   - Verificar: spy de scrollIntoView no fue llamado

6. **Property 6: Paginación usa PageLoader**
   - Generar: números de página aleatorios
   - Verificar: isPaginationLoading = true, loading = false

7. **Property 7: Exclusividad mutua**
   - Generar: secuencias aleatorias de acciones (búsqueda, paginación)
   - Verificar: nunca ambos estados true simultáneamente

### Testing Balance

- **Unit tests**: Enfocados en casos específicos y ejemplos concretos
- **Property tests**: Cubren el espacio de inputs ampliamente mediante randomización
- Evitar demasiados unit tests - las property tests manejan la cobertura de muchos inputs
- Unit tests deben enfocarse en:
  - Ejemplos específicos que demuestran comportamiento correcto
  - Puntos de integración entre componentes
  - Casos edge y condiciones de error

## Implementation Notes

### Reutilización de Código

El componente SearchLoader debe ser casi idéntico a PageLoader, con solo estos cambios:

1. Imagen: `/search loading.png` en lugar de `/otter.png`
2. Texto: `Searching{dots}` en lugar de `Loading Page{dots}`
3. Subtexto: `Buscando tu próximo vicio` en lugar de `Obteniendo nuevos resultados`

### Consideraciones de Performance

- Las animaciones usan framer-motion que ya está en el proyecto
- El overlay con backdrop-blur puede ser costoso en dispositivos móviles, pero es consistente con PageLoader
- Los efectos de progreso y dots usan setInterval, limpiar en cleanup

### Accesibilidad

- Agregar `role="status"` y `aria-live="polite"` al overlay para lectores de pantalla
- Agregar `aria-label="Searching for content"` al contenedor principal
- El texto "Searching..." proporciona feedback visual claro

### Responsive Design

- Usar las mismas clases responsive que PageLoader
- Tamaños de imagen: `w-32 h-32` (consistente con PageLoader)
- Ancho de barra de progreso: `w-80 max-w-full` (consistente con PageLoader)
