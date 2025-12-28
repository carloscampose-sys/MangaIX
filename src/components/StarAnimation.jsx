import React from 'react';
import { motion } from 'framer-motion';

export const StarAnimation = () => {
  // Generar 40 estrellas con propiedades aleatorias
  const stars = [...Array(40)].map((_, i) => {
    const size = Math.random() * 4 + 2; // 2-6px
    const x = Math.random() * 100; // Posición X aleatoria (0-100%)
    const y = Math.random() * 100; // Posición Y aleatoria (0-100%)
    const duration = Math.random() * 2 + 1.5; // Duración del parpadeo (1.5-3.5s)
    const delay = Math.random() * 3; // Delay inicial (0-3s)
    const opacity = Math.random() * 0.5 + 0.3; // Opacidad base (0.3-0.8)
    
    // Colores: blanco, amarillo claro, dorado suave
    const colors = [
      'rgba(255, 255, 255, 1)', // Blanco
      'rgba(255, 255, 200, 1)', // Amarillo claro
      'rgba(255, 223, 150, 1)', // Dorado suave
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      id: i,
      size,
      x,
      y,
      duration,
      delay,
      opacity,
      color,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.x}%`,
            top: `${star.y}%`,
            background: `radial-gradient(circle, ${star.color} 0%, ${star.color.replace('1)', '0.6)')} 50%, transparent 100%)`,
            boxShadow: `0 0 ${star.size * 2}px ${star.color.replace('1)', '0.5)')}`,
          }}
          animate={{
            opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default StarAnimation;
