import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: '#fff3ef',
          100: '#ffe6dc',
          200: '#ffc8ad',
          300: '#ffa77e',
          400: '#ff8a4f',
          500: 'var(--color-primary)',
          600: '#e04b2a',
          700: '#b93b22',
          800: '#8f2e1a',
          900: '#6b2213',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          muted: 'var(--surface-muted)'
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"],
      },
    },
  },
  plugins: [],
} satisfies Config;
