/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0a0f1a', // Deepest background
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        brand: {
          cyan: '#22D3EE',
          cyanGlow: 'rgba(34, 211, 238, 0.15)',
          indigo: '#818CF8',
          indigoGlow: 'rgba(129, 140, 248, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyan-neon': '0 0 20px rgba(34, 211, 238, 0.2)',
        'indigo-neon': '0 0 20px rgba(129, 140, 248, 0.2)',
      }
    },
  },
  plugins: [],
}