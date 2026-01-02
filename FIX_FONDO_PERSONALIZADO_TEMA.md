# Fix: Preservar Fondo Personalizado al Cambiar Tema

## Problema Identificado

Al analizar el código, identifiqué que el problema NO es que se borre el localStorage, sino que hay un **problema de re-renderizado** en el `ColorThemeContext`.

### Causa Raíz

El `ColorThemeContext` tiene un `useEffect` de inicialización que se ejecuta solo una vez al montar el componente:

```javascript
useEffect(() => {
  // ... código de inicialización
  loadBackgroundImageFromStorage();
  // ...
}, []); // ← Array de dependencias vacío = solo se ejecuta una vez
```

Cuando cambias el tema con `ThemeContext`, esto NO causa que `ColorThemeContext` se reinicialice, por lo que el fondo debería mantenerse. Sin embargo, puede haber un problema de **timing** o **CSS**.

## Solución Implementada

### Fase 1: Diagnóstico (COMPLETADO)

✅ Agregados logs en:
- `ThemeContext.jsx` - Para ver cuándo cambia el tema
- `CustomBackgroundImage.jsx` - Para ver cuándo se renderiza el fondo
- `ColorThemeContext.jsx` - Para ver cuándo se carga el fondo

### Fase 2: Solución Preventiva

Voy a implementar las siguientes mejoras para asegurar que el fondo NUNCA desaparezca:

#### 1. Mejorar CustomBackgroundImage con useMemo

Memorizar la imagen para evitar re-renders innecesarios y asegurar que siempre se renderice si existe.

#### 2. Agregar CSS robusto

Asegurar que el fondo tenga estilos que no sean afectados por la clase `dark`:
- z-index negativo garantizado
- !important en propiedades críticas
- Transición suave al cambiar tema

#### 3. Sincronización entre contextos

Hacer que `CustomBackgroundImage` escuche cambios del tema y re-aplique el fondo si es necesario.

#### 4. Toast de confirmación

Mostrar un toast cuando se cambia el tema para confirmar que el fondo se preservó.

## Archivos Modificados

### 1. src/components/CustomBackgroundImage.jsx
- ✅ Agregados logs de diagnóstico
- ⏳ Agregar useMemo para memorizar imagen
- ⏳ Agregar useEffect para re-aplicar fondo al cambiar tema
- ⏳ Mejorar estilos CSS con !important

### 2. src/context/ThemeContext.jsx
- ✅ Agregados logs de diagnóstico
- ⏳ Agregar verificación de fondo al cambiar tema

### 3. src/context/ColorThemeContext.jsx
- ✅ Agregados logs mejorados
- ⏳ Agregar método para forzar re-aplicación del fondo

### 4. src/index.css (si es necesario)
- ⏳ Agregar reglas CSS específicas para el fondo en modo dark

## Instrucciones para Probar

### Antes de la solución:
1. Abre la aplicación
2. Ve a Ajustes (⚙️)
3. Sube una imagen de fondo
4. Cambia el tema (☀️/🌙)
5. **Problema**: El fondo desaparece

### Después de la solución:
1. Abre la aplicación
2. Ve a Ajustes (⚙️)
3. Sube una imagen de fondo
4. Cambia el tema (☀️/🌙)
5. **Resultado esperado**: 
   - ✅ El fondo se mantiene visible
   - ✅ Aparece un toast: "✨ Fondo personalizado preservado"
   - ✅ Los efectos (blur, overlay) se mantienen
   - ✅ No hay parpadeos ni glitches

### Verificación en DevTools:
1. Abre la consola (F12)
2. Cambia el tema
3. Verifica los logs:
   ```
   [ThemeContext] 🌓 Toggling theme from: light
   [ThemeContext] 📦 localStorage before toggle: { customBackgroundImage: 'EXISTS' }
   [CustomBackgroundImage] 🔄 Effect triggered - backgroundImage changed: { hasImage: true }
   [CustomBackgroundImage] ✅ Rendering background image
   ```

## Próximos Pasos

1. ✅ Diagnóstico completado
2. ⏳ Implementar mejoras en CustomBackgroundImage
3. ⏳ Implementar sincronización entre contextos
4. ⏳ Agregar toast de confirmación
5. ⏳ Probar exhaustivamente
6. ⏳ Documentar resultados

## Notas Técnicas

### Por qué el fondo podría desaparecer:

1. **Re-render forzado**: Aunque el estado no cambia, React podría estar re-renderizando el componente
2. **CSS conflictivo**: La clase `dark` podría estar afectando el z-index o la visibilidad
3. **Timing issue**: El fondo se renderiza antes de que el tema termine de cambiar
4. **Memory leak**: El componente se desmonta y remonta (poco probable)

### Solución robusta:

- **useMemo**: Evita re-cálculos innecesarios
- **useEffect con tema**: Re-aplica el fondo cuando cambia el tema
- **CSS con !important**: Fuerza los estilos críticos
- **Toast**: Feedback visual para el usuario
- **Logs**: Facilita debugging futuro

## Estado Actual

- ✅ Logs de diagnóstico agregados
- ✅ Build exitoso
- ⏳ Esperando implementación de mejoras
- ⏳ Esperando pruebas del usuario

## Resultado Esperado

Después de implementar todas las mejoras, el fondo personalizado se mantendrá visible al cambiar entre tema claro y oscuro, sin importar cuántas veces se cambie el tema.
