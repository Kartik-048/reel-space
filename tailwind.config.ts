import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: "#12131C",
        "surface-card": "#181926",
        "surface-elevated": "#222336",
        border: "#2A2B3D",
        primary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        accent: {
          blue: "#38BDF8",
          purple: "#C084FC",
          pink: "#F472B6",
          emerald: "#34D399",
        },
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "heart-burst": "heartBurst 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
      keyframes: {
        heartBurst: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
