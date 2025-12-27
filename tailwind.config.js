export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blue: { 600: "#2563eb", 700: "#1d4ed8" },
        green: { 600: "#16a34a", 700: "#15803d" },
        red: { 600: "#dc2626", 700: "#b91c1c" },
        yellow: { 600: "#ca8a04", 700: "#a16207" },
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        gradient: "gradient-shift 14s ease infinite",
        float: "float-slow 6s ease-in-out infinite",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2, 6, 23, 0.10)",
        glass: "0 10px 30px rgba(2, 6, 23, 0.12)",
      },
    },
  },
  plugins: [],
};
