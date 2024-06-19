/** @type {import('tailwindcss').Config} ;*/
const colors = require('tailwindcss/colors')
module.exports = {
  content: ['./src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'media',
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1400px',
    },
    extend: {
      colors: {
        darkAccent: "#0f172a",
        whiteText: "#e2e8f0",
        whiteTextLight: "#637084",
        primary: colors.blue,
      },
    },
  },
  prefix: 'tw-',
  important: true,
  corePlugins: {
    preflight: false,
  },
  plugins: [
  ],
}
