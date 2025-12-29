import { useColorTheme } from '../context/ColorThemeContext';

/**
 * Componente que renderiza la imagen de fondo personalizada con efectos
 */
export function CustomBackgroundImage() {
  const { backgroundImage, backgroundEffects } = useColorTheme();

  if (!backgroundImage) return null;

  return (
    <>
      {/* Imagen de fondo */}
      <div
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: `blur(${backgroundEffects.blur}px)`
        }}
      />
      
      {/* Overlay para legibilidad */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{
          backgroundColor: backgroundEffects.overlayColor === 'black' ? '#000000' : '#ffffff',
          opacity: backgroundEffects.overlay / 100
        }}
      />
    </>
  );
}
