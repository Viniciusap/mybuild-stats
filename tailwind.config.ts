import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:           '#0e1117',
          panel:        '#151c2a',
          border:       '#243045',
          cyan:         '#4f9eff',
          'cyan-dim':   '#2563eb',
          green:        '#34d399',
          'green-dim':  '#059669',
          purple:       '#a78bfa',
          'purple-dim': '#7c3aed',
          amber:        '#fbbf24',
          red:          '#f87171',
          text:         '#dce4f0',
          'text-dim':   '#546880',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan':   '0 0 0 1px rgba(79,158,255,0.15), 0 4px 16px rgba(79,158,255,0.08)',
        'neon-green':  '0 0 0 1px rgba(52,211,153,0.15), 0 4px 16px rgba(52,211,153,0.08)',
        'neon-purple': '0 0 0 1px rgba(167,139,250,0.15), 0 4px 16px rgba(167,139,250,0.08)',
        'neon-amber':  '0 0 0 1px rgba(251,191,36,0.15),  0 4px 16px rgba(251,191,36,0.08)',
        'neon-red':    '0 0 0 1px rgba(248,113,113,0.15), 0 4px 16px rgba(248,113,113,0.08)',
        'panel':       '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'blink':      'blink 1s step-end infinite',
        'slide-up':   'slide-up 0.3s ease-out',
        'fade-in':    'fade-in 0.4s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
