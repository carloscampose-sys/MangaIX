import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { ManhwaCard } from './components/ManhwaCard';
import { Oracle } from './components/Oracle';
import { LoadingScreen } from './components/LoadingScreen';
import { PotaxioLuckModal } from './components/PotaxioLuckModal';
import { ToastProvider, useToast } from './context/ToastContext';
import { searchTuManga, TUMANGA_GENRES, TUMANGA_FORMATS, TUMANGA_MOODS } from './services/tumanga';
import { unifiedSearch, unifiedGetDetails } from './services/unified';
import { SOURCES, DEFAULT_SOURCE, getActiveSources } from './services/sources';
// Filtros dinámicos - Cambian según la fuente seleccionada (TuManga/ManhwaWeb)
import { getFiltersForSource, getEmptyFiltersForSource } from './services/filterService';
import { Search, Sparkles, Shuffle, Filter, RotateCcw, ChevronDown, ChevronUp, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainApp = ({ userName }) => {
  const [page, setPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedSource, setSelectedSource] = useState(DEFAULT_SOURCE);
  
  // Filtros específicos de ManhwaWeb (Tipo, Estado, Erótico, Demografía, Ordenar)
  // Estos estados solo se usan cuando selectedSource === 'manhwaweb'
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedErotic, setSelectedErotic] = useState('');
  const [selectedDemographic, setSelectedDemographic] = useState('');
  const [selectedSortBy, setSelectedSortBy] = useState('');
  const [selectedSortOrder, setSelectedSortOrder] = useState('');
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  
  const { showToast } = useToast();
  
  // Obtener filtros dinámicos según fuente seleccionada
  // TuManga: 5 moods, 21 géneros, 4 formatos
  // ManhwaWeb: 6 moods, 27 géneros + filtros avanzados
  const currentFilters = getFiltersForSource(selectedSource);

  // Library State for filtering
  const { library } = useLibrary();
  const [libraryFilter, setLibraryFilter] = useState('all');

  const PAGES_ORDER = ['home', 'library', 'oracle'];
  const [direction, setDirection] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLuckModalOpen, setIsLuckModalOpen] = useState(false);

  useEffect(() => {
    // Simulamos el tiempo del ritual potaxie
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // REMOVIDO: El useEffect que causaba problemas
  // Ahora goToNextPage y goToPreviousPage llaman directamente a handleSearch()

  const navigateToPage = (newPage) => {
    const currentIndex = PAGES_ORDER.indexOf(page);
    const nextIndex = PAGES_ORDER.indexOf(newPage);
    if (currentIndex === nextIndex) return;
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setPage(newPage);
  };

  const handleDragEnd = (event, info) => {
    if (document.body.style.overflow === 'hidden') return;
    const threshold = 50;
    const velocityThreshold = 500;
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocityThreshold) {
      const currentIndex = PAGES_ORDER.indexOf(page);
      if (info.offset.x > 0 && currentIndex > 0) {
        navigateToPage(PAGES_ORDER[currentIndex - 1]);
      } else if (info.offset.x < 0 && currentIndex < PAGES_ORDER.length - 1) {
        navigateToPage(PAGES_ORDER[currentIndex + 1]);
      }
    }
  };

  const pageVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const handleSearch = async (e, pageOverride = null) => {
    if (e) e.preventDefault();
    
    // Usar pageOverride si se proporciona, sino usar currentPage
    const pageToUse = pageOverride !== null ? pageOverride : currentPage;

    // Construir término de búsqueda
    let searchTerm = searchQuery;

    // SOLO PARA TUMANGA: Si hay géneros seleccionados y no hay término de búsqueda, usar género como término
    // ManhwaWeb usa filtros en URL directamente, no necesita texto de búsqueda
    if (selectedSource === 'tumanga') {
      if (!searchTerm && selectedGenres.length > 0) {
        const firstGenre = TUMANGA_GENRES.find(g => selectedGenres.includes(g.id));
        if (firstGenre) {
          searchTerm = firstGenre.searchParam;
        }
      }

      // Si hay mood seleccionado y no hay término, usar género del mood
      if (!searchTerm && selectedMood) {
        const moodGenre = TUMANGA_GENRES.find(g => selectedMood.genres.includes(g.id));
        if (moodGenre) {
          searchTerm = moodGenre.searchParam;
        }
      }
    }

    // Validación: Si no hay término de búsqueda ni filtros, no buscar
    if (!searchTerm && selectedGenres.length === 0 && selectedFormats.length === 0 && !selectedMood &&
        selectedSource === 'tumanga') {
      console.log('[App] No hay query ni filtros, no se ejecuta búsqueda');
      return;
    }

    // Para ManhwaWeb, permitir búsqueda solo con filtros (sin searchTerm)
    if (selectedSource === 'manhwaweb' && !searchTerm && selectedGenres.length === 0) {
      console.log('[App] ManhwaWeb: No hay query ni géneros, no se ejecuta búsqueda');
      return;
    }

    setLoading(true);

    // Toast especial para ManhwaWeb (tarda más)
    if (selectedSource === 'manhwaweb') {
      showToast('🌐 ManhwaWeb puede tardar 30-60s... Ten paciencia 🥑');
    }

    // Construir filtros según la fuente seleccionada
    let filters = {};
    
    if (selectedSource === 'tumanga') {
      filters = {
        genres: selectedGenres,
        formats: selectedFormats
      };
    } else if (selectedSource === 'manhwaweb') {
      filters = {
        genres: selectedGenres,
        type: selectedType,
        status: selectedStatus,
        erotic: selectedErotic,
        demographic: selectedDemographic,
        sortBy: selectedSortBy,
        sortOrder: selectedSortOrder
      };
    }
    
    // Usar servicio unificado según la fuente seleccionada con página actual
    console.log('[App] Ejecutando búsqueda con página:', pageToUse);
    let results = await unifiedSearch(searchTerm, filters, selectedSource, pageToUse);

    // IMPORTANTE: Guardar el conteo ANTES de modificar los resultados
    const resultCount = results.length;

    // Si no hay resultados y hay filtros, intentar sin filtros
    if (results.length === 0 && (selectedGenres.length > 0 || selectedFormats.length > 0)) {
      results = await unifiedSearch(searchQuery, {}, selectedSource);
    }

    // Enriquecer resultados con placeholder inicial
    results = results.map(manga => ({
      ...manga,
      description: "Cargando sinopsis... 📖",
      isLoadingDescription: true,
      author: '',
      status: 'ongoing',
      lastChapter: '?',
      year: '?'
    }));

    setSearchResults(results);
    
    // Determinar si hay más páginas basado en el conteo ORIGINAL
    // ManhwaWeb devuelve exactamente 30 resultados por página
    // Si obtuvimos 30, probablemente hay más páginas
    setHasMorePages(resultCount >= 30);
    
    setLoading(false);
    
    // Iniciar carga de sinopsis en segundo plano
    loadDescriptionsInBackground(results);
  };
  
  // ============================================================
  // LAZY LOADING DE SINOPSIS
  // ============================================================
  // Carga las sinopsis reales de las obras en segundo plano después
  // de mostrar los resultados iniciales. Esto mejora la UX al no bloquear
  // la visualización de resultados mientras se obtienen los detalles.
  // Las sinopsis aparecen gradualmente en lotes de 5 obras.
  // ============================================================
  
  // Función para cargar sinopsis en segundo plano (Lazy Loading)
  const loadDescriptionsInBackground = async (mangas) => {
    console.log('[App] Iniciando carga de sinopsis en background para', mangas.length, 'obras');
    
    // Cargar en lotes de 5 para no sobrecargar el servidor ni el navegador
    const batchSize = 5;
    
    for (let i = 0; i < mangas.length; i += batchSize) {
      const batch = mangas.slice(i, i + batchSize);
      
      // Procesar batch en paralelo
      await Promise.allSettled(
        batch.map(async (manga) => {
          try {
            console.log(`[App] Cargando sinopsis de: ${manga.title}`);
            const details = await unifiedGetDetails(manga.slug, manga.source);
            
            if (details && details.description) {
              // Actualizar la descripción en el estado
              updateMangaDescription(manga.id, details.description, details.author, details.genres);
              console.log(`[App] ✓ Sinopsis cargada: ${manga.title}`);
            }
          } catch (error) {
            console.error(`[App] Error cargando sinopsis de ${manga.title}:`, error);
            // Marcar como fallida
            updateMangaDescription(manga.id, "No se pudo cargar la sinopsis.", '', []);
          }
        })
      );
      
      // Pequeña pausa entre batches
      if (i + batchSize < mangas.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('[App] ✓ Carga de sinopsis completada');
  };
  
  // Función para actualizar descripción de un manga específico
  const updateMangaDescription = (mangaId, description, author = '', genres = []) => {
    setSearchResults(prev => prev.map(manga => 
      manga.id === mangaId 
        ? { 
            ...manga, 
            description, 
            author,
            genres: genres.length > 0 ? genres : manga.genres,
            isLoadingDescription: false 
          }
        : manga
    ));
  };
  
  // Función para ir a la página siguiente
  const goToNextPage = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    setLoading(true);
    
    // Hacer scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Ejecutar búsqueda pasando la página directamente
    handleSearch(null, nextPage);
  };
  
  // Función para ir a la página anterior
  const goToPreviousPage = async () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      setLoading(true);
      
      // Hacer scroll al inicio
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Ejecutar búsqueda pasando la página directamente
      handleSearch(null, prevPage);
    }
  };

  const handleMoodSelect = (mood) => {
    if (selectedMood?.id === mood.id) {
      setSelectedMood(null);
      setSelectedGenres([]);
    } else {
      setSelectedMood(mood);
      setSelectedGenres(mood.genres);
      showToast(mood.toast);
    }
  };

  const toggleGenre = (id) => {
    setSelectedMood(null); // Reset mood if user manually tweaks tags
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleFormat = (name) => {
    setSelectedFormats(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedMood(null);
    setSearchQuery('');
    // Limpiar filtros de ManhwaWeb también
    setSelectedType('');
    setSelectedStatus('');
    setSelectedErotic('');
    setSelectedDemographic('');
    setSelectedSortBy('');
    setSelectedSortOrder('');
    setCurrentPage(1); // Reset página también
  };

  const handleSurprise = () => {
    if (library.length === 0) {
      showToast("¡Añade algo a tu biblioteca primero, semillita! 🌱");
      return;
    }
    setIsLuckModalOpen(true);
  };

  const filteredLibrary = library.filter(m => {
    if (libraryFilter === 'all') return true;
    return m.status === libraryFilter;
  });

  return (
    <div className="min-h-screen pb-24 md:pb-32 relative">
      <AnimatePresence>
        {/* Global Toasts handled by ToastProvider */}
      </AnimatePresence>

      <div className="stars dark:block hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--duration': `${2 + Math.random() * 3}s`,
              '--opacity': Math.random()
            }}
          />
        ))}
      </div>

      <Navbar setPage={navigateToPage} />

      {/* Swipe Indicators (Mobile only) */}
      <div className="fixed inset-y-0 left-0 w-12 flex items-center justify-start z-40 pointer-events-none md:hidden overflow-hidden bg-gradient-to-r from-potaxie-green/5 to-transparent">
        <AnimatePresence>
          {PAGES_ORDER.indexOf(page) > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-potaxie-green/40 font-black text-2xl flex items-center gap-1 pl-2"
            >
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>&lt;</motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="fixed inset-y-0 right-0 w-12 flex items-center justify-end z-40 pointer-events-none md:hidden overflow-hidden bg-gradient-to-l from-potaxie-green/5 to-transparent">
        <AnimatePresence>
          {PAGES_ORDER.indexOf(page) < PAGES_ORDER.length - 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-potaxie-green/40 font-black text-2xl flex items-center gap-1 pr-2"
            >
              <motion.span animate={{ x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>&gt;</motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="container mx-auto responsive-px py-10 md:py-16 relative z-10 overflow-hidden min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="w-full h-full"
          >

            {page === 'home' && (
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4 tracking-tight drop-shadow-sm">
                    <span className="text-potaxie-green">
                      {userName && userName === 'Ana' ? (
                        <>El Santuario de <span className="text-potaxie-gold text-outline-gold">Ana</span> 🥑</>
                      ) : userName ? (
                        <>Bienvenida, <span className="text-potaxie-gold text-outline-gold">{userName}</span> 🥑</>
                      ) : (
                        <>Encuentra tu próximo vicio</>
                      )}
                    </span>
                  </h2>
                  <p className="text-purple-600 dark:text-purple-400 text-sm sm:text-base md:text-lg font-bold px-2">Busca mangas, manhwas, manhuas y webtoons</p>
                </div>

                <div className="max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 px-1">
                  {/* Selector de Fuente */}
                  <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                    {getActiveSources().map(source => {
                      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                      const isDisabled = isLocal && source.id === 'manhwaweb';
                      
                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => {
                            if (isDisabled) {
                              showToast(`⚠️ ManhwaWeb requiere Vercel. Usa TuManga en local 📚`);
                              return;
                            }
                            
                            // Cambiar fuente y resetear TODOS los filtros
                            setSelectedSource(source.id);
                            setSearchResults([]);
                            setSelectedGenres([]);
                            setSelectedFormats([]);
                            setSelectedMood(null);
                            setSelectedType('');
                            setSelectedStatus('');
                            setSelectedErotic('');
                            setSelectedDemographic('');
                            setSelectedSortBy('');
                            setSelectedSortOrder('');
                            setCurrentPage(1); // Reset página también
                            
                            showToast(`Fuente cambiada a ${source.name} ${source.icon}`);
                          }}
                          disabled={isDisabled}
                          className={`
                            flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm
                            transition-all duration-300 transform hover:scale-105 active:scale-95
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            ${selectedSource === source.id
                              ? `${source.color} text-white shadow-lg ring-2 ring-offset-2 ring-${source.color.replace('bg-', '')}`
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }
                          `}
                          title={isDisabled ? 'Solo disponible en Vercel' : ''}
                        >
                          <span className="text-base sm:text-lg">{source.icon}</span>
                          <span className="hidden sm:inline">{source.name}</span>
                          {isDisabled && <span className="text-xs">🚀</span>}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSearch} className="relative group mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Search className="text-gray-400 group-focus-within:text-potaxie-green transition-colors" size={18} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Busca por título..."
                      className="w-full pl-10 sm:pl-12 pr-24 sm:pr-40 py-3 sm:py-4 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur focus:ring-4 focus:ring-potaxie-green/20 focus:border-potaxie-green outline-none transition-all shadow-lg dark:text-white text-sm sm:text-base"
                    />
                    <div className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 flex gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={`px-2 sm:px-4 rounded-full font-bold flex items-center gap-1 sm:gap-2 transition-all relative text-xs sm:text-sm ${isFiltersOpen ? 'bg-potaxie-cream text-potaxie-700 border border-potaxie-green' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}
                      >
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filtros</span>
                        {(selectedGenres.length + selectedFormats.length > 0) && (
                          <span className="absolute -top-1 -right-1 w-4 sm:w-5 h-4 sm:h-5 bg-red-500 text-white text-[8px] sm:text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 animate-bounce">
                            {selectedGenres.length + selectedFormats.length}
                          </span>
                        )}
                        {isFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        type="submit"
                        className="px-3 sm:px-6 bg-potaxie-green hover:bg-green-600 text-white rounded-full font-bold shadow-md transition-transform active:scale-95 text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">Buscar</span>
                        <Search size={16} className="sm:hidden" />
                      </button>
                    </div>
                  </form>

                  <AnimatePresence>
                    {isFiltersOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -20 }}
                        className={`overflow-hidden backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-2xl mt-2 transition-colors duration-500 ${selectedMood ? `bg-gradient-to-br ${selectedMood.color}/10 dark:${selectedMood.color}/20` : 'bg-white/60 dark:bg-gray-800/60'}`}
                      >
                        <div className="space-y-6 sm:space-y-8">
                          {/* Mood Section - Dinámico según fuente */}
                          <div>
                            <div className="flex justify-between items-center mb-4 ml-2">
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                <Coffee size={14} className="text-potaxie-green" /> ¿Cómo está tu mood hoy, Potaxina? ✨
                              </h4>
                              {selectedMood && (
                                <button
                                  onClick={() => setSelectedMood(null)}
                                  className="text-[10px] bg-potaxie-cream dark:bg-gray-700 px-2 py-1 rounded-full text-potaxie-700 dark:text-potaxie-300 font-bold hover:scale-105 transition-all"
                                >
                                  🥑 Resetear Mood
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                              {currentFilters.moods.map(mood => (
                                <motion.button
                                  key={mood.id}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleMoodSelect(mood)}
                                  className={`
                                        flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all border-2
                                        ${selectedMood?.id === mood.id
                                      ? `bg-gradient-to-br ${mood.color} text-white border-transparent shadow-xl scale-105`
                                      : 'bg-white/40 dark:bg-gray-900/40 text-gray-400 border-transparent hover:bg-white dark:hover:bg-gray-800'}
                                    `}
                                >
                                  <span className="text-xl sm:text-2xl">{mood.name.split(' ').pop()}</span>
                                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter w-14 sm:w-16 text-center leading-tight">
                                    {mood.name.split(' ').slice(0, -1).join(' ')}
                                  </span>
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* Formatos (solo TuManga) */}
                          {selectedSource === 'tumanga' && currentFilters.formats.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-4 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-potaxie-green" />
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Formato Potaxio</h4>
                              </div>
                              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 justify-start">
                                {currentFilters.formats.map(format => {
                                  const isActive = selectedFormats.includes(format.name);
                                  const isManga = format.name.includes("Manga");
                                  return (
                                    <motion.button
                                      key={format.name}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => toggleFormat(format.name)}
                                      className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold chip-transition flex items-center justify-center gap-1 sm:gap-2 border-2 box-border
                                    ${isActive
                                          ? isManga
                                            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                                            : 'bg-potaxie-green text-white border-potaxie-green shadow-lg shadow-potaxie-green/30'
                                          : 'bg-white/50 dark:bg-gray-900/50 text-gray-500 border-transparent hover:border-potaxie-200'}
                                  `}
                                    >
                                      <div className={`w-3 sm:w-4 h-3 sm:h-4 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                        <Sparkles size={12} className="animate-pulse" />
                                      </div>
                                      {format.name}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Géneros - Dinámico según fuente */}
                          <div>
                            <div className="flex items-center gap-2 mb-4 ml-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Géneros Populares</h4>
                            </div>
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 max-h-40 sm:max-h-48 overflow-y-auto custom-scrollbar pr-2 justify-start">
                              {currentFilters.genres.map(genre => {
                                const isActive = selectedGenres.includes(genre.id);
                                const isSpecial = genre.id === 'boys-love' || genre.id === 'girls-love';
                                return (
                                  <motion.button
                                    key={genre.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleGenre(genre.id)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold chip-transition flex items-center justify-center gap-1 sm:gap-2 border-2 box-border
                                  ${isActive
                                        ? isSpecial
                                          ? 'bg-gradient-to-r from-pink-400 to-purple-600 text-white border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]'
                                          : 'bg-potaxie-cream text-potaxie-700 border-potaxie-green shadow-md'
                                        : 'bg-white/50 dark:bg-gray-900/50 text-gray-400 border-transparent hover:border-potaxie-100'}
                                `}
                                  >
                                    <div className={`w-2.5 sm:w-3 h-2.5 sm:h-3 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                      {isSpecial ? <Sparkles size={10} /> : <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-potaxie-green shadow-[0_0_5px_#A7D08C]" />}
                                    </div>
                                    {genre.name}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Filtros Avanzados (solo ManhwaWeb) */}
                          {selectedSource === 'manhwaweb' && currentFilters.hasAdvancedFilters && (
                            <>
                              {/* Tipo */}
                              <div>
                                <div className="flex items-center gap-2 mb-3 ml-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Tipo de Obra</h4>
                                </div>
                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                  {currentFilters.types.map(type => (
                                    <button
                                      key={type.id}
                                      onClick={() => setSelectedType(selectedType === type.value ? '' : type.value)}
                                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                        selectedType === type.value
                                          ? 'bg-blue-500 text-white shadow-lg'
                                          : 'bg-white/50 dark:bg-gray-900/50 text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      {type.name}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Estado */}
                              <div>
                                <div className="flex items-center gap-2 mb-3 ml-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Estado</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {currentFilters.status.map(status => (
                                    <button
                                      key={status.id}
                                      onClick={() => setSelectedStatus(selectedStatus === status.value ? '' : status.value)}
                                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                        selectedStatus === status.value
                                          ? 'bg-green-500 text-white shadow-lg'
                                          : 'bg-white/50 dark:bg-gray-900/50 text-gray-400 hover:bg-green-100 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      {status.name}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Erótico y Demografía */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Erótico */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3 ml-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Erótico</h4>
                                  </div>
                                  <div className="flex gap-2">
                                    {currentFilters.erotic.map(option => (
                                      <button
                                        key={option.id}
                                        onClick={() => setSelectedErotic(selectedErotic === option.value ? '' : option.value)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                          selectedErotic === option.value
                                            ? 'bg-red-500 text-white shadow-lg'
                                            : 'bg-white/50 dark:bg-gray-900/50 text-gray-400 hover:bg-red-100 dark:hover:bg-gray-800'
                                        }`}
                                      >
                                        {option.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Demografía */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3 ml-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Demografía</h4>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {currentFilters.demographics.map(demo => (
                                      <button
                                        key={demo.id}
                                        onClick={() => setSelectedDemographic(selectedDemographic === demo.value ? '' : demo.value)}
                                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                          selectedDemographic === demo.value
                                            ? 'bg-yellow-500 text-white shadow-lg'
                                            : 'bg-white/50 dark:bg-gray-900/50 text-gray-400 hover:bg-yellow-100 dark:hover:bg-gray-800'
                                        }`}
                                      >
                                        {demo.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Ordenar */}
                              <div>
                                <div className="flex items-center gap-2 mb-3 ml-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Ordenar</h4>
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={selectedSortBy}
                                    onChange={(e) => setSelectedSortBy(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                  >
                                    <option value="">Criterio...</option>
                                    {currentFilters.sortBy.map(sort => (
                                      <option key={sort.id} value={sort.value}>
                                        {sort.name}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    value={selectedSortOrder}
                                    onChange={(e) => setSelectedSortOrder(e.target.value)}
                                    className="px-3 py-2 rounded-lg text-xs font-bold bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                  >
                                    <option value="">Orden...</option>
                                    {currentFilters.sortOrder.map(order => (
                                      <option key={order.id} value={order.value}>
                                        {order.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button
                              onClick={clearFilters}
                              className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-red-400 transition-colors uppercase tracking-widest"
                            >
                              <RotateCcw size={14} /> Resetear Todo
                            </button>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleSearch}
                              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-potaxie-green to-teal-500 text-white rounded-2xl font-black shadow-xl shadow-potaxie-green/20 flex items-center justify-center gap-2 hover:from-green-400 hover:to-teal-400 dark:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                            >
                              Aplicar Filtros y Buscar 🔍
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-20 h-20 relative">
                      <div className="absolute inset-0 border-4 border-potaxie-green/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-potaxie-green border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(167,208,140,0.5)]" />
                      <div className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce">🥑</div>
                    </div>
                    <p className="text-potaxie-700 dark:text-potaxie-400 font-black text-lg tracking-widest animate-pulse">RASTREANDO GUSTOS... 🔍</p>
                  </div>
                )}

                <motion.div
                  layout
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
                >
                  <AnimatePresence>
                    {searchResults.map(manga => (
                      <motion.div
                        layout
                        key={manga.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ManhwaCard manga={manga} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Botones de Paginación */}
                {!loading && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 mt-8 mb-4"
                  >
                    {/* Información de resultados */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-bold text-center">
                      Mostrando {searchResults.length} manhwas en esta página
                      {hasMorePages && (
                        <span className="text-potaxie-green ml-1 block sm:inline">
                          • Continúa navegando para ver más 📚
                        </span>
                      )}
                      {!hasMorePages && currentPage > 1 && (
                        <span className="text-gray-400 ml-1 block sm:inline">
                          • Has llegado al final 🎉
                        </span>
                      )}
                    </div>
                    
                    {/* Botones de navegación */}
                    <div className="flex justify-center items-center gap-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                        currentPage === 1
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-potaxie-green hover:bg-green-600 text-white shadow-lg'
                      }`}
                    >
                      <ChevronDown className="rotate-90" size={18} />
                      Anterior
                    </motion.button>

                    <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border-2 border-potaxie-green shadow-md">
                      <span className="font-black text-potaxie-green">
                        Página {currentPage}{hasMorePages ? '+' : ''}
                      </span>
                      {hasMorePages && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          (hay más)
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToNextPage}
                      disabled={!hasMorePages}
                      className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                        !hasMorePages
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-potaxie-green hover:bg-green-600 text-white shadow-lg'
                      }`}
                    >
                      Siguiente
                      <ChevronUp className="rotate-90" size={18} />
                    </motion.button>
                    </div>
                  </motion.div>
                )}

                {!loading && searchResults.length === 0 && (searchQuery || selectedGenres.length > 0 || selectedFormats.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-10 sm:py-16 md:py-20 mt-6 sm:mt-8 md:mt-10 bg-white/30 dark:bg-gray-800/30 backdrop-blur rounded-2xl sm:rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 px-4"
                  >
                    <span className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6 block animate-bounce">💅</span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">¡Tiesa! Nada por aquí</h3>
                    <p className="text-gray-400 mt-2 font-medium text-sm sm:text-base">Prueba combinando otros géneros o menos filtros, semillita.</p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                      <button
                        onClick={clearFilters}
                        className="px-5 sm:px-8 py-3 sm:py-4 bg-white dark:bg-gray-900 text-potaxie-green border-2 border-potaxie-green rounded-full font-black hover:bg-potaxie-green hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <RotateCcw size={16} /> Resetear Todo 🥑
                      </button>
                      <button
                        onClick={() => navigateToPage('oracle')}
                        className="px-5 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full font-black hover:shadow-purple-500/50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Sparkles size={16} /> Probar suerte con el Oráculo 🔮
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {page === 'library' && (
              <div className="max-w-6xl mx-auto">
                {/* Estadísticas de Diva */}
                <div className="bg-gradient-to-br from-potaxie-cream via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 border-2 border-white dark:border-gray-800 shadow-xl overflow-hidden relative">
                  <div className="absolute -top-10 -right-10 w-32 sm:w-40 h-32 sm:h-40 bg-potaxie-green/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-10 -left-10 w-32 sm:w-40 h-32 sm:h-40 bg-purple-500/10 rounded-full blur-3xl" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                    <div className="text-center md:text-left">
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2">Mi Progreso Potaxio</h3>
                      <div className="flex items-baseline gap-2 sm:gap-3 justify-center md:justify-start">
                        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                          {library.filter(m => m.status === 'devoraste').length}
                        </span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 uppercase">Obras Devoradas ✨</span>
                      </div>
                      <p className="mt-2 sm:mt-3 text-potaxie-600 dark:text-potaxie-400 font-bold bg-potaxie-cream/50 dark:bg-purple-900/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-block border border-potaxie-100 dark:border-purple-500/10 text-xs sm:text-sm">
                        {(() => {
                          const count = library.filter(m => m.status === 'devoraste').length;
                          if (count <= 5) return "¡Empezando a devorar! 🥑";
                          if (count <= 20) return "¡Toda una experta en chisme! 💅";
                          return "¡Diva Suprema del Manhwa! 👑✨";
                        })()}
                      </p>
                    </div>

                    <div className="flex gap-6 sm:gap-4 md:gap-8">
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-2xl mb-1">🥑</span>
                        <span className="text-lg sm:text-xl font-black text-gray-700 dark:text-gray-300">{library.filter(m => m.status === 'devorando').length}</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">En Proceso</span>
                      </div>
                      <div className="w-px h-10 sm:h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-2xl mb-1">☁️</span>
                        <span className="text-lg sm:text-xl font-black text-gray-700 dark:text-gray-300">{library.filter(m => m.status === 'tiesa').length}</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">En el Limbo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 sm:gap-6 border-b border-gray-100 dark:border-gray-800 pb-4 sm:pb-6">
                  <div className="flex flex-col items-center md:items-start">
                    <h2 className="text-2xl sm:text-3xl font-black dark:text-white flex items-center gap-2 sm:gap-3 tracking-tighter">
                      Mi Santuario <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-potaxie-green animate-ping" />
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">{library.length} Manhwas Guardados</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSurprise}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 rounded-xl sm:rounded-2xl transition-all flex items-center gap-1.5 sm:gap-2 font-black text-[10px] sm:text-xs uppercase btn-premium-potaxie group relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-potaxie-green/20 pointer-events-none"
                        initial={{ scale: 0, opacity: 0 }}
                        whileTap={{
                          scale: [0, 4],
                          opacity: [0.5, 0],
                          transition: { duration: 0.5 }
                        }}
                      />
                      <Shuffle size={12} className="sm:w-[14px] sm:h-[14px] text-potaxie-green group-hover:rotate-180 transition-transform duration-700" />
                      <span className="relative z-10">Suerte Potaxio</span>
                    </motion.button>

                    <div className="relative">
                      <select
                        value={libraryFilter}
                        onChange={(e) => setLibraryFilter(e.target.value)}
                        className="appearance-none pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-black text-[10px] sm:text-xs uppercase cursor-pointer hover:border-potaxie-200 transition-colors focus:outline-none focus:ring-4 ring-potaxie-green/10"
                      >
                        <option value="all">Todas las Divas</option>
                        <option value="devorando">Devorando 🥑</option>
                        <option value="devoraste">¡Devoraste! ✨</option>
                        <option value="tiesa">En el Limbo ☁️</option>
                      </select>
                      <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {library.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 px-4">
                    <span className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 block">🥑</span>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-400">Tu biblioteca está vacía</h3>
                    <p className="text-gray-400 text-sm sm:text-base">¡Ve a buscar algo para devorar!</p>
                    <button onClick={() => navigateToPage('home')} className="mt-4 text-potaxie-green font-bold hover:underline text-sm sm:text-base">Ir al Buscador</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                    {filteredLibrary.map(manga => (
                      <ManhwaCard key={manga.id} manga={manga} inLibrary={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {page === 'oracle' && <Oracle />}
          </motion.div>
        </AnimatePresence>

        <PotaxioLuckModal
          isOpen={isLuckModalOpen}
          onClose={() => setIsLuckModalOpen(false)}
          library={library}
        />
      </main>
    </div>
  );
}

import WelcomeScreen from './components/WelcomeScreen'; // Import the new WelcomeScreen component

const App = () => {
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false); // New state to control LoadingScreen display
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
      setShowWelcomeScreen(false); // Skip welcome screen
      setShowLoadingScreen(true); // Go straight to loading animation
    } else {
      setShowWelcomeScreen(true); // Show welcome screen if no userName
    }
  }, []);

  // Effect for the loading screen after welcome or directly if userName exists
  useEffect(() => {
    if (showLoadingScreen) {
      const timer = setTimeout(() => {
        setShowLoadingScreen(false);
      }, 2000); // Simulate initial loading time
      return () => clearTimeout(timer);
    }
  }, [showLoadingScreen]);

  const handleWelcomeEnter = () => {
    setUserName(localStorage.getItem('userName')); // Get the newly set userName
    setShowWelcomeScreen(false);
    setShowLoadingScreen(true); // Trigger loading screen after welcome
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <LibraryProvider>
          <AnimatePresence mode="wait">
            {showWelcomeScreen && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <WelcomeScreen onEnter={handleWelcomeEnter} />
              </motion.div>
            )}
            {!showWelcomeScreen && showLoadingScreen && (
              <LoadingScreen key="loading" />
            )}
            {!showWelcomeScreen && !showLoadingScreen && (
              <MainApp key="app" userName={userName} /> // Pass userName to MainApp
            )}
          </AnimatePresence>
        </LibraryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;

