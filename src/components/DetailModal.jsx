import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Sparkles, BookOpen } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getTuMangaChapters, getTuMangaPages, getTuMangaDetails } from '../services/tumanga';
import { Reader } from './Reader';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageProxy';

export const DetailModal = ({
    manga,
    isOpen,
    onClose,
    theme,
    TypewriterText,
    note,
    saveNote,
    inLibrary,
    onStatusChange,
    STATUS_OPTIONS,
    updateMangaData
}) => {
    const { showToast } = useToast();
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [mangaDetails, setMangaDetails] = useState(null);

    // TuManga chapters
    const [tumangaChapters, setTumangaChapters] = useState([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [readerPages, setReaderPages] = useState(null);
    const [isOpeningReader, setIsOpeningReader] = useState(false);

    useEffect(() => {
        if (isOpen && manga) {
            document.body.style.overflow = 'hidden';

            // Si el manga tiene slug (viene de TuManga), cargar detalles y capítulos
            if (manga.slug) {
                loadMangaData(manga.slug);
            }
        } else {
            document.body.style.overflow = 'unset';
            if (!isOpen) {
                setMangaDetails(null);
                setTumangaChapters([]);
                setSelectedChapter(null);
                setReaderPages(null);
            }
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, manga?.id, manga?.slug]);

    const loadMangaData = async (slug) => {
        setIsLoadingDetails(true);
        setIsLoadingChapters(true);

        try {
            // Cargar detalles y capítulos en paralelo
            const [details, chapters] = await Promise.all([
                getTuMangaDetails(slug),
                getTuMangaChapters(slug)
            ]);

            if (details) {
                setMangaDetails(details);
                // Actualizar datos en biblioteca si está guardado
                if (inLibrary && updateMangaData) {
                    updateMangaData(manga.id, {
                        lastChapter: details.lastChapter,
                        description: details.description,
                        author: details.author
                    });
                }
            }

            setTumangaChapters(chapters || []);
        } catch (error) {
            console.error('Error loading manga data:', error);
        } finally {
            setIsLoadingDetails(false);
            setIsLoadingChapters(false);
        }
    };

    const handleStatusChangeInternal = (statusId) => {
        if (onStatusChange) {
            onStatusChange(statusId);
        }
    };

    const handleShare = () => {
        const shareText = `¡Devoraste! 🥑 Mira lo que estoy leyendo en mi Santuario Potaxie: ${manga?.title}. ¡Está para quedar tiesa! ✨`;
        navigator.clipboard.writeText(shareText).then(() => {
            showToast("¡LINK COPIADO, REINA! 💅✨");
        });
    };

    const openReader = async (chapter) => {
        if (!manga?.slug) return;

        setSelectedChapter(chapter.chapter);
        setIsOpeningReader(true);

        try {
            const pages = await getTuMangaPages(manga.slug, chapter.chapter);
            if (pages && pages.length > 0) {
                setReaderPages(pages);
            } else {
                // Mensaje más descriptivo sobre el error
                showToast("El sitio cambió su protección. Intenta leer en tumanga.org directamente 😭💅");
                // Abrir el capítulo en una nueva pestaña como fallback
                const chapterUrl = chapter.url || `https://tumanga.org/leer/${manga.slug}-${chapter.chapter}`;
                window.open(chapterUrl, '_blank');
            }
        } catch (error) {
            console.error('Error opening reader:', error);
            showToast("¡Error de conexión! Intenta de nuevo 💅");
        }
        setIsOpeningReader(false);
    };

    // Usar detalles cargados o datos del manga original
    const displayData = mangaDetails || manga;
    const description = displayData?.description || "Esta obra es tan icónica que no necesita palabras... ¡Devoraste! 🥑";
    const lastChapter = displayData?.lastChapter || manga?.lastChapter || "?";

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border-2 ${theme === 'dark' ? 'border-purple-500/30' : 'border-potaxie-green/30'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botón de Cierre */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 p-2.5 bg-white/20 dark:bg-gray-800/40 backdrop-blur-xl rounded-full text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:scale-110 transition-all border border-white/20"
                        >
                            <X size={24} />
                        </button>

                        {/* Izquierda: Portada */}
                        <div className="md:w-[45%] relative h-72 md:h-auto overflow-hidden bg-gray-200 dark:bg-gray-800">
                            <img
                                src={getImageUrl(displayData?.cover || manga?.cover) || PLACEHOLDER_IMAGE}
                                alt={displayData?.title || manga?.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-4 py-1.5 bg-potaxie-green/90 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {displayData?.status === 'completed' ? 'Finalizado' : 'En Emisión'}
                                    </span>
                                    <span className={`px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/10 ${isLoadingDetails ? 'animate-pulse opacity-50' : ''}`}>
                                        {lastChapter} Caps ✨
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Derecha: Información */}
                        <div className="md:w-[55%] p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col bg-white dark:bg-gray-900">
                            <div className="mb-8">
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-[1.1] mb-3 tracking-tighter">
                                    {displayData?.title || manga?.title}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-[2px] bg-potaxie-green rounded-full" />
                                    <p className="text-potaxie-600 dark:text-potaxie-400 font-black text-sm uppercase tracking-wider">
                                        {displayData?.author || manga?.author || "Autor Desconocido"}
                                    </p>
                                </div>
                            </div>

                            {/* Sinopsis */}
                            <div className="mb-8">
                                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                                    <BookOpen size={14} className="text-potaxie-green" /> Sinopsis Potaxina
                                </h3>
                                <div className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-[2rem] border border-gray-100/50 dark:border-gray-800 transition-colors">
                                    {isLoadingDetails ? (
                                        <span className="animate-pulse">Cargando sinopsis...</span>
                                    ) : (
                                        <TypewriterText text={description} />
                                    )}
                                </div>
                            </div>

                            {/* Estados de Lectura (Solo Biblioteca) */}
                            {inLibrary && (
                                <div className="mb-8">
                                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4">
                                        Estado de mi lectura ✨
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleStatusChangeInternal(opt.id)}
                                                className={`
                                                    flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2
                                                    ${manga.status === opt.id
                                                        ? `${opt.color} ${opt.text} border-transparent shadow-xl scale-105 ring-4 ring-offset-4 dark:ring-offset-gray-900 ${opt.id === 'devorando' ? 'ring-potaxie-green/20' : 'ring-yellow-400/20'}`
                                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-400 hover:border-potaxie-200'}
                                                `}
                                            >
                                                <span className="text-2xl">{opt.emoji}</span>
                                                <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notas (Solo Biblioteca) */}
                            {inLibrary && (
                                <div className="mb-8">
                                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4">
                                        Mis Teorías y Chismes 🤳
                                    </h3>
                                    <textarea
                                        value={note}
                                        onChange={(e) => saveNote(manga.id, e.target.value)}
                                        placeholder="Anota aquí tus teorías más locas potaxie..."
                                        className="w-full h-36 p-6 text-sm bg-yellow-50/50 dark:bg-gray-800/50 border-2 border-yellow-100/50 dark:border-purple-500/10 rounded-[2rem] focus:ring-4 ring-potaxie-green/10 focus:border-potaxie-green outline-none transition-all resize-none dark:text-gray-200 font-medium italic"
                                    />
                                </div>
                            )}

                            {/* Sección de Capítulos */}
                            {manga?.slug && (
                                <div className="mb-8">
                                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                                        <Sparkles size={14} className="text-potaxie-green" /> Lectura Directa ✨
                                    </h3>
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2">
                                        {isLoadingChapters ? (
                                            <span className="text-xs text-gray-400 italic animate-pulse">Cargando capítulos...</span>
                                        ) : tumangaChapters.length > 0 ? (
                                            tumangaChapters.map((ch) => (
                                                <button
                                                    key={ch.id}
                                                    onClick={() => openReader(ch)}
                                                    disabled={isOpeningReader}
                                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-potaxie-green hover:text-white dark:hover:bg-potaxie-green dark:text-gray-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                                >
                                                    Cap {ch.chapter}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No se encontraron capítulos disponibles.</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Botón de Compartir */}
                            <div className="mt-auto pt-6 flex items-center gap-4">
                                <button
                                    onClick={handleShare}
                                    className="flex-grow flex items-center justify-center gap-3 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl font-black text-sm transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95 relative overflow-hidden group/share"
                                >
                                    <Share2 size={20} className="group-hover/share:rotate-12 transition-transform" />
                                    <span>CONVOCAR A LAS DIVAS 👜</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Reader Portal */}
            <AnimatePresence>
                {readerPages && (
                    <Reader
                        pages={readerPages}
                        title={manga.title}
                        chapter={selectedChapter}
                        onClose={() => setReaderPages(null)}
                    />
                )}
            </AnimatePresence>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
