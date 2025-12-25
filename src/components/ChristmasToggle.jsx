import React from 'react';
import { motion } from 'framer-motion';
import { useChristmasTheme } from '../context/ChristmasThemeContext';

export const ChristmasToggle = () => {
  const { isChristmasMode, toggleChristmasMode } = useChristmasTheme();

  return (
    <motion.button
      onClick={toggleChristmasMode}
      className={`
        fixed top-20 right-4 z-[1001] px-4 py-2 rounded-full font-bold text-sm
        shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95
        flex items-center gap-2
        ${isChristmasMode 
          ? 'bg-gradient-to-r from-red-600 to-green-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600'
        }
      `}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-lg">{isChristmasMode ? '🎄' : '❄️'}</span>
      <span className="hidden sm:inline">
        {isChristmasMode ? 'Modo Normal' : 'Modo Navidad'}
      </span>
    </motion.button>
  );
};
