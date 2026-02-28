import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "crewmate-red": "var(--crewmate-red)",
        "crewmate-lime": "var(--crewmate-lime)",
        "crewmate-cyan": "var(--crewmate-cyan)",
        "crewmate-yellow": "var(--crewmate-yellow)",
        "crewmate-orange": "var(--crewmate-orange)",
        "crewmate-pink": "var(--crewmate-pink)",
        "visor-blue": "var(--visor-blue)",
        "bg-space": "var(--bg-space)",
        "bg-card": "var(--bg-card)",
      },
    },
  },
  plugins: [],
};
export default config;

