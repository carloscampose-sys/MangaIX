# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar la persistencia del progreso de lectura en tiempo real. Actualmente, cuando un usuario cierra la página mientras lee un capítulo, pierde su progreso y debe volver a abrir el capítulo desde el inicio. Esta funcionalidad guardará automáticamente la página actual en localStorage para que el usuario pueda continuar desde donde lo dejó.

## Glossary

- **Reader**: El componente que muestra las páginas del capítulo al usuario
- **Reading_Progress**: Objeto que contiene información sobre el progreso de lectura (mangaId, chapterId, currentPage, timestamp)
- **LocalStorage**: Almacenamiento persistente del navegador
- **Library_Context**: Contexto de React que maneja el estado de la biblioteca del usuario
- **Auto_Save**: Guardado automático del progreso sin intervención del usuario

## Requirements

### Requirement 1: Guardar Progreso de Lectura Automáticamente

**User Story:** Como usuario, quiero que mi progreso de lectura se guarde automáticamente mientras leo, para que pueda continuar desde donde lo dejé si cierro la página accidentalmente.

#### Acceptance Criteria

1. WHEN un usuario cambia de página en el Reader, THE System SHALL guardar el progreso actual en localStorage dentro de 500ms
2. WHEN un usuario cierra la página mientras lee, THE System SHALL persistir la última página visualizada en localStorage
3. THE Reading_Progress SHALL incluir mangaId, chapterId, currentPage, y timestamp
4. WHEN múltiples mangas están siendo leídos, THE System SHALL mantener el progreso de cada uno por separado

### Requirement 2: Restaurar Progreso de Lectura

**User Story:** Como usuario, quiero que al abrir un capítulo que estaba leyendo, se me lleve automáticamente a la última página que vi, para no tener que buscar dónde me quedé.

#### Acceptance Criteria

1. WHEN un usuario abre un capítulo que tiene progreso guardado, THE Reader SHALL cargar y mostrar la última página visualizada
2. WHEN un usuario abre un capítulo sin progreso guardado, THE Reader SHALL comenzar desde la página 1
3. WHEN el progreso guardado es de hace más de 30 días, THE System SHALL ignorarlo y comenzar desde la página 1
4. WHEN el Reader restaura el progreso, THE System SHALL hacer scroll automático a la página correcta

### Requirement 3: Limpiar Progreso Completado

**User Story:** Como usuario, quiero que el progreso guardado se limpie automáticamente cuando termino un capítulo, para mantener el almacenamiento organizado.

#### Acceptance Criteria

1. WHEN un usuario llega a la última página de un capítulo, THE System SHALL mantener el progreso guardado
2. WHEN un usuario navega al siguiente capítulo, THE System SHALL eliminar el progreso del capítulo anterior
3. WHEN un usuario cierra el Reader después de ver la última página, THE System SHALL mantener el progreso guardado
4. WHEN un usuario vuelve a abrir un capítulo completado, THE System SHALL comenzar desde la página 1

### Requirement 4: Indicador Visual de Progreso

**User Story:** Como usuario, quiero ver un indicador visual cuando se abre un capítulo con progreso guardado, para saber que estoy continuando mi lectura.

#### Acceptance Criteria

1. WHEN el Reader restaura progreso guardado, THE System SHALL mostrar una notificación temporal indicando "Continuando desde página X"
2. THE notificación SHALL desaparecer automáticamente después de 3 segundos
3. WHEN no hay progreso guardado, THE System SHALL NOT mostrar ninguna notificación
4. THE notificación SHALL ser visible pero no intrusiva en la experiencia de lectura

### Requirement 5: Gestión de Almacenamiento

**User Story:** Como desarrollador, quiero que el sistema gestione eficientemente el almacenamiento de progreso, para evitar problemas de límites de localStorage.

#### Acceptance Criteria

1. THE System SHALL almacenar un máximo de 50 progresos de lectura simultáneamente
2. WHEN se alcanza el límite de 50 progresos, THE System SHALL eliminar el progreso más antiguo (por timestamp)
3. THE System SHALL validar que el progreso guardado sea válido antes de restaurarlo
4. IF el progreso guardado está corrupto, THEN THE System SHALL ignorarlo y comenzar desde la página 1
