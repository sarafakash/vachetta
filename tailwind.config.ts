import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // dark trading-terminal base
        ink: "#0a0b0f",
        panel: "#12141c",
        panel2: "#1a1d28",
        line: "#252836",
        muted: "#6b7280",
        soft: "#9aa0ae",
        // solana-leaning accents
        violet: "#9945ff",
        mint: "#14f195",
        up: "#14f195",
        down: "#ff5470",
      },
      fontFamily: {
        // numbers + data: monospace with tabular figures
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
