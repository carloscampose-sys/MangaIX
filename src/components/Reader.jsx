import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

export const Reader = ({ pages, title, chapter, onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [fullWidth, setFullWidth] = useState(true);

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

    const next = () => {
        if (currentPage < pages.length - 1) setCurrentPage(v => v + 1);
    };

    const prev = () => {
        if (currentPage > 0) setCurrentPage(v => v - 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col"
        >
            {/* Header / Toolbar */}
            <div className="bg-gray-900/90 text-white px-4 py-3 flex items-center justify-between backdrop-blur-md border-b border-white/10">
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-potaxie-green tracking-widest">{title}</span>
                    <span className="text-lg font-bold leading-none">Capítulo {chapter} ✨</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold">
                        <span>Pág {currentPage + 1} / {pages.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFullWidth(!fullWidth)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title={fullWidth ? "Ajustar al alto" : "Ajustar al ancho"}
                        >
                            {fullWidth ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content: Scrolled or Paged Viewer */}
            <div className="flex-grow overflow-y-auto custom-scrollbar bg-zinc-950 flex flex-col items-center">
                {pages.map((page, idx) => (
                    <div key={idx} className={`${fullWidth ? 'w-full max-w-3xl' : 'h-[90vh]'} flex justify-center`}>
                        <img
                            src={page}
                            alt={`Página ${idx + 1}`}
                            className={`object-contain ${fullWidth ? 'w-full' : 'h-full'}`}
                            loading={idx < 3 ? "eager" : "lazy"}
                        />
                    </div>
                ))}

                <div className="py-20 flex flex-col items-center gap-6">
                    <div className="text-white font-black text-xl flex items-center gap-3">
                        <span className="p-3 bg-potaxie-green rounded-full animate-bounce">🥑</span>
                        ¡DEVORASTE ESTE CAPÍTULO!
                        <span className="p-3 bg-potaxie-green rounded-full animate-bounce">🥑</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform shadow-2xl"
                    >
                        VOLVER AL SANTUARIO
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
