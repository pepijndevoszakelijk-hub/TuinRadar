import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f3f8ef",
          100: "#e1eed8",
          500: "#5b8f3a",
          700: "#3f682a",
          900: "#243d19"
        },
        clay: "#b8693f",
        skysoft: "#d9edf4"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 49, 25, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
