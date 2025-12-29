# Plan de Implementación: Efecto Parallax con simple-parallax-js

## 📋 Resumen Ejecutivo

Implementar un efecto parallax responsive al hacer scroll usando la biblioteca `simple-parallax-js` en la aplicación Potaxie Web. El efecto se aplicará a elementos visuales clave para mejorar la experiencia de usuario con animaciones suaves y fluidas que funcionan en todas las plataformas (desktop, tablet, mobile).

## 🎯 Objetivos

1. **Integrar simple-parallax-js** en el proyecto React
2. **Aplicar efectos parallax** a elementos visuales estratégicos
3. **Garantizar responsividad** en todas las plataformas
4. **Optimizar rendimiento** para evitar lag en dispositivos móviles
5. **Mantener accesibilidad** respetando preferencias de movimiento reducido

## 📦 Instalación

```bash
npm install simple-parallax-js
```

## 🏗️ Arquitectura de Implementación

### Componentes a Modificar

1. **WelcomeScreen.jsx** - Pantalla de bienvenida con efecto parallax en el modal
2. **App.jsx** - Títulos y elementos decorativos con parallax
3. **ManhwaCard.jsx** - Imágenes de portada con parallax sutil
4. **Navbar.jsx** - Elementos del navbar con parallax ligero
5. **Oracle.jsx** - Elementos místicos con parallax profundo

### Hook Personalizado: `useParallax.js`

Crear un hook reutilizable que:
- Inicializa instancias de SimpleParallax
- Maneja cleanup automático
- Respeta preferencias de accesibilidad
- Permite configuración personalizada por componente

## 🎨 Estrategia de Aplicación

### Nivel 1: Parallax Sutil (scale: 1.1-1.2)
**Dónde:** Imágenes de portada, fondos de cards
**Por qué:** Movimiento suave que no distrae

### Nivel 2: Parallax Moderado (scale: 1.3-1.5)
**Dónde:** Títulos principales, elementos decorativos
**Por qué:** Efecto notable pero elegante

### Nivel 3: Parallax Profundo (scale: 1.6-2.0)
**Dónde:** Elementos místicos del Oracle, efectos especiales
**Por qué:** Impacto visual dramático

## 📱 Consideraciones Responsive

### Desktop (>1024px)
- Parallax completo con scale máximo
- Transiciones suaves
- Múltiples capas de profundidad

### Tablet (768px-1024px)
- Parallax moderado (scale reducido 20%)
- Menos capas de profundidad
- Optimización de rendimiento

### Mobile (<768px)
- Parallax mínimo o deshabilitado según preferencias
- Prioridad a rendimiento
- Respeto a `prefers-reduced-motion`

## 🔧 Configuración Técnica

### Opciones de SimpleParallax

```javascript
{
  scale: 1.3,              // Factor de escala (1.1-2.0)
  orientation: 'up',       // Dirección: 'up', 'down', 'left', 'right'
  overflow: true,          // Permitir overflow para el efecto
  delay: 0.4,              // Delay de la animación (0-1)
  transition: 'cubic-bezier(0,0,0,1)', // Función de easing
  maxTransition: 50,       // Máximo desplazamiento en %
  customContainer: null,   // Contenedor personalizado
  customWrapper: null      // Wrapper personalizado
}
```

## 🎯 Implementación por Fases

### Fase 1: Setup y Hook Base
- [ ] Instalar `simple-parallax-js`
- [ ] Crear hook `useParallax.js`
- [ ] Implementar detección de `prefers-reduced-motion`
- [ ] Crear utilidad de configuración responsive

### Fase 2: Componentes Principales
- [ ] Aplicar parallax a WelcomeScreen
- [ ] Aplicar parallax a títulos en App.jsx
- [ ] Aplicar parallax a elementos decorativos

### Fase 3: Cards y Galería
- [ ] Aplicar parallax sutil a ManhwaCard
- [ ] Optimizar para listas largas
- [ ] Implementar lazy loading del efecto

### Fase 4: Elementos Especiales
- [ ] Parallax profundo en Oracle
- [ ] Efectos en Navbar
- [ ] Elementos de partículas (LightParticles, SnowEffect)

### Fase 5: Optimización y Testing
- [ ] Testing en diferentes dispositivos
- [ ] Optimización de rendimiento
- [ ] Ajustes de accesibilidad
- [ ] Documentación final

## 📊 Métricas de Éxito

- ✅ Efecto parallax visible y suave en desktop
- ✅ Sin lag en dispositivos móviles
- ✅ Respeta `prefers-reduced-motion`
- ✅ FPS estable (>30fps en mobile, >60fps en desktop)
- ✅ No afecta tiempo de carga inicial

## ⚠️ Consideraciones Importantes

### Rendimiento
- Limitar número de elementos con parallax simultáneos
- Usar `will-change: transform` con precaución
- Implementar IntersectionObserver para activar/desactivar según visibilidad

### Accesibilidad
- Respetar `prefers-reduced-motion: reduce`
- Proporcionar alternativa sin movimiento
- No usar parallax en elementos interactivos críticos

### UX
- No abusar del efecto (menos es más)
- Mantener coherencia en la dirección del movimiento
- Asegurar que el contenido siga siendo legible

## 🔗 Recursos y Referencias

- [simple-parallax-js Documentación](https://simpleparallax.com/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Web Performance Best Practices](https://web.dev/performance/)

## 📝 Notas de Implementación

### Estructura de Archivos
```
src/
├── hooks/
│   └── useParallax.js          # Hook personalizado
├── utils/
│   └── parallaxConfig.js       # Configuraciones predefinidas
├── components/
│   ├── WelcomeScreen.jsx       # ✨ Con parallax
│   ├── ManhwaCard.jsx          # ✨ Con parallax
│   ├── Oracle.jsx              # ✨ Con parallax
│   └── Navbar.jsx              # ✨ Con parallax
└── App.jsx                     # ✨ Con parallax
```

### Ejemplo de Uso

```jsx
import { useParallax } from '../hooks/useParallax';

function MyComponent() {
  const parallaxRef = useParallax({
    scale: 1.3,
    orientation: 'up',
    delay: 0.4
  });

  return (
    <div ref={parallaxRef} className="parallax-element">
      <img src="image.jpg" alt="Parallax" />
    </div>
  );
}
```

## 🚀 Próximos Pasos

1. Revisar y aprobar este plan
2. Crear spec formal en `.kiro/specs/parallax-scroll-effect/`
3. Implementar fase por fase
4. Testing exhaustivo en múltiples dispositivos
5. Deploy y monitoreo de rendimiento

---

**Fecha de Creación:** 2025-12-29
**Autor:** Kiro AI
**Estado:** Pendiente de Aprobación
