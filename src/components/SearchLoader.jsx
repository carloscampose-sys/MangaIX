import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import anime from 'animejs';
import { ANIME_EASINGS, ANIME_DURATIONS } from '../utils/animeHelpers';

export const SearchLoader = ({ isLoading }) => {
    const [progress, setProgress] = useState(0);
    const [dots, setDots] = useState('');
    
    // Referencias para animaciones
    const imageRef = useRef(null);
    const progressBarRef = useRef(null);
    const glowRef = useRef(null);

    // Simular progreso de carga
    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    // Progreso más rápido al inicio, más lento al final
                    const increment = prev < 60 ? 15 : prev < 90 ? 5 : 2;
                    return Math.min(prev + increment, 100);
                });
            }, 150);

            return () => clearInterval(interval);
        }
    }, [isLoading]);

    // Animar puntos del texto
    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setDots(prev => {
                    if (prev === '...') return '';
                    return prev + '.';
                });
            }, 500);

            return () => clearInterval(interval);
        } else {
            setDots('');
        }
    }, [isLoading]);
    
    // Animación de la imagen con anime.js
    useEffect(() => {
        if (isLoading && imageRef.current) {
            anime({
                targets: imageRef.current,
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
                duration: 2000,
                easing: ANIME_EASINGS.easeInOutQuad,
                loop: true,
            });
        }
    }, [isLoading]);
    
    // Animación del glow
    useEffect(() => {
        if (isLoading && glowRef.current) {
            anime({
                targets: glowRef.current,
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
                duration: 2000,
                easing: ANIME_EASINGS.easeInOutQuad,
                loop: true,
            });
        }
    }, [isLoading]);
    
    // Animar la barra de progreso con anime.js
    useEffect(() => {
        if (progressBarRef.current) {
            anime({
                targets: progressBarRef.current,
                width: `${progress}%`,
                duration: 300,
                easing: ANIME_EASINGS.easeOutQuad,
            });
        }
    }, [progress]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-6 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 border-potaxie-green/20 dark:border-potaxie-green/30"
                    >
                        {/* Imagen de búsqueda animada */}
                        <div className="relative">
                            <img
                                ref={imageRef}
                                src="/search loading.png"
                                alt="Searching"
                                className="w-32 h-32 object-contain"
                                style={{
                                    filter: 'drop-shadow(0 0 20px rgba(167, 208, 140, 0.5))'
                                }}
                            />
                            {/* Glow effect */}
                            <div 
                                ref={glowRef}
                                className="absolute inset-0 bg-potaxie-green/20 rounded-full blur-2xl -z-10"
                            />
                        </div>

                        {/* Texto animado */}
                        <div className="text-center">
                            <h3 className="text-xl font-black text-potaxie-green dark:text-potaxie-400">
                                Searching{dots}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                Buscando tu próximo vicio
                            </p>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-80 max-w-full">
                            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                <div
                                    ref={progressBarRef}
                                    className="h-full bg-gradient-to-r from-potaxie-green via-teal-500 to-potaxie-green rounded-full relative"
                                    style={{ width: '0%' }}
                                >
                                    {/* Shine effect */}
                                    <motion.div
                                        animate={{
                                            x: [-100, 300]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    />
                                </div>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {progress < 100 ? 'Buscando...' : 'Completado!'}
                                </span>
                                <span className="text-sm font-black text-potaxie-green dark:text-potaxie-400">
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
