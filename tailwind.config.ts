import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
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
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(37,99,235,0.08), 0 16px 36px rgba(15,23,42,0.06)',
        card: '0 10px 20px -3px rgba(15,23,42,0.03), 0 4px 6px -2px rgba(15,23,42,0.01)',
        panel: '0 20px 25px -5px rgba(15,23,42,0.05), 0 10px 10px -5px rgba(15,23,42,0.02)',
      },
      backgroundImage: {
        'radial-fade':
          'radial-gradient(circle at top left, rgba(37,99,235,0.06), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
      },
      letterSpacing: {
        executive: '0.12em',
      },
    },
  },
  plugins: [],
};

export default config;

