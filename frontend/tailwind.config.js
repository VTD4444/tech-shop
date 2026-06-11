/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          0: '#0A0A0A',
          1: '#12151A',
          2: '#1A1D21',
          3: '#242830',
        },
        accent: {
          DEFAULT: '#00E5C3',
          hover: '#46D9B1',
          muted: 'rgba(0, 229, 195, 0.15)',
        },
        text: {
          primary: '#FFFFFF',
          muted: '#94A3B8',
        },
        danger: {
          DEFAULT: '#EF4444',
          muted: 'rgba(239, 68, 68, 0.15)',
        },
        warning: {
          DEFAULT: '#F97316',
          muted: 'rgba(249, 115, 22, 0.15)',
        },
        // Legacy alias for gradual migration
        primary: {
          50: '#ecfdf8',
          100: '#d1faf0',
          200: '#a7f3e1',
          300: '#6ee7cb',
          400: '#46d9b1',
          500: '#00e5c3',
          600: '#00c4a7',
          700: '#009d86',
          800: '#007d6b',
          900: '#006657',
        },
      },
      borderColor: {
        subtle: 'rgba(255, 255, 255, 0.08)',
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(0, 229, 195, 0.35)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(0,229,195,0.08) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
};
