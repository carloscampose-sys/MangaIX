# 🛠️ Guía de Desarrollo Local

## ⚠️ Limitación Importante: ManhwaWeb en Local

**ManhwaWeb NO funciona en desarrollo local con Vite** porque:

1. Las APIs serverless (`/api/*`) solo funcionan en Vercel
2. Vite no puede ejecutar funciones serverless con Puppeteer
3. ManhwaWeb es una SPA que requiere Puppeteer para scraping

### ¿Qué Funciona en Local?

#### ✅ TuManga (100% funcional)
- ✅ Búsqueda
- ✅ Detalles
- ✅ Capítulos
- ✅ Lectura

#### ❌ ManhwaWeb (solo en Vercel)
- ❌ Búsqueda (requiere API `/api/manhwaweb/search`)
- ❌ Lectura (requiere API `/api/manhwaweb/pages`)

---

## 🚀 Opciones para Probar ManhwaWeb

### Opción 1: Deploy a Vercel (Recomendada ⭐)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Ventajas:**
- ✅ Todo funciona al 100%
- ✅ Configuración automática
- ✅ HTTPS gratis
- ✅ Velocidad CDN global

### Opción 2: Usar Vercel Dev (Local con APIs)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Ejecutar en modo dev (sirve las APIs serverless)
vercel dev
```

Esto ejecutará tu app en `http://localhost:3000` con las APIs funcionando.

**Ventajas:**
- ✅ APIs serverless funcionan
- ✅ ManhwaWeb funciona en local
- ✅ Simula el entorno de producción

**Desventajas:**
- ⚠️ Más lento que Vite
- ⚠️ Requiere Vercel CLI

### Opción 3: Desarrollar Solo con TuManga

```bash
# Desarrollo normal con Vite
npm run dev
```

**Para qué sirve:**
- ✅ Desarrollar features de UI
- ✅ Probar TuManga
- ✅ Rápido y ligero

**Limitaciones:**
- ❌ ManhwaWeb no funciona

---

## 📊 Comparación de Entornos

| Característica | `npm run dev`<br>(Vite) | `vercel dev`<br>(Vercel CLI) | `vercel --prod`<br>(Producción) |
|----------------|-------------|--------------|----------------|
| **Velocidad** | ⚡ Muy rápido | 🐢 Lento | ⚡ Rápido |
| **TuManga** | ✅ | ✅ | ✅ |
| **ManhwaWeb** | ❌ | ✅ | ✅ |
| **APIs Serverless** | ❌ | ✅ | ✅ |
| **Hot Reload** | ✅ | ⚠️ Limitado | N/A |
| **Requiere Internet** | No | Sí | Sí |

---

## 🎯 Flujo de Trabajo Recomendado

### 1. Desarrollo de UI y TuManga
```bash
npm run dev
```
- Desarrolla componentes
- Prueba TuManga
- Iteración rápida

### 2. Testing de ManhwaWeb
```bash
vercel dev
```
- Prueba búsqueda de ManhwaWeb
- Prueba lectura de capítulos
- Verifica integraciones

### 3. Deploy Final
```bash
vercel --prod
```
- Todo funciona
- Rendimiento óptimo
- Listo para usuarios

---

## 🔧 Configuración de Vercel CLI

### Instalación
```bash
npm i -g vercel
```

### Login
```bash
vercel login
```

### Primer Deploy
```bash
vercel
```

Sigue las instrucciones:
1. Set up and deploy? **Yes**
2. Which scope? Selecciona tu cuenta
3. Link to existing project? **No**
4. Project name? (presiona Enter para usar el actual)
5. Directory? `.` (presiona Enter)
6. Override settings? **No**

### Deploys Posteriores
```bash
# Deploy a preview
vercel

# Deploy a producción
vercel --prod
```

---

## 💡 Tips de Desarrollo

### 1. Usa TuManga para Desarrollo Rápido
Cuando desarrolles features de UI, usa TuManga porque funciona en local.

### 2. Prueba ManhwaWeb en Vercel
Antes de hacer cambios grandes en ManhwaWeb, haz un deploy de prueba:
```bash
vercel  # Deploy preview
```

### 3. Logs de Vercel
Para ver logs de las funciones serverless:
```bash
vercel logs [deployment-url]
```

### 4. Variables de Entorno
Si necesitas variables de entorno:
```bash
vercel env add
```

---

## 🐛 Problemas Comunes

### "Network Error" al buscar en ManhwaWeb

**Causa:** Estás en local con `npm run dev`

**Solución:** 
- Usa `vercel dev` en su lugar
- O despliega a Vercel

### Vercel Dev es muy lento

**Causa:** Puppeteer tarda en iniciar en cada request

**Solución:**
- Para desarrollo de UI, usa `npm run dev` con TuManga
- Solo usa `vercel dev` cuando necesites probar ManhwaWeb

### "Command not found: vercel"

**Causa:** Vercel CLI no está instalado

**Solución:**
```bash
npm i -g vercel
```

---

## 📝 Resumen

### Para Desarrollo Diario:
```bash
npm run dev  # Rápido, TuManga funciona
```

### Para Probar ManhwaWeb:
```bash
vercel dev   # Lento, pero todo funciona
```

### Para Producción:
```bash
vercel --prod  # Deploy final
```

---

## 🎓 ¿Por Qué Esta Limitación?

**Vite** es un servidor de desarrollo para frontend:
- ✅ Sirve archivos estáticos rápidamente
- ✅ Hot Module Replacement (HMR)
- ❌ NO ejecuta funciones serverless

**Vercel** ejecuta funciones serverless:
- ✅ Ejecuta Node.js en el backend
- ✅ Soporta Puppeteer
- ✅ APIs en `/api/*`

**ManhwaWeb** requiere Puppeteer porque es una SPA (Single Page Application):
- El HTML está vacío
- JavaScript carga el contenido
- Necesitas un navegador headless (Puppeteer)
- Puppeteer solo funciona en el backend (serverless functions)

---

## 🚀 Siguiente Paso

**Opción A: Desarrollar con TuManga en local**
```bash
npm run dev
```
Usa solo TuManga mientras desarrollas. ManhwaWeb lo pruebas en Vercel.

**Opción B: Deploy a Vercel ahora**
```bash
vercel --prod
```
Prueba todo en producción.

**Opción C: Instalar Vercel CLI para desarrollo completo**
```bash
npm i -g vercel
vercel dev
```

---

**Recomendación:** Si solo quieres ver que funciona, haz **Opción B** (deploy a Vercel). Es lo más rápido.

Si vas a desarrollar features nuevas, usa **Opción A** con TuManga y despliega a Vercel cuando quieras probar ManhwaWeb.
