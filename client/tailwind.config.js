/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- FIXED: comma instead of hyphen
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}