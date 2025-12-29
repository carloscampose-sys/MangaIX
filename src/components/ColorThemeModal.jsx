import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Palette, Copy, Check, Paintbrush } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useColorTheme } from '../context/ColorThemeContext';
import colorPaletteGenerator from '../utils/colorPaletteGenerator';
import { BackgroundColorPicker } from './BackgroundColorPicker';

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
  const { theme, setBaseColor, setCustomBackground, resetCustomBackground, resetTheme } = useColorTheme();
  const [selectedColor, setSelectedColor] = useState(theme?.baseColor || '#3b82f6');
  const [previewPalette, setPreviewPalette] = useState(null);
  const [hue, setHue] = useState(120);
  const [saturation, setSaturation] = useState(50);
  const [lightness, setLightness] = useState(50);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Estado para selector de fondo personalizado
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  
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
    setSelectedColor(hex);
  }, [hue, saturation, lightness]);

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
      const hsl = hexToHsl(theme.baseColor);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  }, [isOpen, theme]);

  // Manejar arrastre en el área de saturación/luminosidad
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

  const handleSaturationMouseMove = (e) => {
    if (isDraggingSaturation) {
      updateSaturationFromMouse(e);
    }
  };

  const handleSaturationTouchMove = (e) => {
    if (isDraggingSaturation) {
      e.preventDefault();
      updateSaturationFromTouch(e);
    }
  };

  const handleSaturationMouseUp = () => {
    setIsDraggingSaturation(false);
  };

  const handleSaturationTouchEnd = () => {
    setIsDraggingSaturation(false);
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

  // Manejar arrastre en la barra de matiz
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

  const handleHueMouseMove = (e) => {
    if (isDraggingHue) {
      updateHueFromMouse(e);
    }
  };

  const handleHueTouchMove = (e) => {
    if (isDraggingHue) {
      e.preventDefault();
      updateHueFromTouch(e);
    }
  };

  const handleHueMouseUp = () => {
    setIsDraggingHue(false);
  };

  const handleHueTouchEnd = () => {
    setIsDraggingHue(false);
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

  // Agregar event listeners globales
  useEffect(() => {
    if (isDraggingSaturation) {
      window.addEventListener('mousemove', handleSaturationMouseMove);
      window.addEventListener('mouseup', handleSaturationMouseUp);
      window.addEventListener('touchmove', handleSaturationTouchMove, { passive: false });
      window.addEventListener('touchend', handleSaturationTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleSaturationMouseMove);
        window.removeEventListener('mouseup', handleSaturationMouseUp);
        window.removeEventListener('touchmove', handleSaturationTouchMove);
        window.removeEventListener('touchend', handleSaturationTouchEnd);
      };
    }
  }, [isDraggingSaturation]);

  useEffect(() => {
    if (isDraggingHue) {
      window.addEventListener('mousemove', handleHueMouseMove);
      window.addEventListener('mouseup', handleHueMouseUp);
      window.addEventListener('touchmove', handleHueTouchMove, { passive: false });
      window.addEventListener('touchend', handleHueTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleHueMouseMove);
        window.removeEventListener('mouseup', handleHueMouseUp);
        window.removeEventListener('touchmove', handleHueTouchMove);
        window.removeEventListener('touchend', handleHueTouchEnd);
      };
    }
  }, [isDraggingHue]);

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

  const handleApplyCustomBackground = (bgColor) => {
    try {
      setCustomBackground(bgColor);
      console.log('[ColorThemeModal] Fondo personalizado aplicado:', bgColor);
    } catch (err) {
      console.error('Error aplicando fondo personalizado:', err);
    }
  };

  const handleResetBackground = () => {
    resetCustomBackground();
  };

  const handlePresetClick = (color) => {
    const hsl = hexToHsl(color);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(selectedColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && !showBackgroundPicker && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal - Centrado verticalmente */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl glass-modal rounded-2xl shadow-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto z-10 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Palette style={{ color: selectedColor }} size={24} className="sm:w-7 sm:h-7" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 dark:text-white">
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
              {/* Área de Saturación/Luminosidad */}
              <div
                ref={saturationRef}
                onMouseDown={handleSaturationMouseDown}
                onTouchStart={handleSaturationTouchStart}
                className="relative w-full h-48 sm:h-56 md:h-64 lg:h-80 rounded-xl cursor-crosshair mb-3 sm:mb-4 shadow-lg touch-none"
                style={{
                  background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`
                }}
              >
                {/* Indicador de posición */}
                <div
                  className="absolute w-5 h-5 sm:w-6 sm:h-6 border-3 sm:border-4 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${saturation}%`,
                    top: `${100 - lightness}%`,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.3)'
                  }}
                />
              </div>

              {/* Barra de Matiz */}
              <div
                ref={hueRef}
                onMouseDown={handleHueMouseDown}
                onTouchStart={handleHueTouchStart}
                className="relative w-full h-7 sm:h-8 rounded-lg cursor-pointer shadow-lg mb-3 sm:mb-4 touch-none"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              >
                {/* Indicador de matiz */}
                <div
                  className="absolute w-5 sm:w-6 h-full border-3 sm:border-4 border-white rounded-lg shadow-lg transform -translate-x-1/2 pointer-events-none"
                  style={{
                    left: `${(hue / 360) * 100}%`,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.3)'
                  }}
                />
              </div>

              {/* Código HEX */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">HEX</p>
                      <p className="text-lg sm:text-2xl font-mono font-bold text-gray-800 dark:text-white truncate">
                        {selectedColor.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 sm:p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 touch-target"
                    title="Copiar código"
                  >
                    {copied ? <Check size={18} className="sm:w-5 sm:h-5 text-green-500" /> : <Copy size={18} className="sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Colores predefinidos */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Colores populares
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => handlePresetClick(color)}
                    className={`aspect-square rounded-lg transition-all transform hover:scale-110 active:scale-95 shadow-md touch-target ${
                      selectedColor.toLowerCase() === color.toLowerCase() ? 'ring-3 sm:ring-4 ring-potaxie-green ring-offset-2' : ''
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
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
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
              <p className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4 text-center font-semibold">{error}</p>
            )}

            {/* Botón para cambiar fondo personalizado */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => setShowBackgroundPicker(true)}
                className="w-full px-4 py-3 rounded-lg font-bold text-sm sm:text-base bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg flex items-center justify-center gap-2 touch-target"
              >
                <Paintbrush size={18} />
                <span>Cambiar Color de Fondo</span>
              </button>
              {theme?.customBackground && (
                <button
                  onClick={handleResetBackground}
                  className="w-full mt-2 px-3 py-2 rounded-lg font-bold text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Restaurar fondo automático
                </button>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 touch-target"
              >
                <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Restablecer</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors touch-target"
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

      {/* Selector de fondo personalizado */}
      {showBackgroundPicker && (
        <BackgroundColorPicker
          isOpen={showBackgroundPicker}
          onClose={() => setShowBackgroundPicker(false)}
          onApply={handleApplyCustomBackground}
          currentColor={theme?.customBackground || theme?.palette?.background || '#FDF5E6'}
        />
      )}
    </AnimatePresence>
  );
}
