import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import anime from 'animejs/lib/anime.es.js';
import { 
  fadeInUp, 
  scaleInBounce, 
  shake,
  ANIME_DURATIONS,
  ANIME_EASINGS,
  createTimeline 
} from '../utils/animeHelpers';

const WelcomeScreen = ({ onEnter }) => {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Referencias para animaciones
  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  const handleInputChange = (event) => {
    setUserName(event.target.value);
    if (error) setError('');
  };

  const handleEnterClick = () => {
    if (!userName.trim()) {
      setError('¡Espera, reina! Necesitamos tu nombre para la bendición potaxie 💅');
      // Shake animation en error
      if (inputRef.current) {
        shake(inputRef.current, { duration: 500 });
      }
      return;
    }
    
    localStorage.setItem('userName', userName.trim());
    setShowConfetti(true);
    
    // Animación de salida
    const exitTimeline = createTimeline({ duration: ANIME_DURATIONS.medium });
    exitTimeline
      .add({
        targets: buttonRef.current,
        scale: [1, 1.2, 0],
        rotate: [0, 360],
        opacity: [1, 0],
        duration: 800,
        easing: ANIME_EASINGS.easeInBack,
      })
      .add({
        targets: [titleRef.current, subtitleRef.current, inputRef.current],
        translateY: [0, -50],
        opacity: [1, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: ANIME_EASINGS.easeInQuad,
      }, '-=600')
      .add({
        targets: modalRef.current,
        scale: [1, 0.8],
        opacity: [1, 0],
        duration: 400,
        easing: ANIME_EASINGS.easeInBack,
      }, '-=400');
    
    setTimeout(() => {
      onEnter();
    }, 1500);
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
    
    // Scale in del modal con bounce
    entranceTimeline.add({
      targets: modalRef.current,
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutElastic,
    }, '-=400');
    
    // Entrada secuencial de elementos
    entranceTimeline.add({
      targets: titleRef.current,
      translateY: [60, 0],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutCubic,
    }, '-=200');
    
    entranceTimeline.add({
      targets: subtitleRef.current,
      translateY: [40, 0],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutCubic,
    }, '-=400');
    
    entranceTimeline.add({
      targets: inputRef.current,
      translateY: [30, 0],
      scale: [0.95, 1],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutBack,
    }, '-=400');
    
    entranceTimeline.add({
      targets: buttonRef.current,
      translateY: [20, 0],
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: ANIME_DURATIONS.medium,
      easing: ANIME_EASINGS.easeOutElastic,
    }, '-=400');
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Animación de hover en el botón
  const handleButtonHover = () => {
    anime({
      targets: buttonRef.current,
      scale: 1.05,
      duration: 300,
      easing: ANIME_EASINGS.easeOutQuad,
    });
  };
  
  const handleButtonLeave = () => {
    anime({
      targets: buttonRef.current,
      scale: 1,
      duration: 300,
      easing: ANIME_EASINGS.easeOutQuad,
    });
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center
                 bg-gradient-to-br from-potaxie-mint to-potaxie-cream-white
                 p-4 z-50"
      style={{ opacity: 0 }}
    >
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} gravity={0.3} colors={['#FFD700', '#FFC0CB', '#B0F2BC', '#FCF8E8']} />}

      <div 
        ref={modalRef}
        className="glass-modal p-8 rounded-lg shadow-xl max-w-md w-full text-center"
        style={{ opacity: 0, transform: 'scale(0.8)' }}
      >
        <h2 
          ref={titleRef}
          className="text-3xl font-bold text-potaxie-text-light mb-6"
          style={{ opacity: 0, transform: 'translateY(60px)' }}
        >
          Bienvenida al Santuario Potaxie
        </h2>
        
        <p 
          ref={subtitleRef}
          className="text-potaxie-text-light mb-8"
          style={{ opacity: 0, transform: 'translateY(40px)' }}
        >
          ¿Cómo te llaman en el reino potaxie, diva?
        </p>

        <input
          ref={inputRef}
          type="text"
          value={userName}
          onChange={handleInputChange}
          placeholder="Tu nombre aquí..."
          className={`w-full p-3 mb-4 rounded-lg bg-white/50 border-2
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      text-potaxie-text-light placeholder-gray-500
                      ${error ? 'border-red-500' : 'border-transparent'}
                      focus:border-transparent focus:ring-gold-500`}
          style={{ opacity: 0, transform: 'translateY(30px) scale(0.95)' }}
        />
        
        {error && (
          <p className="text-red-500 text-sm mb-4 font-semibold animate-pulse">
            {error}
          </p>
        )}

        <button
          ref={buttonRef}
          onClick={handleEnterClick}
          onMouseEnter={handleButtonHover}
          onMouseLeave={handleButtonLeave}
          className="btn-premium-potaxie w-full py-3 px-6 rounded-full text-white text-lg font-semibold
                     bg-gradient-to-r from-potaxie-green to-potaxie-green-pastel
                     shadow-lg hover:shadow-xl transition-shadow duration-300
                     flex items-center justify-center gap-2"
          style={{ opacity: 0, transform: 'translateY(20px) scale(0.9)' }}
        >
          Entrar al Santuario 🥑✨
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
