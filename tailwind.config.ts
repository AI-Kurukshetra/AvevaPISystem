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
        background: "#090d14",
        foreground: "#d3d7de",
        card: "#101824",
        border: "#1e2c3f",
        accent: "#2db5ff",
        danger: "#ff5d73",
        success: "#3dd598",
        warning: "#f5a524"
      }
    }
  },
  plugins: []
};

export default config;
