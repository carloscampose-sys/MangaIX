import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChristmasTheme } from '../context/ChristmasThemeContext';

/**
 * Configuration for particle generation
 * Defines ranges for particle properties to ensure visual variety and performance
 */
const PARTICLE_CONFIG = {
  count: {
    desktop: 50,      // Pantallas > 768px
    mobile: 30        // Pantallas <= 768px
  },
  size: {
    min: 4,           // Minimum particle size in pixels
    max: 12           // Maximum particle size in pixels
  },
  duration: {
    min: 4,           // Minimum animation duration in seconds
    max: 10           // Maximum animation duration in seconds
  },
  opacity: {
    min: 0.3,         // Minimum opacity for visibility
    max: 0.7          // Maximum opacity for better visibility
  },
  colors: [
    'rgba(190, 227, 176, 0.8)',  // potaxie-green-pastel - más opaco
    'rgba(255, 204, 128, 0.7)',  // potaxie-cream-dark - más opaco
    'rgba(201, 235, 179, 0.6)',  // potaxie-light-green - más opaco
    'rgba(230, 167, 0, 0.5)',    // potaxie-yellow - más opaco
    'rgba(163, 230, 53, 0.6)'    // verde brillante adicional
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
  
  // Check for reduced motion preference (accessibility)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log('[LightParticles] prefersReducedMotion:', prefersReducedMotion);
  
  // Even with reduced motion, show particles but with slower animations
  // The CSS will handle making them less intense
  
  // Reduce particles on mobile
  const count = window.innerWidth <= 768 
    ? PARTICLE_CONFIG.count.mobile 
    : PARTICLE_CONFIG.count.desktop;
  
  console.log('[LightParticles] Window width:', window.innerWidth, 'Count:', count);
  return count;
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

  console.log('[LightParticles] Rendering - theme:', theme, 'isChristmasMode:', isChristmasMode);

  // Memoize particles to generate them only once
  const particles = useMemo(() => {
    // Check browser support
    if (!checkBrowserSupport()) {
      console.warn('LightParticles: Browser does not support required CSS features');
      return [];
    }
    
    const count = getParticleCount();
    console.log('[LightParticles] Generating', count, 'particles');
    
    // If count is 0 (e.g., reduced motion preference), return empty array
    if (count === 0) {
      console.log('[LightParticles] Count is 0, not generating particles');
      return [];
    }
    
    try {
      const generated = generateParticles(count);
      console.log('[LightParticles] Successfully generated', generated.length, 'particles');
      return generated;
    } catch (error) {
      console.error('LightParticles: Failed to generate particles', error);
      // Fallback: generate simplified version with fewer particles
      return generateParticles(10);
    }
  }, []);

  // Only render in light mode and when christmas mode is not active
  if (theme !== 'light' || isChristmasMode) {
    console.log('[LightParticles] Not rendering - wrong theme or christmas mode');
    return null;
  }

  // Don't render if no particles were generated
  if (particles.length === 0) {
    console.log('[LightParticles] Not rendering - no particles generated');
    return null;
  }

  console.log('[LightParticles] Rendering', particles.length, 'particles');

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
