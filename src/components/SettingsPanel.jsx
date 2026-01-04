import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Palette, Snowflake, ChevronRight, Paintbrush } from 'lucide-react';
import { useChristmasTheme } from '../context/ChristmasThemeContext';
import { useToast } from '../context/ToastContext';
import { BackupModal } from './BackupModal';
import { ColorThemeModal } from './ColorThemeModal';
import { BackgroundColorModal } from './BackgroundColorModal';

// ============================================================
// SETTINGS HEADER COMPONENT
// ============================================================
const SettingsHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8 sm:mb-10 md:mb-12 text-center"
  >
    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
      <span className="text-potaxie-green dark:text-potaxie-300">
        Ajustes
      </span>
      <span className="text-3xl sm:text-4xl md:text-5xl">⚙️✨</span>
    </h2>
    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base md:text-lg font-medium px-2">
      Personaliza tu experiencia en El Santuario Potaxie
    </p>
  </motion.div>
);

// ============================================================
// SETTINGS CARD COMPONENT
// ============================================================
const SettingsCard = ({ section, index }) => {
  const Icon = section.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={section.action}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 
                 border-2 border-gray-100 dark:border-gray-700 
                 hover:border-transparent hover:shadow-2xl 
                 transition-all duration-300 text-left overflow-hidden"
      aria-label={section.title}
    >
      {/* Gradient Background on Hover */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${section.color} 
                    opacity-0 group-hover:opacity-10 transition-opacity duration-300`} 
      />
      
      {/* Icon */}
      <div 
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${section.color} 
                    flex items-center justify-center mb-4 sm:mb-6 
                    group-hover:scale-110 transition-transform duration-300 relative z-10`}
      >
        <Icon className="text-white" size={28} />
      </div>
      
      {/* Content */}
      <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-600 mb-2 sm:mb-3
                     relative z-10 transition-all duration-300">
        {section.title}
      </h3>

      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed relative z-10">
        {section.description}
      </p>
      
      {/* Arrow Indicator */}
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 opacity-0 group-hover:opacity-100 
                      transform translate-x-2 group-hover:translate-x-0 
                      transition-all duration-300 z-10">
        <ChevronRight className="text-gray-400" size={24} />
      </div>
    </motion.button>
  );
};

// ============================================================
// SETTINGS GRID COMPONENT
// ============================================================
const SettingsGrid = ({ sections }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {sections.map((section, index) => (
      <SettingsCard 
        key={section.id} 
        section={section} 
        index={index} 
      />
    ))}
  </div>
);

// ============================================================
// MAIN SETTINGS PANEL COMPONENT
// ============================================================
const SettingsPanel = () => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showColorTheme, setShowColorTheme] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const { isChristmasMode, toggleChristmasMode } = useChristmasTheme();
  const { showToast } = useToast();

  // Definir secciones de ajustes
  const settingsSections = [
    {
      id: 'backup',
      title: 'Backup de Datos',
      description: 'Exporta e importa tu biblioteca, progreso de lectura y configuraciones',
      icon: Database,
      color: 'from-green-400 to-emerald-500',
      action: () => setShowBackupModal(true)
    },
    {
      id: 'colors',
      title: 'Personalizar Colores del Tema',
      description: 'Cambia los colores principales del tema y personaliza tu experiencia visual',
      icon: Palette,
      color: 'from-purple-400 to-pink-500',
      action: () => setShowColorTheme(true)
    },
    {
      id: 'background',
      title: 'Color de Fondo',
      description: 'Personaliza el color de fondo de la aplicación o sube una imagen',
      icon: Paintbrush,
      color: 'from-blue-400 to-cyan-500',
      action: () => setShowBackgroundModal(true)
    },
    {
      id: 'christmas',
      title: 'Modo Navideño',
      description: 'Activa o desactiva el tema navideño con nieve y decoraciones',
      icon: Snowflake,
      color: 'from-red-400 to-green-500',
      action: () => {
        toggleChristmasMode();
        showToast(isChristmasMode 
          ? '❄️ Modo Navidad desactivado' 
          : '🎄 ¡Modo Navidad activado! ✨'
        );
      }
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <SettingsHeader />
      
      {/* Settings Grid */}
      <SettingsGrid sections={settingsSections} />
      
      {/* Modals */}
      <BackupModal 
        isOpen={showBackupModal} 
        onClose={() => setShowBackupModal(false)} 
      />
      <ColorThemeModal 
        isOpen={showColorTheme} 
        onClose={() => setShowColorTheme(false)} 
      />
      <BackgroundColorModal 
        isOpen={showBackgroundModal} 
        onClose={() => setShowBackgroundModal(false)} 
      />
      </div>
   );
  };

export default SettingsPanel;
