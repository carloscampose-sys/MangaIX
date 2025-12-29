import React from 'react';
import { motion } from 'framer-motion';

export const SnowEffect = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(80)].map((_, i) => {
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
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 100%)',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
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
