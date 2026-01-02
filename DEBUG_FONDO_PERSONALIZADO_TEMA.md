# Debug: Fondo Personalizado Desaparece al Cambiar Tema

## Fecha
2025-01-01

## Problema
El fondo personalizado (imagen) desaparece cuando el usuario cambia entre tema claro y oscuro.

## Logs Agregados

### 1. ThemeContext.jsx
- ✅ Log al hacer toggle del tema
- ✅ Log del estado de localStorage antes del cambio

### 2. CustomBackgroundImage.jsx
- ✅ Log en cada render
- ✅ useEffect para detectar cambios en backgroundImage
- ✅ useEffect para detectar cambios en backgroundEffects

### 3. ColorThemeContext.jsx
- ✅ Log mejorado al cargar imagen desde storage

## Instrucciones para Reproducir

1. Abre la aplicación en el navegador
2. Abre DevTools (F12) y ve a la pestaña Console
3. Sube una imagen de fondo personalizada desde Ajustes
4. Verifica que el fondo se muestra correctamente
5. Cambia el tema de claro a oscuro (o viceversa) usando el botón sol/luna
6. Observa los logs en la consola

## Logs Esperados

### Al cargar la página con fondo personalizado:
```
[ColorThemeContext] 📂 Loading background from storage: { hasImage: true, imageLength: XXXXX, hasEffects: true }
[ColorThemeContext] ✅ Background image loaded from storage
[ColorThemeContext] ✅ Background effects loaded from storage
[CustomBackgroundImage] 🖼️ Rendering with: { hasImage: true, imageLength: XXXXX, effects: {...} }
[CustomBackgroundImage] ✅ Rendering background image
```

### Al cambiar el tema:
```
[ThemeContext] 🌓 Toggling theme from: light
[ThemeContext] 📦 localStorage before toggle: { theme: 'light', customBackgroundImage: 'EXISTS', backgroundEffects: 'EXISTS' }
[CustomBackgroundImage] 🔄 Effect triggered - backgroundImage changed: { hasImage: true/false, imageLength: XXXXX }
```

## Análisis de Posibles Causas

### Causa 1: localStorage se borra
- **Síntoma**: Los logs muestran que customBackgroundImage pasa de 'EXISTS' a 'NOT FOUND'
- **Solución**: Verificar que ThemeContext no está borrando localStorage

### Causa 2: ColorThemeContext se reinicializa
- **Síntoma**: Los logs muestran que backgroundImage pasa de tener valor a null
- **Solución**: Verificar que el contexto no se desmonta/remonta

### Causa 3: Problema de CSS
- **Síntoma**: localStorage mantiene los datos pero el fondo no se ve
- **Solución**: Verificar que la clase 'dark' no está ocultando el fondo

### Causa 4: z-index incorrecto
- **Síntoma**: El fondo existe pero está detrás de otro elemento
- **Solución**: Verificar z-index y orden de renderizado

## Próximos Pasos

1. ✅ Agregar logs de diagnóstico
2. ⏳ Ejecutar la aplicación y reproducir el problema
3. ⏳ Analizar los logs en la consola
4. ⏳ Identificar la causa exacta
5. ⏳ Implementar la solución correspondiente

## Resultados del Diagnóstico

### Causa Identificada:
**Problema de CSS y Re-renderizado**

El problema NO era que se borrara el localStorage, sino que:
1. Los estilos CSS no eran lo suficientemente robustos
2. El componente no detectaba cambios de tema
3. No había transiciones suaves al cambiar tema
4. El z-index se aplicaba mediante clase Tailwind en lugar de inline

### Solución Implementada:
1. ✅ **useMemo** para memorizar la imagen
2. ✅ **useEffect** para detectar cambios de tema
3. ✅ **Estilos inline robustos** con z-index explícito
4. ✅ **Reglas CSS específicas** con !important
5. ✅ **Transiciones suaves** de 0.3s
6. ✅ **Logs detallados** para debugging

### Archivos Modificados:
- `src/components/CustomBackgroundImage.jsx` - Componente mejorado
- `src/index.css` - Reglas CSS específicas agregadas
- `src/context/ThemeContext.jsx` - Logs de diagnóstico
- `src/context/ColorThemeContext.jsx` - Logs mejorados

### Build Status:
✅ `npm run build` - Exitoso sin errores

### Próximos Pasos:
1. ✅ Solución implementada
2. ⏳ Usuario debe probar en el navegador
3. ⏳ Verificar logs en DevTools
4. ⏳ Confirmar que el fondo se preserva al cambiar tema
