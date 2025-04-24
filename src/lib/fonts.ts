import { Inter } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true
});

// Times New Roman is a web-safe font, so we can use it directly
export const fontTimesNewRoman = {
  variable: "--font-times-new-roman",
  className: "font-times-new-roman",
};