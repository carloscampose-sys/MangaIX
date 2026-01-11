# Resumen Crítico: ManhwaWeb en Vercel Free Plan

**Fecha**: Enero 2026
**Criticidad**: 🔴 CRÍTICA

---

## Situación Actual (Línea Base)

### Estado: FUNCIONALIDAD COMPROMETIDA

```
ManhwaWeb endpoints en Vercel Free:

✅ Search:   12-13s  → ❌ TIMEOUT (Vercel 10s limit)
✅ Chapters: 14-15s  → ❌ TIMEOUT (Vercel 10s limit)
⚠️  Pages:    5-14s  → ⚠️  INESTABLE (a veces OK, a veces timeout)

Usuario experimenta:
├─ "Error: 504 Gateway Timeout"
├─ O espera indefinida
└─ ManhwaWeb es efectivamente NO USABLE
```

### Razón Raíz

Vercel Free Plan tiene un **timeout duro de 10 segundos**. ManhwaWeb está superando este límite porque:

1. **Cold start**: 1-1.5s (Puppeteer initialization)
2. **Network overhead**: 1-2s (página ManhwaWeb es pesada)
3. **Scroll loops**: 6-8s (8 intentos × 1s cada uno)
4. **Total**: ~8.5-11.5s ⚠️ FUERA DEL LÍMITE

---

## Comparativa con Otros Servicios

### TuManga
- ✅ ~3-5 segundos (proxy CORS, sin Puppeteer)
- ✅ Funciona perfectamente en Vercel free
- ✅ No tiene problema de timeout

### Ikigai
- ✅ ~4-9 segundos después de optimización
- ✅ Funciona en Vercel free (con margen ajustado)
- ✅ Usa API + Puppeteer (híbrida)

### ManhwaWeb (Ahora)
- ❌ ~12-15 segundos (solo Puppeteer)
- ❌ FALLA en Vercel free
- ❌ NO hay margen de seguridad

---

## Opciones Disponibles

### Opción A: Best Effort (RECOMENDADO) ⭐

**Concepto**: Entregar resultados PARCIALES pero RÁPIDO

```
Search:
├─ Objetivo: 15-20 resultados (no todos)
├─ Timeout: 6 segundos
├─ Fallback: Devolver lo que cargó

Chapters:
├─ Objetivo: Primeros 50 capítulos (no expandir)
├─ Timeout: 6 segundos
├─ Fallback: Devolver lo que obtuvo

Pages:
├─ Objetivo: 5-10 imágenes (no todas)
├─ Timeout: 5 segundos
├─ Fallback: Devolver lo que cargó
```

**Cambios Necesarios**:
1. Scroll loops: 8 → 3 máximo
2. Puppeteer timeouts: 30s → 12s
3. Early exit: cuando 20+ resultados
4. Bloqueo de recursos: más agresivo

**Resultado**:
```
Search:   12-13s → 5-6s ✅ Funciona
Chapters: 14-15s → 6-7s ✅ Funciona
Pages:    5-14s → 4-5s ✅ Funciona
Buffer:   1s para emergencias ✅
```

**Ventajas**:
- ✅ Funciona confiablemente en Vercel free
- ✅ Experiencia rápida (mejor que timeout)
- ✅ Usuario entiende que es parcial
- ✅ No requiere $ adicional

**Desventajas**:
- ❌ Menos completo (15 resultados vs 100+)
- ❌ Usuario podría querer más

---

### Opción B: Mantener Completo (NO RECOMENDADO) ❌

**Concepto**: Cargar TODO pero dentro de 9s

```
Necesitaría:
├─ Scroll loops: 8 → 2 (riesgo: resultados incompletos)
├─ Timeouts: 30s → 8s (riesgo: muy agresivo)
├─ Sin fallbacks (todo o nada)
└─ Alto riesgo de fallos
```

**Resultado**:
```
Search:   12-13s → 7-8s (⚠️ frontera del timeout)
Chapters: 14-15s → 8-9s (⚠️ frontera del timeout)
Pages:    5-14s → 5-6s ✅
Buffer:   0-2s (⚠️ INSUFICIENTE)
```

**Problemas**:
- ❌ Inestable (a veces falla, a veces ok)
- ❌ Experiencia inconsistente
- ❌ Debugging difícil
- ❌ Usuarios frustrados con timeouts

---

### Opción C: Upgrade a Vercel Pro ❌

**Costo**: $20/mes

**Beneficios**:
- ✅ Timeout: 60 segundos
- ✅ No hay presión de optimización
- ✅ Mantener ManhwaWeb completo

**Problemas**:
- ❌ Costo adicional
- ❌ Hobby project no lo justifica
- ❌ Overkill

---

## RECOMENDACIÓN: Opción A (Best Effort)

### Implementación Específica

#### 1. `api/manhwaweb/search.js`

```javascript
// ANTES
const maxScrollAttempts = 8;
await page.goto(url, { timeout: 30000 });

// DESPUÉS
const maxScrollAttempts = 3;  // ← CRÍTICO
const targetResults = 20;     // ← Early exit
await page.goto(url, { timeout: 12000 });  // ← Más agresivo

// En el loop de scroll:
for (let i = 0; i < maxScrollAttempts; i++) {
    const currentCount = await page.evaluate(...);

    if (currentCount >= targetResults) {
        console.log(`[Search] Early exit: ${currentCount} results found`);
        break;  // ← SALIR TEMPRANO
    }

    // ... resto del código
}
```

**Impacto**: 8s scroll → 1.5-2s scroll

#### 2. `api/manhwaweb/chapters.js`

```javascript
// ANTES
await page.waitForFunction(..., { timeout: 15000 });

// DESPUÉS
await page.waitForFunction(..., { timeout: 8000 });  // ← CRÍTICO
const maxChapters = 50;  // ← Limit

// Salir cuando tenemos suficientes:
if (chapters.length >= maxChapters) {
    console.log(`[Chapters] Found ${maxChapters} chapters, stopping`);
    break;
}
```

**Impacto**: Fallback 10s → 6-7s máximo

#### 3. `api/manhwaweb/pages.js`

```javascript
// ANTES
await page.waitForFunction(..., { timeout: 20000 });
const targetImages = 100;  // Expectativa completista

// DESPUÉS
await page.waitForFunction(..., { timeout: 8000 });  // ← CRÍTICO
const targetImages = 5;  // ← Limit realista para Vercel

// Early exit agresivo:
if (pages.length >= targetImages) {
    console.log(`[Pages] Found ${targetImages} images, sufficient`);
    break;
}
```

**Impacto**: Timeout 20s → 5-6s máximo

#### 4. Bloqueo de Recursos (Nuevo)

```javascript
// Agregar a page.on('request'):
const url = req.url();

// Bloquear TODO lo que no sea crítico
if (url.includes('google') ||
    url.includes('analytics') ||
    url.includes('ads') ||
    url.match(/\.(css|woff|font)$/) ||  // ← CSS/fonts
    url.includes('tracking') ||
    url.includes('beacon')) {
    req.abort();
} else {
    req.continue();
}
```

**Impacto**: Reduce overhead de red ~500-800ms

---

## Timeline de Implementación

```
Total: ~1 hora

├─ 15 min: Modificar search.js (loops y timeouts)
├─ 10 min: Modificar chapters.js (timeouts y limits)
├─ 10 min: Modificar pages.js (timeouts y limits)
├─ 10 min: Agregar bloqueo de recursos
├─ 10 min: Testing básico
└─ 5 min: Commit y push
```

---

## Testing Después de Cambios

### Casos Críticos

```
✅ Test 1: Búsqueda "Bleach"
   Expected: < 6 segundos, 15-20 resultados

✅ Test 2: Obra con 200+ capítulos
   Expected: < 7 segundos, primeros 50 capítulos

✅ Test 3: Capítulo con imágenes
   Expected: < 5 segundos, 5+ imágenes

✅ Test 4: Falla de red simulada
   Expected: Devolver lo que cargó (no timeout)
```

---

## Métricas de Éxito

### Antes
```
Search availability:   ~30% (7/10 timeout)
Chapters availability: ~20% (8/10 timeout)
Pages availability:    ~60% (inconsistente)
Overall ManhwaWeb:     ❌ BROKEN
```

### Después
```
Search availability:   ✅ ~95% (en < 6s)
Chapters availability: ✅ ~95% (en < 7s)
Pages availability:    ✅ ~95% (en < 5s)
Overall ManhwaWeb:     ✅ WORKING (parcial pero funcional)
```

---

## Comunicación al Usuario

### En la UI/UX (Recomendado)

```
ManhwaWeb search results:
┌─────────────────────────────────────────┐
│ Showing first 20 results (optimized)    │ ← Transparente
│ Loading time: 5.2s                      │
│ [Show more if available...]             │
└─────────────────────────────────────────┘
```

### En el README.md (Documentar)

```markdown
## Limitaciones por Plataforma

### ManhwaWeb on Vercel Free
- Search: Limited to ~20 results (optimized for speed)
- Chapters: Shows first 50 chapters
- Images: Loads first ~5 images per chapter
- Reason: Vercel Free has 10s timeout limit

Note: This is a trade-off between speed and completeness.
If you need full functionality, consider:
1. Running locally
2. Upgrading to Vercel Pro
```

---

## Decisión Final

**✅ PROCEDER CON OPCIÓN A (Best Effort)**

Justificación:
1. ✅ Única solución que funciona en Vercel free
2. ✅ Mejor experiencia que timeouts
3. ✅ Transparente para usuario
4. ✅ Sin costo adicional
5. ✅ Mantiene ManhwaWeb usable

**No proceder con Opción B**: Demasiado riesgo de fallos
**No proceder con Opción C**: Costo injustificado en hobby project

---

## Investigación de API: Hallazgos

### ¿Existe API en ManhwaWeb? ❌ NO

**Resultado**: Se investigó completamente. ManhwaWeb es una **SPA 100% JavaScript** sin API pública expuesta.

**Evidencia**:
- HTML vacío (`<div id="root"></div>`)
- Sin endpoints `/api/`
- DevTools Network: Solo JS y analytics
- Comparación con Ikigai (que SÍ tiene API): Ikigai expone `panel.ikigaimangas.com/api/swf/series` públicamente

**Documento**: `INVESTIGACION_API_MANHWAWEB.md` (análisis completo)

### Implicación

- ✅ Ikigai tiene API → Rápido en Vercel free (~2-3s)
- ✅ TuManga usa proxies CORS → Rápido en Vercel free (~3-5s)
- ❌ **ManhwaWeb NO tiene API → Requiere Puppeteer lento (~12-15s)**

**Conclusión**: No hay atajo. Puppeteer es obligatorio. La única solución es la estrategia "Best Effort".

---

## Próximos Pasos

1. **Hoy**: Revisar documentos (plan completo + investigación)
2. **Confirmar**: ¿Proceder con estrategia Best Effort?
3. **Implementar**: 4 cambios en 3 archivos (1-2 horas)
4. **Testing**: Validar funcionamiento
5. **Deploy**: Commit y push a Vercel

**Tiempo total**: ~1-2 horas de trabajo
**Resultado**: ManhwaWeb funcional y confiable en Vercel Free ✅

