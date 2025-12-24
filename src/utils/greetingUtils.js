/**
 * Get personalized greeting based on user gender
 * @param {string} gender - User gender ('masculino', 'femenino', 'otro')
 * @returns {string} Personalized greeting
 */
export const getGreeting = (gender) => {
  switch (gender) {
    case 'masculino':
      return 'Bienvenido';
    case 'femenino':
      return 'Bienvenida';
    case 'otro':
      return 'Bienvenide';
    default:
      return 'Bienvenida';
  }
};
