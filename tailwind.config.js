/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // habilita modo oscuro manual con clase 'dark'
  theme: {
    extend: {
      colors: {
        animalia: {
          50: '#fff8e7',
          100: '#ffefc0',
          200: '#ffe294',
          300: '#ffd668',
          400: '#ffca3d',
          500: '#ffbf1f', // amarillo principal
          600: '#e6a800',
          700: '#b38400',
          800: '#806000',
          900: '#4d3a00',
        },
        naranja: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800', // naranja principal
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },
        gris: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};