import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, BookOpen, MoreVertical } from 'lucide-react';
import confetti from 'canvas-confetti';

import { DetailModal } from './DetailModal';
import { TypewriterText } from './TypewriterText';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageProxy';
import { getSourceById } from '../services/sources';

const AVOCADO_RATING = [1, 2, 3, 4, 5];

const STATUS_OPTIONS = [
    { id: 'devorando', label: 'Devorando', emoji: '🥑', color: 'bg-potaxie-green', text: 'text-white' },
    { id: 'devoraste', label: 'Devoraste', emoji: '✨', color: 'bg-yellow-400', text: 'text-gray-900' },
    { id: 'tiesa', label: 'Tiesa', emoji: '☁️', color: 'bg-blue-100', text: 'text-blue-800' }
];

export const ManhwaCard = ({ manga, inLibrary = false }) => {
    const { incognito, theme } = useTheme();
    const { addToLibrary, removeFromLibrary, updateProgress, saveNote, getNote, setMangaStatus, setMangaRating, updateMangaData } = useLibrary();
    const { showToast } = useToast();
    const [chaptersInput, setChaptersInput] = useState(manga?.chaptersRead || 0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusChange = (statusId) => {
        setMangaStatus(manga.id, statusId);
        setIsMenuOpen(false);

        if (statusId === 'devoraste') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#A7D08C', '#FFD700', '#FFFFFF', '#FF69B4']
            });
        }
    };

    const handleAdd = (e) => {
        if (manga) {
            addToLibrary(manga);

            const copies = [
                "¡Obra añadida con éxito! A devorar se ha dicho 🥑✨",
                "Confirmado, diva. Ya está en tu biblioteca 💅📖"
            ];
            const randomCopy = copies[Math.floor(Math.random() * copies.length)];
            showToast(randomCopy);

            const rect = e.target.getBoundingClientRect();
            confetti({
                particleCount: 40,
                spread: 50,
                origin: {
                    x: rect.left / window.innerWidth,
                    y: rect.top / window.innerHeight
                },
                colors: ['#A7D08C', '#FFD700', '#FFFFFF'],
                zIndex: 3000
            });
        }
    };

    const handleProgressUpdate = (e) => {
        e.preventDefault();
        let val = parseInt(chaptersInput);
        if (isNaN(val) || val < 0) val = 0;

        if (manga) {
            const current = manga.chaptersRead || 0;
            const diff = val - current;
            if (diff !== 0) {
                updateProgress(manga.id, diff);
                setChaptersInput(val);
            }
        }
    };

    const note = getNote(manga?.id || "unknown");
    const currentStatus = STATUS_OPTIONS.find(s => s.id === (manga?.status || 'devorando')) || STATUS_OPTIONS[0];

    // Obtener información de la fuente
    const source = manga?.source ? getSourceById(manga.source) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group manhwa-card bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full relative transition-all hover:shadow-2xl ${manga?.status === 'tiesa' ? 'opacity-70 grayscale-[40%]' : ''}`}
        >
            {/* Badge de Fuente */}
            {source && (
                <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded-full text-[8px] sm:text-[9px] font-bold bg-black/70 dark:bg-white/80 text-white dark:text-gray-900 backdrop-blur-sm shadow-lg flex items-center gap-1">
                    <span>{source.icon}</span>
                    <span className="hidden sm:inline">{source.name}</span>
                </div>
            )}

            {/* Status Dropdown Menu (Only in Library) */}
            {inLibrary && (
                <div className="absolute top-2 left-2 z-20" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className="p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:scale-110 transition-all border border-white/20"
                    >
                        <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                                className="absolute top-full left-0 mt-2 w-36 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 py-1 overflow-hidden z-20"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(opt.id);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs font-bold transition-colors flex items-center gap-2
                                            ${manga.status === opt.id ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                        `}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                        <span className="dark:text-gray-200">{opt.emoji} {opt.label}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Cover */}
            <div
                className="relative h-40 sm:h-52 md:h-64 overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            >
                {incognito ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-1 sm:gap-2">
                        <span className="text-2xl sm:text-3xl md:text-4xl">👜</span>
                        <span className="text-[10px] sm:text-xs md:text-sm">Cartera de Jiafei</span>
                    </div>
                ) : (
                    <img
                        src={getImageUrl(manga?.cover) || PLACEHOLDER_IMAGE}
                        alt={manga?.title || 'Unknown'}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 text-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Ver Detalles ✨
                    </span>
                </div>

                {inLibrary ? (
                    <div className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black shadow-lg border border-white/20 backdrop-blur-md uppercase flex items-center gap-0.5 sm:gap-1 ${currentStatus.color} ${currentStatus.text}`}>
                        {currentStatus.emoji} <span className="hidden sm:inline">{currentStatus.label}</span>
                    </div>
                ) : (
                    <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black shadow-lg border border-white/20 backdrop-blur-md uppercase flex items-center gap-0.5 sm:gap-1 bg-white/20 text-white">
                        {manga?.lastChapter || "?"} <span className="hidden sm:inline">Caps</span> ✨
                    </div>
                )}
            </div>

            <div className="p-2.5 sm:p-3 md:p-4 flex flex-col flex-grow gap-1 sm:gap-2">
                <h3
                    className="font-bold text-xs sm:text-sm md:text-base line-clamp-1 leading-tight text-gray-900 dark:text-gray-100 cursor-pointer hover:text-potaxie-600 transition-colors"
                    onClick={() => setIsModalOpen(true)}
                    title={manga?.title}
                >
                    {manga?.title || 'Título Desconocido'}
                </h3>

                <p className="text-[10px] sm:text-[11px] md:text-[12px] text-gray-400 dark:text-gray-500 mb-0.5 sm:mb-1">
                    {manga?.author || "Desconocido"}
                </p>

                {!inLibrary && (
                    <div className="flex-grow flex flex-col mb-2 sm:mb-3">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                            {manga?.description || "Sin sinopsis disponible."}
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-potaxie-600 dark:text-potaxie-400 hover:underline text-left self-start"
                        >
                            Leer sinopsis completa... ✨
                        </button>
                    </div>
                )}

                {inLibrary ? (
                    <div className="flex flex-col gap-2 sm:gap-3 mt-auto">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <form onSubmit={handleProgressUpdate} className="flex items-center gap-1 sm:gap-1.5 w-full flex-wrap">
                                <input
                                    type="number"
                                    min="0"
                                    value={chaptersInput}
                                    onChange={(e) => setChaptersInput(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-10 sm:w-12 p-0.5 sm:p-1 text-[10px] sm:text-xs border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-center"
                                />
                                <span className="text-[8px] sm:text-[10px] text-gray-500">/{manga?.lastChapter || "?"}</span>
                                <button type="submit" className="text-[8px] sm:text-[10px] bg-potaxie-green text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold">Ok</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newVal = (parseInt(chaptersInput) || 0) + 1;
                                        setChaptersInput(newVal);
                                        updateProgress(manga.id, 1);
                                    }}
                                    className="text-[8px] sm:text-[10px] bg-cyan-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-cyan-600 font-bold"
                                >
                                    +1
                                </button>
                            </form>
                        </div>

                        <div className="flex gap-0.5 sm:gap-1 justify-center border-t dark:border-gray-700 pt-1.5 sm:pt-2">
                            {AVOCADO_RATING.map(r => (
                                <button
                                    key={r}
                                    onClick={() => setMangaRating(manga.id, r)}
                                    className={`text-sm sm:text-base transition-transform hover:scale-125 ${(manga?.rating || 0) >= r ? 'opacity-100' : 'opacity-20 grayscale'}`}
                                >
                                    🥑
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-[8px] sm:text-[10px] font-bold text-potaxie-600 flex items-center gap-0.5 sm:gap-1 hover:underline"
                            >
                                <BookOpen size={10} /> <span className="hidden sm:inline">Notas & Extra</span><span className="sm:hidden">Más</span>
                            </button>
                            <button
                                onClick={() => {
                                    removeFromLibrary(manga.id);
                                    const copies = [
                                        "Obra eliminada. ¡Haciendo espacio para más chisme! 🐍✨",
                                        "Eliminado correctamente. ¡Quedó tiesa! ☁️"
                                    ];
                                    const randomCopy = copies[Math.floor(Math.random() * copies.length)];
                                    showToast(randomCopy);
                                }}
                                className="text-[8px] sm:text-[10px] text-red-500 hover:text-red-600 flex items-center gap-0.5 sm:gap-1 font-bold group"
                            >
                                <Trash2 size={10} className="group-hover:animate-bounce" /> <span className="hidden sm:inline">Quitar</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleAdd}
                        className="mt-auto w-full py-2 sm:py-2.5 bg-potaxie-green hover:bg-green-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                        <Plus size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Añadir a Biblioteca</span><span className="sm:hidden">Añadir</span>
                    </button>
                )}
            </div>

            {/* Detailed Modal Integration */}
            <DetailModal
                manga={manga}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                theme={theme}
                TypewriterText={TypewriterText}
                note={note}
                saveNote={saveNote}
                inLibrary={inLibrary}
                onStatusChange={handleStatusChange}
                STATUS_OPTIONS={STATUS_OPTIONS}
                updateMangaData={updateMangaData}
            />
        </motion.div>
    );
};
