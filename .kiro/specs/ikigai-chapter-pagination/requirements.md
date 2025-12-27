# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar la extracción completa de capítulos en Ikigai mediante paginación. Actualmente, el sistema solo obtiene los capítulos visibles en la primera página de una obra, pero Ikigai divide los capítulos en múltiples páginas usando el parámetro `?pagina=N`. Esta funcionalidad permitirá obtener la lista completa de capítulos de cualquier obra en Ikigai.

## Glossary

- **Ikigai**: Fuente de contenido manga/manhwa que usa el dominio viralikigai.foodib.net
- **Chapter_Extractor**: Sistema que obtiene la lista de capítulos de una obra
- **Pagination_Handler**: Componente que maneja la navegación entre páginas de capítulos
- **Slug**: Identificador único de una obra en formato URL-friendly (ej: "jinx-manhwa")
- **Chapter_Page**: Página individual que contiene un subconjunto de capítulos de una obra
- **Complete_Chapter_List**: Lista completa de todos los capítulos de una obra, obtenida de todas las páginas

## Requirements

### Requirement 1: Detección de Paginación

**User Story:** Como usuario del sistema, quiero que se detecte automáticamente si una obra tiene múltiples páginas de capítulos, para que el sistema sepa cuántas páginas debe procesar.

#### Acceptance Criteria

1. WHEN THE Chapter_Extractor accede a la página de una obra, THE System SHALL detectar la presencia de controles de paginación
2. WHEN se detectan controles de paginación, THE System SHALL extraer el número total de páginas disponibles
3. IF no se detectan controles de paginación, THEN THE System SHALL asumir que solo existe una página
4. WHEN se extrae el número total de páginas, THE System SHALL validar que sea un número entero positivo entre 1 y 100

### Requirement 2: Navegación entre Páginas

**User Story:** Como sistema de extracción, quiero navegar secuencialmente por todas las páginas de capítulos, para obtener la lista completa sin omitir ninguna página.

#### Acceptance Criteria

1. WHEN THE Pagination_Handler inicia la extracción, THE System SHALL comenzar desde la página 1
2. WHEN se procesa una página, THE System SHALL construir la URL con el parámetro `?pagina=N` donde N es el número de página
3. WHEN se completa la extracción de una página, THE System SHALL incrementar el contador de página en 1
4. WHEN se alcanza la última página detectada, THE System SHALL detener la navegación
5. IF ocurre un error al cargar una página, THEN THE System SHALL registrar el error y continuar con la siguiente página

### Requirement 3: Extracción de Capítulos por Página

**User Story:** Como sistema de extracción, quiero extraer todos los capítulos de cada página visitada, para construir la lista completa de capítulos.

#### Acceptance Criteria

1. WHEN THE Chapter_Extractor procesa una Chapter_Page, THE System SHALL extraer todos los enlaces de capítulos presentes
2. WHEN se extrae un capítulo, THE System SHALL obtener el número de capítulo, título y URL
3. WHEN se completa la extracción de una página, THE System SHALL agregar los capítulos a la Complete_Chapter_List
4. WHEN se agregan capítulos, THE System SHALL preservar el orden de extracción
5. IF un capítulo no tiene número válido, THEN THE System SHALL omitir ese capítulo y continuar

### Requirement 4: Consolidación y Deduplicación

**User Story:** Como usuario del sistema, quiero recibir una lista única y ordenada de capítulos sin duplicados, para tener una vista clara de todos los capítulos disponibles.

#### Acceptance Criteria

1. WHEN se completa la extracción de todas las páginas, THE System SHALL consolidar todos los capítulos en una Complete_Chapter_List
2. WHEN se consolidan capítulos, THE System SHALL eliminar duplicados basándose en el número de capítulo
3. WHEN existen duplicados, THE System SHALL preservar la primera ocurrencia encontrada
4. WHEN se completa la deduplicación, THE System SHALL ordenar los capítulos por número en orden descendente
5. WHEN se retorna la lista final, THE System SHALL incluir el total de capítulos únicos y el número de páginas procesadas

### Requirement 5: Manejo de Cloudflare Challenge

**User Story:** Como sistema de extracción, quiero superar automáticamente los challenges de Cloudflare en cada página, para poder acceder al contenido sin interrupciones.

#### Acceptance Criteria

1. WHEN THE System navega a una Chapter_Page, THE System SHALL esperar a que se complete el challenge de Cloudflare
2. WHEN se detecta un challenge activo, THE System SHALL esperar hasta 20 segundos para su resolución
3. IF el challenge no se resuelve en 20 segundos, THEN THE System SHALL intentar recargar la página una vez
4. WHEN se completa el challenge, THE System SHALL verificar que el contenido de la página sea válido
5. IF después del reload el challenge persiste, THEN THE System SHALL registrar el error y continuar con la siguiente página

### Requirement 6: Optimización de Rendimiento

**User Story:** Como administrador del sistema, quiero que la extracción de capítulos sea eficiente, para minimizar el tiempo de respuesta y el uso de recursos.

#### Acceptance Criteria

1. WHEN THE System procesa múltiples páginas, THE System SHALL reutilizar la misma instancia del navegador
2. WHEN se navega entre páginas, THE System SHALL usar la misma pestaña del navegador
3. WHEN se completa la extracción, THE System SHALL cerrar el navegador correctamente
4. WHEN se procesan páginas, THE System SHALL bloquear recursos innecesarios (ads, analytics, tracking)
5. WHEN se espera contenido dinámico, THE System SHALL usar tiempos de espera mínimos necesarios (máximo 3 segundos por página)

### Requirement 7: Logging y Debugging

**User Story:** Como desarrollador, quiero tener logs detallados del proceso de extracción, para poder diagnosticar problemas y monitorear el rendimiento.

#### Acceptance Criteria

1. WHEN THE System inicia la extracción, THE System SHALL registrar el slug de la obra y la URL base
2. WHEN se procesa cada página, THE System SHALL registrar el número de página y la cantidad de capítulos encontrados
3. WHEN se completa la extracción, THE System SHALL registrar el total de capítulos únicos y páginas procesadas
4. IF ocurre un error, THEN THE System SHALL registrar el tipo de error, la página afectada y el mensaje de error
5. WHEN se detectan duplicados, THE System SHALL registrar la cantidad de duplicados eliminados

### Requirement 8: Compatibilidad con API Existente

**User Story:** Como desarrollador frontend, quiero que la API mantenga la misma interfaz de respuesta, para que no sea necesario modificar el código del cliente.

#### Acceptance Criteria

1. WHEN se llama al endpoint `/api/ikigai/chapters`, THE System SHALL aceptar el parámetro `slug` en el body
2. WHEN se completa la extracción, THE System SHALL retornar un objeto JSON con las propiedades `chapters`, `total` y `pagesScanned`
3. WHEN se retornan capítulos, THE System SHALL usar el formato existente con `chapter`, `title` y `url`
4. IF ocurre un error, THEN THE System SHALL retornar un código de estado HTTP 500 con un mensaje de error descriptivo
5. WHEN el método HTTP no es POST, THE System SHALL retornar un código de estado HTTP 405
