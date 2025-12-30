# Implementation Plan: Reading Progress Persistence

## Overview

Este plan implementa un sistema de guardado automático del progreso de lectura que permite a los usuarios continuar desde la última página visualizada. La implementación se divide en tres partes principales: el servicio de persistencia, la integración con el Reader, y las pruebas.

## Tasks

- [x] 1. Crear el servicio ReadingProgressService
  - Crear archivo `src/services/readingProgressService.js`
  - Implementar constructor con constantes (STORAGE_KEY, MAX_ENTRIES, EXPIRY_DAYS)
  - Implementar método `saveProgress(mangaId, chapterId, currentPage, totalPages)`
  - Implementar método `getProgress(mangaId, chapterId)`
  - Implementar método `clearProgress(mangaId, chapterId)`
  - Implementar método `cleanExpiredProgress()`
  - Implementar método `enforceStorageLimit()`
  - Implementar manejo de errores para localStorage (quota exceeded, parse errors, access denied)
  - Exportar instancia singleton del servicio
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4_

- [ ]* 1.1 Escribir unit tests para ReadingProgressService
  - Test saveProgress guarda datos correctamente
  - Test getProgress retorna datos correctos
  - Test clearProgress elimina datos
  - Test cleanExpiredProgress elimina solo progresos antiguos
  - Test enforceStorageLimit mantiene máximo 50 entradas
  - Test manejo de localStorage corrupto
  - Test manejo de localStorage no disponible
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4_

- [ ]* 1.2 Escribir property test para guardado idempotente
  - **Property 1: Guardado Idempotente**
  - **Validates: Requirements 1.1**

- [ ]* 1.3 Escribir property test para restauración consistente
  - **Property 2: Restauración Consistente**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 1.4 Escribir property test para límite de almacenamiento
  - **Property 3: Límite de Almacenamiento**
  - **Validates: Requirements 5.1, 5.2**

- [ ]* 1.5 Escribir property test para expiración de progreso
  - **Property 4: Expiración de Progreso**
  - **Validates: Requirements 2.3**

- [ ]* 1.6 Escribir property test para limpieza de progreso
  - **Property 5: Limpieza de Progreso**
  - **Validates: Requirements 3.2**

- [ ]* 1.7 Escribir property test para validación de datos
  - **Property 6: Validación de Datos**
  - **Validates: Requirements 5.4**

- [ ] 2. Checkpoint - Verificar que el servicio funciona correctamente
  - Asegurar que todos los tests pasen
  - Preguntar al usuario si hay dudas

- [ ] 3. Integrar ReadingProgressService con el componente Reader
  - Importar `readingProgressService` en `src/components/Reader.jsx`
  - Agregar props `mangaId` y `chapterId` al componente Reader
  - Agregar estado `hasRestoredProgress` para controlar la restauración inicial
  - Implementar useEffect para restaurar progreso al montar el componente
  - Implementar scroll automático a la página restaurada
  - Implementar useEffect para guardar progreso cuando cambia currentPage (con debounce de 500ms)
  - Modificar `handleNextChapter` para limpiar progreso antes de cambiar
  - Modificar `handlePreviousChapter` para limpiar progreso antes de cambiar
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2, 3.3_

- [ ] 4. Implementar notificación visual de restauración
  - Importar `useToast` en el componente Reader
  - Mostrar notificación cuando se restaura progreso: "Continuando desde página X"
  - Configurar notificación para desaparecer después de 3 segundos
  - Asegurar que la notificación solo se muestre cuando hay progreso restaurado
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 4.1 Escribir tests de integración para Reader
  - Test restauración de progreso al montar
  - Test guardado de progreso al cambiar página
  - Test limpieza de progreso al cambiar capítulo
  - Test notificación se muestra al restaurar progreso
  - Test scroll automático a página restaurada
  - _Requirements: 2.1, 2.2, 2.4, 3.2, 4.1_

- [ ] 5. Actualizar componentes que usan Reader para pasar mangaId y chapterId
  - Identificar todos los lugares donde se usa el componente Reader
  - Agregar props `mangaId` y `chapterId` en cada uso
  - Verificar que los IDs se pasen correctamente desde el contexto/estado
  - _Requirements: 1.3, 1.4_

- [ ] 6. Checkpoint final - Verificar funcionalidad completa
  - Asegurar que todos los tests pasen
  - Verificar manualmente que el progreso se guarda y restaura correctamente
  - Verificar que la notificación se muestra correctamente
  - Verificar que el scroll automático funciona
  - Preguntar al usuario si todo funciona como esperado

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- El servicio ReadingProgressService es independiente y puede probarse por separado
- La integración con Reader requiere que los componentes padres pasen mangaId y chapterId
- El sistema usa debounce de 500ms para evitar guardar en cada scroll
- El límite de 50 entradas previene problemas de quota en localStorage
- Los progresos expiran después de 30 días para mantener el almacenamiento limpio
