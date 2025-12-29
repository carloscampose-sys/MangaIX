/**
 * ThemeApplier
 * Aplica paletas de colores al DOM mediante CSS Variables
 * Gestiona transiciones suaves entre temas
 */
class ThemeApplier {
  /**
   * Aplica la paleta de colores al DOM mediante CSS Variables
   * @param {Object} palette - Paleta de colores a aplicar
   */
  applyTheme(palette) {
    try {
      const root = document.documentElement;
      
      console.log('[ThemeApplier] Aplicando tema:', palette);
      
      // Aplicar cada color como CSS variable
      root.style.setProperty('--color-primary', palette.primary);
      root.style.setProperty('--color-primary-light', palette.primaryLight);
      root.style.setProperty('--color-primary-dark', palette.primaryDark);
      root.style.setProperty('--color-secondary', palette.secondary);
      root.style.setProperty('--color-accent', palette.accent);
      root.style.setProperty('--color-background', palette.background);
      root.style.setProperty('--color-background-alt', palette.backgroundAlt);
      root.style.setProperty('--color-surface', palette.surface);
      root.style.setProperty('--color-text-primary', palette.textPrimary);
      root.style.setProperty('--color-text-secondary', palette.textSecondary);
      root.style.setProperty('--color-border', palette.border);
      root.style.setProperty('--color-hover', palette.hover);
      root.style.setProperty('--color-success', palette.success);
      root.style.setProperty('--color-error', palette.error);
      
      // Agregar clase para transiciones suaves
      root.classList.add('theme-transitioning');
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 500);
      
      console.log('[ThemeApplier] ✅ Tema aplicado exitosamente');
      console.log('[ThemeApplier] Color primario:', palette.primary);
    } catch (error) {
      console.error('[ThemeApplier] ❌ Error aplicando tema:', error);
      throw error;
    }
  }

  /**
   * Obtiene los valores actuales de las CSS Variables
   * @returns {Object} Objeto con todos los colores actuales
   */
  getCurrentTheme() {
    try {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      return {
        primary: style.getPropertyValue('--color-primary').trim(),
        primaryLight: style.getPropertyValue('--color-primary-light').trim(),
        primaryDark: style.getPropertyValue('--color-primary-dark').trim(),
        secondary: style.getPropertyValue('--color-secondary').trim(),
        accent: style.getPropertyValue('--color-accent').trim(),
        background: style.getPropertyValue('--color-background').trim(),
        backgroundAlt: style.getPropertyValue('--color-background-alt').trim(),
        surface: style.getPropertyValue('--color-surface').trim(),
        textPrimary: style.getPropertyValue('--color-text-primary').trim(),
        textSecondary: style.getPropertyValue('--color-text-secondary').trim(),
        border: style.getPropertyValue('--color-border').trim(),
        hover: style.getPropertyValue('--color-hover').trim(),
        success: style.getPropertyValue('--color-success').trim(),
        error: style.getPropertyValue('--color-error').trim()
      };
    } catch (error) {
      console.error('[ThemeApplier] Error getting current theme:', error);
      return null;
    }
  }
}

// Exportar instancia única (singleton)
export default new ThemeApplier();
