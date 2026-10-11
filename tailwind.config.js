/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFEFA',
          100: '#FAF7F0',
          200: '#F5EFE1',
          300: '#EADFC9',
          400: '#D3C4A5',
        },
        espresso: {
          500: '#8C7462',
          600: '#6E5848',
          700: '#5C4A3E',
          800: '#423329',
          900: '#2A1E17',
        },
        'warm-border': '#E2D7C5'
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};