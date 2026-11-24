/**
 * Archivo Narrow (variable, 400–700), self-hosted in public/shared/fonts/tmsc so canvas
 * drawing and exports never wait on a third-party CDN. Registered under its own family name.
 */
export const FONT = "tMSC Archivo Narrow";
export const FONT_STACK = `"${FONT}", "Arial Narrow", sans-serif`;

const FILES = [
  { file: "archivo-narrow-latin.woff2", range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  { file: "archivo-narrow-latin-ext.woff2", range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
];

let loading: Promise<void> | null = null;

/** Loads the font once per page. Resolves even if loading fails (canvas falls back). */
export function ensureFont(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  loading ??= Promise.all(
    FILES.map(async ({ file, range }) => {
      const face = new FontFace(FONT, `url(/shared/fonts/tmsc/${file}) format("woff2")`, {
        weight: "400 700",
        unicodeRange: range,
        display: "swap",
      });
      document.fonts.add(face);
      await face.load();
    }),
  )
    .then(() => undefined)
    .catch(() => undefined);
  return loading;
}

/** Canvas font shorthand. */
export function font(size: number, weight = 600): string {
  return `${weight} ${Math.round(size * 10) / 10}px ${FONT_STACK}`;
}
