# 🧪 Guía de Testing: Draggable Source Buttons

## Checklist de Pruebas

### ✅ Prueba 1: Renderizado Inicial
**Objetivo:** Verificar que los botones se renderizan correctamente

```
[ ] 1. Abrir la aplicación en http://localhost:5173
[ ] 2. Verificar que aparecen 3 botones de fuente
[ ] 3. Verificar que están en orden: TuManga, ManhwaWeb, Ikigai
[ ] 4. Verificar que los botones son clickeables
[ ] 5. Verificar que el botón seleccionado tiene estilo diferente
```

### ✅ Prueba 2: Cursor Grab
**Objetivo:** Verificar que el cursor cambia al pasar sobre un botón

```
[ ] 1. Pasar el mouse sobre un botón de fuente
[ ] 2. Verificar que el cursor cambia a "grab" 🖐️
[ ] 3. Hacer clic en el botón
[ ] 4. Verificar que el cursor cambia a "grabbing" ✊
[ ] 5. Soltar el botón
[ ] 6. Verificar que el cursor vuelve a "grab"
```

### ✅ Prueba 3: Drag and Drop Básico
**Objetivo:** Verificar que se puede arrastrar un botón

```
[ ] 1. Hacer clic en el botón "ManhwaWeb"
[ ] 2. Arrastrarlo hacia la izquierda (posición de TuManga)
[ ] 3. Soltar el botón
[ ] 4. Verificar que el orden cambió a: ManhwaWeb, TuManga, Ikigai
[ ] 5. Verificar que aparece toast "✨ Orden de fuentes actualizado"
```

### ✅ Prueba 4: Feedback Visual
**Objetivo:** Verificar que hay feedback visual durante el drag

```
[ ] 1. Hacer clic en un botón
[ ] 2. Mientras se arrastra, verificar que:
    [ ] El botón tiene opacidad reducida (~60%)
    [ ] El botón está ligeramente más pequeño (scale 0.95)
    [ ] Hay un brillo alrededor del botón
[ ] 3. Soltar el botón
[ ] 4. Verificar que el feedback visual desaparece
[ ] 5. Verificar que hay una animación de "pulse" al soltar
```

### ✅ Prueba 5: Persistencia en localStorage
**Objetivo:** Verificar que el orden se guarda en localStorage

```
[ ] 1. Reordenar los botones (ej: Ikigai, ManhwaWeb, TuManga)
[ ] 2. Abrir DevTools (F12)
[ ] 3. Ir a Application > Local Storage > http://localhost:5173
[ ] 4. Buscar la entrada "sourceOrder"
[ ] 5. Verificar que contiene: ["ikigai", "manhwaweb", "tumanga"]
[ ] 6. Cerrar DevTools
```

### ✅ Prueba 6: Persistencia Después de Recargar
**Objetivo:** Verificar que el orden se mantiene después de recargar

```
[ ] 1. Reordenar los botones (ej: Ikigai, TuManga, ManhwaWeb)
[ ] 2. Presionar F5 (recargar página)
[ ] 3. Esperar a que cargue completamente
[ ] 4. Verificar que el orden es el mismo: Ikigai, TuManga, ManhwaWeb
[ ] 5. Verificar que no hay errores en la consola
```

### ✅ Prueba 7: Funcionalidad de Búsqueda
**Objetivo:** Verificar que la búsqueda funciona después de reordenar

```
[ ] 1. Reordenar los botones
[ ] 2. Hacer clic en "ManhwaWeb"
[ ] 3. Escribir "Amor Maldito" en el buscador
[ ] 4. Presionar Enter o hacer clic en "Buscar"
[ ] 5. Verificar que aparecen resultados de ManhwaWeb
[ ] 6. Cambiar a otra fuente y repetir
```

### ✅ Prueba 8: Orden por Defecto
**Objetivo:** Verificar que se restaura el orden por defecto

```
[ ] 1. Reordenar los botones
[ ] 2. Abrir DevTools (F12)
[ ] 3. Ir a Application > Local Storage
[ ] 4. Eliminar la entrada "sourceOrder"
[ ] 5. Recargar la página (F5)
[ ] 6. Verificar que los botones vuelven al orden por defecto:
       TuManga, ManhwaWeb, Ikigai
```

### ✅ Prueba 9: Mobile/Touch
**Objetivo:** Verificar que funciona en dispositivos móviles

```
[ ] 1. Abrir DevTools (F12)
[ ] 2. Presionar Ctrl+Shift+M (Toggle Device Toolbar)
[ ] 3. Seleccionar un dispositivo móvil (ej: iPhone 12)
[ ] 4. Tocar y arrastrar un botón
[ ] 5. Verificar que se mueve suavemente
[ ] 6. Soltar el botón
[ ] 7. Verificar que el orden se guarda
[ ] 8. Recargar la página
[ ] 9. Verificar que el orden persiste
```

### ✅ Prueba 10: Dark Mode
**Objetivo:** Verificar que funciona en dark mode

```
[ ] 1. Cambiar a dark mode (si está disponible)
[ ] 2. Verificar que los botones son visibles
[ ] 3. Arrastrar un botón
[ ] 4. Verificar que el feedback visual es visible
[ ] 5. Verificar que el brillo es visible en dark mode
```

### ✅ Prueba 11: Múltiples Reordenamientos
**Objetivo:** Verificar que funciona con múltiples cambios

```
[ ] 1. Reordenar los botones 5 veces
[ ] 2. Después de cada reordenamiento:
    [ ] Verificar que aparece el toast
    [ ] Verificar que el orden es correcto
    [ ] Verificar que no hay errores en la consola
[ ] 3. Recargar la página
[ ] 4. Verificar que el último orden se mantiene
```

### ✅ Prueba 12: Arrastrar Fuera del Contenedor
**Objetivo:** Verificar que no se puede arrastrar fuera del contenedor

```
[ ] 1. Intentar arrastrar un botón fuera del contenedor
[ ] 2. Verificar que el botón vuelve a su posición original
[ ] 3. Verificar que no hay cambios en localStorage
```

### ✅ Prueba 13: Interacción con Búsqueda
**Objetivo:** Verificar que el drag no interfiere con la búsqueda

```
[ ] 1. Escribir algo en el buscador
[ ] 2. Intentar arrastrar un botón
[ ] 3. Verificar que el buscador sigue funcionando
[ ] 4. Presionar Enter para buscar
[ ] 5. Verificar que la búsqueda funciona correctamente
```

### ✅ Prueba 14: Consola sin Errores
**Objetivo:** Verificar que no hay errores en la consola

```
[ ] 1. Abrir DevTools (F12)
[ ] 2. Ir a la pestaña Console
[ ] 3. Reordenar los botones varias veces
[ ] 4. Verificar que no hay errores rojos
[ ] 5. Verificar que hay logs informativos:
    [ ] "[useSwapy] Swapy initialized..."
    [ ] "[App] Source order changed..."
    [ ] "[sourceOrderService] Source order saved..."
```

## Casos de Error a Probar

### ❌ Error 1: localStorage Deshabilitado
```
[ ] 1. Abrir DevTools (F12)
[ ] 2. Ir a Application > Cookies
[ ] 3. Bloquear localStorage para este sitio
[ ] 4. Recargar la página
[ ] 5. Intentar arrastrar un botón
[ ] 6. Verificar que:
    [ ] El drag sigue funcionando
    [ ] Aparece un error en la consola
    [ ] El orden NO se guarda (pero la app sigue funcionando)
```

### ❌ Error 2: localStorage Corrupto
```
[ ] 1. Abrir DevTools (F12)
[ ] 2. Ir a Application > Local Storage
[ ] 3. Editar "sourceOrder" a un valor inválido: "invalid"
[ ] 4. Recargar la página
[ ] 5. Verificar que:
    [ ] Los botones se renderizan en orden por defecto
    [ ] No hay errores en la consola
    [ ] El orden inválido se reemplaza con el por defecto
```

### ❌ Error 3: Contenedor No Encontrado
```
[ ] 1. Abrir DevTools (F12)
[ ] 2. Ir a la consola
[ ] 3. Ejecutar: document.getElementById('source-buttons-container').remove()
[ ] 4. Recargar la página
[ ] 5. Verificar que:
    [ ] Aparece un warning en la consola
    [ ] Los botones se renderizan normalmente
    [ ] El drag no funciona (pero la app sigue funcionando)
```

## Resultados Esperados

### ✅ Comportamiento Correcto
- Los botones se renderizan en el orden guardado
- El cursor cambia a "grab" al pasar sobre un botón
- Se puede arrastrar un botón a nueva posición
- Aparece feedback visual durante el drag
- Aparece un toast al soltar el botón
- El orden se guarda en localStorage
- El orden persiste después de recargar
- La búsqueda funciona correctamente
- No hay errores en la consola

### ❌ Comportamiento Incorrecto
- Los botones no se renderizan
- El cursor no cambia a "grab"
- No se puede arrastrar un botón
- No hay feedback visual
- No aparece el toast
- El orden no se guarda
- El orden no persiste
- La búsqueda no funciona
- Hay errores en la consola

## Herramientas de Debugging

### DevTools Console
```javascript
// Ver el orden actual en localStorage
JSON.parse(localStorage.getItem('sourceOrder'))

// Cambiar el orden manualmente
localStorage.setItem('sourceOrder', JSON.stringify(['ikigai', 'tumanga', 'manhwaweb']))

// Limpiar el orden
localStorage.removeItem('sourceOrder')

// Ver todos los elementos draggables
document.querySelectorAll('[data-swapable]')

// Ver el contenedor
document.getElementById('source-buttons-container')
```

### Network Tab
```
[ ] Verificar que no hay requests innecesarios durante drag
[ ] Verificar que localStorage se actualiza localmente (sin requests)
```

### Performance Tab
```
[ ] Grabar una sesión de drag
[ ] Verificar que no hay jank o stuttering
[ ] Verificar que las transiciones son suaves
```

## Conclusión

Si todas las pruebas pasan, la funcionalidad de draggable source buttons está completamente funcional y lista para producción.

**Tiempo estimado de testing:** 30-45 minutos
**Dificultad:** Fácil (solo interacción manual)
**Requisitos:** Navegador moderno, DevTools

---

**Última actualización:** 2025-12-28
