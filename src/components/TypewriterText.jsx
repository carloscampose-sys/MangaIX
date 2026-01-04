import React, { useState, useEffect, useRef } from 'react';
import { isAutomatedTest } from '../utils/storage';

export const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const animationRef = useRef(null);
  let indexRef = useRef(0);

  // Si es test automatizado, mostrar texto completo inmediatamente
  if (isAutomatedTest) {
    return <span>{text}</span>;
  }

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    // Si el texto es muy corto (menos de 50 caracteres), mostrar inmediatamente
    if (text.length < 50) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText('');
    indexRef.current = 0;

    let lastTime = performance.now();
    const typingSpeed = 30; // 30ms por caracter

    const animate = () => {
      const now = performance.now();
      if (now - lastTime >= typingSpeed) {
        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayedText(text.slice(0, indexRef.current));
          lastTime = now;
          animationRef.current = requestAnimationFrame(animate);
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text]);

  return <span>{displayedText}</span>;
};
