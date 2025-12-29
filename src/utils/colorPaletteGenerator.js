import chroma from 'chroma-js';

/**
 * ColorPaletteGenerator
 * Genera paletas de colores armoniosas a partir de un color base
 * Utiliza teoría del color para crear combinaciones coherentes
 */
class ColorPaletteGenerator {
  /**
   * Genera una paleta completa a partir de un color base
   * @param {string} baseColor - Color en formato hex, rgb, o hsl
   * @returns {Object} Paleta de colores con todas las variantes necesarias
   */
  generatePalette(baseColor) {
    try {
      const base = chroma(baseColor);
      
      // Usar el fondo original de la página (crema claro)
      const defaultBackground = '#FDF5E6';
      const defaultBackgroundAlt = '#f5f5f5';
      
      return {
        primary: base.hex(),
        primaryLight: base.brighten(1).hex(),
        primaryDark: base.darken(1).hex(),
        secondary: this.getComplementary(base).hex(),
        accent: this.getTriadic(base)[0].hex(),
        background: defaultBackground,
        backgroundAlt: defaultBackgroundAlt,
        surface: '#ffffff',
        textPrimary: '#1a1a1a',
        textSecondary: '#666666',
        border: base.set('hsl.l', 0.85).desaturate(1).hex(),
        hover: base.brighten(0.5).hex(),
        success: '#10b981',
        error: '#ef4444'
      };
    } catch (error) {
      console.error('[ColorPaletteGenerator] Error generating palette:', error);
      throw new Error(`Invalid color format: ${baseColor}`);
    }
  }

  /**
   * Obtiene el color complementario (180° en el círculo cromático)
   * @param {chroma.Color} color - Color base
   * @returns {chroma.Color} Color complementario
   */
  getComplementary(color) {
    const [h, s, l] = color.hsl();
    return chroma.hsl((h + 180) % 360, s, l);
  }

  /**
   * Obtiene colores triádicos (120° de separación)
   * @param {chroma.Color} color - Color base
   * @returns {Array<chroma.Color>} Array con dos colores triádicos
   */
  getTriadic(color) {
    const [h, s, l] = color.hsl();
    return [
      chroma.hsl((h + 120) % 360, s, l),
      chroma.hsl((h + 240) % 360, s, l)
    ];
  }

  /**
   * Genera escala de tonos (shades) del color
   * @param {string} color - Color base
   * @param {number} steps - Número de pasos en la escala
   * @returns {Array<string>} Array de colores en formato hex
   */
  generateShades(color, steps = 5) {
    return chroma.scale([color, 'black'])
      .mode('lab')
      .colors(steps);
  }

  /**
   * Genera escala de tintes (tints) del color
   * @param {string} color - Color base
   * @param {number} steps - Número de pasos en la escala
   * @returns {Array<string>} Array de colores en formato hex
   */
  generateTints(color, steps = 5) {
    return chroma.scale([color, 'white'])
      .mode('lab')
      .colors(steps);
  }
}

// Exportar instancia única (singleton)
export default new ColorPaletteGenerator();
