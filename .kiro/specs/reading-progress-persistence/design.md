# Design Document: Reading Progress Persistence

## Overview

Esta funcionalidad implementa un sistema de guardado automático del progreso de lectura que permite a los usuarios continuar leyendo desde la última página visualizada, incluso si cierran el navegador o la pestaña accidentalmente. El sistema utiliza localStorage para persistir el progreso y se integra con el componente Reader existente.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│     Reader      │
│   Component     │
└────────┬────────┘
         │
         │ usa
         ▼
┌─────────────────┐      guarda/lee      ┌──────────────┐
│ ReadingProgress │ ◄──────────────────► │ localStorage │
│    Service      │                       └──────────────┘
└─────────────────┘
         │
         │ notifica
         ▼
┌─────────────────┐
│  Toast Context  │
│  (notificación) │
└─────────────────┘
```

### Data Flow

1. **Guardado**: Usuario cambia de página → Reader detecta cambio → ReadingProgressService guarda en localStorage
2. **Restauración**: Usuario abre capítulo → Reader consulta ReadingProgressService → Si hay progreso, restaura página y muestra notificación
3. **Limpieza**: Usuario cambia de capítulo → ReadingProgressService elimina progreso del capítulo anterior

## Components and Interfaces

### ReadingProgressService

Servicio singleton que maneja toda la lógica de persistencia del progreso de lectura.

```javascript
// src/services/readingProgressService.js

class ReadingProgressService {
  constructor() {
    this.STORAGE_KEY = 'reading_progress';
    this.MAX_ENTRIES = 50;
    this.EXPIRY_DAYS = 30;
  }

  /**
   * Guarda el progreso de lectura actual
   * @param {string} mangaId - ID del manga
   * @param {string} chapterId - ID del capítulo
   * @param {number} currentPage - Página actual (0-indexed)
   * @param {number} totalPages - Total de páginas del capítulo
   */
  saveProgress(mangaId, chapterId, currentPage, totalPages)

  /**
   * Obtiene el progreso guardado para un capítulo específico
   * @param {string} mangaId - ID del manga
   * @param {string} chapterId - ID del capítulo
   * @returns {Object|null} - {currentPage, totalPages, timestamp} o null
   */
  getProgress(mangaId, chapterId)

  /**
   * Elimina el progreso de un capítulo específico
   * @param {string} mangaId - ID del manga
   * @param {string} chapterId - ID del capítulo
   */
  clearProgress(mangaId, chapterId)

  /**
   * Limpia progresos expirados (más de 30 días)
   */
  cleanExpiredProgress()

  /**
   * Limpia progresos antiguos si se excede el límite de 50 entradas
   */
  enforceStorageLimit()
}

export const readingProgressService = new ReadingProgressService();
```

### Reader Component Updates

El componente Reader se modificará para:
1. Consultar el progreso guardado al montar
2. Guardar el progreso cuando cambia la página
3. Limpiar el progreso al cambiar de capítulo

```javascript
// Pseudocódigo de cambios en Reader.jsx

const Reader = ({ pages, title, chapter, mangaId, chapterId, ... }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const { showToast } = useToast();

  // Al montar, restaurar progreso si existe
  useEffect(() => {
    const savedProgress = readingProgressService.getProgress(mangaId, chapterId);
    
    if (savedProgress && savedProgress.currentPage > 0) {
      setCurrentPage(savedProgress.currentPage);
      setHasRestoredProgress(true);
      
      // Mostrar notificación
      showToast(`Continuando desde página ${savedProgress.currentPage + 1}`, 'info');
      
      // Scroll a la página correcta
      setTimeout(() => {
        scrollToPage(savedProgress.currentPage);
      }, 100);
    }
  }, [mangaId, chapterId]);

  // Guardar progreso cuando cambia la página
  useEffect(() => {
    if (hasRestoredProgress || currentPage > 0) {
      const timeoutId = setTimeout(() => {
        readingProgressService.saveProgress(
          mangaId, 
          chapterId, 
          currentPage, 
          pages.length
        );
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, mangaId, chapterId, pages.length]);

  // Limpiar progreso al cambiar de capítulo
  const handleNextChapter = () => {
    readingProgressService.clearProgress(mangaId, chapterId);
    onNextChapter();
  };

  const handlePreviousChapter = () => {
    readingProgressService.clearProgress(mangaId, chapterId);
    onPreviousChapter();
  };

  // ... resto del componente
};
```

## Data Models

### ReadingProgress Object

```typescript
interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  currentPage: number;      // 0-indexed
  totalPages: number;
  timestamp: number;         // Unix timestamp en milisegundos
}

interface ReadingProgressStorage {
  [key: string]: ReadingProgress;  // key = `${mangaId}_${chapterId}`
}
```

### LocalStorage Structure

```json
{
  "reading_progress": {
    "manga123_chapter5": {
      "mangaId": "manga123",
      "chapterId": "chapter5",
      "currentPage": 15,
      "totalPages": 30,
      "timestamp": 1704067200000
    },
    "manga456_chapter2": {
      "mangaId": "manga456",
      "chapterId": "chapter2",
      "currentPage": 8,
      "totalPages": 25,
      "timestamp": 1704070800000
    }
  }
}
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer.*

### Property 1: Guardado Idempotente
*Para cualquier* combinación de mangaId, chapterId y currentPage, guardar el progreso múltiples veces con los mismos valores debe resultar en el mismo estado final en localStorage.
**Validates: Requirements 1.1**

### Property 2: Restauración Consistente
*Para cualquier* progreso guardado válido, restaurarlo debe resultar en que currentPage sea igual al valor guardado.
**Validates: Requirements 2.1, 2.2**

### Property 3: Límite de Almacenamiento
*Para cualquier* secuencia de operaciones de guardado, el número total de entradas en localStorage nunca debe exceder 50.
**Validates: Requirements 5.1, 5.2**

### Property 4: Expiración de Progreso
*Para cualquier* progreso guardado con timestamp mayor a 30 días, al intentar restaurarlo debe retornar null.
**Validates: Requirements 2.3**

### Property 5: Limpieza de Progreso
*Para cualquier* progreso guardado, después de llamar a clearProgress con el mismo mangaId y chapterId, getProgress debe retornar null.
**Validates: Requirements 3.2**

### Property 6: Validación de Datos
*Para cualquier* dato corrupto o inválido en localStorage, el sistema debe ignorarlo y retornar null sin lanzar errores.
**Validates: Requirements 5.4**

## Error Handling

### LocalStorage Errors

- **Quota Exceeded**: Si localStorage está lleno, eliminar las 10 entradas más antiguas y reintentar
- **Parse Error**: Si los datos están corruptos, limpiar toda la clave y comenzar de nuevo
- **Access Denied**: Si localStorage no está disponible (modo privado), usar memoria en sesión como fallback

### Invalid Data

- **Página fuera de rango**: Si currentPage > totalPages, comenzar desde página 1
- **IDs inválidos**: Si mangaId o chapterId son null/undefined, no guardar progreso
- **Timestamp inválido**: Si timestamp no es un número válido, usar Date.now()

### Edge Cases

- **Capítulo con 0 páginas**: No guardar progreso
- **Usuario en última página**: Guardar progreso normalmente (se limpiará al cambiar de capítulo)
- **Múltiples pestañas**: Última escritura gana (last-write-wins)

## Testing Strategy

### Unit Tests

1. **ReadingProgressService Tests**
   - Test saveProgress con datos válidos
   - Test getProgress retorna datos correctos
   - Test clearProgress elimina datos
   - Test cleanExpiredProgress elimina solo progresos antiguos
   - Test enforceStorageLimit mantiene solo 50 entradas
   - Test manejo de localStorage corrupto
   - Test manejo de localStorage no disponible

2. **Reader Component Tests**
   - Test restauración de progreso al montar
   - Test guardado de progreso al cambiar página
   - Test limpieza de progreso al cambiar capítulo
   - Test notificación se muestra al restaurar progreso
   - Test scroll automático a página restaurada

### Property-Based Tests

Cada property test debe ejecutarse con mínimo 100 iteraciones y estar etiquetado con:
**Feature: reading-progress-persistence, Property {number}: {property_text}**

1. **Property 1: Guardado Idempotente**
   - Generar mangaId, chapterId, currentPage aleatorios
   - Guardar progreso N veces
   - Verificar que el resultado final sea consistente

2. **Property 2: Restauración Consistente**
   - Generar y guardar progreso aleatorio
   - Restaurar progreso
   - Verificar que currentPage coincida

3. **Property 3: Límite de Almacenamiento**
   - Generar 100 progresos aleatorios
   - Guardar todos
   - Verificar que solo existan 50 en localStorage

4. **Property 4: Expiración de Progreso**
   - Generar progreso con timestamp antiguo (>30 días)
   - Intentar restaurar
   - Verificar que retorne null

5. **Property 5: Limpieza de Progreso**
   - Generar y guardar progreso aleatorio
   - Llamar clearProgress
   - Verificar que getProgress retorne null

6. **Property 6: Validación de Datos**
   - Generar datos corruptos aleatorios en localStorage
   - Intentar restaurar
   - Verificar que no lance errores y retorne null

### Integration Tests

1. Test flujo completo: abrir capítulo → leer → cerrar → reabrir → verificar página correcta
2. Test cambio de capítulo limpia progreso anterior
3. Test múltiples mangas mantienen progreso independiente
4. Test límite de almacenamiento en uso real

### Manual Testing

1. Verificar notificación visual al restaurar progreso
2. Verificar scroll automático funciona correctamente
3. Verificar experiencia en móvil y desktop
4. Verificar comportamiento con localStorage deshabilitado
