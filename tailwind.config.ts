import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a5ff',
          500: '#3182ff',
          600: '#1c63f5',
          700: '#164ee1',
          800: '#1841b6',
          900: '#1a3a8f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
