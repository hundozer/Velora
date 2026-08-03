import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        velora: {
          bg: "#0A0B0E",
          card: "#12151E",
          cardHover: "#181C2A",
          border: "rgba(255, 255, 255, 0.08)",
          borderGold: "rgba(212, 175, 55, 0.25)",
          gold: "#D4AF37",
          goldHover: "#C59B27",
          amber: "#E5B869",
          roseGold: "#E0A96D",
          crimson: "#9E2A2B",
          textPrimary: "#F9FAFB",
          textSecondary: "#9CA3AF",
          textMuted: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D4AF37 0%, #E5B869 50%, #C59B27 100%)",
        "gold-radial": "radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
        "dark-gradient": "linear-gradient(180deg, #12151E 0%, #0A0B0E 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 25px -5px rgba(212, 175, 55, 0.3)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};
export default config;
