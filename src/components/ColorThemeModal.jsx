import { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorPickerSelector } from './ColorPickerSelector';
import { useColorTheme } from '../context/ColorThemeContext';
import { useModal } from '../context/ModalContext';
import colorPaletteGenerator from '../utils/colorPaletteGenerator';

// Colores predefinidos populares
const PRESET_COLORS = [
  { color: '#3b82f6', name: 'Azul' },
  { color: '#8b5cf6', name: 'Púrpura' },
  { color: '#ec4899', name: 'Rosa' },
  { color: '#ef4444', name: 'Rojo' },
  { color: '#f59e0b', name: 'Naranja' },
  { color: '#10b981', name: 'Verde' },
  { color: '#06b6d4', name: 'Cian' },
  { color: '#6366f1', name: 'Índigo' },
];

export function ColorThemeModal({ isOpen, onClose }) {
  const { theme, setBaseColor, resetTheme } = useColorTheme();
  const { openModal, closeModal } = useModal();
  const [selectedColor, setSelectedColor] = useState(theme?.baseColor || '#3b82f6');
  const [previewPalette, setPreviewPalette] = useState(null);
  const [error, setError] = useState('');

  const modalRef = useRef(null);

  // Generar vista previa al cambiar color
  useEffect(() => {
    try {
      const palette = colorPaletteGenerator.generatePalette(selectedColor);
      setPreviewPalette(palette);
      setError('');
    } catch (err) {
      setError('Color inválido');
      setPreviewPalette(null);
    }
  }, [selectedColor]);

  // Sincronizar con tema actual al abrir
  useEffect(() => {
    if (isOpen && theme) {
      setSelectedColor(theme.baseColor);
      openModal();
    } else if (!isOpen) {
      closeModal();
    }
  }, [isOpen, theme, openModal, closeModal]);

  const handleApply = () => {
    try {
      setBaseColor(selectedColor);
      console.log('[ColorThemeModal] Color aplicado:', selectedColor);
      // Mostrar feedback visual
      const root = document.documentElement;
      root.style.transition = 'all 0.5s ease';
      onClose();
    } catch (err) {
      setError('No se pudo aplicar el color');
    }
  };

  const handleReset = () => {
    resetTheme();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 touch-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            dragListener={false}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm touch-none"
          />

          {/* Modal - Centrado verticalmente */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            dragListener={false}
            className="relative w-full max-w-2xl glass-modal rounded-2xl shadow-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto z-10 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <Palette style={{ color: selectedColor }} size={24} className="sm:w-7 sm:h-7" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-600">
                  Selector de Color
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
                aria-label="Cerrar"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Color Picker Principal */}
            <div className="mb-4 sm:mb-6">
              <ColorPickerSelector
                color={selectedColor}
                onChange={setSelectedColor}
                presets={PRESET_COLORS}
                showPresets={false}
                modalRef={modalRef}
              />
            </div>

            {/* Colores predefinidos */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-600 mb-2 sm:mb-3">
                Colores populares
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`aspect-square rounded-lg transition-all transform hover:scale-110 active:scale-95 shadow-md touch-target ${selectedColor.toLowerCase() === color.toLowerCase() ? 'ring-3 sm:ring-4 ring-potaxie-green ring-offset-2' : ''
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Seleccionar ${name}`}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* Vista previa de la paleta */}
            {previewPalette && (
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-600 mb-2 sm:mb-3">
                  Vista previa del tema
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <div className="text-center">
                    <div
                      className="h-16 sm:h-20 rounded-lg shadow-md mb-1 sm:mb-2 flex items-center justify-center text-white font-bold text-xs sm:text-sm"
                      style={{ backgroundColor: previewPalette.primary }}
                    >
                      Primario
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{previewPalette.primary}</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-16 sm:h-20 rounded-lg shadow-md mb-1 sm:mb-2 flex items-center justify-center text-white font-bold text-xs sm:text-sm"
                      style={{ backgroundColor: previewPalette.secondary }}
                    >
                      Secundario
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{previewPalette.secondary}</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-16 sm:h-20 rounded-lg shadow-md mb-1 sm:mb-2 flex items-center justify-center text-white font-bold text-xs sm:text-sm"
                      style={{ backgroundColor: previewPalette.accent }}
                    >
                      Acento
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{previewPalette.accent}</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-16 sm:h-20 rounded-lg shadow-md mb-1 sm:mb-2 flex items-center justify-center font-bold text-xs sm:text-sm border-2"
                      style={{
                        backgroundColor: previewPalette.background,
                        color: previewPalette.textPrimary,
                        borderColor: previewPalette.border
                      }}
                    >
                      Fondo
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{previewPalette.background}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4 text-center font-semibold flex-shrink-0">{error}</p>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleReset}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base text-gray-700 dark:text-gray-600 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 touch-target"
              >
                <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Restablecer</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base text-gray-700 dark:text-gray-600 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors touch-target"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={!!error}
                style={{ backgroundColor: !error ? selectedColor : undefined }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg touch-target"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
