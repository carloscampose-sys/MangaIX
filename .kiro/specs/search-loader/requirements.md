# Requirements Document

## Introduction

Este documento define los requisitos para implementar una animación de carga específica para búsquedas en la aplicación El Santuario Potaxie. La funcionalidad debe ser similar a la animación de carga existente para paginación (PageLoader), pero utilizando una imagen diferente y manteniendo la posición de scroll en la sección de resultados.

## Glossary

- **SearchLoader**: Componente de React que muestra una animación de carga durante las búsquedas
- **PageLoader**: Componente existente que muestra una animación de carga durante la paginación
- **Results_Section**: Área de la interfaz donde se muestran los resultados de búsqueda (referenciada por `resultsRef`)
- **Loading_State**: Estado booleano que indica si una búsqueda está en progreso
- **Scroll_Position**: Posición vertical actual del viewport en la página

## Requirements

### Requirement 1: Crear componente SearchLoader

**User Story:** Como usuario, quiero ver una animación de carga cuando realizo una búsqueda, para saber que el sistema está procesando mi solicitud.

#### Acceptance Criteria

1. WHEN se crea el componente SearchLoader, THE System SHALL usar la misma estructura y animaciones que PageLoader
2. WHEN se renderiza SearchLoader, THE System SHALL mostrar la imagen "search loading.png" en lugar de "otter.png"
3. WHEN se renderiza SearchLoader, THE System SHALL mostrar el texto "Searching..." en lugar de "Loading Page..."
4. THE SearchLoader SHALL incluir una barra de progreso animada idéntica a PageLoader
5. THE SearchLoader SHALL usar las mismas animaciones de framer-motion que PageLoader

### Requirement 2: Integrar SearchLoader en el flujo de búsqueda

**User Story:** Como usuario, quiero que la animación de carga aparezca cuando inicio una búsqueda, para tener feedback visual inmediato.

#### Acceptance Criteria

1. WHEN el usuario ejecuta handleSearch, THE System SHALL mostrar SearchLoader estableciendo loading a true
2. WHEN la búsqueda se completa, THE System SHALL ocultar SearchLoader estableciendo loading a false
3. WHEN SearchLoader está visible, THE System SHALL mantener la posición de scroll actual
4. THE System SHALL usar SearchLoader solo para búsquedas iniciales, no para paginación
5. WHEN se muestra SearchLoader, THE System SHALL usar un overlay con backdrop-blur similar a PageLoader

### Requirement 3: Mantener posición de scroll durante búsqueda

**User Story:** Como usuario, quiero que la página no se desplace hacia arriba cuando realizo una búsqueda, para mantener el contexto visual.

#### Acceptance Criteria

1. WHEN SearchLoader se muestra, THE System SHALL preservar la posición de scroll actual del viewport
2. WHEN SearchLoader se oculta, THE System SHALL mantener la misma posición de scroll
3. THE System SHALL NO ejecutar scrollIntoView durante búsquedas (solo durante paginación)
4. WHEN el usuario está en la sección de resultados y busca, THE System SHALL mantener visible la sección de resultados

### Requirement 4: Diferenciar entre loading de búsqueda y paginación

**User Story:** Como desarrollador, quiero distinguir entre el loading de búsqueda y paginación, para mostrar la animación correcta en cada caso.

#### Acceptance Criteria

1. WHEN se ejecuta handleSearch sin pageOverride, THE System SHALL usar SearchLoader
2. WHEN se ejecuta goToNextPage o goToPreviousPage, THE System SHALL usar PageLoader
3. THE System SHALL mantener estados separados para loading (búsqueda) e isPaginationLoading (paginación)
4. WHEN ambos loaders están disponibles, THE System SHALL mostrar solo uno a la vez según el contexto
