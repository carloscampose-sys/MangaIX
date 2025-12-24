# Plan de Reparación del Oráculo 🔮

## Análisis del Estado Actual

### ✅ Funcionando Correctamente
1. **UI del Oráculo** - Oracle.jsx está bien estructurado
2. **Selector de fuente** - Cambia correctamente entre TuManga y ManhwaWeb
3. **Filtros dinámicos** - Los moods y géneros cambian según la fuente seleccionada
4. **Sistema de filtros** - filterService.js proporciona los filtros correctos

### ❌ Problemas Identificados

#### Problema 1: getRandomManga de TuManga no usa filtros
**Archivo:** `src/services/tumanga.js:690-719`

```javascript
export const getRandomManga = async (genreIds = []) => {
    try {
        let searchTerm = '';

        if (genreIds.length > 0) {
            const genre = TUMANGA_GENRES.find(g => genreIds.includes(g.id));
            if (genre) {
                searchTerm = genre.searchParam; // ❌ TUMANGA_GENRES no tiene searchParam
            }
        }

        const results = await searchTuManga(searchTerm); // ❌ No usa el parámetro filters
```

**Análisis:**
- `TUMANGA_GENRES` tiene `id` (numérico) y `name`, pero NO tiene `searchParam`
- `searchTuManga` acepta `filters.genres` como array de IDs numéricos
- La función solo busca por texto en lugar de usar los filtros de género

#### Problema 2: getRandomManhwaWeb no implementado correctamente
**Archivo:** `src/services/manhwaweb.js:311-327`

```javascript
export const getRandomManhwaWeb = async (genreIds = []) => {
    try {
        // Buscar obras y seleccionar una aleatoria
        const results = await searchManhwaWeb(''); // ❌ No pasa filtros

        if (results.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManhwa = results[randomIndex];

        return await getManhwaWebDetails(randomManhwa.slug);
```

**Análisis:**
- No utiliza los `genreIds` recibidos
- Llama a `searchManhwaWeb` sin filtros
- `searchManhwaWeb` acepta `filters.genres` como array de IDs string

#### Problema 3: unifiedGetRandom no prepara los filtros correctamente
**Archivo:** `src/services/unified.js:111-126`

```javascript
export async function unifiedGetRandom(genreIds, source) {
    try {
        const service = getService(source);

        if (source === 'tumanga') {
            return await service.getRandomManga(genreIds); // ❌ Solo pasa IDs
        } else if (source === 'manhwaweb') {
            return await service.getRandomManhwaWeb(genreIds); // ❌ Solo pasa IDs
        }
```

**Análisis:**
- No convierte los genreIds en el formato correcto para cada fuente
- TuManga espera IDs numéricos en el array `filters.genres`
- ManhwaWeb espera IDs string (o values) en el array `filters.genres`

#### Problema 4: Oracle.jsx pasa datos incorrectos
**Archivo:** `src/components/Oracle.jsx:136-139`

```javascript
// Obtener géneros para la búsqueda
const genreIds = selectedMood ? selectedMood.genres : [selectedGenre];

try {
    const result = await unifiedGetRandom(genreIds, selectedSource);
```

**Análisis:**
- Para TuManga: `selectedMood.genres` contiene IDs numéricos (correcto: [1, 4])
- Para ManhwaWeb: `selectedMood.genres` contiene IDs string (ejemplo: ["drama", "tragedia"])
- Para géneros individuales: `[selectedGenre]` puede ser numérico o string
- No hay conversión de IDs a values para ManhwaWeb

---

## Solución Propuesta

### Fase 1: Corregir getRandomManga (TuManga)
**Archivo:** `src/services/tumanga.js`

**Cambios:**
```javascript
export const getRandomManga = async (genreIds = []) => {
    try {
        console.log('[TuManga] Obteniendo manga aleatorio con géneros:', genreIds);

        // Si hay géneros, buscar con filtros
        const filters = genreIds.length > 0
            ? { genres: genreIds }  // Array de IDs numéricos [1, 4, 7]
            : {};

        // Usar búsqueda con filtros (usa buildTuMangaSearchURL internamente)
        const results = await searchTuManga('', filters);

        if (results.length === 0) {
            console.log('[TuManga] No se encontraron resultados con filtros, intentando sin filtros');
            const allResults = await searchTuManga('', {});
            if (allResults.length === 0) return null;

            const randomIndex = Math.floor(Math.random() * allResults.length);
            const randomManga = allResults[randomIndex];
            return await getTuMangaDetails(randomManga.slug);
        }

        // Seleccionar uno aleatorio de los resultados filtrados
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManga = results[randomIndex];

        console.log(`[TuManga] Manga aleatorio seleccionado: ${randomManga.title}`);
        return await getTuMangaDetails(randomManga.slug);
    } catch (error) {
        console.error('[TuManga] Error getting random manga:', error);
        return null;
    }
};
```

**Explicación:**
- Ahora usa `searchTuManga` con `filters.genres`
- `buildTuMangaSearchURL` construye la URL con `c[]=1&c[]=2&c[]=3` correctamente
- Mantiene el fallback si no encuentra resultados

### Fase 2: Corregir getRandomManhwaWeb (ManhwaWeb)
**Archivo:** `src/services/manhwaweb.js`

**Cambios:**
```javascript
export const getRandomManhwaWeb = async (genreIds = []) => {
    try {
        console.log('[ManhwaWeb] Obteniendo obra aleatoria con géneros:', genreIds);

        // Convertir IDs string a values numéricos para la API
        // genreIds puede ser ["drama", "tragedia"] y necesitamos ["1", "25"]
        const genreValues = genreIds.map(id => {
            const genre = MANHWAWEB_GENRES.find(g => g.id === id);
            return genre ? genre.value : null;
        }).filter(v => v !== null);

        console.log('[ManhwaWeb] Genre values para búsqueda:', genreValues);

        // Construir filtros
        const filters = genreValues.length > 0
            ? { genres: genreValues }  // Array de values string ["1", "25"]
            : {};

        // Buscar con filtros
        const results = await searchManhwaWeb('', filters, 1);

        if (results.length === 0) {
            console.log('[ManhwaWeb] No se encontraron resultados con filtros, intentando sin filtros');
            const allResults = await searchManhwaWeb('', {}, 1);
            if (allResults.length === 0) return null;

            const randomIndex = Math.floor(Math.random() * allResults.length);
            const randomManhwa = allResults[randomIndex];
            return await getManhwaWebDetails(randomManhwa.slug);
        }

        // Seleccionar uno aleatorio
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomManhwa = results[randomIndex];

        console.log(`[ManhwaWeb] Obra aleatoria seleccionada: ${randomManhwa.title}`);
        return await getManhwaWebDetails(randomManhwa.slug);
    } catch (error) {
        console.error('[ManhwaWeb] Error obteniendo obra aleatoria:', error);
        return null;
    }
};
```

**Explicación:**
- Convierte IDs string a values numéricos usando `MANHWAWEB_GENRES`
- Pasa los values correctos a `searchManhwaWeb`
- La API de ManhwaWeb recibe los géneros correctamente

### Fase 3: Añadir importaciones faltantes
**Archivo:** `src/services/manhwaweb.js` (al inicio)

```javascript
import { MANHWAWEB_GENRES } from './manhwawebFilters';
```

**Explicación:**
- `getRandomManhwaWeb` necesita acceso a `MANHWAWEB_GENRES` para hacer la conversión
- Actualmente no está importado

### Fase 4: Mejorar Oracle.jsx para manejar géneros individuales
**Archivo:** `src/components/Oracle.jsx:129-161`

**Cambios:**
```javascript
const handleSummon = async () => {
    if (!selectedGenre && !selectedMood) return;
    setLoading(true);
    setError(null);
    setRecommendation(null);

    // Obtener géneros para la búsqueda
    let genreIds;

    if (selectedMood) {
        // Mood seleccionado - usar sus géneros directamente
        // Para TuManga: mood.genres = [1, 4] (numéricos)
        // Para ManhwaWeb: mood.genres = ["drama", "tragedia"] (strings)
        genreIds = selectedMood.genres;
    } else {
        // Género individual seleccionado
        genreIds = [selectedGenre];
        // Para TuManga: selectedGenre = 1 (numérico)
        // Para ManhwaWeb: selectedGenre = "drama" (string)
    }

    console.log('[Oracle] Invocando con géneros:', genreIds, 'Fuente:', selectedSource);

    try {
        const result = await unifiedGetRandom(genreIds, selectedSource);

        if (result) {
            setRecommendation(result);
            // Confetti de celebración
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: theme === 'dark' ? ['#FFD700', '#00BFFF', '#7B68EE'] : ['#A7D08C', '#FFFFFF', '#4FD1C5']
            });
        } else {
            setError(selectedMood
                ? "¡El Oráculo dice que esta combinación es muy exclusiva! Prueba con menos filtros 🥑"
                : "¡Tiesa! El oráculo no encontró nada por ahora, intenta otro género, potaxina.");
        }
    } catch (e) {
        console.error('Oracle error:', e);
        setError("Error de conexión con el cosmos.");
    } finally {
        setLoading(false);
    }
};
```

**Explicación:**
- Mejora los logs para debugging
- Mantiene la lógica existente pero más clara
- Los géneros ya vienen en el formato correcto según la fuente

---

## Resumen de Cambios

### Archivos a Modificar

1. **src/services/tumanga.js**
   - ✏️ Reescribir `getRandomManga` para usar `searchTuManga` con filtros
   - Líneas: 690-719

2. **src/services/manhwaweb.js**
   - ✏️ Añadir import de `MANHWAWEB_GENRES`
   - ✏️ Reescribir `getRandomManhwaWeb` para convertir IDs a values y usar filtros
   - Líneas: 1 (import), 311-327 (función)

3. **src/components/Oracle.jsx**
   - ✏️ Mejorar logs en `handleSummon` (opcional, para debugging)
   - Líneas: 129-161

### NO se modifica
- `src/services/unified.js` - Ya funciona correctamente
- `src/services/filterService.js` - Ya proporciona los datos correctos
- `src/services/manhwawebFilters.js` - Moods ya tienen la estructura correcta

---

## Flujo de Datos Correcto

### TuManga
```
Usuario selecciona Mood "Quiero llorar 😭"
↓
TUMANGA_MOODS.find(m => m.id === "cry")
  → { genres: [4, 25] } // Drama, Tragedia (IDs numéricos)
↓
Oracle.jsx: genreIds = [4, 25]
↓
unifiedGetRandom([4, 25], 'tumanga')
↓
getRandomManga([4, 25])
↓
searchTuManga('', { genres: [4, 25] })
↓
buildTuMangaSearchURL → "?title=&c[]=4&c[]=25&order_by=title&order_mode=asc&page=0"
↓
Respuesta: Array de mangas con Drama y Tragedia
↓
Selección aleatoria → getTuMangaDetails(slug)
```

### ManhwaWeb
```
Usuario selecciona Mood "Quiero llorar 😭"
↓
MANHWAWEB_MOODS.find(m => m.id === "cry")
  → { genres: ["drama", "tragedia"], genreValues: ["1", "25"] }
↓
Oracle.jsx: genreIds = ["drama", "tragedia"]
↓
unifiedGetRandom(["drama", "tragedia"], 'manhwaweb')
↓
getRandomManhwaWeb(["drama", "tragedia"])
↓
Conversión: ["drama", "tragedia"] → ["1", "25"] (usando MANHWAWEB_GENRES)
↓
searchManhwaWeb('', { genres: ["1", "25"] }, 1)
↓
API Puppeteer aplica filtros → manhwaweb.com/directorio?genero[]=1&genero[]=25
↓
Respuesta: Array de obras con Drama y Tragedia
↓
Selección aleatoria → getManhwaWebDetails(slug)
```

---

## Checklist de Implementación

### Fase 1: TuManga
- [ ] Modificar `getRandomManga` en `tumanga.js`
- [ ] Probar con mood "Quiero llorar"
- [ ] Probar con género individual "Acción"
- [ ] Verificar logs en consola

### Fase 2: ManhwaWeb
- [ ] Añadir import de `MANHWAWEB_GENRES` en `manhwaweb.js`
- [ ] Modificar `getRandomManhwaWeb` con conversión de IDs
- [ ] Probar con mood "Quiero llorar"
- [ ] Probar con género individual "Drama"
- [ ] Verificar logs en consola

### Fase 3: Verificación
- [ ] Cambiar entre fuentes y verificar que los moods cambian
- [ ] Probar todos los moods de TuManga (5 moods)
- [ ] Probar todos los moods de ManhwaWeb (6 moods)
- [ ] Probar géneros individuales en ambas fuentes
- [ ] Verificar que el confetti aparece al invocar
- [ ] Verificar que el modal de detalles funciona
- [ ] Probar añadir a biblioteca desde el oráculo

---

## Notas Técnicas

### Estructura de Moods

**TuManga:**
```javascript
{
    name: "Quiero llorar 😭",
    id: "cry",
    genres: [4, 25],  // ✅ IDs numéricos
    toast: "Busca los pañuelos...",
    color: "from-blue-400 to-blue-600"
}
```

**ManhwaWeb:**
```javascript
{
    name: "Quiero llorar 😭",
    id: "cry",
    genres: ["drama", "tragedia"],  // ✅ IDs string (para mostrar)
    genreValues: ["1", "25"],       // ✅ Values para API
    toast: "Busca los pañuelos...",
    color: "from-blue-400 to-blue-600"
}
```

### Diferencias Clave
- **TuManga**: IDs numéricos directos, usados tal cual
- **ManhwaWeb**: IDs string para UI, values numéricos para API
- La conversión ID → value se hace en `getRandomManhwaWeb`

---

## Casos de Prueba

1. **TuManga + Mood:**
   - Seleccionar "Quiero llorar 😭" → Debe invocar con Drama + Tragedia

2. **TuManga + Género:**
   - Seleccionar "Acción 💥" → Debe invocar con solo Acción

3. **ManhwaWeb + Mood:**
   - Seleccionar "Poder sin límites ⚡" → Debe invocar con Sistema + Cultivación + Reencarnación

4. **ManhwaWeb + Género:**
   - Seleccionar "Drama 🎭" → Debe invocar con solo Drama

5. **Cambio de fuente:**
   - Cambiar de TuManga a ManhwaWeb → Moods deben actualizarse
   - Recomendación anterior debe limpiarse

---

## Próximos Pasos

Una vez implementado este plan:
1. ✅ El oráculo funcionará con filtros correctos
2. ✅ Respetará la fuente seleccionada
3. ✅ Los moods generarán obras con los géneros correctos
4. ✅ Los géneros individuales también funcionarán
5. ✅ Habrá logs detallados para debugging
