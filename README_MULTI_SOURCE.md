# 🌐 Sistema Multi-Fuente - Guía Completa

## 🎯 ¿Qué se implementó?

Tu aplicación ahora puede buscar y leer manhwas desde **dos fuentes diferentes**:

- **📚 TuManga** (tumanga.org)
- **🌐 ManhwaWeb** (manhwaweb.com)

Con una interfaz unificada y experiencia fluida.

---

## ✨ Nuevas Características

### 1. Selector de Fuente en Búsqueda
- Botones visuales para cambiar entre fuentes
- TuManga (azul 📚) y ManhwaWeb (púrpura 🌐)
- Responsive: iconos en móvil, texto en desktop

### 2. Selector de Fuente en Oráculo
- Elige de qué fuente quieres recomendaciones
- Mismo diseño consistente

### 3. Badges en Tarjetas
- Cada obra muestra su fuente de origen
- Badge flotante en esquina superior derecha

### 4. Sistema de Capítulos Multi-Fuente
- Los capítulos se cargan según la fuente de la obra
- Indicador visual de fuente activa

### 5. Todo Funciona en Local y Producción
- ✅ Configurado con Puppeteer para ambos entornos
- ✅ Detección automática de entorno

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias (si aún no)
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en navegador
http://localhost:5173
```

### Probar ManhwaWeb:
1. Haz clic en el botón **🌐 ManhwaWeb**
2. Busca "yuan" o cualquier título
3. Abre una obra y prueba leer capítulos

---

## 📁 Estructura del Proyecto

### Servicios Backend
```
src/services/
├── sources.js       # Catálogo de fuentes (config, colores, iconos)
├── tumanga.js       # Servicio de TuManga (existente)
├── manhwaweb.js     # Servicio de ManhwaWeb (NUEVO)
└── unified.js       # Capa de abstracción unificada (NUEVO)
```

### APIs Serverless
```
api/
├── tumanga/
│   └── pages.js     # Extrae páginas de capítulos (Puppeteer)
├── manhwaweb/
│   ├── search.js    # Búsqueda con Puppeteer (NUEVO)
│   └── pages.js     # Extrae páginas de capítulos (NUEVO)
└── image-proxy.js   # Proxy de imágenes multi-fuente
```

### Componentes UI
```
src/components/
├── App.jsx          # ✅ Selector de fuente en búsqueda
├── Oracle.jsx       # ✅ Selector de fuente en oráculo
├── ManhwaCard.jsx   # ✅ Badge de fuente
└── DetailModal.jsx  # ✅ Capítulos por fuente
```

---

## 🔧 Configuración Técnica

### Puppeteer en Local vs Vercel

Las APIs detectan automáticamente el entorno:

**En Local:**
```javascript
// Usa puppeteer completo con Chromium incluido
const puppeteerLocal = await import('puppeteer');
browser = await puppeteerLocal.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

**En Vercel:**
```javascript
// Usa puppeteer-core + @sparticuz/chromium (optimizado)
browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args
});
```

### ¿Por Qué Puppeteer?

**TuManga:** HTML tradicional
- Búsqueda: ✅ Scraping directo (no requiere Puppeteer)
- Capítulos: ⚠️ Requiere Puppeteer (JS dinámico)

**ManhwaWeb:** SPA (Single Page Application)
- Búsqueda: ⚠️ Requiere Puppeteer (contenido dinámico)
- Capítulos: ⚠️ Requiere Puppeteer (JS dinámico)

El HTML inicial de ManhwaWeb está vacío:
```html
<div id="root"></div>  <!-- Contenido cargado por JavaScript -->
```

---

## 📊 API Unificada

Todas las operaciones usan la capa unificada:

```javascript
import { 
    unifiedSearch, 
    unifiedGetDetails, 
    unifiedGetChapters, 
    unifiedGetPages, 
    unifiedGetRandom 
} from './services/unified';

// Búsqueda
const results = await unifiedSearch('jinx', filters, 'tumanga');

// Detalles
const details = await unifiedGetDetails(slug, 'manhwaweb');

// Capítulos
const chapters = await unifiedGetChapters(slug, source);

// Páginas (lector)
const pages = await unifiedGetPages(slug, chapter, source);

// Aleatorio (oráculo)
const random = await unifiedGetRandom(genreIds, source);
```

---

## 🎨 Agregar Nueva Fuente

El sistema es extensible. Para agregar una tercera fuente:

### 1. Configurar en `sources.js`
```javascript
export const SOURCES = {
    TUMANGA: { /* ... */ },
    MANHWAWEB: { /* ... */ },
    NUEVAFUENTE: {
        id: 'nuevafuente',
        name: 'NuevaFuente',
        icon: '🔥',
        baseUrl: 'https://nuevafuente.com',
        color: 'bg-red-500',
        features: ['search', 'details', 'chapters', 'read'],
        status: 'active'
    }
};
```

### 2. Crear servicio `src/services/nuevafuente.js`
```javascript
export const searchNuevaFuente = async (query) => { /* ... */ }
export const getNuevaFuenteDetails = async (slug) => { /* ... */ }
export const getNuevaFuenteChapters = async (slug) => { /* ... */ }
export const getNuevaFuentePages = async (slug, chapter) => { /* ... */ }
```

### 3. Agregar a `unified.js`
```javascript
import * as nuevafuente from './nuevafuente';

const serviceMap = {
    tumanga,
    manhwaweb,
    nuevafuente  // ← Agregar aquí
};
```

### 4. Crear APIs si requiere Puppeteer
```
api/nuevafuente/
├── search.js   # Si es SPA
└── pages.js    # Si capítulos requieren JS
```

¡Y listo! La UI se actualizará automáticamente.

---

## 🧪 Testing

### Manual
1. **Búsqueda TuManga:** Debe funcionar como siempre ✅
2. **Búsqueda ManhwaWeb:** Ahora funciona con Puppeteer ✅
3. **Badges:** Aparecen en todas las tarjetas ✅
4. **Oráculo:** Funciona con ambas fuentes ✅
5. **Leer capítulos:** Funciona para ambas fuentes ✅

### Logs en Consola
```
[ManhwaWeb Search] Searching for: "yuan"
[ManhwaWeb Search] Environment: Local
[ManhwaWeb Search] Found 12 results
```

---

## 📚 Documentación Adicional

- **`PLAN_MULTI_SOURCE.md`** - Plan arquitectónico completo (5 fases)
- **`MANHWAWEB_ANALYSIS.md`** - Análisis de estructura de ManhwaWeb
- **`MANHWAWEB_SPA_EXPLANATION.md`** - Por qué ManhwaWeb requiere Puppeteer
- **`IMPLEMENTATION_SUMMARY.md`** - Resumen de implementación
- **`LOCAL_SETUP_COMPLETE.md`** - Guía de configuración local
- **`FINAL_SUMMARY.md`** - Resumen ejecutivo del proyecto
- **`TEST_CHECKLIST.md`** - Checklist de testing

---

## 🐛 Solución de Problemas

### Búsqueda de ManhwaWeb falla con timeout

**Causa:** Conexión lenta o el sitio tarda en cargar.

**Solución:** Los timeouts están configurados a 30 segundos. Si sigue fallando:
1. Verifica tu conexión a internet
2. Intenta de nuevo (a veces el sitio está lento)
3. Verifica que no haya firewall bloqueando Puppeteer

### No se ven las imágenes

**Causa:** El proxy de imágenes puede estar fallando.

**Solución:** 
1. En producción: Debería funcionar automáticamente
2. En local: Las imágenes se cargan directamente

### Error al lanzar Puppeteer

```bash
# Reinstalar Puppeteer
npm uninstall puppeteer
npm cache clean --force
npm install puppeteer
```

---

## 🚀 Deploy a Producción

```bash
# Build
npm run build

# Preview local del build
npm run preview

# Deploy a Vercel
vercel --prod
```

En Vercel todo funcionará automáticamente sin configuración adicional.

---

## 📈 Estadísticas del Proyecto

**Archivos creados:** 12
- 3 servicios backend
- 2 APIs serverless
- 7 documentos

**Archivos modificados:** 7
- 4 componentes UI
- 2 utilidades (proxy de imágenes)
- 1 API existente (tumanga/pages.js)

**Líneas de código:** ~1,500+

**Tiempo de desarrollo:** 1 día

---

## 🏆 Logros

✅ Sistema multi-fuente completamente funcional  
✅ Funciona en local y producción sin cambios  
✅ UI intuitiva con selectores visuales  
✅ Arquitectura extensible (fácil agregar más fuentes)  
✅ Compatible hacia atrás (mangas existentes funcionan)  
✅ Documentación completa  
✅ Manejo de SPA con Puppeteer  
✅ Proxy de imágenes multi-fuente  

---

## 💡 Próximos Pasos Sugeridos

### Corto Plazo
- [ ] Agregar más fuentes (LectorManga, MangaDex)
- [ ] Búsqueda simultánea en múltiples fuentes
- [ ] Detección de duplicados entre fuentes

### Mediano Plazo
- [ ] Sistema de notificaciones de nuevos capítulos
- [ ] Estadísticas de uso por fuente
- [ ] Preferencia de fuente guardada

### Largo Plazo
- [ ] Backend unificado con base de datos
- [ ] Sincronización de progreso entre fuentes
- [ ] API GraphQL unificada

---

## 🤝 Contribuir

Para agregar una nueva fuente, sigue la guía en la sección **"Agregar Nueva Fuente"**.

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los documentos en la carpeta raíz (archivos .md)
2. Verifica los logs en la consola del navegador
3. Verifica los logs en la terminal del servidor

---

**Versión:** 2.0.0  
**Estado:** ✅ Producción Ready  
**Última actualización:** 2025-12-22

🥑✨ **¡A devorar manhwas desde múltiples fuentes!** ✨🥑
