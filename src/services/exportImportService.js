/**
 * ExportImportService
 * 
 * Servicio para exportar e importar todos los datos del usuario desde localStorage.
 * Permite transferir progreso, configuración y personalización entre dispositivos.
 */

const EXPORT_VERSION = '1.0.0';
const APP_NAME = 'Potaxie Sanctuary';

// Claves de localStorage que se exportarán/importarán
const STORAGE_KEYS = {
  // Biblioteca y progreso
  library: 'library',
  devouredChapters: 'devouredChapters',
  notes: 'notes',
  translations: 'translations',
  
  // Progreso de lectura
  readingProgress: 'reading_progress',
  
  // Configuración visual
  colorTheme: 'colorTheme', // Tema de color personalizado
  customBackgroundImage: 'customBackgroundImage', // Imagen de fondo personalizada
  backgroundEffects: 'backgroundEffects', // Efectos del fondo
  darkMode: 'theme', // Modo claro/oscuro
  christmasMode: 'christmasMode', // Modo navideño
  
  // Configuración de fuentes
  sourceOrder: 'source_order',
  
  // Datos de usuario
  userName: 'userName',
  userGender: 'userGender'
};

class ExportImportService {
  /**
   * Exporta todos los datos del usuario
   * @returns {Object} Objeto con todos los datos exportados
   */
  exportAllData() {
    try {
      const data = {
        library: this._getStorageItem(STORAGE_KEYS.library, []),
        devouredChapters: parseInt(this._getStorageItem(STORAGE_KEYS.devouredChapters, '0')),
        notes: this._getStorageItem(STORAGE_KEYS.notes, {}),
        translations: this._getStorageItem(STORAGE_KEYS.translations, {})
      };

      const readingProgress = this._getStorageItem(STORAGE_KEYS.readingProgress, {});

      const theme = {
        colorTheme: this._getStorageItem(STORAGE_KEYS.colorTheme, null),
        customBackgroundImage: this._getStorageItem(STORAGE_KEYS.customBackgroundImage, null),
        backgroundEffects: this._getStorageItem(STORAGE_KEYS.backgroundEffects, null),
        theme: this._getStorageItem(STORAGE_KEYS.darkMode, 'light'),
        christmasMode: this._getStorageItem(STORAGE_KEYS.christmasMode, 'false')
      };

      const sources = {
        source_order: this._getStorageItem(STORAGE_KEYS.sourceOrder, null)
      };

      const user = {
        userName: this._getStorageItem(STORAGE_KEYS.userName, null),
        userGender: this._getStorageItem(STORAGE_KEYS.userGender, null)
      };

      // Calcular metadata
      const metadata = this._calculateMetadata(data);

      const exportData = {
        version: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        appName: APP_NAME,
        data: {
          library: data,
          readingProgress,
          theme,
          sources,
          user
        },
        metadata
      };

      console.log('[ExportImportService] Data exported successfully:', metadata);
      return exportData;
    } catch (error) {
      console.error('[ExportImportService] Error exporting data:', error);
      throw new Error('Error al exportar los datos: ' + error.message);
    }
  }

  /**
   * Importa datos del usuario
   * @param {Object} importData - Datos a importar
   * @param {string} mode - Modo de importación: 'replace' o 'merge'
   * @returns {boolean} True si la importación fue exitosa
   */
  importAllData(importData, mode = 'replace') {
    try {
      // Validar datos
      const validation = this.validateImportData(importData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Crear backup automático antes de importar
      const backup = this.exportAllData();
      this._saveBackupToStorage(backup);

      // Importar según el modo
      if (mode === 'replace') {
        this._replaceAllData(importData.data);
      } else if (mode === 'merge') {
        this._mergeAllData(importData.data);
      }

      console.log('[ExportImportService] Data imported successfully');
      return true;
    } catch (error) {
      console.error('[ExportImportService] Error importing data:', error);
      throw new Error('Error al importar los datos: ' + error.message);
    }
  }

  /**
   * Valida los datos de importación
   * @param {Object} importData - Datos a validar
   * @returns {Object} {valid: boolean, error: string}
   */
  validateImportData(importData) {
    try {
      // Verificar que sea un objeto
      if (!importData || typeof importData !== 'object') {
        return { valid: false, error: 'El archivo no contiene datos válidos' };
      }

      // Verificar versión
      if (!importData.version) {
        return { valid: false, error: 'El archivo no tiene información de versión' };
      }

      // Verificar que sea de Potaxie
      if (importData.appName !== APP_NAME) {
        return { valid: false, error: 'Este archivo no es de Potaxie Sanctuary' };
      }

      // Verificar estructura de datos
      if (!importData.data || typeof importData.data !== 'object') {
        return { valid: false, error: 'El archivo no contiene datos válidos' };
      }

      // Verificar secciones principales
      const requiredSections = ['library', 'readingProgress', 'theme', 'sources', 'user'];
      for (const section of requiredSections) {
        if (!importData.data[section]) {
          return { valid: false, error: `Falta la sección: ${section}` };
        }
      }

      // Validar biblioteca
      if (!Array.isArray(importData.data.library.library)) {
        return { valid: false, error: 'Los datos de biblioteca son inválidos' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Error al validar el archivo: ' + error.message };
    }
  }

  /**
   * Descarga los datos como archivo JSON
   * @param {Object} data - Datos a descargar
   */
  downloadBackup(data) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `potaxie-backup-${date}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[ExportImportService] Backup downloaded:', filename);
    } catch (error) {
      console.error('[ExportImportService] Error downloading backup:', error);
      throw new Error('Error al descargar el backup: ' + error.message);
    }
  }

  /**
   * Lee un archivo de backup
   * @param {File} file - Archivo a leer
   * @returns {Promise<Object>} Datos del archivo
   */
  async readBackupFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('El archivo no es un JSON válido'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Obtiene el tamaño de los datos en formato legible
   * @param {Object} data - Datos a medir
   * @returns {string} Tamaño formateado
   */
  getDataSize(data) {
    const jsonString = JSON.stringify(data);
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // ========== Métodos Privados ==========

  /**
   * Obtiene un item de localStorage con valor por defecto
   * @private
   */
  _getStorageItem(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // Intentar parsear como JSON
      try {
        return JSON.parse(item);
      } catch {
        // Si no es JSON, devolver como string
        return item;
      }
    } catch (error) {
      console.warn(`[ExportImportService] Error reading ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Calcula metadata de los datos
   * @private
   */
  _calculateMetadata(data) {
    const totalMangas = data.library?.length || 0;
    const totalChaptersRead = data.devouredChapters || 0;
    
    // Calcular nivel
    const LEVELS = [
      { min: 0, max: 50, title: "Semillita 🌱" },
      { min: 51, max: 150, title: "Potaxina en Entrenamiento 🥑" },
      { min: 151, max: 500, title: "Diva Devoradora ✨" },
      { min: 500, max: Infinity, title: "Potaxie Suprema de Jiafei 👑" }
    ];
    
    const level = LEVELS.find(l => 
      totalChaptersRead >= l.min && totalChaptersRead <= l.max
    )?.title || LEVELS[0].title;

    return {
      totalMangas,
      totalChaptersRead,
      level,
      dataSize: 'Calculando...'
    };
  }

  /**
   * Guarda un backup en localStorage
   * @private
   */
  _saveBackupToStorage(backup) {
    try {
      const backupKey = 'potaxie_last_backup';
      localStorage.setItem(backupKey, JSON.stringify(backup));
      console.log('[ExportImportService] Backup saved to localStorage');
    } catch (error) {
      console.warn('[ExportImportService] Could not save backup:', error);
    }
  }

  /**
   * Reemplaza todos los datos
   * @private
   */
  _replaceAllData(data) {
    // Biblioteca
    this._setStorageItem(STORAGE_KEYS.library, data.library.library);
    this._setStorageItem(STORAGE_KEYS.devouredChapters, data.library.devouredChapters.toString());
    this._setStorageItem(STORAGE_KEYS.notes, data.library.notes);
    this._setStorageItem(STORAGE_KEYS.translations, data.library.translations);

    // Progreso de lectura
    this._setStorageItem(STORAGE_KEYS.readingProgress, data.readingProgress);

    // Tema y personalización
    if (data.theme.colorTheme) {
      this._setStorageItem(STORAGE_KEYS.colorTheme, data.theme.colorTheme);
    }
    if (data.theme.customBackgroundImage) {
      this._setStorageItem(STORAGE_KEYS.customBackgroundImage, data.theme.customBackgroundImage);
    }
    if (data.theme.backgroundEffects) {
      this._setStorageItem(STORAGE_KEYS.backgroundEffects, data.theme.backgroundEffects);
    }
    this._setStorageItem(STORAGE_KEYS.darkMode, data.theme.theme);
    this._setStorageItem(STORAGE_KEYS.christmasMode, data.theme.christmasMode);

    // Fuentes
    if (data.sources.source_order) {
      this._setStorageItem(STORAGE_KEYS.sourceOrder, data.sources.source_order);
    }

    // Usuario
    if (data.user.userName) {
      this._setStorageItem(STORAGE_KEYS.userName, data.user.userName);
    }
    if (data.user.userGender) {
      this._setStorageItem(STORAGE_KEYS.userGender, data.user.userGender);
    }
  }

  /**
   * Fusiona datos con los existentes
   * @private
   */
  _mergeAllData(data) {
    // Fusionar biblioteca (sin duplicados)
    const currentLibrary = this._getStorageItem(STORAGE_KEYS.library, []);
    const importedLibrary = data.library.library;
    
    const mergedLibrary = [...currentLibrary];
    importedLibrary.forEach(manga => {
      if (!mergedLibrary.find(m => m.id === manga.id)) {
        mergedLibrary.push(manga);
      }
    });
    this._setStorageItem(STORAGE_KEYS.library, mergedLibrary);

    // Sumar capítulos devorados
    const currentChapters = parseInt(this._getStorageItem(STORAGE_KEYS.devouredChapters, '0'));
    const importedChapters = data.library.devouredChapters;
    this._setStorageItem(STORAGE_KEYS.devouredChapters, (currentChapters + importedChapters).toString());

    // Fusionar notas
    const currentNotes = this._getStorageItem(STORAGE_KEYS.notes, {});
    const mergedNotes = { ...currentNotes, ...data.library.notes };
    this._setStorageItem(STORAGE_KEYS.notes, mergedNotes);

    // Fusionar progreso de lectura
    const currentProgress = this._getStorageItem(STORAGE_KEYS.readingProgress, {});
    const mergedProgress = { ...currentProgress, ...data.readingProgress };
    this._setStorageItem(STORAGE_KEYS.readingProgress, mergedProgress);

    // Para tema y configuración, mantener los actuales (no fusionar)
    console.log('[ExportImportService] Data merged successfully');
  }

  /**
   * Guarda un item en localStorage
   * @private
   */
  _setStorageItem(key, value) {
    try {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`[ExportImportService] Error saving ${key}:`, error);
    }
  }
}

// Exportar instancia singleton
export const exportImportService = new ExportImportService();
