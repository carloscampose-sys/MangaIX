import React, { createContext, useContext, useState, useEffect } from 'react';

const ParticleSettingsContext = createContext();

export const useParticleSettings = () => {
  const context = useContext(ParticleSettingsContext);
  if (!context) {
    throw new Error('useParticleSettings must be used within ParticleSettingsProvider');
  }
  return context;
};

const DEFAULT_SETTINGS = {
  particleType: 'light-particles',
  customColors: {
    snow: {
      primary: '#ffffff',
      glow: 'rgba(255, 255, 255, 0.8)'
    },
    stars: {
      primary: 'rgba(255, 255, 255, 1)',
      glow: 'rgba(255, 255, 255, 0.6)'
    },
    lightParticles: {
      primary: 'rgba(190, 227, 176, 0.9)',
      glow: 'rgba(255, 204, 128, 0.7)'
    },
    hearts: {
      primary: '#ff6b9d',
      glow: 'rgba(255, 107, 157, 0.6)'
    }
  }
};

export const ParticleSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('particleSettings');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error('[ParticleSettingsContext] Error loading settings:', error);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [previewType, setPreviewType] = useState(settings.particleType);

  useEffect(() => {
    localStorage.setItem('particleSettings', JSON.stringify(settings));
  }, [settings]);

  const setParticleType = (type) => {
    setSettings(prev => ({ ...prev, particleType: type }));
  };

  const setParticleColors = (particleType, colors) => {
    setSettings(prev => ({
      ...prev,
      customColors: {
        ...prev.customColors,
        [particleType]: {
          ...prev.customColors[particleType],
          ...colors
        }
      }
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <ParticleSettingsContext.Provider 
      value={{ 
        settings, 
        setParticleType, 
        setParticleColors, 
        resetToDefaults,
        previewType,
        setPreviewType
      }}
    >
      {children}
    </ParticleSettingsContext.Provider>
  );
};
