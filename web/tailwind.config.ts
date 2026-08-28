import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ground: "rgb(var(--color-ground) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--color-ink-muted) / <alpha-value>)",
        rule: "rgb(var(--color-rule) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          strong: "rgb(var(--color-accent-strong) / <alpha-value>)",
          ink: "rgb(var(--color-accent-ink) / <alpha-value>)",
        },
        signal: {
          good: "rgb(var(--color-signal-good) / <alpha-value>)",
          "good-bg": "rgb(var(--color-signal-good-bg) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
