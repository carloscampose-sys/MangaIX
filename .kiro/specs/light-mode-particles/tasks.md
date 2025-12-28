# Implementation Plan: Light Mode Particles

## Overview

Este plan implementa un sistema de animación de partículas para el modo claro de la aplicación. La implementación se divide en tareas incrementales que construyen el componente, agregan estilos CSS, integran con el sistema de temas, y finalmente añaden tests.

## Tasks

- [x] 1. Crear componente base LightParticles
  - Crear archivo `src/components/LightParticles.jsx`
  - Implementar estructura básica del componente React
  - Exportar el componente
  - _Requirements: 1.1, 5.1_

- [ ] 2. Implementar lógica de generación de partículas
  - [x] 2.1 Crear configuración de partículas (PARTICLE_CONFIG)
    - Definir constantes para cantidad, tamaño, duración, opacidad y colores
    - Implementar función `getParticleCount()` para responsive
    - _Requirements: 2.1, 2.2, 2.4, 6.2_

  - [x] 2.2 Implementar función de generación de partículas
    - Crear función que genera array de objetos Particle con propiedades aleatorias
    - Usar `useMemo` para memoizar el array de partículas
    - Asegurar variación en tamaño, velocidad, posición y opacidad
    - _Requirements: 2.4, 3.2, 3.4_

  - [ ] 2.3 Write property test for particle opacity
    - **Property 1: Opacidad de Partículas**
    - **Validates: Requirements 2.2**

  - [ ] 2.4 Write property test for particle count
    - **Property 2: Cantidad de Partículas en Rango**
    - **Validates: Requirements 2.4, 4.2**

- [ ] 3. Implementar integración con sistema de temas
  - [x] 3.1 Integrar ThemeContext y ChristmasThemeContext
    - Importar y usar hooks `useTheme()` y `useChristmasTheme()`
    - Implementar renderizado condicional basado en tema
    - Solo renderizar cuando `theme === 'light'` y `!isChristmasMode`
    - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3_

  - [ ] 3.2 Write unit tests for conditional rendering
    - Test que verifica renderizado en modo light
    - Test que verifica NO renderizado en modo dark
    - Test que verifica NO renderizado en christmas mode
    - _Requirements: 1.1, 1.2, 5.3_

- [ ] 4. Implementar estilos CSS y animaciones
  - [x] 4.1 Agregar keyframes de animación en index.css
    - Crear keyframe `float-particle` para movimiento suave
    - Crear keyframe `fade-in-particle` para aparición gradual
    - Usar `transform` y `opacity` para GPU acceleration
    - _Requirements: 2.3, 3.1, 4.1_

  - [x] 4.2 Implementar estilos del contenedor de partículas
    - Position fixed con inset-0 para cubrir viewport completo
    - Z-index negativo para posicionar detrás del contenido
    - Pointer-events none para no interferir con interacciones
    - _Requirements: 1.3, 1.4, 4.4_

  - [x] 4.3 Implementar estilos individuales de partículas
    - Aplicar tamaño, posición, opacidad y color dinámicamente
    - Aplicar animaciones con duración y delay variables
    - Usar border-radius para forma circular
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.4_

  - [ ] 4.4 Write unit tests for CSS properties
    - Test que verifica z-index bajo/negativo
    - Test que verifica pointer-events none
    - Test que verifica position fixed
    - _Requirements: 1.3, 4.4_

- [x] 5. Checkpoint - Verificar renderizado y animación
  - Asegurar que las partículas se renderizan correctamente en modo light
  - Verificar que las animaciones son suaves y no causan lag
  - Confirmar que no interfieren con interacciones del usuario
  - Preguntar al usuario si hay ajustes necesarios

- [ ] 6. Implementar property tests para variación
  - [ ] 6.1 Write property test for speed variation
    - **Property 3: Variación de Velocidad**
    - **Validates: Requirements 3.2**

  - [ ] 6.2 Write property test for size variation
    - **Property 4: Variación de Tamaño**
    - **Validates: Requirements 3.4**

- [ ] 7. Integrar componente en App.jsx
  - [x] 7.1 Importar LightParticles en App.jsx
    - Agregar import statement
    - Posicionar componente al mismo nivel que SnowEffect
    - _Requirements: 5.4_

  - [x] 7.2 Verificar coexistencia con efectos existentes
    - Confirmar que no hay conflictos con SnowEffect
    - Confirmar que no hay conflictos con el efecto de estrellas
    - _Requirements: 5.4_

  - [ ] 7.3 Write integration tests
    - Test de integración con ThemeContext
    - Test de integración con ChristmasThemeContext
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Optimización y ajustes finales
  - [x] 8.1 Implementar detección de rendimiento
    - Agregar lógica para reducir partículas en dispositivos lentos (opcional)
    - Agregar fallback para navegadores sin soporte CSS
    - _Requirements: 4.3_

  - [x] 8.2 Agregar atributos de accesibilidad
    - Agregar `aria-hidden="true"` al contenedor
    - Verificar que no afecta navegación por teclado
    - _Requirements: 4.4_

  - [ ] 8.3 Write unit tests for accessibility
    - Test que verifica aria-hidden
    - Test que verifica no interferencia con keyboard navigation
    - _Requirements: 4.4_

- [ ] 9. Final checkpoint - Asegurar que todos los tests pasan
  - Ejecutar todos los unit tests
  - Ejecutar todos los property tests
  - Verificar que no hay regresiones
  - Preguntar al usuario si hay ajustes finales necesarios

## Notes

- Todas las tareas son requeridas para una implementación completa
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctness
- Los unit tests validan ejemplos específicos y casos edge
