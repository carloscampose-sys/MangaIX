# ⚡ Notas de Performance - ManhwaWeb

## 🐢 Problema Identificado

**ManhwaWeb es LENTO** (~30-60 segundos de búsqueda) porque:

1. **Puppeteer overhead:** Iniciar navegador headless (~5-10s)
2. **Navegar a página:** Cargar /library (~5-10s)
3. **Interacción:** Buscar input, escribir, Enter (~3-5s)
4. **Esperar resultados:** JavaScript carga contenido (~10-20s)
5. **Extracción:** Parsear y devolver datos (~2-5s)

**Total:** 30-60 segundos 😢

---

## ⚡ Optimizaciones Implementadas

### 1. **Timeouts Reducidos**
- Espera de resultados: 30s → 15s
- Lazy loading: 3s → 1.5s
- Después de Enter: 3s → 2s

### 2. **Typing Más Rápido**
- Delay entre teclas: 100ms → 50ms

### 3. **Umbral Más Bajo**
- Esperar 5 enlaces → 3 enlaces
- Empieza a procesar antes

### 4. **Toast Informativo**
- Usuario sabe que tardará
- Expectativas claras

---

## 📊 Comparación

| Fuente | Tiempo de Búsqueda | Por Qué |
|--------|-------------------|---------|
| **TuManga** | ~2-5 segundos ⚡ | HTML directo, no requiere Puppeteer |
| **ManhwaWeb** | ~20-40 segundos 🐢 | Puppeteer + SPA + Interacción |

---

## 💡 Mejoras Futuras Posibles

### Opción 1: Caché (Recomendada ⭐)
- Cachear búsquedas comunes
- Reducir llamadas a Puppeteer
- Complejidad: Media

### Opción 2: Pre-calentamiento
- Mantener navegador de Puppeteer activo
- No aplicable en Vercel Serverless
- Complejidad: Alta

### Opción 3: API Alternativa
- Buscar si ManhwaWeb tiene API interna
- Hacer reverse engineering
- Complejidad: Alta, puede violar ToS

### Opción 4: Cambiar de Fuente
- Buscar fuente más rápida
- MangaDex tiene API oficial ⚡
- LectorManga es HTML directo ⚡
- Complejidad: Media

---

## 🎯 Recomendación

### Para Producción Actual:

**Mantener ambas fuentes:**
- ✅ TuManga: Rápido, para búsquedas normales
- ⚠️ ManhwaWeb: Lento, pero funciona (usuario informado con toast)

**UX:**
```
Usuario selecciona fuente:
├─ 📚 TuManga
│  └─ "Búsqueda rápida ⚡"
└─ 🌐 ManhwaWeb
   └─ "Puede tardar ~30s ⏱️"
```

### Para Futuro:

**Opción A:** Agregar tercera fuente rápida
- MangaDex (API oficial)
- LectorManga (HTML directo)
- Dar más opciones al usuario

**Opción B:** Implementar caché
- Cachear búsquedas populares
- Reducir llamadas a Puppeteer

---

## 📝 Notas Técnicas

### Por Qué Puppeteer Es Lento

**Vercel Serverless:**
```
Cold Start (primera vez):
├─ Iniciar container          ~1-2s
├─ Instalar Chromium          ~3-5s
├─ Iniciar Puppeteer          ~2-3s
├─ Navegar y scrappear        ~15-30s
└─ Total                       ~20-40s

Warm Start (si hay tráfico):
├─ Container ya activo         0s
├─ Chromium ya instalado       0s
├─ Iniciar Puppeteer          ~2-3s
├─ Navegar y scrappear        ~15-30s
└─ Total                       ~17-33s
```

**No hay mucho que optimizar** más allá de lo ya hecho.

---

## 🔮 Conclusión

**ManhwaWeb funciona**, pero es inherentemente lento por ser:
1. Una SPA compleja
2. Requerir Puppeteer
3. Ejecutarse en serverless (cold starts)

**Soluciones realistas:**
1. ✅ **Mantener con advertencia** (toast informativo)
2. ✅ **Agregar fuente rápida** alternativa
3. ❌ NO se puede hacer mucho más rápido sin cambios arquitectónicos mayores

---

**Recomendación final:** Mantener ambas, pero considerar agregar una tercera fuente (MangaDex o LectorManga) que sea rápida como TuManga.
