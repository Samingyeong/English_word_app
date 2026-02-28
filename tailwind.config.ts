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
        display: ["var(--font-orbitron)", "var(--font-nunito)", "sans-serif"],
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
        "quizlet-bg": "var(--quizlet-bg)",
        "quizlet-card": "var(--quizlet-card)",
        "quizlet-border": "var(--quizlet-border)",
        "quizlet-primary": "var(--quizlet-primary)",
        "quizlet-text": "var(--quizlet-text)",
        "quizlet-text-secondary": "var(--quizlet-text-secondary)",
      },
      animation: {
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
        "glow": "glow 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(16, 191, 212, 0.2)" },
          "50%": { boxShadow: "0 0 24px rgba(16, 191, 212, 0.35)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

