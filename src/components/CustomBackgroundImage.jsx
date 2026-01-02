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

  // Detectar cambios en el tema y verificar que el fondo se mantiene
  useEffect(() => {
    if (memoizedImage) {
      console.log('[CustomBackgroundImage] 🌓 Theme changed to:', theme, '- Background preserved:', !!memoizedImage);
    }
  }, [theme, memoizedImage]);

  useEffect(() => {
    console.log('[CustomBackgroundImage] 🔄 Effect triggered - backgroundImage changed:', {
      hasImage: !!backgroundImage,
      imageLength: backgroundImage?.length || 0
    });
  }, [backgroundImage]);

  useEffect(() => {
    console.log('[CustomBackgroundImage] 🎨 Effect triggered - backgroundEffects changed:', backgroundEffects);
  }, [backgroundEffects]);

  console.log('[CustomBackgroundImage] 🖼️ Rendering with:', {
    hasImage: !!memoizedImage,
    imageLength: memoizedImage?.length || 0,
    effects: backgroundEffects,
    currentTheme: theme
  });

  if (!memoizedImage) {
    console.log('[CustomBackgroundImage] ❌ No background image found');
    return null;
  }

  console.log('[CustomBackgroundImage] ✅ Rendering background image');

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
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: backgroundEffects.overlayColor === 'black' ? '#000000' : '#ffffff',
          opacity: backgroundEffects.overlay / 100,
          zIndex: -1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </>
  );
}
