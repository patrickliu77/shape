/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Crimson Pro"', "Georgia", "serif"],
      },
      colors: {
        ink: "#1a1a1a",
        paper: "#fdfcf7",
        accent: "#7c3aed",
      },
    },
  },
  plugins: [],
};
