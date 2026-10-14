/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#2563eb',
        'brand-cyan': '#06b6d4',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%)',
        'brand-gradient-text': 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
      },
      animation: {
        'marquee-left': 'marquee-left 40s linear infinite',
        'fade-up': 'fade-up 0.6s ease-out',
        'globe-spin': 'globe-spin 60s linear infinite',
      },
      keyframes: {
        'marquee-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'globe-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
