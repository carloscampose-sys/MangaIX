# Debug: Ikigai Search Not Working

## Estado Actual
La búsqueda interactiva se ejecuta pero no aplica el filtro. Los logs muestran:
- ✓ Input encontrado
- ✓ Texto escrito
- ✓ Enter presionado
- ✗ Resultados NO filtrados (sigue mostrando resultados genéricos)

## Cambios Implementados para Debugging

### 1. Logging de Inputs
Ahora lista TODOS los inputs en la página con sus atributos:
- type
- name
- placeholder
- id
- className
- value

### 2. Screenshots
Guarda 3 screenshots en `/tmp/`:
- `ikigai-before-search.png` - Antes de buscar el input
- `ikigai-after-typing.png` - Después de escribir el texto
- `ikigai-after-search.png` - Después de presionar Enter

### 3. Múltiples Selectores
Intenta encontrar el input con 9 selectores diferentes:
```javascript
'input[type="text"]'
'input[type="search"]'
'input[placeholder*="uscar"]'
'input[placeholder*="ombre"]'
'input[name="search"]'
'input[name="query"]'
'input[name="buscar"]'
'.search-input'
'#search-input'
```

### 4. Interceptación de Red
Captura TODAS las peticiones de red que contengan:
- `/api/`
- `/search`
- `/series`

Esto nos ayudará a identificar si Ikigai usa una API interna.

### 5. Tiempos Aumentados
- Espera inicial: 5s
- Después de escribir: 2s
- Después de Enter: 10s (aumentado de 5s)

## Próximos Pasos

### 1. Hacer Push y Probar
```bash
git push
```

Espera el deploy de Vercel y busca "Amor Maldito".

### 2. Revisar Logs de Vercel
Busca en los logs:

**A. Lista de Inputs:**
```
[Ikigai Search] Inputs encontrados en la página: [...]
```
Esto te dirá qué inputs hay disponibles y cuál deberíamos usar.

**B. Selector Usado:**
```
[Ikigai Search] ✓ Input encontrado con selector: input[...]
```
Confirma qué selector funcionó.

**C. URL Después de Buscar:**
```
[Ikigai Search] URL actual después de buscar: https://...
```
Debería cambiar a `?buscar=Amor+Maldito` si la búsqueda funcionó.

**D. Peticiones de Red:**
```
[Ikigai Search] Peticiones de red capturadas: [...]
```
Puede revelar una API interna que podemos usar directamente.

### 3. Descargar Screenshots (si es posible)
Los screenshots están en `/tmp/` del contenedor de Vercel. Si tienes acceso, descárgalos para ver visualmente qué está pasando.

## Posibles Problemas y Soluciones

### Problema 1: Input Incorrecto
**Síntoma:** El selector encuentra un input pero no es el de búsqueda principal.

**Solución:** Revisar la lista de inputs y ajustar el selector para usar el correcto.

### Problema 2: Búsqueda Requiere Click en Botón
**Síntoma:** Presionar Enter no funciona, necesita click en botón de búsqueda.

**Solución:** Buscar y hacer click en el botón en lugar de presionar Enter:
```javascript
await puppeteerPage.click('button[type="submit"]');
```

### Problema 3: Ikigai Usa API Interna
**Síntoma:** Las peticiones de red muestran llamadas a `/api/search` o similar.

**Solución:** Usar la API directamente en lugar de Puppeteer:
```javascript
const response = await fetch('https://viralikigai.foodib.net/api/search', {
  method: 'POST',
  body: JSON.stringify({ query: 'Amor Maldito' })
});
```

### Problema 4: Búsqueda es Client-Side con Debounce
**Síntoma:** La URL no cambia, los resultados se filtran en el cliente.

**Solución:** Esperar más tiempo (15-20s) o buscar un evento que indique que la búsqueda terminó.

### Problema 5: Ikigai Usa Panel Lateral
**Síntoma:** El input principal no hace búsqueda, hay un panel lateral con búsqueda avanzada.

**Solución:** Abrir el panel lateral primero:
```javascript
await puppeteerPage.click('.search-panel-toggle');
await puppeteerPage.waitForSelector('.search-panel input');
```

## Alternativa: Usar el Parámetro URL Correctamente

Si descubrimos que el parámetro URL SÍ funciona pero necesita algo más (como cookies, headers, etc.), podemos:

1. Navegar a la página principal primero
2. Esperar a que se establezcan cookies/sesión
3. LUEGO navegar a la URL con `?buscar=`

```javascript
// Establecer sesión
await puppeteerPage.goto('https://viralikigai.foodib.net/');
await new Promise(resolve => setTimeout(resolve, 3000));

// Ahora navegar con búsqueda
await puppeteerPage.goto('https://viralikigai.foodib.net/series/?buscar=Amor+Maldito');
```

## Contacto con el Usuario

Una vez que tengas los logs de Vercel, compártelos aquí para que pueda analizar:
1. La lista de inputs
2. El selector que funcionó
3. La URL después de buscar
4. Las peticiones de red capturadas

Con esa información podré ajustar la estrategia.
