export const CONFIG = {
  API_BASE: 'https://manhwawebbackend-production.up.railway.app',
  PREFIX: 'manhwaweb1',
  
  TYPE_MAP: {
    manhwa: 'manhwa',
    manga: 'manga',
    manhua: 'manhua',
    novela: 'novela'
  },
  
  GENRE_MAP: {
    1: 'Drama', 2: 'Romance', 3: 'Acción', 5: 'Venganza',
    6: 'Harem', 8: 'Milf', 15: 'Academia', 17: 'Boys Love',
    18: 'Comedia', 23: 'Fantasía', 25: 'Tragedia', 27: 'Girls Love',
    28: 'Historias Cortas', 29: 'Aventura', 30: 'Ecchi',
    31: 'Sobrenatural', 32: 'Horror', 33: 'Ciencia Ficción',
    34: 'Gore', 35: 'Cultivación', 37: 'Sistema Niveles',
    38: 'Apocalíptico', 39: 'Artes Marciales', 40: 'Superpoderes',
    41: 'Reencarnación', 42: 'Recuentos', 43: 'Psicológico',
    44: 'Thriller', 45: 'Boys Love', 46: 'NTR', 49: 'Isekai'
  },
  
  STATUS_MAP: {
    publicandose: 'ongoing',
    finalizado: 'completed',
    pausado: 'paused'
  },
  
  DEMOGRAPHIC_MAP: {
    seinen: 'seinen',
    shonen: 'shonen',
    shojo: 'shojo',
    josei: 'josei'
  },
  
  buildChapterId(manhwaId, chapterNum) {
    return `${manhwaId}-${chapterNum}`;
  },
  
  extractChapterNumber(compositeId) {
    const match = compositeId.match(/-(\d+(?:\.\d+)?)$/);
    return match ? parseFloat(match[1]) : null;
  },
  
  TTL: {
    SEARCH: 1800,
    WORK: 21600,
    IMAGES: 7200,
    NUEVOS: 600
  },
  
  MAX_KEYS: 256,
  MAX_SEARCH_KEYS: 80,
  MAX_WORK_KEYS: 150,
  MAX_IMAGE_KEYS: 25
};
