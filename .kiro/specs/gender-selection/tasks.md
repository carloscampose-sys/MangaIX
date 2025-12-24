# Implementation Plan: Gender Selection Flow

## Overview

Este plan implementa la funcionalidad de selección de género que aparece después de la pantalla de bienvenida. El flujo integra un nuevo componente `GenderSelectionScreen` en el flujo de inicialización de la aplicación, mantiene la consistencia visual con la pantalla de bienvenida, y persiste la selección en localStorage.

## Tasks

- [x] 1. Crear componente GenderSelectionScreen
  - Crear archivo `src/components/GenderSelectionScreen.jsx`
  - Implementar estructura base con glass-modal
  - Implementar tres opciones de género (Masculino, Femenino, Otro)
  - Implementar indicador visual para selección
  - Implementar botón de confirmación (inicialmente deshabilitado)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x]* 1.1 Write unit tests for GenderSelectionScreen rendering
  - Verificar que el componente se renderiza correctamente
  - Verificar que las tres opciones de género están presentes
  - Verificar que el botón de confirmación está deshabilitado inicialmente
  - _Requirements: 1.2, 2.4_

- [x] 2. Implementar lógica de selección de género
  - Implementar estado `selectedGender` en GenderSelectionScreen
  - Implementar handlers para clic en opciones de género
  - Implementar cambio de indicador visual al seleccionar
  - Implementar habilitación del botón de confirmación cuando hay selección
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 2.1 Write unit tests for gender selection logic
  - Seleccionar cada opción de género
  - Verificar que el estado interno se actualiza
  - Verificar que el indicador visual cambia
  - Verificar que el botón se habilita
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Implementar validación de género
  - Implementar validación para confirmar sin seleccionar
  - Mostrar mensaje de error si no hay selección
  - Mantener botón deshabilitado hasta que haya selección
  - Limpiar error cuando el usuario selecciona una opción
  - _Requirements: 2.4, 2.5_

- [ ]* 3.1 Write unit tests for gender validation
  - Intentar confirmar sin seleccionar género
  - Verificar que se muestra el mensaje de error
  - Verificar que el botón de confirmación permanece deshabilitado
  - _Requirements: 2.4, 2.5_

- [x] 4. Implementar persistencia en localStorage
  - Guardar género seleccionado en localStorage con clave 'userGender'
  - Implementar callback `onGenderSelect` que guarda en localStorage
  - Guardar timestamp de selección (opcional)
  - _Requirements: 3.1, 3.2_

- [ ]* 4.1 Write unit tests for localStorage integration
  - Confirmar un género
  - Verificar que se guarda en localStorage
  - Recargar la página y verificar que se recupera
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Integrar GenderSelectionScreen en App.jsx
  - Importar GenderSelectionScreen en App.jsx
  - Leer `userGender` de localStorage en useEffect
  - Implementar lógica de visibilidad: mostrar GenderSelectionScreen si hay userName pero no userGender
  - Pasar callbacks a GenderSelectionScreen
  - Actualizar flujo de pantallas: WelcomeScreen → GenderSelectionScreen → LoadingScreen → MainApp
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [ ]* 5.1 Write unit tests for screen visibility logic
  - Verificar que GenderSelectionScreen aparece cuando hay userName pero no userGender
  - Verificar que desaparece cuando se confirma un género
  - Verificar que MainApp aparece después de confirmar
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 6. Implementar transición a LoadingScreen
  - Cuando se confirma género, mostrar LoadingScreen
  - Mantener información del usuario (nombre y género)
  - Después de LoadingScreen, mostrar MainApp
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 6.1 Write unit tests for LoadingScreen transition
  - Confirmar un género
  - Verificar que LoadingScreen aparece
  - Verificar que MainApp aparece después
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Implementar lógica de skip si género ya existe
  - Si `userGender` existe en localStorage, saltar GenderSelectionScreen
  - Ir directamente a MainApp
  - Mantener información del usuario en estado
  - _Requirements: 3.3, 3.4_

- [ ]* 7.1 Write unit tests for skip logic
  - Guardar un género en localStorage
  - Recargar la página
  - Verificar que GenderSelectionScreen no aparece
  - Verificar que MainApp aparece directamente
  - _Requirements: 3.3, 3.4_

- [ ] 8. Implementar property tests para persistencia
  - **Property 1: Gender Selection Persistence**
  - Generar selecciones aleatorias de género
  - Guardar en localStorage
  - Recargar y verificar que se recupera correctamente
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 9. Implementar property tests para validación
  - **Property 2: Gender Selection Validation**
  - Generar intentos de confirmación sin selección
  - Verificar que siempre se muestra error
  - Verificar que el estado no cambia
  - _Requirements: 2.4_

- [ ] 10. Implementar property tests para consistencia de estado
  - **Property 3: Gender Selection State Consistency**
  - Generar secuencias de clics en opciones de género
  - Verificar que el estado interno siempre coincide con la UI
  - Verificar que solo una opción está seleccionada a la vez
  - _Requirements: 2.1, 2.2_

- [ ] 11. Implementar property tests para visibilidad de pantalla
  - **Property 4: Screen Visibility Logic**
  - Generar combinaciones de userName y userGender
  - Verificar que la pantalla correcta se muestra
  - Validar la lógica de visibilidad en todos los casos
  - _Requirements: 1.1, 4.1_

- [ ] 12. Implementar property tests para inmutabilidad
  - **Property 5: Gender Selection Immutability**
  - Guardar un género
  - Intentar cambiar sin confirmación
  - Verificar que el género guardado no cambia
  - Confirmar un nuevo género y verificar que se actualiza
  - _Requirements: 3.3, 3.4_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ejecutar todos los tests unitarios
  - Ejecutar todos los property tests
  - Verificar que no hay errores de compilación
  - Verificar que la aplicación funciona correctamente

- [x] 14. Verificar consistencia visual
  - Comparar colores y estilos con WelcomeScreen
  - Verificar que las animaciones son suaves
  - Verificar que el glass-modal se ve correcto
  - Verificar que los emojis se muestran correctamente
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 15. Verificar flujo completo
  - Ingresar nombre en WelcomeScreen
  - Seleccionar género en GenderSelectionScreen
  - Ver LoadingScreen
  - Acceder a MainApp
  - Recargar página y verificar que salta directamente a MainApp
  - _Requirements: 1.1, 3.3, 4.1, 4.2, 4.3_

- [x] 16. Implementar saludo personalizado según género
  - Leer `userGender` de localStorage en App.jsx
  - Crear función `getGreeting(gender)` que retorna "Bienvenido", "Bienvenida" o "Bienvenide"
  - Actualizar el texto de bienvenida en MainApp para usar el saludo personalizado
  - Verificar que el saludo se actualiza cuando cambia el género
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x]* 16.1 Write unit tests for gender-based greeting
  - Verificar que "Masculino" genera "Bienvenido"
  - Verificar que "Femenino" genera "Bienvenida"
  - Verificar que "Otro" genera "Bienvenide"
  - Verificar que el saludo se muestra correctamente en la página principal
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 17. Implementar property test para saludo personalizado
  - **Property 6: Gender-Based Greeting Personalization**
  - Generar selecciones aleatorias de género
  - Guardar en localStorage
  - Verificar que el saludo correcto se muestra en la página principal
  - Validar que "Masculino" → "Bienvenido", "Femenino" → "Bienvenida", "Otro" → "Bienvenide"
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 18. Checkpoint - Ensure all tests pass
  - Ejecutar todos los tests unitarios
  - Ejecutar todos los property tests
  - Verificar que no hay errores de compilación
  - Verificar que la aplicación funciona correctamente

- [x] 19. Verificar flujo completo con saludo personalizado
  - Ingresar nombre en WelcomeScreen
  - Seleccionar "Masculino" en GenderSelectionScreen
  - Verificar que el saludo es "Bienvenido"
  - Recargar página y verificar que el saludo se mantiene
  - Repetir con "Femenino" (Bienvenida) y "Otro" (Bienvenide)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation should maintain visual consistency with WelcomeScreen
- All localStorage operations should have fallback to sessionStorage if needed
