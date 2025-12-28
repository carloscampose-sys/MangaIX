import { useRef, useEffect } from 'react';
import anime from 'animejs';

export const SnowEffect = () => {
  const containerRef = useRef(null);
  const snowflakesRef = useRef([]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Generar copos de nieve
    const snowflakes = [];
    const count = 80;
    
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 6 + 3;
      const startX = Math.random() * 100;
      const duration = Math.random() * 4 + 6;
      const delay = Math.random() * 8;
      
      // Crear elemento de copo de nieve
      const snowflake = document.createElement('div');
      snowflake.className = 'absolute rounded-full';
      snowflake.style.width = `${size}px`;
      snowflake.style.height = `${size}px`;
      snowflake.style.left = `${startX}%`;
      snowflake.style.top = '-10px';
      snowflake.style.background = 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 100%)';
      snowflake.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
      
      containerRef.current.appendChild(snowflake);
      snowflakes.push(snowflake);
      
      // Animación con anime.js - trayectoria más natural con viento
      const windStrength = (Math.random() - 0.5) * 40; // Viento variable
      const swayAmount = Math.random() * 20 + 10; // Balanceo lateral
      
      anime({
        targets: snowflake,
        translateY: [0, window.innerHeight + 20],
        translateX: [
          { value: windStrength * 0.3, duration: duration * 250 },
          { value: windStrength * 0.6 + swayAmount, duration: duration * 250 },
          { value: windStrength * 0.9, duration: duration * 250 },
          { value: windStrength, duration: duration * 250 }
        ],
        opacity: [
          { value: 0, duration: 0 },
          { value: 1, duration: duration * 100 },
          { value: 1, duration: duration * 700 },
          { value: 0.8, duration: duration * 100 },
          { value: 0, duration: duration * 100 }
        ],
        rotate: [0, 360 + Math.random() * 360], // Rotación variable
        scale: [
          { value: 1, duration: duration * 500 },
          { value: 0.8 + Math.random() * 0.4, duration: duration * 500 }
        ],
        duration: duration * 1000,
        delay: delay * 1000,
        easing: 'linear',
        loop: true,
      });
    }
    
    snowflakesRef.current = snowflakes;
    
    // Limpieza
    return () => {
      snowflakes.forEach(snowflake => {
        if (snowflake.parentNode) {
          snowflake.parentNode.removeChild(snowflake);
        }
      });
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};
