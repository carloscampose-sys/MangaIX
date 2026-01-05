import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const ParticlePreview = ({ particleType, colors, isCompact = false }) => {
  const previewSize = isCompact ? 60 : 100;
  const containerSize = isCompact ? 80 : 120;

  // Generar valores aleatorios estables que no cambien en cada render
  const particleData = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      size: Math.random() * 8 + 4,
      duration: Math.random() * 4 + 4,
      delay: Math.random() * 2,
      startX: Math.random() * 80 + 10,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      opacity: Math.random() * 0.4 + 0.5,
    }));
  }, [particleType]);

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
        {particleData.slice(0, 3).map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.startX}%`,
              top: '-10px',
              background: `radial-gradient(circle, ${colors?.primary || '#ffffff'} 0%, rgba(255, 255, 255, 0.6) 100%)`,
              boxShadow: `0 0 ${particle.size * 2}px ${colors?.glow || 'rgba(255, 255, 255, 0.8)'}`,
            }}
            animate={{
              y: [0, containerSize + 20],
              x: [0, 20],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    );
  }

  if (particleType === 'stars') {
    return (
      <div
        className={`rounded-xl overflow-hidden relative bg-gray-900`}
        style={{ width: containerSize, height: containerSize }}
      >
        {particleData.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${particle.size * 0.5}px`,
              height: `${particle.size * 0.5}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              background: colors?.primary || 'rgba(255, 255, 255, 1)',
              boxShadow: `0 0 ${particle.size * 1.5}px ${colors?.glow || 'rgba(255, 255, 255, 0.6)'}`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration * 0.5,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (particleType === 'light-particles') {
    return (
      <div
        className={`rounded-xl overflow-hidden relative bg-gray-50`}
        style={{ width: containerSize, height: containerSize }}
      >
        {particleData.slice(0, 3).map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${particle.size + 2}px`,
              height: `${particle.size + 2}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity + 0.1,
              backgroundColor: colors?.primary || 'rgba(190, 227, 176, 0.9)',
              boxShadow: `0 0 ${particle.size * 2}px ${colors?.glow || 'rgba(255, 204, 128, 0.7)'}`,
            }}
            animate={{
              y: [0, -10, 0],
              x: [0, 5, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (particleType === 'hearts') {
    return (
      <div
        className={`rounded-xl overflow-hidden relative bg-gray-900`}
        style={{ width: containerSize, height: containerSize }}
      >
        {particleData.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: `${particle.size + 4}px`,
              height: `${particle.size + 4}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, 5, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: particle.duration * 0.75,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          >
            <motion.svg
              viewBox="0 0 24 24"
              fill={colors?.primary || '#ff6b9d'}
              style={{
                filter: `drop-shadow(0 0 ${particle.size}px ${colors?.glow || 'rgba(255, 107, 157, 0.6)'})`,
              }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </motion.svg>
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
};
