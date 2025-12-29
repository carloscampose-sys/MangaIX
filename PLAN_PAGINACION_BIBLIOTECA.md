# Plan: Paginación en la Biblioteca

## Objetivo
Implementar un sistema de paginación en la biblioteca que muestre 10 obras por página, mejorando la experiencia de usuario y el rendimiento al no cargar todas las obras simultáneamente.

## Análisis de la Funcionalidad

### Características Principales
1. **Paginación de obras**: Mostrar 10 obras por página
2. **Navegación entre páginas**: Botones para ir a página anterior, siguiente, y páginas específicas
3. **Indicador de página actual**: Mostrar claramente en qué página está el usuario
4. **Responsive**: Adaptarse a diferentes tamaños de pantalla
5. **Persistencia**: Recordar la página actual al navegar
6. **Scroll automático**: Volver al inicio al cambiar de página

## Diseño de la Interfaz

### Componente de Paginación

```
┌─────────────────────────────────────────────────┐
│  [Obras 1-10 de 45]                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Card] [Card] [Card] [Card] [Card]            │
│  [Card] [Card] [Card] [Card] [Card]            │
│                                                 │
├─────────────────────────────────────────────────┤
│  Mostrando 1-10 de 45 obras                    │
│                                                 │
│  [◀ Anterior] [1] [2] [3] [4] [5] [Siguiente ▶]│
└─────────────────────────────────────────────────┘
```

### Versión Móvil

```
┌──────────────────────┐
│  [Obras 1-10 de 45]  │
├──────────────────────┤
│                      │
│  [Card]              │
│  [Card]              │
│  [Card]              │
│                      │
├──────────────────────┤
│  1-10 de 45          │
│                      │
│  [◀] [1][2][3] [▶]  │
└──────────────────────┘
```

## Arquitectura Técnica

### 1. Estado de Paginación

**Ubicación**: Dentro del componente de Biblioteca (App.jsx o componente separado)

**Estados necesarios**:
```javascript
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(10);
```

**Cálculos derivados**:
```javascript
const totalPages = Math.ceil(library.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentItems = library.slice(startIndex, endIndex);
```

### 2. Componente: Pagination

**Ubicación**: `src/components/Pagination.jsx`

**Props**:
```javascript
{
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void,
  totalItems: number,
  itemsPerPage: number
}
```

**Funcionalidades**:
- Botón "Anterior" (deshabilitado en página 1)
- Botón "Siguiente" (deshabilitado en última página)
- Números de página (con ellipsis si hay muchas páginas)
- Indicador de rango actual (ej: "Mostrando 1-10 de 45")

### 3. Lógica de Números de Página

**Estrategia de visualización**:
- Siempre mostrar primera y última página
- Mostrar página actual y 2 páginas a cada lado
- Usar "..." para páginas omitidas

**Ejemplos**:
- Total 5 páginas: `[1] [2] [3] [4] [5]`
- Total 10 páginas, página 1: `[1] [2] [3] ... [10]`
- Total 10 páginas, página 5: `[1] ... [4] [5] [6] ... [10]`
- Total 10 páginas, página 10: `[1] ... [8] [9] [10]`

## Implementación Paso a Paso

### Fase 1: Crear Componente de Paginación

**Archivo**: `src/components/Pagination.jsx`

**Características**:
- Botones de navegación (Anterior/Siguiente)
- Números de página con ellipsis
- Indicador de rango
- Estilos responsive
- Animaciones con Framer Motion

### Fase 2: Integrar en la Biblioteca

**Modificar**: Componente de Biblioteca en `src/App.jsx`

**Cambios**:
1. Agregar estados de paginación
2. Calcular items de la página actual
3. Renderizar solo items de la página actual
4. Agregar componente Pagination al final

### Fase 3: Funcionalidad de Navegación

**Implementar**:
- `handlePageChange(page)` - Cambiar a página específica
- `handlePreviousPage()` - Ir a página anterior
- `handleNextPage()` - Ir a página siguiente
- Scroll automático al inicio al cambiar página

### Fase 4: Responsive Design

**Breakpoints**:
- **Móvil** (< 640px): 
  - Mostrar solo 3 números de página
  - Botones más pequeños
  - Texto compacto
- **Tablet** (640px - 1024px):
  - Mostrar 5 números de página
  - Botones medianos
- **Desktop** (> 1024px):
  - Mostrar 7 números de página
  - Botones completos con texto

### Fase 5: Optimizaciones

**Mejoras**:
- Persistir página actual en sessionStorage
- Animación de transición entre páginas
- Indicador de carga al cambiar página
- Scroll suave al inicio

## Diseño del Componente Pagination

### Estructura HTML/JSX

```jsx
<div className="pagination-container">
  {/* Indicador de rango */}
  <div className="pagination-info">
    Mostrando {startItem}-{endItem} de {totalItems} obras
  </div>

  {/* Controles de paginación */}
  <div className="pagination-controls">
    {/* Botón Anterior */}
    <button 
      onClick={handlePrevious}
      disabled={currentPage === 1}
    >
      ◀ Anterior
    </button>

    {/* Números de página */}
    <div className="page-numbers">
      {pageNumbers.map(page => (
        page === '...' 
          ? <span>...</span>
          : <button onClick={() => onPageChange(page)}>{page}</button>
      ))}
    </div>

    {/* Botón Siguiente */}
    <button 
      onClick={handleNext}
      disabled={currentPage === totalPages}
    >
      Siguiente ▶
    </button>
  </div>
</div>
```

### Estilos Responsive

```css
/* Desktop */
.pagination-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.page-numbers button {
  min-width: 40px;
  height: 40px;
}

/* Tablet */
@media (max-width: 1024px) {
  .page-numbers button {
    min-width: 36px;
    height: 36px;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .pagination-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .page-numbers button {
    min-width: 32px;
    height: 32px;
  }
  
  button span {
    display: none; /* Ocultar texto, solo iconos */
  }
}
```

## Lógica de Generación de Números de Página

```javascript
const generatePageNumbers = (currentPage, totalPages) => {
  const pages = [];
  const maxVisible = window.innerWidth < 640 ? 3 : 
                     window.innerWidth < 1024 ? 5 : 7;
  
  if (totalPages <= maxVisible) {
    // Mostrar todas las páginas
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Lógica con ellipsis
    const halfVisible = Math.floor(maxVisible / 2);
    
    // Siempre incluir primera página
    pages.push(1);
    
    // Calcular rango alrededor de página actual
    let startPage = Math.max(2, currentPage - halfVisible);
    let endPage = Math.min(totalPages - 1, currentPage + halfVisible);
    
    // Ajustar si estamos cerca del inicio o fin
    if (currentPage <= halfVisible + 1) {
      endPage = maxVisible - 1;
    } else if (currentPage >= totalPages - halfVisible) {
      startPage = totalPages - maxVisible + 2;
    }
    
    // Agregar ellipsis si es necesario
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Agregar páginas del rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Agregar ellipsis si es necesario
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Siempre incluir última página
    pages.push(totalPages);
  }
  
  return pages;
};
```

## Integración con la Biblioteca

### Modificaciones en App.jsx

```javascript
// En el componente de Biblioteca
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 10;

// Calcular items de la página actual
const totalPages = Math.ceil(library.length / ITEMS_PER_PAGE);
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const currentLibraryItems = library.slice(startIndex, endIndex);

// Handler para cambio de página
const handlePageChange = (page) => {
  setCurrentPage(page);
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Guardar en sessionStorage
  sessionStorage.setItem('libraryPage', page);
};

// Cargar página guardada al iniciar
useEffect(() => {
  const savedPage = sessionStorage.getItem('libraryPage');
  if (savedPage) {
    setCurrentPage(parseInt(savedPage));
  }
}, []);

// Renderizar
return (
  <div>
    {/* Indicador superior */}
    <div className="library-header">
      <h2>Mi Biblioteca ({library.length} obras)</h2>
    </div>

    {/* Grid de obras (solo página actual) */}
    <div className="library-grid">
      {currentLibraryItems.map(item => (
        <ManhwaCard key={item.id} {...item} />
      ))}
    </div>

    {/* Componente de paginación */}
    {library.length > ITEMS_PER_PAGE && (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={library.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    )}
  </div>
);
```

## Características Adicionales

### 1. Animación de Transición

```javascript
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={currentPage}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="library-grid"
  >
    {currentLibraryItems.map(item => (
      <ManhwaCard key={item.id} {...item} />
    ))}
  </motion.div>
</AnimatePresence>
```

### 2. Indicador de Carga

```javascript
const [isChangingPage, setIsChangingPage] = useState(false);

const handlePageChange = async (page) => {
  setIsChangingPage(true);
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Simular pequeño delay para animación
  await new Promise(resolve => setTimeout(resolve, 300));
  setIsChangingPage(false);
};
```

### 3. Teclado Navigation

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      handlePageChange(currentPage - 1);
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentPage, totalPages]);
```

## Ventajas de esta Solución

✅ **Mejor Performance**: Solo renderiza 10 obras a la vez
✅ **UX Mejorada**: Navegación clara y fácil
✅ **Responsive**: Se adapta a todos los dispositivos
✅ **Persistencia**: Recuerda la página actual
✅ **Accesibilidad**: Navegación por teclado
✅ **Animaciones**: Transiciones suaves
✅ **Escalable**: Funciona con cualquier cantidad de obras

## Consideraciones

### Performance
- Solo renderizar 10 cards reduce significativamente el DOM
- Animaciones optimizadas con Framer Motion
- Scroll suave sin bloquear UI

### UX
- Indicador claro de página actual
- Botones deshabilitados cuando no aplican
- Feedback visual al cambiar página
- Números de página inteligentes con ellipsis

### Responsive
- Menos números de página en móvil
- Botones más pequeños en pantallas pequeñas
- Layout adaptativo (columna en móvil, fila en desktop)

## Archivos a Crear/Modificar

### Crear
1. `src/components/Pagination.jsx` - Componente de paginación

### Modificar
1. `src/App.jsx` - Integrar paginación en biblioteca
2. `src/index.css` - Estilos para paginación (opcional)

## Estimación de Tiempo

- **Fase 1**: Crear componente Pagination - 2-3 horas
- **Fase 2**: Integrar en biblioteca - 1-2 horas
- **Fase 3**: Funcionalidad de navegación - 1 hora
- **Fase 4**: Responsive design - 1-2 horas
- **Fase 5**: Optimizaciones - 1-2 horas

**Total**: 6-10 horas de desarrollo

## Próximos Pasos

1. ¿Te gusta este enfoque?
2. ¿Quieres ajustar el número de obras por página (10)?
3. ¿Prefieres algún estilo específico para los botones?
4. ¿Quieres que empiece con la implementación?
