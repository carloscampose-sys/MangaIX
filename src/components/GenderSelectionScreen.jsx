import React, { useState, useEffect, useRef } from 'react';
import StarAnimation from './StarAnimation';
import anime from 'animejs';
import { 
  shake,
  pulse,
  ANIME_DURATIONS,
  ANIME_EASINGS,
  createTimeline 
} from '../utils/animeHelpers';

const GenderSelectionScreen = ({ onGenderSelect }) => {
  const [selectedGender, setSelectedGender] = useState(null);
  const [error, setError] = useState('');
  
  // Referencias para animaciones
  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const gridRef = useRef(null);
  const buttonRef = useRef(null);
  const genderRefs = useRef([]);

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

  const handleGenderSelect = (genderId, index) => {
    setSelectedGender(genderId);
    if (error) setError('');
    
    // Animación de selección con pulse
    if (genderRefs.current[index]) {
      // Pulse en el elemento seleccionado
      anime({
        targets: genderRefs.current[index],
        scale: [1, 1.15, 1],
        duration: 600,
        easing: ANIME_EASINGS.easeOutElastic,
      });
      
      // Animación sutil en los no seleccionados
      genderRefs.current.forEach((ref, i) => {
        if (i !== index && ref) {
          anime({
            targets: ref,
            scale: [1, 0.95, 1],
            opacity: [1, 0.6, 1],
            duration: 400,
            easing: ANIME_EASINGS.easeOutQuad,
          });
        }
      });
    }
    
    // Animar el botón de confirmar cuando se selecciona
    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        scale: [0.95, 1],
        opacity: [0.5, 1],
        duration: 400,
        easing: ANIME_EASINGS.easeOutBack,
      });
    }
  };

  const handleConfirm = () => {
    if (!selectedGender) {
      setError('¡Espera, reina! Necesitamos saber tu género para la bendición potaxie 💅');
      // Shake animation en error
      if (gridRef.current) {
        shake(gridRef.current, { duration: 500 });
      }
      return;
    }
    
    // Animación de salida
    const exitTimeline = createTimeline({ duration: ANIME_DURATIONS.medium });
    
    exitTimeline
      .add({
        targets: buttonRef.current,
        scale: [1, 1.3, 0],
        rotate: [0, 180],
        opacity: [1, 0],
        duration: 800,
        easing: ANIME_EASINGS.easeInBack,
      })
      .add({
        targets: genderRefs.current,
        scale: [1, 0],
        rotate: anime.stagger([0, 360]),
        opacity: [1, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: ANIME_EASINGS.easeInBack,
      }, '-=600')
      .add({
        targets: [titleRef.current, subtitleRef.current],
        translateY: [0, -50],
        opacity: [1, 0],
        duration: 400,
        easing: ANIME_EASINGS.easeInQuad,
      }, '-=400')
      .add({
        targets: modalRef.current,
        scale: [1, 0.8],
        opacity: [1, 0],
        duration: 400,
        easing: ANIME_EASINGS.easeInBack,
      }, '-=200');
    
    // Guardar en localStorage
    localStorage.setItem('userGender', selectedGender);
    
    setTimeout(() => {
      onGenderSelect(selectedGender);
    }, 1200);
  };

  // Animación de entrada al montar
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Timeline de entrada
    const entranceTimeline = createTimeline({ 
      easing: ANIME_EASINGS.easeOutCubic 
    });
    
    // Fade in del fondo
    entranceTimeline.add({
      targets: containerRef.current,
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
    });
    
    // Scale in del modal
    entranceTimeline.add({
      targets: modalRef.current,
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutElastic,
    }, '-=400');
    
    // Título
    entranceTimeline.add({
      targets: titleRef.current,
      translateY: [60, 0],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutCubic,
    }, '-=200');
    
    // Subtítulo
    entranceTimeline.add({
      targets: subtitleRef.current,
      translateY: [40, 0],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutCubic,
    }, '-=400');
    
    // Opciones de género con stagger desde el centro
    entranceTimeline.add({
      targets: genderRefs.current,
      scale: [0, 1],
      rotate: [180, 0],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      delay: anime.stagger(150, { from: 'center' }),
      easing: ANIME_EASINGS.easeOutElastic,
    }, '-=400');
    
    // Botón de confirmar
    entranceTimeline.add({
      targets: buttonRef.current,
      translateY: [20, 0],
      scale: [0.9, 1],
      opacity: [0, 0.5], // Empieza semi-transparente porque no hay selección
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutBack,
    }, '-=400');
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Animación de hover en opciones de género
  const handleGenderHover = (index) => {
    if (genderRefs.current[index] && selectedGender !== genderOptions[index].id) {
      anime({
        targets: genderRefs.current[index],
        scale: 1.1,
        rotate: 5,
        duration: 300,
        easing: ANIME_EASINGS.easeOutQuad,
      });
    }
  };
  
  const handleGenderLeave = (index) => {
    if (genderRefs.current[index] && selectedGender !== genderOptions[index].id) {
      anime({
        targets: genderRefs.current[index],
        scale: 1,
        rotate: 0,
        duration: 300,
        easing: ANIME_EASINGS.easeOutQuad,
      });
    }
  };
  
  // Animación de hover en botón
  const handleButtonHover = () => {
    if (selectedGender && buttonRef.current) {
      anime({
        targets: buttonRef.current,
        scale: 1.05,
        duration: 300,
        easing: ANIME_EASINGS.easeOutQuad,
      });
    }
  };
  
  const handleButtonLeave = () => {
    if (selectedGender && buttonRef.current) {
      anime({
        targets: buttonRef.current,
        scale: 1,
        duration: 300,
        easing: ANIME_EASINGS.easeOutQuad,
      });
    }
  };

  return (
    <>
      {/* Animación de estrellas en el fondo */}
      <StarAnimation />
      
      <div 
        ref={containerRef}
        className="fixed inset-0 flex items-center justify-center
                   bg-gradient-to-br from-potaxie-mint/90 to-potaxie-cream-white/90
                   p-4 z-50"
        style={{ opacity: 0 }}
      >
        <div 
          ref={modalRef}
          className="glass-modal p-8 rounded-lg shadow-xl max-w-md w-full text-center relative z-10"
          style={{ opacity: 0, transform: 'scale(0.8)' }}
        >
          <h2 
            ref={titleRef}
            className="text-3xl font-bold text-potaxie-text-light mb-2"
            style={{ opacity: 0, transform: 'translateY(60px)' }}
          >
            ¿Cuál es tu género, Potaxina?
          </h2>
          
          <p 
            ref={subtitleRef}
            className="text-potaxie-text-light mb-8 text-sm"
            style={{ opacity: 0, transform: 'translateY(40px)' }}
          >
            Esto nos ayudará a personalizarte la experiencia 🥑
          </p>

          {/* Gender Options Grid */}
          <div ref={gridRef} className="grid grid-cols-3 gap-3 mb-6">
            {genderOptions.map((option, index) => (
              <button
                key={option.id}
                ref={el => genderRefs.current[index] = el}
                onClick={() => handleGenderSelect(option.id, index)}
                onMouseEnter={() => handleGenderHover(index)}
                onMouseLeave={() => handleGenderLeave(index)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl 
                  transition-colors duration-300 ease-out
                  ${selectedGender === option.id
                    ? `${option.bgColor} text-white shadow-xl ${option.shadowColor} ring-4 ring-offset-2 ring-offset-potaxie-cream-white ${option.color}`
                    : 'bg-white/40 text-potaxie-text-light hover:bg-white/60 hover:shadow-lg border-2 border-transparent'
                  }
                `}
                style={{ opacity: 0, transform: 'scale(0) rotate(180deg)' }}
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
            <p className="text-red-500 text-sm mb-4 font-semibold animate-pulse">
              {error}
            </p>
          )}

          {/* Confirm Button */}
          <button
            ref={buttonRef}
            onClick={handleConfirm}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            disabled={!selectedGender}
            className={`
              w-full py-3 px-6 rounded-full text-white text-lg font-semibold
              transition-colors duration-300
              ${selectedGender
                ? 'bg-gradient-to-r from-potaxie-green to-potaxie-green-pastel shadow-lg cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
            style={{ opacity: 0, transform: 'translateY(20px) scale(0.9)' }}
          >
            Confirmar Género 🥑✨
          </button>
        </div>
      </div>
    </>
  );
};

export default GenderSelectionScreen;
