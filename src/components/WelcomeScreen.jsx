import React, { useState } from 'react';
import Confetti from 'react-confetti'; // Assuming react-confetti is installed or will be.

const WelcomeScreen = ({ onEnter }) => {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleInputChange = (event) => {
    setUserName(event.target.value);
    if (error) setError('');
  };

  const handleEnterClick = () => {
    if (!userName.trim()) {
      setError('¡Espera, reina! Necesitamos tu nombre para la bendición potaxie 💅');
      return;
    }
    localStorage.setItem('userName', userName.trim());
    setShowConfetti(true);
    setTimeout(() => {
      onEnter();
    }, 1500); // Allow time for confetti and fade-out
  };

  // Ocultar scrollbar cuando el componente está montado
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center
                    bg-gradient-to-br from-potaxie-mint to-potaxie-cream-white
                    p-4 z-50 transition-opacity duration-1000" // Fade-out handled by parent
         style={{ animation: 'fadeIn 1s ease-out forwards' }}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} gravity={0.3} colors={['#FFD700', '#FFC0CB', '#B0F2BC', '#FCF8E8']} />}

      <div className="glass-modal p-8 rounded-lg shadow-xl max-w-md w-full text-center
                      transform transition-all duration-500 scale-95 opacity-0"
           style={{ animation: 'scaleIn 0.5s ease-out forwards 0.5s' }}>
        <h2 className="text-3xl font-bold text-potaxie-text-light mb-6">
          Bienvenida al Santuario Potaxie
        </h2>
        <p className="text-potaxie-text-light mb-8">
          ¿Cómo te llaman en el reino potaxie, diva?
        </p>

        <input
          type="text"
          value={userName}
          onChange={handleInputChange}
          placeholder="Tu nombre aquí..."
          className={`w-full p-3 mb-4 rounded-lg bg-white/50 border-2
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      text-potaxie-text-light placeholder-gray-500
                      ${error ? 'border-red-500' : 'border-transparent'}
                      focus:border-transparent focus:ring-gold-500`} // Gold glow on focus
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleEnterClick}
          className="btn-premium-potaxie w-full py-3 px-6 rounded-full text-white text-lg font-semibold
                     bg-gradient-to-r from-potaxie-green to-potaxie-green-pastel
                     shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
                     flex items-center justify-center gap-2"
        >
          Entrar al Santuario 🥑✨
        </button>
      </div>


    </div>
  );
};

export default WelcomeScreen;
