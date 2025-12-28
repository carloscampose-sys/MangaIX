# Plan: Figuras Ilustradas y Animaciones de Estrellas para Selección de Género

## Resumen

Este plan actualiza la pantalla de selección de género para usar figuras ilustradas personalizadas (extraídas de la imagen de referencia) y agregar animaciones de estrellas en el fondo, mejorando la experiencia visual del Santuario Potaxie.

## Objetivos

1. **Extraer y preparar figuras ilustradas** de la imagen de referencia
2. **Implementar animaciones de estrellas** en el fondo de la pantalla
3. **Actualizar el componente GenderSelectionScreen** para usar las nuevas figuras
4. **Mejorar las animaciones de interacción** (hover, selección)

## Fase 1: Preparación de Assets

### 1.1 Extraer Figuras de la Imagen

**Herramientas recomendadas:**
- **remove.bg** (https://www.remove.bg/) - Servicio online gratuito para remover fondos
- **Photoshop/GIMP** - Para ajustes manuales si es necesario
- **Figma** - Para exportar con transparencia optimizada

**Proceso:**
1. Subir la imagen a remove.bg
2. Descargar cada figura sin fondo
3. Recortar individualmente cada personaje:
   - **Masculino**: Personaje con hoodie verde y controlador
   - **Femenino**: Personaje con flores rosadas y vestido crema
   - **Otro**: Personaje con poncho multicolor y lentes
4. Remover el texto ("MASCULINO", "FEMENINO", "OTRO")
5. Optimizar tamaño: 300-400px de altura
6. Exportar como PNG con transparencia

**Nombres de archivos:**
- `public/gender-masculino.png`
- `public/gender-femenino.png`
- `public/gender-otro.png`

### 1.2 Verificar Calidad

- Verificar que el fondo es completamente transparente
- Verificar que no hay artefactos o bordes blancos
- Verificar que las figuras mantienen buena calidad visual
- Optimizar peso de archivo (usar TinyPNG si es necesario)

## Fase 2: Implementar Animación de Estrellas

### 2.1 Crear Componente StarAnimation

**Archivo:** `src/components/StarAnimation.jsx`

**Inspiración:** Similar a `SnowEffect.jsx` existente en el proyecto

**Características:**
- 30-50 estrellas generadas aleatoriamente
- Animación de parpadeo (twinkle) con CSS keyframes
- Tamaños variados (2-6px)
- Opacidades variables (0.3-0.8)
- Colores: blanco, amarillo claro, dorado suave
- Posiciones aleatorias en toda la pantalla

**Implementación CSS:**
```css
@keyframes twinkle {
  0%, 100% { 
    opacity: 0.3; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1.2); 
  }
}

.star {
  animation: twinkle 2s ease-in-out infinite;
  animation-delay: calc(var(--delay) * 1s);
}
```

### 2.2 Integrar en GenderSelectionScreen

- Importar StarAnimation
- Agregar como capa de fondo (z-index bajo)
- Asegurar que no interfiere con la interacción del usuario
- Modal debe estar por encima (z-index alto)

## Fase 3: Actualizar GenderSelectionScreen

### 3.1 Reemplazar Emojis con Figuras

**Cambios en `genderOptions`:**
```javascript
const genderOptions = [
  {
    id: 'masculino',
    label: 'Masculino',
    image: '/gender-masculino.png',  // Nueva propiedad
    color: 'ring-blue-500',
    shadowColor: 'shadow-blue-500/50'
  },
  {
    id: 'femenino',
    label: 'Femenino',
    image: '/gender-femenino.png',
    color: 'ring-pink-500',
    shadowColor: 'shadow-pink-500/50'
  },
  {
    id: 'otro',
    label: 'Otro',
    image: '/gender-otro.png',
    color: 'ring-purple-500',
    shadowColor: 'shadow-purple-500/50'
  }
];
```

### 3.2 Actualizar Renderizado

**Cambiar de:**
```jsx
<span className="text-3xl">{option.emoji}</span>
```

**A:**
```jsx
<img 
  src={option.image} 
  alt={option.label}
  className="w-24 h-24 object-contain"
/>
```

### 3.3 Mejorar Animaciones de Interacción

**Hover:**
- `hover:scale-110` - Escala al 110%
- `hover:brightness-110` - Aumenta brillo
- Transición suave con `transition-all duration-300`

**Selección:**
- Ring de color específico por género
- Sombra con glow effect
- Escala ligeramente mayor

**Ejemplo:**
```jsx
className={`
  transform transition-all duration-300
  hover:scale-110 hover:brightness-110
  ${selectedGender === option.id
    ? `${option.color} ${option.shadowColor} scale-105 ring-4 ring-offset-2`
    : 'hover:shadow-lg'
  }
`}
```

## Fase 4: Testing y Verificación

### 4.1 Tests Visuales

- [ ] Verificar que las figuras se cargan correctamente
- [ ] Verificar que las animaciones de estrellas funcionan
- [ ] Verificar que las animaciones hover son suaves
- [ ] Verificar que la selección visual es clara
- [ ] Verificar rendimiento fluido (60fps)

### 4.2 Tests de Integración

- [ ] Verificar flujo completo: WelcomeScreen → GenderSelectionScreen → LoadingScreen
- [ ] Verificar que las figuras se ven bien en diferentes tamaños de pantalla
- [ ] Verificar que el z-index es correcto (estrellas atrás, modal adelante)

### 4.3 Tests de Accesibilidad

- [ ] Verificar que las imágenes tienen atributos `alt` descriptivos
- [ ] Verificar que las animaciones no causan problemas de rendimiento
- [ ] Verificar que la selección es clara visualmente

## Estructura de Archivos

```
public/
├── gender-masculino.png    (nuevo)
├── gender-femenino.png     (nuevo)
└── gender-otro.png         (nuevo)

src/components/
├── StarAnimation.jsx       (nuevo)
└── GenderSelectionScreen.jsx (actualizar)

.kiro/specs/gender-selection/
├── requirements.md         (actualizado)
├── design.md              (actualizado)
└── tasks.md               (actualizado)
```

## Orden de Implementación

1. **Tarea 1**: Preparar assets de figuras ilustradas
2. **Tarea 2**: Crear componente StarAnimation
3. **Tarea 3**: Actualizar GenderSelectionScreen con figuras
4. **Tarea 4**: Implementar animaciones hover y selección
5. **Tarea 5**: Integrar StarAnimation en GenderSelectionScreen
6. **Tarea 13**: Checkpoint - Verificar implementación

## Notas Técnicas

### Librerías Necesarias

No se requieren librerías adicionales. Todo se puede implementar con:
- React (ya instalado)
- Tailwind CSS (ya instalado)
- CSS puro para animaciones

### Rendimiento

- Las animaciones CSS son más eficientes que JavaScript
- Las estrellas deben usar `transform` y `opacity` (propiedades GPU-aceleradas)
- Limitar número de estrellas a 30-50 para mantener 60fps

### Compatibilidad

- PNG con transparencia es compatible con todos los navegadores modernos
- CSS animations es compatible con todos los navegadores modernos
- No se requieren polyfills

## Referencias

- Spec completo: `.kiro/specs/gender-selection/`
- Componente similar: `src/components/SnowEffect.jsx`
- Herramienta de remoción de fondo: https://www.remove.bg/

## Próximos Pasos

1. Revisar este plan con el usuario
2. Comenzar con la Tarea 1 (preparar assets)
3. Continuar secuencialmente con las demás tareas
4. Verificar cada fase antes de continuar
