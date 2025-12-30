# Debug: Progreso de Lectura

## Cambios Realizados

### 1. Detector de Scroll Mejorado
- Ahora detecta correctamente qué página está visible basándose en el scroll
- Usa `querySelectorAll('div > img')` para encontrar todas las imágenes de páginas
- Calcula la visibilidad de cada imagen y selecciona la más visible
- Se ejecuta inmediatamente al montar y en cada evento de scroll

### 2. Logs de Debugging Agregados
He agregado console.logs en puntos clave para ayudar a identificar problemas:

- `[Reader] Checking for saved progress:` - Al intentar restaurar progreso
- `[Reader] Restoring progress to page:` - Cuando encuentra progreso guardado
- `[Reader] Scrolled to page:` - Después de hacer scroll a la página restaurada
- `[Reader] Auto-saving progress:` - Cada vez que guarda el progreso automáticamente

### 3. Validación de mangaId
- Ahora verifica que `mangaId !== 'unknown'` antes de guardar/restaurar
- Esto evita guardar progresos con IDs inválidos

### 4. Delay de Scroll Aumentado
- Cambié el delay de 300ms a 500ms para dar más tiempo a que las imágenes carguen
- Esto asegura que el scroll funcione correctamente

## Cómo Probar

### Paso 1: Abrir la Consola del Navegador
1. Presiona F12 o Ctrl+Shift+I (Cmd+Option+I en Mac)
2. Ve a la pestaña "Console"

### Paso 2: Leer un Capítulo
1. Abre cualquier manga
2. Abre un capítulo
3. Haz scroll hacia abajo para leer varias páginas
4. Observa en la consola los mensajes `[Reader] Auto-saving progress:`

### Paso 3: Cerrar y Reabrir
1. Cierra el reader (botón X o ESC)
2. Vuelve a abrir el MISMO capítulo
3. Observa en la consola:
   - `[Reader] Checking for saved progress:`
   - `[Reader] Restoring progress to page:`
   - `[Reader] Scrolled to page:`
4. Deberías ver una notificación toast: "📖 Continuando desde página X"
5. El scroll debería llevarte automáticamente a la página donde te quedaste

### Paso 4: Verificar localStorage
En la consola del navegador, ejecuta:

```javascript
// Ver todos los progresos guardados
JSON.parse(localStorage.getItem('reading_progress'))

// Ver un progreso específico (reemplaza con tus IDs)
const service = window.readingProgressService || { getProgress: () => null };
// O manualmente:
const allProgress = JSON.parse(localStorage.getItem('reading_progress'));
console.log(allProgress);
```

## Problemas Comunes y Soluciones

### Problema 1: No se guarda el progreso
**Síntomas:** No ves logs de `[Reader] Auto-saving progress:`

**Posibles causas:**
1. `mangaId` es 'unknown' - Verifica que el manga tenga `id` o `slug`
2. `currentPage` es 0 - El detector de scroll no está funcionando
3. Las páginas no se están cargando correctamente

**Solución:**
- Verifica en la consola qué valor tiene `mangaId`
- Verifica que veas cambios en el indicador de página (Pág X / Y) al hacer scroll

### Problema 2: No se restaura el progreso
**Síntomas:** No ves la notificación al reabrir el capítulo

**Posibles causas:**
1. El progreso no se guardó (ver Problema 1)
2. Los IDs no coinciden (mangaId o chapterId diferentes)
3. El progreso expiró (más de 30 días)

**Solución:**
- Verifica en la consola el log `[Reader] Checking for saved progress:`
- Compara los IDs que se muestran con los que guardaste
- Verifica localStorage manualmente

### Problema 3: Se restaura pero no hace scroll
**Síntomas:** Ves la notificación pero no te lleva a la página correcta

**Posibles causas:**
1. Las imágenes no han cargado completamente
2. El selector de imágenes no encuentra los elementos correctos

**Solución:**
- Aumenta el delay en el código (de 500ms a 1000ms)
- Verifica que veas el log `[Reader] Scrolled to page:`

### Problema 4: El indicador de página no cambia al hacer scroll
**Síntomas:** El indicador siempre muestra "Pág 1 / X"

**Posibles causas:**
1. El detector de scroll no está funcionando
2. Las imágenes no tienen la estructura esperada

**Solución:**
- Verifica en la consola si hay errores de JavaScript
- Inspecciona el HTML para ver la estructura de las páginas

## Información de Debug Útil

### Ver el estado actual del Reader
Agrega esto temporalmente en el código para ver el estado:

```javascript
console.log('Reader State:', {
  currentPage,
  totalPages: pages?.length,
  mangaId,
  chapterId,
  hasRestoredProgress
});
```

### Ver todos los progresos guardados
```javascript
const allProgress = JSON.parse(localStorage.getItem('reading_progress') || '{}');
console.table(Object.entries(allProgress).map(([key, value]) => ({
  key,
  mangaId: value.mangaId,
  chapterId: value.chapterId,
  page: `${value.currentPage + 1}/${value.totalPages}`,
  date: new Date(value.timestamp).toLocaleString()
})));
```

### Limpiar todos los progresos (para testing)
```javascript
localStorage.removeItem('reading_progress');
console.log('Todos los progresos eliminados');
```

## Siguiente Paso

Por favor, prueba la funcionalidad siguiendo los pasos anteriores y comparte:
1. Los logs que ves en la consola
2. Qué comportamiento observas
3. Si hay algún error en la consola

Con esa información podré identificar exactamente qué está fallando y arreglarlo.
