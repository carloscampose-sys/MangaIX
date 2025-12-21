import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 18);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-[#BDD191] flex flex-col items-center justify-center p-4 overflow-hidden"
        >
            {/* Central Ritual Area */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                {/* Orbiting Emojis */}
                {ORBIT_EMOJIS.map((item, idx) => (
                    <div
                        key={idx}
                        className="absolute text-2xl animate-orbit"
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
                    <span className="text-[120px] filter drop-shadow-xl select-none">🥑</span>
                    {/* Golden Heart */}
                    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-3xl animate-pulse-heart">💛</span>
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
            <div className="text-center space-y-2 mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                    Santuario Potaxie
                </h1>
                <p className="text-white/80 font-bold text-lg animate-pulse">
                    Cargando Magia Potaxie...
                </p>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-xs relative p-1 bg-white/30 backdrop-blur-sm rounded-full border border-white/40 shadow-inner">
                <div className="w-full h-4 bg-transparent rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-white/60 progress-striped rounded-full"
                    />
                </div>

                {/* Accent Sparkle */}
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -right-2 -bottom-2 text-white text-xl"
                >
                    ✦
                </motion.div>
            </div>

            <div className="absolute bottom-10 right-10 text-white/40 text-4xl">
                ✦
            </div>
        </motion.div>
    );
};
