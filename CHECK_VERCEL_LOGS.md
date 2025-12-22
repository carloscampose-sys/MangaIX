# 🔍 Cómo Ver los Logs de Vercel

## El Problema

La búsqueda de ManhwaWeb se ejecuta pero devuelve 0 resultados:
```
[ManhwaWeb] Buscando: "yuan"
[ManhwaWeb] Encontradas 0 obras  ← Debería encontrar resultados
```

Esto significa que la API `/api/manhwaweb/search` está fallando silenciosamente.

---

## 📊 Ver Logs en Vercel

### Opción 1: Dashboard de Vercel (Más Fácil)

1. Ve a https://vercel.com/dashboard
2. Haz clic en tu proyecto
3. Ve a la pestaña **"Logs"** o **"Functions"**
4. Busca logs de `/api/manhwaweb/search`

**¿Qué buscar?**
- Errores de Puppeteer
- Timeouts
- Errores de "Cannot find module"
- Problemas con Chromium

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Ver logs en tiempo real
vercel logs --follow

# O ver logs de un deployment específico
vercel logs [deployment-url]
```

Luego:
1. Abre tu sitio
2. Busca "yuan" en ManhwaWeb
3. Ve los logs en la terminal

---

## 🐛 Posibles Problemas y Soluciones

### Problema 1: API no se desplegó

**Síntoma:** 404 Not Found en `/api/manhwaweb/search`

**Solución:**
```bash
# Verificar que el archivo existe
ls api/manhwaweb/search.js

# Si existe, hacer commit y redeploy
git add api/manhwaweb/search.js
git commit -m "ensure manhwaweb search api is deployed"
git push
```

### Problema 2: Puppeteer falla en Vercel

**Síntoma:** Error "Could not find Chrome" o timeout

**Solución:** Verificar que `package.json` tiene:
```json
{
  "dependencies": {
    "puppeteer-core": "latest",
    "@sparticuz/chromium": "latest"
  }
}
```

### Problema 3: Timeout muy corto

**Síntoma:** "Function execution timed out"

**Solución:** Aumentar timeout en `vercel.json`:
```json
{
  "functions": {
    "api/manhwaweb/search.js": {
      "maxDuration": 60
    }
  }
}
```

### Problema 4: Memory limit

**Síntoma:** "Function invocation failed" o "Out of memory"

**Solución:** Aumentar memoria en `vercel.json`:
```json
{
  "functions": {
    "api/manhwaweb/search.js": {
      "memory": 3008
    }
  }
}
```

---

## 🎯 Pasos para Debugging

### 1. Ver Logs Ahora

Ve a Vercel Dashboard → Tu proyecto → Logs

Busca errores cuando haces búsqueda.

### 2. Verificar que API Existe

Ve a: `https://tu-sitio.vercel.app/api/manhwaweb/search?query=yuan`

**Debería responder:**
```json
{
  "success": true,
  "results": [...],
  "count": 12
}
```

**Si da 404:**
- La API no se desplegó
- Verifica que `api/manhwaweb/search.js` exista

**Si da 500:**
- Hay un error en la API
- Ve los logs

### 3. Probar API Directamente

Abre en tu navegador:
```
https://tu-sitio.vercel.app/api/manhwaweb/search?query=yuan
```

Esto te mostrará el error directamente.

---

## 🔧 Fix Rápido Temporal

Si no logras ver los logs o encontrar el problema, podemos hacer esto:

**Usar solo TuManga mientras debuggeamos:**

Ya está configurado - solo usa TuManga que funciona perfecto.

ManhwaWeb se puede arreglar después sin afectar el resto.

---

## 💡 Lo Que Necesito de Ti

Para ayudarte mejor, necesito que:

1. **Intentes acceder directamente a la API:**
   ```
   https://tu-sitio.vercel.app/api/manhwaweb/search?query=yuan
   ```
   Copia lo que aparece (JSON o error)

2. **O compartas los logs de Vercel:**
   - Dashboard → Tu proyecto → Logs
   - Filtra por "manhwaweb"
   - Copia los errores que veas

Con esa info podré decirte exactamente qué está mal.

---

## 🎯 Siguiente Paso

**¿Qué prefieres?**

**A) Ver logs y debuggear ManhwaWeb**
- Te guío paso a paso

**B) Usar solo TuManga por ahora**
- Ya funciona perfecto
- ManhwaWeb se arregla después

**C) Hacer rollback**
- Volver a la versión anterior
- Quedas solo con TuManga (como antes)

Dime qué prefieres y te ayudo. 🥑✨
