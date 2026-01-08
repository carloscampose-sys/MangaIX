/**
 * Gestor de almacenamiento: localStorage + IndexedDB (fallback)
 * Automáticamente usa IndexedDB si localStorage está lleno
 */

class StorageManager {
  constructor() {
    this.storageType = 'none';
    this.db = null;
  }

  async init() {
    try {
      const testData = { test: true, timestamp: Date.now() };
      localStorage.setItem('ikigai-test', JSON.stringify(testData));
      localStorage.removeItem('ikigai-test');
      
      this.storageType = 'localStorage';
      console.log('[StorageManager] Usando localStorage');
      return 'localStorage';
    } catch (error) {
      console.warn('[StorageManager] localStorage lleno, usando IndexedDB');
      return this.initIndexedDB();
    }
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MangaIX-Ikigai', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('series')) {
          db.createObjectStore('series', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.storageType = 'indexedDB';
        console.log('[StorageManager] IndexedDB inicializado');
        resolve('indexedDB');
      };
      
      request.onerror = (error) => {
        console.error('[StorageManager] Error inicializando IndexedDB:', error);
        reject(error);
      };
    });
  }

  async saveSeries(series) {
    if (this.storageType === 'localStorage') {
      try {
        localStorage.setItem('ikigai-series', JSON.stringify(series));
        console.log(`[StorageManager] ${series.length} series guardadas en localStorage`);
        return true;
      } catch (error) {
        console.warn('[StorageManager] localStorage lleno, migrando a IndexedDB...', error);
        await this.initIndexedDB();
        return this.saveSeriesToIndexedDB(series);
      }
    } else {
      return this.saveSeriesToIndexedDB(series);
    }
  }

  async saveSeriesToIndexedDB(series) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB no inicializado'));
        return;
      }

      const transaction = this.db.transaction(['series'], 'readwrite');
      const store = transaction.objectStore('series');
      
      store.clear();
      
      series.forEach(serie => {
        store.add(serie);
      });
      
      transaction.oncomplete = () => {
        console.log(`[StorageManager] ${series.length} series guardadas en IndexedDB`);
        resolve(true);
      };
      
      transaction.onerror = (error) => {
        console.error('[StorageManager] Error guardando en IndexedDB:', error);
        reject(error);
      };
    });
  }

  async loadSeries() {
    console.log('[StorageManager] Tipo de almacenamiento:', this.storageType);
    
    if (this.storageType === 'localStorage') {
      const data = localStorage.getItem('ikigai-series');
      if (data) {
        console.log(`[StorageManager] ${JSON.parse(data).length} series cargadas desde localStorage`);
        return JSON.parse(data);
      }
      return null;
    } else {
      return this.loadSeriesFromIndexedDB();
    }
  }

  async loadSeriesFromIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB no inicializado'));
        return;
      }

      const transaction = this.db.transaction(['series'], 'readonly');
      const store = transaction.objectStore('series');
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log(`[StorageManager] ${request.result.length} series cargadas desde IndexedDB`);
        resolve(request.result);
      };
      
      request.onerror = (error) => {
        console.error('[StorageManager] Error cargando desde IndexedDB:', error);
        reject(error);
      };
    });
  }

  async savePartialProgress(progress) {
    const partialData = {
      series: progress.series,
      loadedPages: progress.loadedPages,
      timestamp: Date.now()
    };

    if (this.storageType === 'localStorage') {
      try {
        localStorage.setItem('ikigai-partial', JSON.stringify(partialData));
        console.log('[StorageManager] Progreso parcial guardado en localStorage');
        return true;
      } catch (error) {
        console.warn('[StorageManager] No se pudo guardar progreso parcial en localStorage');
        return false;
      }
    } else {
      return this.savePartialProgressToIndexedDB(partialData);
    }
  }

  async savePartialProgressToIndexedDB(partialData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB no inicializado'));
        return;
      }

      const transaction = this.db.transaction(['series'], 'readwrite');
      const store = transaction.objectStore('series');
      
      const seriesStore = transaction.objectStore('series');
      seriesStore.clear();
      
      partialData.series.forEach(serie => {
        store.add(serie);
      });
      
      transaction.oncomplete = () => {
        console.log('[StorageManager] Progreso parcial guardado en IndexedDB');
        resolve(true);
      };
      
      transaction.onerror = (error) => {
        console.error('[StorageManager] Error guardando progreso parcial:', error);
        reject(error);
      };
    });
  }

  async loadPartialProgress() {
    if (this.storageType === 'localStorage') {
      const data = localStorage.getItem('ikigai-partial');
      if (data) {
        console.log('[StorageManager] Progreso parcial cargado desde localStorage');
        return JSON.parse(data);
      }
      return null;
    } else {
      return null;
    }
  }

  async clearPartialProgress() {
    if (this.storageType === 'localStorage') {
      localStorage.removeItem('ikigai-partial');
      console.log('[StorageManager] Progreso parcial eliminado de localStorage');
    }
  }

  async clearSeries() {
    if (this.storageType === 'localStorage') {
      localStorage.removeItem('ikigai-series');
      console.log('[StorageManager] Series eliminadas de localStorage');
    } else if (this.storageType === 'indexedDB' && this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['series'], 'readwrite');
        const store = transaction.objectStore('series');
        store.clear();
        
        transaction.oncomplete = () => {
          console.log('[StorageManager] Series eliminadas de IndexedDB');
          resolve(true);
        };
        
        transaction.onerror = (error) => {
          console.error('[StorageManager] Error eliminando series de IndexedDB:', error);
          reject(error);
        };
      });
    }
  }

  getStorageType() {
    return this.storageType;
  }

  async saveCacheMetadata(metadata) {
    try {
      const metadataStr = JSON.stringify(metadata);
      if (this.storageType === 'localStorage') {
        localStorage.setItem('ikigai-cache-metadata', metadataStr);
        console.log('[StorageManager] Metadata guardada en localStorage');
      } else {
        localStorage.setItem('ikigai-cache-metadata', metadataStr);
        console.log('[StorageManager] Metadata guardada en localStorage (para IndexedDB)');
      }
      return true;
    } catch (error) {
      console.warn('[StorageManager] Error guardando metadata:', error);
      return false;
    }
  }

  async loadCacheMetadata() {
    try {
      console.log('[StorageManager] Intentando cargar metadata del cache...');
      const metadataStr = localStorage.getItem('ikigai-cache-metadata');
      
      if (!metadataStr) {
        console.log('[StorageManager] ⚠️ No se encontró metadata en localStorage');
        return null;
      }
      
      console.log('[StorageManager] Metadata encontrada, parseando...');
      const metadata = JSON.parse(metadataStr);
      
      console.log('[StorageManager] Metadata parseada exitosamente:');
      console.log('  totalSeries:', metadata.totalSeries);
      console.log('  lastUpdated:', new Date(metadata.lastUpdated).toISOString());
      console.log('  totalPages:', metadata.totalPages);
      
      const age = Date.now() - metadata.lastUpdated;
      const daysOld = Math.floor(age / (24 * 60 * 60 * 1000));
      console.log('[StorageManager] Edad de metadata:', daysOld, 'días');
      
      return metadata;
    } catch (error) {
      console.error('[StorageManager] ❌ Error cargando metadata:', error);
      return null;
    }
  }

  async clearCacheMetadata() {
    try {
      localStorage.removeItem('ikigai-cache-metadata');
      console.log('[StorageManager] Metadata eliminada');
      return true;
    } catch (error) {
      console.warn('[StorageManager] Error eliminando metadata:', error);
      return false;
    }
  }
}

const storageManager = new StorageManager();
export default storageManager;
