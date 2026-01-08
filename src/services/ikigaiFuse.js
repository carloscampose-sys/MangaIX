/**
 * Gestor Fuse.js para Ikigai con carga progresiva en segundo plano
 * Implementa cancelación, progreso dinámico y búsqueda híbrida
 */

import Fuse from 'fuse.js';

class IkigaiFuseManager {
  constructor() {
    this.series = [];
    this.fuse = null;
    this.isLoading = false;
    this.isCancelled = false;
    this.loadedPages = 0;
    this.totalPages = 338;
    this.totalSeries = null;
    this.onProgress = null;
    this.storageManager = null;
    this.loadedSeriesCount = 0;
  }

  normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async init(storageManager) {
    this.storageManager = storageManager;
    
    console.log('[IkigaiFuse] Inicializando - Carga desde API (sin cache persistente)');
    
    this.series = [];
    this.loadedPages = 0;
    this.loadedSeriesCount = 0;
    this.fuse = null;
    
    console.log('[IkigaiFuse] ❌ init() RETORNANDO: false (siempre carga desde API)');
    return false;
  }

  initFuse() {
    console.log('[IkigaiFuse] Configuración de Fuse.js:');
    console.log(`  Total series: ${this.series.length}`);
    if (this.series[0]) {
      console.log(`  Primera serie:`, {
        name: this.series[0].name,
        nameNormalized: this.series[0].nameNormalized,
        slug: this.series[0].slug,
        slugNormalized: this.series[0].slugNormalized
      });
    }
    
    this.fuse = new Fuse(this.series, {
      keys: [
        { name: 'nameNormalized', weight: 1.0 },
        { name: 'slugNormalized', weight: 0.8 },
        { name: 'summaryNormalized', weight: 0.5 },
        { name: 'synopsisNormalized', weight: 0.5 }
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 1,
      shouldSort: true,
      includeScore: true,
      includeMatches: true,
      findAllMatches: true,
      useExtendedSearch: false
    });
    
    console.log('[IkigaiFuse] Fuse.js inicializado correctamente');
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
    this.loadedSeriesCount = 0;
    
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
        this.loadedSeriesCount += data.series.length;
        
        if (data.totalSeries && !this.totalSeries) {
          this.totalSeries = data.totalSeries;
          console.log(`[IkigaiFuse] Total series establecido: ${this.totalSeries}`);
        }
        
        this.series = this.series.map(s => ({
          ...s,
          nameNormalized: this.normalizeText(s.name),
          slugNormalized: this.normalizeText(s.slug),
          summaryNormalized: this.normalizeText(s.summary || ''),
          synopsisNormalized: this.normalizeText(s.synopsis || '')
        }));
        
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
            percent: this.getPercent(),
            seriesCount: this.series.length,
            totalSeries: this.totalSeries,
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
      const withoutNormalized = this.series.filter(s => !s.nameNormalized);
      if (withoutNormalized.length > 0) {
        console.warn(`[IkigaiFuse] ⚠️ ${withoutNormalized.length} series sin campos normalizados`);
      }
      
      await this.storageManager.saveSeries(this.series);
      await this.storageManager.clearPartialProgress();
      
      await this.storageManager.saveCacheMetadata({
        totalSeries: this.series.length,
        lastUpdated: Date.now(),
        totalPages: this.totalPages
      });
      
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

  cancel() {
    console.log('[IkigaiFuse] Cancelando carga...');
    this.isCancelled = true;
    this.isLoading = false;
  }

  search(query, filters) {
    console.log('[IkigaiFuse] Búsqueda iniciada');
    console.log('[IkigaiFuse] Query:', query);
    console.log('[IkigaiFuse] Query normalizada:', this.normalizeText(query));
    console.log('[IkigaiFuse] Total series cargadas:', this.series.length);
    console.log('[IkigaiFuse] isComplete:', this.isComplete());
    
    if (query && query.trim() && !this.isComplete()) {
      return {
        type: 'search_not_available',
        message: 'Las series de Ikigai se están cargando. Mientras tanto, usa filtros de género.',
        isLoading: this.isLoading,
        percent: this.getPercent()
      };
    }
    
    if (query && query.trim() && this.isComplete()) {
      const normalizedQuery = this.normalizeText(query);
      console.log('[IkigaiFuse] Ejutando Fuse.search con query:', normalizedQuery);
      
      const jinxBySlug = this.series.find(s => 
        s.slugNormalized === 'jinx-manhwa' || s.slugNormalized?.includes('jinx')
      );
      if (jinxBySlug) {
        console.log('[IkigaiFuse] 🔍 SERIE "JINX" ENCONTRADA POR SLUG:');
        console.log(`  Nombre: "${jinxBySlug.name}"`);
        console.log(`  Slug: "${jinxBySlug.slug}"`);
        console.log(`  nameNormalized: "${jinxBySlug.nameNormalized}"`);
        console.log(`  slugNormalized: "${jinxBySlug.slugNormalized}"`);
        console.log(`  ¿Contiene "jinx" en nameNormalized?: ${jinxBySlug.nameNormalized?.includes('jinx')}`);
        console.log(`  ¿Contiene "jinx" en slugNormalized?: ${jinxBySlug.slugNormalized?.includes('jinx')}`);
      } else {
        console.log('[IkigaiFuse] ❌ NO se encontró ninguna serie con slug que contenga "jinx"');
      }
      
      const allWithJinx = this.series.filter(s => 
        (s.nameNormalized?.includes('jinx') || s.slugNormalized?.includes('jinx'))
      );
      console.log(`[IkigaiFuse] 📊 Total de series que contienen "jinx": ${allWithJinx.length}`);
      if (allWithJinx.length > 0) {
        console.log('[IkigaiFuse] Series con "jinx":');
        allWithJinx.slice(0, 10).forEach((s, i) => {
          console.log(`  ${i+1}. "${s.name}" (slug: "${s.slug}") → Normalizado: "${s.nameNormalized}"`);
        });
      }
      
      const fuseResults = this.fuse.search(normalizedQuery);
      console.log('[IkigaiFuse] Fuse.results.length:', fuseResults.length);
      
      if (filters.exactMatch) {
        console.log('[IkigaiFuse] 🔒 Modo coincidencia exacta activado');
        const exactResults = fuseResults.filter(r => {
          const nameMatch = r.item.nameNormalized === normalizedQuery;
          const slugMatch = r.item.slugNormalized === normalizedQuery;
          return nameMatch || slugMatch;
        });
        
        console.log(`[IkigaiFuse] ${exactResults.length} resultados exactos de ${fuseResults.length} totales`);
        
        if (exactResults.length > 0) {
          const results = exactResults.map(r => ({
            id: `ikigai-${r.item.slug}`,
            slug: r.item.slug,
            title: r.item.name,
            cover: r.item.cover,
            source: 'ikigai',
            type: r.item.type,
            status: r.item.status?.name || 'En Curso',
            chapterCount: r.item.chapter_count,
            genres: (r.item.genres || []).map(g => g.name),
            score: r.score,
            description: r.item.summary || r.item.synopsis || '',
            author: r.item.team?.name || ''
          }));
          
          return {
            type: 'search_results',
            results,
            total: results.length
          };
        } else {
          return {
            type: 'search_results',
            results: [],
            total: 0
          };
        }
      }
      
      fuseResults.sort((a, b) => {
        const aNameStart = a.item.nameNormalized.startsWith(normalizedQuery) ? 0 : 1;
        const bNameStart = b.item.nameNormalized.startsWith(normalizedQuery) ? 0 : 1;
        
        if (aNameStart !== bNameStart) {
          return aNameStart - bNameStart;
        }
        
        return a.score - b.score;
      });
      
      if (fuseResults.length > 0) {
        console.log('[IkigaiFuse] Primeros 5 resultados (ordenados):');
        fuseResults.slice(0, 5).forEach((r, i) => {
          const startsWith = r.item.nameNormalized.startsWith(normalizedQuery) ? '✅' : '  ';
          console.log(`  ${startsWith} ${i+1}. ${r.item.name} (score: ${r.score.toFixed(4)})`);
          if (r.matches) {
            console.log(`     Matches:`, r.matches);
          }
        });
      } else {
        console.log('[IkigaiFuse] Búsqueda difusa sin resultados, intentando búsqueda directa...');
        
        const directResults = this.series.filter(s => {
          const nameMatch = s.nameNormalized && s.nameNormalized.includes(normalizedQuery);
          const slugMatch = s.slugNormalized && s.slugNormalized.includes(normalizedQuery);
          return nameMatch || slugMatch;
        });
        
        console.log(`[IkigaiFuse] Búsqueda directa encontró ${directResults.length} resultados`);
        
        if (directResults.length > 0) {
          console.log('[IkigaiFuse] Primeros 5 resultados directos:');
          directResults.slice(0, 5).forEach((s, i) => {
            console.log(`  ${i+1}. ${s.name}`);
          });
        }
        
        const results = directResults.map(r => ({
          id: `ikigai-${r.slug}`,
          slug: r.slug,
          title: r.name,
          cover: r.cover,
          source: 'ikigai',
          type: r.type,
          status: r.status?.name || 'En Curso',
          chapterCount: r.chapter_count,
          genres: (r.genres || []).map(g => g.name),
          score: 0,
          description: r.summary || r.synopsis || '',
          author: r.team?.name || ''
        }));
        
        return {
          type: 'search_results',
          results,
          total: results.length
        };
      }
      
      const results = fuseResults.map(r => ({
        id: `ikigai-${r.item.slug}`,
        slug: r.item.slug,
        title: r.item.name,
        cover: r.item.cover,
        source: 'ikigai',
        type: r.item.type,
        status: r.item.status?.name || 'En Curso',
        chapterCount: r.item.chapter_count,
        genres: (r.item.genres || []).map(g => g.name),
        score: r.score,
        description: r.item.summary || r.item.synopsis || '',
        author: r.item.team?.name || ''
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
    if (this.totalSeries && this.series.length > 0) {
      return (this.series.length / this.totalSeries) * 100;
    }
    return (this.loadedPages / this.totalPages) * 100;
  }

  getSeriesCount() {
    return this.series.length;
  }

  getLoadedPages() {
    return this.loadedPages;
  }

  validateCacheIntegrity(series) {
    const errors = [];
    
    if (!Array.isArray(series)) {
      errors.push('Cache no es un array');
      return { isValid: false, errors };
    }
    
    if (series.length === 0) {
      errors.push('Cache vacío');
      return { isValid: false, errors };
    }
    
    const sampleSize = Math.min(100, series.length);
    let missingFields = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const item = series[i];
      if (!item.name || !item.slug) {
        missingFields++;
      }
    }
    
    if (missingFields > sampleSize * 0.1) {
      errors.push(`Más del 10% de series tienen campos faltantes (${missingFields}/${sampleSize})`);
    }
    
    const slugs = new Set();
    let duplicates = 0;
    for (const item of series) {
      if (item.slug) {
        if (slugs.has(item.slug)) {
          duplicates++;
        } else {
          slugs.add(item.slug);
        }
      }
    }
    
    if (duplicates > 0) {
      errors.push(`Se encontraron ${duplicates} series duplicadas por slug`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      stats: {
        total: series.length,
        uniqueSlugs: slugs.size,
        duplicates,
        missingFields
      }
    };
  }
}

const ikigaiFuseManager = new IkigaiFuseManager();
export default ikigaiFuseManager;
