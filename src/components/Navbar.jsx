import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { Moon, Sun, Eye, EyeOff, Book, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar = ({ setPage }) => {
    const { theme, toggleTheme, incognito, toggleIncognito } = useTheme();
    const { level, devouredChapters } = useLibrary();

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">

                {/* Logo & Title */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="text-3xl"
                    >
                        🥑
                    </motion.div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-potaxie-green to-green-600 bg-clip-text text-transparent">
                            El Santuario Potaxie
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">¡Devoraste! ✨</p>
                    </div>
                </div>

                {/* Level Indicator */}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-semibold text-potaxie-700 dark:text-potaxie-300">
                        {level.title}
                    </span>
                    <div className="w-48 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((devouredChapters / level.max) * 100, 100)}%` }}
                            className="h-full bg-potaxie-green"
                        />
                    </div>
                    <span className="text-xs text-gray-400">{devouredChapters} Caps. Devorados</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPage('home')}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Buscar"
                    >
                        <Search size={20} />
                    </button>

                    <button
                        onClick={() => setPage('library')}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Biblioteca"
                    >
                        <Book size={20} />
                    </button>

                    <button
                        onClick={() => setPage('oracle')}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-purple-600 dark:text-purple-400"
                        title="El Oráculo Potaxio"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                    </button>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    <button
                        onClick={toggleIncognito}
                        className={`p-2 rounded-full transition-colors ${incognito ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title="Modo Incógnito (Cartera de Jiafei)"
                    >
                        {incognito ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-yellow-500 dark:text-purple-400"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </div>
        </nav>
    );
};
