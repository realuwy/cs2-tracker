/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
  colors: {
    // --- Nightsable-style Dark UI ---
    bg: "#0a0a0a",          // page background
    surface: "#101010",     // card surface
    surface2: "#121212",    // darker surface (headers/nav)
    border: "rgba(255,255,255,0.08)",
    text: "#e4e4e7",        // primary text
    muted: "#a1a1aa",       // secondary text

    // Neon Lime Accent
    accent: {
      DEFAULT: "#d8ff35",   // primary accent
      hover: "#c9ff0d",
      glow: "rgba(216,255,53,0.25)",
    },
  },

  fontFamily: {
    sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
  },

  borderRadius: {
    xl: "14px",
    "2xl": "22px",
  },

  boxShadow: {
    card: "0 10px 30px rgba(0,0,0,0.35)",
    neon: "0 0 0 1px rgba(0,0,0,0.2), 0 10px 26px -12px rgba(216,255,53,0.25)",
  },
},

  },
  plugins: [],
};
