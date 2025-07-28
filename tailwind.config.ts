import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: "#D81B24",
        secondary: "#383B39",
        iris: "#4B4DED",
        "iris-light": "#EFEFFD",
        dark: "#0E0E2C",
        success: "#21CA6F",
        accent: "#6A6A77",
        background: "#454545",
        "body-text": "#FCFCFC",
        "subtitle-text": "#CCCCCC",
      },
      fontFamily: {
        kanit: ["Kanit", "sans-serif"],
        oswald: ["Oswald", "sans-serif"],
      },
      fontSize: {
        "heading-lg": "2rem",
        "heading-md": "1.5rem",
        "heading-sm": "1.25rem",
        body: "1rem",
        subtitle: "0.875rem",
      },
      spacing: {
        default: "16px",
        compact: "8px",
      },
      borderRadius: {
        default: "4px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;