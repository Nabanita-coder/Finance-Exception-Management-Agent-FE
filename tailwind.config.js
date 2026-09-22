/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        fema: {
          bg: "var(--fema-bg)",
          surface: "var(--fema-surface)",
          "surface-subtle": "var(--fema-surface-subtle)",
          "surface-muted": "var(--fema-surface-muted)",
          border: "var(--fema-border)",
          "border-highlight": "var(--fema-border-highlight)",
          primary: "var(--fema-primary)",
          "primary-hover": "var(--fema-primary-hover)",
          "primary-glow": "var(--fema-primary-glow)",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "-apple-system", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      boxShadow: {
        "fema-card": "var(--fema-card-shadow)",
        "fema-hover": "var(--fema-card-shadow-hover)",
        "fema-glow": "0 0 25px rgba(79, 70, 229, 0.35)",
      },
    },
  },
  plugins: [],
};
