import React from 'react';
import { motion } from 'framer-motion';

export const SnowEffect = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {[...Array(50)].map((_, i) => {
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 3 + 5;
        const delay = Math.random() * 5;
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 20 - 10);
        
        return (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full opacity-80"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${startX}%`,
              top: '-10px',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [`0vw`, `${endX - startX}vw`],
              opacity: [0, 0.8, 0.8, 0],
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
