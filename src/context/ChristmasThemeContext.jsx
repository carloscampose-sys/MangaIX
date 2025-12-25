import React, { createContext, useContext, useState, useEffect } from 'react';

const ChristmasThemeContext = createContext();

export const useChristmasTheme = () => {
  const context = useContext(ChristmasThemeContext);
  if (!context) {
    throw new Error('useChristmasTheme must be used within ChristmasThemeProvider');
  }
  return context;
};

export const ChristmasThemeProvider = ({ children }) => {
  const [isChristmasMode, setIsChristmasMode] = useState(() => {
    const saved = localStorage.getItem('christmasMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('christmasMode', isChristmasMode);
    
    // Agregar o remover clase del body
    if (isChristmasMode) {
      document.body.classList.add('christmas-mode');
    } else {
      document.body.classList.remove('christmas-mode');
    }
  }, [isChristmasMode]);

  const toggleChristmasMode = () => {
    setIsChristmasMode(prev => !prev);
  };

  return (
    <ChristmasThemeContext.Provider value={{ isChristmasMode, toggleChristmasMode }}>
      {children}
    </ChristmasThemeContext.Provider>
  );
};
