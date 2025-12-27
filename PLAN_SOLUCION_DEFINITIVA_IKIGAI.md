# Plan de Solución Definitiva: Búsqueda en Ikigai

## Análisis del Problema

### Evidencia de los Logs
```
✓ Input encontrado: input[type="search"] con placeholder "Buscar..."
✓ Texto escrito: "Amor Maldito"
✓ Enter presionado
✗ URL NO cambió: sigue siendo /series/ (sin ?buscar=)
✗ NO hay peticiones de red adicionales
✗ Resultados NO filtrados
```

### Conclusión
El input que estamos usando **NO está conectado a la funcionalidad de búsqueda**. Es probablemente:
1. Un input decorativo/placeholder
2. Parte de un panel lateral que no está visible
3. Requiere abrir un modal/drawer primero

## Estrategias a Probar (en orden)

---

## ESTRATEGIA 1: Buscar y Abrir Panel/Modal de Búsqueda

### Hipótesis
El input visible es un "trigger" que abre un panel lateral o modal con la búsqueda real.

### Implementación
```javascript
// 1. Buscar elementos que puedan abrir el panel de búsqueda
const searchTriggers = [
  'button[aria-label*="search"]',
  'button[aria-label*="buscar"]',
  '.search-trigger',
  '.search-button',
  '[data-search-trigger]',
  'button:has(svg)' // Botón con icono de búsqueda
];

// 2. Hacer click en el trigger
for (const trigger of searchTriggers) {
  const element = await page.$(trigger);
  if (element) {
    await element.click();
    await new Promise(r => setTimeout(r, 2000));
    break;
  }
}

// 3. Buscar el input DENTRO del panel abierto
const panelInput = await page.waitForSelector('.modal input, .drawer input, .panel input');
await panelInput.type('Amor Maldito');
await page.keyboard.press('Enter');
```

### Indicadores de Éxito
- URL cambia a `?buscar=Amor+Maldito`
- Aparecen peticiones de red adicionales
- Resultados filtrados

---

## ESTRATEGIA 2: Usar el Parámetro URL Directamente (con Cookies)

### Hipótesis
El parámetro `?buscar=` funciona pero requiere cookies/sesión establecida primero.

### Implementación
```javascript
// 1. Establecer sesión navegando a la página principal
await page.goto('https://viralikigai.foodib.net/');
await new Promise(r => setTimeout(r, 3000));

// 2. Navegar a la URL con búsqueda
await page.goto('https://viralikigai.foodib.net/series/?buscar=Amor+Maldito');
await new Promise(r => setTimeout(r, 8000));

// 3. Extraer resultados
```

### Indicadores de Éxito
- Resultados contienen "Amor" en los títulos
- Paginación muestra `?buscar=Amor+Maldito&pagina=2`

---

## ESTRATEGIA 3: Buscar Botón de Búsqueda (en lugar de Enter)

### Hipótesis
El input requiere hacer click en un botón de búsqueda, no presionar Enter.

### Implementación
```javascript
// 1. Escribir en el input
await page.type('input[type="search"]', 'Amor Maldito');

// 2. Buscar botón de búsqueda cercano
const searchButtons = [
  'button[type="submit"]',
  'button[aria-label*="search"]',
  'button[aria-label*="buscar"]',
  'input[type="search"] + button',
  'input[type="search"] ~ button'
];

// 3. Hacer click en el botón
for (const selector of searchButtons) {
  const button = await page.$(selector);
  if (button) {
    await button.click();
    await new Promise(r => setTimeout(r, 10000));
    break;
  }
}
```

### Indicadores de Éxito
- URL cambia
- Resultados filtrados

---

## ESTRATEGIA 4: Inspeccionar el DOM para Encontrar el Input Real

### Hipótesis
Hay múltiples inputs de búsqueda y estamos usando el incorrecto.

### Implementación
```javascript
// 1. Listar TODOS los inputs de búsqueda con su contexto
const searchInputs = await page.evaluate(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="uscar"]'));
  return inputs.map((input, i) => {
    const parent = input.parentElement;
    const form = input.closest('form');
    return {
      index: i,
      type: input.type,
      placeholder: input.placeholder,
      className: input.className,
      parentTag: parent?.tagName,
      parentClass: parent?.className,
      formAction: form?.action || null,
      isVisible: input.offsetParent !== null,
      hasSubmitButton: form?.querySelector('button[type="submit"]') !== null
    };
  });
});

console.log('Inputs de búsqueda encontrados:', searchInputs);

// 2. Usar el input que esté dentro de un form con action o que tenga botón submit
const correctInput = searchInputs.find(i => i.formAction || i.hasSubmitButton);
```

### Indicadores de Éxito
- Identificamos el input correcto
- La búsqueda funciona

---

## ESTRATEGIA 5: Usar API Interna de Ikigai (si existe)

### Hipótesis
Ikigai tiene una API REST/GraphQL que podemos usar directamente.

### Implementación
```javascript
// 1. Capturar TODAS las peticiones de red mientras navegamos manualmente
// (esto requiere que tú busques manualmente en el sitio real)

// 2. Identificar el endpoint de búsqueda
// Ejemplo: POST https://viralikigai.foodib.net/api/search

// 3. Usar fetch directamente
const response = await fetch('https://viralikigai.foodib.net/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'Amor Maldito',
    page: 1
  })
});

const data = await response.json();
```

### Indicadores de Éxito
- Obtenemos resultados directamente de la API
- No necesitamos Puppeteer

---

## ESTRATEGIA 6: Deshabilitar Búsqueda por Título en Ikigai

### Hipótesis
La búsqueda por título en Ikigai es demasiado compleja y no vale la pena.

### Implementación
```javascript
// En el frontend (App.jsx)
if (selectedSource === 'ikigai' && searchTerm) {
  showToast('⚠️ Ikigai no soporta búsqueda por título. Usa filtros de género.');
  return;
}
```

### Pros
- Solución inmediata
- Evita frustración del usuario

### Contras
- Funcionalidad limitada
- Ikigai solo serviría para búsqueda por géneros

---

## Plan de Ejecución

### Fase 1: Investigación Manual (TÚ)
**Tiempo estimado: 10 minutos**

1. Abre https://viralikigai.foodib.net/series/ en tu navegador
2. Abre DevTools (F12) → Network tab
3. Busca "Amor Maldito" manualmente en el sitio
4. Observa:
   - ¿Se abre un panel/modal?
   - ¿Qué peticiones de red se hacen?
   - ¿La URL cambia?
   - ¿Hay un botón de búsqueda o solo Enter?

5. Comparte:
   - Screenshots del proceso
   - Peticiones de red capturadas
   - URL final después de buscar

### Fase 2: Implementación (YO)
**Tiempo estimado: 30 minutos**

Basado en tu investigación, implementaré la estrategia correcta.

### Fase 3: Testing
**Tiempo estimado: 10 minutos**

Probar con:
- "Amor Maldito"
- "Jinx"
- "¡El Héroe De Nivel Máximo Ha Retornado!"

---

## Alternativa Rápida: Usar Solo Géneros

Si la investigación muestra que la búsqueda por título es muy compleja, podemos:

1. Deshabilitar búsqueda por título en Ikigai
2. Mostrar mensaje al usuario
3. Mantener solo búsqueda por géneros (que ya funciona)

```javascript
// En App.jsx
if (selectedSource === 'ikigai' && searchTerm && !selectedGenres.length) {
  showToast('🔍 Ikigai: Usa filtros de género para buscar. La búsqueda por título no está disponible.');
  return;
}
```

---

## Decisión

**¿Qué prefieres?**

**Opción A:** Investigar manualmente (10 min) y luego implementar la solución correcta (30 min)
- Pros: Búsqueda por título funcionará
- Contras: Requiere tu tiempo de investigación

**Opción B:** Deshabilitar búsqueda por título en Ikigai ahora mismo (5 min)
- Pros: Solución inmediata, sin más debugging
- Contras: Funcionalidad limitada

**Opción C:** Implementar Estrategia 2 (URL con cookies) sin investigación (15 min)
- Pros: Puede funcionar sin investigación
- Contras: No garantizado

Dime cuál prefieres y procedo.
