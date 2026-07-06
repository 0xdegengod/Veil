/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--color-border)',
        'border-subtle': 'var(--color-border-subtle)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        positive: 'var(--color-positive)',
        negative: 'var(--color-negative)',
        warning: 'var(--color-warning)',
        locked: 'var(--color-locked)',
        'locked-bg': 'var(--color-locked-bg)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
