# Plan: Sistema de Capítulos Leídos con Sombreado Visual

## Objetivo
Implementar un sistema que marque visualmente los capítulos ya leídos en el modal de detalles de una obra, sombreándolos cuando el usuario avanza al siguiente capítulo.

---

## Análisis de la Situación Actual

### Sistemas Existentes
1. **`readingProgressService`** - Guarda progreso de PÁGINAS dentro de un capítulo
   - Ubicación: `src/services/readingProgressService.js`
   - Función: Restaurar página específica cuando vuelves a un capítulo
   - Storage: `localStorage` con clave `reading_progress`
   - Estructura: `{ "mangaId_chapterId": { currentPage, totalPages, timestamp } }`

2. **`LibraryContext`** - Guarda capítulos totales leídos por manga
   - Ubicación: `src/context/LibraryContext.jsx`
   - Propiedad: `chaptersRead` (número total)
   - Función: Auto-incremento al avanzar de capítulo (en Reader.jsx)
   - Limitación: Solo guarda el **número total**, no qué capítulos específicos

### Problema Identificado
- **`chaptersRead`** es un contador global (ej: 5 capítulos leídos)
- **No sabemos QUÉ capítulos** fueron leídos (¿cap 1-5? ¿cap 1, 3, 5, 7, 9?)
- **No podemos sombrear** capítulos específicos sin esta información

---

## Solución Propuesta

### Crear un Nuevo Servicio: `ChapterHistoryService`

Similar a `readingProgressService`, pero para rastrear **capítulos completos leídos**.

#### Estructura de Datos
```javascript
// localStorage key: 'chapter_history'
{
  "manga_slug_or_id": {
    "readChapters": ["1", "2", "3", "4.5", "5"],  // Array de capítulos leídos
    "lastRead": "5",                                // Último capítulo leído
    "lastReadTimestamp": 1234567890,                // Timestamp
    "totalChaptersRead": 5                          // Contador
  }
}
```

#### Ventajas
- **Específico**: Sabemos exactamente qué capítulos se leyeron
- **Flexible**: Soporta lectura no lineal (saltar capítulos)
- **Persistente**: Sobrevive a refreshes
- **Independiente**: No afecta sistemas existentes

---

## Arquitectura de la Solución

### 1. Nuevo Servicio: `chapterHistoryService.js`
**Ubicación**: `src/services/chapterHistoryService.js`

**Métodos**:
```javascript
class ChapterHistoryService {
  // Marcar capítulo como leído
  markChapterAsRead(mangaId, chapterNumber)

  // Obtener todos los capítulos leídos de un manga
  getReadChapters(mangaId) // → ["1", "2", "3"]

  // Verificar si un capítulo específico fue leído
  isChapterRead(mangaId, chapterNumber) // → true/false

  // Obtener el último capítulo leído
  getLastReadChapter(mangaId) // → "5"

  // Obtener todos los mangas con historial
  getAllMangaHistory() // → { manga1: {...}, manga2: {...} }

  // Limpiar historial de un manga
  clearMangaHistory(mangaId)

  // Limpiar todo el historial
  clearAllHistory()
}
```

**Características**:
- Manejo de errores robusto
- Validación de datos
- Límite de almacenamiento (50 mangas máximo)
- Expiración de datos antiguos (30 días sin actividad)
- Soporte para capítulos decimales ("4.5", "10.5")

---

### 2. Integración en `Reader.jsx`

**Modificaciones Necesarias**:

#### A. Importar el Servicio
```javascript
import { chapterHistoryService } from '../services/chapterHistoryService';
```

#### B. Marcar Capítulo como Leído
Actualizar `handleNextChapter` para marcar el capítulo actual como completado:

```javascript
const handleNextChapter = () => {
    startLoading();

    // NUEVO: Marcar capítulo actual como leído
    if (mangaId && chapter) {
        chapterHistoryService.markChapterAsRead(mangaId, chapter.toString());
    }

    if (mangaId && chapterId) {
        readingProgressService.clearProgress(mangaId, chapterId);
    }

    autoSaveProgress();

    if (onNextChapter) {
        onNextChapter();
    }

    completeLoading();
};
```

**Lógica**:
- Al dar clic en "SIGUIENTE", se marca el capítulo **actual** como leído
- Se guarda antes de cambiar al siguiente capítulo
- Garantiza que el usuario completó el capítulo

#### C. Marcar Capítulo al Cerrar el Reader
Opcional: Marcar como leído si el usuario llegó a la última página:

```javascript
const handleCloseReader = () => {
    // Si está en la última página o cerca, marcar como leído
    if (currentPage >= pages.length - 3 && mangaId && chapter) {
        chapterHistoryService.markChapterAsRead(mangaId, chapter.toString());
    }

    onClose();
};
```

---

### 3. Integración en `DetailModal.jsx`

**Modificaciones Necesarias**:

#### A. Importar el Servicio
```javascript
import { chapterHistoryService } from '../services/chapterHistoryService';
```

#### B. Obtener Capítulos Leídos
Agregar estado para capítulos leídos:

```javascript
const [readChapters, setReadChapters] = useState([]);

// Cargar capítulos leídos cuando se abre el modal
useEffect(() => {
    if (isOpen && manga?.slug) {
        const read = chapterHistoryService.getReadChapters(manga.slug);
        setReadChapters(read);
    }
}, [isOpen, manga?.slug]);
```

#### C. Actualizar Lista cuando Cambia el Reader
Sincronizar cuando el usuario navega entre capítulos:

```javascript
// Actualizar readChapters cuando se cierra el reader
const handleCloseReader = () => {
    setReaderPages(null);
    setCurrentChapterIndex(-1);

    // Refrescar lista de capítulos leídos
    if (manga?.slug) {
        const read = chapterHistoryService.getReadChapters(manga.slug);
        setReadChapters(read);
    }
};
```

#### D. Aplicar Estilos Condicionales a los Botones
Modificar el renderizado de capítulos para sombrear los leídos:

```javascript
chaptersBySource[selectedChapterSource].map((ch) => {
    const isRead = readChapters.includes(ch.chapter.toString());

    return (
        <button
            key={ch.id}
            onClick={() => openReader(ch, selectedChapterSource)}
            disabled={isOpeningReader}
            className={`
                px-2.5 sm:px-4 py-1.5 sm:py-2
                rounded-lg sm:rounded-xl
                text-[10px] sm:text-xs font-bold
                transition-all
                disabled:opacity-50
                ${isRead
                    ? 'bg-gray-300 text-gray-600 line-through'
                    : 'bg-gray-100 hover:bg-potaxie-green hover:text-white'
                }
            `}
        >
            Cap {ch.chapter}
        </button>
    );
})
```

**Estilos Propuestos para Capítulos Leídos**:
- **Fondo**: `bg-gray-300` (gris claro)
- **Texto**: `text-gray-600` (gris oscuro)
- **Decoración**: `line-through` (tachado) - Opcional
- **Hover**: Sin efecto o mínimo

**Estilos para Capítulos No Leídos**:
- **Fondo**: `bg-gray-100` → `hover:bg-potaxie-green`
- **Texto**: `text-black` → `hover:text-white`

---

## Detalles de Implementación

### Archivo 1: `chapterHistoryService.js`

```javascript
/**
 * ChapterHistoryService
 *
 * Servicio para rastrear qué capítulos específicos ha leído el usuario.
 * Permite marcar capítulos como leídos y sombrearlos visualmente en la UI.
 */

class ChapterHistoryService {
  constructor() {
    this.STORAGE_KEY = 'chapter_history';
    this.MAX_MANGA = 50; // Máximo de mangas rastreados
    this.EXPIRY_DAYS = 30; // Días antes de limpiar historial inactivo
  }

  /**
   * Obtiene el historial completo desde localStorage
   * @private
   * @returns {Object} - { mangaId: { readChapters: [], lastRead, ... } }
   */
  _getHistory() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error parsing chapter history:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return {};
    }
  }

  /**
   * Guarda el historial completo en localStorage
   * @private
   */
  _saveHistory(history) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage full, cleaning old manga history...');
        this._removeOldestManga(history, 10);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (retryError) {
          console.error('Failed to save chapter history:', retryError);
        }
      }
    }
  }

  /**
   * Elimina los N mangas más antiguos del historial
   * @private
   */
  _removeOldestManga(history, count) {
    const entries = Object.entries(history);
    entries.sort((a, b) => a[1].lastReadTimestamp - b[1].lastReadTimestamp);

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      delete history[entries[i][0]];
    }
  }

  /**
   * Normaliza el número de capítulo a string
   * @private
   */
  _normalizeChapter(chapter) {
    return chapter.toString().trim();
  }

  /**
   * Marca un capítulo como leído
   * @param {string} mangaId - ID del manga
   * @param {string|number} chapterNumber - Número del capítulo
   */
  markChapterAsRead(mangaId, chapterNumber) {
    if (!mangaId || chapterNumber === null || chapterNumber === undefined) {
      console.warn('Invalid parameters for markChapterAsRead');
      return;
    }

    try {
      const history = this._getHistory();
      const chapter = this._normalizeChapter(chapterNumber);

      // Inicializar manga si no existe
      if (!history[mangaId]) {
        history[mangaId] = {
          readChapters: [],
          lastRead: null,
          lastReadTimestamp: Date.now(),
          totalChaptersRead: 0
        };
      }

      // Agregar capítulo si no está en la lista
      if (!history[mangaId].readChapters.includes(chapter)) {
        history[mangaId].readChapters.push(chapter);
        history[mangaId].totalChaptersRead = history[mangaId].readChapters.length;
      }

      // Actualizar último leído
      history[mangaId].lastRead = chapter;
      history[mangaId].lastReadTimestamp = Date.now();

      // Aplicar límite de almacenamiento
      if (Object.keys(history).length > this.MAX_MANGA) {
        this._removeOldestManga(history, 10);
      }

      this._saveHistory(history);
    } catch (error) {
      console.error('Error in markChapterAsRead:', error);
    }
  }

  /**
   * Obtiene la lista de capítulos leídos de un manga
   * @param {string} mangaId - ID del manga
   * @returns {string[]} - Array de capítulos leídos
   */
  getReadChapters(mangaId) {
    if (!mangaId) return [];

    try {
      const history = this._getHistory();
      return history[mangaId]?.readChapters || [];
    } catch (error) {
      console.error('Error in getReadChapters:', error);
      return [];
    }
  }

  /**
   * Verifica si un capítulo específico fue leído
   * @param {string} mangaId - ID del manga
   * @param {string|number} chapterNumber - Número del capítulo
   * @returns {boolean}
   */
  isChapterRead(mangaId, chapterNumber) {
    if (!mangaId || chapterNumber === null || chapterNumber === undefined) {
      return false;
    }

    const readChapters = this.getReadChapters(mangaId);
    const chapter = this._normalizeChapter(chapterNumber);
    return readChapters.includes(chapter);
  }

  /**
   * Obtiene el último capítulo leído de un manga
   * @param {string} mangaId - ID del manga
   * @returns {string|null}
   */
  getLastReadChapter(mangaId) {
    if (!mangaId) return null;

    try {
      const history = this._getHistory();
      return history[mangaId]?.lastRead || null;
    } catch (error) {
      console.error('Error in getLastReadChapter:', error);
      return null;
    }
  }

  /**
   * Limpia el historial de un manga específico
   * @param {string} mangaId - ID del manga
   */
  clearMangaHistory(mangaId) {
    if (!mangaId) return;

    try {
      const history = this._getHistory();

      if (history[mangaId]) {
        delete history[mangaId];
        this._saveHistory(history);
      }
    } catch (error) {
      console.error('Error in clearMangaHistory:', error);
    }
  }

  /**
   * Limpia todo el historial de capítulos leídos
   */
  clearAllHistory() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error in clearAllHistory:', error);
    }
  }

  /**
   * Obtiene todo el historial de todos los mangas
   * @returns {Object}
   */
  getAllHistory() {
    return this._getHistory();
  }
}

// Exportar instancia singleton
export const chapterHistoryService = new ChapterHistoryService();
```

---

## Flujo de Usuario Completo

### Escenario: Usuario Lee Capítulo 1 y Avanza a Capítulo 2

1. **Usuario abre DetailModal** de "One Piece"
   - Ve lista de capítulos: Cap 1, Cap 2, Cap 3, ... (todos sin sombrear)

2. **Usuario hace clic en "Cap 1"**
   - `openReader()` se ejecuta
   - Reader muestra páginas del capítulo 1
   - Usuario lee las páginas

3. **Usuario hace clic en "SIGUIENTE"** (botón en Reader)
   - `handleNextChapter()` se ejecuta
   - **Se ejecuta**: `chapterHistoryService.markChapterAsRead("onepiece", "1")`
   - Capítulo 1 se marca como leído en localStorage
   - Reader carga capítulo 2

4. **Usuario cierra el Reader** y vuelve al DetailModal
   - `handleCloseReader()` refresca la lista de capítulos leídos
   - DetailModal consulta: `chapterHistoryService.getReadChapters("onepiece")`
   - Recibe: `["1"]`
   - **Cap 1 se renderiza con sombreado gris**
   - Cap 2, 3, 4, ... siguen sin sombrear

5. **Usuario vuelve a abrir DetailModal más tarde**
   - Capítulo 1 sigue sombreado (persistencia)

---

## Checklist de Implementación

### Fase 1: Crear Servicio Base
- [ ] Crear archivo `chapterHistoryService.js`
- [ ] Implementar métodos básicos (mark, get, check)
- [ ] Agregar validación de datos
- [ ] Implementar límite de almacenamiento
- [ ] Testing manual en consola

### Fase 2: Integración en Reader
- [ ] Importar `chapterHistoryService` en `Reader.jsx`
- [ ] Modificar `handleNextChapter` para marcar capítulo como leído
- [ ] Modificar `handlePreviousChapter` (opcional)
- [ ] Testing: Verificar que se guarda en localStorage

### Fase 3: Integración en DetailModal
- [ ] Importar `chapterHistoryService` en `DetailModal.jsx`
- [ ] Agregar estado `readChapters`
- [ ] Cargar capítulos leídos al abrir modal
- [ ] Refrescar capítulos leídos al cerrar reader
- [ ] Aplicar estilos condicionales a botones

### Fase 4: Estilos Visuales
- [ ] Definir colores para capítulos leídos (gris)
- [ ] Definir colores para capítulos no leídos (blanco → verde)
- [ ] Agregar transiciones suaves
- [ ] Opcional: Agregar iconos (✓ para leídos)
- [ ] Opcional: Agregar line-through

### Fase 5: Testing
- [ ] Probar flujo completo: abrir cap → siguiente → cerrar → reabrir modal
- [ ] Probar con múltiples capítulos
- [ ] Probar persistencia (refresh página)
- [ ] Probar con diferentes mangas
- [ ] Probar límite de almacenamiento

### Fase 6: Refinamiento
- [ ] Agregar indicador de "último leído"
- [ ] Agregar botón "Continuar Leyendo" que vaya al último capítulo
- [ ] Opcional: Sincronizar con `chaptersRead` de LibraryContext
- [ ] Documentación

---

## Estilos Propuestos (TailwindCSS)

### Capítulo No Leído
```jsx
<button
    className="
        px-2.5 sm:px-4 py-1.5 sm:py-2
        bg-gray-100
        hover:bg-potaxie-green
        hover:text-white
        text-gray-900
        rounded-lg sm:rounded-xl
        text-[10px] sm:text-xs font-bold
        transition-all duration-200
        border border-gray-200
        shadow-sm
        hover:shadow-md
        hover:scale-105
    "
>
    Cap {ch.chapter}
</button>
```

### Capítulo Leído
```jsx
<button
    className="
        px-2.5 sm:px-4 py-1.5 sm:py-2
        bg-gray-300
        text-gray-500
        rounded-lg sm:rounded-xl
        text-[10px] sm:text-xs font-bold
        transition-all duration-200
        border border-gray-300
        cursor-default
        opacity-70
        relative
    "
    disabled={true}
>
    <span className="line-through">Cap {ch.chapter}</span>
    <span className="ml-1 text-potaxie-green">✓</span>
</button>
```

**Variante Alternativa (Sin Deshabilitar)**:
```jsx
<button
    className={`
        px-2.5 sm:px-4 py-1.5 sm:py-2
        rounded-lg sm:rounded-xl
        text-[10px] sm:text-xs font-bold
        transition-all duration-200
        border shadow-sm
        ${isRead
            ? 'bg-potaxie-green/20 text-potaxie-700 border-potaxie-green/40 hover:bg-potaxie-green/30'
            : 'bg-gray-100 hover:bg-potaxie-green hover:text-white text-gray-900 border-gray-200 hover:shadow-md hover:scale-105'
        }
    `}
>
    {isRead && <span className="mr-1">✓</span>}
    Cap {ch.chapter}
</button>
```

---

## Mejoras Futuras (Opcional)

### 1. Botón "Continuar Leyendo"
En el DetailModal, agregar un botón destacado que lleve al último capítulo leído:

```jsx
{readChapters.length > 0 && (
    <button
        onClick={() => {
            const lastChapter = chapterHistoryService.getLastReadChapter(manga.slug);
            const chapter = chaptersBySource[selectedChapterSource].find(
                ch => ch.chapter.toString() === lastChapter
            );
            if (chapter) openReader(chapter, selectedChapterSource);
        }}
        className="w-full py-3 bg-potaxie-green text-white font-black rounded-xl mb-4"
    >
        📖 CONTINUAR LEYENDO (Cap {chapterHistoryService.getLastReadChapter(manga.slug)})
    </button>
)}
```

### 2. Sincronización con `chaptersRead`
Cuando se marca un capítulo como leído, actualizar también el contador global:

```javascript
markChapterAsRead(mangaId, chapter);

// Actualizar LibraryContext
const readCount = chapterHistoryService.getReadChapters(mangaId).length;
// Comparar con manga.chaptersRead y actualizar si es mayor
```

### 3. Indicador Visual de Progreso
Barra de progreso mostrando cuántos capítulos se han leído:

```jsx
<div className="mb-4">
    <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progreso</span>
        <span>{readChapters.length} / {chaptersCount}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
        <div
            className="bg-potaxie-green h-2 rounded-full transition-all"
            style={{ width: `${(readChapters.length / chaptersCount) * 100}%` }}
        />
    </div>
</div>
```

### 4. Estadísticas en Biblioteca
Mostrar en ManhwaCard cuántos capítulos ha leído el usuario:

```jsx
<span className="text-xs">
    {readChapters.length} / {manga.lastChapter} leídos
</span>
```

---

## Consideraciones Técnicas

### localStorage Límites
- **Tamaño**: ~5-10 MB por dominio
- **Solución**: Limitar a 50 mangas con historial activo
- **Limpieza**: Eliminar mangas sin actividad en 30 días

### Performance
- **Operaciones rápidas**: Lectura/escritura localStorage es síncrona y rápida
- **Sin impacto**: No afecta carga de páginas o navegación

### Compatibilidad
- **Navegadores**: Todos los modernos (Chrome, Firefox, Safari, Edge)
- **Fallback**: Si localStorage falla, el sistema sigue funcionando (sin persistencia)

---

## Resultado Esperado

Una vez implementado:

1. **Feedback Visual Claro**: Usuario sabe qué capítulos ya leyó
2. **Persistencia**: Historial se mantiene entre sesiones
3. **UX Mejorada**: Facilita reanudar lectura y rastrear progreso
4. **Flexible**: Permite saltar capítulos sin perder historial
5. **Escalable**: Soporta múltiples mangas y fuentes

---

## Notas Finales

- El sistema es **independiente** de `readingProgressService` (páginas) y `LibraryContext` (contador global)
- Puede coexistir con sistemas existentes sin conflictos
- Es **retroactivo**: Funciona para nuevos capítulos leídos, no afecta historial previo
- El usuario puede **re-leer** capítulos sin problemas (botón sigue clickeable)
