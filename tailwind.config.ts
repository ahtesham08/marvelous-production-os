import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        moss: "#3f5d50",
        amberline: "#c58634",
        danger: "#b8403a",
        paper: "#f6f4ee"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 28, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
