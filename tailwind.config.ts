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
          bg: '#060a0f',
          panel: '#0d1520',
          border: '#1a2a3a',
          cyan: '#00d4ff',
          'cyan-dim': '#0088aa',
          green: '#00ff87',
          'green-dim': '#009944',
          purple: '#bf00ff',
          'purple-dim': '#7700aa',
          amber: '#ffaa00',
          red: '#ff3355',
          text: '#c8d8e8',
          'text-dim': '#607080',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 8px #00d4ff44, 0 0 24px #00d4ff22',
        'neon-green': '0 0 8px #00ff8744, 0 0 24px #00ff8722',
        'neon-purple': '0 0 8px #bf00ff44, 0 0 24px #bf00ff22',
        'neon-amber': '0 0 8px #ffaa0044, 0 0 24px #ffaa0022',
        'neon-red': '0 0 8px #ff335544, 0 0 24px #ff335522',
        'panel': '0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-cyber': `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-cyber': '32px 32px',
      },
    },
  },
  plugins: [],
}

export default config
