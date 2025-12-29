# Plan Completo: Implementar Draggable Source Buttons con Swapy

## Estado Actual

✅ **Ya Implementado:**
- Swapy instalado en `package.json` (v1.0.5)
- Hook `useSwapy.js` creado y funcional
- Servicio `sourceOrderService.js` creado con funciones de persistencia
- Hook `useSwapy` siendo llamado en `App.jsx` línea 108
- Estado `sourceOrder` en App.jsx para almacenar el orden

❌ **Falta Implementar:**
- Los botones de fuente NO tienen atributos `data-swapable` e `id` necesarios
- El contenedor NO tiene `id="source-buttons-container"`
- Los botones se renderizan con `getActiveSources().map()` pero no respetan el `sourceOrder`
- Falta CSS para feedback visual durante drag

## Tareas Pendientes

### 1. Modificar el contenedor de botones en App.jsx
**Ubicación:** `src/App.jsx` línea 569

**Cambios:**
- Agregar `id="source-buttons-container"` al div contenedor
- Cambiar de `getActiveSources().map()` a `sourceOrder.map()` para respetar el orden guardado
- Agregar `data-swapable` a cada botón
- Agregar `id={`source-${source.id}`}` a cada botón

**Antes:**
```jsx
<div className="flex justify-center gap-2 sm:gap-3 mb-4">
  {getActiveSources().map(source => {
    // ... botón
  })}
</div>
```

**Después:**
```jsx
<div id="source-buttons-container" className="flex justify-center gap-2 sm:gap-3 mb-4">
  {sourceOrder.map(sourceId => {
    const source = getSourceById(sourceId);
    if (!source) return null;
    // ... botón con data-swapable e id
  })}
</div>
```

### 2. Agregar CSS para feedback visual
**Ubicación:** `src/index.css`

**Agregar:**
```css
/* Swapy drag feedback */
[data-swapable] {
  cursor: grab;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

[data-swapable]:active {
  cursor: grabbing;
}

[data-swapable].swapping {
  opacity: 0.5;
  transform: scale(0.95);
}

[data-swapable].swapped {
  animation: swapPulse 0.3s ease;
}

@keyframes swapPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

### 3. Verificar que getSourceById existe
**Ubicación:** `src/services/sources.js`

**Necesario:** Función `getSourceById(id)` que retorne el objeto source por ID

### 4. Pruebas Manuales
- [ ] Cargar la página
- [ ] Verificar que los botones se renderizan en el orden guardado
- [ ] Arrastrar un botón a nueva posición
- [ ] Verificar que se guarda en localStorage
- [ ] Recargar la página
- [ ] Verificar que el orden persiste
- [ ] Verificar que los botones siguen siendo clickeables
- [ ] Verificar que la búsqueda funciona después de reordenar

## Archivos a Modificar

1. **src/App.jsx** - Modificar renderizado de botones
2. **src/index.css** - Agregar CSS para feedback visual
3. **src/services/sources.js** - Verificar/agregar getSourceById si no existe

## Notas Importantes

- El hook `useSwapy` ya está inicializado correctamente
- El servicio de persistencia ya está funcionando
- Solo falta conectar todo en el renderizado
- El estado `sourceOrder` ya se carga desde localStorage en el useEffect
- El callback `handleSourceOrderChange` ya guarda en localStorage

## Estimación

- Modificar App.jsx: 5 minutos
- Agregar CSS: 2 minutos
- Pruebas: 5 minutos
- **Total: ~12 minutos**
