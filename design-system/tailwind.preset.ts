import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";
import tokens from './tokens.json';

// We want each package to be responsible for its own content.
const config: Omit<Config, "content"> = {
  theme: {
    screens: {
      sm: "390px", // 390-1023
      smp: "768px", // 768-1023 (small plus)
      md: "1024px", // 1024-1279
      lg: "1280px", // 1280-1439
      xl: "1440px", // 1440-1919
      "2xl": "1920px", // 1920-2559
      "3xl": "2560px", // 2560+
    },
    colors: tokens.colors,
    fontFamily: {
      // Backward compatible: CSS fonts work when variables aren't defined
      // Next.js fonts work when variables are defined
      "arizona-sans": [tokens.typography.fontFamily['arizona-sans'], "sans-serif"],
      "arizona-serif": [tokens.typography.fontFamily['arizona-serif'], "serif"],
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    spacing: tokens.spacing,
    borderRadius: tokens.radius,
    extend: {
      aspectRatio: {
        "1/1": "1 / 1",
        "4/5": "4 / 5",
        "8/5": "8 / 5",
        "8/3": "8 / 3",
        "16/9": "16 / 9",
      },
      fontSize: tokens.typography.fontSizes,
      backgroundImage: {
        "glow-conic":
          "conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)",
        checkerboard: `conic-gradient(from 90deg at 50% 50%, #fff 0deg, #fff 90deg, #000 90deg, #000 180deg, #fff 180deg, #fff 270deg, #000 270deg, #000 360deg)`,
      },
      scrollbar: ["responsive", "hover"], // Adding variants for your custom utility
      // Custom transition timing function (for temporary use, designers will provide the final values)
      transitionTimingFunction: {
        custom: "cubic-bezier(.39, .58, .57, 1)",
      },
      transitionDuration: {
        shortest: "150ms",
        shorter: "300ms",
        short: "500ms",
        base: "1000ms",
        long: "2000ms",
      },
      zIndex: {
        1: "calc(var(--z-index-1))",
        10: "calc(var(--z-index-10))",
        20: "calc(var(--z-index-20))",
        30: "calc(var(--z-index-30))",
        40: "calc(var(--z-index-40))",
        50: "calc(var(--z-index-50))",
        60: "calc(var(--z-index-60))",
      },
      keyframes: {
        "spring-bounce": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.3)" },
          "40%": { transform: "scale(0.95)" },
          "55%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.98)" },
          "85%": { transform: "scale(1.01)" },
          "100%": { transform: "scale(1)" },
        },
        "view-switch-to-grid": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "view-switch-to-list": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "spring-bounce": "spring-bounce 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "view-switch-to-grid": "view-switch-to-grid 600ms cubic-bezier(0.5, 0, 0.3, 1)",
        "view-switch-to-list": "view-switch-to-list 600ms cubic-bezier(0.5, 0, 0.3, 1)",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities, addBase, addVariant }) => {
      addVariant("can-hover", "@media (hover: hover)");
      addBase({
        ":root, :host(#headerHost), :host(#footerHost)": {
          "--z-index-base": "0",
          "--z-index-1": "calc(var(--z-index-base) + 1)",
          "--z-index-10": "calc(var(--z-index-base) + 10)",
          "--z-index-20": "calc(var(--z-index-base) + 20)",
          "--z-index-30": "calc(var(--z-index-base) + 30)",
          "--z-index-40": "calc(var(--z-index-base) + 40)",
          "--z-index-50": "calc(var(--z-index-base) + 50)",
          "--z-index-60": "calc(var(--z-index-base) + 60)",
        },
        "*:focus-visible": {
          "@apply focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-1 focus-visible:outline-black-300":
            {},
        },
        '[type="search"]::-webkit-search-decoration': { "@apply hidden": {} },
        '[type="search"]::-webkit-search-cancel-button': { "@apply hidden": {} },
        '[type="search"]::-webkit-search-results-button': { "@apply hidden": {} },
        '[type="search"]::-webkit-search-results-decoration': { "@apply hidden": {} },
        '[type="password"]::-ms-reveal': { "@apply hidden": {} },
        '[type="password"]::-ms-clear': { "@apply hidden": {} },
        body: {
          "@apply antialiased": {},
        },
      });
      const newUtilities = {
        ".scrollbar-thin": {
          scrollbarGutter:
            "stable" /* preserve the space for the scrollbar and prevent the layout shift */,
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 0, 0, 0.15)",
            borderRadius: "8px",
          },
          "&:hover": {
            overflowY: "auto",
          },
          "@media (hover: none) and (pointer: coarse)": {
            overflowY: "auto",
          },
          "@media (forced-colors: active)": {
            "&::-webkit-scrollbar-thumb": {
              background: "Highlight",
            },
            "&::-webkit-scrollbar-track": {
              background: "Canvas",
            },
          },
        },
        ".no-scrollbar": {
          "-ms-overflow-style": "none" /* Edge */,
          "scrollbar-width": "none" /* Firefox */,
          /* Chrome, Safari and Opera */
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".text-last-center": { "text-align-last": "center" },
        ".text-last-right": { "text-align-last": "right" },
        ".text-last-left": { "text-align-last": "left" },
      };
      addUtilities(newUtilities);
    }),
    tailwindcssAnimate,
  ],
};

export default config;
