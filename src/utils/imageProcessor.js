/**
 * Utilidades para procesar imágenes de fondo personalizadas
 */

/**
 * Convierte un archivo de imagen a base64
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - String base64 de la imagen
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Comprime una imagen para reducir su tamaño
 * @param {string} base64 - Imagen en formato base64
 * @param {number} maxWidth - Ancho máximo en píxeles
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<string>} - Imagen comprimida en base64
 */
export const compressImage = (base64, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calcular nuevas dimensiones manteniendo aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a base64 con compresión
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.onerror = (error) => reject(error);
    img.src = base64;
  });
};

/**
 * Detecta la luminosidad promedio de una imagen
 * @param {string} imageUrl - URL o base64 de la imagen
 * @returns {Promise<number>} - Luminosidad promedio (0-255)
 */
export const detectImageBrightness = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Usar una versión pequeña para análisis rápido
      canvas.width = 100;
      canvas.height = 100;
      
      ctx.drawImage(img, 0, 0, 100, 100);
      
      try {
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        let totalBrightness = 0;
        
        // Calcular luminosidad promedio usando fórmula estándar
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Fórmula de luminosidad percibida
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
          totalBrightness += brightness;
        }
        
        const avgBrightness = totalBrightness / (data.length / 4);
        resolve(avgBrightness);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => reject(error);
    img.src = imageUrl;
  });
};

/**
 * Sugiere el color de overlay según la luminosidad de la imagen
 * @param {number} brightness - Luminosidad promedio (0-255)
 * @returns {string} - 'black' o 'white'
 */
export const suggestOverlayColor = (brightness) => {
  // Si la imagen es clara (>128), usar overlay oscuro
  // Si la imagen es oscura (<=128), usar overlay claro
  return brightness > 128 ? 'black' : 'white';
};

/**
 * Valida el tamaño de un archivo de imagen
 * @param {File} file - Archivo de imagen
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {boolean} - true si el tamaño es válido
 */
export const validateImageSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Valida el tipo de archivo de imagen
 * @param {File} file - Archivo de imagen
 * @returns {boolean} - true si el tipo es válido
 */
export const validateImageType = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Calcula el tamaño estimado de una imagen base64 en MB
 * @param {string} base64 - Imagen en formato base64
 * @returns {number} - Tamaño en MB
 */
export const getBase64Size = (base64) => {
  const sizeInBytes = (base64.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
};
