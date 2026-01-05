import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundImageUploader } from './BackgroundImageUploader';
import { ColorPickerSelector } from './ColorPickerSelector';
import { useColorTheme } from '../context/ColorThemeContext';
import { useModal } from '../context/ModalContext';

// Color de fondo predeterminado (tema claro)
const DEFAULT_BACKGROUND_COLOR = '#FDF5E6';

// Colores de fondo recomendados (seguros para legibilidad)
const RECOMMENDED_BACKGROUNDS = [
  { color: '#FDF5E6', name: 'Crema Original' },
  { color: '#ffffff', name: 'Blanco' },
  { color: '#fefce8', name: 'Crema Claro' },
  { color: '#fef3c7', name: 'Amarillo Pastel' },
  { color: '#f5f5f5', name: 'Gris Claro' },
  { color: '#fce7f3', name: 'Rosa Pastel' },
  { color: '#e0f2fe', name: 'Azul Pastel' },
  { color: '#f0fdf4', name: 'Verde Pastel' },
];

export function BackgroundColorPicker({ isOpen, onClose, onApply, currentColor }) {
  const { backgroundImage, backgroundEffects, setBackgroundImage, resetBackgroundImage } = useColorTheme();
  const { openModal, closeModal } = useModal();
  const [bgColor, setBgColor] = useState(currentColor || '#ffffff');
  const [showImageUploader, setShowImageUploader] = useState(false);

  const modalRef = useRef(null);

  // Sincronizar con color actual al abrir
  useEffect(() => {
    if (isOpen && currentColor) {
      setBgColor(currentColor);
      openModal();
    } else if (!isOpen) {
      closeModal();
    }
  }, [isOpen, currentColor, openModal, closeModal]);

  const handleApply = () => {
    onApply(bgColor);
    onClose();
  };

  const handleImageApply = (imageData, effects) => {
    setBackgroundImage(imageData, effects);
    setShowImageUploader(false);
    onClose();
  };

  const handleRemoveImage = () => {
    resetBackgroundImage();
  };

  const handleReset = () => {
    setBgColor(DEFAULT_BACKGROUND_COLOR);
    onApply(DEFAULT_BACKGROUND_COLOR);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && !showImageUploader && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            key="background-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            key="background-modal"
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg glass-modal rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-black text-gray-800 dark:text-gray-600">
                Color de Fondo Personalizado
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
              >
                <X size={20} />
              </button>
            </div>

            {/* Advertencia */}
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
              <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Advertencia:</strong> Cambiar el color de fondo puede afectar la legibilidad del texto.
              </p>
            </div>

            {/* Colores recomendados */}
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-600 mb-2">
                Colores recomendados (seguros para legibilidad)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {RECOMMENDED_BACKGROUNDS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`aspect-square rounded-lg transition-all transform hover:scale-110 active:scale-95 shadow-md border-2 touch-target ${
                    bgColor.toLowerCase() === color.toLowerCase()
                      ? 'ring-3 sm:ring-4 ring-purple-500 ring-offset-2 border-purple-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Seleccionar ${name}`}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-600 mb-2">
                O elige un color personalizado
              </label>
              <ColorPickerSelector
                color={bgColor}
                onChange={setBgColor}
                presets={RECOMMENDED_BACKGROUNDS}
                showPresets={false}
                modalRef={modalRef}
              />
            </div>

            {/* Botón para subir imagen de fondo */}
            <div className="mb-4">
              <button
                onClick={() => setShowImageUploader(true)}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <ImageIcon size={20} />
                Subir Imagen de Fondo
              </button>
              {backgroundImage && (
                <button
                  onClick={handleRemoveImage}
                  className="w-full mt-2 py-2 px-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-sm"
                >
                  Eliminar Imagen de Fondo
                </button>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                {backgroundImage 
                  ? '✓ Imagen de fondo activa. El cambio de color no afectará la imagen.' 
                  : 'Sube tu propia imagen como fondo de pantalla'}
              </p>
            </div>

            {/* Botón de Restablecer */}
            <div className="mb-4 flex justify-center">
              <button
                onClick={handleReset}
                className="text-xs font-bold text-gray-400 hover:text-potaxie-green transition-colors flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Restablecer al color predeterminado
              </button>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-600 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors touch-target"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                style={{ backgroundColor: bgColor }}
                className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm text-white hover:opacity-90 transition-all shadow-lg touch-target"
              >
                Aplicar Fondo
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Background Image Uploader Modal */}
      <BackgroundImageUploader
        isOpen={showImageUploader}
        onClose={() => setShowImageUploader(false)}
        onApply={handleImageApply}
        currentImage={backgroundImage}
        currentEffects={backgroundEffects}
      />
    </AnimatePresence>
  );
}
