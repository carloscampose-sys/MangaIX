# Guía de Uso: Ikigai con Fuse.js

## 📖 Introducción

Esta guía explica cómo funciona el sistema de búsqueda de Ikigai en MangaIX, implementado con Fuse.js para búsqueda instantánea por título.

---

## 🎯 ¿Qué es Fuse.js?

**Fuse.js** es una biblioteca de búsqueda ligera y rápida que busca en grandes conjuntos de datos en el navegador sin necesidad de servidor.

**Características:**
- ⚡ Búsqueda instantánea (<0.1 segundos)
- 🎯 Coincidencia por similitud (no solo exacta)
- 🔍 Busca por nombre de la obra
- 💾 Funciona completamente offline después de cargar datos

---

## 🔄 Cómo Funciona la Búsqueda de Ikigai

### Flujo de Usuario

#### 1. Primer Uso (Sin Datos en Cache)

```
1. Seleccionas Ikigai como fuente
   ↓
2. Aparece barra de progreso:
   ┌─────────────────────────────────────┐
   │ 🌸 Cargando series de Ikigai     │
   │                                     │
   │ [█████░░░░░░░░░░░░░░░░] 2.5% │  ← Barra animada
   │                                     │
   │ ⏱️ Tiempo restante: 4 minutos      │
   │                                     │
   │ Series: 75   Páginas: 5/199      │
   │                                     │
   │   [✕ Cancelar carga]              │
   │                                     │
   │ 💡 Mientras tanto, puedes usar      │
   │    los filtros de género            │
   └─────────────────────────────────────┘
   ↓
3. El input de búsqueda dice:
   "Búsqueda disponible en 4 minutos"
   (deshabilitado con borde punteado)
   ↓
4. Puedes usar filtros de género
   (¡funciona instantáneamente!)
   ↓
5. La barra se actualiza cada 5-8 segundos:
   - 10% (300 series) - 3.5 min restantes
   - 25% (750 series) - 3 min restantes
   - 50% (1500 series) - 2 min restantes
   - 75% (2250 series) - 1 min restante
   - 100% (2983 series) - ¡Completado!
   ↓
6. Barra desaparece con animación
   ↓
7. Input de búsqueda se habilita
   ↓
8. ¡Puedes buscar por título! (resultados en 0.1s)
```

#### 2. Segundo Uso (Con Datos en Cache)

```
1. Seleccionas Ikigai
   ↓
2. ¡Carga instantánea! (sin barra de progreso)
   ↓
3. El input de búsqueda dice: "Busca por título..."
   (habilitado, funcional)
   ↓
4. ¡Puedes buscar inmediatamente!
```

---

## 🎨 Interfaz de Usuario

### Barra de Progreso

Cuando las series se están cargando, verás:

**Elementos visuales:**
- **Icono:** 🌸 (con animación de pulsación)
- **Título:** "Cargando series de Ikigai"
- **Barra de progreso:** Con gradiente rosa → naranja → amarillo
  - Porcentaje centrado en la barra
  - Efecto shimmer (brillo que se mueve)
- **Tiempo restante:** Actualizado dinámicamente
- **Estadísticas:**
  - Series: Número de series cargadas
  - Páginas: Páginas cargadas / total
- **Botón cancelar:** Para detener la carga
- **Sugerencia:** "💡 Mientras tanto, puedes usar los filtros de género"

### Input de Búsqueda

**Estado deshabilitado (cargando):**
```
┌─────────────────────────────────────┐
│ Búsqueda disponible en 4 minutos    │
│                                 │
│ [░░░░░░░░░░░░░░░░░░░░]        │
└─────────────────────────────────────┘
```
- Borde punteado (dashed)
- Opacidad reducida (60%)
- Cursor: "no permitido" (prohibido)
- Placeholder dinámico

**Estado habilitado (cargado):**
```
┌─────────────────────────────────────┐
│ Busca por título...               │
│                                 │
│ [______________________________]   │
└─────────────────────────────────────┘
```
- Borde sólido normal
- Opacidad 100%
- Cursor normal
- Placeholder estándar

---

## 🔍 Cómo Buscar

### Por Título (después de cargar series)

1. Escribe el nombre de la obra en el input de búsqueda
2. Presiona Enter o haz clic en "Buscar"
3. **¡Resultados en menos de 0.1 segundos!**

**Ejemplos:**
- "naruto" → Encontrará obras con "naruto" en el título
- "amor maldito" → Encontrará obras exactas o similares
- "isekai" → Encontrará todas las obras de isekai

**Nota:** La búsqueda NO es sensible a mayúsculas ni minúsculas.

### Por Filtros de Género (funciona siempre)

1. Abre los filtros (botón "Filtros")
2. Selecciona uno o más géneros (ej: Fantasía, Romance)
3. Haz clic en "Aplicar Filtros y Buscar"
4. **¡Resultados instantáneos!**

**Nota:** Los filtros de género funcionan incluso mientras las series se están cargando.

### Combinar Título + Filtros

1. Primero carga las series (esperar a que se complete)
2. Escribe el título en el input
3. Abre los filtros
4. Selecciona géneros adicionales
5. Haz clic en "Aplicar Filtros y Buscar"

**Resultado:** Busca solo por título (los filtros se aplican a la búsqueda ya filtrada).

---

## ✕ Cancelar Carga

Si no quieres esperar a que carguen todas las series:

1. Haz clic en el botón "✕ Cancelar carga"
2. Aparecerá toast: "🚫 Carga de series de Ikigai cancelada"
3. El progreso se guarda parcialmente

**¿Qué pasa cuando cancelas?**
- Las series que ya se cargaron (ej: 750 series) se guardan
- La próxima vez, la carga continúa desde donde se quedó (página 51)
- No pierdes el progreso

---

## 💾 ¿Dónde se Guardan los Datos?

### LocalStorage (Almacenamiento Principal)

**Ubicación:** DevTools → Application → Local Storage → `ikigai-series`

**Tamaño:** ~8-12MB (para las 2983 series)

**Duración:** Permanente hasta que borres cache

**Ventajas:**
- ⚡ Muy rápido
- ✅ Compatible con todos los navegadores
- 💾 Fácil de limpiar manualmente

### IndexedDB (Almacenamiento Fallback)

**Se activa automáticamente cuando:**
- localStorage está lleno
- El usuario tiene privacidad "Sólo sesión"

**Ubicación:** DevTools → Application → Indexed DB → `MangaIX-Ikigai`

**Tamaño:** Hasta ~250MB

**Duración:** Permanente hasta que borres cache

**Ventajas:**
- 📦 Mucho más espacio que localStorage
- ✅ Compatible con todos los navegadores modernos
- 💾 No se borra al cerrar navegador

---

## 🔄 Actualizar el Cache

### Manualmente (Recomendado)

Si quieres actualizar las series con las más recientes de Ikigai:

**Opción 1: Desde DevTools**
1. Abre DevTools (F12)
2. Ve a Application → Local Storage
3. Busca "ikigai-series"
4. Haz clic derecho → Delete
5. Recarga la página
6. Selecciona Ikigai → Las series se volverán a cargar

**Opción 2: Desde código (si hay botón en futuro)**
1. Haz clic en "Actualizar series de Ikigai" (botón a implementar)
2. Espera a que carguen todas las series nuevamente

### Automáticamente (Futura mejora)

Actualmente no hay actualización automática del cache. Para futuras versiones se implementará:
- Timestamp de última actualización
- TTL (Time To Live) de 24-48 horas
- Actualización automática si el cache es muy viejo

---

## ⚡ Preguntas Frecuentes

### ¿Por qué tarda 3-5 minutos la primera vez?

El servidor de Ikigai tiene 199 páginas con 15 series cada una (2983 series en total). Para respetar el límite de 10 segundos de Vercel Free Tier, cargamos en pequeños "chunks" de 5 páginas a la vez.

- 199 páginas ÷ 5 páginas/chunk = ~40 chunks
- 40 chunks × ~5-8 segundos = 3-5 minutos

**Después de la primera carga:** ¡Es instantáneo! (las series se guardan en cache).

### ¿Puedo usar la búsqueda por título mientras carga?

**NO.** Mientras carga, la búsqueda por título está deshabilitada porque Fuse.js no tiene datos suficientes.

**SÍ, puedes:**
- Usar los filtros de género (funciona instantáneamente)
- Cancelar la carga y esperar a la próxima vez

### ¿Qué pasa si cierro el navegador mientras carga?

El progreso se guarda automáticamente cada 50 páginas:
- Si cerraste en la página 75, se guardan 1125 series
- La próxima vez, la carga continúa desde la página 76
- **No pierdes progreso**

### ¿Por qué a veces aparece "localStorage lleno, usando IndexedDB"?

localStorage tiene un límite de ~5-10MB. Si tu navegador ya tiene muchos datos de otros sitios, puede llenarse. Cuando esto pasa:
- El sistema detecta automáticamente que localStorage está lleno
- Cambia a IndexedDB automáticamente
- **Funciona exactamente igual**, pero con más espacio

### ¿Cómo limpiar el cache si hay problemas?

**Opción 1: Limpiar solo Ikigai**
1. Abre DevTools (F12)
2. Ve a Application → Local Storage
3. Busca y borra: `ikigai-series` y `ikigai-partial`
4. Recarga la página

**Opción 2: Limpiar todo localStorage**
1. Abre DevTools (F12)
2. Ve a Application → Local Storage
3. Haz clic derecho → "Clear"
4. Recarga la página

**Opción 3: En modo incógnito**
1. Abre ventana de incógnito
2. Las series se cargarán desde cero
3. El cache NO se guarda en incógnito

---

## 📊 Comparación de Búsqueda

| Tipo de Búsqueda | Tiempo | Requiere Carga | Funciona sin Cache |
|-----------------|--------|----------------|-------------------|
| Por título (Fuse.js) | 0.1s | SÍ (3-5 min) | NO |
| Por filtros (API) | 2-5s | NO | SÍ |

---

## 🎯 Tips de Uso

### Tip 1: Primera vez, cargar mientras haces otras cosas

Cuando uses Ikigai por primera vez:
1. Selecciona Ikigai
2. Deja que las series se carguen en segundo plano
3. Cambia a TuManga o ManhwaWeb
4. Haz búsquedas o lee algo
5. Vuelve a Ikigai después de unos minutos
6. ¡Las series ya estarán cargadas!

### Tip 2: Usa moods para búsquedas rápidas

Los moods de Ikigai (ej: "Quiero acción", "Quiero romance") tienen géneros pre-configurados que funcionan perfectamente con la API de filtros. Úsalos para búsquedas sin título.

### Tip 3: Aprovecha la búsqueda exacta

Si buscas una obra específica y sabes el título exacto:
1. Marca el checkbox "Coincidencia Exacta"
2. Escribe el título exacto
3. Solo encontrará obras que coincidan 100%

**Nota:** La coincidencia exacta se filtra después de obtener resultados con Fuse.js.

---

## 🚧 Solución de Problemas

### Problema: "Búsqueda no disponible" siempre

**Causa:** Las series no se cargaron completamente.

**Solución:**
1. Abre DevTools → Console
2. Buscar errores: `[Ikigai]`
3. Si hay errores, limpia cache (ve arriba "¿Cómo limpiar el cache?")
4. Recarga la página

### Problema: Resultados lentos

**Causa:** Es normal, pero debería ser <0.1s.

**Solución:**
1. Si tarda más, verifica si tu navegador está lento
2. Cierra otras pestañas pesadas
3. Usa modo incógnito para probar

### Problema: No aparecen todos los resultados

**Causa:** Fuse.js usa `threshold: 0.6` (coincidencia media).

**Solución:**
1. Escribe más del título (ej: "naruto shippuden")
2. Usa filtros de género para restringir
3. O espera a que estén todas las series cargadas

---

## 📞 Soporte

Si encuentras algún problema no documentado aquí:

1. **Verifica los logs en DevTools → Console**
2. Busca: `[Ikigai]` o `[StorageManager]`
3. Toma un screenshot del error
4. Reporta el problema en GitHub o tu canal de soporte

---

## ✅ Resumen

**Búsqueda por título de Ikigai en MangaIX:**
- ⚡ Instantánea (<0.1s) después de cargar series
- 🔄 Carga progresiva en segundo plano (no bloquea)
- 💾 Cache inteligente (localStorage + IndexedDB)
- 🎯 Compatible con Vercel Free Tier
- 🎨 Interfaz amigable con progreso visible

¡Disfruta la búsqueda instantánea! 🌸
