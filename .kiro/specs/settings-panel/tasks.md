# Implementation Plan: Settings Panel

## Overview

Este plan describe la implementación del panel de ajustes unificado que consolida las opciones de Backup de Datos, Personalizar Colores y Modo Navideño en una vista de página completa accesible desde la barra superior.

## Tasks

- [x] 1. Crear componente SettingsPanel base
  - Crear archivo `src/components/SettingsPanel.jsx`
  - Implementar estructura básica del componente con header y grid
  - Configurar estados para modales (showBackupModal, showColorTheme)
  - Importar contextos necesarios (useTheme, useChristmasTheme, useToast)
  - Definir array de secciones con configuración (id, title, description, icon, color, action)
  - _Requirements: 2.1, 2.4, 3.1, 3.2, 3.3_

- [x] 2. Implementar SettingsHeader subcomponente
  - Crear componente SettingsHeader dentro de SettingsPanel.jsx
  - Agregar título "Ajustes" con gradiente y emoji
  - Agregar descripción "Personaliza tu experiencia en El Santuario Potaxie"
  - Implementar animación de entrada con Framer Motion (opacity, y)
  - Aplicar estilos responsive para diferentes tamaños de pantalla
  - _Requirements: 2.4, 8.1_

- [x] 3. Implementar SettingsGrid y SettingsCard subcomponentes
  - Crear componente SettingsGrid que recibe array de secciones
  - Implementar grid responsive (1 col mobile, 2 col tablet, 3 col desktop)
  - Crear componente SettingsCard para cada sección
  - Implementar animaciones de entrada escalonadas (delay: index * 0.1)
  - Agregar efectos hover (scale, y, shadow)
  - Agregar gradiente de fondo en hover
  - Agregar indicador de flecha (ChevronRight) en hover
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 8.3_

- [x] 4. Integrar modales existentes en SettingsPanel
  - Importar BackupModal y ColorThemeModal
  - Renderizar modales con estados showBackupModal y showColorTheme
  - Configurar handlers para abrir/cerrar modales
  - Implementar acción de toggle para Christmas mode con toast
  - Verificar que cerrar modales mantiene la vista en settings
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Modificar Navbar para agregar botón de Settings
  - Importar icono Settings de lucide-react
  - Agregar botón de Settings en la sección de controles
  - Configurar onClick para navegar a página 'settings'
  - Aplicar estilos consistentes con otros botones de navbar
  - Agregar title/tooltip "Ajustes"
  - Agregar aria-label para accesibilidad
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1_

- [x] 6. Eliminar botones individuales de Navbar
  - Remover botón de Backup (Database icon)
  - Remover botón de Personalizar Colores (Palette icon)
  - Remover botón de Modo Navideño (snowflake/tree emoji)
  - Remover estados de modales individuales (showColorTheme, showBackupModal)
  - Remover renderizado de modales en Navbar
  - Verificar que otros botones se mantienen (Search, Library, Oracle, Theme, Incognito)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Integrar SettingsPanel en App.jsx
  - Importar componente SettingsPanel
  - Actualizar PAGES_ORDER para incluir 'settings'
  - Agregar caso en el switch de páginas para renderizar SettingsPanel
  - Verificar que navegación con swipe funciona correctamente
  - Verificar que animaciones de transición funcionan
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 8. Implementar integración con sistema de temas
  - Verificar que SettingsPanel usa clases dark: para modo oscuro
  - Verificar que SettingsPanel respeta tema claro
  - Verificar que SettingsPanel incorpora elementos navideños cuando Christmas mode está activo
  - Verificar que SettingsPanel usa custom color theme si está configurado
  - Implementar actualización reactiva cuando cambia el tema
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Implementar accesibilidad completa
  - Agregar aria-labels a todos los botones
  - Verificar navegación con teclado (Tab, Enter)
  - Implementar gestión de foco al abrir/cerrar panel
  - Agregar aria-labels descriptivos a secciones
  - Verificar jerarquía de headings (h1, h2, h3)
  - Verificar contraste de colores (WCAG AA)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Optimizar animaciones y performance
  - Configurar animaciones de Framer Motion con duración 300ms
  - Implementar lazy loading de modales (solo renderizar cuando están abiertos)
  - Agregar React.memo a SettingsCard si es necesario
  - Usar CSS transforms en lugar de position para animaciones
  - Verificar que no hay re-renders innecesarios
  - _Requirements: 8.5_

- [x] 11. Checkpoint - Verificar funcionalidad básica
  - Verificar que botón de Settings aparece en navbar
  - Verificar que clicking en Settings navega a la página correcta
  - Verificar que las tres secciones se muestran correctamente
  - Verificar que cada sección abre su modal/acción correspondiente
  - Verificar que modales se cierran correctamente
  - Verificar que botones individuales fueron eliminados de navbar
  - Preguntar al usuario si hay problemas o ajustes necesarios

- [ ]* 12. Escribir unit tests para SettingsPanel
  - Test: Settings panel renders with correct title
  - Test: All three settings cards are displayed
  - Test: Each card has correct icon, title, and description
  - Test: Backup card opens BackupModal
  - Test: Colors card opens ColorThemeModal
  - Test: Christmas card toggles christmas mode
  - Test: Toast appears after christmas toggle
  - Test: Modals close when close button is clicked
  - Test: Settings panel remains visible after modal closes
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 13. Escribir unit tests para Navbar modifications
  - Test: Settings button in navbar navigates to settings page
  - Test: Page state updates to 'settings' on navigation
  - Test: Individual backup button does not exist
  - Test: Individual colors button does not exist
  - Test: Individual christmas button does not exist
  - Test: Other buttons remain (Search, Library, Oracle, Theme, Incognito)
  - _Requirements: 1.2, 5.1, 5.2, 5.3, 5.4_

- [ ]* 14. Escribir unit tests para responsive behavior
  - Test: Grid displays 1 column on mobile (< 768px)
  - Test: Grid displays 2 columns on tablet (768px - 1024px)
  - Test: Grid displays 3 columns on desktop (> 1024px)
  - Test: Touch-friendly button sizes on mobile
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 15. Escribir unit tests para theme integration
  - Test: Settings panel uses light theme colors in light mode
  - Test: Settings panel uses dark theme colors in dark mode
  - Test: Settings panel incorporates christmas theme when active
  - Test: Settings panel uses custom color theme if configured
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 16. Escribir unit tests para accessibility
  - Test: Settings button has aria-label
  - Test: Settings cards are keyboard navigable
  - Test: Focus management works correctly
  - Test: Proper heading hierarchy (h1, h2, h3)
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ]* 17. Escribir property test para Settings Button Navigation
  - **Property 1: Settings Button Navigation**
  - **Validates: Requirements 1.2, 2.1**
  - Generar estados de página inicial aleatorios
  - Simular click en botón de settings
  - Verificar que página cambia a 'settings'
  - Configurar 100 iteraciones mínimo

- [ ]* 18. Escribir property test para Settings Card Actions
  - **Property 2: Settings Card Actions**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - Generar IDs de secciones aleatorios (backup, colors, christmas)
  - Simular click en cada sección
  - Verificar que acción apropiada se ejecuta sin cambiar página
  - Configurar 100 iteraciones mínimo

- [ ]* 19. Escribir property test para Modal Return Behavior
  - **Property 3: Modal Return Behavior**
  - **Validates: Requirements 4.5**
  - Generar tipos de modal aleatorios (backup, colors)
  - Abrir modal desde settings
  - Cerrar modal
  - Verificar que usuario permanece en settings
  - Configurar 100 iteraciones mínimo

- [ ]* 20. Escribir property test para Navbar Button Removal
  - **Property 4: Navbar Button Removal**
  - **Validates: Requirements 5.1, 5.2, 5.3**
  - Generar páginas aleatorias (home, library, oracle, settings)
  - Renderizar navbar
  - Verificar que botones individuales no existen
  - Configurar 100 iteraciones mínimo

- [ ]* 21. Escribir property test para Responsive Layout Adaptation
  - **Property 5: Responsive Layout Adaptation**
  - **Validates: Requirements 6.1, 6.2, 6.3**
  - Generar anchos de viewport aleatorios (320-2560px)
  - Renderizar settings panel
  - Verificar número correcto de columnas según breakpoint
  - Configurar 100 iteraciones mínimo

- [ ]* 22. Escribir property test para Theme Integration
  - **Property 6: Theme Integration**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  - Generar combinaciones aleatorias de tema (light/dark) y christmas mode (true/false)
  - Renderizar settings panel
  - Verificar que usa clases de tema apropiadas
  - Configurar 100 iteraciones mínimo

- [ ]* 23. Escribir property test para Keyboard Navigation
  - **Property 7: Keyboard Navigation**
  - **Validates: Requirements 7.2**
  - Generar secuencias aleatorias de navegación con teclado
  - Simular Tab y Enter
  - Verificar que foco se mueve correctamente y acciones se ejecutan
  - Configurar 100 iteraciones mínimo

- [ ]* 24. Escribir property test para Animation Completion
  - **Property 8: Animation Completion**
  - **Validates: Requirements 8.5**
  - Generar tipos de animación aleatorios (enter, exit, hover)
  - Ejecutar animación
  - Medir duración
  - Verificar que completa en <= 300ms
  - Configurar 100 iteraciones mínimo

- [ ] 25. Checkpoint final - Testing y validación
  - Ejecutar todos los unit tests
  - Ejecutar todos los property tests
  - Verificar que no hay errores en consola
  - Verificar que todas las animaciones son suaves
  - Verificar responsive en diferentes dispositivos
  - Verificar accesibilidad con lector de pantalla
  - Preguntar al usuario si todo funciona correctamente

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades de correctness universales
- Los unit tests validan ejemplos específicos y casos edge
- La implementación sigue los patrones existentes de Oracle y Library para consistencia
- Se debe mantener la estética y UX del resto de la aplicación
