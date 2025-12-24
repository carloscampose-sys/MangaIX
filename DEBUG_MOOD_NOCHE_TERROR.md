# 🔍 Debug: Mood "Noche de Terror" en ManhwaWeb

**Fecha**: 23 de diciembre de 2025
**Problema**: El mood "Noche de terror 🕯️" no muestra resultados
**Estado**: 🔍 EN INVESTIGACIÓN

---

## 🐛 Información del Error

### Console Log Actual
```
[App] Ejecutando búsqueda con página: 1
[ManhwaWeb] Buscando: "" {genres: Array(2), type: '', status: '', erotic: '', demographic: '', …}
[ManhwaWeb Service] Enviando búsqueda - Página: 1 Tipo: number
[ManhwaWeb] Encontradas 0 obras
[ManhwaWeb] Buscando: "" {}
[ManhwaWeb] Búsqueda vacía sin filtros, retornando array vacío
```

### Análisis
1. ✅ La búsqueda se ejecuta con `genres: Array(2)` (2 géneros)
2. ❌ La API retorna **0 obras**
3. ❌ Intenta buscar sin filtros pero también retorna vacío

---

## 🔧 Console Logs Agregados

He agregado logs de debugging en `App.jsx` (líneas 175-176):

```javascript
console.log('[App] Géneros seleccionados (IDs):', selectedGenres);
console.log('[App] Géneros convertidos (values):', genreValues);
```

---

## 🧪 Pasos de Debugging

### 1. Verificar Selección de Géneros

**Acción**:
1. Abrir la app
2. Seleccionar ManhwaWeb
3. Click en mood "Noche de terror 🕯️"
4. Abrir consola del navegador (F12)

**Verificar en consola**:
```
✅ Los géneros "Horror" y "Thriller" deben aparecer marcados visualmente
```

### 2. Verificar Conversión de IDs

**Acción**:
1. Con el mood seleccionado, click "Buscar"
2. Revisar consola

**Verificar logs**:
```javascript
[App] Géneros seleccionados (IDs): ["horror", "thriller"]
[App] Géneros convertidos (values): ["32", "44"]
[ManhwaWeb] Buscando: "" {genres: ["32", "44"], ...}
```

**Si los valores son diferentes**, hay un problema con la conversión.

### 3. Verificar Configuración del Mood

**Mood actual**:
```javascript
{
    name: "Noche de terror 🕯️",
    id: "fear",
    genres: ["horror", "thriller"],  // IDs string
    genreValues: ["32", "44"]        // Values API
}
```

**Verificar que**:
- ✅ Los IDs coinciden con `MANHWAWEB_GENRES`
- ✅ Los values son los correctos (Horror: 32, Thriller: 44)

### 4. Verificar Lista de Géneros

**Buscar en `manhwawebFilters.js`**:
```javascript
{ name: "Horror 💀", id: "horror", value: "32" },     // Línea 25
{ name: "Thriller 🔪", id: "thriller", value: "44" }, // Línea 36
```

**Si no están**, agregarlos.

---

## 🔍 Posibles Causas

### Causa 1: Géneros no coinciden
Los IDs en el mood no coinciden con los IDs en MANHWAWEB_GENRES.

**Solución**: Verificar que existan géneros con `id: "horror"` y `id: "thriller"`

### Causa 2: Conversión falla
La conversión de IDs a values no funciona correctamente.

**Solución**: Los logs mostrarán si la conversión está generando valores incorrectos.

### Causa 3: API no responde a esos géneros
La API de ManhwaWeb no tiene obras con esos géneros.

**Solución**: Probar manualmente en manhwaweb.com:
```
https://manhwaweb.com/library?genders=32&genders=44
```

### Causa 4: Orden de géneros
Tal vez el orden importa.

**Solución**: Invertir el orden de genreValues:
```javascript
genreValues: ["44", "32"]  // En lugar de ["32", "44"]
```

---

## 🧪 Test Manual en ManhwaWeb.com

### Horror solo
```
https://manhwaweb.com/library?genders=32
```
**¿Muestra resultados?**

### Thriller solo
```
https://manhwaweb.com/library?genders=44
```
**¿Muestra resultados?**

### Horror + Thriller
```
https://manhwaweb.com/library?genders=32&genders=44
```
**¿Muestra resultados?**

Si alguna de estas URLs NO muestra resultados en la web real, entonces los IDs 32 y 44 son incorrectos.

---

## 📋 Checklist de Verificación

- [ ] Abrir app en Vercel (producción)
- [ ] Seleccionar ManhwaWeb
- [ ] Click mood "Noche de terror 🕯️"
- [ ] Verificar géneros marcados visualmente
- [ ] Abrir consola (F12)
- [ ] Click "Buscar"
- [ ] Copiar logs completos de la consola
- [ ] Verificar valores de `selectedGenres` y `genreValues`
- [ ] Probar URLs manualmente en manhwaweb.com
- [ ] Si los IDs son incorrectos, actualizar mood con IDs correctos

---

## 🔧 Solución Temporal

Si los IDs 32 y 44 no funcionan, prueba con otros géneros de terror:

```javascript
// Opción alternativa
{
    name: "Noche de terror 🕯️",
    genres: ["horror", "psicologico"],  // Horror + Psicológico
    genreValues: ["32", "43"]
}
```

O usa solo Horror si Thriller no existe:
```javascript
{
    name: "Noche de terror 🕯️",
    genres: ["horror"],     // Solo Horror
    genreValues: ["32"]
}
```

---

## 📝 Próximos Pasos

1. **Verificar logs** en consola con los console.log agregados
2. **Probar URLs** manualmente en manhwaweb.com
3. **Confirmar IDs** correctos de Horror y Thriller
4. **Actualizar** mood con IDs verificados
5. **Re-probar** en producción

---

**Estado**: 🔍 Debugging en progreso
**Requiere**: Testing en Vercel + verificación manual en manhwaweb.com
