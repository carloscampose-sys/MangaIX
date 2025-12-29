import { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { useChristmasTheme } from '../context/ChristmasThemeContext';
import { Moon, Sun, Eye, EyeOff, Book, Search } from 'lucide-react';
import anime from 'animejs/lib/anime.es.js';
import { ANIME_EASINGS, ANIME_DURATIONS } from '../utils/animeHelpers';

export const Navbar = ({ setPage }) => {
    const { theme, toggleTheme, incognito, toggleIncognito } = useTheme();
    const { level, devouredChapters } = useLibrary();
    const { isChristmasMode, toggleChristmasMode } = useChristmasTheme();
    
    // Referencias para animaciones
    const logoRef = useRef(null);
    const progressBarRef = useRef(null);
    const buttonsRef = useRef([]);
    
    // Animación del logo al montar
    useEffect(() => {
        if (logoRef.current) {
            anime({
                targets: logoRef.current,
                scale: [0.8, 1],
                rotate: [0, 360],
                duration: ANIME_DURATIONS.medium,
                easing: ANIME_EASINGS.easeOutElastic,
            });
        }
    }, []);
    
    // Animación de la barra de progreso
    useEffect(() => {
        if (progressBarRef.current) {
            anime({
                targets: progressBarRef.current,
                width: `${Math.min((devouredChapters / level.max) * 100, 100)}%`,
                duration: ANIME_DURATIONS.medium,
                easing: ANIME_EASINGS.easeInOutQuad,
            });
        }
    }, [devouredChapters, level.max]);
    
    // Animación de hover en botones
    const handleButtonHover = (index) => {
        if (buttonsRef.current[index]) {
            anime({
                targets: buttonsRef.current[index],
                scale: 1.1,
                rotate: 5,
                duration: ANIME_DURATIONS.fast,
                easing: ANIME_EASINGS.easeInOutQuad,
            });
        }
    };
    
    const handleButtonLeave = (index) => {
        if (buttonsRef.current[index]) {
            anime({
                targets: buttonsRef.current[index],
                scale: 1,
                rotate: 0,
                duration: ANIME_DURATIONS.fast,
                easing: ANIME_EASINGS.easeInOutQuad,
            });
        }
    };

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 p-2 sm:p-3 md:p-4 shadow-sm safe-area-top">
            <div className="container mx-auto flex flex-row justify-between items-center gap-2 sm:gap-4">

                {/* Logo & Title */}
                <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-shrink-0" onClick={() => setPage('home')}>
                    <div
                        ref={logoRef}
                        className="text-xl sm:text-2xl md:text-3xl"
                    >
                        🥑
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-sm sm:text-base md:text-xl font-bold bg-gradient-to-r from-potaxie-green to-green-600 bg-clip-text text-transparent">
                            El Santuario Potaxie
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">¡Devoraste! ✨</p>
                    </div>
                </div>

                {/* Level Indicator */}
                <div className="flex flex-col items-center flex-shrink min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-potaxie-700 dark:text-potaxie-300 truncate max-w-full">
                        <span className="hidden sm:inline">{level.title}</span>
                        <span className="sm:hidden">Nv. {level.title?.split(' ')?.pop()}</span>
                    </span>
                    <div className="w-24 sm:w-32 md:w-40 lg:w-48 h-1.5 sm:h-2 bg-gray-200 rounded-full mt-0.5 sm:mt-1 overflow-hidden">
                        <div
                            ref={progressBarRef}
                            className="h-full bg-potaxie-green"
                            style={{ width: '0%' }}
                        />
                    </div>
                    <span className="text-[8px] sm:text-[10px] md:text-xs text-gray-400">{devouredChapters} <span className="hidden sm:inline">Caps. Devorados</span><span className="sm:hidden">caps</span></span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                    <button
                        ref={(el) => (buttonsRef.current[0] = el)}
                        onMouseEnter={() => handleButtonHover(0)}
                        onMouseLeave={() => handleButtonLeave(0)}
                        onClick={() => setPage('home')}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Buscar"
                    >
                        <Search size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    <button
                        ref={(el) => (buttonsRef.current[1] = el)}
                        onMouseEnter={() => handleButtonHover(1)}
                        onMouseLeave={() => handleButtonLeave(1)}
                        onClick={() => setPage('library')}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Biblioteca"
                    >
                        <Book size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    <button
                        ref={(el) => (buttonsRef.current[2] = el)}
                        onMouseEnter={() => handleButtonHover(2)}
                        onMouseLeave={() => handleButtonLeave(2)}
                        onClick={() => setPage('oracle')}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-purple-600 dark:text-purple-400"
                        title="El Oráculo Potaxio"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles sm:w-5 sm:h-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                    </button>

                    <div className="w-px h-4 sm:h-6 bg-gray-300 dark:bg-gray-600 mx-0.5 sm:mx-1 hidden sm:block"></div>

                    <button
                        ref={(el) => (buttonsRef.current[3] = el)}
                        onMouseEnter={() => handleButtonHover(3)}
                        onMouseLeave={() => handleButtonLeave(3)}
                        onClick={toggleIncognito}
                        className={`p-1.5 sm:p-2 rounded-full transition-colors ${incognito ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title="Modo Incógnito (Cartera de Jiafei)"
                    >
                        {incognito ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                    </button>

                    <button
                        ref={(el) => (buttonsRef.current[4] = el)}
                        onMouseEnter={() => handleButtonHover(4)}
                        onMouseLeave={() => handleButtonLeave(4)}
                        onClick={toggleTheme}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-yellow-500 dark:text-purple-400"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? <Moon size={18} className="sm:w-5 sm:h-5" /> : <Sun size={18} className="sm:w-5 sm:h-5" />}
                    </button>

                    <button
                        ref={(el) => (buttonsRef.current[5] = el)}
                        onMouseEnter={() => handleButtonHover(5)}
                        onMouseLeave={() => handleButtonLeave(5)}
                        onClick={toggleChristmasMode}
                        className={`p-1.5 sm:p-2 rounded-full transition-colors ${isChristmasMode ? 'bg-gradient-to-r from-red-600 to-green-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title={isChristmasMode ? 'Desactivar Modo Navidad' : 'Activar Modo Navidad'}
                    >
                        <span className="text-base sm:text-lg">{isChristmasMode ? '🎄' : '❄️'}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
