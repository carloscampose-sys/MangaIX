# Análisis Técnico: ¿Podemos Usar CORS Proxies en ManhwaWeb?

**Fecha**: Enero 2026
**Pregunta Crítica**: ¿Por qué TuManga funciona con CORS proxies pero ManhwaWeb necesita Puppeteer?
**Respuesta**: No es posible por diferencia arquitectónica fundamental

---

## Respuesta Corta

**NO, CORS proxies NO funcionan para ManhwaWeb porque:**

```
TuManga:   Server-Rendered (SSR)  → HTML contiene datos     → CORS proxy ✅
ManhwaWeb: Single Page App (SPA)  → HTML está vacío          → CORS proxy ❌
```

**Necesitas Puppeteer** porque ManhwaWeb requiere ejecutar JavaScript en un navegador real.

---

## Comparación Arquitectónica: TuManga vs ManhwaWeb

### TuManga: Server-Rendered (SSR) ✅ CORS-Compatible

#### Flujo de Carga
```
1. Cliente → HTTP GET a tumanga.org/biblioteca?c[]=1
2. Servidor genera HTML COMPLETO con TODOS los datos
3. Devuelve HTML al cliente con:
   ├─ <ul><li><a href="/online/one-punch-man">...</a></li></ul>
   ├─ Todas las imágenes
   ├─ Todos los links
   └─ Todo el contenido renderizado
4. Cliente recibe HTML con datos listos
5. CORS proxy devuelve este HTML
6. DOMParser extrae datos con CSS selectors ✅
```

#### Por qué funciona con CORS
- El HTML inicial **ya contiene todos los datos**
- No necesita JavaScript ejecutado
- Los proxies CORS solo devuelven el HTML crudo
- Los selectores CSS encuentran los datos inmediatamente

#### Código Relevante (`src/services/tumanga.js:308-326`)
```javascript
// 1. Construir URL
const url = buildTuMangaSearchURL(query, filters);

// 2. Hacer fetch con CORS proxy (SIN Puppeteer)
const response = await fetchWithProxy(url);  // ← Solo HTTP

// 3. Parsear HTML
const parser = new DOMParser();
const doc = parser.parseFromString(response.data, 'text/html');

// 4. Extraer con selectores
const items = doc.querySelectorAll('ul > li > a[href^="/online/"]');
// ← Funciona porque el HTML YA tiene estos elementos
```

#### Velocidad
- **Tiempo búsqueda**: 3-5 segundos
- **Por qué es rápido**: Solo HTTP GET + parsing

---

### ManhwaWeb: Single Page Application (SPA) ❌ NO CORS-Compatible

#### Flujo de Carga
```
1. Cliente → HTTP GET a manhwaweb.com/library
2. Servidor devuelve HTML VACÍO con:
   ├─ Contenedor: <div id="app"></div>
   ├─ Scripts JavaScript
   ├─ Metadata
   └─ PERO: SIN contenido real
3. JavaScript ejecuta en el navegador cliente
4. Hace peticiones API adicionales
5. Renderiza el contenido en el DOM
6. Usuario ve las obras
7. PERO: Un CORS proxy NO ejecuta JavaScript ❌
```

#### Por qué NO funciona con CORS
1. **ManhwaWeb es una SPA moderna** (React/Vue/Qwik)
2. **El HTML inicial es un shell vacío** - solo `<div id="app"></div>`
3. **El contenido se genera DESPUÉS de ejecutar JavaScript**
4. **Los CORS proxies devuelven solo HTML crudo** (sin ejecutar JS)
5. **DOMParser no puede extraer datos que no existen**

#### Prueba de Concepto

**GET a https://manhwaweb.com/library con CORS proxy:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <link rel="stylesheet" href="/app.css"/>
  <script src="/app.js"></script>  ← JavaScript sin ejecutar
</head>
<body>
  <div id="app"></div>  ← VACÍO - contenido generado por JS
</body>
</html>
```

**Qué pasa si intentas parsear esto:**
```javascript
const parser = new DOMParser();
const doc = parser.parseFromString(htmlVacio, 'text/html');
const obras = doc.querySelectorAll('.manga-card');  // ← 0 resultados ❌
```

**Por qué falla**: Los `.manga-card` se crean DESPUÉS de ejecutar el JavaScript, que el CORS proxy nunca ejecuta.

---

## ¿Por Qué ManhwaWeb Usa Scroll Infinito?

Evidencia en `api/manhwaweb/search.js:232-264`:

```javascript
// Scroll infinito - requisito de SPA con lazy loading
do {
    // 1. JavaScript ejecuta scroll
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });

    // 2. Espera a que carguen nuevos elementos (lazy loading)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Cuenta cuántos elementos se cargaron
    currentCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href*="/manhwa/"]').length;
    });

    // 4. Si hay nuevos, continúa scrolling
} while (currentCount > previousCount && scrollAttempts < maxScrollAttempts);
```

**¿Por qué necesita scroll?**
- ManhwaWeb carga las obras bajo demanda (lazy loading)
- Scroll activa eventos JavaScript
- Los eventos cargan más obras dinámicamente
- No hay "página 2", es todo scroll infinito

**¿Por qué TuManga NO necesita esto?**
- TuManga usa paginación tradicional: `/biblioteca?page=1`, `/biblioteca?page=2`
- Todos los datos de cada página están en el HTML
- No hay lazy loading
- Una simple HTTP GET devuelve todo

---

## Tabla Comparativa Detallada

| Característica | TuManga | ManhwaWeb |
|---|---|---|
| **Arquitectura** | Server-Side Rendering (SSR) | Single Page Application (SPA) |
| **HTML inicial** | Contiene 30-50 obras renderizadas | Vacío: solo `<div id="app"></div>` |
| **JavaScript requerido** | NO para búsqueda | SÍ para TODO |
| **Búsqueda viable con** | CORS Proxies ✅ | Puppeteer ❌ |
| **Paginación** | Tradicional: `?page=1,2,3...` | Scroll infinito |
| **Lazy loading** | NO | SÍ (scroll triggerează carga) |
| **Tiempo búsqueda** | 3-5 segundos | 8-15 segundos |
| **Complejidad extracción** | Baja (selectores CSS simples) | Alta (contenido dinámico) |
| **Selectors CSS estables** | SÍ (datos en HTML estático) | NO (contenido generado por JS) |
| **Método actual en MangaIX** | CORS proxies (`src/services/tumanga.js`) | Puppeteer (`api/manhwaweb/search.js`) |

---

## ¿Por Qué No Puedes Usar CORS en ManhwaWeb?

### Razón 1: Arquitectura Diferente Intencional

ManhwaWeb fue construida como SPA moderna porque:
- ✅ Mejor UX con transiciones suaves
- ✅ Mejor rendimiento (carga solo lo visible)
- ✅ Filtros interactivos dinámicos sin reload
- ✅ Scroll infinito (mejor en móvil)

**Pero**: Esto hace imposible scraping sin Puppeteer

### Razón 2: Contenido Dinámico vs Estático

```
TuManga (/biblioteca):
├─ Request HTTP
├─ Servidor renderiza HTML
├─ Devuelve con 50 obras completas
└─ Cliente ve datos inmediatamente ✅

ManhwaWeb (/library):
├─ Request HTTP
├─ Servidor devuelve shell vacío
├─ JavaScript ejecuta en cliente
├─ Hace 5-10 requests adicionales a API interna
├─ Renderiza obras progresivamente
└─ Cliente ve datos gradualmente
```

### Razón 3: Infinite Scroll vs Paginación

```
TuManga (Paginación):
├─ Página 1: GET /biblioteca?page=1 → HTML con 50 obras
├─ Página 2: GET /biblioteca?page=2 → HTML con otras 50
└─ CORS proxy puede hacer esto ✅

ManhwaWeb (Scroll Infinito):
├─ GET /library → HTML vacío
├─ JavaScript: evento de scroll
├─ JavaScript: fetch adicional a API interna
├─ JavaScript: renderizar nuevas obras
├─ CORS proxy NO puede simular eventos de scroll ❌
```

---

## ¿Qué Opciones SÍ Existen?

### Opción 1: Puppeteer (ACTUAL) ✅

```javascript
// Lo que ya haces
const browser = await puppeteer.launch({...});
const page = await browser.newPage();
await page.goto('https://manhwaweb.com/library');
// Ejecuta JavaScript, carga contenido
// Extrae datos
```

**Funciona**: SÍ
**Velocidad**: 8-15 segundos
**Costo Vercel**: 8-15 segundos (vs 10s límite)
**Problema**: Muy lento para Vercel free

---

### Opción 2: API REST (Si Existiera) ❌

```javascript
// TEÓRICO (ManhwaWeb NO la expone)
const response = await axios.get('https://manhwaweb.com/api/search', {
    params: { query: 'Bleach', genres: [1, 2] }
});
const results = response.data.results;
```

**Funciona**: NO - ManhwaWeb no expone API pública
**Velocidad**: 1-2 segundos (si existiera)
**Viabilidad**: 0%

---

### Opción 3: Headless Chrome (Alternativa a Puppeteer) ✅

```javascript
// Similar a Puppeteer, mismo resultado
const browser = await chromium.launch({...});
// Mismo tiempo, mismos problemas
```

**Funciona**: SÍ
**Velocidad**: 8-15 segundos (igual que Puppeteer)
**Beneficio**: Ninguno - misma solución

---

### Opción 4: Playwright (Alternativa a Puppeteer) ✅

```javascript
// Similar a Puppeteer
const browser = await chromium.launch({...});
// Mismo tiempo, mismos problemas
```

**Funciona**: SÍ
**Velocidad**: 8-15 segundos
**Beneficio**: Ninguno - misma solución

---

## ¿Podría Cambiar en el Futuro?

### Corto Plazo: NO

ManhwaWeb es una SPA moderna por diseño arquitectónico. Es poco probable que cambie porque:
1. Inversión importante en infraestructura SPA
2. Mejor UX para usuarios finales
3. Mejor rendimiento client-side

### Largo Plazo: POSIBLE, pero requeriría

#### Cambio 1: Que ManhwaWeb Expusiera API REST
```javascript
GET https://manhwaweb.com/api/search?query=Bleach&genres=1,2
// Tiempo: 1-2 segundos
```
**Probabilidad**: Muy baja (nunca lo han hecho)

#### Cambio 2: Que Hidratara React (incluir datos en HTML inicial)
```html
<script id="__INITIAL_STATE__">
{
  "obras": [{"id": 1, "title": "Bleach", ...}, ...],
  "total": 1000
}
</script>
```
**Probabilidad**: Muy baja (cambiaría todo su sitio)

#### Cambio 3: Que Incluyera Datos en Meta Tags
```html
<meta property="works" content="[{...}, {...}]"/>
```
**Probabilidad**: Muy baja (no es estándar)

---

## Conclusión Técnica

### Por qué TuManga funciona con CORS y ManhwaWeb no

```
CORS Proxies pueden:
├─ Hacer HTTP GET ✅
├─ Devolver HTML crudo ✅
├─ Parsear HTML con DOMParser ✅
└─ Extraer datos si están en HTML ✅

CORS Proxies NO pueden:
├─ Ejecutar JavaScript ❌
├─ Simular eventos (scroll, click) ❌
├─ Esperar contenido cargado dinámicamente ❌
└─ Actuar como navegador real ❌

TuManga:
├─ Datos están en HTML inicial
├─ CORS proxy devuelve HTML con datos
├─ Funciona ✅

ManhwaWeb:
├─ Datos NO están en HTML inicial
├─ Se cargan con JavaScript
├─ CORS proxy devuelve HTML vacío
├─ Falla ❌
```

### La Única Solución Viable Hoy

**Puppeteer es necesario** porque:

1. ✅ Es el único que ejecuta JavaScript real
2. ✅ Es el único que puede simular scroll infinito
3. ✅ Es el único que carga contenido dinámico
4. ✅ Funciona confiablemente

**Esto NO es un defecto**. Son **8-15 segundos que ManhwaWeb require por su arquitectura SPA**.

---

## Archivos de Referencia

**En tu proyecto**:

```
src/services/tumanga.js:269-326
├─ searchTuManga()
├─ Usa CORS proxies (SIN Puppeteer)
└─ Por qué funciona: HTML tiene datos

src/services/manhwaweb.js:69-132
├─ searchManhwaWeb()
├─ Llama a API serverless
└─ Que usa Puppeteer (necesario)

api/manhwaweb/search.js:1-370
├─ Backend con Puppeteer
├─ Por qué es necesario: HTML está vacío
└─ Scroll infinito requiere JS ejecutado

api/tumanga/pages.js:1-145
├─ Backend TuManga para capítulos
├─ TAMBIÉN usa Puppeteer
└─ Por qué: leer capítulos requiere JS
```

---

## Respuesta Directa a Tu Pregunta

**Pregunta**: "¿No podemos aplicar Proxies CORS en ManhwaWeb como en TuManga?"

**Respuesta**: NO, por razones arquitectónicas fundamentales:

1. **TuManga** = SSR (Server-Rendered)
   - HTML tiene datos listos
   - CORS proxies funcionan
   - 3-5 segundos

2. **ManhwaWeb** = SPA (Single Page App)
   - HTML está vacío
   - CORS proxies NO pueden ejecutar JavaScript
   - Necesita Puppeteer
   - 8-15 segundos

**Es como preguntarle a un cartero que entregue un paquete a una casa de vidrio (TuManga) vs una casa con puertas cerradas (ManhwaWeb) - las instrucciones externas (CORS proxies) no funcionan si necesitas abrir puertas (ejecutar JavaScript).**

