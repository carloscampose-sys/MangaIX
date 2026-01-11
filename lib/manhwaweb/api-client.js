import axios from 'axios';
import { CONFIG } from './config.js';

class ApiClient {
  constructor() {
    this.apiBase = CONFIG.API_BASE;
  }
  
  async search(params) {
    const cacheKey = `search:${params.tipo || ''}-${params.estado || ''}-${params.page || 1}`;
    
    try {
      const response = await axios.get(`${this.apiBase}/manhwa/library`, {
        params,
        timeout: 15000
      });
      
      return response.data;
    } catch (error) {
      console.error('[API Client] Error en búsqueda API, intentando fallback...');
      
      try {
        const fallbackResponse = await axios.get('/api/manhwaweb/search', {
          params,
          timeout: 60000
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        throw new Error(`API y fallback fallaron: ${fallbackError.message}`);
      }
    }
  }
  
  async getDetails(slug) {
    try {
      const response = await axios.get(`${this.apiBase}/manhwa/see/${slug}`, {
        timeout: 15000
      });
      
      return response.data;
    } catch (error) {
      console.error('[API Client] Error en detalles API, intentando fallback...');
      
      try {
        const fallbackResponse = await axios.get('/api/manhwaweb/details', {
          params: { slug },
          timeout: 60000
        });
        
        return fallbackResponse.data;
      } catch (fallbackError) {
        throw new Error(`API y fallback fallaron: ${fallbackError.message}`);
      }
    }
  }
  
  async getChapters(slug) {
    try {
      const response = await axios.get(`${this.apiBase}/manhwa/see/${slug}`, {
        timeout: 15000
      });
      
      return response.data.chapters || [];
    } catch (error) {
      throw error;
    }
  }
  
  async getChapterImages(manhwaId, chapterNum) {
    const chapterId = CONFIG.buildChapterId(manhwaId, chapterNum);
    
    try {
      const response = await axios.get(`${this.apiBase}/chapters/see/${chapterId}`, {
        timeout: 15000
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.error('[API Client] Capítulo no encontrado en API, intentando fallback...');
        
        try {
          const fallbackResponse = await axios.get('/api/manhwaweb/pages', {
            params: { 
              slug: manhwaId, 
              chapter: chapterNum 
            },
            timeout: 60000
          });
          
          return fallbackResponse.data;
        } catch (fallbackError) {
          throw new Error(`Capítulo no encontrado en API ni fallback: ${fallbackError.message}`);
        }
      }
      
      throw error;
    }
  }
  
  async getChapterNav(manhwaId, chapterNum) {
    const chapterId = CONFIG.buildChapterId(manhwaId, chapterNum);
    
    try {
      const response = await axios.get(`${this.apiBase}/chapters/seeprevpost/${chapterId}`, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('[API Client] Error en navegación, usando lógica local...');
      
      return {
        chapterAnterior: `${CONFIG.buildChapterId(manhwaId, chapterNum - 1)}`,
        chapterSiguiente: `${CONFIG.buildChapterId(manhwaId, chapterNum + 1)}`
      };
    }
  }
  
  async getNuevos() {
    try {
      const response = await axios.get(`${this.apiBase}/manhwa/nuevos`, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ApiClient();
