# Análisis Completo de ManhwaWeb.com

## 📊 Estructura Identificada

### 1. URLs y Patrones

**Página de listado:** `https://manhwaweb.com/mis-manhwas`

**URLs de obras individuales:**
```
https://manhwaweb.com/manhwa/{slug-con-timestamp}
```

Ejemplo:
```
https://manhwaweb.com/manhwa/callate-dragon-malvado-no-quiero-tener-mas-hijos-contigo_1739941694614
```

**Estructura del slug:**
- Formato: `{titulo-normalizado}_{timestamp}`
- El timestamp es un identificador único (Unix timestamp en milisegundos)
- Ejemplo: `yuan-zun_1741951585034`

### 2. Estructura HTML de las Tarjetas

**Selector principal:**
```css
a[href*="/manhwa/"]
```

**Estructura de cada tarjeta:**
```html
<a href="/manhwa/{slug}" class="">
    <!-- Badge de tipo (MANGA/MANHWA/MANHUA/NOVELA) -->
    <div class="text-xs md:text-base bottom-0 mb-0 right-0 w-full rounded-t-md bg-opacity-80 text-center bg-{color}">
        MANHUA
    </div>
    
    <!-- Contenedor de imagen -->
    <div class="relative">
        <!-- Imagen principal -->
        <img 
            class="w-full object-cover aspect-defect" 
            src="https://imagizer.imageshack.com/img923/4136/pa2h6w.jpg" 
            alt="{slug-completo}" 
            loading="lazy" 
            referrerpolicy="no-referrer"
        >
        
        <!-- Badge de categoría demográfica (Seinen/Shounen/Shoujo) -->
        <span class="absolute text-sm md:text-lg bottom-0 mb-0 font-mono right-0 w-full bg-opacity-80 text-center py-0.5 sm:py-1 bg-{color}">
            Seinen
        </span>
    </div>
    
    <!-- Título -->
    <div class="p-1">
        <p class="text-xs_ sm:text-sm_ leading-customa text-texto-blanco text-center font-sans font-medium line-clamp-4">
            Yuan Zun
        </p>
    </div>
</a>
```

### 3. Extracción de Datos

**Selector de tarjetas:**
```javascript
document.querySelectorAll('a[href*="/manhwa/"]')
```

**Título:**
- **Ubicación principal:** `<p class="text-xs_ sm:text-sm_">` dentro del último `<div class="p-1">`
- **Fallback:** Atributo `alt` de la imagen (contiene el slug)
- **Selector:** `card.querySelector('p.text-xs_')?.textContent.trim()`

**Imagen de portada:**
- **Selector:** `card.querySelector('img')`
- **URL:** Atributo `src`
- **Dominio:** `imagizer.imageshack.com`

**Slug:**
- **Extracción:** Dividir la URL por `/manhwa/` y tomar la segunda parte
- **Ejemplo:**
  ```javascript
  const slug = url.split('/manhwa/')[1]; // "yuan-zun_1741951585034"
  ```

**Tipo/Formato:**
- **Ubicación:** Primer `<div>` con texto "MANGA", "MANHWA", "MANHUA", o "NOVELA"
- **Colores por tipo:**
  - MANGA: `bg-blue-600`
  - MANHUA: `bg-marron`
  - NOVELA: `bg-red-700`
  - MANHWA: (Por determinar)

**Categoría demográfica:**
- **Ubicación:** `<span class="absolute">` dentro del contenedor de imagen
- **Valores:** Seinen, Shounen, Shoujo, etc.

### 4. Sistema de Búsqueda

**Pendiente de análisis:** El sitio usa filtros en `/mis-manhwas` con checkboxes de géneros.

**Estructura observada:**
```html
<input type="checkbox" name="genders" value="3"> Acción
```

**Géneros disponibles en el grid:**
- Acción (value="3")
- Y otros... (necesita análisis más profundo del formulario)

### 5. Ejemplos de Datos Extraídos

```json
[
  {
    "url": "https://manhwaweb.com/manhwa/yuan-zun_1741951585034",
    "slug": "yuan-zun_1741951585034",
    "imageUrl": "https://imagizer.imageshack.com/img923/4136/pa2h6w.jpg",
    "imageAlt": "yuan-zun_1741951585034",
    "visibleText": "MANHUA\nSeinen\n\nYuan Zun",
    "title": "Yuan Zun",
    "type": "MANHUA",
    "demographic": "Seinen"
  },
  {
    "url": "https://manhwaweb.com/manhwa/yerno-del-rey-dragon_1747331347032",
    "slug": "yerno-del-rey-dragon_1747331347032",
    "imageUrl": "https://imagizer.imageshack.com/img924/5750/SrwaOi.jpg",
    "imageAlt": "yerno-del-rey-dragon_1747331347032",
    "visibleText": "MANHUA\nSeinen\n\nYerno Del Rey Dragón",
    "title": "Yerno Del Rey Dragón",
    "type": "MANHUA",
    "demographic": "Seinen"
  }
]
```

## 🔧 Implementación de Scraping

### Función de Búsqueda

```javascript
export const searchManhwaWeb = async (query = '', filters = {}) => {
    try {
        // URL base de listado
        let url = 'https://manhwaweb.com/mis-manhwas';
        
        // Si hay query, agregar parámetro de búsqueda
        if (query) {
            url += `?buscar=${encodeURIComponent(query)}`;
        }
        
        const response = await fetchWithProxy(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        
        const results = [];
        const cards = doc.querySelectorAll('a[href*="/manhwa/"]');
        
        cards.forEach((card, index) => {
            const href = card.getAttribute('href');
            if (!href) return;
            
            // Extraer slug
            const slug = href.split('/manhwa/')[1];
            if (!slug) return;
            
            // Extraer título
            const titleEl = card.querySelector('p.text-xs_');
            const title = titleEl?.textContent?.trim() || '';
            
            if (!title) return;
            
            // Extraer imagen
            const img = card.querySelector('img');
            const coverUrl = img?.getAttribute('src') || '';
            
            // Generar ID único
            const uniqueId = `manhwaweb-${slug}-${Date.now()}-${index}`;
            
            results.push({
                id: uniqueId,
                slug,
                title,
                cover: coverUrl,
                source: 'manhwaweb'
            });
        });
        
        return results;
    } catch (error) {
        console.error('Error searching ManhwaWeb:', error);
        return [];
    }
};
```

### Obtener Detalles de una Obra

**Pendiente:** Necesita análisis de la página individual `/manhwa/{slug}` para extraer:
- Descripción/sinopsis
- Géneros completos
- Estado (en curso/completado)
- Autor
- Año
- Último capítulo

### Obtener Lista de Capítulos

**Pendiente:** Analizar estructura de capítulos en la página de detalles.

### Obtener Páginas de un Capítulo

**Pendiente:** Analizar cómo cargan las imágenes de los capítulos (probablemente requiera Puppeteer como TuManga).

## 📋 Próximos Pasos

1. ✅ Análisis de listado de obras - **COMPLETADO**
2. ⏳ Análisis de página de detalles de una obra
3. ⏳ Análisis de estructura de capítulos
4. ⏳ Análisis de carga de imágenes de capítulos
5. ⏳ Mapeo de géneros
6. ⏳ Implementación completa del servicio

## 🔍 Notas Importantes

- **Imágenes:** Usan `imagizer.imageshack.com` (externo)
- **Lazy loading:** Las imágenes tienen `loading="lazy"`
- **Referrer policy:** `referrerpolicy="no-referrer"` - importante para el proxy
- **Timestamps en slugs:** Garantizan unicidad pero complican búsquedas directas
- **SPA (React):** El sitio es una Single Page Application, puede requerir Puppeteer para scraping completo
