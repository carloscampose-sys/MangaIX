/**
 * Gestor Fuse.js para Ikigai con carga progresiva en segundo plano
 * Implementa cancelación, progreso dinámico y búsqueda híbrida
 */

class IkigaiFuseManager {
  constructor() {
    this.series = [];
    this.fuse = null;
    this.isLoading = false;
    this.isCancelled = false;
    this.loadedPages = 0;
    this.totalPages = 199;
    this.onProgress = null;
    this.storageManager = null;
  }

  async init(storageManager) {
    this.storageManager = storageManager;
    
    const cachedSeries = await this.storageManager.loadSeries();
    
    if (cachedSeries && cachedSeries.length > 0) {
      this.series = cachedSeries;
      this.loadedPages = this.totalPages;
      this.initFuse();
      console.log(`[IkigaiFuse] Cargado desde cache: ${cachedSeries.length} series`);
      return true;
    }
    
    return false;
  }

  initFuse() {
    this.fuse = new Fuse(this.series, {
      keys: ['name'],
      threshold: 0.6,
      ignoreLocation: true,
      minMatchCharLength: 2,
      shouldSort: true,
      includeScore: true
    });
  }

  async startBackgroundLoad(onProgress, onComplete) {
    if (this.isLoading) {
      console.warn('[IkigaiFuse] Ya se está cargando');
      return;
    }
    
    this.isLoading = true;
    this.isCancelled = false;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.series = [];
    this.loadedPages = 0;
    
    console.log('[IkigaiFuse] Iniciando carga progresiva...');
    
    const startTime = Date.now();
    
    while (!this.isCancelled && this.loadedPages < this.totalPages) {
      const chunkSize = this.loadedPages === 0 ? 3 :5;
      
      try {
        const response = await fetch(`/api/ikigai/load-series-progressive?chunk=${chunkSize}&startPage=${this.loadedPages + 1}`);
        const data = await response.json();
        
        if (this.isCancelled) break;
        
        this.series.push(...data.series);
        this.loadedPages = data.loaded;
        
        this.initFuse();
        
        if (this.loadedPages % 50 === 0) {
          await this.storageManager.savePartialProgress({
            series: this.series,
            loadedPages: this.loadedPages
          });
        }
        
        if (this.onProgress) {
          const timeElapsed = (Date.now() - startTime) / 1000;
          const pagesPerSecond = this.loadedPages / timeElapsed;
          const pagesRemaining = this.totalPages - this.loadedPages;
          const estimatedTimeRemaining = Math.ceil(pagesRemaining / pagesPerSecond);
          
          this.onProgress({
            loaded: this.loadedPages,
            total: this.totalPages,
            percent: data.percent,
            seriesCount: this.series.length,
            estimatedTimeRemaining: estimatedTimeRemaining,
            isComplete: data.isComplete
          });
        }
        
        await new Promise(r => setTimeout(r, 200));
        
      } catch (error) {
        console.error('[IkigaiFuse] Error cargando chunk:', error);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
    }
    
    this.isLoading = false;
    
    if (!this.isCancelled) {
      await this.storageManager.saveSeries(this.series);
      await this.storageManager.clearPartialProgress();
      console.log(`[IkigaiFuse] Carga completada: ${this.series.length} series`);
      
      if (this.onComplete) {
        this.onComplete({
          seriesLoaded: true,
          seriesCount: this.series.length
        });
      }
    } else {
      console.log('[IkigaiFuse] Carga cancelada por el usuario');
    }
  }
    
    this.isLoading = true;
    this.isCancelled = false;
    this.onProgress = onProgress;
    this.series = [];
    this.loadedPages = 0;
    
    console.log('[IkigaiFuse] Iniciando carga progresiva...');
    
    const startTime = Date.now();
    
    while (!this.isCancelled && this.loadedPages < this.totalPages) {
      const chunkSize = this.loadedPages === 0 ? 3 : 5;
      
      try {
        const response = await fetch(`/api/ikigai/load-series-progressive?chunk=${chunkSize}&startPage=${this.loadedPages + 1}`);
        const data = await response.json();
        
        if (this.isCancelled) break;
        
        this.series.push(...data.series);
        this.loadedPages = data.loaded;
        
        this.initFuse();
        
        if (this.loadedPages % 50 === 0) {
          await this.storageManager.savePartialProgress({
            series: this.series,
            loadedPages: this.loadedPages
          });
        }
        
        if (this.onProgress) {
          const timeElapsed = (Date.now() - startTime) / 1000;
          const pagesPerSecond = this.loadedPages / timeElapsed;
          const pagesRemaining = this.totalPages - this.loadedPages;
          const estimatedTimeRemaining = Math.ceil(pagesRemaining / pagesPerSecond);
          
          this.onProgress({
            loaded: this.loadedPages,
            total: this.totalPages,
            percent: data.percent,
            seriesCount: this.series.length,
            estimatedTimeRemaining: estimatedTimeRemaining,
            isComplete: data.isComplete
          });
        }
        
        await new Promise(r => setTimeout(r, 200));
        
      } catch (error) {
        console.error('[IkigaiFuse] Error cargando chunk:', error);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
    }
    
    this.isLoading = false;
    
    if (!this.isCancelled) {
      await this.storageManager.saveSeries(this.series);
      await this.storageManager.clearPartialProgress();
      console.log(`[IkigaiFuse] Carga completada: ${this.series.length} series`);
    } else {
      console.log('[IkigaiFuse] Carga cancelada por el usuario');
    }
  }

  cancel() {
    console.log('[IkigaiFuse] Cancelando carga...');
    this.isCancelled = true;
    this.isLoading = false;
  }

  search(query, filters) {
    if (query && query.trim() && !this.isComplete()) {
      return {
        type: 'search_not_available',
        message: 'Las series de Ikigai se están cargando. Mientras tanto, usa filtros de género.',
        isLoading: this.isLoading,
        percent: this.getPercent()
      };
    }
    
    if (query && query.trim() && this.isComplete()) {
      const results = this.fuse.search(query).map(r => ({
        id: `ikigai-${r.item.slug}`,
        slug: r.item.slug,
        title: r.item.name,
        cover: r.item.cover,
        source: 'ikigai',
        type: r.item.type,
        status: r.item.status?.name || 'En Curso',
        chapterCount: r.item.chapter_count,
        genres: (r.item.genres || []).map(g => g.name),
        score: r.score
      }));
      
      return {
        type: 'search_results',
        results,
        total: results.length
      };
    }
    
    if (!query || !query.trim()) {
      return {
        type: 'filters_search',
        message: 'Usa la API de filtros'
      };
    }
  }

  async searchWithFilters(filters, page = 1) {
    try {
      const genreValues = filters.genres || [];
      
      let apiUrl = `https://panel.ikigaimangas.com/api/swf/series?page=${page}&nsfw=true`;
      genreValues.forEach(genreId => {
        apiUrl += `&genres=${genreId}`;
      });
      
      if (filters.types && filters.types.length > 0) {
        apiUrl += `&type=${filters.types[0]}`;
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        apiUrl += `&status=${filters.statuses[0]}`;
      }
      
      if (filters.sortBy) {
        apiUrl += `&order_by=${filters.sortBy}`;
      }
      
      console.log('[IkigaiFuse] API filtros URL:', apiUrl);
      
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      
      let response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        console.log('[IkigaiFuse] corsproxy falló, intentando thingproxy...');
        const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(apiUrl)}`;
        response = await fetch(thingProxyUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      }
      
      if (!response.ok) {
        console.log('[IkigaiFuse] thingproxy falló, intentando allorigins...');
        const alloriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        response = await fetch(alloriginsUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      }
      
      if (!response.ok) {
        throw new Error('Todos los proxies fallaron');
      }
      
      const data = await response.json();
      
      const results = (data.data || []).map(serie => ({
        id: `ikigai-${serie.slug}-${serie.id}`,
        slug: serie.slug,
        title: serie.name,
        cover: serie.cover || '',
        source: 'ikigai',
        type: serie.type,
        status: serie.status?.name || 'En Curso',
        chapterCount: serie.chapter_count,
        genres: (serie.genres || []).map(g => g.name)
      }));
      
      console.log(`[IkigaiFuse] ${results.length} resultados de filtros`);
      
      return {
        results,
        page: data.current_page,
        totalPages: data.last_page,
        total: data.total,
        hasMore: data.current_page < data.last_page
      };
      
    } catch (error) {
      console.error('[IkigaiFuse] Error en búsqueda con filtros:', error);
      return {
        results: [],
        page: 1,
        totalPages: 1,
        total: 0,
        hasMore: false,
        error: error.message
      };
    }
  }

  isComplete() {
    return this.loadedPages >= this.totalPages;
  }

  getPercent() {
    return (this.loadedPages / this.totalPages) * 100;
  }

  getSeriesCount() {
    return this.series.length;
  }

  getLoadedPages() {
    return this.loadedPages;
  }
}

const ikigaiFuseManager = new IkigaiFuseManager();
export default ikigaiFuseManager;
