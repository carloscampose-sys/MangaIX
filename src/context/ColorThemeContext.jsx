import React, { createContext, useContext, useState, useEffect } from 'react';
import chroma from 'chroma-js';
import colorPaletteGenerator from '../utils/colorPaletteGenerator';
import accessibilityValidator from '../utils/accessibilityValidator';
import themeApplier from '../utils/themeApplier';

const ColorThemeContext = createContext(null);

// Color por defecto (verde potaxie)
const DEFAULT_BASE_COLOR = '#A7D08C';

// Claves para localStorage
const STORAGE_KEY = 'colorTheme';
const BACKGROUND_IMAGE_KEY = 'customBackgroundImage';
const BACKGROUND_EFFECTS_KEY = 'backgroundEffects';

/**
 * ColorThemeProvider
 * Proveedor de contexto para el sistema de temas de color personalizables
 */
export function ColorThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundImage, setBackgroundImageState] = useState(null);
  const [backgroundEffects, setBackgroundEffectsState] = useState({
    blur: 10,
    overlay: 70,
    overlayColor: 'black'
  });

  /**
   * Carga el tema desde localStorage al iniciar
   */
  const loadThemeFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Validar estructura
        if (parsed.baseColor && parsed.palette) {
          console.log('[ColorThemeContext] Theme loaded from storage:', parsed.baseColor);
          return parsed;
        }
      }
    } catch (error) {
      console.error('[ColorThemeContext] Error loading theme from storage:', error);
      // Limpiar localStorage corrupto
      localStorage.removeItem(STORAGE_KEY);
    }
    
    return null;
  };

  /**
   * Guarda el tema en localStorage
   */
  const saveThemeToStorage = (themeData) => {
    try {
      const toSave = {
        version: '1.0',
        baseColor: themeData.baseColor,
        palette: themeData.palette,
        isDark: themeData.isDark,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log('[ColorThemeContext] Theme saved to storage');
    } catch (error) {
      console.error('[ColorThemeContext] Error saving theme to storage:', error);
    }
  };

  /**
   * Establece un nuevo color base y genera la paleta
   * El fondo siempre será blanco por defecto
   */
  const setBaseColor = (color) => {
    try {
      console.log('[ColorThemeContext] Setting base color:', color);
      
      // Generar paleta (siempre con fondo blanco)
      const palette = colorPaletteGenerator.generatePalette(color);
      
      // Si hay un fondo personalizado, preservarlo
      if (theme?.customBackground) {
        console.log('[ColorThemeContext] Preserving custom background:', theme.customBackground);
        palette.background = theme.customBackground;
        palette.backgroundAlt = chroma(theme.customBackground).darken(0.1).hex();
        
        // Ajustar color de texto para mantener legibilidad
        const bgLuminance = chroma(theme.customBackground).luminance();
        palette.textPrimary = bgLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
        palette.textSecondary = bgLuminance > 0.5 ? '#666666' : '#b0b0b0';
      }
      
      // Crear objeto de tema
      const newTheme = {
        baseColor: color,
        palette,
        customBackground: theme?.customBackground || null,
        isDark: false
      };
      
      // Aplicar tema al DOM
      themeApplier.applyTheme(palette);
      
      // Actualizar estado
      setTheme(newTheme);
      
      // Guardar en localStorage
      saveThemeToStorage(newTheme);
      
      console.log('[ColorThemeContext] Theme applied successfully');
    } catch (error) {
      console.error('[ColorThemeContext] Error setting base color:', error);
      throw new Error(`Invalid color: ${color}`);
    }
  };

  /**
   * Establece un color de fondo personalizado
   */
  const setCustomBackground = (backgroundColor) => {
    try {
      console.log('[ColorThemeContext] Setting custom background:', backgroundColor);
      
      if (!theme) return;
      
      // Crear nueva paleta con fondo personalizado
      const newPalette = { ...theme.palette };
      newPalette.background = backgroundColor;
      newPalette.backgroundAlt = chroma(backgroundColor).darken(0.1).hex();
      
      // Ajustar color de texto para mantener legibilidad
      const bgLuminance = chroma(backgroundColor).luminance();
      newPalette.textPrimary = bgLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
      newPalette.textSecondary = bgLuminance > 0.5 ? '#666666' : '#b0b0b0';
      
      // Crear objeto de tema actualizado
      const newTheme = {
        ...theme,
        customBackground: backgroundColor,
        palette: newPalette
      };
      
      // Aplicar tema al DOM
      themeApplier.applyTheme(newPalette);
      
      // Actualizar estado
      setTheme(newTheme);
      
      // Guardar en localStorage
      saveThemeToStorage(newTheme);
      
      console.log('[ColorThemeContext] Custom background applied successfully');
    } catch (error) {
      console.error('[ColorThemeContext] Error setting custom background:', error);
      throw new Error(`Invalid background color: ${backgroundColor}`);
    }
  };

  /**
   * Restaura el fondo generado automáticamente
   */
  const resetCustomBackground = () => {
    if (!theme) return;
    
    console.log('[ColorThemeContext] Resetting custom background');
    
    // Regenerar paleta sin fondo personalizado
    const palette = colorPaletteGenerator.generatePalette(theme.baseColor);
    
    const newTheme = {
      ...theme,
      customBackground: null,
      palette
    };
    
    themeApplier.applyTheme(palette);
    setTheme(newTheme);
    saveThemeToStorage(newTheme);
  };

  /**
   * Restaura el tema por defecto (color base + fondo blanco)
   */
  const resetTheme = () => {
    console.log('[ColorThemeContext] Resetting to default theme');
    
    // Generar paleta por defecto (sin fondo personalizado)
    const defaultPalette = colorPaletteGenerator.generatePalette(DEFAULT_BASE_COLOR);
    
    const defaultTheme = {
      baseColor: DEFAULT_BASE_COLOR,
      palette: defaultPalette,
      customBackground: null,
      isDark: false
    };
    
    // Aplicar tema al DOM
    themeApplier.applyTheme(defaultPalette);
    
    // Actualizar estado
    setTheme(defaultTheme);
    
    // Guardar en localStorage
    saveThemeToStorage(defaultTheme);
    
    console.log('[ColorThemeContext] Theme reset to default successfully');
  };

  /**
   * Establece una imagen de fondo personalizada
   * @param {string} imageData - Imagen en formato base64
   * @param {object} effects - Efectos de legibilidad (blur, overlay, overlayColor)
   */
  const setBackgroundImage = (imageData, effects) => {
    try {
      console.log('[ColorThemeContext] Setting background image with effects:', effects);
      
      // Guardar imagen en localStorage
      localStorage.setItem(BACKGROUND_IMAGE_KEY, imageData);
      localStorage.setItem(BACKGROUND_EFFECTS_KEY, JSON.stringify(effects));
      
      // Actualizar estado
      setBackgroundImageState(imageData);
      setBackgroundEffectsState(effects);
      
      console.log('[ColorThemeContext] Background image applied successfully');
    } catch (error) {
      console.error('[ColorThemeContext] Error setting background image:', error);
      
      // Si falla por límite de localStorage, intentar con IndexedDB o mostrar error
      if (error.name === 'QuotaExceededError') {
        throw new Error('La imagen es demasiado grande. Por favor, selecciona una imagen más pequeña.');
      }
      throw error;
    }
  };

  /**
   * Elimina la imagen de fondo personalizada
   */
  const resetBackgroundImage = () => {
    console.log('[ColorThemeContext] Resetting background image');
    
    try {
      // Eliminar de localStorage
      localStorage.removeItem(BACKGROUND_IMAGE_KEY);
      localStorage.removeItem(BACKGROUND_EFFECTS_KEY);
      
      // Actualizar estado
      setBackgroundImageState(null);
      setBackgroundEffectsState({
        blur: 10,
        overlay: 70,
        overlayColor: 'black'
      });
      
      console.log('[ColorThemeContext] Background image reset successfully');
    } catch (error) {
      console.error('[ColorThemeContext] Error resetting background image:', error);
    }
  };

  /**
   * Carga la imagen de fondo desde localStorage
   */
  const loadBackgroundImageFromStorage = () => {
    try {
      const storedImage = localStorage.getItem(BACKGROUND_IMAGE_KEY);
      const storedEffects = localStorage.getItem(BACKGROUND_EFFECTS_KEY);
      
      console.log('[ColorThemeContext] 📂 Loading background from storage:', {
        hasImage: !!storedImage,
        imageLength: storedImage?.length || 0,
        hasEffects: !!storedEffects
      });
      
      if (storedImage) {
        setBackgroundImageState(storedImage);
        console.log('[ColorThemeContext] ✅ Background image loaded from storage');
      }
      
      if (storedEffects) {
        setBackgroundEffectsState(JSON.parse(storedEffects));
        console.log('[ColorThemeContext] ✅ Background effects loaded from storage');
      }
    } catch (error) {
      console.error('[ColorThemeContext] Error loading background image from storage:', error);
      // Limpiar localStorage corrupto
      localStorage.removeItem(BACKGROUND_IMAGE_KEY);
      localStorage.removeItem(BACKGROUND_EFFECTS_KEY);
    }
  };

  /**
   * Inicialización: cargar tema guardado o usar por defecto
   */
  useEffect(() => {
    console.log('[ColorThemeContext] Initializing...');
    const storedTheme = loadThemeFromStorage();
    
    // Cargar imagen de fondo si existe
    loadBackgroundImageFromStorage();
    
    if (storedTheme) {
      // Aplicar tema guardado
      console.log('[ColorThemeContext] Applying stored theme:', storedTheme.baseColor);
      themeApplier.applyTheme(storedTheme.palette);
      setTheme(storedTheme);
    } else {
      // Usar tema por defecto
      console.log('[ColorThemeContext] No stored theme, using default:', DEFAULT_BASE_COLOR);
      const defaultPalette = colorPaletteGenerator.generatePalette(DEFAULT_BASE_COLOR);
      const defaultTheme = {
        baseColor: DEFAULT_BASE_COLOR,
        palette: defaultPalette,
        isDark: false
      };
      console.log('[ColorThemeContext] Default palette generated:', defaultPalette);
      themeApplier.applyTheme(defaultPalette);
      setTheme(defaultTheme);
    }
    
    setIsLoading(false);
    console.log('[ColorThemeContext] Initialization complete');
  }, []);

  const value = {
    theme,
    setBaseColor,
    setCustomBackground,
    resetCustomBackground,
    resetTheme,
    backgroundImage,
    backgroundEffects,
    setBackgroundImage,
    resetBackgroundImage,
    isLoading
  };

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

/**
 * Hook para usar el contexto de tema de color
 */
export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within ColorThemeProvider');
  }
  return context;
}
