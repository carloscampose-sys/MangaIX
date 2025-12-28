import { useRef, useEffect } from 'react';
import anime from 'animejs/lib/anime.es.js';

export const StarAnimation = () => {
  const containerRef = useRef(null);
  const starsRef = useRef([]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const stars = [];
    const count = 100;
    
    // Colores variados
    const colors = [
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 220, 1)',
      'rgba(255, 240, 180, 1)',
      'rgba(255, 223, 150, 1)',
      'rgba(200, 220, 255, 1)',
    ];
    
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 6 + 3;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = Math.random() * 1500 + 1000;
      const delay = Math.random() * 3000;
      const opacity = Math.random() * 0.6 + 0.4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isCircle = Math.random() > 0.3;
      const moveX = (Math.random() - 0.5) * 40;
      const moveY = (Math.random() - 0.5) * 40;
      
      // Crear contenedor de estrella
      const starContainer = document.createElement('div');
      starContainer.className = 'absolute';
      starContainer.style.width = `${size}px`;
      starContainer.style.height = `${size}px`;
      starContainer.style.left = `${x}%`;
      starContainer.style.top = `${y}%`;
      
      // Crear estrella
      const star = document.createElement('div');
      star.className = 'w-full h-full';
      
      if (isCircle) {
        star.className += ' rounded-full';
        star.style.background = `radial-gradient(circle, ${color} 0%, ${color.replace('1)', '0.6)')} 40%, transparent 70%)`;
        star.style.boxShadow = `0 0 ${size * 3}px ${color.replace('1)', '0.8)')}, 0 0 ${size * 1.5}px ${color.replace('1)', '0.5)')}`;
      } else {
        star.style.background = color;
        star.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        star.style.filter = `drop-shadow(0 0 ${size * 2}px ${color.replace('1)', '0.8)')}) drop-shadow(0 0 ${size}px ${color.replace('1)', '0.6)')})`;
      }
      
      starContainer.appendChild(star);
      containerRef.current.appendChild(starContainer);
      stars.push(starContainer);
      
      // Animación con anime.js - twinkle más realista
      anime({
        targets: starContainer,
        opacity: [
          { value: opacity * 0.2, duration: duration * 0.3 },
          { value: opacity, duration: duration * 0.2 },
          { value: opacity * 0.5, duration: duration * 0.3 },
          { value: opacity, duration: duration * 0.2 }
        ],
        scale: [
          { value: 1, duration: duration * 0.4 },
          { value: 1.5, duration: duration * 0.2 },
          { value: 1.2, duration: duration * 0.2 },
          { value: 1, duration: duration * 0.2 }
        ],
        translateX: [
          { value: 0, duration: duration * 0.5 },
          { value: moveX, duration: duration * 0.5 }
        ],
        translateY: [
          { value: 0, duration: duration * 0.5 },
          { value: moveY, duration: duration * 0.5 }
        ],
        duration: duration,
        delay: delay,
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
      });
      
      // Ocasionalmente crear estrellas fugaces
      if (Math.random() > 0.95) {
        setTimeout(() => {
          createShootingStar(containerRef.current);
        }, delay + Math.random() * 10000);
      }
    }
    
    starsRef.current = stars;
    
    // Limpieza
    return () => {
      stars.forEach(star => {
        if (star.parentNode) {
          star.parentNode.removeChild(star);
        }
      });
    };
  }, []);
  
  // Función para crear estrellas fugaces
  const createShootingStar = (container) => {
    if (!container) return;
    
    const shootingStar = document.createElement('div');
    shootingStar.className = 'absolute';
    
    const startX = Math.random() * 50 + 25; // 25-75%
    const startY = Math.random() * 30; // 0-30%
    const angle = Math.random() * 45 + 30; // 30-75 grados
    const distance = Math.random() * 300 + 200;
    
    shootingStar.style.left = `${startX}%`;
    shootingStar.style.top = `${startY}%`;
    shootingStar.style.width = '3px';
    shootingStar.style.height = '3px';
    shootingStar.style.borderRadius = '50%';
    shootingStar.style.background = 'white';
    shootingStar.style.boxShadow = '0 0 20px rgba(255, 255, 255, 1), 0 0 40px rgba(255, 255, 255, 0.8)';
    
    container.appendChild(shootingStar);
    
    // Animación de estrella fugaz
    anime({
      targets: shootingStar,
      translateX: Math.cos(angle * Math.PI / 180) * distance,
      translateY: Math.sin(angle * Math.PI / 180) * distance,
      opacity: [1, 0],
      scale: [1, 0.5],
      duration: 1500,
      easing: 'easeOutQuad',
      complete: () => {
        if (shootingStar.parentNode) {
          shootingStar.parentNode.removeChild(shootingStar);
        }
        // Crear otra estrella fugaz después de un tiempo
        if (Math.random() > 0.7) {
          setTimeout(() => createShootingStar(container), Math.random() * 15000 + 5000);
        }
      }
    });
  };
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
      aria-hidden="true"
    />
  );
};

export default StarAnimation;
