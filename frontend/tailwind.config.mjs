/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          gray100: "#161616",
          gray90: "#262626",
          gray80: "#393939",
          gray70: "#525252",
          gray60: "#6f6f6f",
          gray50: "#8d8d8d",
          gray30: "#c6c6c6",
          gray10: "#f4f4f4",
          blue60: "#0f62fe",
          blue70: "#0043ce",
          supportGreen: "#42be65",
          supportRed: "#da1e28",
        },
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [],
};
