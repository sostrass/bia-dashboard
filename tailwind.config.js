/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        // Dark theme
        'ios-bg':        '#000000',
        'ios-bg-2':      '#1C1C1E',
        'ios-bg-3':      '#2C2C2E',
        'ios-bg-4':      '#3A3A3C',
        'ios-separator': 'rgba(255,255,255,0.12)',
        'ios-label':     '#FFFFFF',
        'ios-label-2':   'rgba(255,255,255,0.6)',
        'ios-label-3':   'rgba(255,255,255,0.3)',
        'ios-label-4':   'rgba(255,255,255,0.16)',
        // Light theme
        'ios-light-bg':        '#F2F2F7',
        'ios-light-bg-2':      '#FFFFFF',
        'ios-light-bg-3':      '#F2F2F7',
        'ios-light-bg-4':      '#E5E5EA',
        'ios-light-separator': 'rgba(60,60,67,0.12)',
        'ios-light-label':     '#000000',
        'ios-light-label-2':   'rgba(60,60,67,0.6)',
        'ios-light-label-3':   'rgba(60,60,67,0.3)',
        // Accent
        'accent':       '#32D74B',
        'accent-dim':   'rgba(50,215,75,0.15)',
        'accent-border':'rgba(50,215,75,0.3)',
        'blue':         '#0A84FF',
        'orange':       '#FF9F0A',
        'red':          '#FF453A',
        'yellow':       '#FFD60A',
        'teal':         '#5AC8FA',
        'purple':       '#BF5AF2',
      },
      borderRadius: {
        'ios':    '12px',
        'ios-lg': '16px',
        'ios-xl': '22px',
      },
      backdropBlur: { 'ios': '40px' },
      keyframes: {
        'fade-in':  { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'ping-green': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16,1,0.3,1)',
        'ping-green': 'ping-green 1.5s ease-in-out infinite',
      },
      boxShadow: {
        'ios-card': '0 2px 12px rgba(0,0,0,0.4)',
        'ios-card-light': '0 2px 12px rgba(0,0,0,0.08)',
        'ios-elevated': '0 8px 32px rgba(0,0,0,0.5)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
