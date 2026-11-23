import localFont from "next/font/local";

/** Archivo Narrow, the report's typeface (same self-hosted files the canvas tools use). */
export const archivoNarrow = localFont({
  src: [
    { path: "../../../public/shared/fonts/tmsc/archivo-narrow-latin.woff2", weight: "400 700" },
    { path: "../../../public/shared/fonts/tmsc/archivo-narrow-latin-ext.woff2", weight: "400 700" },
  ],
  display: "swap",
});
