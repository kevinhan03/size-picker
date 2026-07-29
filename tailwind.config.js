/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

const tailwindConfig = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          ...defaultTheme.fontFamily.sans,
        ],
      },
      transitionDuration: {
        DEFAULT: "var(--duration-press)",
        150: "var(--duration-press)",
        200: "var(--duration-popover)",
        300: "var(--duration-layer-enter)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease-out)",
        out: "var(--ease-out)",
      },
    },
  },
  plugins: [],
};

export default tailwindConfig;
