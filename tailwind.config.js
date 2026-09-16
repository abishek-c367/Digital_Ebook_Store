/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f6f6f4',
          100: '#e9e8e3',
          200: '#d3d1c9',
          300: '#b3b0a4',
          400: '#8e8b7c',
          500: '#73706a',
          600: '#5d5b58',
          700: '#4a4847',
          800: '#3d3b3a',
          900: '#2a2929',
          950: '#1a1918',
        },
        gold: {
          50: '#fbf8f0',
          100: '#f5ecd7',
          200: '#ebd9b0',
          300: '#dcbf7a',
          400: '#cda94e',
          500: '#bf9438',
          600: '#a67a2e',
          700: '#855e28',
          800: '#6f4d28',
          900: '#5e4125',
          950: '#342313',
        },
        accent: {
          50: '#f0f4f1',
          100: '#dde8e1',
          200: '#bcd2c6',
          300: '#90b3a2',
          400: '#638e7c',
          500: '#45705d',
          600: '#34594a',
          700: '#2a473c',
          800: '#243a32',
          900: '#1f312b',
          950: '#11201b',
        },
      },
      letterSpacing: {
        'editorial': '0.04em',
        'wide-lg': '0.1em',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'book': '0 8px 30px -8px rgba(0,0,0,0.25), 0 2px 8px -2px rgba(0,0,0,0.15)',
        'book-hover': '0 20px 50px -12px rgba(0,0,0,0.35), 0 4px 16px -4px rgba(0,0,0,0.2)',
        'elegant': '0 2px 20px -4px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
