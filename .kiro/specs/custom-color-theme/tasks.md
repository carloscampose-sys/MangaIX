# Implementation Plan: Custom Color Theme System

## Overview

Este plan implementa un sistema completo de temas de color personalizables que permite a los usuarios seleccionar un color base y aplicar automáticamente una paleta coherente y accesible a toda la interfaz. La implementación se divide en fases incrementales, comenzando con la infraestructura base y terminando con la integración completa en la UI.

## Tasks

- [x] 1. Instalar dependencias y configurar estructura base
  - Instalar react-colorful (^5.6.1) y chroma-js (^2.4.2)
  - Instalar fast-check (^3.15.0) para property-based testing
  - Crear estructura de carpetas: src/context/, src/utils/, src/components/
  - _Requirements: 1.1, 2.1, 6.1_

- [ ] 2. Implementar utilidades de generación de paletas
  - [x] 2.1 Crear ColorPaletteGenerator
    - Implementar método generatePalette() que acepta color base
    - Implementar getComplementary() para colores complementarios
    - Implementar getTriadic() para colores triádicos
    - Implementar generateShades() y generateTints() para variaciones
    - Detectar automáticamente si el color base es oscuro o claro
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 2.2 Escribir property test para generación de paleta
    - **Property 2: Palette generation completeness**
    - **Validates: Requirements 2.5**
    - Verificar que todas las propiedades requeridas estén presentes
    - Usar generador de colores hexadecimales aleatorios

  - [ ]* 2.3 Escribir property test para colores complementarios
    - **Property 3: Complementary color correctness**
    - **Validates: Requirements 2.2**
    - Verificar que el hue del complementario sea (H + 180) % 360

  - [ ]* 2.4 Escribir property test para variaciones de luminancia
    - **Property 4: Luminance variation in shades**
    - **Validates: Requirements 2.1**
    - Verificar que primaryLight > base > primaryDark en luminancia

- [ ] 3. Implementar validador de accesibilidad
  - [x] 3.1 Crear AccessibilityValidator
    - Implementar getContrastRatio() usando chroma.js
    - Implementar meetsWCAG_AA() y meetsWCAG_AAA()
    - Implementar adjustTextColorForContrast() con iteraciones
    - Implementar validatePalette() que retorna issues
    - _Requirements: 2.4, 2.6, 7.4_

  - [ ]* 3.2 Escribir property test para contraste WCAG
    - **Property 5: WCAG AA contrast compliance**
    - **Validates: Requirements 2.4, 2.6**
    - Verificar que textPrimary y textSecondary cumplan 4.5:1 sobre background

  - [ ]* 3.3 Escribir property test para validez de valores RGB
    - **Property 6: RGB value validity**
    - **Validates: Requirements 7.4**
    - Verificar que todos los componentes RGB estén en [0, 255]

- [ ] 4. Implementar aplicador de temas
  - [x] 4.1 Crear ThemeApplier
    - Implementar applyTheme() que actualiza CSS variables en document.documentElement
    - Implementar getCurrentTheme() que lee CSS variables actuales
    - Agregar clase 'theme-transitioning' para animaciones suaves
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ]* 4.2 Escribir property test para propagación de CSS variables
    - **Property 7: CSS variables update propagation**
    - **Validates: Requirements 3.2**
    - Verificar que todas las variables CSS se actualicen correctamente

  - [ ]* 4.3 Escribir unit test para transiciones suaves
    - Verificar que la clase 'theme-transitioning' se agregue y remueva
    - Verificar duración de 300ms
    - _Requirements: 3.4_

- [ ] 5. Checkpoint - Verificar utilidades base
  - Asegurar que todos los tests pasen
  - Verificar que las utilidades funcionen independientemente
  - Preguntar al usuario si hay dudas

- [ ] 6. Implementar ColorThemeContext
  - [x] 6.1 Crear ColorThemeContext y Provider
    - Definir interface ColorTheme con baseColor y palette
    - Implementar estado con useState para theme actual
    - Implementar setBaseColor() que genera paleta y aplica tema
    - Implementar resetTheme() que restaura tema por defecto
    - Implementar loadThemeFromStorage() para cargar al iniciar
    - Implementar saveThemeToStorage() para persistir cambios
    - _Requirements: 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Escribir property test para sincronización de contexto
    - **Property 8: Theme context synchronization**
    - **Validates: Requirements 3.5**
    - Verificar que el contexto se actualice antes del re-render

  - [ ]* 6.3 Escribir property test para persistencia round-trip
    - **Property 9: Theme persistence round-trip**
    - **Validates: Requirements 4.1, 4.2**
    - Verificar que guardar y cargar preserve el tema

  - [ ]* 6.4 Escribir property test para estructura de almacenamiento
    - **Property 10: Storage data structure validation**
    - **Validates: Requirements 4.5**
    - Verificar que los datos guardados tengan baseColor y palette

- [ ] 7. Implementar manejo de errores en contexto
  - [ ] 7.1 Agregar validación de colores inválidos
    - Implementar try-catch en setBaseColor()
    - Mostrar mensaje de error descriptivo
    - Mantener tema anterior si hay error
    - _Requirements: 7.1, 7.2_

  - [ ] 7.2 Agregar manejo de localStorage corrupto
    - Implementar try-catch en loadThemeFromStorage()
    - Limpiar localStorage si hay datos corruptos
    - Aplicar tema por defecto como fallback
    - _Requirements: 7.3, 7.5_

  - [ ]* 7.3 Escribir property test para rechazo de colores inválidos
    - **Property 11: Invalid color rejection**
    - **Validates: Requirements 7.2, 7.3**
    - Usar generador de colores inválidos

  - [ ]* 7.4 Escribir property test para validación de entrada
    - **Property 12: Error input validation**
    - **Validates: Requirements 7.1**
    - Verificar que se muestre mensaje de error

  - [ ]* 7.5 Escribir property test para recuperación de storage corrupto
    - **Property 13: Corrupted storage recovery**
    - **Validates: Requirements 7.3, 7.5**
    - Usar generador de datos corruptos

- [ ] 8. Checkpoint - Verificar contexto y persistencia
  - Asegurar que todos los tests pasen
  - Verificar que el contexto funcione correctamente
  - Verificar que la persistencia funcione
  - Preguntar al usuario si hay dudas

- [ ] 9. Implementar ColorThemeModal
  - [ ] 9.1 Crear componente ColorThemeModal
    - Importar HexColorPicker de react-colorful
    - Implementar estado local para selectedColor
    - Implementar vista previa de paleta con useEffect
    - Agregar input manual para código hexadecimal
    - Agregar grid de 8 colores predefinidos
    - Implementar botones: Aplicar, Cancelar, Restablecer
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.2 Escribir property test para actualización de vista previa
    - **Property 15: Real-time preview update**
    - **Validates: Requirements 1.4**
    - Verificar que la vista previa se actualice en el mismo ciclo

  - [ ]* 9.3 Escribir property test para display de color actual
    - **Property 16: Current color display**
    - **Validates: Requirements 6.3**
    - Verificar que el picker muestre el baseColor actual al abrir

  - [ ]* 9.4 Escribir property test para persistencia al cerrar modal
    - **Property 17: Theme persistence after modal close**
    - **Validates: Requirements 6.5**
    - Verificar que cerrar el modal no revierta cambios

  - [ ]* 9.5 Escribir unit tests para ColorThemeModal
    - Test: Modal se renderiza correctamente
    - Test: Colores predefinidos se muestran (8 botones)
    - Test: Click en "Aplicar" cierra modal y aplica tema
    - Test: Click en "Cancelar" cierra modal sin aplicar
    - Test: Click en "Restablecer" vuelve al tema por defecto
    - Test: Input manual actualiza el picker
    - _Requirements: 1.1, 1.5, 6.2, 6.4_

- [ ] 10. Agregar botón de acceso en Navbar
  - [x] 10.1 Modificar Navbar para incluir botón de temas
    - Importar ColorThemeModal
    - Agregar estado showColorTheme
    - Agregar botón con icono de paleta (Palette de lucide-react)
    - Renderizar ColorThemeModal condicionalmente
    - _Requirements: 6.1, 6.2_

  - [ ]* 10.2 Escribir unit test para botón en Navbar
    - Test: Botón de temas aparece en Navbar
    - Test: Click en botón abre modal
    - Test: Modal se cierra correctamente
    - _Requirements: 6.1, 6.2_

- [ ] 11. Agregar CSS Variables al sistema
  - [x] 11.1 Actualizar src/index.css con variables
    - Definir todas las variables CSS en :root
    - Agregar clase .theme-transitioning con transiciones
    - Definir --theme-transition: all 0.3s ease
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 11.2 Actualizar componentes existentes para usar variables
    - Navbar: usar var(--color-surface) y var(--color-border)
    - Botones: usar var(--color-primary) y var(--color-hover)
    - Cards: usar var(--color-surface), var(--color-border), var(--color-text-primary)
    - Modales: usar var(--color-surface) y var(--color-text-primary)
    - _Requirements: 3.3_

- [ ] 12. Implementar integración con temas existentes
  - [ ] 12.1 Agregar adaptación para modo oscuro/claro
    - Modificar generatePalette() para ajustar según isDark
    - Usar luminancia < 0.3 para fondos oscuros
    - Usar luminancia > 0.7 para fondos claros
    - _Requirements: 5.1, 5.2_

  - [ ]* 12.2 Escribir property test para adaptación de modo
    - **Property 14: Theme mode adaptation**
    - **Validates: Requirements 5.1, 5.2**
    - Verificar luminancia de backgrounds según modo

  - [ ] 12.3 Verificar compatibilidad con ChristmasThemeContext
    - Probar que colores personalizados se apliquen sobre tema navideño
    - Asegurar que no haya conflictos de CSS
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 12.4 Escribir unit tests de integración
    - Test: Tema personalizado funciona con modo oscuro
    - Test: Tema personalizado funciona con modo claro
    - Test: Tema personalizado funciona con tema navideño
    - Test: Cambiar entre modos no rompe tema personalizado
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 13. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasen (unit y property)
  - Verificar que el tema se aplique a todos los componentes
  - Verificar que la persistencia funcione correctamente
  - Verificar que la accesibilidad se mantenga (contraste WCAG AA)
  - Probar en diferentes navegadores
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [ ] 14. Optimizaciones y pulido final
  - [ ] 14.1 Agregar debouncing a actualizaciones de color
    - Implementar debounce de 300ms en onChange del picker
    - Evitar re-renders excesivos durante selección
    - _Requirements: 3.1_

  - [ ] 14.2 Agregar memoización de paletas
    - Usar useMemo para cachear paletas generadas
    - Evitar recalcular si el baseColor no cambió
    - _Requirements: 3.1_

  - [ ] 14.3 Agregar lazy loading del modal
    - Usar React.lazy() para ColorThemeModal
    - Reducir bundle size inicial
    - _Requirements: 6.2_

  - [ ]* 14.4 Escribir unit tests de performance
    - Test: Actualización de tema toma menos de 100ms
    - Test: Debouncing funciona correctamente
    - Test: Memoización evita recalculos innecesarios
    - _Requirements: 3.1_

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades de corrección universales
- Los unit tests validan ejemplos específicos y casos de borde
- La implementación es incremental: utilidades → contexto → UI → integración
