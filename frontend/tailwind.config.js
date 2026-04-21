/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        clay:    { DEFAULT: '#C1440E', light: '#E05A25', dark: '#8F3009' },
        cream:   { DEFAULT: '#FAF6F0', dark: '#F0E9DF' },
        bark:    { DEFAULT: '#3D2B1F', light: '#5A3E2E', muted: '#8A6E5D' },
        sage:    { DEFAULT: '#7A9E7E', light: '#A3BFA6', dark: '#506B53' },
        gold:    { DEFAULT: '#D4A843', light: '#E8C46A', dark: '#A07E28' },
        smoke:   { DEFAULT: '#E8E0D8', dark: '#C8BEB4' },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'warm': '0 4px 24px -4px rgba(61,43,31,0.18)',
        'warm-lg': '0 12px 40px -8px rgba(61,43,31,0.22)',
        'card': '0 2px 12px rgba(61,43,31,0.10)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:       { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(32px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseDot:     { '0%,80%,100%': { transform: 'scale(0)', opacity: 0.5 }, '40%': { transform: 'scale(1)', opacity: 1 } },
        voiceWave:    { '0%,100%': { transform: 'scaleY(0.35)' }, '50%': { transform: 'scaleY(1)' } },
      },
    },
  },
  plugins: [],
}
