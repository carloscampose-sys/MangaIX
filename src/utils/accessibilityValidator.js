import chroma from 'chroma-js';

/**
 * AccessibilityValidator
 * Valida que los colores cumplan con estándares de accesibilidad WCAG
 * Proporciona métodos para verificar y ajustar contrastes
 */
class AccessibilityValidator {
  /**
   * Calcula el ratio de contraste entre dos colores
   * @param {string} foreground - Color de primer plano
   * @param {string} background - Color de fondo
   * @returns {number} Ratio de contraste (1-21)
   */
  getContrastRatio(foreground, background) {
    try {
      const fg = chroma(foreground);
      const bg = chroma(background);
      return chroma.contrast(fg, bg);
    } catch (error) {
      console.error('[AccessibilityValidator] Error calculating contrast:', error);
      return 0;
    }
  }

  /**
   * Verifica si el contraste cumple con WCAG AA (4.5:1 para texto normal)
   * @param {string} foreground - Color de primer plano
   * @param {string} background - Color de fondo
   * @returns {boolean} True si cumple con WCAG AA
   */
  meetsWCAG_AA(foreground, background) {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }

  /**
   * Verifica si el contraste cumple con WCAG AAA (7:1 para texto normal)
   * @param {string} foreground - Color de primer plano
   * @param {string} background - Color de fondo
   * @returns {boolean} True si cumple con WCAG AAA
   */
  meetsWCAG_AAA(foreground, background) {
    return this.getContrastRatio(foreground, background) >= 7.0;
  }

  /**
   * Ajusta el color de texto para cumplir con WCAG AA
   * @param {string} textColor - Color de texto inicial
   * @param {string} backgroundColor - Color de fondo
   * @returns {string} Color de texto ajustado en formato hex
   */
  adjustTextColorForContrast(textColor, backgroundColor) {
    try {
      let adjusted = chroma(textColor);
      const bg = chroma(backgroundColor);
      let ratio = chroma.contrast(adjusted, bg);
      
      // Si ya cumple, retornar
      if (ratio >= 4.5) return adjusted.hex();
      
      // Intentar oscurecer o aclarar hasta cumplir
      const isDarkBg = bg.luminance() < 0.5;
      let iterations = 0;
      const maxIterations = 20;
      
      while (ratio < 4.5 && iterations < maxIterations) {
        adjusted = isDarkBg ? adjusted.brighten(0.2) : adjusted.darken(0.2);
        ratio = chroma.contrast(adjusted, bg);
        iterations++;
      }
      
      // Si no se logra, usar blanco o negro
      if (ratio < 4.5) {
        return isDarkBg ? '#ffffff' : '#000000';
      }
      
      return adjusted.hex();
    } catch (error) {
      console.error('[AccessibilityValidator] Error adjusting text color:', error);
      // Fallback seguro
      return chroma(backgroundColor).luminance() < 0.5 ? '#ffffff' : '#000000';
    }
  }

  /**
   * Valida toda una paleta de colores
   * @param {Object} palette - Paleta de colores a validar
   * @returns {Object} Resultado de validación con issues encontrados
   */
  validatePalette(palette) {
    const issues = [];
    
    // Validar texto primario sobre fondo
    if (!this.meetsWCAG_AA(palette.textPrimary, palette.background)) {
      issues.push({
        type: 'contrast',
        severity: 'high',
        message: 'Text primary does not meet WCAG AA on background',
        colors: [palette.textPrimary, palette.background],
        ratio: this.getContrastRatio(palette.textPrimary, palette.background)
      });
    }
    
    // Validar texto secundario sobre fondo
    if (!this.meetsWCAG_AA(palette.textSecondary, palette.background)) {
      issues.push({
        type: 'contrast',
        severity: 'medium',
        message: 'Text secondary does not meet WCAG AA on background',
        colors: [palette.textSecondary, palette.background],
        ratio: this.getContrastRatio(palette.textSecondary, palette.background)
      });
    }
    
    // Validar primario sobre fondo (para botones)
    const primaryContrast = this.getContrastRatio(palette.primary, palette.background);
    if (primaryContrast < 3.0) {
      issues.push({
        type: 'contrast',
        severity: 'medium',
        message: 'Primary color has low contrast with background',
        colors: [palette.primary, palette.background],
        ratio: primaryContrast
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Exportar instancia única (singleton)
export default new AccessibilityValidator();
