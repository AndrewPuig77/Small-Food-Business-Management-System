/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{html,js,vue}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#f8f9fa',
          700: '#343a40',
          800: '#f8f9fa',
          900: '#f8f9fa',
        }
      }
    },
  },
  plugins: [],
}
