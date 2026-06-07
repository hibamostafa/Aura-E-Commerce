/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          beige: '#fcfaf7',      // Elegant silk background
          nude: '#eaddca',       // Logo background
          tan: '#d2b48c',        // Accent tan
          brown: '#5d4037',      // Aura brand brown
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}