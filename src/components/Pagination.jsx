import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage 
}) => {
  const [maxVisible, setMaxVisible] = useState(7);

  // Ajustar número de páginas visibles según tamaño de pantalla
  useEffect(() => {
    const updateMaxVisible = () => {
      if (window.innerWidth < 640) {
        setMaxVisible(3); // Móvil: 3 páginas
      } else if (window.innerWidth < 1024) {
        setMaxVisible(5); // Tablet: 5 páginas
      } else {
        setMaxVisible(7); // Desktop: 7 páginas
      }
    };

    updateMaxVisible();
    window.addEventListener('resize', updateMaxVisible);
    return () => window.removeEventListener('resize', updateMaxVisible);
  }, []);

  // Calcular rango de items mostrados
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar números de página con ellipsis
  const generatePageNumbers = () => {
    const pages = [];
    
    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica con ellipsis
      const halfVisible = Math.floor(maxVisible / 2);
      
      // Siempre incluir primera página
      pages.push(1);
      
      // Calcular rango alrededor de página actual
      let startPage = Math.max(2, currentPage - halfVisible);
      let endPage = Math.min(totalPages - 1, currentPage + halfVisible);
      
      // Ajustar si estamos cerca del inicio o fin
      if (currentPage <= halfVisible + 1) {
        endPage = maxVisible - 1;
      } else if (currentPage >= totalPages - halfVisible) {
        startPage = totalPages - maxVisible + 2;
      }
      
      // Agregar ellipsis si es necesario
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Agregar páginas del rango
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Agregar ellipsis si es necesario
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Siempre incluir última página
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 mt-8 mb-4"
    >
      {/* Indicador de rango */}
      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold">
        Mostrando <span className="text-potaxie-green dark:text-potaxie-400">{startItem}-{endItem}</span> de <span className="text-potaxie-green dark:text-potaxie-400">{totalItems}</span> obras
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Botón Anterior */}
        <motion.button
          whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`
            flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm
            transition-all duration-200
            ${currentPage === 1
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-potaxie-green hover:text-potaxie-green shadow-sm'
            }
          `}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Anterior</span>
        </motion.button>

        {/* Números de página */}
        <div className="flex items-center gap-1 sm:gap-2">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span 
                key={`ellipsis-${index}`}
                className="px-2 text-gray-400 dark:text-gray-600 font-bold"
              >
                ...
              </span>
            ) : (
              <motion.button
                key={page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPageChange(page)}
                className={`
                  min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm
                  transition-all duration-200
                  ${currentPage === page
                    ? 'bg-potaxie-green text-white shadow-lg shadow-potaxie-green/30 scale-110'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-potaxie-green hover:text-potaxie-green'
                  }
                `}
              >
                {page}
              </motion.button>
            )
          ))}
        </div>

        {/* Botón Siguiente */}
        <motion.button
          whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`
            flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm
            transition-all duration-200
            ${currentPage === totalPages
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-potaxie-green hover:text-potaxie-green shadow-sm'
            }
          `}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
};
