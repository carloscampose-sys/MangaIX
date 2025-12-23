import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Sparkles, BookOpen } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getTuMangaChapters, getTuMangaPages, getTuMangaDetails } from '../services/tumanga';
import { unifiedGetDetails, unifiedGetChapters, unifiedGetPages } from '../services/unified';
import { getSourceById } from '../services/sources';
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

    // Capítulos por fuente
    const [chaptersBySource, setChaptersBySource] = useState({
        tumanga: [],
        manhwaweb: []
    });
    const [selectedChapterSource, setSelectedChapterSource] = useState(manga?.source || 'tumanga');
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
                setChaptersBySource({ tumanga: [], manhwaweb: [] });
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

        const source = manga?.source || 'tumanga';

        try {
            // Cargar detalles y capítulos de la fuente correspondiente
            const [details, chapters] = await Promise.all([
                unifiedGetDetails(slug, source),
                unifiedGetChapters(slug, source)
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

            // Guardar capítulos en el objeto por fuente
            setChaptersBySource(prev => ({
                ...prev,
                [source]: chapters || []
            }));
            
            // Establecer la fuente seleccionada
            setSelectedChapterSource(source);
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

    const openReader = async (chapter, source) => {
        if (!manga?.slug) return;

        setSelectedChapter(chapter.chapter);
        setIsOpeningReader(true);

        try {
            const pages = await unifiedGetPages(manga.slug, chapter.chapter, source || selectedChapterSource);
            if (pages && pages.length > 0) {
                setReaderPages(pages);
            } else {
                const sourceInfo = getSourceById(source || selectedChapterSource);
                showToast(`No se pudieron cargar las páginas. Intenta en ${sourceInfo.name} directamente 😭💅`);
                
                // Abrir el capítulo en una nueva pestaña como fallback
                if (chapter.url) {
                    window.open(chapter.url, '_blank');
                }
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
    
    // Calcular el número real de capítulos desde los capítulos cargados
    const currentChapters = chaptersBySource[selectedChapterSource] || [];
    const chaptersCount = currentChapters.length > 0 ? currentChapters.length : (displayData?.lastChapter || manga?.lastChapter || "?");

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
                        className={`relative w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border-2 ${theme === 'dark' ? 'border-purple-500/30' : 'border-potaxie-green/30'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botón de Cierre */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 z-50 p-2 sm:p-2.5 bg-white/20 dark:bg-gray-800/40 backdrop-blur-xl rounded-full text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:scale-110 transition-all border border-white/20"
                        >
                            <X size={20} className="sm:w-6 sm:h-6" />
                        </button>

                        {/* Izquierda: Portada */}
                        <div className="md:w-[45%] relative h-48 sm:h-64 md:h-auto overflow-hidden bg-gray-200 dark:bg-gray-800">
                            <img
                                src={getImageUrl(displayData?.cover || manga?.cover) || PLACEHOLDER_IMAGE}
                                alt={displayData?.title || manga?.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    <span className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 bg-potaxie-green/90 backdrop-blur-md rounded-full text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {displayData?.status === 'completed' ? 'Finalizado' : 'En Emisión'}
                                    </span>
                                    <span className={`px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-white/10 ${isLoadingChapters ? 'animate-pulse opacity-50' : ''}`}>
                                        {chaptersCount} Caps ✨
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Derecha: Información */}
                        <div className="md:w-[55%] p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col bg-white dark:bg-gray-900">
                            <div className="mb-4 sm:mb-6 md:mb-8">
                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-[1.1] mb-2 sm:mb-3 tracking-tighter pr-8">
                                    {displayData?.title || manga?.title}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 sm:w-8 h-[2px] bg-potaxie-green rounded-full" />
                                    <p className="text-potaxie-600 dark:text-potaxie-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                                        {displayData?.author || manga?.author || "Autor Desconocido"}
                                    </p>
                                </div>
                            </div>

                            {/* Información de la Obra */}
                            {mangaDetails && (mangaDetails.genres?.length > 0 || mangaDetails.statusRaw || mangaDetails.alternativeTitles?.length > 0) && (
                                <div className="mb-4 sm:mb-6 md:mb-8">
                                    <h3 className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-2 sm:mb-3 md:mb-4">
                                        Info de la Obra ✨
                                    </h3>
                                    <div className="bg-gray-50/50 dark:bg-gray-800/30 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-gray-100/50 dark:border-gray-800 space-y-3">
                                        
                                        {/* Géneros */}
                                        {mangaDetails.genres?.length > 0 && (
                                            <div>
                                                <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                                                    Géneros
                                                </p>
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                    {mangaDetails.genres.map((genre, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className="px-2 sm:px-3 py-1 bg-potaxie-green/10 dark:bg-potaxie-green/20 text-potaxie-700 dark:text-potaxie-300 rounded-lg text-[10px] sm:text-xs font-bold"
                                                        >
                                                            {genre}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Estado */}
                                        {mangaDetails.statusRaw && (
                                            <div>
                                                <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                                                    Estado
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                    {mangaDetails.statusRaw}
                                                </p>
                                            </div>
                                        )}

                                        {/* Nombres Asociados */}
                                        {mangaDetails.alternativeTitles?.length > 0 && (
                                            <div>
                                                <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                                                    Nombres Asociados
                                                </p>
                                                <div className="space-y-1">
                                                    {mangaDetails.alternativeTitles.map((altTitle, idx) => (
                                                        <p key={idx} className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                            • {altTitle}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sinopsis */}
                            <div className="mb-4 sm:mb-6 md:mb-8">
                                <h3 className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                                    <BookOpen size={12} className="sm:w-[14px] sm:h-[14px] text-potaxie-green" /> Sinopsis Potaxina
                                </h3>
                                <div className="text-xs sm:text-sm md:text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[2rem] border border-gray-100/50 dark:border-gray-800 transition-colors">
                                    {isLoadingDetails ? (
                                        <span className="animate-pulse">Cargando sinopsis...</span>
                                    ) : (
                                        <TypewriterText text={description} />
                                    )}
                                </div>
                            </div>

                            {/* Estados de Lectura (Solo Biblioteca) */}
                            {inLibrary && (
                                <div className="mb-4 sm:mb-6 md:mb-8">
                                    <h3 className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-2 sm:mb-3 md:mb-4">
                                        Estado de mi lectura ✨
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {STATUS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleStatusChangeInternal(opt.id)}
                                                className={`
                                                    flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all border-2
                                                    ${manga.status === opt.id
                                                        ? `${opt.color} ${opt.text} border-transparent shadow-xl scale-105 ring-2 sm:ring-4 ring-offset-2 sm:ring-offset-4 dark:ring-offset-gray-900 ${opt.id === 'devorando' ? 'ring-potaxie-green/20' : 'ring-yellow-400/20'}`
                                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-400 hover:border-potaxie-200'}
                                                `}
                                            >
                                                <span className="text-lg sm:text-xl md:text-2xl">{opt.emoji}</span>
                                                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notas (Solo Biblioteca) */}
                            {inLibrary && (
                                <div className="mb-4 sm:mb-6 md:mb-8">
                                    <h3 className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-2 sm:mb-3 md:mb-4">
                                        Mis Teorías y Chismes 🤳
                                    </h3>
                                    <textarea
                                        value={note}
                                        onChange={(e) => saveNote(manga.id, e.target.value)}
                                        placeholder="Anota aquí tus teorías más locas potaxie..."
                                        className="w-full h-24 sm:h-28 md:h-36 p-3 sm:p-4 md:p-6 text-xs sm:text-sm bg-yellow-50/50 dark:bg-gray-800/50 border-2 border-yellow-100/50 dark:border-purple-500/10 rounded-xl sm:rounded-2xl md:rounded-[2rem] focus:ring-4 ring-potaxie-green/10 focus:border-potaxie-green outline-none transition-all resize-none dark:text-gray-200 font-medium italic"
                                    />
                                </div>
                            )}

                            {/* Sección de Capítulos */}
                            {manga?.slug && (
                                <div className="mb-4 sm:mb-6 md:mb-8">
                                    <h3 className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 dark:text-gray-500 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                                        <Sparkles size={12} className="sm:w-[14px] sm:h-[14px] text-potaxie-green" /> Lectura Directa ✨
                                    </h3>
                                    
                                    {/* Tabs de fuentes (si hay capítulos en la fuente actual) */}
                                    {chaptersBySource[selectedChapterSource]?.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                                                <span className="font-bold">Fuente:</span>
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg font-bold flex items-center gap-1">
                                                    {getSourceById(selectedChapterSource).icon}
                                                    <span className="hidden sm:inline">{getSourceById(selectedChapterSource).name}</span>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-36 sm:max-h-48 overflow-y-auto custom-scrollbar p-1.5 sm:p-2">
                                        {isLoadingChapters ? (
                                            <span className="text-[10px] sm:text-xs text-gray-400 italic animate-pulse">Cargando capítulos...</span>
                                        ) : chaptersBySource[selectedChapterSource]?.length > 0 ? (
                                            chaptersBySource[selectedChapterSource].map((ch) => (
                                                <button
                                                    key={ch.id}
                                                    onClick={() => openReader(ch, selectedChapterSource)}
                                                    disabled={isOpeningReader}
                                                    className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-potaxie-green hover:text-white dark:hover:bg-potaxie-green dark:text-gray-300 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50"
                                                >
                                                    Cap {ch.chapter}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-[10px] sm:text-xs text-gray-400 italic">No se encontraron capítulos disponibles.</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Botón de Compartir */}
                            <div className="mt-auto pt-4 sm:pt-6 flex items-center gap-2 sm:gap-4">
                                <button
                                    onClick={handleShare}
                                    className="flex-grow flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl font-black text-xs sm:text-sm transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95 relative overflow-hidden group/share"
                                >
                                    <Share2 size={16} className="sm:w-5 sm:h-5 group-hover/share:rotate-12 transition-transform" />
                                    <span className="hidden sm:inline">CONVOCAR A LAS DIVAS 👜</span>
                                    <span className="sm:hidden">COMPARTIR 👜</span>
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
