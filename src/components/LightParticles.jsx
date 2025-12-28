import { useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChristmasTheme } from '../context/ChristmasThemeContext';
import anime from 'animejs';

const PARTICLE_CONFIG = {
  count: {
    desktop: 60,
    mobile: 35
  },
  size: {
    min: 6,
    max: 16
  },
  duration: {
    min: 6000,
    max: 12000
  },
  opacity: {
    min: 0.4,
    max: 0.85
  },
  colors: [
    'rgba(190, 227, 176, 0.9)',
    'rgba(255, 204, 128, 0.85)',
    'rgba(201, 235, 179, 0.8)',
    'rgba(230, 167, 0, 0.7)',
    'rgba(163, 230, 53, 0.75)',
    'rgba(255, 215, 0, 0.6)'
  ]
};

const getParticleCount = () => {
  if (typeof window === 'undefined') return PARTICLE_CONFIG.count.desktop;
  return window.innerWidth <= 768 
    ? PARTICLE_CONFIG.count.mobile 
    : PARTICLE_CONFIG.count.desktop;
};

const randomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const generateParticles = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: randomInRange(PARTICLE_CONFIG.size.min, PARTICLE_CONFIG.size.max),
    left: randomInRange(0, 100),
    top: randomInRange(0, 100),
    duration: randomInRange(PARTICLE_CONFIG.duration.min, PARTICLE_CONFIG.duration.max),
    delay: randomInRange(0, 5000),
    opacity: randomInRange(PARTICLE_CONFIG.opacity.min, PARTICLE_CONFIG.opacity.max),
    color: PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)]
  }));
};

export const LightParticles = () => {
  const { theme } = useTheme();
  const { isChristmasMode } = useChristmasTheme();
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const mousePosition = useRef({ x: 0, y: 0 });

  const particleData = useMemo(() => {
    const count = getParticleCount();
    if (count === 0) return [];
    
    try {
      return generateParticles(count);
    } catch (error) {
      console.error('LightParticles: Failed to generate particles', error);
      return generateParticles(10);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || particleData.length === 0) return;
    if (theme !== 'light' || isChristmasMode) return;

    const particles = [];
    
    particleData.forEach((data) => {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full';
      particle.style.width = `${data.size}px`;
      particle.style.height = `${data.size}px`;
      particle.style.left = `${data.left}%`;
      particle.style.top = `${data.top}%`;
      particle.style.backgroundColor = data.color;
      particle.style.opacity = data.opacity;
      particle.style.boxShadow = `0 0 ${data.size * 2}px ${data.color}`;
      particle.style.willChange = 'transform, opacity';
      
      containerRef.current.appendChild(particle);
      particles.push({ element: particle, data });
      
      // Animación orgánica con anime.js
      const moveX = (Math.random() - 0.5) * 100;
      const moveY = (Math.random() - 0.5) * 100;
      const rotate = Math.random() * 360;
      
      anime({
        targets: particle,
        translateX: [
          { value: moveX * 0.3, duration: data.duration * 0.25 },
          { value: moveX * 0.7, duration: data.duration * 0.25 },
          { value: moveX, duration: data.duration * 0.25 },
          { value: 0, duration: data.duration * 0.25 }
        ],
        translateY: [
          { value: moveY * 0.3, duration: data.duration * 0.25 },
          { value: moveY * 0.7, duration: data.duration * 0.25 },
          { value: moveY, duration: data.duration * 0.25 },
          { value: 0, duration: data.duration * 0.25 }
        ],
        scale: [
          { value: 1, duration: data.duration * 0.3 },
          { value: 1.3, duration: data.duration * 0.2 },
          { value: 0.9, duration: data.duration * 0.3 },
          { value: 1, duration: data.duration * 0.2 }
        ],
        opacity: [
          { value: data.opacity, duration: data.duration * 0.4 },
          { value: data.opacity * 0.6, duration: data.duration * 0.2 },
          { value: data.opacity, duration: data.duration * 0.4 }
        ],
        rotate: [0, rotate],
        duration: data.duration,
        delay: data.delay,
        easing: 'easeInOutSine',
        loop: true,
      });
    });
    
    particlesRef.current = particles;
    
    // Interacción con el cursor
    const handleMouseMove = (e) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      
      particles.forEach(({ element, data }) => {
        const rect = element.getBoundingClientRect();
        const particleX = rect.left + rect.width / 2;
        const particleY = rect.top + rect.height / 2;
        
        const dx = mousePosition.current.x - particleX;
        const dy = mousePosition.current.y - particleY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Si el cursor está cerca, alejar la partícula
        if (distance < 150) {
          const force = (150 - distance) / 150;
          const pushX = -dx * force * 0.5;
          const pushY = -dy * force * 0.5;
          
          anime({
            targets: element,
            translateX: `+=${pushX}`,
            translateY: `+=${pushY}`,
            duration: 300,
            easing: 'easeOutQuad',
          });
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Limpieza
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      particles.forEach(({ element }) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [theme, isChristmasMode, particleData]);

  if (theme !== 'light' || isChristmasMode) {
    return null;
  }

  if (particleData.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};
