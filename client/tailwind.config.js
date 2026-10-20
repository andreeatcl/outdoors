/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",
        "primary-dark": "#EA6C0A",
        "primary-light": "#FED7AA",
        background: "#FAFAF8",
        surface: "#FFFFFF",
        "text-primary": "#1C1917",
        "text-muted": "#78716C",
        border: "#E7E5E4",
        "event-far": "#1E40AF",
        "event-day": "#3B82F6",
        "event-6h": "#EF4444",
        "event-3h": "#F97316",
        "event-1h": "#EAB308",
        "event-soon": "#22C55E",
        "event-ongoing": "#A855F7",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08)",
        modal: "0 8px 40px rgba(0,0,0,0.16)",
        float: "0 4px 20px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
