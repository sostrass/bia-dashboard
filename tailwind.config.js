module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', '"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'ios-lc':  ['34px', { lineHeight: '41px', fontWeight: '700', letterSpacing: '-0.5px' }],
        'ios-t1':  ['28px', { lineHeight: '34px', fontWeight: '700', letterSpacing: '-0.5px' }],
        'ios-t2':  ['22px', { lineHeight: '28px', fontWeight: '700', letterSpacing: '-0.3px' }],
        'ios-t3':  ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'ios-hl':  ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'ios-bd':  ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'ios-cl':  ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'ios-sh':  ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'ios-fn':  ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'ios-c1':  ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'ios-c2':  ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      borderRadius: {
        'ios-sm': '8px',
        'ios':    '12px',
        'ios-lg': '16px',
        'ios-xl': '22px',
        'ios-2xl':'28px',
      },
      boxShadow: {
        'ios':      '0 2px 16px rgba(0,0,0,0.4)',
        'ios-lg':   '0 8px 40px rgba(0,0,0,0.5)',
        'ios-inset':'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        'ios': '20px',
        'ios-heavy': '40px',
      },
      keyframes: {
        'ping-subtle': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        'slide-in-up': { 'from': { opacity: '0', transform: 'translateY(8px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
        'bounce-subtle': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-2px)' } },
      },
      animation: {
        'ping-subtle':   'ping-subtle 1.5s ease-in-out infinite',
        'slide-in-up':   'slide-in-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
