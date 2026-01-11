# FAQ: Caché Inteligente para ManhwaWeb

**Preguntas frecuentes y respuestas sobre la implementación**

---

## ¿Qué es Vercel KV?

**Respuesta**: Es una base de datos Redis alojada por Vercel, integrada nativamente con tus proyectos en Vercel.

```
Simple Redis ← VERCEL KV ← Nuestro uso

Características:
├─ Tier Gratuito: 3GB
├─ Integración: 1-click en Vercel
├─ Velocidad: < 50ms acceso
├─ TTL: Soporte para expiración automática
└─ Costo: $0 (hasta límite free)
```

---

## ¿Cuánto espacio ocupará el caché?

**Respuesta**: Aproximadamente 500MB - 1GB para 500+ obras con:
- Títulos, slugs, portadas
- 50-100 capítulos por obra
- Detalles (descripción, géneros, autor)

**Cálculo estimado**:
```
Por obra (promedio):
├─ Título: 50 bytes
├─ Portada URL: 200 bytes
├─ 50 capítulos × 100 bytes: 5KB
├─ Detalles: 1KB
└─ Total por obra: ~7KB

500 obras × 7KB = 3.5MB (MUY pequeño)

Vercel KV free: 3GB
Tu uso estimado: < 100MB

Espacio disponible: 2.9GB restante ✅
```

---

## ¿Cómo se actualiza el caché?

**Respuesta**: De dos formas:

### Opción 1: GitHub Actions (Automático) ✅ RECOMENDADO

```
Cada 6 horas:
├─ GitHub dispara workflow
├─ Script ejecuta Puppeteer
├─ Scraping completo (2-3 horas)
├─ Guarda en Vercel KV
└─ Usuarios ven datos frescos
```

**Ventaja**: Completamente automático, no requiere intervención

### Opción 2: Manual

```bash
# Ejecutar cuando quieras
npm run precalc:manhwaweb
```

**Ventaja**: Control total del cuándo

---

## ¿Qué pasa si los datos en caché expiran?

**Respuesta**: El caché tiene TTL (Time To Live) de 6 horas.

```
Flujo cuando expira:
├─ Usuario busca "Bleach"
├─ API verifica caché
├─ No está (expiró)
├─ Puppeteer scrapes nuevamente
├─ Nuevo dato se guarda en caché
└─ Usuario obtiene dato fresco
```

**Tiempo esperado**:
- Primer usuario (después que expira): 12-15s
- Usuarios siguientes: < 100ms (nuevo caché)

---

## ¿Qué sucede si GitHub Actions falla?

**Respuesta**: El caché sigue sirviendo datos "viejos" (máximo 6 horas).

```
GitHub Actions falla:
├─ Caché sigue existiendo
├─ Datos no se actualizan
├─ Usuarios ven último dato (hasta 6h viejo)
├─ Pero ✅ SIN TIMEOUT
└─ Aplicación sigue funcionando

Es mejor tener datos viejos que TIMEOUT
```

**Cómo recuperarse**:
```bash
# Ejecutar manualmente
npm run precalc:manhwaweb

# O esperar a próximo ciclo (6 horas)
```

---

## ¿Vercel KV es realmente gratis?

**Respuesta**: SÍ, con límites.

```
Tier Gratuito:
├─ Almacenamiento: 3GB ✅
├─ Comandos: Ilimitados ✅
├─ Conexiones: Limitadas
├─ TTL: Soportado ✅
└─ Costo: $0 ✅

Límites realistas:
├─ Para ManhwaWeb: Ampliamente suficiente
├─ Para 10 millones de requests/mes: Sigue siendo gratis
└─ Plan Pro inicia en ~$50/mes (si creces mucho)

Conclusión: Puedes usar GRATIS indefinidamente
```

---

## ¿Cómo manejo búsquedas que no estén precalculadas?

**Respuesta**: El sistema tiene fallback automático.

```
Usuario busca "Algo-niche":
├─ ¿Está en caché? NO
├─ Puppeteer scrapes en tiempo real (12-15s)
├─ Guarda en caché
├─ Devuelve resultado al usuario
└─ Próximas búsquedas: < 100ms

Ventaja: Cubre cualquier búsqueda
Desventaja: Primera búsqueda es lenta (pero sin timeout)
```

---

## ¿Qué pasa si ManhwaWeb cambia su estructura HTML?

**Respuesta**: Los selectores CSS pueden fallar.

```
Solución:
├─ Los logs mostrarán el error
├─ Actualizar selectores en:
│  ├─ scripts/precalculate-manhwaweb.js
│  └─ api/manhwaweb/*.js
├─ Re-ejecutar precalcul
└─ Listo
```

**Tiempo de reacción**: 30 minutos (solo actualizar selectores)

---

## ¿Puedo usar otra base de datos en lugar de Vercel KV?

**Respuesta**: SÍ, pero más complejidad.

```
Alternativas:
├─ Redis Cloud (gratuito hasta límite)
├─ Supabase (PostgreSQL)
├─ Firebase Firestore
├─ MongoDB Atlas
└─ Incluso SQLite local

Razón de usar Vercel KV:
├─ Integración nativa con Vercel
├─ Cero configuración
├─ Cero costo
├─ Velocidad garantizada
└─ Recomendado
```

---

## ¿Es necesario precalcular TODO?

**Respuesta**: NO. Puedes ser selectivo.

```
Opción 1: Solo búsquedas populares
├─ "Bleach", "Naruto", "OnePiece"
├─ Primeras búsquedas: < 100ms ✅
├─ Otras búsquedas: 12-15s (pero funciona)
└─ Tiempo precalc: 30 minutos

Opción 2: Búsquedas + Top obras
├─ Búsquedas populares
├─ Top 100 obras (capítulos + detalles)
└─ Tiempo precalc: 2 horas

Opción 3: TODO
├─ Todas las búsquedas posibles
├─ Todas las obras
├─ Capítulos + detalles
└─ Tiempo precalc: 3+ horas

Recomendación: Empezar con Opción 1, escalar a 2 o 3
```

---

## ¿Cuánto tiempo toma el script de precalcul?

**Respuesta**: Depende de cantidad de obras.

```
50 obras: ~30 minutos
100 obras: ~60 minutos
500+ obras: 2-3 horas

Por qué es lento:
├─ Cada obra requiere: Navegación + Scroll + Extracción
├─ Delays entre requests (para no sobrecargar)
├─ Timeouts de seguridad
└─ Network latency

PERO: Sin límite de 10s de Vercel ✅
```

---

## ¿Cómo monitoreo si el precalcul funcionó?

**Respuesta**: Múltiples formas.

### Opción 1: Logs de GitHub Actions
```
1. Ir a: GitHub → Actions
2. Seleccionar workflow: "Precalculate ManhwaWeb Cache"
3. Ver últimas ejecuciones
4. Hacer click en run para ver logs
```

### Opción 2: Verificar Vercel KV
```
1. Ir a: Vercel Dashboard → Storage → KV
2. Ir a: Data Browser
3. Buscar claves: "manhwaweb:search:*"
4. Deberías ver múltiples keys con datos
```

### Opción 3: Verificar API
```bash
# Si está en caché, debe devolver rápido
curl "https://tu-app.vercel.app/api/manhwaweb/search?query=bleach" \
  -w "\nTime: %{time_total}s\n"

# Output con caché: Time: 0.1s
# Output sin caché: Time: 12-15s
```

---

## ¿Qué pasa si quiero pausar la precalculación?

**Respuesta**: Desactivar el workflow.

```
1. Ir a: GitHub → Settings → Actions → General
2. Seleccionar: Disable all workflows
3. O disable solo el workflow de ManhwaWeb

El caché seguirá existiendo y funcionando
Solo dejan de actualizarse los datos
```

---

## ¿Cómo limpio el caché completamente?

**Respuesta**: Vercel KV Dashboard.

```
Manual:
1. Ir a: Vercel Dashboard → Storage → KV
2. Ir a: Data Browser
3. Seleccionar todas las keys "manhwaweb:*"
4. Eliminar

O programático:
import { kvClient } from './lib/kv-client.js';
await kvClient.deletePattern('manhwaweb:*');
```

---

## ¿Cómo escalo esto después?

**Respuesta**: Opciones de escalado.

```
Cuando crescer:
├─ Más precalcul (5k+ obras): Vercel KV sigue siendo gratis
├─ Más usuarios: Redis scale bien
├─ Vercel KV se queda pequeño (> 3GB):
│  ├─ Actualizar a plan pago ($50/mes)
│  └─ O migrar a Redis Cloud / Supabase
├─ Precalcul muy lento (> 4h):
│  ├─ Ejecutar en servidor dedicado
│  └─ O distribuir en múltiples máquinas
└─ Todo escala automáticamente
```

---

## ¿Este sistema es mejor que Vercel Pro?

**Respuesta**: Depende de tus necesidades.

```
VERCEL PRO ($20/mes):
├─ Pros:
│  ├─ Cero configuración
│  ├─ Funciona para TODO (no solo ManhwaWeb)
│  ├─ Nunca timeout
│  └─ Mantenimiento mínimo
├─ Contras:
│  ├─ Requiere pago mensual
│  └─ Más caro que gratuito
└─ Mejor para: Personas sin experiencia

CACHE INTELIGENTE ($0/mes):
├─ Pros:
│  ├─ Gratis indefinidamente
│  ├─ Ultra-rápido con caché
│  ├─ Escalable
│  └─ Aprende sobre infraestructura
├─ Contras:
│  ├─ Requiere 3-4h setup
│  ├─ Datos pueden estar 6h desactualizados
│  └─ Mantenimiento ocasional
└─ Mejor para: Desarrolladores que quieren aprender

Veredicto: Si tienes tiempo → Caché. Si quieres simpleza → Pro
```

---

## Errores Comunes

### Error 1: "Cannot connect to Vercel KV"

**Causa**: Credenciales no configuradas en .env.local

**Solución**:
```bash
# Verificar que .env.local tiene:
echo $KV_URL
echo $KV_REST_API_TOKEN

# Si está vacío, copiar nuevamente del dashboard
```

---

### Error 2: "Script running forever"

**Causa**: Puppeteer se cuelga en algún sitio

**Solución**:
```javascript
// Agregar timeout global
const timeout = setTimeout(() => {
  console.error('Script timeout - aborting');
  process.exit(1);
}, 60 * 60 * 1000); // 60 minutos máximo
```

---

### Error 3: "KV quota exceeded"

**Causa**: Guardando demasiados datos

**Solución**:
```javascript
// Limitar tamaño de strings
const description = fullDescription.substring(0, 500); // Max 500 chars
```

---

## Preguntas Técnicas Avanzadas

### ¿Cómo hago invalidación inteligente de caché?

**Respuesta**: Guardar versión en metadata.

```javascript
// Cuando guardas
await kvClient.set(`manhwaweb:search:bleach`, {
  results: works,
  version: 1, // incrementar cuando cambies scraping
  timestamp: Date.now(),
});

// Cuando buscas
const cached = await kvClient.get(cacheKey);
if (cached && cached.version === EXPECTED_VERSION) {
  // Usar caché
} else {
  // Rescrapear (versión cambió)
}
```

---

### ¿Cómo agrego compresión a datos grandes?

**Respuesta**: Usar zlib.

```javascript
import zlib from 'zlib';
import { promisify } from 'util';

const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);

// Guardar comprimido
const compressed = await compress(JSON.stringify(data));
await kvClient.set(key, compressed.toString('base64'));

// Recuperar descomprimido
const base64 = await kvClient.get(key);
const buffer = Buffer.from(base64, 'base64');
const data = JSON.parse((await decompress(buffer)).toString());
```

---

### ¿Cómo monitored los tiempos de caché?

**Respuesta**: Agregar métricas.

```javascript
// En la API
const startTime = Date.now();

const cached = await kvClient.get(cacheKey);
if (cached) {
  const time = Date.now() - startTime;
  console.log(`[Caché Hit] ${cacheKey} en ${time}ms`);
  return res.json({
    ...cached,
    cacheTime: time,
    fromCache: true,
  });
}
```

---

## Conclusión

La Caché Inteligente es:
- ✅ Gratis ($0)
- ✅ Rápida (< 100ms con caché)
- ✅ Completa (100% resultados)
- ✅ Confiable (funciona en Vercel Free)
- ✅ Escalable (crece con tus necesidades)

**¿Listo para implementar?** → Ver `PLAN_CACHE_INTELIGENTE_DETALLADO.md`

