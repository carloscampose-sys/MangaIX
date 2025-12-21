import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'info') => {
        // Replace existing toast immediately
        setToast(null);
        // We use a micro-task or a tiny delay to trigger AnimatePresence exit/enter
        requestAnimationFrame(() => {
            setToast({ message, type, id: Date.now() });
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <AnimatePresence mode="wait">
                {toast && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none w-full max-w-xs px-4">
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            onAnimationComplete={() => {
                                const timer = setTimeout(hideToast, 3000);
                                return () => clearTimeout(timer);
                            }}
                            className={`
                                pointer-events-auto
                                flex items-center gap-3 px-6 py-4 rounded-[2rem] shadow-2xl backdrop-blur-md border border-potaxie-green/20
                                bg-white/70 dark:bg-gray-900/70
                            `}
                        >
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="text-2xl flex-shrink-0"
                            >
                                {toast.message.includes('🥑') ? '🥑' : toast.message.includes('💅') ? '💅' : '✨'}
                            </motion.div>
                            <p className="text-sm font-black text-gray-800 dark:text-white leading-tight">
                                {toast.message}
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
