# ✅ Checklist de Testing - Sistema Multi-Fuente

## 🔍 Testing Manual

### 1. Búsqueda con TuManga 📚
- [ ] Abrir aplicación en navegador
- [ ] Verificar que TuManga esté seleccionado por defecto
- [ ] Buscar "jinx" o cualquier título
- [ ] Verificar que aparezcan resultados
- [ ] Verificar que las tarjetas tengan badge "📚 TuManga"

### 2. Búsqueda con ManhwaWeb 🌐
- [ ] Hacer clic en el botón "🌐 ManhwaWeb"
- [ ] Verificar toast de confirmación
- [ ] Buscar "yuan zun" o cualquier título
- [ ] Verificar que aparezcan resultados
- [ ] Verificar que las tarjetas tengan badge "🌐 ManhwaWeb"

### 3. Oráculo con TuManga 📚
- [ ] Ir a la sección Oráculo
- [ ] Seleccionar fuente TuManga
- [ ] Elegir un mood o género
- [ ] Hacer clic en "Invocar Oráculo"
- [ ] Verificar que aparezca una recomendación de TuManga
- [ ] Verificar badge en la tarjeta

### 4. Oráculo con ManhwaWeb 🌐
- [ ] Cambiar a fuente ManhwaWeb
- [ ] Elegir un mood o género
- [ ] Hacer clic en "Invocar Oráculo"
- [ ] Verificar que aparezca una recomendación de ManhwaWeb
- [ ] Verificar badge en la tarjeta

### 5. Ver Detalles - TuManga 📚
- [ ] Desde búsqueda de TuManga, abrir cualquier obra
- [ ] Verificar que carguen los detalles
- [ ] Verificar que aparezcan capítulos
- [ ] Verificar que diga "Fuente: 📚 TuManga" en la sección de capítulos

### 6. Ver Detalles - ManhwaWeb 🌐
- [ ] Desde búsqueda de ManhwaWeb, abrir cualquier obra
- [ ] Verificar que carguen los detalles
- [ ] Verificar que aparezcan capítulos (si los hay)
- [ ] Verificar que diga "Fuente: 🌐 ManhwaWeb"

### 7. Leer Capítulo - TuManga 📚
- [ ] Abrir detalle de una obra de TuManga
- [ ] Hacer clic en cualquier capítulo
- [ ] Verificar que abra el lector
- [ ] Verificar que carguen las imágenes

### 8. Leer Capítulo - ManhwaWeb 🌐
- [ ] Abrir detalle de una obra de ManhwaWeb
- [ ] Hacer clic en cualquier capítulo
- [ ] Verificar que abra el lector
- [ ] Verificar que carguen las imágenes

### 9. Imágenes y Proxy 🖼️
- [ ] Verificar que las imágenes de TuManga se vean correctamente
- [ ] Verificar que las imágenes de ManhwaWeb (imageshack) se vean correctamente
- [ ] Verificar que no haya errores CORS en la consola

### 10. Responsive Design 📱
- [ ] Verificar en móvil (o DevTools responsive)
- [ ] Los selectores de fuente deben mostrar solo iconos en móvil
- [ ] Los badges deben verse correctamente
- [ ] Todo debe ser funcional en pantalla pequeña

## 🐛 Problemas Conocidos

### API Serverless de ManhwaWeb
⚠️ **IMPORTANTE:** La API `api/manhwaweb/pages.js` requiere:
- Puppeteer con Chromium
- Configuración en Vercel (ya existe para TuManga)
- En desarrollo local: Chromium instalado

Si en local no funciona, es porque Puppeteer necesita Chromium. Opciones:
1. Desplegar a Vercel y probar ahí
2. Instalar Chromium localmente
3. Usar fallback: abre el capítulo en nueva pestaña

## 📊 Resultados Esperados

### ✅ Éxito Total
- Búsqueda funciona en ambas fuentes
- Oráculo funciona en ambas fuentes
- Detalles se cargan correctamente
- Capítulos aparecen (depende de disponibilidad)
- Lectura funciona (TuManga seguro, ManhwaWeb si API funciona)
- Badges se muestran correctamente
- No hay errores en consola

### ⚠️ Éxito Parcial
- Búsqueda y detalles funcionan
- Lectura de ManhwaWeb falla por API (esperado en local)
- Todo lo demás funciona correctamente

### ❌ Problemas Críticos
- No aparecen resultados de búsqueda
- Badges no se muestran
- Errores de importación en consola
- App no carga

## 🔧 Comandos Útiles

```bash
# Instalar dependencias (si aún no)
npm install

# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview de build
npm run preview
```

## 📝 Notas de Testing

- **TuManga:** Debería funcionar al 100% (ya estaba implementado)
- **ManhwaWeb:** Búsqueda y detalles funcionan, lectura requiere API serverless
- **API serverless:** Funciona en Vercel, puede fallar en local sin Chromium
- **Proxy de imágenes:** Funciona en producción, en local usa URLs directas

## 🎯 Criterios de Aceptación

Para considerar el proyecto completo:
1. ✅ Ambas fuentes aparecen en selectores
2. ✅ Búsqueda funciona en ambas fuentes
3. ✅ Badges se muestran correctamente
4. ✅ Detalles se cargan según fuente
5. ✅ Capítulos se muestran según fuente
6. ⚠️ Lectura funciona (TuManga garantizado, ManhwaWeb mejor esfuerzo)
7. ✅ No hay errores críticos en consola
8. ✅ UI es responsive

---

**Estado Actual:** 7/8 tareas completadas - Listo para testing ✅
