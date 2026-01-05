import React from 'react';
import { motion } from 'framer-motion';
import { isAutomatedTest } from '../utils/storage';
import { isMobile, prefersReducedMotion } from '../utils/performance';

export const StarAnimation = ({ colors = { primary: 'rgba(255, 255, 255, 1)', glow: 'rgba(255, 255, 255, 0.6)' } }) => {
  // DETECTAR: No renderizar en tests
  if (isAutomatedTest()) {
    return null;
  }

  // DESACTIVADO TEMPORALMENTE: No renderizar si prefiere reducir movimiento
  // if (prefersReducedMotion()) {
  //   console.log('[StarAnimation] Skipping due to reduced motion preference');
  //   return null;
  // }

  // DETECTAR: Reducir estrellas en móvil
  const starCount = isMobile() ? 15 : 100;

  // Colores variados: incluye el color personalizado y variaciones
  const getStarColor = () => {
    const colorVariations = [
      colors.primary,
      colors.primary.replace('1)', '0.9)'),
      colors.primary.replace('1)', '0.8)'),
      colors.primary.replace('1)', '0.7)'),
    ];
    return colorVariations[Math.floor(Math.random() * colorVariations.length)];
  };

  // Generar estrellas con propiedades aleatorias
  const stars = [...Array(starCount)].map((_, i) => {
    const size = Math.random() * 6 + 3; // 3-9px
    const x = Math.random() * 100; // Posición X aleatoria (0-100%)
    const y = Math.random() * 100; // Posición Y aleatoria (0-100%)
    const duration = Math.random() * 1.5 + 1; // Duración del parpadeo (1-2.5s) - más rápido
    const delay = Math.random() * 3; // Delay inicial (0-3s)
    const opacity = Math.random() * 0.6 + 0.4; // Opacidad base (0.4-1.0)
    const color = getStarColor();
    
    // Tipo de estrella: círculo o estrella de 4 puntas
    const isCircle = Math.random() > 0.3; // 70% círculos, 30% estrellas
    
    // Movimiento más pronunciado
    const moveX = (Math.random() - 0.5) * 40; // -20 a 20 (más movimiento)
    const moveY = (Math.random() - 0.5) * 40; // -20 a 20 (más movimiento)
    
    return {
      id: i,
      size,
      x,
      y,
      duration,
      delay,
      opacity,
      color,
      isCircle,
      moveX,
      moveY,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{
            opacity: [star.opacity * 0.2, star.opacity, star.opacity * 0.2],
            scale: [1, 1.5, 1],
            x: [0, star.moveX, 0],
            y: [0, star.moveY, 0],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        >
          {star.isCircle ? (
            // Estrella circular con glow
            <div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle, ${star.color} 0%, ${star.color.replace('1)', '0.6)')} 40%, transparent 70%)`,
                boxShadow: `0 0 ${star.size * 3}px ${colors.glow}, 0 0 ${star.size * 1.5}px ${star.color.replace('1)', '0.5)')}`,
              }}
            />
          ) : (
            // Estrella de 4 puntas (diamante rotado)
            <div
              className="w-full h-full"
              style={{
                background: star.color,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                filter: `drop-shadow(0 0 ${star.size * 2}px ${colors.glow}) drop-shadow(0 0 ${star.size}px ${star.color.replace('1)', '0.6)')})`,
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default StarAnimation;
