import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Dice5, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DetailModal } from './DetailModal';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { TypewriterText } from './TypewriterText';

export const PotaxioLuckModal = ({ isOpen, onClose, library }) => {
    const { theme } = useTheme();
    const { updateProgress, saveNote, getNote, setMangaStatus, setMangaRating, saveTranslation, getTranslation, updateMangaData } = useLibrary();
    const [step, setStep] = useState('loading'); // loading, result
    const [winner, setWinner] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const HEADERS = [
        "¡El destino ha hablado, devoradora! 🥑✨",
        "Tu próxima obsesión ha sido revelada... 💅",
        "Las deidades potaxies bendicen tu lectura hoy: 👑"
    ];

    const [header, setHeader] = useState("");

    const getMotivation = (manga) => {
        const desc = (manga?.description || "").toLowerCase();
        const title = (manga?.title || "").toLowerCase();

        if (desc.includes('romance') || desc.includes('amor') || desc.includes('love'))
            return "Prepárate para el chisme del siglo 🐍💞";
        if (desc.includes('tragedia') || desc.includes('muerte') || desc.includes('tragedy') || desc.includes('llorar'))
            return "Prepara los pañuelos, reina 🥀😭";
        if (desc.includes('acción') || desc.includes('pelea') || desc.includes('action') || desc.includes('devorar'))
            return "¡Vas a devorar cada página! 💅💥";
        if (desc.includes('comedia') || desc.includes('risa') || desc.includes('comedy'))
            return "Risas aseguradas, divina 🤣✨";

        return "Una joya digna de una potaxie suprema 🥑👑";
    };

    const rollLuck = () => {
        if (attempts >= 3) return;

        setStep('loading');
        setWinner(null);

        setTimeout(() => {
            const randomManga = library[Math.floor(Math.random() * library.length)];
            const randomHeader = HEADERS[Math.floor(Math.random() * HEADERS.length)];

            setWinner(randomManga);
            setHeader(randomHeader);
            setStep('result');
            setAttempts(prev => prev + 1);

            // Confetti burst
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#A7D08C', '#FFD700', '#FFFFFF', '#FF69B4'],
                shapes: ['circle', 'square'],
                scalar: 1.2
            });
        }, 1500);
    };

    useEffect(() => {
        if (isOpen) {
            setAttempts(0);
            rollLuck();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <AnimatePresence mode="wait">
                {step === 'loading' ? (
                    <motion.div
                        key="loading"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        className="relative z-10 flex flex-col items-center gap-6"
                    >
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                                scale: { duration: 1, repeat: Infinity }
                            }}
                            className="text-8xl filter drop-shadow-[0_0_20px_rgba(167,208,140,0.8)]"
                        >
                            🥑
                        </motion.div>
                        <div className="flex flex-col items-center gap-2">
                            <h3 className="text-white font-black text-2xl tracking-widest flex items-center gap-2">
                                <Sparkles className="text-yellow-400 animate-pulse" />
                                CONSULTANDO A LAS DEIDADES_
                                <Sparkles className="text-yellow-400 animate-pulse" />
                            </h3>
                            <p className="text-potaxie-green font-bold animate-pulse uppercase tracking-[0.3em]">
                                El destino se está cocinando... ✨
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="relative z-10 w-full max-w-md"
                    >
                        <div className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-md rounded-[2.5rem] p-1 border-2 border-yellow-400/50 shadow-[0_0_40px_rgba(250,204,21,0.3)] overflow-hidden">
                            <div className="bg-white dark:bg-gray-900 rounded-[2.3rem] overflow-hidden p-6 flex flex-col items-center gap-6">
                                <div className="text-center space-y-2">
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                        {header}
                                    </h2>
                                </div>

                                {/* Winner Card */}
                                <div className="relative w-full aspect-[2/3] max-w-[240px] rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-400 shadow-yellow-400/20 group">
                                    <img
                                        src={winner?.cover}
                                        alt={winner?.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                                        <h4 className="text-white font-black text-lg line-clamp-2 leading-tight">
                                            {winner?.title}
                                        </h4>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-potaxie-600 dark:text-potaxie-400 font-black italic text-lg">
                                        "{getMotivation(winner)}"
                                    </p>
                                </div>

                                <div className="flex flex-col w-full gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsDetailOpen(true)}
                                        className="w-full py-4 bg-potaxie-green hover:bg-green-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 transition-all"
                                    >
                                        ¡LO DEVORO AHORA! 🥑✨
                                    </motion.button>

                                    {attempts < 3 ? (
                                        <button
                                            onClick={rollLuck}
                                            className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                                        >
                                            <Dice5 size={16} /> OTRA OPORTUNIDAD ({3 - attempts} restantes) 🎲
                                        </button>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-2">
                                            El destino ha dictado su sentencia, reina 💅
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DetailModal
                manga={winner}
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    onClose();
                }}
                theme={theme}
                inLibrary={true}
                updateProgress={updateProgress}
                saveNote={saveNote}
                getNote={getNote}
                setMangaStatus={setMangaStatus}
                setMangaRating={setMangaRating}
                saveTranslation={saveTranslation}
                getTranslation={getTranslation}
                updateMangaData={updateMangaData}
                // DetailModal expects these even if null for external library items
                translation={getTranslation(winner?.id)}
                isTranslating={false}
                translationProgress={0}
                handleTranslate={() => { }}
                TypewriterText={TypewriterText}
                STATUS_OPTIONS={[
                    { id: 'devorando', label: 'Devorando', emoji: '🥑', color: 'bg-potaxie-green', text: 'text-white' },
                    { id: 'devoraste', label: 'Devoraste', emoji: '✨', color: 'bg-yellow-400', text: 'text-gray-900' },
                    { id: 'tiesa', label: 'Tiesa', emoji: '☁️', color: 'bg-blue-100', text: 'text-blue-800' }
                ]}
            />
        </div>
    );
};
