import { useState, useEffect, useRef, useCallback } from 'react';

export const useChapterLoader = () => {
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);

    // Limpiar intervalos al desmontar
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Simular progreso realista con velocidad variable
    const simulateProgress = useCallback(() => {
        let current = 0;
        
        const updateProgress = () => {
            if (current < 30) {
                // Fase 1: Rápido (0-30%)
                current += 2;
            } else if (current < 70) {
                // Fase 2: Medio (30-70%)
                current += 1;
            } else if (current < 90) {
                // Fase 3: Lento (70-90%)
                current += 0.5;
            } else if (current < 99) {
                // Fase 4: Muy lento (90-99%)
                current += 0.2;
            }
            
            setProgress(Math.min(current, 99)); // Nunca llegar a 100 automáticamente
            
            if (current >= 99) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        };
        
        intervalRef.current = setInterval(updateProgress, 50);
    }, []);

    // Iniciar la carga
    const startLoading = useCallback(() => {
        setIsLoading(true);
        setProgress(0);
        
        // Pequeño delay antes de empezar la simulación
        timeoutRef.current = setTimeout(() => {
            simulateProgress();
        }, 100);
    }, [simulateProgress]);

    // Completar la carga instantáneamente
    const completeLoading = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        setProgress(100);
        
        // Mantener el 100% visible por un momento antes de ocultar
        setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
        }, 500);
    }, []);

    // Resetear la carga
    const resetLoading = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        setProgress(0);
        setIsLoading(false);
    }, []);

    return {
        progress,
        isLoading,
        startLoading,
        completeLoading,
        resetLoading
    };
};
