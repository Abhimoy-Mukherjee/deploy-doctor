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
        dev: {
          bg: '#0B0D0F',
          surface: '#111417',
          input: '#16191D',
          border: '#252A2E',
          'border-subtle': '#1D2226',
          primary: '#E8EAED',
          secondary: '#8B9299',
          muted: '#5F666D',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Geist Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'Geist', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
