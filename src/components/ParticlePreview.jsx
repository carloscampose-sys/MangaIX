import React from 'react';
import { motion } from 'framer-motion';

export const ParticlePreview = ({ particleType, colors, isCompact = false }) => {
  const previewSize = isCompact ? 60 : 100;
  const containerSize = isCompact ? 80 : 120;

  if (particleType === 'none') {
    return (
      <div 
        className={`rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}
        style={{ width: containerSize, height: containerSize }}
      >
        <span className="text-gray-400 text-2xl">🚫</span>
      </div>
    );
  }

  if (particleType === 'snow') {
    return (
      <div 
        className={`rounded-xl overflow-hidden relative bg-gray-900`}
        style={{ width: containerSize, height: containerSize }}
      >
        {[...Array(3)].map((_, i) => {
          const size = Math.random() * 8 + 4;
          const duration = Math.random() * 3 + 2;
          const delay = Math.random() * 2;
          const startX = Math.random() * 80 + 10;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${startX}%`,
                top: '-10px',
                background: `radial-gradient(circle, ${colors?.primary || '#ffffff'} 0%, rgba(255, 255, 255, 0.6) 100%)`,
                boxShadow: `0 0 ${size * 2}px ${colors?.glow || 'rgba(255, 255, 255, 0.8)'}`,
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: ['0vw', '20vw'],
                opacity: [0, 1, 1, 0],
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
  }

  if (particleType === 'stars') {
    return (
      <div 
        className={`rounded-xl overflow-hidden relative bg-gray-900`}
        style={{ width: containerSize, height: containerSize }}
      >
        {[...Array(4)].map((_, i) => {
          const size = Math.random() * 4 + 3;
          const x = Math.random() * 80 + 10;
          const y = Math.random() * 80 + 10;
          const duration = Math.random() * 1.5 + 1;
          const delay = Math.random() * 2;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                background: colors?.primary || 'rgba(255, 255, 255, 1)',
                boxShadow: `0 0 ${size * 3}px ${colors?.glow || 'rgba(255, 255, 255, 0.6)'}`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>
    );
  }

  if (particleType === 'light-particles') {
    return (
      <div 
        className={`rounded-xl overflow-hidden relative bg-gray-50`}
        style={{ width: containerSize, height: containerSize }}
      >
        {[...Array(3)].map((_, i) => {
          const size = Math.random() * 8 + 6;
          const x = Math.random() * 70 + 15;
          const y = Math.random() * 70 + 15;
          const duration = Math.random() * 4 + 3;
          const delay = Math.random() * 2;
          const opacity = Math.random() * 0.4 + 0.6;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                opacity: opacity,
                backgroundColor: colors?.primary || 'rgba(190, 227, 176, 0.9)',
                boxShadow: `0 0 ${size * 2}px ${colors?.glow || 'rgba(255, 204, 128, 0.7)'}`,
              }}
              animate={{
                y: [0, -10, 0],
                x: [0, 5, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>
    );
  }

  if (particleType === 'hearts') {
    return (
      <div 
        className={`rounded-xl overflow-hidden relative bg-gray-900`}
        style={{ width: containerSize, height: containerSize }}
      >
        {[...Array(4)].map((_, i) => {
          const size = Math.random() * 6 + 8;
          const x = Math.random() * 70 + 15;
          const y = Math.random() * 70 + 15;
          const duration = Math.random() * 3 + 2;
          const delay = Math.random() * 2;
          const opacity = Math.random() * 0.4 + 0.5;
          
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                opacity: opacity,
              }}
              animate={{
                y: [0, -15, 0],
                x: [0, 5, 0],
                scale: [1, 1.15, 1],
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
                fill={colors?.primary || '#ff6b9d'}
                style={{
                  filter: `drop-shadow(0 0 ${size}px ${colors?.glow || 'rgba(255, 107, 157, 0.6)'})`,
                }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </motion.svg>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return null;
};
