/**
 * ReadingProgressService
 * 
 * Servicio para gestionar el progreso de lectura de capítulos.
 * Guarda y restaura automáticamente la página actual del usuario en localStorage.
 */

class ReadingProgressService {
  constructor() {
    this.STORAGE_KEY = 'reading_progress';
    this.MAX_ENTRIES = 50;
    this.EXPIRY_DAYS = 30;
  }

  /**
   * Genera una clave única para un manga/capítulo específico
   * @private
   */
  _generateKey(mangaId, chapterId) {
    return `${mangaId}_${chapterId}`;
  }

  /**
   * Obtiene todos los progresos guardados desde localStorage
   * @private
   * @returns {Object} Objeto con todos los progresos guardados
   */
  _getAllProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error parsing reading progress from localStorage:', error);
      // Si hay datos corruptos, limpiar y empezar de nuevo
      localStorage.removeItem(this.STORAGE_KEY);
      return {};
    }
  }

  /**
   * Guarda todos los progresos en localStorage
   * @private
   * @param {Object} progressData - Objeto con todos los progresos
   */
  _saveAllProgress(progressData) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progressData));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, cleaning old entries...');
        // Eliminar las 10 entradas más antiguas
        this._removeOldestEntries(progressData, 10);
        // Reintentar
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progressData));
        } catch (retryError) {
          console.error('Failed to save reading progress after cleanup:', retryError);
        }
      } else {
        console.error('Error saving reading progress to localStorage:', error);
      }
    }
  }

  /**
   * Elimina las N entradas más antiguas del objeto de progreso
   * @private
   */
  _removeOldestEntries(progressData, count) {
    const entries = Object.entries(progressData);
    // Ordenar por timestamp (más antiguo primero)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Eliminar las N más antiguas
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      delete progressData[entries[i][0]];
    }
  }

  /**
   * Verifica si un progreso ha expirado (más de 30 días)
   * @private
   */
  _isExpired(timestamp) {
    const now = Date.now();
    const expiryTime = this.EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 30 días en ms
    return (now - timestamp) > expiryTime;
  }

  /**
   * Valida que los datos del progreso sean válidos
   * @private
   */
  _isValidProgress(progress) {
    return (
      progress &&
      typeof progress.mangaId === 'string' &&
      typeof progress.chapterId === 'string' &&
      typeof progress.currentPage === 'number' &&
      typeof progress.totalPages === 'number' &&
      typeof progress.timestamp === 'number' &&
      progress.currentPage >= 0 &&
      progress.currentPage < progress.totalPages &&
      progress.totalPages > 0
    );
  }

  /**
   * Guarda el progreso de lectura actual
   * @param {string} mangaId - ID del manga
   * @param {string} chapterId - ID del capítulo
   * @param {number} currentPage - Página actual (0-indexed)
   * @param {number} totalPages - Total de páginas del capítulo
   */
  saveProgress(mangaId, chapterId, currentPage, totalPages) {
    // Validar parámetros
    if (!mangaId || !chapterId || typeof currentPage !== 'number' || typeof totalPages !== 'number') {
      console.warn('Invalid parameters for saveProgress');
      return;
    }

    if (currentPage < 0 || totalPages <= 0 || currentPage >= totalPages) {
      console.warn('Invalid page numbers for saveProgress');
      return;
    }

    try {
      const allProgress = this._getAllProgress();
      const key = this._generateKey(mangaId, chapterId);

      // Guardar el progreso
      allProgress[key] = {
        mangaId,
        chapterId,
        currentPage,
        totalPages,
        timestamp: Date.now()
      };

      // Aplicar límite de almacenamiento
      this.enforceStorageLimit(allProgress);

      // Guardar en localStorage
      this._saveAllProgress(allProgress);
    } catch (error) {
      console.error('Error in saveProgress:', error);
    }
  }

  /**
   * Obtiene el progreso guardado para un capítulo específico
   * @param {string} mangaId - ID del manga
   * @param {string} chapterId - ID del capítulo
   * @returns {Object|null} - {currentPage, totalPages, timestamp} o null
   */
  getProgress(mangaId, chapterId) {
    if (!mangaId || !chapterId) {
      return null;
    }

    try {
      const allProgress = this._getAllProgress();
      const key = this._generateKey(mangaId, chapterId);
      const progress = allProgress[key];

      // Verificar que el progreso existe y es válido
      if (!this._isValidProgress(progress)) {
        return null;
      }

      // Verificar que no ha expirado
      if (this._isExpired(progress.timestamp)) {
        // Eliminar progreso expirado
        this.clearProgress(mangaId, chapterId);
        return null;
      }

      return {
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        timestamp: progress.timestamp
      };
    } catch (error) {
      console.error('Error in getProgress:', error);
      return null;
    }
  }

  /**
   * Elimina el progreso de un capítulo específico
   * @param {string} mangaId - ID del manga
   * @param {string} chapterId - ID del capítulo
   */
  clearProgress(mangaId, chapterId) {
    if (!mangaId || !chapterId) {
      return;
    }

    try {
      const allProgress = this._getAllProgress();
      const key = this._generateKey(mangaId, chapterId);
      
      if (allProgress[key]) {
        delete allProgress[key];
        this._saveAllProgress(allProgress);
      }
    } catch (error) {
      console.error('Error in clearProgress:', error);
    }
  }

  /**
   * Limpia progresos expirados (más de 30 días)
   */
  cleanExpiredProgress() {
    try {
      const allProgress = this._getAllProgress();
      let hasChanges = false;

      for (const key in allProgress) {
        if (this._isExpired(allProgress[key].timestamp)) {
          delete allProgress[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        this._saveAllProgress(allProgress);
      }
    } catch (error) {
      console.error('Error in cleanExpiredProgress:', error);
    }
  }

  /**
   * Limpia progresos antiguos si se excede el límite de 50 entradas
   * @param {Object} progressData - Objeto de progreso (opcional, usa el actual si no se proporciona)
   */
  enforceStorageLimit(progressData = null) {
    try {
      const allProgress = progressData || this._getAllProgress();
      const entries = Object.entries(allProgress);

      if (entries.length > this.MAX_ENTRIES) {
        // Ordenar por timestamp (más antiguo primero)
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Calcular cuántas entradas eliminar
        const toRemove = entries.length - this.MAX_ENTRIES;
        
        // Eliminar las más antiguas
        for (let i = 0; i < toRemove; i++) {
          delete allProgress[entries[i][0]];
        }

        // Solo guardar si no se proporcionó progressData (evitar doble guardado)
        if (!progressData) {
          this._saveAllProgress(allProgress);
        }
      }
    } catch (error) {
      console.error('Error in enforceStorageLimit:', error);
    }
  }

  /**
   * Obtiene el número total de progresos guardados
   * @returns {number}
   */
  getProgressCount() {
    try {
      const allProgress = this._getAllProgress();
      return Object.keys(allProgress).length;
    } catch (error) {
      console.error('Error in getProgressCount:', error);
      return 0;
    }
  }

  /**
   * Limpia todos los progresos guardados (útil para testing o reset)
   */
  clearAllProgress() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error in clearAllProgress:', error);
    }
  }
}

// Exportar instancia singleton
export const readingProgressService = new ReadingProgressService();
