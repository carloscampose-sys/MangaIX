import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useColorTheme } from '../context/ColorThemeContext';
import { useModal } from '../context/ModalContext';
import { BackgroundColorPicker } from './BackgroundColorPicker';

export function BackgroundColorModal({ isOpen, onClose }) {
  const { theme, setCustomBackground, resetCustomBackground } = useColorTheme();
  const { openModal, closeModal } = useModal();

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

  // Llamar a openModal y closeModal cuando el modal se abre/cierra
  useEffect(() => {
    if (isOpen) {
      openModal();
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

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
