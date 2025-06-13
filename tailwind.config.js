
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        customBlue: "#3b82f6",
        customGray: "#1f2937",
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
}
