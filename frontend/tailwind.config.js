/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bangla: ['"Noto Sans Bengali"', 'sans-serif'],
      }
    }
  },
  plugins: []
}
