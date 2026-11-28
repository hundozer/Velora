import type { Config } from "tailwindcss";

// Graphite / paper / ice + ember palette (docs/brand/BRAND.md). Values live as RGB channels in globals.css so
// opacity modifiers (bg-intimo-accent/10) keep working.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Compatibility names (bg, card, textPrimary…) are mapped onto the new
// semantic tokens so existing screens adopt the palette without rewrites.
const intimoColors = {
  paper: token("paper"),
  surface: token("surface"),
  sunken: token("sunken"),
  ink: token("ink"),
  onPhoto: token("on-photo"),
  ink2: token("ink-2"),
  muted: token("muted"),
  line: token("line"),
  control: token("control"),
  accent: token("accent"),
  accentHover: token("accent-hover"),
  cream: token("cream"),
  printInk: token("print-ink"),
  warm: token("warm"),
  warmHover: token("warm-hover"),
  blush: token("blush"),
  sage: token("sage"),
  night: token("night"),
  bg: token("paper"),
  card: token("surface"),
  cardHover: token("sunken"),
  border: token("line"),
  crimson: token("danger"),
  danger: token("danger"),
  success: token("success"),
  warning: token("warning"),
  signal: token("signal"),
  textPrimary: token("ink"),
  textSecondary: token("ink-2"),
  textMuted: token("muted"),
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        intimo: intimoColors,
        velora: intimoColors, // Alias for backward compatibility
        ink: token("ink"),
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        display: ["var(--font-display)"],
      },
      backgroundImage: {
        // Kept as names for existing markup; flat accent, no gradients.
        "dark-gradient": "none",
        "glass-gradient": "none",
      },
      boxShadow: {
        // Flat print look (BRAND.md §4): no drop shadows. Names kept for existing markup.
        glass: "none",
        card: "none",
      },
      borderRadius: {
        card: "1.75rem",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
