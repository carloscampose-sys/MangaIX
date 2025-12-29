/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        potaxie: {
          cream: '#FDF5E6', // Updated to a softer, slightly greenish cream
          green: 'var(--color-primary, #A7D08C)', // Usar CSS variable
          'green-pastel': 'var(--color-primary-light, #BEE3B0)', // Usar CSS variable
          'text-light': '#4A574E', // New soft dark green-gray for light mode text
          mint: '#B0F2BC', // New: for pastel gradient
          'cream-white': '#FCF8E8', // New: for pastel gradient
          gold: '#FFD700', // New: for input focus glow
          50: '#f7f9f7',
          100: '#eff4ee',
          200: '#dbe7da',
          300: '#bcd4ba',
          400: '#96bc91',
          500: '#75a070',
          600: '#5a8156',
          700: '#496646',
          800: '#3c523a',
          900: '#324430',
        },
        // Color theme system - CSS variables
        theme: {
          primary: 'var(--color-primary, #A7D08C)',
          'primary-light': 'var(--color-primary-light, #BEE3B0)',
          'primary-dark': 'var(--color-primary-dark, #8AB870)',
          secondary: 'var(--color-secondary, #D08CA7)',
          accent: 'var(--color-accent, #8CD0A7)',
          background: 'var(--color-background, #ffffff)',
          'background-alt': 'var(--color-background-alt, #f5f5f5)',
          surface: 'var(--color-surface, #ffffff)',
          'text-primary': 'var(--color-text-primary, #1a1a1a)',
          'text-secondary': 'var(--color-text-secondary, #666666)',
          border: 'var(--color-border, #e0e0e0)',
          hover: 'var(--color-hover, #BEE3B0)',
          success: 'var(--color-success, #10b981)',
          error: 'var(--color-error, #ef4444)',
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
