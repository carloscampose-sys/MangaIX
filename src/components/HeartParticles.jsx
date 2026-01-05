import React from 'react';
import { motion } from 'framer-motion';
import { isAutomatedTest } from '../utils/storage';
import { isMobile, prefersReducedMotion } from '../utils/performance';

export const HeartParticles = ({ colors = { primary: '#ff6b9d', glow: 'rgba(255, 107, 157, 0.6)' } }) => {
  if (isAutomatedTest()) {
    return null;
  }

  const heartCount = isMobile() ? 8 : 25;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(heartCount)].map((_, i) => {
        const size = Math.random() * 12 + 12;
        const duration = Math.random() * 7 + 8;
        const delay = Math.random() * 10;
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 20 - 10);

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${startX}%`,
              bottom: '-20px',
              width: `${size}px`,
              height: `${size}px`,
            }}
            animate={{
              y: ['0vh', '-120vh'],
              x: ['0vw', `${endX - startX}vw`],
              opacity: [0, 0.7, 0.7, 0.5, 0],
              rotate: [0, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: 'easeInOut',
            }}
          >
            <motion.svg
              viewBox="0 0 24 24"
              fill={colors.primary}
              style={{
                filter: `drop-shadow(0 0 ${size}px ${colors.glow}) drop-shadow(0 0 ${size / 2}px ${colors.glow.replace('0.6)', '0.4)')})`,
              }}
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: delay % 2,
                ease: 'easeInOut',
              }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </motion.svg>
          </motion.div>
        );
      })}
    </div>
  );
};
