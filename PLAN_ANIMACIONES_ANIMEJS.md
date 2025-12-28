# Plan de Implementación: Animaciones con Anime.js

## Contexto del Proyecto

Tu aplicación **Potaxie Web** es un buscador de mangas/manhwas/webtoons construido con:
- **React 19** + **Vite**
- **Framer Motion** (actualmente usado para transiciones de página)
- **Tailwind CSS** para estilos
- Múltiples componentes con animaciones existentes (StarAnimation, SnowEffect, LightParticles)

## Objetivo

Integrar **anime.js** para crear animaciones más complejas y fluidas que complementen las animaciones existentes de Framer Motion, sin reemplazarlas completamente.

---

## Fase 1: Instalación y Configuración Inicial

### 1.1 Instalar anime.js
```bash
npm install animejs
```

### 1.2 Crear utilidad de animación centralizada
Crear un archivo `src/utils/animeHelpers.js` con funciones reutilizables para anime.js:
- Funciones helper para animaciones comunes
- Configuraciones predefinidas (easings, duraciones)
- Utilidades para sincronizar con el ciclo de vida de React

---

## Fase 2: Animaciones de Entrada (Welcome & Gender Selection)

### 2.1 Mejorar WelcomeScreen.jsx
**Componentes a animar:**
- Título principal: entrada con efecto de "typing" + bounce
- Input field: entrada desde abajo con elastic easing
- Botón: hover con scale + glow pulsante
- Fondo: gradiente animado con morphing suave

**Técnicas:**
- `anime.timeline()` para secuenciar animaciones
- `anime.stagger()` para efectos escalonados
- Integración con `useEffect` para animaciones al montar

### 2.2 Mejorar GenderSelectionScreen.jsx
**Componentes a animar:**
- Opciones de género: entrada con stagger + rotation 3D
- Selección: efecto de "pulse" + partículas al seleccionar
- Transición entre opciones: morphing suave
- Confirmación: animación de éxito con confetti mejorado

---

## Fase 3: Animaciones de Búsqueda y Resultados

### 3.1 Barra de búsqueda (App.jsx)
**Animaciones:**
- Focus: expansión suave con glow animado
- Typing: indicador de actividad sutil
- Submit: ripple effect desde el botón
- Filtros: apertura/cierre con elastic easing

### 3.2 Cards de resultados (ManhwaCard.jsx)
**Animaciones:**
- Entrada: stagger con fade + slide desde diferentes ángulos
- Hover: elevación 3D con sombra dinámica
- Click: efecto de "flip" para mostrar detalles
- Carga de imágenes: skeleton con shimmer effect

### 3.3 Paginación
**Animaciones:**
- Transición entre páginas: slide con parallax
- Botones: hover con bounce
- Números de página: morphing entre valores

---

## Fase 4: Animaciones de Feedback y Estados

### 4.1 Loaders personalizados
**Componentes a mejorar:**
- `LoadingScreen.jsx`: animación del logo potaxie más dinámica
- `SearchLoader.jsx`: loader con morphing shapes
- `PageLoader.jsx`: progress bar con easing personalizado

**Técnicas:**
- Path animations para SVGs
- Morphing entre formas
- Loop infinito con variaciones

### 4.2 Toasts y notificaciones
**Animaciones:**
- Entrada: slide + bounce desde arriba
- Salida: fade + scale out
- Iconos: rotación o bounce al aparecer
- Progress bar: animación fluida

---

## Fase 5: Animaciones de Navegación

### 5.1 Navbar (Navbar.jsx)
**Animaciones:**
- Scroll: cambio de tamaño/opacidad suave
- Hover en items: underline animado
- Indicador activo: slide entre secciones
- Mobile menu: apertura con stagger

### 5.2 Transiciones de página
**Mejoras sobre Framer Motion:**
- Combinar anime.js para elementos específicos dentro de las páginas
- Parallax en elementos de fondo
- Efectos de partículas durante transiciones

---

## Fase 6: Animaciones Temáticas

### 6.1 Modo Navidad (SnowEffect.jsx)
**Mejoras:**
- Copos de nieve con trayectorias más naturales
- Viento simulado con variaciones
- Acumulación en elementos de la UI

### 6.2 Modo Claro (LightParticles.jsx)
**Mejoras:**
- Partículas con movimiento orgánico
- Interacción con el cursor
- Cambios de color suaves

### 6.3 Estrellas (StarAnimation.jsx)
**Mejoras:**
- Twinkle effect más realista
- Constelaciones animadas
- Shooting stars ocasionales

---

## Fase 7: Animaciones Interactivas

### 7.1 Oracle (Oracle.jsx)
**Animaciones:**
- Aparición del oráculo: efecto místico con partículas
- Selección aleatoria: ruleta animada
- Resultado: reveal dramático con confetti

### 7.2 Modal de detalles (DetailModal.jsx)
**Animaciones:**
- Apertura: scale + blur del fondo
- Contenido: stagger de elementos internos
- Cierre: reverse animation suave
- Scroll interno: parallax en imágenes

---

## Fase 8: Optimización y Performance

### 8.1 Lazy loading de animaciones
- Cargar anime.js solo cuando sea necesario
- Code splitting por componente
- Suspense boundaries para animaciones pesadas

### 8.2 Reducción de movimiento
- Detectar `prefers-reduced-motion`
- Versiones simplificadas de animaciones
- Toggle manual en configuración

### 8.3 Performance monitoring
- Medir FPS durante animaciones
- Optimizar animaciones costosas
- Throttling en scroll/resize events

---

## Fase 9: Animaciones Avanzadas

### 9.1 Efectos de partículas personalizados
- Sistema de partículas con anime.js
- Efectos al hacer click
- Trails del cursor

### 9.2 Animaciones de texto
- Typing effect mejorado
- Scramble text effect
- Morphing entre palabras

### 9.3 SVG animations
- Animación de paths
- Morphing entre formas
- Iconos animados personalizados

---

## Fase 10: Integración y Pulido

### 10.1 Consistencia visual
- Definir timing functions estándar
- Paleta de duraciones (rápido/medio/lento)
- Guía de estilo de animaciones

### 10.2 Accesibilidad
- Respetar preferencias del usuario
- Alternativas sin animación
- Focus states animados

### 10.3 Testing
- Probar en diferentes dispositivos
- Verificar performance en móviles
- Cross-browser testing

---

## Priorización Recomendada

### Alta Prioridad (Impacto Visual Inmediato)
1. **Fase 2**: Animaciones de entrada (WelcomeScreen, GenderSelection)
2. **Fase 3.2**: Cards de resultados con stagger
3. **Fase 4.1**: Loaders personalizados

### Media Prioridad (Mejoras de UX)
4. **Fase 3.1**: Barra de búsqueda interactiva
5. **Fase 5.1**: Navbar animada
6. **Fase 7.1**: Oracle con efectos místicos

### Baja Prioridad (Polish)
7. **Fase 6**: Mejoras temáticas
8. **Fase 9**: Efectos avanzados
9. **Fase 8**: Optimización profunda

---

## Consideraciones Técnicas

### Compatibilidad con Framer Motion
- **No reemplazar** Framer Motion para transiciones de página (ya funciona bien)
- **Usar anime.js** para animaciones más complejas dentro de componentes
- **Combinar** ambas librerías según fortalezas:
  - Framer Motion: gestos, drag, layout animations
  - Anime.js: timelines complejas, SVG paths, morphing

### Bundle Size
- anime.js es ligera (~6KB gzipped)
- Considerar tree-shaking
- Lazy load para animaciones no críticas

### Performance
- Usar `will-change` CSS para animaciones pesadas
- Preferir `transform` y `opacity` sobre otras propiedades
- Debounce/throttle en eventos de scroll/resize

---

## Próximos Pasos

1. **Revisar y aprobar** este plan
2. **Priorizar** qué fases implementar primero
3. **Crear spec detallado** para la fase elegida
4. **Implementar** incrementalmente con testing

---

## Recursos y Referencias

- [Documentación oficial de anime.js](https://animejs.com/documentation/)
- [Ejemplos de anime.js](https://animejs.com/examples/)
- [Integración con React](https://github.com/juliangarnier/anime#react-integration)
- [Performance best practices](https://web.dev/animations/)

---

## Notas Adicionales

- Este plan es **modular**: puedes implementar fases independientemente
- Cada fase puede convertirse en un **spec completo** con requirements/design/tasks
- Las animaciones deben **mejorar la UX**, no distraer
- Mantener **consistencia** con el estilo "potaxie" existente (colores, personalidad)

