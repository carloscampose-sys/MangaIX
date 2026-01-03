import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChapterLoader = ({ progress, isVisible }) => {
    const [dots, setDots] = useState('');
    
    // Animación de puntos suspensivos
    useEffect(() => {
        if (!isVisible) return;
        
        const dotStates = ['', '.', '..', '...'];
        let currentIndex = 0;
        
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % dotStates.length;
            setDots(dotStates[currentIndex]);
        }, 500);
        
        return () => clearInterval(interval);
    }, [isVisible]);
    
    // Cálculo del círculo de progreso
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    role="status"
                    aria-live="polite"
                    aria-label={`Cargando capítulo: ${Math.round(progress)}%`}
                >
                    <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 px-4">
                        {/* Imagen del personaje con animación bounce */}
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                y: [0, -10, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56"
                        >
                            <img
                                src="/Carga cap.png"
                                alt="Personaje leyendo"
                                className="w-full h-full object-contain drop-shadow-2xl"
                            />
                        </motion.div>
                        
                        {/* Texto "Cargando capítulo..." */}
                        <div className="text-center">
                            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight">
                                Cargando capítulo
                                <span className="inline-block w-8 text-left text-potaxie-green">
                                    {dots}
                                </span>
                            </h2>
                        </div>
                        
                        {/* Círculo de progreso con porcentaje */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40">
                            {/* SVG del círculo */}
                            <svg
                                className="w-full h-full transform -rotate-90"
                                viewBox="0 0 120 120"
                            >
                                {/* Círculo de fondo */}
                                <circle
                                    cx="60"
                                    cy="60"
                                    r={radius}
                                    stroke="#374151"
                                    strokeWidth="8"
                                    fill="none"
                                    className="opacity-30"
                                />
                                
                                {/* Círculo de progreso */}
                                <motion.circle
                                    cx="60"
                                    cy="60"
                                    r={radius}
                                    stroke="#A7D08C"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: offset }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut"
                                    }}
                                    style={{
                                        filter: 'drop-shadow(0 0 8px rgba(167, 208, 140, 0.5))'
                                    }}
                                />
                            </svg>
                            
                            {/* Porcentaje en el centro */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span
                                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white transition-all duration-100"
                                    style={{
                                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                                    }}
                                >
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                        
                        {/* Texto adicional opcional */}
                        <p className="text-xs sm:text-sm text-gray-400 font-medium">
                            Preparando tu lectura potaxie ✨
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
