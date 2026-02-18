/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotter: {
          dark: '#00414B',
          coral: '#FF6F61',
          light: '#F4F7F7',
        }
      }
    },
  },
  plugins: [],
}
