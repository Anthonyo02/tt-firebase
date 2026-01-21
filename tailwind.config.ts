// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",

        secondary: "var(--secondary)",
        tertiary: "var(--tertiary)",

        "accent-warm": "var(--accent-warm)",
        "accent-neutral": "var(--accent-neutral)",

        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
      },
    },
  },
};

export default config;
