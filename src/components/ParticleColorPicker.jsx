import { useState, useEffect, useRef } from 'react';
import { X, Check, Droplet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticlePreview } from './ParticlePreview';
import { ColorPickerSelector } from './ColorPickerSelector';
import { useModal } from '../context/ModalContext';

const COLOR_PRESETS = {
  snow: [
    { primary: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)', name: 'Blanco Puro' },
    { primary: '#FFF8F0', glow: 'rgba(255, 248, 240, 0.8)', name: 'Blanco Crema' },
    { primary: '#F0F8FF', glow: 'rgba(240, 248, 255, 0.8)', name: 'Blanco Azulado' },
    { primary: '#FFF0F5', glow: 'rgba(255, 240, 245, 0.8)', name: 'Blanco Rosado' },
    { primary: '#FFFACD', glow: 'rgba(255, 250, 205, 0.8)', name: 'Blanco Dorado' },
  ],
  stars: [
    { primary: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)', name: 'Blanco Puro' },
    { primary: '#FFFFDC', glow: 'rgba(255, 255, 220, 0.7)', name: 'Amarillo Claro' },
    { primary: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)', name: 'Dorado' },
    { primary: '#C8DCFF', glow: 'rgba(200, 220, 255, 0.6)', name: 'Azul Claro' },
    { primary: '#FFE4E1', glow: 'rgba(255, 228, 225, 0.6)', name: 'Rosa Claro' },
  ],
  'light-particles': [
    { primary: 'rgba(190, 227, 176, 0.9)', glow: 'rgba(255, 204, 128, 0.7)', name: 'Potaxie Original' },
    { primary: 'rgba(163, 230, 53, 0.8)', glow: 'rgba(255, 215, 0, 0.6)', name: 'Verde Dorado' },
    { primary: 'rgba(201, 235, 179, 0.9)', glow: 'rgba(230, 167, 0, 0.7)', name: 'Verde Amarillo' },
    { primary: 'rgba(255, 204, 128, 0.85)', glow: 'rgba(190, 227, 176, 0.7)', name: 'Crema Verde' },
    { primary: 'rgba(230, 167, 0, 0.7)', glow: 'rgba(255, 215, 0, 0.6)', name: 'Amarillo Intenso' },
  ],
  hearts: [
    { primary: '#ff6b9d', glow: 'rgba(255, 107, 157, 0.6)', name: 'Rosa Intenso' },
    { primary: '#ff3366', glow: 'rgba(255, 51, 102, 0.6)', name: 'Rojo Pasión' },
    { primary: '#ff8da1', glow: 'rgba(255, 141, 161, 0.6)', name: 'Coral' },
    { primary: '#ff69b4', glow: 'rgba(255, 105, 180, 0.6)', name: 'Fucsia' },
    { primary: '#ffb3c1', glow: 'rgba(255, 179, 193, 0.6)', name: 'Rosa Pastel' },
  ]
};

const parseRgba = (rgba) => {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  
  const [_, r, g, b, a] = match;
  return {
    rgb: [parseInt(r), parseInt(g), parseInt(b)],
    alpha: a ? parseFloat(a) : 1
  };
};

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

const hexToRgba = (hex, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
};

export const ParticleColorPicker = ({ 
  particleType, 
  currentColors, 
  isOpen, 
  onClose, 
  onApply 
}) => {
  const { openModal, closeModal } = useModal();
  const [activeTab, setActiveTab] = useState('primary');
  const [primaryColor, setPrimaryColor] = useState(currentColors?.primary || '#ffffff');
  const [glowColor, setGlowColor] = useState(currentColors?.glow || 'rgba(255,255,255, 0.8)');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [glowAlpha, setGlowAlpha] = useState(0.8);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPrimaryColor(currentColors?.primary || '#ffffff');
      setGlowColor(currentColors?.glow || 'rgba(255,255,255, 0.8)');
      
      const parsedGlow = parseRgba(currentColors?.glow || 'rgba(255,255,255, 0.8)');
      if (parsedGlow) {
        setGlowAlpha(parsedGlow.alpha);
      }
      
      setSelectedPreset(null);
      setActiveTab('primary');
      
      openModal();
    } else {
      closeModal();
    }
  }, [isOpen, currentColors, openModal, closeModal]);

  const presets = COLOR_PRESETS[particleType] || [];

  const handlePresetClick = (preset) => {
    setSelectedPreset(preset);
    setPrimaryColor(preset.primary);
    setGlowColor(preset.glow);
    
    const parsedGlow = parseRgba(preset.glow);
    if (parsedGlow) {
      setGlowAlpha(parsedGlow.alpha);
    }
  };

  const handlePrimaryColorChange = (hex) => {
    setPrimaryColor(hex);
    setSelectedPreset(null);
  };

  const handleGlowColorChange = (hex) => {
    setGlowColor(hexToRgba(hex, glowAlpha));
    setSelectedPreset(null);
  };

  const handleGlowAlphaChange = (alpha) => {
    setGlowAlpha(alpha);
    const parsedGlow = parseRgba(glowColor);
    if (parsedGlow) {
      setGlowColor(hexToRgba(rgbToHex(...parsedGlow.rgb), alpha));
    }
  };

  const handleApply = () => {
    onApply({ primary: primaryColor, glow: glowColor });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4">
          <motion.div
            key={`color-picker-backdrop-${particleType}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            key={`color-picker-modal-${particleType}`}
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl glass-modal rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-800 dark:text-gray-600">
                Personalizar Colores
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview - Layout Lineal */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-600 mb-3">Previsualización</h4>
              <div className="flex justify-center">
                <ParticlePreview 
                  particleType={particleType}
                  colors={{ primary: primaryColor, glow: glowColor }}
                  isCompact={false}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
              <button
                onClick={() => setActiveTab('primary')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'primary'
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-600 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-600'
                }`}
              >
                <Droplet size={16} className="inline mr-1" />
                Primario
              </button>
              <button
                onClick={() => setActiveTab('glow')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'glow'
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-600 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-600'
                }`}
              >
                <Droplet size={16} className="inline mr-1" />
                Brillo
              </button>
            </div>

            {/* Primary Color Picker - Layout Lineal */}
            {activeTab === 'primary' && (
              <div className="mb-4">
                <ColorPickerSelector
                  color={primaryColor.startsWith('rgba')
                    ? rgbToHex(...parseRgba(primaryColor)?.rgb || [255,255,255])
                    : primaryColor
                  }
                  onChange={handlePrimaryColorChange}
                  label="Color Primario"
                  modalRef={modalRef}
                />
              </div>
            )}

            {/* Glow Color Picker - Layout Lineal */}
            {activeTab === 'glow' && (
              <div className="mb-4 space-y-3">
                <ColorPickerSelector
                  color={glowColor.startsWith('rgba')
                    ? rgbToHex(...parseRgba(glowColor)?.rgb || [255,255,255])
                    : glowColor
                  }
                  onChange={handleGlowColorChange}
                  label="Color de Brillo"
                  modalRef={modalRef}
                />
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-600 mb-2">
                    Opacidad del brillo: {Math.round(glowAlpha * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={glowAlpha}
                    onChange={(e) => handleGlowAlphaChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-potaxie-green"
                  />
                </div>
              </div>
            )}

            {/* Presets - Layout Lineal */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-600 mb-3">
                Paletas Predefinidas
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {presets.map((preset, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePresetClick(preset)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      selectedPreset?.name === preset.name
                        ? 'border-potaxie-green bg-potaxie-green/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-potaxie-green/50'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full shadow-lg flex-shrink-0"
                      style={{
                        background: `radial-gradient(circle, ${preset.primary} 0%, ${preset.glow} 100%)`
                      }}
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-600">
                      {preset.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-600 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-potaxie-green to-teal-500 text-white hover:from-green-400 hover:to-teal-400 transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Check size={18} className="flex-shrink-0" />
                <span>Aplicar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
