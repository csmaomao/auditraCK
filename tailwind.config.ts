import type { Config } from 'tailwindcss'

const config: Config = {
  // Enable class-based dark mode so Tailwind activates dark: variants
  // when the 'dark' class is present on <html> (set in src/app/layout.tsx)
  darkMode: 'class',
  content: [
    // Scan all TypeScript/TSX files in the src directory
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary purple accent used throughout the app
        primary: {
          DEFAULT: '#2563EB', // blue-600
          hover: '#1D4ED8',   // blue-700
          light: '#3B82F6',   // blue-500
        },
      },
    },
  },
  plugins: [],
}

export default config
