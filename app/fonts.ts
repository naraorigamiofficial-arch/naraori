import localFont from "next/font/local";

/** Self-hosted, latin-only, preloaded, with metric-matched fallbacks (prevents layout shift). */
export const display = localFont({
  src: [
    { path: "./fonts/newsreader-latin-wght-normal.woff2", style: "normal", weight: "200 800" },
    { path: "./fonts/newsreader-latin-wght-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--ff-display",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const text = localFont({
  src: [{ path: "./fonts/source-sans-3-latin-wght-normal.woff2", style: "normal", weight: "200 900" }],
  variable: "--ff-text",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const mono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400-normal.woff2", style: "normal", weight: "400" },
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", style: "normal", weight: "500" },
  ],
  variable: "--ff-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "Menlo", "monospace"],
});
