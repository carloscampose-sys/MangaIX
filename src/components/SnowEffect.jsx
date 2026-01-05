import React from 'react';
import { motion } from 'framer-motion';
import { isAutomatedTest } from '../utils/storage';
import { isMobile, prefersReducedMotion } from '../utils/performance';

export const SnowEffect = ({ colors = { primary: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' } }) => {
  // DETECTAR: No renderizar en tests
  if (isAutomatedTest()) {
    return null;
  }

  // DESACTIVADO TEMPORALMENTE: No renderizar si prefiere reducir movimiento
  // if (prefersReducedMotion()) {
  //   return null;
  // }

  // DETECTAR: Reducir copos en móvil
  const snowflakeCount = isMobile() ?5 : 40;  // OPTIMIZADO: Reducido -50% en ambos

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(snowflakeCount)].map((_, i) => {
        const size = Math.random() * 6 + 3;
        const duration = Math.random() * 4 + 6;
        const delay = Math.random() * 8;
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 30 - 15);

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${startX}%`,
              top: '-10px',
              background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.primary.replace('1)', '0.8)')} 50%, ${colors.primary.replace('1)', '0.4)')} 100%)`,
              boxShadow: `0 0 10px ${colors.glow}`,
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [`0vw`, `${endX - startX}vw`],
              opacity: [0, 1, 1, 0.8, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
};
