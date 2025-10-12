/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic dark theme
        bg: "#0F1220",
        surface: "#171A2D",
        border: "#2A2F45",
        text: "#EAEAF5",
        muted: "#A3A7C7",
        accent: {
          DEFAULT: "#6F6CF6",
          hover: "#7B79FF",
        },
        chip: "#2B2F4A",
      },
      fontFamily: {
        // loaded via next/font; see src/app/fonts.ts
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "22px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.35)",
        soft: "0 4px 14px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};
