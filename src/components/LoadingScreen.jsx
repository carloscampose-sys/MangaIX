import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import anime from 'animejs';
import { ANIME_EASINGS, ANIME_DURATIONS } from '../utils/animeHelpers';

const ORBIT_EMOJIS = [
    { emoji: '👑', delay: 0 },
    { emoji: '🥑', delay: 1 },
    { emoji: '💅', delay: 2 },
    { emoji: '👻', delay: 3 },
    { emoji: '🔪', delay: 4 },
    { emoji: '📖', delay: 5 }
];

export const LoadingScreen = () => {
    const [progress, setProgress] = useState(0);
    
    // Referencias para animaciones
    const avocadoRef = useRef(null);
    const heartRef = useRef(null);
    const progressBarRef = useRef(null);
    const titleRef = useRef(null);

    useEffect(() => {
        // Ocultar scrollbar
        document.body.style.overflow = 'hidden';
        
        // Animación del aguacate (breathing effect)
        if (avocadoRef.current) {
            anime({
                targets: avocadoRef.current,
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
                duration: 3000,
                easing: ANIME_EASINGS.easeInOutQuad,
                loop: true,
            });
        }
        
        // Animación del corazón (pulse más dramático)
        if (heartRef.current) {
            anime({
                targets: heartRef.current,
                scale: [1, 1.3, 1],
                rotate: [0, 10, -10, 0],
                duration: 1500,
                easing: ANIME_EASINGS.easeInOutQuad,
                loop: true,
            });
        }
        
        // Animación del título (wave effect)
        if (titleRef.current) {
            const letters = titleRef.current.querySelectorAll('span');
            anime({
                targets: letters,
                translateY: [0, -10, 0],
                duration: 2000,
                delay: anime.stagger(100),
                easing: ANIME_EASINGS.easeInOutQuad,
                loop: true,
            });
        }
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 18);
        
        return () => {
            clearInterval(interval);
            document.body.style.overflow = '';
        };
    }, []);
    
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
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-[#BDD191] flex flex-col items-center justify-center p-4 overflow-hidden"
        >
            {/* Animated Stars Background */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                        className="absolute text-white/40 text-xl"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    >
                        ✦
                    </motion.div>
                ))}
            </div>

            {/* Central Ritual Area */}
            <div className="relative w-48 sm:w-56 md:w-64 h-48 sm:h-56 md:h-64 flex items-center justify-center mb-8 sm:mb-10 md:mb-12 z-10">
                {/* Orbiting Emojis */}
                {ORBIT_EMOJIS.map((item, idx) => (
                    <div
                        key={idx}
                        className="absolute text-lg sm:text-xl md:text-2xl animate-orbit"
                        style={{
                            '--duration': '8s',
                            animationDelay: `${-(idx * (8 / ORBIT_EMOJIS.length))}s`
                        }}
                    >
                        {item.emoji}
                    </div>
                ))}

                {/* Main Avocado */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative flex items-center justify-center"
                >
                    <span 
                        ref={avocadoRef}
                        className="text-[80px] sm:text-[100px] md:text-[120px] filter drop-shadow-xl select-none"
                    >
                        🥑
                    </span>
                    {/* Golden Heart */}
                    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span 
                            ref={heartRef}
                            className="text-2xl sm:text-3xl"
                        >
                            💛
                        </span>
                    </div>
                </motion.div>

                {/* Stars/Sparkles around */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: [0.5, 1, 0.5],
                            opacity: [0.3, 0.8, 0.3]
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                        className="absolute text-potaxie-cream"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    >
                        ✦
                    </motion.div>
                ))}
            </div>

            {/* Texts */}
            <div className="text-center space-y-1.5 sm:space-y-2 mb-8 sm:mb-10 relative z-10">
                <h1 
                    ref={titleRef}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md"
                >
                    {'Santuario Potaxie'.split('').map((char, i) => (
                        <span key={i} className="inline-block">
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </h1>
                <p className="text-white/80 font-bold text-sm sm:text-base md:text-lg animate-pulse">
                    Cargando Magia Potaxie...
                </p>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-[200px] sm:max-w-xs relative p-0.5 sm:p-1 bg-white/30 backdrop-blur-sm rounded-full border border-white/40 shadow-inner z-10">
                <div className="w-full h-3 sm:h-4 bg-transparent rounded-full overflow-hidden">
                    <div
                        ref={progressBarRef}
                        className="h-full bg-white/60 progress-striped rounded-full"
                        style={{ width: '0%' }}
                    />
                </div>

                {/* Accent Sparkle */}
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -right-1 sm:-right-2 -bottom-1 sm:-bottom-2 text-white text-lg sm:text-xl"
                >
                    ✦
                </motion.div>
            </div>

            <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 text-white/40 text-2xl sm:text-4xl z-10">
                ✦
            </div>
        </motion.div>
    );
};
