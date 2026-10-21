import type { Config } from "tailwindcss";

// Graphite / ice-blue palette. Values live as RGB channels in globals.css so
// opacity modifiers (bg-intimo-accent/10) keep working.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Legacy names (bg, card, gold, textPrimary…) are kept and mapped onto the new
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
        "gold-gradient": "linear-gradient(rgb(var(--accent)), rgb(var(--accent)))",
        "gold-radial": "none",
        "dark-gradient": "none",
        "glass-gradient": "none",
      },
      boxShadow: {
        "gold-glow": "0 6px 20px -12px rgb(var(--accent) / 0.25)",
        glass: "0 1px 2px rgb(0 0 0 / 0.12), 0 12px 40px -18px rgb(0 0 0 / 0.35)",
        card: "0 1px 2px rgb(0 0 0 / 0.12), 0 18px 50px -24px rgb(0 0 0 / 0.4)",
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
