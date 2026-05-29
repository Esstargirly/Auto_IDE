/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        foreground: "#f8fafc",
        cardBg: "rgba(17, 25, 40, 0.75)",
        borderLine: "rgba(255, 255, 255, 0.08)",
        glowColor: "rgba(99, 102, 241, 0.15)"
      },
      animation: {
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-fade': 'glowFade 3s ease-in-out infinite'
      },
      keyframes: {
        glowFade: {
          '0%, 100%': { opacity: 0.15 },
          '50%': { opacity: 0.25 }
        }
      }
    },
  },
  plugins: [],
};
