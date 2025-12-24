# Implementation Plan: Search Loader Animation

## Overview

Este plan implementa una animación de carga específica para búsquedas, reutilizando la estructura del PageLoader existente pero con imagen y texto personalizados. La implementación garantiza que la posición de scroll se preserve durante búsquedas.

## Tasks

- [x] 1. Crear componente SearchLoader
  - Copiar estructura de PageLoader.jsx como base
  - Cambiar imagen a "/search loading.png"
  - Cambiar texto a "Searching{dots}"
  - Cambiar subtexto a "Buscando tu próximo vicio"
  - Mantener todas las animaciones y estilos de PageLoader
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5_

- [x] 2. Integrar SearchLoader en App.jsx
  - Importar SearchLoader desde './components/SearchLoader'
  - Agregar <SearchLoader isLoading={loading} /> en el render (antes de PageLoader)
  - Verificar que el estado 'loading' existente se usa correctamente en handleSearch
  - NO modificar la lógica de scroll en handleSearch (debe preservar posición actual)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Pruebas manuales y validación
  - Ejecutar la aplicación localmente
  - Realizar búsqueda y verificar que aparece SearchLoader con imagen correcta
  - Verificar que la página NO se desplaza hacia arriba durante búsqueda
  - Cambiar de página y verificar que aparece PageLoader (no SearchLoader)
  - Verificar que la página SÍ se desplaza a resultados durante paginación
  - Probar en modo oscuro y claro
  - Probar en diferentes tamaños de pantalla (responsive)
  - _Requirements: Todos_

## Notes

- La implementación reutiliza código existente (PageLoader) para consistencia
- No se requieren tests automatizados, solo validación manual
- El estado 'loading' ya existe en App.jsx y se usa correctamente
