# Plan de Solución: Problemas de Carga de Imágenes en TuManga e Ikigai

## Resumen Ejecutivo

El proyecto MangaIX tiene dos problemas críticos de carga de imágenes:
1. **TuManga**: Las imágenes de los capítulos no cargan (timeout esperando imágenes reales)
2. **Ikigai**: Los capítulos dan error al intentar abrirse (0 imágenes encontradas)

Ambos problemas se deben a cambios recientes en la estructura HTML de los sitios web.

---

## Análisis de Problemas

### Problema 1: TuManga - Timeout Esperando Imágenes

**Síntomas:**
```
[TuManga] Fetching chapter 1.00 of al-final-del-camino...
[TuManga] Environment: Vercel
Timeout waiting for real images...
Found 0 pages
```

**Causa Identificada:**
- TuManga cambió su método de carga de imágenes
- Ahora usa un **array JavaScript `PIC_ARRAY`** con datos codificados en Base64
- Las imágenes se cargan dinámicamente mediante la función `load_pics()` DESPUÉS del `domcontentloaded`
- El `waitForFunction` en `api/tumanga/pages.js` (línea 72-86) expira sin encontrar imágenes porque busca en `#lector img` pero las imágenes aún no se han insertado en el DOM

**Timeline del Problema:**
- Anteriormente: TuManga funcionaba correctamente
- De la nada: Cambio en la estructura/método de carga
- Ahora: API retorna 0 páginas

---

### Problema 2: Ikigai - URL Desactualizada + Selectores Incorrectos

**Síntomas:**
```
[Ikigai Pages] URL: https://viralikigai.learnixs.site/capitulo/1130530936285462531/
[Ikigai Pages] Esperando carga de Qwik framework...
[Ikigai Pages] Haciendo scroll para cargar imágenes...
[Ikigai Pages] Debug info: {
  "totalImages": 0,
  "imageSrcs": []
}
[Ikigai Pages] 0 imágenes encontradas
```

**Causa Identificada:**
- **URL desactualizada**: El código usa `viralikigai.learnixs.site` pero el dominio real es `viralikigai.techbee.site`
- La API se redirige automáticamente (302), pero los selectores CSS no encuentran imágenes
- Los selectores actuales en `api/ikigai/pages.js` (línea 111-145) buscan en lugares que ya no contienen las imágenes

**Timeline del Problema:**
- Anteriormente: Ikigai funcionaba correctamente en `viralikigai.learnixs.site`
- De la nada: Dominio migró a `viralikigai.techbee.site`
- Ahora: URL desactualizada + selectores inefectivos = 0 imágenes

---

## Soluciones a Implementar

### PASO 1: Actualizar URL de Ikigai

**Archivo**: `src/services/ikigai.js`

**Cambio Necesario** (Línea 3):
```javascript
// ANTES:
const BASE_URL = 'https://viralikigai.learnixs.site';

// DESPUÉS:
const BASE_URL = 'https://viralikigai.techbee.site';
```

**Justificación**: El dominio migró, necesitamos usar la URL correcta para que la API de extracción funcione.

**Impacto**: Afectará todas las llamadas a Ikigai (búsqueda, detalles, capítulos, páginas).

---

### PASO 2: Mejorar Extracción de Imágenes en TuManga

**Archivo**: `api/tumanga/pages.js`

**Problemas a Resolver**:
1. ⏱️ **Timeout insuficiente** (6 segundos): Puppeteer en Vercel tarda más en iniciar
2. 🎯 **Selectores incorrectos**: Busca `#lector img` pero se carga dinámicamente
3. 🔍 **Sin validación adecuada**: No verifica que las imágenes reales se hayan cargado

**Cambios Específicos** (Líneas 72-107):

1. **Aumentar timeout inicial** de `domcontentloaded` (línea 68):
   - ANTES: `timeout: 30000` (30s)
   - DESPUÉS: `timeout: 45000` (45s) - Puppeteer en Vercel necesita más tiempo

2. **Mejorar el waitForFunction** (línea 72-86):
   - Aumentar timeout de `6000ms` a `15000ms`
   - Mejorar la lógica para esperar a que `load_pics()` se ejecute
   - Buscar el array `PIC_ARRAY` en lugar de solo esperar imágenes en el DOM
   - Agregar fallback a selectores alternativos

3. **Mejorar extracción de URLs** (línea 92-107):
   - Hacer más flexible el filtrado de imágenes
   - Aceptar múltiples patrones de URLs
   - Agregar más logs para debugging

**Pseudocódigo de Cambios**:
```javascript
// Esperar a que las imágenes reales se carguen
await page.waitForFunction(() => {
  // Opción 1: Verificar que PIC_ARRAY se ha procesado
  const imgs = document.querySelectorAll('#lector img');

  if (imgs.length > 0) {
    // Verificar que al menos una imagen NO sea un loader/placeholder
    for (const img of imgs) {
      const src = img.src || img.dataset?.src || '';
      if (src && !src.includes('loader') && src.length > 50) {
        return true; // Imagen real encontrada
      }
    }
  }

  // Opción 2: Fallback - buscar en otros selectores
  const altImgs = document.querySelectorAll('img.page, img[data-image-id]');
  if (altImgs.length > 0) return true;

  return false;
}, { timeout: 15000 }).catch(() => {
  console.log('[TuManga] Timeout esperando imágenes, intentando fallback...');
});

// Pequeña pausa adicional
await new Promise(resolve => setTimeout(resolve, 1000));

// Extraer con múltiples selectores
const pages = await page.evaluate(() => {
  const urls = [];

  // Intentar múltiples selectores
  const selectors = [
    '#lector img',
    'img.page',
    'img[data-image-id]',
    '.manga-reader img',
    '.reader img'
  ];

  for (const selector of selectors) {
    const images = document.querySelectorAll(selector);
    if (images.length > 0) {
      images.forEach(img => {
        const src = img.src || img.dataset?.src || img.getAttribute('data-src');
        if (src && !src.includes('loader') && src.length > 50) {
          urls.push(src);
        }
      });
      break; // Usar el primer selector que funcione
    }
  }

  return [...new Set(urls)]; // Eliminar duplicados
});
```

---

### PASO 3: Mejorar Extracción de Imágenes en Ikigai

**Archivo**: `api/ikigai/pages.js`

**Problemas a Resolver**:
1. 🔍 **Selectores demasiado específicos**: No encuentran las imágenes
2. 📜 **Scroll insuficiente**: Lazy loading de Qwik requiere más intentos
3. 🚫 **Filtros muy restrictivos**: Pueden eliminar imágenes válidas

**Cambios Específicos** (Líneas 61-145):

1. **Aumentar intentos de scroll** (línea 73-74):
   - ANTES: `maxScrollAttempts = 10`
   - DESPUÉS: `maxScrollAttempts = 20` - Qwik lazy loading necesita más intentos

2. **Mejorar espera inicial** (línea 68):
   - ANTES: `await new Promise(resolve => setTimeout(resolve, 3000));`
   - DESPUÉS: `await new Promise(resolve => setTimeout(resolve, 5000));` - Qwik tarda más en cargar

3. **Agregar múltiples selectores** (línea 111-145):
   - Buscar en selectores alternativos si el principal no encuentra nada
   - Ser menos restrictivo con los filtros inicialmente
   - Agregar fallback a `document.querySelectorAll('img')`

4. **Mejorar logs de debug** (línea 96-107):
   - Agregar información del HTML renderizado
   - Mostrar qué selectores se encontraron
   - Registrar URLs parciales encontradas

**Pseudocódigo de Cambios**:
```javascript
// Aumentar espera de Qwik
await new Promise(resolve => setTimeout(resolve, 5000));

// Scroll más agresivo
let previousHeight = 0;
let scrollAttempts = 0;
const maxScrollAttempts = 20; // Aumentar de 10

while (scrollAttempts < maxScrollAttempts) {
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight * 1.5); // Scroll más agresivo
  });
  await new Promise(resolve => setTimeout(resolve, 600));

  const currentHeight = await page.evaluate(() => document.body.scrollHeight);
  if (currentHeight === previousHeight) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 800));
    break;
  }
  previousHeight = currentHeight;
  scrollAttempts++;
}

// Mejorar extracción de imágenes con múltiples selectores
const imageUrls = await page.evaluate(() => {
  const validImages = [];

  // Selectores a probar en orden de especificidad
  const selectors = [
    'img[src*="chapters/"]',      // Selector específico para capítulos
    'img[src*="imagedelivery"]',  // CDN específico
    'img[src*="ikigaimangas"]',   // Dominio específico
    'div.chapter img',             // Dentro de contenedor capítulo
    'div.reader img',              // Contenedor lector
    'img[data-src]',               // Lazy loading
    'img'                           // Todas las imágenes (fallback)
  ];

  for (const selector of selectors) {
    const images = document.querySelectorAll(selector);

    if (images.length > 0) {
      console.log(`[Ikigai] Encontrado selector: ${selector} con ${images.length} imágenes`);

      Array.from(images).forEach(img => {
        const src = img.src || img.dataset?.src || '';

        // Filtros menos restrictivos
        if (src && src.startsWith('http')) {
          // Verificar que sea del CDN correcto
          const isValidCdn = src.includes('ikigaimangas.cloud') ||
                            src.includes('imagedelivery.net') ||
                            src.includes('ikigai');

          // Excluir elementos de UI más específicamente
          const isNotUI = !src.includes('avatar') &&
                         !src.includes('logo') &&
                         !src.includes('icon') &&
                         !src.includes('placeholder') &&
                         img.height !== 60 &&
                         img.width !== 60;

          if (isValidCdn && isNotUI) {
            validImages.push(src);
          }
        }
      });

      if (validImages.length > 0) break; // Usar el primer selector que funcione
    }
  }

  return [...new Set(validImages)]; // Eliminar duplicados
});
```

---

### PASO 4: Actualizar Configuración de Vercel

**Archivo**: `vercel.json`

**Cambio Necesario**:
```json
{
  "functions": {
    "api/tumanga/pages.js": {
      "memory": 1024,
      "maxDuration": 30
    },
    "api/ikigai/pages.js": {
      "memory": 1024,
      "maxDuration": 30
    },
    "api/ikigai/chapters.js": {
      "memory": 1024,
      "maxDuration": 40
    }
  }
}
```

**Justificación**: Las funciones necesitan más tiempo para que Chromium inicie y ejecute Puppeteer.

---

### PASO 5: Mejorar Logging para Debugging Futuro

**Archivos Afectados**:
- `api/tumanga/pages.js`
- `api/ikigai/pages.js`

**Mejoras**:
1. Agregar logs más detallados en puntos críticos
2. Registrar tiempos de ejecución
3. Capturar información sobre selectores encontrados
4. Log de URLs encontradas (primeras 5 como ejemplo)
5. Log de errores más específicos

**Ejemplo**:
```javascript
console.log(`[TuManga] Iniciando Puppeteer...`);
console.log(`[TuManga] Navegando a: ${url}`);
console.log(`[TuManga] Esperando imágenes reales (timeout: 15s)...`);
console.log(`[TuManga] Imágenes encontradas: ${pages.length}`);
console.log(`[TuManga] Primeras 3 URLs: ${pages.slice(0, 3).join('\n')}`);
```

---

## Orden de Implementación

### Fase 1: Cambios Críticos (30 minutos)
1. ✅ Actualizar URL de Ikigai en `src/services/ikigai.js`
2. ✅ Mejorar timeouts en `api/tumanga/pages.js`
3. ✅ Mejorar selectores en `api/ikigai/pages.js`

### Fase 2: Optimizaciones (15 minutos)
4. ✅ Actualizar `vercel.json`
5. ✅ Mejorar logging en APIs

### Fase 3: Testing (30 minutos)
6. ✅ Probar en localhost
7. ✅ Validar que las imágenes cargan correctamente

### Fase 4: Deploy (10 minutos)
8. ✅ Commit a git
9. ✅ Deploy a Vercel
10. ✅ Validar en producción

---

## Validación de Soluciones

### Testing en TuManga
- [ ] Abrir un capítulo existente (ej: al-final-del-camino capítulo 1)
- [ ] Verificar que se carguen imágenes
- [ ] Validar que no haya timeout
- [ ] Comprobar que scroll y paginación funcionen

### Testing en Ikigai
- [ ] Abrir un capítulo existente del nuevo dominio
- [ ] Verificar que se carguen imágenes
- [ ] Validar que no haya error de timeout
- [ ] Comprobar que scroll y paginación funcionen

### Testing en ManhwaWeb (verificar que no se rompió)
- [ ] Abrir un capítulo
- [ ] Verificar que funcione normalmente
- [ ] Sin cambios esperados en este servicio

---

## Rollback Plan

Si algo falla en producción:

1. **Para Ikigai**: Revertir la URL a `viralikigai.learnixs.site` (aunque no funcione)
2. **Para TuManga**: Revertir cambios en `api/tumanga/pages.js` y volver a commit anterior
3. **Verificación**: Asegurar que al menos TuManga mantenga su estado actual

---

## Notas Adicionales

- Los cambios en `api/**/pages.js` son **no-destructivos**: solo agregan fallbacks y mejoran la lógica
- Los timeouts aumentados no afectarán negativamente el performance
- Los selectores adicionales harán que el código sea más **robusto** a futuros cambios
- Los logs mejorados ayudarán a **debuggear** futuros problemas más rápidamente

---

## Archivos a Modificar (Resumen)

| Archivo | Líneas | Tipo de Cambio |
|---------|--------|----------------|
| `src/services/ikigai.js` | 3 | URL BASE |
| `api/tumanga/pages.js` | 29, 68, 72-86, 92-107 | Timeout, selectores, extracción |
| `api/ikigai/pages.js` | 62, 68, 73-74, 111-145 | Timeout, scroll, selectores |
| `vercel.json` | - | Agregar/actualizar maxDuration |

---

**Estado**: ⏳ Pendiente de aprobación

**Próximo paso**: Implementar cambios fase por fase
