/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        potaxie: {
          cream: '#F0F4EF',
          green: '#A7D08C',
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
