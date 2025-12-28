import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChristmasTheme } from '../context/ChristmasThemeContext';

/**
 * Configuration for particle generation
 * Defines ranges for particle properties to ensure visual variety and performance
 */
const PARTICLE_CONFIG = {
  count: {
    desktop: 60,      // Aumentado para más densidad visual
    mobile: 35        // Aumentado para mobile también
  },
  size: {
    min: 6,           // Partículas más grandes
    max: 16           // Partículas más grandes
  },
  duration: {
    min: 6,           // Aumentado para animaciones más suaves
    max: 12           // Aumentado para animaciones más suaves
  },
  opacity: {
    min: 0.4,         // Más opacas para mejor visibilidad
    max: 0.85         // Más opacas para mejor visibilidad
  },
  colors: [
    'rgba(190, 227, 176, 0.9)',  // potaxie-green-pastel - muy visible
    'rgba(255, 204, 128, 0.85)', // potaxie-cream-dark - muy visible
    'rgba(201, 235, 179, 0.8)',  // potaxie-light-green - muy visible
    'rgba(230, 167, 0, 0.7)',    // potaxie-yellow - muy visible
    'rgba(163, 230, 53, 0.75)',  // verde brillante
    'rgba(255, 215, 0, 0.6)'     // dorado suave adicional
  ]
};

/**
 * Get the appropriate particle count based on screen size
 * Reduces particle count on mobile devices for better performance
 * 
 * @returns {number} Number of particles to generate
 */
const getParticleCount = () => {
  if (typeof window === 'undefined') return PARTICLE_CONFIG.count.desktop;
  
  // Reduce particles on mobile
  return window.innerWidth <= 768 
    ? PARTICLE_CONFIG.count.mobile 
    : PARTICLE_CONFIG.count.desktop;
};

/**
 * Check if browser supports required CSS features
 * 
 * @returns {boolean} True if browser supports transforms and animations
 */
const checkBrowserSupport = () => {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
  
  try {
    return CSS.supports('transform', 'translateZ(0)') && 
           CSS.supports('animation', 'float-particle 1s');
  } catch (error) {
    console.warn('Browser feature detection failed:', error);
    return false;
  }
};

/**
 * Generate a random number within a range
 * 
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random number in range
 */
const randomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Generate an array of particle objects with random properties
 * Each particle has unique size, position, duration, delay, opacity, and color
 * 
 * @param {number} count - Number of particles to generate
 * @returns {Array} Array of particle objects
 */
const generateParticles = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: randomInRange(PARTICLE_CONFIG.size.min, PARTICLE_CONFIG.size.max),
    left: `${randomInRange(0, 100)}%`,
    top: `${randomInRange(0, 100)}%`,
    duration: randomInRange(PARTICLE_CONFIG.duration.min, PARTICLE_CONFIG.duration.max),
    delay: randomInRange(0, 5),
    opacity: randomInRange(PARTICLE_CONFIG.opacity.min, PARTICLE_CONFIG.opacity.max),
    color: PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)]
  }));
};

/**
 * LightParticles Component
 * 
 * Renders animated particles in the background for light mode.
 * Particles are purely decorative and do not interfere with user interactions.
 * 
 * Features:
 * - Only renders in light mode (not in dark or christmas mode)
 * - GPU-accelerated animations using CSS transforms
 * - Responsive particle count based on screen size
 * - Accessible (aria-hidden, pointer-events: none)
 */
export const LightParticles = () => {
  const { theme } = useTheme();
  const { isChristmasMode } = useChristmasTheme();

  // Memoize particles to generate them only once
  const particles = useMemo(() => {
    // Check browser support
    if (!checkBrowserSupport()) {
      return [];
    }
    
    const count = getParticleCount();
    
    // If count is 0 (e.g., reduced motion preference), return empty array
    if (count === 0) {
      return [];
    }
    
    try {
      return generateParticles(count);
    } catch (error) {
      console.error('LightParticles: Failed to generate particles', error);
      // Fallback: generate simplified version with fewer particles
      return generateParticles(10);
    }
  }, []);

  // Only render in light mode and when christmas mode is not active
  if (theme !== 'light' || isChristmasMode) {
    return null;
  }

  // Don't render if no particles were generated
  if (particles.length === 0) {
    return null;
  }

  return (
    <div className="light-particles" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: particle.left,
            top: particle.top,
            opacity: particle.opacity,
            backgroundColor: particle.color,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  );
};
