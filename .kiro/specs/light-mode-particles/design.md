# Design Document: Light Mode Particles

## Overview

Este diseño implementa un sistema de animación de partículas para el modo claro de la aplicación. El sistema genera partículas visuales sutiles que flotan en el fondo, complementando el esquema de colores existente sin interferir con la usabilidad. La implementación utiliza CSS para animaciones optimizadas y React para la integración con el sistema de temas.

## Architecture

### Component Structure

```
LightParticles (React Component)
├── Integración con ThemeContext
├── Generación de partículas (array de objetos)
├── Renderizado condicional basado en tema
└── Estilos CSS para animación
```

### Integration Points

- **ThemeContext**: Lee el estado actual del tema (`light`, `dark`)
- **ChristmasThemeContext**: Verifica si el modo navideño está activo
- **App.jsx**: Componente principal donde se montará `LightParticles`
- **index.css**: Estilos globales para animaciones CSS

## Components and Interfaces

### LightParticles Component

**Props**: Ninguno (lee contexto directamente)

**State**:
- `particles`: Array de objetos de partícula con propiedades aleatorias

**Hooks utilizados**:
- `useTheme()`: Accede al tema actual
- `useChristmasTheme()`: Verifica modo navideño
- `useMemo()`: Genera array de partículas una sola vez

**Estructura de Partícula**:
```typescript
interface Particle {
  id: number;
  size: number;        // 2-8px
  left: string;        // 0-100%
  top: string;         // 0-100%
  duration: number;    // 3-8s
  delay: number;       // 0-5s
  opacity: number;     // 0.1-0.4
}
```

### CSS Animations

**Keyframes**:
- `float-particle`: Movimiento vertical y horizontal suave
- `fade-in-particle`: Aparición gradual de partículas

**Propiedades optimizadas**:
- `transform`: Para movimiento (GPU-accelerated)
- `opacity`: Para desvanecimiento
- `will-change`: Hint para el navegador

## Data Models

### Particle Configuration

```javascript
const PARTICLE_CONFIG = {
  count: {
    desktop: 40,      // Pantallas > 768px
    mobile: 20        // Pantallas <= 768px
  },
  size: {
    min: 2,
    max: 8
  },
  duration: {
    min: 3,
    max: 8
  },
  opacity: {
    min: 0.1,
    max: 0.4
  },
  colors: [
    'rgba(190, 227, 176, 0.6)',  // potaxie-green-pastel
    'rgba(255, 204, 128, 0.5)',  // potaxie-cream-dark
    'rgba(201, 235, 179, 0.4)',  // potaxie-light-green
    'rgba(230, 167, 0, 0.3)'     // potaxie-yellow
  ]
};
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de correctness verificables por máquina.*

### Property 1: Opacidad de Partículas

*Para cualquier* partícula generada por el sistema, su valor de opacidad debe estar entre 0.1 y 0.5 (inclusive).

**Validates: Requirements 2.2**

### Property 2: Cantidad de Partículas en Rango

*Para cualquier* renderizado del componente LightParticles, el número de partículas generadas debe estar entre 20 y 50 (inclusive), ajustándose según el tamaño de pantalla.

**Validates: Requirements 2.4, 4.2**

### Property 3: Variación de Velocidad

*Para cualquier* conjunto de partículas generadas, debe existir variación en las duraciones de animación - no todas las partículas deben tener la misma duración.

**Validates: Requirements 3.2**

### Property 4: Variación de Tamaño

*Para cualquier* conjunto de partículas generadas, debe existir variación en los tamaños - no todas las partículas deben tener el mismo tamaño.

**Validates: Requirements 3.4**

## Error Handling

### Casos de Error

1. **Contexto no disponible**: Si ThemeContext no está disponible, el componente no debe renderizarse y debe loggear un warning en desarrollo.

2. **Rendimiento degradado**: Si el navegador no soporta `will-change` o animaciones CSS, las partículas deben renderizarse estáticas o no renderizarse.

3. **Memoria insuficiente**: Si la generación de partículas falla, capturar el error y renderizar versión simplificada con menos partículas.

### Estrategia de Fallback

```javascript
try {
  // Generar partículas normalmente
} catch (error) {
  console.warn('Failed to generate particles:', error);
  // Renderizar versión simplificada con 10 partículas
}
```

## Testing Strategy

### Unit Tests

Los unit tests verificarán ejemplos específicos y casos edge:

1. **Renderizado condicional**:
   - Verificar que el componente se renderiza cuando `theme === 'light'`
   - Verificar que el componente NO se renderiza cuando `theme === 'dark'`
   - Verificar que el componente NO se renderiza cuando `isChristmasMode === true`

2. **Estructura del DOM**:
   - Verificar que el contenedor tiene `position: fixed` y cubre el viewport
   - Verificar que el contenedor tiene `z-index` negativo o bajo
   - Verificar que el contenedor tiene `pointer-events: none`

3. **Propiedades CSS**:
   - Verificar que las animaciones usan `transform` y `opacity`
   - Verificar que los colores están en el rango del esquema potaxie

4. **Integración con contextos**:
   - Verificar que el componente usa `useTheme()` correctamente
   - Verificar que el componente usa `useChristmasTheme()` correctamente

### Property-Based Tests

Los property tests verificarán propiedades universales a través de múltiples ejecuciones:

1. **Property Test 1: Opacidad válida**
   - Generar múltiples conjuntos de partículas
   - Verificar que TODAS las partículas tienen opacidad entre 0.1 y 0.5
   - Mínimo 100 iteraciones

2. **Property Test 2: Cantidad en rango**
   - Generar múltiples conjuntos de partículas para diferentes tamaños de pantalla
   - Verificar que el número total está entre 20 y 50
   - Mínimo 100 iteraciones

3. **Property Test 3: Variación de velocidad**
   - Generar múltiples conjuntos de partículas
   - Verificar que existen al menos 2 duraciones diferentes en cada conjunto
   - Mínimo 100 iteraciones

4. **Property Test 4: Variación de tamaño**
   - Generar múltiples conjuntos de partículas
   - Verificar que existen al menos 2 tamaños diferentes en cada conjunto
   - Mínimo 100 iteraciones

### Testing Framework

- **Unit Tests**: Vitest + React Testing Library
- **Property Tests**: fast-check (JavaScript property-based testing library)

### Test Configuration

Cada property test debe:
- Ejecutarse con mínimo 100 iteraciones
- Incluir tag de comentario: `Feature: light-mode-particles, Property N: [descripción]`
- Fallar con mensaje descriptivo mostrando el contraejemplo

## Implementation Notes

### Performance Considerations

1. **Memoización**: Usar `useMemo` para generar partículas solo una vez
2. **CSS Animations**: Preferir CSS sobre JavaScript para animaciones
3. **GPU Acceleration**: Usar `transform` y `opacity` exclusivamente
4. **Lazy Loading**: Considerar no renderizar partículas en dispositivos de bajo rendimiento

### Responsive Behavior

```javascript
const getParticleCount = () => {
  if (typeof window === 'undefined') return 40;
  return window.innerWidth <= 768 ? 20 : 40;
};
```

### Accessibility

- Las partículas son puramente decorativas
- Usar `aria-hidden="true"` en el contenedor
- No interferir con lectores de pantalla
- No afectar navegación por teclado

### Browser Compatibility

- Soporte mínimo: Chrome 90+, Firefox 88+, Safari 14+
- Fallback para navegadores antiguos: no renderizar partículas
- Detección de soporte: `CSS.supports('transform', 'translateZ(0)')`
