import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        panel: "#f7f8fa",
        line: "#d8dde6",
        brand: "#175c62",
        accent: "#b84a39",
        success: "#257653",
        warning: "#a76610"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(24, 33, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
