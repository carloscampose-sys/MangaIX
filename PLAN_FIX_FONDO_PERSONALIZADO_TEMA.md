# Plan: Preservar Fondo Personalizado al Cambiar Tema (Claro/Oscuro)

## Problema Identificado

Cuando el usuario tiene un fondo personalizado (imagen) y cambia entre tema claro y oscuro usando el botón de sol/luna en el Navbar, el fondo personalizado desaparece.

## Análisis de la Causa

### Arquitectura Actual

1. **ThemeContext** (`src/context/ThemeContext.jsx`):
   - Maneja el tema claro/oscuro (`light`/`dark`)
   - Aplica/remueve la clase `dark` del elemento `<html>`
   - Guarda en `localStorage.theme`

2. **ColorThemeContext** (`src/context/ColorThemeContext.jsx`):
   - Maneja el tema de color personalizado (color base + paleta)
   - Maneja el fondo personalizado de imagen (`backgroundImage`)
   - Guarda en `localStorage.customBackgroundImage`
   - Guarda efectos en `localStorage.backgroundEffects`

3. **CustomBackgroundImage** (`src/components/CustomBackgroundImage.jsx`):
   - Renderiza la imagen de fondo con efectos (blur, overlay)
   - Lee directamente de `ColorThemeContext`

### Causa Raíz

El problema NO está en que se elimine el fondo de localStorage, sino en cómo se aplica visualmente:

1. Cuando cambias de tema claro a oscuro, `ThemeContext` agrega la clase `dark` al `<html>`
2. Esto puede estar causando conflictos CSS con el fondo personalizado
3. O el componente `CustomBackgroundImage` no está manejando correctamente el cambio de tema

## Solución Propuesta

### Fase 1: Investigación y Diagnóstico
**Objetivo**: Confirmar exactamente qué está causando que el fondo desaparezca

1. **Verificar localStorage**:
   - Confirmar que `customBackgroundImage` y `backgroundEffects` NO se eliminan al cambiar tema
   - Agregar logs en `ThemeContext.toggleTheme()` para verificar

2. **Verificar renderizado**:
   - Confirmar que `CustomBackgroundImage` se sigue renderizando
   - Verificar que los estilos CSS no están siendo sobrescritos por la clase `dark`

3. **Verificar z-index y visibilidad**:
   - Confirmar que el fondo no está siendo ocultado por otros elementos
   - Verificar que no hay conflictos de `z-index`

### Fase 2: Implementación de la Solución

Basado en el diagnóstico, implementar una de estas soluciones:

#### Opción A: Problema de CSS (más probable)
Si el problema es que la clase `dark` está afectando la visibilidad del fondo:

1. **Modificar `CustomBackgroundImage.jsx`**:
   - Asegurar que los estilos del fondo sean independientes del tema
   - Usar `!important` si es necesario para forzar la visibilidad
   - Ajustar el `z-index` para que siempre esté detrás del contenido

2. **Modificar estilos en `index.css`**:
   - Asegurar que `.dark` no afecte el fondo personalizado
   - Agregar reglas específicas para preservar el fondo en ambos temas

#### Opción B: Problema de Re-renderizado
Si el problema es que el componente se desmonta/remonta:

1. **Modificar `ColorThemeContext.jsx`**:
   - Asegurar que `backgroundImage` y `backgroundEffects` no se resetean
   - Agregar logs para detectar cambios inesperados en el estado

2. **Modificar `CustomBackgroundImage.jsx`**:
   - Usar `useMemo` para memorizar la imagen y evitar re-renders innecesarios
   - Agregar `useEffect` con logs para detectar cuándo se desmonta

#### Opción C: Problema de Sincronización
Si el problema es timing entre contextos:

1. **Modificar jerarquía de Providers en `App.jsx`**:
   - Asegurar que `ColorThemeProvider` esté correctamente anidado
   - Verificar que no hay conflictos entre `ThemeProvider` y `ColorThemeProvider`

2. **Agregar sincronización**:
   - Hacer que `ThemeContext` notifique a `ColorThemeContext` cuando cambia
   - Asegurar que el fondo se re-aplica después del cambio de tema

### Fase 3: Mejoras Adicionales

1. **Agregar transición suave**:
   - Cuando cambia el tema, hacer una transición suave del overlay
   - Ajustar automáticamente el color del overlay según el tema (negro para claro, transparente para oscuro)

2. **Optimizar efectos según tema**:
   - En tema oscuro: reducir overlay automáticamente
   - En tema claro: aumentar overlay para mejor legibilidad

3. **Agregar indicador visual**:
   - Mostrar un toast cuando se preserva el fondo al cambiar tema
   - "✨ Fondo personalizado preservado"

## Archivos a Modificar

### Archivos Principales
1. `src/context/ThemeContext.jsx` - Agregar logs y verificar que no afecta el fondo
2. `src/components/CustomBackgroundImage.jsx` - Asegurar renderizado correcto
3. `src/context/ColorThemeContext.jsx` - Verificar que el estado no se resetea
4. `src/index.css` - Ajustar estilos CSS si es necesario

### Archivos de Soporte
5. `src/App.jsx` - Verificar jerarquía de providers (solo si es necesario)

## Plan de Implementación

### Paso 1: Diagnóstico (15 min)
- Agregar logs en `ThemeContext.toggleTheme()`
- Agregar logs en `CustomBackgroundImage` useEffect
- Verificar localStorage en DevTools al cambiar tema
- Identificar la causa exacta

### Paso 2: Implementación (30 min)
- Aplicar la solución correspondiente según el diagnóstico
- Probar en ambos temas (claro y oscuro)
- Verificar que el fondo se mantiene al cambiar tema múltiples veces

### Paso 3: Mejoras (15 min)
- Agregar transición suave del overlay
- Ajustar efectos según tema
- Agregar toast de confirmación

### Paso 4: Pruebas (15 min)
- Probar con diferentes imágenes de fondo
- Probar con diferentes efectos (blur, overlay)
- Probar cambio rápido entre temas
- Probar en diferentes navegadores

## Criterios de Éxito

✅ El fondo personalizado se mantiene visible al cambiar de tema claro a oscuro
✅ El fondo personalizado se mantiene visible al cambiar de tema oscuro a claro
✅ Los efectos (blur, overlay) se mantienen correctamente
✅ No hay parpadeos o glitches visuales al cambiar tema
✅ El fondo se guarda correctamente en localStorage
✅ El fondo se restaura correctamente al recargar la página

## Notas Técnicas

### localStorage Keys Involucradas
- `theme` - Tema claro/oscuro (ThemeContext)
- `customBackgroundImage` - Imagen en base64 (ColorThemeContext)
- `backgroundEffects` - Efectos del fondo (ColorThemeContext)

### Componentes Involucrados
- `ThemeContext` - Maneja tema claro/oscuro
- `ColorThemeContext` - Maneja fondo personalizado
- `CustomBackgroundImage` - Renderiza el fondo
- `Navbar` - Botón para cambiar tema

### Posibles Conflictos CSS
- Clase `dark` en `<html>` puede afectar estilos globales
- `z-index` del fondo debe ser menor que el contenido
- `backdrop-filter` puede no funcionar en todos los navegadores

## Próximos Pasos

1. Ejecutar diagnóstico para identificar causa exacta
2. Implementar solución correspondiente
3. Probar exhaustivamente
4. Documentar cambios realizados
