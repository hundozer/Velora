import type { Config } from "tailwindcss";

// Warm light editorial palette. Values live as RGB channels in globals.css so
// opacity modifiers (bg-intimo-accent/10) keep working.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Legacy names (bg, card, gold, textPrimary…) are kept and mapped onto the new
// semantic tokens so existing screens adopt the palette without rewrites.
const intimoColors = {
  paper: token("paper"),
  surface: token("surface"),
  sunken: token("sunken"),
  ink: token("ink"),
  ink2: token("ink-2"),
  muted: token("muted"),
  line: token("line"),
  accent: token("accent"),
  accentHover: token("accent-hover"),
  blush: token("blush"),
  copper: token("copper"),
  copperInk: token("copper-ink"),
  copperLight: token("copper-light"),
  sage: token("sage"),
  night: token("night"),
  bg: token("paper"),
  card: token("surface"),
  cardHover: token("sunken"),
  border: token("line"),
  borderGold: token("accent"),
  gold: token("accent"),
  goldHover: token("accent-hover"),
  amber: token("accent"),
  roseGold: token("accent"),
  crimson: token("danger"),
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
        serif: ["var(--font-display)"],
        display: ["var(--font-display)"],
      },
      backgroundImage: {
        // Kept as names for existing markup; flat accent, no gradients.
        "gold-gradient": "linear-gradient(rgb(var(--accent)), rgb(var(--accent)))",
        "gold-radial": "none",
        "dark-gradient": "none",
        "glass-gradient": "none",
      },
      boxShadow: {
        "gold-glow": "0 10px 30px -12px rgb(var(--accent) / 0.45)",
        glass: "0 1px 2px rgb(var(--ink) / 0.04), 0 12px 40px -18px rgb(var(--ink) / 0.18)",
        card: "0 1px 2px rgb(var(--ink) / 0.04), 0 18px 50px -24px rgb(var(--ink) / 0.22)",
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
