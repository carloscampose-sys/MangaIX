import { motion, AnimatePresence } from 'framer-motion';
import { useColorTheme } from '../context/ColorThemeContext';
import { BackgroundColorPicker } from './BackgroundColorPicker';

export function BackgroundColorModal({ isOpen, onClose }) {
  const { theme, setCustomBackground, resetCustomBackground } = useColorTheme();

  const handleApplyCustomBackground = (bgColor) => {
    try {
      setCustomBackground(bgColor);
      console.log('[BackgroundColorModal] Fondo personalizado aplicado:', bgColor);
    } catch (err) {
      console.error('Error aplicando fondo personalizado:', err);
    }
  };

  const handleResetBackground = () => {
    resetCustomBackground();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <BackgroundColorPicker
          isOpen={isOpen}
          onClose={onClose}
          onApply={handleApplyCustomBackground}
          currentColor={theme?.customBackground || theme?.palette?.background || '#FDF5E6'}
          onReset={handleResetBackground}
        />
      )}
    </AnimatePresence>
  );
}
