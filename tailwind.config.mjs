/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#C62828',
          dark:    '#8E0000',
          light:   '#FFCDD2',
          50:      '#FFF8F8',
          100:     '#FFCDD2',
          700:     '#C62828',
          900:     '#8E0000',
        },
        ink: {
          DEFAULT: '#1A1A2E',
          2: '#2D2D44',
          3: '#424242',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '4px',
        md: '6px',
        lg: '10px',
        xl: '14px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        'hero': '0 20px 60px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
