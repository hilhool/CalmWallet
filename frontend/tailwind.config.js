/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF8F5',
        card: '#F5F0EA',
        'card-warm': '#EDE6DC',
        moss: '#7B9E87',
        'moss-light': '#A8C4B0',
        'moss-dark': '#5B7E67',
        peach: '#E8A898',
        'peach-light': '#F5C5B5',
        'peach-dark': '#C87A68',
        'rose-dust': '#D4A0A8',
        muted: '#9B8E84',
        soft: '#2D2D2D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.1)',
        nav: '0 -4px 24px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        spin: 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
