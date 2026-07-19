/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        alabaster: '#FAF7F2',
        alabasterdark: '#F4F1EA',
        espresso: {
          DEFAULT: '#362219',
          soft: '#5C4636',
          faint: '#8A7464',
          mist: '#B8A596',
        },
        ochre: {
          DEFAULT: '#A87C53',
          soft: '#C49E74',
          faint: '#E8D9C5',
        },
        taupe: '#E5DFD5',
        highlight: '#F5E6C8',
        highlightsoft: '#FAF0DC',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'ui-serif', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(54,34,25,0.04), 0 4px 16px rgba(54,34,25,0.06)',
        lift: '0 2px 4px rgba(54,34,25,0.05), 0 12px 32px rgba(54,34,25,0.08)',
        glow: '0 0 0 4px rgba(54,34,25,0.06)',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px) translateY(-50%)' },
          '100%': { opacity: '1', transform: 'translateX(0) translateY(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        springUp: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '60%': { opacity: '1', transform: 'translateY(-2px) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        overlayIn: {
          '0%': { opacity: '0', transform: 'translateX(24px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        overlayOut: {
          '0%': { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(24px) scale(0.96)' },
        },
        stepFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        checkPop: {
          '0%': { opacity: '0', transform: 'scale(0.4) rotate(-12deg)' },
          '60%': { opacity: '1', transform: 'scale(1.15) rotate(0deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        liquidDrift: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(8px,-6px) scale(1.06)' },
          '66%': { transform: 'translate(-6px,8px) scale(0.96)' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
        fadeIn: 'fadeIn 0.4s ease forwards',
        pulseDot: 'pulseDot 1.8s ease-in-out infinite',
        springUp: 'springUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        overlayIn: 'overlayIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        overlayOut: 'overlayOut 0.45s cubic-bezier(0.25,1,0.5,1) forwards',
        stepFadeIn: 'stepFadeIn 0.4s cubic-bezier(0.25,1,0.5,1) forwards',
        checkPop: 'checkPop 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        glowPulse: 'glowPulse 2.2s ease-in-out infinite',
        liquidDrift: 'liquidDrift 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
