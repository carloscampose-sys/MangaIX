# Implementation Plan: Gender Selection Flow

## Overview

Este plan implementa la funcionalidad de selección de género que aparece después de la pantalla de bienvenida. El flujo integra un nuevo componente `GenderSelectionScreen` en el flujo de inicialización de la aplicación, mantiene la consistencia visual con la pantalla de bienvenida, y persiste la selección en localStorage.

## Tasks

- [x] 1. Preparar assets de figuras ilustradas
  - Extraer las tres figuras de la imagen de referencia usando remove.bg o herramienta similar
  - Remover fondo y texto de cada figura
  - Recortar y optimizar cada figura (300-400px de altura)
  - Exportar como PNG con transparencia
  - Guardar en `public/` con nombres: `gender-masculino.png`, `gender-femenino.png`, `gender-otro.png`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Crear componente de animación de estrellas
  - Crear archivo `src/components/StarAnimation.jsx`
  - Implementar animación de estrellas usando CSS puro (similar a SnowEffect.jsx)
  - Configurar 30-50 estrellas con tamaños y opacidades variables
  - Implementar animación de parpadeo (twinkle) con keyframes
  - Asegurar rendimiento fluido
  - _Requirements: 5.6, 5.7, 5.8_

- [ ]* 2.1 Write unit tests for StarAnimation component
  - Verificar que el componente se renderiza correctamente
  - Verificar que las estrellas se generan con propiedades aleatorias
  - _Requirements: 5.6, 5.7_

- [x] 3. Actualizar componente GenderSelectionScreen con figuras ilustradas
  - Actualizar `src/components/GenderSelectionScreen.jsx`
  - Reemplazar emojis con imágenes de las figuras ilustradas
  - Actualizar estructura de `genderOptions` para incluir rutas de imágenes
  - Implementar carga de imágenes con `<img>` tags
  - Ajustar estilos para mostrar figuras correctamente (tamaño, centrado)
  - _Requirements: 2.6, 2.7, 7.5_

- [ ]* 3.1 Write unit tests for image loading
  - Verificar que las imágenes se cargan correctamente
  - Verificar que las rutas de imágenes son correctas
  - _Requirements: 7.5_

- [x] 4. Implementar animaciones hover y selección para figuras
  - Agregar animación de escala en hover (`hover:scale-110`)
  - Agregar efecto de brillo en hover (`hover:brightness-110`)
  - Implementar efecto visual de selección (ring, shadow, glow)
  - Usar colores específicos por género (azul, rosa, morado)
  - Asegurar transiciones suaves
  - _Requirements: 2.2, 7.6, 7.7_

- [ ]* 4.1 Write unit tests for hover and selection animations
  - Verificar que las clases CSS se aplican correctamente
  - Verificar que la selección cambia el estilo visual
  - _Requirements: 2.2, 7.7_

- [x] 5. Integrar StarAnimation en GenderSelectionScreen
  - Importar StarAnimation en GenderSelectionScreen
  - Agregar StarAnimation como fondo detrás del modal
  - Asegurar que las estrellas no interfieren con la interacción
  - Verificar z-index correcto (estrellas detrás, modal adelante)
  - _Requirements: 5.6, 5.8_

- [ ]* 5.1 Write unit tests for StarAnimation integration
  - Verificar que StarAnimation se renderiza en GenderSelectionScreen
  - Verificar que el z-index es correcto
  - _Requirements: 5.6_

- [x] 6. Crear componente GenderSelectionScreen (ya existente)
  - Crear archivo `src/components/GenderSelectionScreen.jsx`
  - Implementar estructura base con glass-modal
  - Implementar tres opciones de género (Masculino, Femenino, Otro)
  - Implementar indicador visual para selección
  - Implementar botón de confirmación (inicialmente deshabilitado)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x]* 6.1 Write unit tests for GenderSelectionScreen rendering
  - Verificar que el componente se renderiza correctamente
  - Verificar que las tres opciones de género están presentes
  - Verificar que el botón de confirmación está deshabilitado inicialmente
  - _Requirements: 1.2, 2.4_

- [x] 7. Implementar lógica de selección de género (ya existente)
  - Implementar estado `selectedGender` en GenderSelectionScreen
  - Implementar handlers para clic en opciones de género
  - Implementar cambio de indicador visual al seleccionar
  - Implementar habilitación del botón de confirmación cuando hay selección
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 7.1 Write unit tests for gender selection logic
  - Seleccionar cada opción de género
  - Verificar que el estado interno se actualiza
  - Verificar que el indicador visual cambia
  - Verificar que el botón se habilita
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8. Implementar validación de género (ya existente)
  - Implementar validación para confirmar sin seleccionar
  - Mostrar mensaje de error si no hay selección
  - Mantener botón deshabilitado hasta que haya selección
  - Limpiar error cuando el usuario selecciona una opción
  - _Requirements: 2.4, 2.5_

- [ ]* 8.1 Write unit tests for gender validation
  - Intentar confirmar sin seleccionar género
  - Verificar que se muestra el mensaje de error
  - Verificar que el botón de confirmación permanece deshabilitado
  - _Requirements: 2.4, 2.5_

- [x] 9. Implementar persistencia en localStorage (ya existente)
  - Guardar género seleccionado en localStorage con clave 'userGender'
  - Implementar callback `onGenderSelect` que guarda en localStorage
  - Guardar timestamp de selección (opcional)
  - _Requirements: 3.1, 3.2_

- [ ]* 9.1 Write unit tests for localStorage integration
  - Confirmar un género
  - Verificar que se guarda en localStorage
  - Recargar la página y verificar que se recupera
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 10. Integrar GenderSelectionScreen en App.jsx (ya existente)
  - Importar GenderSelectionScreen en App.jsx
  - Leer `userGender` de localStorage en useEffect
  - Implementar lógica de visibilidad: mostrar GenderSelectionScreen si hay userName pero no userGender
  - Pasar callbacks a GenderSelectionScreen
  - Actualizar flujo de pantallas: WelcomeScreen → GenderSelectionScreen → LoadingScreen → MainApp
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [ ]* 10.1 Write unit tests for screen visibility logic
  - Verificar que GenderSelectionScreen aparece cuando hay userName pero no userGender
  - Verificar que desaparece cuando se confirma un género
  - Verificar que MainApp aparece después de confirmar
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 11. Implementar transición a LoadingScreen (ya existente)
  - Cuando se confirma género, mostrar LoadingScreen
  - Mantener información del usuario (nombre y género)
  - Después de LoadingScreen, mostrar MainApp
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 11.1 Write unit tests for LoadingScreen transition
  - Confirmar un género
  - Verificar que LoadingScreen aparece
  - Verificar que MainApp aparece después
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 12. Implementar lógica de skip si género ya existe (ya existente)
  - Si `userGender` existe en localStorage, saltar GenderSelectionScreen
  - Ir directamente a MainApp
  - Mantener información del usuario en estado
  - _Requirements: 3.3, 3.4_

- [ ]* 12.1 Write unit tests for skip logic
  - Guardar un género en localStorage
  - Recargar la página
  - Verificar que GenderSelectionScreen no aparece
  - Verificar que MainApp aparece directamente
  - _Requirements: 3.3, 3.4_

- [ ] 13. Checkpoint - Verificar implementación de figuras y animaciones
  - Verificar que las figuras se cargan correctamente
  - Verificar que las animaciones de estrellas funcionan
  - Verificar que las animaciones hover funcionan
  - Verificar que la selección visual es clara
  - Verificar rendimiento fluido

- [ ] 14. Implementar property tests para persistencia
  - **Property 1: Gender Selection Persistence**
  - Generar selecciones aleatorias de género
  - Guardar en localStorage
  - Recargar y verificar que se recupera correctamente
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 15. Implementar property tests para validación
  - **Property 2: Gender Selection Validation**
  - Generar intentos de confirmación sin selección
  - Verificar que siempre se muestra error
  - Verificar que el estado no cambia
  - _Requirements: 2.4_

- [ ] 16. Implementar property tests para consistencia de estado
  - **Property 3: Gender Selection State Consistency**
  - Generar secuencias de clics en opciones de género
  - Verificar que el estado interno siempre coincide con la UI
  - Verificar que solo una opción está seleccionada a la vez
  - _Requirements: 2.1, 2.2_

- [ ] 17. Implementar property tests para visibilidad de pantalla
  - **Property 4: Screen Visibility Logic**
  - Generar combinaciones de userName y userGender
  - Verificar que la pantalla correcta se muestra
  - Validar la lógica de visibilidad en todos los casos
  - _Requirements: 1.1, 4.1_

- [ ] 18. Implementar property tests para inmutabilidad
  - **Property 5: Gender Selection Immutability**
  - Guardar un género
  - Intentar cambiar sin confirmación
  - Verificar que el género guardado no cambia
  - Confirmar un nuevo género y verificar que se actualiza
  - _Requirements: 3.3, 3.4_

- [x] 19. Checkpoint - Ensure all tests pass (ya existente)
  - Ejecutar todos los tests unitarios
  - Ejecutar todos los property tests
  - Verificar que no hay errores de compilación
  - Verificar que la aplicación funciona correctamente

- [x] 20. Verificar consistencia visual (ya existente)
  - Comparar colores y estilos con WelcomeScreen
  - Verificar que las animaciones son suaves
  - Verificar que el glass-modal se ve correcto
  - Verificar que las figuras se muestran correctamente
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.8_

- [x] 21. Verificar flujo completo (ya existente)
  - Ingresar nombre en WelcomeScreen
  - Seleccionar género en GenderSelectionScreen
  - Ver LoadingScreen
  - Acceder a MainApp
  - Recargar página y verificar que salta directamente a MainApp
  - _Requirements: 1.1, 3.3, 4.1, 4.2, 4.3_

- [x] 22. Implementar saludo personalizado según género (ya existente)
  - Leer `userGender` de localStorage en App.jsx
  - Crear función `getGreeting(gender)` que retorna "Bienvenido", "Bienvenida" o "Bienvenide"
  - Actualizar el texto de bienvenida en MainApp para usar el saludo personalizado
  - Verificar que el saludo se actualiza cuando cambia el género
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x]* 22.1 Write unit tests for gender-based greeting (ya existente)
  - Verificar que "Masculino" genera "Bienvenido"
  - Verificar que "Femenino" genera "Bienvenida"
  - Verificar que "Otro" genera "Bienvenide"
  - Verificar que el saludo se muestra correctamente en la página principal
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 23. Implementar property test para saludo personalizado
  - **Property 6: Gender-Based Greeting Personalization**
  - Generar selecciones aleatorias de género
  - Guardar en localStorage
  - Verificar que el saludo correcto se muestra en la página principal
  - Validar que "Masculino" → "Bienvenido", "Femenino" → "Bienvenida", "Otro" → "Bienvenide"
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 24. Checkpoint final - Verificar implementación completa
  - Ejecutar todos los tests unitarios
  - Ejecutar todos los property tests
  - Verificar que no hay errores de compilación
  - Verificar que la aplicación funciona correctamente
  - Verificar que las figuras ilustradas se ven bien
  - Verificar que las animaciones de estrellas funcionan
  - Verificar flujo completo con saludo personalizado

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation should maintain visual consistency with WelcomeScreen
- All localStorage operations should have fallback to sessionStorage if needed
- Las figuras ilustradas deben extraerse de la imagen de referencia usando herramientas como remove.bg
- Las animaciones de estrellas deben implementarse de forma similar a SnowEffect.jsx para mantener consistencia
