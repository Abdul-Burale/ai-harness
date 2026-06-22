import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        moss: "#315a4b",
        mint: "#dceee5",
        clay: "#b8654b",
        paper: "#f7f5ef",
        line: "#d8ddd4",
      },
      boxShadow: {
        panel: "0 16px 40px rgba(23, 33, 31, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
