/** Export sizes. The stage always previews the chosen format, so exports match what you see. */
export const FORMATS = {
  "4:5 · 1080×1350": { w: 1080, h: 1350 },
  "16:9 · 1920×1080": { w: 1920, h: 1080 },
  "Share · 1200×630": { w: 1200, h: 630 },
} as const;

export type FormatName = keyof typeof FORMATS;

export function format(name: string): { w: number; h: number } {
  return (FORMATS as Record<string, { w: number; h: number }>)[name] ?? FORMATS["4:5 · 1080×1350"];
}

/** Short tag for file names: 1080x1350. */
export const sizeTag = (f: { w: number; h: number }) => `${f.w}x${f.h}`;
