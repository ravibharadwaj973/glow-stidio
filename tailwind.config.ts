import type { Config } from 'tailwindcss';

/**
 * Glow Studio's own colours — deliberately nothing like Salon OS's.
 *
 * This is the salon's website, not the software's. A customer booking a
 * haircut should never see a hint of the system behind the counter.
 */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glow: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        sand: '#faf7f2',
        ink: {
          DEFAULT: '#1c1917',
          muted: '#57534e',
          subtle: '#a8a29e',
        },
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
