import React, { useState } from 'react';
import StarAnimation from './StarAnimation';
<<<<<<< HEAD
import anime from 'animejs/lib/anime.es.js';
import { 
  shake,
  pulse,
  ANIME_DURATIONS,
  ANIME_EASINGS,
  createTimeline 
} from '../utils/animeHelpers';
=======
>>>>>>> parent of c07bf8e (ff)

const GenderSelectionScreen = ({ userName, onGenderSelect }) => {
  const [selectedGender, setSelectedGender] = useState(null);
  const [error, setError] = useState('');

  const genderOptions = [
    {
      id: 'masculino',
      label: 'Masculino',
      image: '/gender-masculino.png',
      color: 'ring-blue-500',
      shadowColor: 'shadow-blue-500/50',
      bgColor: 'bg-blue-500'
    },
    {
      id: 'femenino',
      label: 'Femenino',
      image: '/gender-femenino.png',
      color: 'ring-pink-500',
      shadowColor: 'shadow-pink-500/50',
      bgColor: 'bg-pink-500'
    },
    {
      id: 'otro',
      label: 'Otro',
      image: '/gender-otro.png',
      color: 'ring-purple-500',
      shadowColor: 'shadow-purple-500/50',
      bgColor: 'bg-purple-500'
    }
  ];

  const handleGenderSelect = (genderId) => {
    setSelectedGender(genderId);
    if (error) setError('');
  };

  const handleConfirm = () => {
    if (!selectedGender) {
      setError('¡Espera, reina! Necesitamos saber tu género para la bendición potaxie 💅');
      return;
    }
    // Guardar en localStorage
    localStorage.setItem('userGender', selectedGender);
    onGenderSelect(selectedGender);
  };

  // Ocultar scrollbar cuando el componente está montado
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* Animación de estrellas en el fondo */}
      <StarAnimation />
      
      <div className="fixed inset-0 flex items-center justify-center
                      bg-gradient-to-br from-potaxie-mint/90 to-potaxie-cream-white/90
                      p-4 z-50 transition-opacity duration-1000"
           style={{ animation: 'fadeIn 1s ease-out forwards' }}>
        <div className="glass-modal p-8 rounded-lg shadow-xl max-w-md w-full text-center
                        transform transition-all duration-500 scale-95 opacity-0 relative z-10"
             style={{ animation: 'scaleIn 0.5s ease-out forwards 0.5s' }}>
        <h2 className="text-3xl font-bold text-potaxie-text-light mb-2">
          ¿Cuál es tu género, Potaxina?
        </h2>
        <p className="text-potaxie-text-light mb-8 text-sm">
          Esto nos ayudará a personalizarte la experiencia 🥑
        </p>

        {/* Gender Options Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {genderOptions.map(option => (
            <button
              key={option.id}
              onClick={() => handleGenderSelect(option.id)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl 
                transition-all duration-300 ease-out
                transform hover:scale-110 hover:brightness-110 active:scale-95
                ${selectedGender === option.id
                  ? `${option.bgColor} text-white shadow-xl ${option.shadowColor} scale-105 ring-4 ring-offset-2 ring-offset-potaxie-cream-white ${option.color}`
                  : 'bg-white/40 text-potaxie-text-light hover:bg-white/60 hover:shadow-lg border-2 border-transparent'
                }
              `}
            >
              <img 
                src={option.image} 
                alt={option.label}
                className={`
                  w-20 h-20 object-contain
                  transition-all duration-300
                  ${selectedGender === option.id ? 'drop-shadow-lg' : ''}
                `}
              />
              <span className="text-xs font-bold uppercase tracking-wider">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mb-4 font-semibold">{error}</p>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedGender}
          className={`
            w-full py-3 px-6 rounded-full text-white text-lg font-semibold
            transition-all duration-300 transform
            ${selectedGender
              ? 'bg-gradient-to-r from-potaxie-green to-potaxie-green-pastel shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed opacity-50'
            }
          `}
        >
          Confirmar Género 🥑✨
        </button>
      </div>
    </div>
    </>
  );
};

export default GenderSelectionScreen;
