import { useState, useEffect } from 'react';
import { X, Sparkles, Snowflake, Star, Droplets, Palette, RotateCcw, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParticleSettings } from '../context/ParticleSettingsContext';
import { useModal } from '../context/ModalContext';
import { ParticlePreview } from './ParticlePreview';
import { ParticleColorPicker } from './ParticleColorPicker';

const PARTICLE_TYPES = [
  {
    id: 'snow',
    name: 'Nieve',
    icon: Snowflake,
    description: 'Copos de nieve cayendo suavemente',
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'stars',
    name: 'Estrellas',
    icon: Star,
    description: 'Estrellas parpadeantes en el cielo',
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 'light-particles',
    name: 'Partículas de Luz',
    icon: Sparkles,
    description: 'Bolitas de luz flotando',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'hearts',
    name: 'Corazones',
    icon: Heart,
    description: 'Corazones flotando suavemente',
    color: 'from-pink-400 to-rose-500'
  },
  {
    id: 'none',
    name: 'Ninguna',
    icon: Droplets,
    description: 'Sin partículas en el fondo',
    color: 'from-gray-400 to-gray-500'
  }
];

export const ParticleSettingsModal = ({ isOpen, onClose }) => {
  const { 
    settings, 
    setParticleType, 
    setParticleColors,
    resetToDefaults,
    previewType, 
    setPreviewType 
  } = useParticleSettings();
  
  const { openModal, closeModal } = useModal();
  
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      openModal();
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

  if (!isOpen) return null;
  
  const selectedParticle = PARTICLE_TYPES.find(p => p.id === previewType);
  
  const getCurrentColors = () => {
    if (previewType === 'none') {
      return { primary: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' };
    }
    
    const savedColors = settings.customColors[previewType];
    if (savedColors && savedColors.primary && savedColors.glow) {
      return savedColors;
    }
    
    const defaultColors = {
      snow: { primary: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' },
      stars: { primary: 'rgba(255, 255, 255, 1)', glow: 'rgba(255, 255, 255, 0.6)' },
      'light-particles': { primary: 'rgba(190, 227, 176, 0.9)', glow: 'rgba(255, 204, 128, 0.7)' }
    };
    
    return defaultColors[previewType] || defaultColors['light-particles'];
  };
  
  const currentColors = getCurrentColors();

  const handleTypeSelect = (typeId) => {
    setPreviewType(typeId);
  };

  const handleApply = () => {
    setParticleType(previewType);
    onClose();
  };

  const handleColorApply = (colors) => {
    setParticleColors(previewType, colors);
  };

  const handleReset = () => {
    resetToDefaults();
    setPreviewType('light-particles');
  };

  return (
    <>
      {/* Modal Principal - AnimatePresence Separado */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
            <motion.div
              key="particle-settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              key="particle-settings-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl glass-modal rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto z-10 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-600">
                  Configuración de Partículas
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Personaliza las partículas de fondo y sus colores
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Particle Types Grid */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-400 mb-3">
                Selecciona tipo de partícula
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {PARTICLE_TYPES.map((type, index) => {
                  const Icon = type.icon;
                  const isSelected = previewType === type.id;
                  
                  return (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTypeSelect(type.id)}
                      className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left overflow-hidden ${
                        isSelected
                          ? `border-potaxie-green bg-gradient-to-br ${type.color}/10`
                          : 'border-gray-200 dark:border-gray-700 hover:border-potaxie-green/50 bg-white dark:bg-gray-800'
                      }`}
                    >
                      {/* Background gradient on selected */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.1 }}
                          className={`absolute inset-0 bg-gradient-to-br ${type.color}`}
                        />
                      )}

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${type.color}
                              flex items-center justify-center shadow-lg`}
                          >
                            <Icon className="text-white" size={20} />
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-potaxie-green flex items-center justify-center"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white"
                              />
                            </motion.div>
                          )}
                        </div>

                        <h5 className="font-black text-gray-800 dark:text-gray-600 text-xs sm:text-sm mb-0.5 sm:mb-1">
                          {type.name}
                        </h5>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {type.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Preview and Customization */}
            {previewType !== 'none' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-4 sm:p-5 bg-white/50 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-gray-700"
              >
                <div className="flex flex-col gap-4 sm:gap-5">
                  {/* Preview */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-400 mb-3">
                      Previsualización
                    </h4>
                    <div className="flex justify-center">
                      <ParticlePreview
                        particleType={previewType}
                        colors={currentColors}
                        isCompact={true}
                      />
                    </div>
                  </div>

                  {/* Color Customization */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-400">
                        Colores
                      </h4>
                      <button
                        onClick={() => setShowColorPicker(true)}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-potaxie-green to-teal-500 text-white text-xs sm:text-sm font-bold hover:from-green-400 hover:to-teal-400 transition-all shadow-md flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                      >
                        <Palette size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Personalizar</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-lg flex-shrink-0"
                        style={{
                          background: `radial-gradient(circle, ${currentColors.primary} 0%, ${currentColors.glow} 100%)`
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-500">
                          Colores actuales
                        </p>
                        <p className="text-xs sm:text-sm font-mono font-bold text-gray-800 dark:text-gray-600 truncate">
                          {currentColors.primary}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reset Button */}
            <div className="mb-4 flex justify-center">
              <button
                onClick={handleReset}
                className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Restablecer valores por defecto</span>
                <span className="sm:hidden">Restablecer</span>
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-600 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm bg-gradient-to-r from-potaxie-green to-teal-500 text-white hover:from-green-400 hover:to-teal-400 transition-all shadow-lg whitespace-nowrap"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      {/* Modal de Color - AnimatePresence Separado */}
      <ParticleColorPicker
        particleType={previewType}
        currentColors={currentColors}
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onApply={handleColorApply}
      />
    </>
  );
};
