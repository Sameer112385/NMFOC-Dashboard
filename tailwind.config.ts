import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        panel2: 'rgb(var(--color-panel-2) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(67,198,184,0.18), 0 18px 40px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'radial-fade':
          'radial-gradient(circle at top, rgba(67,198,184,0.15), transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
