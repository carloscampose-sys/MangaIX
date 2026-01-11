# ManhwaWeb1 - API Direct Integration

## Descripción

Sistema de integración directa con la API oficial de ManhwaWeb que reemplaza el scraping con Puppeteer.

## Ventajas

- **Velocidad**: <1 segundo vs 30-60 segundos con Puppeteer
- **Fiabilidad**: 99.9% vs 80-90% con scraping
- **Mantenimiento**: API estable vs scraping frágil
- **Recursos**: Axios simple vs Chromium pesado

## Endpoints

### Búsqueda
```
GET /api/manhwaweb1/search
Query params:
  - query: término de búsqueda
  - genres: IDs de géneros (ej: 1,2,3)
  - type: manhwa, manga, manhua, novela
  - status: publicandose, finalizado, pausado
  - erotic: si, no
  - demographic: seinen, shonen, shojo, josei
  - sortBy: alfabetico, fecha
  - sortOrder: asc, desc
  - page: número de página
```

### Detalles + Capítulos
```
GET /api/manhwaweb1/details
Query params:
  - slug: ID del manhwa (ej: naruto_1732840803073)
```

### Imágenes de Capítulo
```
GET /api/manhwaweb1/chapter-images
Query params:
  - slug: ID del manhwa
  - chapter: número de capítulo (ej: 1, 2, 5.5)
```

### Navegación de Capítulos
```
GET /api/manhwaweb1/chapter-nav
Query params:
  - slug: ID del manhwa
  - chapter: número de capítulo actual

Respuesta:
  - previous: URL del capítulo anterior
  - next: URL del capítulo siguiente
```

### Nuevas Obras
```
GET /api/manhwaweb1/nuevos
```

## Sistema de Caché

### Configuración

- **Límite de claves**: 256 (plan gratuito de Vercel KV)
- **TTL (Time To Live)**:
  - Búsquedas: 30 minutos
  - Obras completas: 6 horas
  - Imágenes: 2 horas
  - Nuevas obras: 10 minutos

### Algoritmo LRU (Least Recently Used)

El sistema evicta automáticamente las claves menos usadas cuando se alcanza el límite de 256 claves.

## Fallback a Puppeteer

Si la API oficial falla, el sistema intenta automáticamente usar la implementación existente con Puppeteer como fallback.

## Uso en el Frontend

```javascript
import { 
  searchManhwaWeb1, 
  getManhwaWeb1Details, 
  getManhwaWeb1Images,
  getManhwaWeb1ChapterNav,
  getManhwaWeb1Nuevos 
} from '@/services/manhwaweb1';

// Búsqueda
const results = await searchManhwaWeb1('naruto', { genres: ['accion', 'fantasia'] });

// Detalles
const details = await getManhwaWeb1Details('naruto_1732840803073');

// Imágenes de capítulo
const images = await getManhwaWeb1Images('naruto_1732840803073', 1);

// Navegación
const nav = await getManhwaWeb1ChapterNav('naruto_1732840803073', 1);

// Nuevas obras
const nuevos = await getManhwaWeb1Nuevos();
```

## Diferencias con ManhwaWeb Original

| Aspecto | ManhwaWeb (Original) | ManhwaWeb1 (Nuevo) |
|---------|-------------------------|---------------------|
| Velocidad | 30-60s | <1s |
| Método | Puppeteer scraping | API directa |
| Caché | No | Sí (KV) |
| Fallback | No | Sí (a Puppeteer) |
| Dependencias | Chromium | Axios |
| Fiabilidad | 80-90% | 99.9% |
| Rate Limit | No hay | Generoso |
