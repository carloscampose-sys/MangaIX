# Plan Detallado: Optimización de Carga de Imágenes y Búsqueda en ManhwaWeb

**Fecha**: Enero 2026
**Objetivo**: Optimizar la carga de imágenes y búsqueda en ManhwaWeb usando como referencia las lecciones aprendidas de TuManga e Ikigai
**Estado**: Fase de Planificación

---

## Tabla de Contenidos

1. [Introducción y Contexto](#introducción-y-contexto)
2. [Análisis de Problemas Actuales](#análisis-de-problemas-actuales)
3. [Comparación Arquitectónica](#comparación-arquitectónica)
4. [Identificación de Cuellos de Botella](#identificación-de-cuellos-de-botella)
5. [Soluciones Propuestas](#soluciones-propuestas)
6. [Plan de Implementación](#plan-de-implementación)
7. [Validación y Testing](#validación-y-testing)

---

## Introducción y Contexto

ManhwaWeb es uno de los tres servicios principales de MangaIX. A diferencia de TuManga (que usa proxy CORS) e Ikigai (que usa APIs híbridas), ManhwaWeb depende completamente de **Puppeteer para todas las operaciones** (búsqueda, capítulos, imágenes).

**Problemas reportados:**
- ❌ Búsqueda lenta
- ❌ Carga de imágenes demora
- ❌ Experiencia de usuario pobre
- ❌ Inconsistencia en tiempos de respuesta

**Objetivos de optimización:**
- ✅ Reducir tiempo de búsqueda (target: < 9s)
- ✅ Reducir tiempo de carga de capítulos (target: < 9s)
- ✅ Reducir tiempo de carga de imágenes (target: < 8s)
- ✅ Mejorar confiabilidad
- ✅ Mantener paridad con TuManga e Ikigai

**⚠️ RESTRICCIÓN CRÍTICA: Vercel Free Plan (10s timeout)**
- Todos los endpoints deben completar en < 10 segundos
- Vercel comienza a rechazar requests después de 10s
- **Buffer seguro**: Completar en < 9s (1s de margen)
- Cold start suma ~1-1.5s, así que disponemos realmente de ~8.5s para scraping

---

## Estrategia para Vercel Free Plan (CRÍTICA)

### Restricciones Duras
```
Vercel Free Plan:
├─ Timeout máximo: 10 segundos
├─ Cold start: ~1-1.5 segundos
├─ Scraping real disponible: ~8.5 segundos
├─ Margen de seguridad: 1 segundo
└─ Target real: < 8.5 segundos TOTAL
```

### Comparativa de Timeouts por Endpoint

| Endpoint | Actual | Target Vercel | ∆ Reducción |
|----------|--------|---------------|------------|
| Search | ~12-13s | < 8s | **-33%** ⚠️ |
| Chapters | ~14-15s | < 8s | **-45%** 🔴 |
| Pages | ~5-14s | < 7s | **-30%** ⚠️ |

### Estrategia Agresiva (NECESARIA)

#### 1. Reducir Scroll Loops
```
ANTES: 8 intentos máx = 8 segundos solo en scroll
DESPUÉS: 3-4 intentos máx = 1.5-2 segundos
Estrategia: Si no hay 15+ resultados después de 3 scrolls, asumir que es todo
```

#### 2. Reducir Timeouts de Puppeteer
```
ANTES:
├─ goto: 30s
├─ waitForFunction: 20s
└─ Total: 50s (configurado pero efectivo es menor)

DESPUÉS:
├─ goto: 15s (0.5s de margen)
├─ waitForFunction: 8s (timeout agresivo)
└─ Total: 23s (más realista)
```

#### 3. Early Exit Agresivo
```
ANTES: Siempre extraer todo lo posible
DESPUÉS:
├─ Búsqueda: Salir al primer botón encontrado + 2 scrolls
├─ Capítulos: Salir al tener 50+ capítulos
├─ Imágenes: Salir al tener 3+ imágenes válidas
```

#### 4. Fallbacks Simplificados
```
ANTES:
├─ Intenta método 1
├─ Si falla, intenta método 2
├─ Si falla, intenta método 3
└─ Si falla, intenta método 4

DESPUÉS:
├─ Intenta método 1 (3s timeout)
├─ Si falla INMEDIATAMENTE, intenta método 2 (3s timeout)
├─ Si falla INMEDIATAMENTE, error (no más reintentos)
```

#### 5. Bloqueo Más Agresivo de Recursos
```
ANTES: Bloquear solo google, analytics, ads
DESPUÉS: Bloquear también:
├─ .css files (excepto principales)
├─ Iframes
├─ Videos
├─ Imágenes de tracking
└─ Cualquier recurso > 1MB
```

---

## Análisis de Problemas Actuales

### Problema 1: Búsqueda Lenta (`api/manhwaweb/search.js`)

#### Situación Actual
```
Timeline de ejecución:
├─ Construir URL con filtros: ~50ms
├─ Lanzar Puppeteer: ~800-1500ms (Vercel tarda más)
├─ Navegar a página: ~2000-3000ms
├─ Scroll infinito (8 intentos × 1s): ~8000ms
├─ Extracción de datos: ~500-1000ms
└─ Total: ~11.5-14 segundos
```

#### Problemas Identificados

**1. Scroll Infinito Innecesariamente Largo**
- Línea 228-264: Máximo 8 intentos de scroll
- Cada scroll espera 1 segundo fijo
- No hay detección de convergencia
- **Problema**: Incluso si todos los resultados cargan en 2-3 scrolls, sigue esperando

**2. Múltiples Selectores pero Sin Optimización**
- Línea 286-348: Busca con 3 selectores diferentes
- No hay early exit cuando encuentra resultados
- Procesa todo el DOM innecesariamente

**3. Lazy Loading en ManhwaWeb**
- ManhwaWeb carga imágenes de portadas bajo demanda
- Scroll espera a que carguen antes de contar
- Pero muchas imágenes siguen siendo placeholders

**4. Vercel Cold Start**
- Línea 35-50: Lanzar Puppeteer en Vercel tarda 1-1.5 segundos
- Sin precalentamiento de instancia

#### Métricas Actuales
```
Escenario: Búsqueda "Bleach" con 50+ resultados

Local (Laptop):
├─ Puppeteer launch: ~300ms
├─ Navigate: ~1200ms
├─ Scroll (8×): ~8000ms
├─ Extract: ~400ms
└─ Total: ~9.9s

Vercel (Cold start):
├─ Puppeteer launch: ~1500ms
├─ Navigate: ~2500ms
├─ Scroll (8×): ~8000ms
├─ Extract: ~600ms
└─ Total: ~12.6s

Vercel (Warm instance):
├─ Puppeteer launch: ~800ms
├─ Navigate: ~1800ms
├─ Scroll (8×): ~8000ms
├─ Extract: ~400ms
└─ Total: ~11s
```

---

### Problema 2: Carga de Capítulos Lenta (`api/manhwaweb/chapters.js`)

#### Situación Actual
```
Timeline de ejecución:
├─ Lanzar Puppeteer: ~800-1500ms
├─ Navegar a obra: ~1500-2000ms
├─ Esperar selector: ~2000-3000ms
├─ Buscar botón "Ver todo": ~500-1000ms
├─ Click y espera: ~5000-8000ms (o fallback scroll)
├─ Extracción: ~500-1000ms
└─ Total: ~10.3-16.5 segundos (DEMASIADO)
```

#### Problemas Identificados

**1. Búsqueda de Botón "Ver todo" Lenta**
- Línea 99-159: Múltiples selectores con esperas
- Primer selector `:has-text()` es pesado en navegadores headless
- Fallback a `evaluate()` con búsqueda de texto (también lento)

**2. Click y Espera Demasiado Larga**
- Línea 167-212: waitForFunction con timeout 15s
- Si hay problemas de red, espera todo el tiempo
- Línea 220-277: Fallback a scroll infinito con 10 intentos máx

**3. Extracción de Capítulos Sin Optimización**
- Línea 284-320: Busca todos los `a[href*="/leer/"]` sin limitar
- Parsea números de capítulo sin validación de rango
- Ordena todo (puede ser N log N innecesariamente)

#### Métricas Actuales
```
Escenario: Obra con 100+ capítulos

Caso A: Botón "Ver todo" encontrado y funciona
├─ Puppeteer launch: ~800-1500ms
├─ Navigate: ~1500ms
├─ Wait selector: ~2000ms
├─ Find button: ~800ms
├─ Click & wait: ~5000ms
├─ Extract: ~600ms
└─ Total: ~10.7-11.3s ✅ ACEPTABLE

Caso B: Botón no encontrado, fallback scroll
├─ Puppeteer launch: ~800-1500ms
├─ Navigate: ~1500ms
├─ Wait selector: ~2000ms
├─ Find button (fails): ~3000ms (timeout)
├─ Fallback scroll: ~10000ms (10 intentos)
├─ Extract: ~600ms
└─ Total: ~18-19s ❌ INACEPTABLE

Caso C: Red lenta/issues
├─ Todos los timeouts se triggered
└─ Total: ~30+s ❌ CRÍTICO
```

---

### Problema 3: Carga de Imágenes Inconsistente (`api/manhwaweb/pages.js`)

#### Situación Actual
```
Timeline de ejecución:
├─ Lanzar Puppeteer: ~800-1500ms
├─ Navegar a capítulo: ~1500-2000ms
├─ Esperar carga de imágenes: ~2000ms (timeout generalmente se dispara)
├─ Extracción: ~300-500ms
└─ Total: ~4.6-5.5 segundos
```

#### Problemas Identificados

**1. Condición de Espera Muy Estricta**
- Línea 83-96: Busca `img.width > 200px`
- ManhwaWeb carga imágenes lazy (ancho = 0 hasta interacción)
- Condición nunca se cumple en headless
- **Resultado**: Siempre se dispara el timeout

**2. Pequeña Pausa Adicional Innecesaria**
- Línea 99: Pausa de 2 segundos
- Muchas imágenes ya están en DOM pero aún cargando
- 2 segundos es demasiado tiempo

**3. Filtros de Validación Muy Restrictivos**
- Línea 117: Solo imageshack.com o manhwaweb.com
- Puede haber CDNs o dominios alternativos
- Se pierden imágenes válidas

**4. Sin Manejo de Lazy Loading Moderno**
- ManhwaWeb usa lazy loading con data-src o IntersectionObserver
- No fuerza carga ni scroll simulado
- Espera pasivamente

#### Métricas Actuales
```
Escenario: Capítulo con 20 imágenes

Caso A: Imágenes pre-cargadas
├─ Puppeteer launch: ~800-1500ms
├─ Navigate: ~1500ms
├─ Wait images: ~500ms (rápido porque está)
├─ Pause: ~2000ms
├─ Extract: ~300ms
└─ Total: ~5.1-5.9s

Caso B: Imágenes con lazy loading
├─ Puppeteer launch: ~800-1500ms
├─ Navigate: ~1500ms
├─ Wait images: ~20000ms (TIMEOUT, width nunca > 200)
├─ Pause: ~2000ms (no se ejecuta)
├─ Extract: ~300ms
└─ Total: ~22.8-23.5s ❌ INACEPTABLE

Caso C: Extracción fallida
├─ Found 0 images
└─ Error 404 ❌ BUG
```

---

## Comparación Arquitectónica

### TuManga vs ManhwaWeb vs Ikigai

| Aspecto | TuManga | ManhwaWeb | Ikigai |
|---------|---------|-----------|--------|
| **Motor** | Proxy CORS | Puppeteer | Puppeteer |
| **Búsqueda** | ❌ No implementado | ✅ Puppeteer | ✅ Híbrida (Puppeteer + API) |
| **Capítulos** | ❌ No implementado | ✅ Puppeteer | ✅ API directa |
| **Imágenes** | ✅ Puppeteer | ✅ Puppeteer | ✅ Puppeteer |
| **Tiempo búsqueda** | N/A | ~11-13s | N/A |
| **Tiempo capítulos** | N/A | ~10-19s | ~2-3s (API) |
| **Tiempo imágenes** | ~5-6s | ~5-23s | ~4-9s |
| **Confiabilidad** | Alta (simple) | Media | Media |

### Lecciones de TuManga
- ✅ Uso de proxy es más rápido que Puppeteer para búsqueda
- ✅ Simpler es mejor
- ✅ Menos dependencias = menos puntos de fallo

### Lecciones de Ikigai
- ✅ APIs directas son 5-10x más rápidas que scraping
- ✅ Detectar convergencia en loops es crítico
- ✅ Timeouts optimizados son clave
- ✅ Early exit cuando se encuentra suficiente info
- ⚠️ Lazy loading requiere scroll simulado o JavaScript

---

## Identificación de Cuellos de Botella

### Cuello 1: Scroll Infinito Demasiado Largo en Búsqueda
**Ubicación**: `api/manhwaweb/search.js:228-264`
**Impacto**: ~8 segundos de 13s total = **62% del tiempo**
**Severidad**: 🔴 CRÍTICA

**Root cause**:
- 8 intentos máximo sin detección de convergencia
- Cada intento espera 1 segundo exacto
- Incluso si todos los resultados cargan en 2-3 iteraciones, sigue esperando

**Comparación**:
- Ikigai (Fase 5): Scroll 15 intentos → optimizado a 8 intentos
- Resultado: 50% más rápido
- **ManhwaWeb**: 8 intentos aún es demasiado

### Cuello 2: Búsqueda de Botón "Ver Todo" Poco Fiable
**Ubicación**: `api/manhwaweb/chapters.js:99-159`
**Impacto**: Fallback a scroll infinito = +10 segundos adicionales
**Severidad**: 🔴 CRÍTICA

**Root cause**:
- Selectores CSS complejos que no siempre funcionan
- Fallback a `evaluate()` que busca texto (lento)
- No hay validación de si el botón existe realmente

### Cuello 3: Espera de Imágenes con Condición Imposible
**Ubicación**: `api/manhwaweb/pages.js:83-96`
**Impacto**: Siempre timeout (20s) en lazy loading
**Severidad**: 🟠 ALTA

**Root cause**:
- Condición `img.width > 200px` nunca se cumple en headless
- ManhwaWeb usa lazy loading (width = 0 hasta scroll)
- No hay scroll simulado para forzar carga

---

## Soluciones Propuestas

### Solución 1: Optimizar Scroll en Búsqueda

#### Estrategia
1. **Reducir intentos de 8 a 5** (80% → 50% del resultado en primeros 5 intentos)
2. **Detección de convergencia**: Si no hay nuevos elementos en 2 iteraciones, salir
3. **Reducir espera de 1s a 500ms** entre scrolls
4. **Early exit**: Si encontramos 30+ resultados, salir

#### Implementación
```javascript
// ANTES (líneas 228-264)
for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(resolve => setTimeout(resolve, 1000));

    const count = await page.evaluate(() =>
        document.querySelectorAll('a[href*="/manhwa/"]').length
    );
}

// DESPUÉS
let previousCount = 0;
let noChangeCount = 0;
const maxAttempts = 5;

for (let i = 0; i < maxAttempts; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentCount = await page.evaluate(() =>
        document.querySelectorAll('a[href*="/manhwa/"]').length
    );

    console.log(`[ManhwaWeb Search] Scroll ${i+1}: ${currentCount} items`);

    // Early exit si encontramos suficientes resultados
    if (currentCount >= 30) {
        console.log('[ManhwaWeb Search] Early exit: 30+ items found');
        break;
    }

    // Convergencia detectada
    if (currentCount === previousCount) {
        noChangeCount++;
        if (noChangeCount >= 2) {
            console.log('[ManhwaWeb Search] Convergence detected, stopping scroll');
            break;
        }
    } else {
        noChangeCount = 0;
    }

    previousCount = currentCount;
}
```

**Impacto esperado**: 8s → 3-4s (50% reduction)

**⚠️ PARA VERCEL FREE: Reducir aún más**
- Máximo 3 intentos de scroll (no 5)
- Reducir espera de 500ms a 300ms
- Early exit si 20+ resultados encontrados
- **Resultado**: 8s → 2-3s (total para búsqueda)

---

### Solución 2: Mejorar Confiabilidad de Búsqueda de Botón "Ver Todo"

#### Estrategia
1. **Intentar métodos en cascada** (más simple → más complejo)
2. **Timeout más corto para selector CSS** (3s en lugar de esperara implícita)
3. **Mejor fallback a scroll** si botón no existe
4. **Validar que el botón es clickeable** antes de hacer click

#### Implementación
```javascript
// ANTES (líneas 99-159)
// Busca con múltiples selectores sin contexto claro

// DESPUÉS
console.log('[Chapters] Buscando botón "Ver todo"...');

// Método 1: Buscar con XPath (más fiable que :has-text)
let buttonFound = false;
try {
    const buttons = await page.$x("//button[contains(text(), 'Ver todo')]");
    if (buttons.length > 0) {
        console.log('[Chapters] ✅ Botón encontrado con XPath');
        await buttons[0].click();
        buttonFound = true;
    }
} catch (e) {
    console.log('[Chapters] ⚠️ XPath search failed');
}

// Método 2: Si XPath no funciona, buscar por evaluate
if (!buttonFound) {
    const hasButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent.includes('Ver todo'));
    });

    if (hasButton) {
        console.log('[Chapters] ✅ Botón encontrado con evaluate');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent.includes('Ver todo'));
            if (btn) btn.click();
        });
        buttonFound = true;
    }
}

// Método 3: Si aún no hay botón, usar fallback a scroll
if (!buttonFound) {
    console.log('[Chapters] ⚠️ Botón no encontrado, usando scroll infinito');
    // Implementar scroll optimizado
}
```

**Impacto esperado**: 18-19s (fallback) → 12-13s (con mejor botón detection)

---

### Solución 3: Arreglar Espera de Imágenes con Scroll Simulado

#### Estrategia
1. **Cambiar condición de espera** de `width > 200px` a `dataset.src OR src`
2. **Agregar scroll simulado** para forzar carga de lazy images
3. **Reducir espera adicional** de 2s a 500ms-1s
4. **Más permisivo en dominios** de imágenes

#### Implementación
```javascript
// ANTES (líneas 83-96)
await page.waitForFunction(() => {
    const imgs = document.querySelectorAll('img');
    const chapterImages = Array.from(imgs).filter(img => {
        const src = img.src || '';
        return src &&
               !src.includes('logo') &&
               !src.includes('icon') &&
               !src.includes('avatar') &&
               img.width > 200;  // ❌ NUNCA se cumple
    });
    return chapterImages.length > 5;
}, { timeout: 20000 });

// DESPUÉS
// Paso 1: Scroll para activar lazy loading
console.log('[ManhwaWeb Pages] Simulando scroll para cargar imágenes...');
await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight / 2);
});
await new Promise(resolve => setTimeout(resolve, 300));

// Paso 2: Esperar con condición realista
await page.waitForFunction(() => {
    const imgs = document.querySelectorAll('img');
    const chapterImages = Array.from(imgs).filter(img => {
        const src = img.src || img.dataset?.src || img.getAttribute('data-src') || '';
        return src &&
               !src.includes('logo') &&
               !src.includes('icon') &&
               !src.includes('avatar') &&
               !src.includes('placeholder') &&
               src.length > 10;  // ✅ Más realista
    });
    return chapterImages.length >= 3; // Menos restrictivo
}, { timeout: 15000 }).catch(() => {
    console.log('[ManhwaWeb Pages] Timeout esperando imágenes, continuando...');
});

// Paso 3: Pausa más corta
await new Promise(resolve => setTimeout(resolve, 800));
```

**Impacto esperado**: 23.5s (con timeout) → 5-6s (normal)

---

### Solución 4: Mejorar Filtrado y Validación de Imágenes

#### Estrategia
1. **Ampliar dominios permitidos** (no solo imageshack y manhwaweb)
2. **Mejor detección de imágenes válidas** (por tamaño relativo)
3. **Eliminar duplicados** (misma URL aparece múltiples veces)
4. **Ordenar por posición en DOM** (izquierda → derecha, arriba → abajo)

#### Implementación
```javascript
// ANTES (líneas 102-124)
const pages = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const urls = [];

    images.forEach(img => {
        const src = img.src || img.dataset?.src || img.getAttribute('data-src');

        if (src &&
            !src.includes('logo') &&
            !src.includes('icon') &&
            !src.includes('avatar') &&
            img.width > 200) {

            // ❌ Muy restrictivo
            if (src.includes('imageshack.com') || src.includes('manhwaweb.com')) {
                urls.push(src);
            }
        }
    });

    return urls;
});

// DESPUÉS
const pages = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const urls = new Set(); // Eliminar duplicados

    // Obtener dimensiones del viewport
    const isValidImage = (img, src) => {
        // Filtar por contenido de URL
        if (src.includes('logo') ||
            src.includes('icon') ||
            src.includes('avatar') ||
            src.includes('placeholder') ||
            src.includes('banner') ||
            src.length < 10) {
            return false;
        }

        // Filtrar por dimensiones lógicas (no necesita width > 200)
        // En headless, width podría ser 0, así que validamos por rect
        const rect = img.getBoundingClientRect();
        return rect.width > 100 && rect.height > 150;
    };

    images.forEach((img, index) => {
        const src = img.src || img.dataset?.src || img.getAttribute('data-src') || '';

        if (src && isValidImage(img, src)) {
            // Normalizar URL (remover query params innecesarios)
            const normalizedUrl = src.split('?')[0];
            urls.add(normalizedUrl);
        }
    });

    return Array.from(urls);
});
```

**Impacto esperado**: Mejor confiabilidad, menos falsos negativos

---

## Plan de Implementación

### Fase 1: Optimización de Búsqueda (Soluciones 1 + Logging)

**Archivo**: `api/manhwaweb/search.js`

**Cambios**:
1. Línea 228-264: Implementar detección de convergencia
2. Agregar logging detallado
3. Reducir timeouts según sea necesario

**Tiempo esperado**: 15 minutos

**Pruebas**:
- ✅ Búsqueda de texto: "Bleach", "Attack on Titan"
- ✅ Búsqueda por filtros: solo géneros
- ✅ Búsqueda combinada: texto + filtros
- ✅ Medir tiempo de respuesta antes/después

---

### Fase 2: Mejora de Confiabilidad en Capítulos (Solución 2)

**Archivo**: `api/manhwaweb/chapters.js`

**Cambios**:
1. Línea 99-159: Implementar búsqueda de botón en cascada
2. Mejorar método de fallback
3. Agregar logging

**Tiempo esperado**: 20 minutos

**Pruebas**:
- ✅ Obra con botón visible
- ✅ Obra sin botón (fallback)
- ✅ Capítulos extraídos correctamente
- ✅ Medir tiempo antes/después

---

### Fase 3: Arreglar Carga de Imágenes (Soluciones 3 + 4)

**Archivo**: `api/manhwaweb/pages.js`

**Cambios**:
1. Línea 83-96: Implementar scroll simulado y mejor espera
2. Línea 102-124: Mejorar extracción y filtrado
3. Agregar logging

**Tiempo esperado**: 20 minutos

**Pruebas**:
- ✅ Capítulo con lazy loading
- ✅ Capítulo sin lazy loading
- ✅ Capítulo con imágenes de CDN
- ✅ Medir tiempo antes/después

---

### Fase 4: Testing Comparativo y Validación

**Pruebas Completas**:
- ❌ vs ✅ Antes/después búsqueda
- ❌ vs ✅ Antes/después capítulos
- ❌ vs ✅ Antes/después imágenes
- 📊 Comparar con TuManga e Ikigai

**Documentación**:
- Crear commit con cambios
- Actualizar historial
- Documentar lecciones aprendidas

**Tiempo esperado**: 20 minutos

---

## Validación y Testing

### Casos de Prueba para Búsqueda

```
Test 1: Búsqueda simple
├─ Query: "Bleach"
├─ Sin filtros
├─ Expected: 50+ resultados en < 8s
└─ Metric: ✅ PASS si tiempo < 8s Y resultados > 0

Test 2: Búsqueda con filtros
├─ Query: "" (vacío)
├─ Filtros: type=Manhua, status=Activo
├─ Expected: 100+ resultados en < 10s
└─ Metric: ✅ PASS si tiempo < 10s

Test 3: Búsqueda combinada
├─ Query: "Romance"
├─ Filtros: demographic=Shoujo, status=Completo
├─ Expected: 20+ resultados en < 8s
└─ Metric: ✅ PASS si tiempo < 8s

Test 4: Resultado vacío
├─ Query: "XYZnonexistent9999"
├─ Expected: 0 resultados en < 5s
└─ Metric: ✅ PASS si tiempo < 5s
```

### Casos de Prueba para Capítulos

```
Test 1: Obra con botón "Ver todo"
├─ Obra: Cualquier obra popular
├─ Expected: Todos los capítulos en < 12s
└─ Metric: ✅ PASS si tiempo < 12s

Test 2: Obra sin botón (fallback)
├─ Obra: Obra con diseño diferente
├─ Expected: Capítulos en < 15s
└─ Metric: ✅ PASS si tiempo < 15s

Test 3: Validación de números
├─ Expected: Capítulos ordenados ascendente
└─ Metric: ✅ PASS si ch[0] < ch[1] < ... < ch[n]
```

### Casos de Prueba para Imágenes

```
Test 1: Capítulo con lazy loading
├─ Expected: Imágenes cargadas en < 6s
└─ Metric: ✅ PASS si páginas > 5 Y tiempo < 6s

Test 2: Capítulo sin lazy loading
├─ Expected: Imágenes cargadas en < 5s
└─ Metric: ✅ PASS si páginas > 5 Y tiempo < 5s

Test 3: Filtrado correcto
├─ Expected: Sin logos/iconos
└─ Metric: ✅ PASS si todos los URLs son válidos

Test 4: Orden correcto
├─ Expected: Imágenes en orden correcto (left→right, top→bottom)
└─ Metric: ✅ PASS si orden lógico preservado
```

---

## Comparativa Antes/Después

### Búsqueda
```
ANTES:
├─ Mejor caso: ~10s
├─ Caso promedio: ~12s
├─ Peor caso (fallback): ~14s
└─ Vercel cold start: ~14-15s

DESPUÉS (objetivo):
├─ Mejor caso: ~5s
├─ Caso promedio: ~6-7s
├─ Peor caso: ~9s
└─ Vercel cold start: ~9-10s

Mejora: ~40-50% más rápido
```

### Capítulos
```
ANTES:
├─ Con botón: ~11s
├─ Sin botón: ~18-19s
└─ Promedio: ~14-15s

DESPUÉS (objetivo):
├─ Con botón: ~8-9s
├─ Sin botón (mejor fallback): ~12-13s
└─ Promedio: ~10-11s

Mejora: ~25-30% más rápido
```

### Imágenes
```
ANTES:
├─ Con lazy loading: ~23s (FAIL)
├─ Sin lazy loading: ~5s
└─ Promedio: ~14s

DESPUÉS (objetivo):
├─ Con lazy loading: ~6s
├─ Sin lazy loading: ~4s
└─ Promedio: ~5s

Mejora: ~60-70% más rápido (y confiable)
```

---

## Lecciones Aplicadas de TuManga e Ikigai

### De TuManga
1. ✅ Simpler is better
2. ✅ Proxy es mejor que Puppeteer cuando es posible
3. ✅ Early validation es crítica

### De Ikigai (Fase 5 del historial)
1. ✅ Detección de convergencia en loops
2. ✅ Reducir timeouts agresivamente
3. ✅ Early exit cuando se tienen suficientes resultados
4. ✅ Logging detallado para debugging
5. ✅ Múltiples selectores con fallbacks claros

### Nuevas para ManhwaWeb
1. 🆕 Scroll simulado para lazy loading
2. 🆕 XPath para búsqueda de elementos (más confiable que CSS)
3. 🆕 Normalización de URLs (remover query params)
4. 🆕 Detección por bounding rect (no solo width)

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| ManhwaWeb cambia selector del botón | Media | Alto | Mantener múltiples fallbacks |
| Scroll infinito no carga suficientes | Baja | Medio | Aumentar intentos si es necesario |
| Imágenes en otros dominios | Media | Bajo | Expandir lista de dominios |
| Vercel timeout (10s límite) | Baja | Alto | Optimizar agresivamente, monitorear |
| Cambio en estructura HTML | Baja | Alto | Mantener actualizados los selectores |

---

## Timeline y Próximos Pasos

### Ahora (Fase de Planificación - COMPLETADA)
✅ Análisis detallado de ManhwaWeb
✅ Identificación de cuellos de botella
✅ Propuesta de soluciones
✅ Plan de implementación

### Próximo (Fase de Implementación)
⏳ Implementar Solución 1: Optimizar búsqueda
⏳ Implementar Solución 2: Mejorar capítulos
⏳ Implementar Solución 3: Arreglar imágenes
⏳ Implementar Solución 4: Mejor filtrado

### Testing
⏳ Validar cada cambio independientemente
⏳ Testing integrado
⏳ Comparación antes/después

### Deploy
⏳ Crear commit
⏳ Push a repositorio
⏳ Deploy a Vercel
⏳ Monitorear en producción

---

## Observaciones Finales

### Por qué ManhwaWeb es diferente

1. **Todo con Puppeteer**: A diferencia de TuManga (proxy) e Ikigai (API), ManhwaWeb depende completamente de Puppeteer
2. **Scroll infinito**: Es la fuente principal de lentitud
3. **Lazy loading**: Las imágenes no se cargan automáticamente
4. **Interactividad requerida**: El botón "Ver todo" requiere click simulado

### ⚠️ REALIDAD DE VERCEL FREE PLAN

**Situación actual**: ALGUNOS ENDPOINTS YA FALLAN
```
├─ Search: 12-13s → ❌ FALLA (Vercel timeout a 10s)
├─ Chapters: 14-15s → ❌ FALLA (Vercel timeout a 10s)
├─ Pages: 5-14s → ⚠️ INESTABLE (a veces falla)
└─ Status: ManhwaWeb NO ES FUNCIONAL EN VERCEL FREE
```

**Esto significa**:
- Los usuarios VEN timeouts al intentar usar ManhwaWeb
- Posible que la última actualización a URLs nueva empeore esto

### Decisiones Arquitectónicas para Vercel Free

#### Opción 1: Hacer ManhwaWeb "Best Effort" (RECOMENDADO)
**Filosofía**: Entregar algo rápido, aunque incompleto

```
Search endpoint:
├─ Cargar 15-20 resultados MÁXIMO (no todos)
├─ Target time: < 7s
├─ Si no completa en tiempo, devolver lo que haya

Chapters endpoint:
├─ Cargar solo primeros 50 capítulos
├─ No expandir todo
├─ Target time: < 6s

Pages endpoint:
├─ Cargar solo primeras 5-10 imágenes
├─ No esperar lazy loading
├─ Target time: < 5s
```

**Ventajas**:
- ✅ Funciona en Vercel free
- ✅ Experiencia rápida
- ✅ Mejor que timeout/error

**Desventajas**:
- ❌ Menos completo
- ❌ Usuario puede querer más resultados

#### Opción 2: Mantener Funcionalidad Completa (NO RECOMENDADO)
**Filosofía**: Búsqueda e integración será más lenta pero completa

```
Target: Sacar todos los resultados bajo 9s
Necesita:
├─ Reducir scroll al MÍNIMO posible
├─ Timeout de fallback muy agresivo
├─ Risk: Muchos timeouts en producción
```

**Ventajas**:
- ✅ Más completo

**Desventajas**:
- ❌ Timeouts constantes
- ❌ Mala experiencia
- ❌ No vale la pena

#### Opción 3: Upgrade a Plan Pago
**Filosofía**: Pagar para tener límites reales

Vercel Pro: $20/mes
- Timeout: 60 segundos
- Ejecutar ManhwaWeb sin optimizaciones extremas

**No recomendado**: Overkill para hobby project

### Recomendación FINAL

**Usar Opción 1: Best Effort con Vercel Free**

Implementación:
```
1. Reducir scroll loops a 3 máximo
2. Early exit agresivo (20+ resultados = ok)
3. Timeout Puppeteer: 12s máximo (no 30s)
4. Fallbacks rápidos (3s máximo por método)
5. Documentar en UI que es "Best effort"
```

Timeline estimado:
```
Search:   12-13s → 5-6s ✅ (dentro del buffer)
Chapters: 14-15s → 6-7s ✅ (dentro del buffer)
Pages:    5-14s → 4-5s ✅ (dentro del buffer)
```

### Oportunidades futuras

1. **API directa**: ¿Existe una API que ManhwaWeb expone? Investigar para versión 2.0
2. **Caché inteligente**: Los capítulos no cambian, se podrían cachear
3. **Precalentamiento**: En Vercel, precalentar instancias durante horas bajas
4. **Upgrade a plan pago**: Si se pone popular, considerar upgrade

### Métricas Clave (Ajustadas para Vercel Free)

- **Búsqueda**: Target < 6s (actualmente ~12s) → **-50%**
- **Capítulos**: Target < 7s (actualmente ~14-15s) → **-50%**
- **Imágenes**: Target < 5s (actualmente ~5-23s) → **-60%**
- **Confiabilidad**: Target 95% (actualmente ~60%) → **+35%**
- **Buffer Vercel**: 1 segundo margen para emergencias

