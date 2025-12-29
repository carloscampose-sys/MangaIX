# 🎨 Selector de Fondo Personalizado

## ✅ Cambios Implementados

### Archivos Nuevos

#### 1. `src/components/BackgroundColorPicker.jsx`
- Componente modal independiente para seleccionar color de fondo
- **8 colores recomendados** (blanco, crema, pasteles) para legibilidad segura
- Selector de color completo (gradiente + barra de matiz)
- Soporte touch completo
- Advertencia de legibilidad
- Responsive para móviles y desktop

**Colores recomendados incluidos:**
- Blanco (#ffffff)
- Crema Claro (#fefce8)
- Amarillo Pastel (#fef3c7)
- Gris Claro (#f5f5f5)
- Rosa Pastel (#fce7f3)
- Azul Pastel (#e0f2fe)
- Verde Pastel (#f0fdf4)
- Rojo Pastel (#fef2f2)

### Archivos Modificados

#### 2. `src/context/ColorThemeContext.jsx`
**Funciones agregadas:**
```javascript
// Establecer fondo personalizado
setCustomBackground(backgroundColor)

// Restaurar fondo automático
resetCustomBackground()
```

**Características:**
- Ajusta automáticamente el color del texto según luminancia del fondo
- Guarda el fondo personalizado en localStorage
- **IMPORTANTE**: Preserva el fondo personalizado al cambiar el color primario
- Mantiene armonía con el color primario

#### 3. `src/components/ColorThemeModal.jsx`
**Agregado:**
- Botón "Cambiar Color de Fondo" (gradiente púrpura-rosa)
- Botón "Restaurar fondo automático" (aparece solo si hay fondo personalizado)
- Integración con BackgroundColorPicker
- Import de `Paintbrush` icon

#### 4. `src/utils/colorPaletteGenerator.js`
**Cambio crítico:**
- Modificado para SIEMPRE generar fondo blanco por defecto (#ffffff)
- El fondo ya NO cambia automáticamente según el color primario
- Solo el selector de fondo personalizado puede cambiar el color de fondo

## 🎯 Cómo Funciona

### Flujo de Usuario

1. **Abrir selector principal**
   - Usuario hace clic en botón de paleta (🎨)
   - Se abre ColorThemeModal

2. **Cambiar color de fondo**
   - Usuario hace clic en "Cambiar Color de Fondo"
   - Se abre BackgroundColorPicker (modal sobre modal)
   - Aparece advertencia de legibilidad

3. **Seleccionar color**
   - Usuario ve 8 colores recomendados (seguros para legibilidad)
   - Puede hacer clic en un color recomendado O
   - Puede usar el selector personalizado (gradiente + barra de matiz)
   - Ve preview del color en tiempo real
   - Hace clic en "Aplicar Fondo"

4. **Resultado**
   - El fondo de la página cambia al color seleccionado
   - El texto se ajusta automáticamente (negro o blanco según luminancia)
   - Se guarda en localStorage

5. **Restaurar (opcional)**
   - Usuario hace clic en "Restaurar fondo automático"
   - El fondo vuelve al generado automáticamente desde el color primario

### Lógica de Ajuste de Texto

```javascript
const bgLuminance = chroma(backgroundColor).luminance();
textPrimary = bgLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
textSecondary = bgLuminance > 0.5 ? '#666666' : '#b0b0b0';
```

- **Fondo claro** (luminancia > 0.5) → Texto negro
- **Fondo oscuro** (luminancia ≤ 0.5) → Texto blanco

## 🎨 Características

### BackgroundColorPicker

✅ **Modal independiente** (z-index 10000, sobre el modal principal)
✅ **Advertencia visible** con icono de alerta
✅ **8 colores recomendados** (blanco, crema, pasteles claros)
✅ **Selector completo** (gradiente 2D + barra de matiz)
✅ **Touch-friendly** (soporte táctil completo)
✅ **Responsive** (se adapta a móviles)
✅ **Preview en tiempo real** (muestra el color seleccionado)

### Integración

✅ **Dos selectores independientes** (color primario + fondo)
✅ **Funcionan en armonía** (no se interfieren)
✅ **El fondo personalizado se preserva** al cambiar color primario
✅ **Persistencia** (ambos se guardan en localStorage)
✅ **Restauración** (se puede volver al fondo blanco por defecto)

## 📱 UI/UX

### Botón Principal
```jsx
<button className="bg-gradient-to-r from-purple-500 to-pink-500">
  <Paintbrush /> Cambiar Color de Fondo
</button>
```

- Gradiente llamativo (púrpura → rosa)
- Icono de pincel
- Touch-friendly (44x44px mínimo)

### Botón Restaurar
```jsx
<button className="text-gray-600 hover:text-gray-800">
  Restaurar fondo automático
</button>
```

- Solo aparece si hay fondo personalizado
- Texto gris, discreto
- Hover para feedback

### Advertencia
```jsx
<div className="bg-yellow-50 border-yellow-200">
  <AlertTriangle /> Advertencia: Puede afectar legibilidad
</div>
```

- Fondo amarillo claro
- Icono de advertencia
- Texto explicativo

## 🔄 Persistencia

### localStorage Structure
```json
{
  "version": "1.0",
  "baseColor": "#3b82f6",
  "customBackground": "#ff6b9d",
  "palette": { ... },
  "isDark": false,
  "timestamp": 1703876543210
}
```

- `customBackground`: null si usa fondo automático
- `customBackground`: "#hexcode" si usa fondo personalizado

## 🧪 Pruebas

### Escenario 1: Fondo Claro
1. Abre selector de fondo
2. Selecciona un color claro (ej: #f0f0f0)
3. Aplica
4. **Resultado**: Fondo claro, texto negro

### Escenario 2: Fondo Oscuro
1. Abre selector de fondo
2. Selecciona un color oscuro (ej: #2a2a2a)
3. Aplica
4. **Resultado**: Fondo oscuro, texto blanco

### Escenario 3: Fondo Colorido
1. Abre selector de fondo
2. Selecciona un color vibrante (ej: #ff6b9d rosa)
3. Aplica
4. **Resultado**: Fondo rosa, texto ajustado según luminancia

### Escenario 4: Restaurar
1. Aplica fondo personalizado
2. Haz clic en "Restaurar fondo automático"
3. **Resultado**: Vuelve al fondo generado desde color primario

### Escenario 5: Ambos Selectores
1. Cambia color primario a azul
2. Cambia fondo a rosa
3. **Resultado**: Botones azules, fondo rosa, texto legible

## 📐 Z-Index Hierarchy

```
ColorThemeModal: z-[9999]
BackgroundColorPicker: z-[10000]
```

El selector de fondo aparece SOBRE el modal principal.

## 🔧 Para Revertir

Si quieres revertir estos cambios:

### 1. Eliminar archivo nuevo
```bash
rm src/components/BackgroundColorPicker.jsx
```

### 2. Revertir ColorThemeContext.jsx

Eliminar estas funciones:
```javascript
setCustomBackground(backgroundColor)
resetCustomBackground()
```

Eliminar import:
```javascript
import chroma from 'chroma-js';
```

Eliminar del value:
```javascript
setCustomBackground,
resetCustomBackground,
```

### 3. Revertir ColorThemeModal.jsx

Eliminar import:
```javascript
import { BackgroundColorPicker } from './BackgroundColorPicker';
```

Eliminar estado:
```javascript
const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
```

Eliminar handlers:
```javascript
handleApplyCustomBackground
handleResetBackground
```

Eliminar botón y componente del JSX:
```jsx
{/* Botón para cambiar fondo personalizado */}
<BackgroundColorPicker ... />
```

## ✨ Ventajas

✅ **Flexibilidad total** - Usuario controla color primario Y fondo
✅ **Seguridad** - Advertencia clara sobre legibilidad
✅ **Inteligente** - Ajusta texto automáticamente
✅ **Reversible** - Puede restaurar fondo automático
✅ **Persistente** - Se guarda en localStorage
✅ **Responsive** - Funciona en móviles
✅ **Touch-friendly** - Soporte táctil completo

## 🎯 Casos de Uso

1. **Usuario creativo**: Quiere fondo rosa con botones azules
2. **Usuario minimalista**: Quiere fondo gris claro con acentos verdes
3. **Usuario oscuro**: Quiere fondo negro con acentos morados
4. **Usuario corporativo**: Quiere fondo blanco con acentos de marca

¡Todos son posibles ahora! 🎨✨
