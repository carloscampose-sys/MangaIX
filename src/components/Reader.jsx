import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import { readingProgressService } from '../services/readingProgressService';

export const Reader = ({ 
    pages, 
    title, 
    chapter, 
    onClose,
    onNextChapter = null,
    onPreviousChapter = null,
    hasNextChapter = false,
    hasPreviousChapter = false,
    isLoadingChapter = false,
    manga = null  // Agregar manga para poder guardar progreso
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [fullWidth, setFullWidth] = useState(true);
    const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
    const scrollContainerRef = useRef(null);
    
    const { library, updateProgress } = useLibrary();
    const { showToast } = useToast();
    
    // Generar IDs únicos para el progreso
    const mangaId = manga?.id || manga?.slug || 'unknown';
    const chapterId = `chapter_${chapter}`;

    // Restaurar progreso al montar el componente
    useEffect(() => {
        if (pages && pages.length > 0 && mangaId && chapterId && mangaId !== 'unknown') {
            const savedProgress = readingProgressService.getProgress(mangaId, chapterId);
            
            console.log('[Reader] Checking for saved progress:', { mangaId, chapterId, savedProgress });
            
            if (savedProgress && savedProgress.currentPage > 0) {
                console.log('[Reader] Restoring progress to page:', savedProgress.currentPage);
                setCurrentPage(savedProgress.currentPage);
                setHasRestoredProgress(true);
                
                // Mostrar notificación
                showToast(`📖 Continuando desde página ${savedProgress.currentPage + 1}`);
                
                // Scroll a la página correcta después de un delay más largo para asegurar que las imágenes cargaron
                setTimeout(() => {
                    if (scrollContainerRef.current) {
                        const pageImages = scrollContainerRef.current.querySelectorAll('div > img');
                        if (pageImages[savedProgress.currentPage]) {
                            const targetImage = pageImages[savedProgress.currentPage];
                            targetImage.parentElement.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start'
                            });
                            console.log('[Reader] Scrolled to page:', savedProgress.currentPage);
                        }
                    }
                }, 500);
            }
        }
    }, [mangaId, chapterId, pages?.length]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Detectar la página actual basándose en el scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !pages || pages.length === 0) return;

        const handleScroll = () => {
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;
            
            // Obtener solo los divs que contienen imágenes de páginas
            const pageContainers = Array.from(container.children).filter(child => {
                return child.querySelector('img') && child.querySelector('img').alt?.startsWith('Página');
            });
            
            // Encontrar qué página está más cerca del centro del viewport
            let closestPage = 0;
            let minDistance = Infinity;
            
            pageContainers.forEach((pageDiv, index) => {
                const rect = pageDiv.getBoundingClientRect();
                const pageCenter = rect.top + rect.height / 2;
                const distance = Math.abs(pageCenter - containerCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPage = index;
                }
            });
            
            if (closestPage !== currentPage) {
                setCurrentPage(closestPage);
            }
        };

        // Ejecutar inmediatamente y luego en cada scroll
        handleScroll();
        container.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => container.removeEventListener('scroll', handleScroll);
    }, [pages, currentPage]);

    // Scroll automático al inicio cuando cambian las páginas (nuevo capítulo)
    useEffect(() => {
        if (pages && pages.length > 0 && scrollContainerRef.current) {
            // Solo resetear si no estamos restaurando progreso
            if (!hasRestoredProgress) {
                // Reset indicador de página
                setCurrentPage(0);
                
                // Scroll inmediato para evitar que el usuario vea la posición anterior
                scrollContainerRef.current.scrollTop = 0;
                
                // Pequeño delay para asegurar que las imágenes se cargaron
                const timer = setTimeout(() => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
                
                return () => clearTimeout(timer);
            }
        }
    }, [pages]);

    // Guardar progreso automáticamente cuando cambia la página (con debounce)
    useEffect(() => {
        if (pages && pages.length > 0 && mangaId && chapterId && mangaId !== 'unknown' && (hasRestoredProgress || currentPage > 0)) {
            const timeoutId = setTimeout(() => {
                console.log('[Reader] Auto-saving progress:', { mangaId, chapterId, currentPage, totalPages: pages.length });
                readingProgressService.saveProgress(
                    mangaId,
                    chapterId,
                    currentPage,
                    pages.length
                );
            }, 500); // Debounce de 500ms

            return () => clearTimeout(timeoutId);
        }
    }, [currentPage, mangaId, chapterId, pages?.length, hasRestoredProgress]);

    const next = () => {
        if (currentPage < pages.length - 1) setCurrentPage(v => v + 1);
    };

    const prev = () => {
        if (currentPage > 0) setCurrentPage(v => v - 1);
    };

    // Limpiar progreso al cambiar de capítulo
    const handleNextChapter = () => {
        if (mangaId && chapterId) {
            readingProgressService.clearProgress(mangaId, chapterId);
        }
        
        // Auto-guardar progreso al avanzar al siguiente capítulo
        autoSaveProgress();
        
        if (onNextChapter) {
            onNextChapter();
        }
    };

    const handlePreviousChapter = () => {
        if (mangaId && chapterId) {
            readingProgressService.clearProgress(mangaId, chapterId);
        }
        if (onPreviousChapter) {
            onPreviousChapter();
        }
    };

    // Función para auto-guardar progreso
    const autoSaveProgress = () => {
        if (!manga) return;

        // Verificar si está en biblioteca
        const mangaInLibrary = library.find(m => m.id === manga.id);
        
        if (!mangaInLibrary) return;
        
        // Verificar si ya fue leído
        const currentChapterNum = parseInt(chapter);
        if (mangaInLibrary.chaptersRead >= currentChapterNum) return;
        
        try {
            // Calcular cuántos capítulos incrementar
            const chaptersToAdd = currentChapterNum - (mangaInLibrary.chaptersRead || 0);
            
            updateProgress(manga.id, chaptersToAdd);
            
            // Feedback visual
            showToast("✨ Progreso guardado! +1 capítulo devorado 🥑");
            
            // Confetti
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#A7D08C', '#FFD700', '#FFFFFF']
            });
            
        } catch (error) {
            console.error('Error guardando progreso:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col safe-area-top safe-area-bottom"
        >
            {/* Header / Toolbar */}
            <div className="bg-gray-900/90 text-white px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between backdrop-blur-md border-b border-white/10">
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-potaxie-green tracking-widest truncate">{title}</span>
                    <span className="text-sm sm:text-lg font-bold leading-none">Capítulo {chapter} ✨</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center gap-2 bg-black/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 text-[10px] sm:text-xs font-bold">
                        <span>Pág {currentPage + 1} / {pages.length}</span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => setFullWidth(!fullWidth)}
                            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
                            title={fullWidth ? "Ajustar al alto" : "Ajustar al ancho"}
                        >
                            {fullWidth ? <Minimize2 size={18} className="sm:w-5 sm:h-5" /> : <Maximize2 size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                        >
                            <X size={20} className="sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content: Scrolled or Paged Viewer */}
            <div 
                ref={scrollContainerRef}
                className="flex-grow overflow-y-auto custom-scrollbar bg-zinc-950 flex flex-col items-center"
            >
                {pages.map((page, idx) => (
                    <div key={idx} className={`${fullWidth ? 'w-full max-w-full sm:max-w-2xl md:max-w-3xl' : 'h-[90vh]'} flex justify-center`}>
                        <img
                            src={page}
                            alt={`Página ${idx + 1}`}
                            className={`object-contain ${fullWidth ? 'w-full' : 'h-full'}`}
                            loading={idx < 3 ? "eager" : "lazy"}
                        />
                    </div>
                ))}

                <div className="py-10 sm:py-16 md:py-20 flex flex-col items-center gap-4 sm:gap-6 px-4">
                    {/* Mensaje de finalización */}
                    <div className="text-white font-black text-base sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                        <span className="p-2 sm:p-3 bg-potaxie-green rounded-full animate-bounce">🥑</span>
                        <span className="text-center">¡DEVORASTE ESTE CAPÍTULO!</span>
                        <span className="p-2 sm:p-3 bg-potaxie-green rounded-full animate-bounce">🥑</span>
                    </div>
                    
                    {/* Navegación de capítulos */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-3xl">
                        {/* Botón Capítulo Anterior */}
                        {hasPreviousChapter && onPreviousChapter && (
                            <button
                                onClick={handlePreviousChapter}
                                disabled={isLoadingChapter}
                                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-2xl text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            >
                                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">ANTERIOR</span>
                                <span className="sm:hidden">◀</span>
                            </button>
                        )}
                        
                        {/* Botón Volver al Santuario */}
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-white text-black font-black rounded-xl sm:rounded-2xl hover:scale-105 transition-transform shadow-2xl text-xs sm:text-sm flex items-center justify-center gap-2"
                        >
                            <Home size={18} className="sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">MENÚ</span>
                            <span className="sm:hidden">📚</span>
                        </button>
                        
                        {/* Botón Siguiente Capítulo */}
                        {hasNextChapter && onNextChapter && (
                            <button
                                onClick={handleNextChapter}
                                disabled={isLoadingChapter}
                                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-potaxie-green hover:bg-[#A3E635] text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-2xl text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            >
                                <span className="hidden sm:inline">SIGUIENTE</span>
                                <span className="sm:hidden">▶</span>
                                <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                            </button>
                        )}
                    </div>
                    
                    {/* Indicador de carga */}
                    {isLoadingChapter && (
                        <div className="flex items-center gap-2 text-white text-sm animate-pulse">
                            <div className="w-2 h-2 bg-potaxie-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-potaxie-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-potaxie-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="ml-2">Cargando capítulo...</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
