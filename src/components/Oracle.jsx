import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomManga, TUMANGA_GENRES, TUMANGA_MOODS } from '../services/tumanga';
import { useLibrary } from '../context/LibraryContext';
import { Sparkles, Plus, Loader2, Coffee } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import { DetailModal } from './DetailModal';
import { TypewriterText } from './TypewriterText';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageProxy';

const OracleResultCard = ({ recommendation, theme, addToLibrary, isAlreadyInLibrary }) => {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAdd = (e) => {
        e.stopPropagation();
        addToLibrary(recommendation);

        const copies = [
            "¡Obra añadida con éxito! A devorar se ha dicho 🥑✨",
            "Confirmado, diva. Ya está en tu biblioteca 💅📖"
        ];
        const randomCopy = copies[Math.floor(Math.random() * copies.length)];
        showToast(randomCopy);

        const rect = e.target.getBoundingClientRect();
        confetti({
            particleCount: 50,
            spread: 60,
            origin: {
                x: rect.left / window.innerWidth,
                y: rect.top / window.innerHeight
            },
            colors: ['#A7D08C', '#FFD700', '#FFFFFF'],
            zIndex: 3000
        });
    };

    return (
        <div className="w-full">
            <motion.div
                key={recommendation?.id || "result"}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`group relative max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border-4 cursor-pointer transition-all hover:scale-[1.01]
                    ${theme === 'light' ? 'border-potaxie-green hover:shadow-potaxie-green/20' : 'border-purple-500 hover:shadow-purple-500/20'}
                `}
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex flex-col md:flex-row h-full relative z-10">
                    <div className="md:w-2/5 h-64 md:h-80 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                            src={getImageUrl(recommendation?.cover) || PLACEHOLDER_IMAGE}
                            alt={recommendation?.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                        />
                    </div>
                    <div className="p-6 md:w-3/5 text-left flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className={theme === 'light' ? 'text-yellow-500' : 'text-purple-400'} size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Favorito del Cosmos</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-potaxie-600 transition-colors">
                            {recommendation?.title}
                        </h3>

                        <div className="flex-grow">
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mb-1">
                                {recommendation?.description || "Sin descripción disponible."}
                            </p>
                            <button className="text-[10px] font-bold text-potaxie-600 hover:underline">
                                Leer sinopsis completa... ✨
                            </button>
                        </div>

                        <button
                            onClick={handleAdd}
                            disabled={isAlreadyInLibrary}
                            className={`mt-4 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                ${isAlreadyInLibrary
                                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                    : 'bg-potaxie-green hover:bg-green-600 text-white shadow-md active:scale-95'
                                }
                            `}
                        >
                            {isAlreadyInLibrary ? "Ya en tu Santuario" : <><Plus size={18} /> Añadir a Biblioteca</>}
                        </button>
                    </div>
                </div>
            </motion.div>

            <DetailModal
                manga={recommendation}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                theme={theme}
                TypewriterText={TypewriterText}
                inLibrary={false}
                updateMangaData={null}
            />
        </div>
    );
};

export const Oracle = () => {
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [selectedMood, setSelectedMood] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState(null);
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { library, addToLibrary } = useLibrary();

    const handleSummon = async () => {
        if (!selectedGenre && !selectedMood) return;
        setLoading(true);
        setError(null);
        setRecommendation(null);

        // Obtener géneros para la búsqueda
        const genreIds = selectedMood ? selectedMood.genres : [selectedGenre];

        try {
            const result = await getRandomManga(genreIds);

            if (result) {
                setRecommendation(result);
                // Confetti de celebración
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: theme === 'dark' ? ['#FFD700', '#00BFFF', '#7B68EE'] : ['#A7D08C', '#FFFFFF', '#4FD1C5']
                });
            } else {
                setError(selectedMood
                    ? "¡El Oráculo dice que esta combinación es muy exclusiva! Prueba con menos filtros 🥑"
                    : "¡Tiesa! El oráculo no encontró nada por ahora, intenta otro género, potaxina.");
            }
        } catch (e) {
            console.error('Oracle error:', e);
            setError("Error de conexión con el cosmos.");
        } finally {
            setLoading(false);
        }
    };

    const isAlreadyInLibrary = recommendation && library.some(m => m.id === recommendation.id);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 text-center min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <h2 className="text-4xl md:text-6xl font-black mb-4 inline-flex items-center gap-3">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500">El Oráculo Potaxio</span>
                    <span>🔮✨</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium">
                    "Donde el cosmos decide qué manhwa devorarás hoy"
                </p>
            </motion.div>

            {/* Mood Section */}
            <div className="mb-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6 px-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <Coffee size={14} className="text-purple-500" /> Invocación por Mood ✨
                    </h4>
                    {selectedMood && (
                        <button
                            onClick={() => setSelectedMood(null)}
                            className="text-[10px] bg-purple-100 dark:bg-gray-700 px-3 py-1 rounded-full text-purple-700 dark:text-purple-300 font-bold hover:scale-105 transition-all"
                        >
                            🥑 Resetear Mood
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    {TUMANGA_MOODS.map(mood => (
                        <motion.button
                            key={mood.id}
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setSelectedMood(mood);
                                setSelectedGenre(null);
                                showToast(mood.toast);
                            }}
                            className={`
                                flex flex-col items-center gap-2 p-4 rounded-3xl transition-all border-2
                                ${selectedMood?.id === mood.id
                                    ? `bg-gradient-to-br ${mood.color} text-white border-transparent shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-110`
                                    : 'bg-white dark:bg-gray-900/40 text-gray-400 border-transparent hover:border-purple-200/50'}
                            `}
                        >
                            <span className="text-3xl">{mood.name.split(' ').pop()}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter w-20 leading-tight">
                                {mood.name.split(' ').slice(0, -1).join(' ')}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">O elige un género tradicional</span>
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {TUMANGA_GENRES.slice(0, 16).map((genre) => {
                    const isSelected = selectedGenre === genre.id;
                    const isSpecial = genre.id === 'boys-love' || genre.id === 'girls-love';
                    return (
                        <button
                            key={genre.id}
                            onClick={() => {
                                setSelectedGenre(genre.id);
                                setSelectedMood(null);
                            }}
                            className={`p-4 rounded-2xl border-2 chip-transition font-bold text-sm flex items-center justify-center gap-2 box-border
                                ${isSelected
                                    ? isSpecial
                                        ? 'bg-gradient-to-r from-pink-400 via-purple-500 to-purple-600 border-pink-300 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] transform scale-105'
                                        : 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/40 dark:border-purple-400 dark:text-purple-200 transform scale-105 shadow-xl'
                                    : 'bg-white border-transparent text-gray-600 hover:border-purple-300 dark:bg-gray-800 dark:text-gray-300 hover:shadow-lg'
                                }
                            `}
                        >
                            <div className={`w-4 h-4 flex items-center justify-center transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                <Sparkles size={14} className="animate-pulse" />
                            </div>
                            {genre.name}
                        </button>
                    );
                })}
            </div>

            <div className="mb-20">
                <button
                    onClick={handleSummon}
                    disabled={(!selectedGenre && !selectedMood) || loading}
                    className={`
                        px-10 py-5 rounded-full text-2xl font-black text-white shadow-2xl transition-all transform active:scale-95
                        ${(!selectedGenre && !selectedMood)
                            ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-700'
                            : 'bg-gradient-to-r from-potaxie-green to-teal-500 hover:scale-110 hover:shadow-[0_20px_50px_rgba(167,208,140,0.4)]'
                        }
                    `}
                >
                    {loading ? (
                        <span className="flex items-center gap-3">
                            <Loader2 className="animate-spin" size={28} /> CANALIZANDO...
                        </span>
                    ) : (
                        "¡INVOCAR DESTINO! 🧙‍♂️"
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-8 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl border-2 border-red-100 dark:border-red-900/40"
                    >
                        <p className="font-black text-xl">{error}</p>
                    </motion.div>
                )}

                {recommendation && (
                    <OracleResultCard
                        recommendation={recommendation}
                        theme={theme}
                        addToLibrary={addToLibrary}
                        isAlreadyInLibrary={isAlreadyInLibrary}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
