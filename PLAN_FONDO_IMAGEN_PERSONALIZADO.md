# Plan: Fondo de Imagen Personalizado

## Objetivo
Permitir que los usuarios suban su propia imagen como fondo de pantalla de la página, con efectos automáticos que garanticen la legibilidad del contenido.

## Análisis de la Funcionalidad

### Características Principales
1. **Subida de Imagen**: El usuario puede seleccionar una imagen desde su dispositivo
2. **Efectos de Legibilidad**: Aplicar automáticamente efectos que no perjudiquen la lectura
3. **Persistencia**: Guardar la imagen en localStorage (como base64 o URL)
4. **Restauración**: Opción para volver al fondo original
5. **Responsive**: La imagen debe adaptarse a diferentes tamaños de pantalla

### Efectos para Proteger Legibilidad

#### Opción 1: Overlay Semitransparente (Recomendado)
- Capa semitransparente sobre la imagen (negro/blanco con opacidad 60-80%)
- Permite ver la imagen pero garantiza contraste
- Ajuste automático según luminosidad de la imagen

#### Opción 2: Blur + Overlay
- Desenfoque (blur) de la imagen de fondo
- Overlay semitransparente adicional
- Efecto más suave y moderno

#### Opción 3: Gradiente Adaptativo
- Gradiente desde transparente hasta color sólido
- Se adapta según la posición del contenido
- Más complejo pero muy elegante

#### Opción 4: Brightness/Contrast Adjustment
- Ajustar brillo y contraste de la imagen automáticamente
- Detectar luminosidad promedio y ajustar
- Mantiene más visible la imagen original

## Arquitectura Técnica

### 1. Componente: BackgroundImageUploader
**Ubicación**: `src/components/BackgroundImageUploader.jsx`

**Funcionalidades**:
- Input de tipo file para seleccionar imagen
- Preview de la imagen antes de aplicar
- Controles de efectos (intensidad de blur, opacidad de overlay)
- Botón para aplicar y cancelar
- Botón para restaurar fondo original

**Props**:
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  onApply: (imageData, effects) => void,
  currentImage: string | null
}
```

### 2. Context: Extender ColorThemeContext
**Ubicación**: `src/context/ColorThemeContext.jsx`

**Nuevas funciones**:
```javascript
{
  customBackgroundImage: string | null,
  backgroundEffects: {
    blur: number,        // 0-20px
    overlay: number,     // 0-100%
    overlayColor: string // 'black' | 'white'
  },
  setCustomBackgroundImage: (imageData, effects) => void,
  resetBackgroundImage: () => void
}
```

### 3. Utilidad: imageProcessor.js
**Ubicación**: `src/utils/imageProcessor.js`

**Funciones**:
```javascript
// Convertir imagen a base64
imageToBase64(file) => Promise<string>

// Comprimir imagen para localStorage
compressImage(base64, maxWidth, quality) => Promise<string>

// Detectar luminosidad promedio de la imagen
detectImageBrightness(imageUrl) => Promise<number>

// Sugerir color de overlay según luminosidad
suggestOverlayColor(brightness) => 'black' | 'white'

// Validar tamaño de imagen
validateImageSize(file, maxSizeMB) => boolean
```

### 4. Estilos CSS
**Ubicación**: `src/index.css`

**Nuevas clases**:
```css
.custom-background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}
```

## Flujo de Usuario

### Paso 1: Acceder a la Funcionalidad
- Usuario hace clic en botón "Cambiar Fondo" en ColorThemeModal
- Se abre BackgroundImageUploader modal

### Paso 2: Seleccionar Imagen
- Usuario hace clic en "Seleccionar Imagen"
- Se abre selector de archivos del sistema
- Formatos aceptados: JPG, PNG, WEBP
- Tamaño máximo: 5MB (se comprimirá si es necesario)

### Paso 3: Preview y Ajustes
- Se muestra preview de la imagen con efectos aplicados
- Controles deslizantes para ajustar:
  - Intensidad de desenfoque (0-20px)
  - Opacidad de overlay (0-100%)
  - Color de overlay (Negro/Blanco - auto-sugerido)
- Vista previa en tiempo real

### Paso 4: Aplicar
- Usuario hace clic en "Aplicar Fondo"
- Imagen se guarda en localStorage (comprimida)
- Efectos se guardan en localStorage
- Se aplica inmediatamente al fondo de la página

### Paso 5: Restaurar (Opcional)
- Botón "Restaurar Fondo Original"
- Elimina imagen de localStorage
- Vuelve al fondo crema original

## Consideraciones Técnicas

### LocalStorage
**Límite**: ~5-10MB dependiendo del navegador

**Estrategia**:
1. Comprimir imagen a máximo 1920px de ancho
2. Calidad JPEG: 70-80%
3. Convertir a base64 y guardar
4. Si excede límite, mostrar error y pedir imagen más pequeña

**Alternativa**: 
- Usar IndexedDB para imágenes más grandes
- Permite hasta 50MB+ de almacenamiento

### Performance
- Lazy loading de la imagen de fondo
- Usar `loading="lazy"` si es posible
- Comprimir imagen en el cliente antes de guardar
- Usar WebP si el navegador lo soporta

### Accesibilidad
- Garantizar contraste mínimo WCAG AA (4.5:1)
- Ajustar automáticamente color de texto según fondo
- Advertencia si la imagen reduce legibilidad

### Responsive
- Usar `background-size: cover` para adaptación automática
- Considerar diferentes imágenes para móvil/desktop (opcional)
- Optimizar tamaño de imagen según viewport

## Fases de Implementación

### Fase 1: Infraestructura Base
1. Crear `imageProcessor.js` con funciones de procesamiento
2. Extender `ColorThemeContext` con estado de imagen de fondo
3. Crear estilos CSS base para fondo personalizado

### Fase 2: Componente de Subida
1. Crear `BackgroundImageUploader.jsx`
2. Implementar selector de archivos
3. Implementar preview de imagen
4. Validación de formato y tamaño

### Fase 3: Efectos de Legibilidad
1. Implementar overlay semitransparente
2. Implementar blur effect
3. Controles deslizantes para ajustar efectos
4. Detección automática de luminosidad

### Fase 4: Persistencia
1. Guardar imagen en localStorage (comprimida)
2. Guardar configuración de efectos
3. Cargar imagen al iniciar la aplicación
4. Función de restauración

### Fase 5: Integración UI
1. Agregar botón en ColorThemeModal
2. Integrar BackgroundImageUploader
3. Mostrar indicador de fondo personalizado activo
4. Botón de restauración visible cuando hay fondo custom

### Fase 6: Optimización y Testing
1. Optimizar compresión de imágenes
2. Testing en diferentes dispositivos
3. Testing de performance
4. Ajustes de accesibilidad

## Interfaz de Usuario Propuesta

### En ColorThemeModal
```
┌─────────────────────────────────────┐
│  Personalizar Colores               │
├─────────────────────────────────────┤
│  [Selector de Color Principal]      │
│  [Preview de Paleta]                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🖼️ Cambiar Fondo de Imagen  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Cambiar Color de Fondo]          │
│  [Restablecer]                     │
└─────────────────────────────────────┘
```

### BackgroundImageUploader Modal
```
┌─────────────────────────────────────┐
│  Fondo de Imagen Personalizado  ❌  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [Preview de Imagen]      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  📁 Seleccionar Imagen              │
│     (JPG, PNG, WEBP - Max 5MB)     │
│                                     │
│  Efectos de Legibilidad:            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  Desenfoque: ▓▓▓▓▓░░░░░ 50%       │
│  Overlay: ▓▓▓▓▓▓▓░░░ 70%          │
│  Color: ⚫ Negro  ⚪ Blanco         │
│                                     │
│  ⚠️ Ajusta los efectos para        │
│     mantener la legibilidad        │
│                                     │
│  [Cancelar]  [Aplicar Fondo]       │
└─────────────────────────────────────┘
```

## Ventajas de esta Solución

✅ **Personalización Total**: Usuario puede usar cualquier imagen
✅ **Legibilidad Garantizada**: Efectos automáticos protegen el contenido
✅ **Persistencia**: Se guarda entre sesiones
✅ **Performance**: Compresión automática
✅ **Responsive**: Se adapta a todos los dispositivos
✅ **Accesibilidad**: Mantiene contraste adecuado
✅ **Fácil de Usar**: Interfaz intuitiva con preview

## Desventajas y Mitigaciones

❌ **Límite de localStorage**: 
   ✅ Comprimir imagen agresivamente
   ✅ Considerar IndexedDB para imágenes grandes

❌ **Performance en móviles**: 
   ✅ Comprimir más en dispositivos móviles
   ✅ Lazy loading de la imagen

❌ **Imágenes inapropiadas**: 
   ✅ Solo visible para el usuario (localStorage local)
   ✅ No se comparte ni se sube a servidor

## Tecnologías Necesarias

- **Canvas API**: Para comprimir y procesar imágenes
- **FileReader API**: Para leer archivos del usuario
- **localStorage/IndexedDB**: Para persistencia
- **CSS Filters**: Para efectos de blur y overlay
- **React State**: Para gestión de estado

## Estimación de Tiempo

- **Fase 1**: 2-3 horas
- **Fase 2**: 3-4 horas
- **Fase 3**: 3-4 horas
- **Fase 4**: 2-3 horas
- **Fase 5**: 2-3 horas
- **Fase 6**: 2-3 horas

**Total**: 14-20 horas de desarrollo

## Próximos Pasos

1. ¿Te gusta este enfoque?
2. ¿Prefieres algún efecto específico para la legibilidad?
3. ¿Quieres que empiece con la implementación?
4. ¿Alguna modificación al plan?
