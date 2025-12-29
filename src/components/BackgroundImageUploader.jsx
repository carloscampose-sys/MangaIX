import { useState, useRef } from 'react';
import { Upload, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  imageToBase64,
  compressImage,
  detectImageBrightness,
  suggestOverlayColor,
  validateImageSize,
  validateImageType,
  getBase64Size
} from '../utils/imageProcessor';

export function BackgroundImageUploader({ isOpen, onClose, onApply, currentImage, currentEffects }) {
  const [selectedImage, setSelectedImage] = useState(currentImage || null);
  const [previewImage, setPreviewImage] = useState(currentImage || null);
  const [effects, setEffects] = useState(currentEffects || {
    blur: 10,
    overlay: 70,
    overlayColor: 'black'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      // Validar tipo de archivo
      if (!validateImageType(file)) {
        throw new Error('Formato no válido. Solo se permiten JPG, PNG y WEBP.');
      }

      // Validar tamaño
      if (!validateImageSize(file, 5)) {
        throw new Error('La imagen es demasiado grande. El tamaño máximo es 5MB.');
      }

      // Convertir a base64
      const base64 = await imageToBase64(file);

      // Comprimir imagen
      const compressed = await compressImage(base64, 1920, 0.8);

      // Verificar tamaño después de comprimir
      const compressedSize = getBase64Size(compressed);
      if (compressedSize > 2) {
        // Si aún es muy grande, comprimir más
        const moreCompressed = await compressImage(base64, 1280, 0.7);
        setSelectedImage(moreCompressed);
        setPreviewImage(moreCompressed);
      } else {
        setSelectedImage(compressed);
        setPreviewImage(compressed);
      }

      // Detectar luminosidad y sugerir color de overlay
      const brightness = await detectImageBrightness(compressed);
      const suggestedColor = suggestOverlayColor(brightness);
      
      setEffects(prev => ({
        ...prev,
        overlayColor: suggestedColor
      }));

      console.log('[BackgroundImageUploader] Image processed successfully');
    } catch (err) {
      console.error('[BackgroundImageUploader] Error processing image:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!selectedImage) {
      setError('Por favor, selecciona una imagen primero.');
      return;
    }

    onApply(selectedImage, effects);
    onClose();
  };

  const handleEffectChange = (key, value) => {
    setEffects(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl glass-modal rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto z-10 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                <ImageIcon size={24} />
                Fondo de Imagen Personalizado
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview Area */}
            <div className="mb-4">
              <div 
                className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600"
                style={{
                  backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Efectos de preview */}
                {previewImage && (
                  <>
                    {/* Blur effect */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backdropFilter: `blur(${effects.blur}px)`,
                        WebkitBackdropFilter: `blur(${effects.blur}px)`
                      }}
                    />
                    {/* Overlay effect */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundColor: effects.overlayColor === 'black' ? '#000000' : '#ffffff',
                        opacity: effects.overlay / 100
                      }}
                    />
                  </>
                )}

                {/* Placeholder cuando no hay imagen */}
                {!previewImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={48} className="mb-2" />
                    <p className="text-sm">Vista previa de la imagen</p>
                  </div>
                )}

                {/* Texto de ejemplo para ver legibilidad */}
                {previewImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <h4 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        Texto de Ejemplo
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Verifica que el texto sea legible
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File Input */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={20} />
                {isProcessing ? 'Procesando...' : selectedImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                JPG, PNG, WEBP - Máximo 5MB
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Effects Controls */}
            {selectedImage && (
              <div className="mb-4 space-y-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Efectos de Legibilidad
                </h4>

                {/* Blur Control */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Desenfoque: {effects.blur}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={effects.blur}
                    onChange={(e) => handleEffectChange('blur', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Overlay Control */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Opacidad de Capa: {effects.overlay}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={effects.overlay}
                    onChange={(e) => handleEffectChange('overlay', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Overlay Color */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Color de Capa
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEffectChange('overlayColor', 'black')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                        effects.overlayColor === 'black'
                          ? 'bg-gray-900 text-white ring-2 ring-purple-500'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      ⚫ Negro
                    </button>
                    <button
                      onClick={() => handleEffectChange('overlayColor', 'white')}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                        effects.overlayColor === 'white'
                          ? 'bg-white text-gray-900 ring-2 ring-purple-500'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      ⚪ Blanco
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Importante:</strong> Ajusta los efectos para mantener la legibilidad del texto. Una vez aplicada la imagen, el cambio de color de fondo no afectará la imagen.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedImage || isProcessing}
                className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar Fondo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
