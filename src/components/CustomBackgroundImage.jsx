import { useColorTheme } from '../context/ColorThemeContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useMemo } from 'react';

/**
 * Componente que renderiza la imagen de fondo personalizada con efectos
 * Preserva el fondo al cambiar entre tema claro y oscuro
 */
export function CustomBackgroundImage() {
  const { backgroundImage, backgroundEffects } = useColorTheme();
  const { theme } = useTheme();

  // Memorizar la imagen para evitar re-renders innecesarios
  const memoizedImage = useMemo(() => backgroundImage, [backgroundImage]);

  // CRÍTICO: Hacer el body transparente cuando hay fondo personalizado
  // Y restaurar el color cuando se elimina la imagen
  useEffect(() => {
    console.log('[CustomBackgroundImage] 🎨 Effect triggered, memoizedImage:', !!memoizedImage);

    if (memoizedImage) {
      // Hay imagen de fondo - hacer body transparente
      console.log('[CustomBackgroundImage] 🎨 Setting body to transparent');
      document.body.classList.add('has-custom-background');
      document.body.style.setProperty('background-color', 'transparent', 'important');
      document.body.style.setProperty('background-image', 'none', 'important');
    } else {
      // No hay imagen - restaurar el color de fondo desde CSS variables
      console.log('[CustomBackgroundImage] 🎨 Restoring body background color');
      document.body.classList.remove('has-custom-background');
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('background-image');
    }

    // Cleanup: asegurar estado correcto al desmontar
    return () => {
      console.log('[CustomBackgroundImage] 🧹 Cleanup - removing custom background styles');
      document.body.classList.remove('has-custom-background');
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('background-image');
    };
  }, [memoizedImage, theme]); // Re-ejecutar cuando cambia el tema también

  // Effect to update overlay color based on theme changes
  useEffect(() => {
    if (!memoizedImage) return;

    console.log('[CustomBackgroundImage] 🎨 Theme changed, updating overlay color for:', theme);

    // Update overlay color based on current theme
    const overlayElement = document.querySelector('.theme-overlay');
    if (overlayElement) {
      const newOverlayColor = theme === 'dark' ? '#ffffff' : '#000000';
      overlayElement.style.backgroundColor = newOverlayColor;
      console.log('[CustomBackgroundImage] ✅ Overlay color updated to:', newOverlayColor);
    }
  }, [theme, memoizedImage]);

  if (!memoizedImage) {
    return null;
  }

  return (
    <>
      {/* Imagen de fondo - Estilos robustos que no se ven afectados por el tema */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${memoizedImage})`,
          filter: `blur(${backgroundEffects.blur}px)`,
          zIndex: -2,
          pointerEvents: 'none'
        }}
      />
      
      {/* Overlay para legibilidad - Se ajusta automáticamente según el tema */}
      <div
        className="fixed inset-0 pointer-events-none theme-overlay"
        style={{
          backgroundColor: theme === 'dark' ? '#ffffff' : '#000000',
          opacity: backgroundEffects.overlay / 100,
          zIndex: -1,
          transition: 'opacity 0.3s ease-in-out, background-color 0.3s ease-in-out'
        }}
      />
    </>
  );
}
