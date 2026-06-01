import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121417",
        mist: "#f3f7f8",
        teal: "#2c8f8a",
        coral: "#e56f5d",
        amber: "#d99a2b"
      },
      boxShadow: {
        glass: "0 20px 60px rgba(18, 20, 23, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
