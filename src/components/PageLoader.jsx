import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Componente SVG del hurón animado
const AnimatedFerret = () => {
    return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cuerpo del hurón */}
            <motion.ellipse
                cx="60"
                cy="70"
                rx="35"
                ry="25"
                fill="#A7D08C"
                animate={{
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Cabeza */}
            <motion.ellipse
                cx="60"
                cy="40"
                rx="25"
                ry="20"
                fill="#A7D08C"
                animate={{
                    y: [0, -3, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Oreja izquierda */}
            <motion.path
                d="M 45 25 Q 40 15 45 10 Q 50 15 45 25 Z"
                fill="#8BB874"
                animate={{
                    rotate: [-5, 5, -5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ originX: '45px', originY: '25px' }}
            />

            {/* Oreja derecha */}
            <motion.path
                d="M 75 25 Q 80 15 75 10 Q 70 15 75 25 Z"
                fill="#8BB874"
                animate={{
                    rotate: [5, -5, 5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ originX: '75px', originY: '25px' }}
            />

            {/* Ojo izquierdo */}
            <motion.circle
                cx="50"
                cy="38"
                r="3"
                fill="#2C3E50"
                animate={{
                    scale: [1, 0.1, 1],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Ojo derecho */}
            <motion.circle
                cx="70"
                cy="38"
                r="3"
                fill="#2C3E50"
                animate={{
                    scale: [1, 0.1, 1],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Nariz */}
            <ellipse
                cx="60"
                cy="48"
                rx="4"
                ry="3"
                fill="#6B8E5E"
            />

            {/* Cola */}
            <motion.path
                d="M 90 75 Q 105 70 110 80 Q 105 90 95 85 Q 92 82 90 75 Z"
                fill="#8BB874"
                animate={{
                    rotate: [0, 10, 0, -10, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ originX: '90px', originY: '75px' }}
            />

            {/* Patas delanteras */}
            <ellipse cx="45" cy="90" rx="6" ry="10" fill="#8BB874" />
            <ellipse cx="60" cy="90" rx="6" ry="10" fill="#8BB874" />

            {/* Patas traseras */}
            <ellipse cx="75" cy="90" rx="6" ry="10" fill="#8BB874" />
        </svg>
    );
};

export const PageLoader = ({ isLoading }) => {
    const [progress, setProgress] = useState(0);
    const [dots, setDots] = useState('');

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
                        {/* Hurón animado */}
                        <motion.div
                            animate={{
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="relative"
                        >
                            <AnimatedFerret />
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-potaxie-green/20 rounded-full blur-2xl -z-10"></div>
                        </motion.div>

                        {/* Texto animado */}
                        <div className="text-center">
                            <h3 className="text-xl font-black text-potaxie-green dark:text-potaxie-400">
                                Loading Page{dots}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                Obteniendo nuevos resultados
                            </p>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-80 max-w-full">
                            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-potaxie-green via-teal-500 to-potaxie-green rounded-full relative"
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
                                </motion.div>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {progress < 100 ? 'Cargando...' : 'Completado!'}
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
