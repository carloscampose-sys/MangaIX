import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundImageUploader } from './BackgroundImageUploader';
import { useColorTheme } from '../context/ColorThemeContext';

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
  const [bgColor, setBgColor] = useState(currentColor || '#ffffff');
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(100);
  const [showImageUploader, setShowImageUploader] = useState(false);
  
  const saturationRef = useRef(null);
  const hueRef = useRef(null);
  const [isDraggingSaturation, setIsDraggingSaturation] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // Convertir HSL a HEX
  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convertir HEX a HSL
  const hexToHsl = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Actualizar color cuando cambian HSL
  useEffect(() => {
    const hex = hslToHex(hue, saturation, lightness);
    setBgColor(hex);
  }, [hue, saturation, lightness]);

  // Sincronizar con color actual al abrir
  useEffect(() => {
    if (isOpen && currentColor) {
      const hsl = hexToHsl(currentColor);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  }, [isOpen, currentColor]);

  // Handlers para mouse
  const handleSaturationMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSaturation(true);
    updateSaturationFromMouse(e);
  };

  const handleSaturationTouchStart = (e) => {
    e.preventDefault();
    setIsDraggingSaturation(true);
    updateSaturationFromTouch(e);
  };

  const updateSaturationFromMouse = (e) => {
    if (!saturationRef.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const newSaturation = (x / rect.width) * 100;
    const newLightness = 100 - (y / rect.height) * 100;
    
    setSaturation(newSaturation);
    setLightness(newLightness);
  };

  const updateSaturationFromTouch = (e) => {
    if (!saturationRef.current || !e.touches[0]) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
    
    const newSaturation = (x / rect.width) * 100;
    const newLightness = 100 - (y / rect.height) * 100;
    
    setSaturation(newSaturation);
    setLightness(newLightness);
  };

  const handleHueMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingHue(true);
    updateHueFromMouse(e);
  };

  const handleHueTouchStart = (e) => {
    e.preventDefault();
    setIsDraggingHue(true);
    updateHueFromTouch(e);
  };

  const updateHueFromMouse = (e) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);
  };

  const updateHueFromTouch = (e) => {
    if (!hueRef.current || !e.touches[0]) return;
    const rect = hueRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);
  };

  // Event listeners
  useEffect(() => {
    if (isDraggingSaturation) {
      const handleMove = (e) => updateSaturationFromMouse(e);
      const handleTouchMove = (e) => { e.preventDefault(); updateSaturationFromTouch(e); };
      const handleEnd = () => setIsDraggingSaturation(false);
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDraggingSaturation]);

  useEffect(() => {
    if (isDraggingHue) {
      const handleMove = (e) => updateHueFromMouse(e);
      const handleTouchMove = (e) => { e.preventDefault(); updateHueFromTouch(e); };
      const handleEnd = () => setIsDraggingHue(false);
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDraggingHue]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && !showImageUploader && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg glass-modal rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto z-10 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-black text-gray-800 dark:text-white">
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
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Colores recomendados (seguros para legibilidad)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {RECOMMENDED_BACKGROUNDS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => {
                      const hsl = hexToHsl(color);
                      setHue(hsl.h);
                      setSaturation(hsl.s);
                      setLightness(hsl.l);
                    }}
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
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                O elige un color personalizado
              </label>
              <div
                ref={saturationRef}
                onMouseDown={handleSaturationMouseDown}
                onTouchStart={handleSaturationTouchStart}
                className="relative w-full h-40 sm:h-48 rounded-xl cursor-crosshair mb-3 shadow-lg touch-none"
                style={{
                  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`
                }}
              >
                <div
                  className="absolute w-5 h-5 border-3 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${saturation}%`,
                    top: `${100 - lightness}%`,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.3)'
                  }}
                />
              </div>

              <div
                ref={hueRef}
                onMouseDown={handleHueMouseDown}
                onTouchStart={handleHueTouchStart}
                className="relative w-full h-7 rounded-lg cursor-pointer shadow-lg mb-3 touch-none"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              >
                <div
                  className="absolute w-5 h-full border-3 border-white rounded-lg shadow-lg transform -translate-x-1/2 pointer-events-none"
                  style={{
                    left: `${(hue / 360) * 100}%`,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.3)'
                  }}
                />
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: bgColor }}
                  />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Color seleccionado</p>
                    <p className="text-lg font-mono font-bold text-gray-800 dark:text-white">
                      {bgColor.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
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

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors touch-target"
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
