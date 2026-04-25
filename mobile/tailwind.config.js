/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        purple: '#7C3AED',
        purpleHover: '#6D28D9',
        bg: '#0F0F0F',
        card: '#1A1A1A',
        border: '#2A2A2A',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
      },
    },
  },
  plugins: [],
}
