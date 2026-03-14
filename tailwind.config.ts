import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        border: "var(--border)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)"
      }
    }
  },
  plugins: []
};

export default config;
