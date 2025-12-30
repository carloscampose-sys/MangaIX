import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { useChristmasTheme } from '../context/ChristmasThemeContext';
import { Moon, Sun, Eye, EyeOff, Book, Search, Palette, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { ColorThemeModal } from './ColorThemeModal';
import { BackupModal } from './BackupModal';

export const Navbar = ({ setPage }) => {
    const { theme, toggleTheme, incognito, toggleIncognito } = useTheme();
    const { level, devouredChapters } = useLibrary();
    const { isChristmasMode, toggleChristmasMode } = useChristmasTheme();
    const [showColorTheme, setShowColorTheme] = useState(false);
    const [showBackupModal, setShowBackupModal] = useState(false);

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 p-1.5 xs:p-2 sm:p-3 md:p-4 shadow-sm safe-area-top">
            <div className="container mx-auto flex flex-row justify-between items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">

                {/* Logo & Title */}
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 cursor-pointer flex-shrink-0 min-w-0" onClick={() => setPage('home')}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="text-lg sm:text-xl md:text-2xl lg:text-3xl flex-shrink-0"
                    >
                        🥑
                    </motion.div>
                    <div className="min-w-0">
                        <h1 className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-xl font-bold text-potaxie-green dark:text-potaxie-300 truncate">
                            El Santuario Potaxie
                        </h1>
                        <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 hidden xs:block">¡Devoraste! ✨</p>
                    </div>
                </div>

                {/* Level Indicator */}
                <div className="flex flex-col items-center flex-shrink min-w-0 max-w-[100px] xs:max-w-[120px] sm:max-w-none">
                    <span className="text-[8px] xs:text-[9px] sm:text-xs md:text-sm font-semibold text-potaxie-700 dark:text-potaxie-300 truncate w-full text-center">
                        <span className="hidden lg:inline">{level.title}</span>
                        <span className="lg:hidden">Nv. {level.title.split(' ').pop()}</span>
                    </span>
                    <div className="w-16 xs:w-20 sm:w-28 md:w-36 lg:w-48 h-1 xs:h-1.5 sm:h-2 bg-gray-200 rounded-full mt-0.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((devouredChapters / level.max) * 100, 100)}%` }}
                            className="h-full bg-potaxie-green"
                        />
                    </div>
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-400 truncate w-full text-center">
                        {devouredChapters} <span className="hidden xs:inline">caps</span>
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
                    <button
                        onClick={() => setPage('home')}
                        className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Buscar"
                    >
                        <Search size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                        onClick={() => setPage('library')}
                        className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Biblioteca"
                    >
                        <Book size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                        onClick={() => setPage('oracle')}
                        className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-purple-600 dark:text-purple-400"
                        title="El Oráculo Potaxio"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="xs:w-4 xs:h-4 sm:w-5 sm:h-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                    </button>

                    <button
                        onClick={() => setShowBackupModal(true)}
                        className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-potaxie-green"
                        title="Backup de Datos"
                    >
                        <Database size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Separador - solo visible en pantallas medianas+ */}
                    <div className="w-px h-3 xs:h-4 sm:h-5 md:h-6 bg-gray-300 dark:bg-gray-600 mx-0.5 sm:mx-1 hidden md:block"></div>

                    {/* Modo Incógnito - oculto en móvil */}
                    <button
                        onClick={toggleIncognito}
                        className={`p-1 xs:p-1.5 sm:p-2 rounded-full transition-colors hidden md:flex ${incognito ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title="Modo Incógnito"
                    >
                        {incognito ? <EyeOff size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> : <Eye size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />}
                    </button>

                    <button
                        onClick={() => setShowColorTheme(true)}
                        className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-potaxie-green"
                        title="Personalizar Colores"
                    >
                        <Palette size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-yellow-500 dark:text-purple-400"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? <Moon size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> : <Sun size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />}
                    </button>

                    <button
                        onClick={toggleChristmasMode}
                        className={`p-1 xs:p-1.5 sm:p-2 rounded-full transition-colors ${isChristmasMode ? 'bg-gradient-to-r from-red-600 to-green-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title={isChristmasMode ? 'Desactivar Modo Navidad' : 'Activar Modo Navidad'}
                    >
                        <span className="text-xs xs:text-sm sm:text-base">{isChristmasMode ? '🎄' : '❄️'}</span>
                    </button>
                </div>
            </div>

            {/* Color Theme Modal */}
            <ColorThemeModal 
                isOpen={showColorTheme} 
                onClose={() => setShowColorTheme(false)} 
            />

            {/* Backup Modal */}
            <BackupModal 
                isOpen={showBackupModal} 
                onClose={() => setShowBackupModal(false)} 
            />
        </nav>
    );
};
