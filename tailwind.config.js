/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- Purple Dark UI (screenshot matched) ---
        bg:        "#0F1122", // page background
        surface:   "#171A2D", // main cards/panels
        surface2:  "#1C2040", // darker cards / nav bars
        border:    "#2A2E4B", // hairlines
        text:      "#ECEEF8", // primary text
        muted:     "#A6AAD3", // secondary text

        // Brand accent
        accent: {
          DEFAULT: "#7C6CFF", // primary button/links
          hover:   "#8D7EFF",
          soft:    "#2D2A59", // soft chips/badges background
        },

        // Optional charts / highlights (tweak as needed)
        chart1: "#8D7EFF",
        chart2: "#58C4F6",
        chart3: "#F6A85A",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },

      borderRadius: {
        xl: "14px",
        "2xl": "22px",
      },

      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
