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
          0: 'rgb(var(--color-surface-0) / <alpha-value>)',
          1: 'rgb(var(--color-surface-1) / <alpha-value>)',
          2: 'rgb(var(--color-surface-2) / <alpha-value>)',
          3: 'rgb(var(--color-surface-3) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          muted: 'var(--color-accent-muted)',
        },
        fg: {
          DEFAULT: 'rgb(var(--color-text-primary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          muted: 'var(--color-danger-muted)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          muted: 'var(--color-warning-muted)',
        },
        'on-accent': 'rgb(var(--color-on-accent) / <alpha-value>)',
        overlay: 'var(--color-overlay)',
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
        subtle: 'var(--color-border)',
      },
      boxShadow: {
        'glow-accent': 'var(--shadow-glow-accent)',
        card: 'var(--shadow-card)',
      },
      backgroundImage: {
        'hero-gradient': 'var(--hero-gradient)',
      },
    },
  },
  plugins: [],
};
