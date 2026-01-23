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

      console.log(`[ChapterHistory] Marked chapter ${chapter} as read for manga ${mangaId}`);
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
        console.log(`[ChapterHistory] Cleared history for manga ${mangaId}`);
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
      console.log('[ChapterHistory] Cleared all history');
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

  /**
   * Obtiene el timestamp de la última lectura de un manga
   * @param {string} mangaId - ID del manga
   * @returns {number} - Timestamp o 0 si no existe
   */
  getLastReadTimestamp(mangaId) {
    if (!mangaId) return 0;

    try {
      const history = this._getHistory();
      return history[mangaId]?.lastReadTimestamp || 0;
    } catch (error) {
      console.error('Error in getLastReadTimestamp:', error);
      return 0;
    }
  }

  /**
   * Limpia historiales expirados (más de 30 días sin actividad)
   */
  cleanExpiredHistory() {
    try {
      const history = this._getHistory();
      const now = Date.now();
      const expiryTime = this.EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      let hasChanges = false;

      for (const mangaId in history) {
        const manga = history[mangaId];
        if ((now - manga.lastReadTimestamp) > expiryTime) {
          delete history[mangaId];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        this._saveHistory(history);
        console.log('[ChapterHistory] Cleaned expired history');
      }
    } catch (error) {
      console.error('Error in cleanExpiredHistory:', error);
    }
  }
}

// Exportar instancia singleton
export const chapterHistoryService = new ChapterHistoryService();
