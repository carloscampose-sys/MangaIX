# 🔧 Fix: Selectores Alternativos para API ManhwaWeb

**Fecha**: 23 de diciembre de 2025
**Problema**: Puppeteer no encuentra resultados en ManhwaWeb (mood "Noche de terror")
**Estado**: ✅ FIX APLICADO - REQUIERE TESTING

---

## 🐛 Problema Identificado

### Síntoma
El mood "Noche de terror 🕯️" (y posiblemente otros) no muestra resultados, a pesar de que:
- ✅ Los géneros se seleccionan correctamente (Horror: 32, Thriller: 44)
- ✅ La URL generada es correcta: `genders=32&genders=44`
- ✅ La web real de ManhwaWeb SÍ muestra resultados con esa URL

### Logs de Vercel
```
[ManhwaWeb Search] Debug info: {
  totalLinks: 15,
  manhwaLinks: 0,     ← ¡0 links encontrados!
  images: 1,
  bodyText: '(2 generos marcadas)'  ← Géneros SÍ están seleccionados
}
```

### Causa Raíz

El selector `a[href*="/manhwa/"]` no encuentra elementos porque:
1. ManhwaWeb cambió su estructura HTML
2. Usa una ruta diferente (ej: `/obra/` en lugar de `/manhwa/`)
3. Los resultados se cargan dinámicamente y Puppeteer no espera lo suficiente

---

## ✅ Solución Implementada

### 1. Selectores Alternativos en waitForFunction

**Antes** (línea 241-246):
```javascript
await page.waitForFunction(() => {
    const links = document.querySelectorAll('a[href*="/manhwa/"]');
    return links.length > 0;
}, { timeout: 15000 });
```

**Después**:
```javascript
await page.waitForFunction(() => {
    // Intentar múltiples selectores posibles
    const links1 = document.querySelectorAll('a[href*="/manhwa/"]');
    const links2 = document.querySelectorAll('a[href*="/obra/"]');
    const links3 = document.querySelectorAll('.element a[href]');
    return links1.length > 0 || links2.length > 0 || links3.length > 0;
}, { timeout: 20000 });  // Timeout aumentado a 20s
```

**Mejoras**:
- ✅ 3 selectores diferentes
- ✅ Timeout aumentado de 15s a 20s
- ✅ Fallback si `/manhwa/` no existe

---

### 2. Selectores Alternativos en Contador de Scroll

**Antes** (línea 277-279):
```javascript
currentCount = await page.evaluate(() => {
    return document.querySelectorAll('a[href*="/manhwa/"]').length;
});
```

**Después**:
```javascript
currentCount = await page.evaluate(() => {
    const links1 = document.querySelectorAll('a[href*="/manhwa/"]');
    const links2 = document.querySelectorAll('a[href*="/obra/"]');
    const links3 = document.querySelectorAll('.element a[href]');
    return Math.max(links1.length, links2.length, links3.length);
});
```

**Mejora**: Usa el selector que tenga más resultados

---

### 3. Selectores Alternativos en Extracción

**Antes** (línea 308):
```javascript
let cards = Array.from(document.querySelectorAll('a[href*="/manhwa/"]'))
    .filter(a => a.querySelector('img'));
```

**Después** (líneas 312-325):
```javascript
let cards = Array.from(document.querySelectorAll('a[href*="/manhwa/"]'))
    .filter(a => a.querySelector('img'));

// Si no encuentra con /manhwa/, intentar con /obra/
if (cards.length === 0) {
    cards = Array.from(document.querySelectorAll('a[href*="/obra/"]'))
        .filter(a => a.querySelector('img'));
    console.log('[ManhwaWeb Search] Usando selector /obra/, encontrados:', cards.length);
}

// Si aún no encuentra, intentar con .element
if (cards.length === 0) {
    cards = Array.from(document.querySelectorAll('.element a[href]'))
        .filter(a => a.querySelector('img'));
    console.log('[ManhwaWeb Search] Usando selector .element, encontrados:', cards.length);
}
```

**Mejora**: Intenta 3 selectores diferentes en cascada

---

### 4. Debug Mejorado

**Agregados** (líneas 297-306):
```javascript
const debugInfo = await page.evaluate(() => {
    return {
        totalLinks: document.querySelectorAll('a').length,
        manhwaLinks: document.querySelectorAll('a[href*="/manhwa/"]').length,
        obraLinks: document.querySelectorAll('a[href*="/obra/"]').length,      // NUEVO
        elementLinks: document.querySelectorAll('.element a[href]').length,    // NUEVO
        images: document.querySelectorAll('img').length,
        bodyText: document.body.innerText.substring(0, 300)  // Aumentado a 300
    };
});
```

---

## 🔍 Selectores Probados

| Selector | Descripción | Uso |
|----------|-------------|-----|
| `a[href*="/manhwa/"]` | Links que contienen `/manhwa/` | Selector original |
| `a[href*="/obra/"]` | Links que contienen `/obra/` | Alternativa 1 |
| `.element a[href]` | Links dentro de elementos con clase `.element` | Alternativa 2 |

---

## 📊 Próximos Logs Esperados

Después del fix, los logs de Vercel deberían mostrar:

```
[ManhwaWeb Search] Debug info: {
  totalLinks: 15,
  manhwaLinks: 0,      ← Si sigue en 0...
  obraLinks: X,        ← ...debería tener valores aquí
  elementLinks: Y,     ← ...o aquí
  images: 1
}
```

Si `obraLinks` o `elementLinks` > 0, entonces encontró los resultados con los selectores alternativos.

---

## 🧪 Testing Requerido

### 1. Deploy y Probar

1. Hacer push del código actualizado
2. Esperar deploy en Vercel
3. Probar mood "Noche de terror 🕯️"
4. Revisar logs de Vercel

### 2. Verificar Logs

Buscar en los logs de Vercel:
```
[ManhwaWeb Search] Usando selector /obra/, encontrados: X
```

Si aparece este mensaje, significa que encontró resultados con `/obra/` en lugar de `/manhwa/`.

---

## 💡 Posibles Escenarios

### Escenario A: ManhwaWeb usa `/obra/`
```
obraLinks: 30  ← Encuentra resultados
```
**Resultado**: Fix exitoso, usará selector `/obra/`

### Escenario B: ManhwaWeb usa `.element`
```
elementLinks: 30  ← Encuentra resultados
```
**Resultado**: Fix exitoso, usará selector `.element`

### Escenario C: Ningún selector funciona
```
manhwaLinks: 0
obraLinks: 0
elementLinks: 0
```
**Resultado**: Necesitamos investigar la estructura HTML real de ManhwaWeb

---

## 🔧 Si Aún No Funciona

Si después de este fix sigue sin encontrar resultados, necesitaremos:

1. **Screenshot de Puppeteer**: Agregar código para tomar screenshot de la página
2. **HTML raw**: Extraer el HTML completo para analizarlo
3. **Selector específico**: Identificar el selector exacto que usa ManhwaWeb

---

## 📝 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `api/manhwaweb/search.js` | Selectores alternativos en waitForFunction | 7 |
| `api/manhwaweb/search.js` | Selectores alternativos en contador | 5 |
| `api/manhwaweb/search.js` | Selectores alternativos en extracción | 14 |
| `api/manhwaweb/search.js` | Debug info mejorado | 4 |

**Total**: 1 archivo, ~30 líneas modificadas

---

## 🚀 Próximos Pasos

1. ✅ Hacer commit y push
2. ✅ Esperar deploy en Vercel
3. ✅ Probar mood "Noche de terror"
4. ✅ Revisar nuevos logs de Vercel
5. ✅ Ajustar según resultados

---

**Estado**: ✅ Fix aplicado
**Testing**: Requiere deploy a Vercel
**Probabilidad de éxito**: Alta (múltiples selectores)
