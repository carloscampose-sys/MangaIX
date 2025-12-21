import React, { createContext, useContext, useState, useEffect } from 'react';

const LibraryContext = createContext();

export const LEVELS = [
    { min: 0, max: 50, title: "Semillita 🌱" },
    { min: 51, max: 150, title: "Potaxina en Entrenamiento 🥑" },
    { min: 151, max: 500, title: "Diva Devoradora ✨" },
    { min: 500, max: Infinity, title: "Potaxie Suprema de Jiafei (Nivel Máximo) 👑" }
];

export const LibraryProvider = ({ children }) => {
    const [library, setLibrary] = useState(() => {
        try {
            const saved = localStorage.getItem('library');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error parsing library from localStorage", e);
            return [];
        }
    });

    const [devouredChapters, setDevouredChapters] = useState(() => {
        try {
            return parseInt(localStorage.getItem('devouredChapters')) || 0;
        } catch (e) {
            return 0;
        }
    });

    const [notes, setNotes] = useState(() => {
        try {
            const saved = localStorage.getItem('notes');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [level, setLevel] = useState(LEVELS[0]);

    useEffect(() => {
        localStorage.setItem('library', JSON.stringify(library));
    }, [library]);

    useEffect(() => {
        localStorage.setItem('devouredChapters', devouredChapters.toString());
        const currentLevel = LEVELS.find(l => devouredChapters >= l.min && devouredChapters <= l.max) || LEVELS[LEVELS.length - 1];
        setLevel(currentLevel);
    }, [devouredChapters]);

    useEffect(() => {
        localStorage.setItem('notes', JSON.stringify(notes));
    }, [notes]);

    const addToLibrary = (manga) => {
        if (!library.find(m => m.id === manga.id)) {
            setLibrary([...library, { ...manga, chaptersRead: 0, rating: 0, status: 'devorando' }]);
        }
    };

    const removeFromLibrary = (mangaId) => {
        setLibrary(library.filter(m => m.id !== mangaId));
    };

    const updateProgress = (mangaId, additionalChapters) => {
        setLibrary(library.map(m => {
            if (m.id === mangaId) {
                return { ...m, chaptersRead: (m.chaptersRead || 0) + additionalChapters };
            }
            return m;
        }));
        setDevouredChapters(prev => prev + additionalChapters);
    };

    const setMangaStatus = (mangaId, status) => {
        setLibrary(library.map(m => {
            if (m.id === mangaId) return { ...m, status };
            return m;
        }));
    };

    const setMangaRating = (mangaId, rating) => {
        setLibrary(library.map(m => {
            if (m.id === mangaId) return { ...m, rating };
            return m;
        }));
    };

    const saveNote = (mangaId, text) => {
        setNotes(prev => ({ ...prev, [mangaId]: text }));
    };

    const getNote = (mangaId) => notes[mangaId] || "";

    const [translations, setTranslations] = useState(() => {
        try {
            const saved = localStorage.getItem('translations');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('translations', JSON.stringify(translations));
    }, [translations]);

    const saveTranslation = (mangaId, text) => {
        setTranslations(prev => ({ ...prev, [mangaId]: text }));
    };

    const getTranslation = (mangaId) => translations[mangaId];

    const updateMangaData = (mangaId, newData) => {
        setLibrary(prev => prev.map(m => {
            if (m.id === mangaId) return { ...m, ...newData };
            return m;
        }));
    };

    return (
        <LibraryContext.Provider value={{
            library,
            addToLibrary,
            removeFromLibrary,
            devouredChapters,
            level,
            updateProgress,
            saveNote,
            getNote,
            setMangaStatus,
            setMangaRating,
            saveTranslation,
            getTranslation,
            updateMangaData
        }}>
            {children}
        </LibraryContext.Provider>
    );
};

export const useLibrary = () => useContext(LibraryContext);
