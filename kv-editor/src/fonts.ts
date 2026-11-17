import opentypeModule from 'opentype.js';
import type { FontId, TextFontId } from './model';

// opentype.js 2 ships no types; we only use a small surface.
export interface OTGlyph {
  advanceWidth?: number;
  getPath(x: number, y: number, size: number): { commands: OTCommand[] };
}
export type OTCommand =
  | { type: 'M' | 'L'; x: number; y: number }
  | { type: 'Q'; x1: number; y1: number; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Z' };
export interface OTFont {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  tables: { os2?: { sCapHeight?: number; sxHeight?: number } };
  charToGlyph(c: string): OTGlyph;
  getKerningValue(a: OTGlyph, b: OTGlyph): number;
}
const opentype = ((opentypeModule as unknown as { parse?: unknown }).parse
  ? opentypeModule
  : (opentypeModule as unknown as { default: unknown }).default) as unknown as {
  parse(buf: ArrayBuffer): OTFont;
};

const BASE = import.meta.env.BASE_URL;

export const HEADLINE_FONTS: Record<FontId, { label: string; file: string }> = {
  saira: { label: 'Saira Extra Condensed Black', file: 'saira-extra-condensed-latin-900-normal.woff' },
  saira800: { label: 'Saira Extra Condensed ExtraBold', file: 'saira-extra-condensed-latin-800-normal.woff' },
  barlow800: { label: 'Barlow Condensed ExtraBold', file: 'barlow-condensed-latin-800-normal.woff' },
  barlow: { label: 'Barlow Condensed Black', file: 'barlow-condensed-latin-900-normal.woff' },
  barlow700: { label: 'Barlow Condensed Bold', file: 'barlow-condensed-latin-700-normal.woff' },
  sofia: { label: 'Sofia Sans Extra Condensed Black', file: 'sofia-sans-extra-condensed-latin-900-normal.woff' },
  shoulders: { label: 'Big Shoulders Display Black', file: 'big-shoulders-display-latin-900-normal.woff' },
  archivo: { label: 'Archivo Black', file: 'archivo-latin-900-normal.woff' },
  narrow: { label: 'Archivo Narrow Bold', file: 'ArchivoNarrow-Bold.ttf' },
};

/** CSS families for clean text (canvas fillText). */
export const TEXT_FONTS: Record<TextFontId, { label: string; family: string; weight: number; file: string }> = {
  inter400: { label: 'Inter Regular', family: 'KV Inter', weight: 400, file: 'inter-latin-400-normal.woff' },
  inter500: { label: 'Inter Medium', family: 'KV Inter', weight: 500, file: 'inter-latin-500-normal.woff' },
  inter600: { label: 'Inter SemiBold', family: 'KV Inter', weight: 600, file: 'inter-latin-600-normal.woff' },
  narrow: { label: 'Archivo Narrow Bold', family: 'KV Narrow', weight: 700, file: 'ArchivoNarrow-Bold.ttf' },
  saira: { label: 'Saira Extra Condensed', family: 'KV Saira', weight: 900, file: 'saira-extra-condensed-latin-900-normal.woff' },
};

const otFonts = new Map<FontId, OTFont>();

export function getFont(id: FontId): OTFont {
  const f = otFonts.get(id) ?? otFonts.get('barlow700');
  if (!f) throw new Error('Fonts not loaded');
  return f;
}

export function capHeight(font: OTFont): number {
  return (font.tables.os2?.sCapHeight || font.unitsPerEm * 0.7) / font.unitsPerEm;
}

let loading: Promise<void> | null = null;

/** Loads every font before the first paint. Fails loudly: exports never fall back to a system face. */
export function loadFonts(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    await Promise.all(
      (Object.keys(HEADLINE_FONTS) as FontId[]).map(async (id) => {
        const res = await fetch(`${BASE}fonts/${HEADLINE_FONTS[id].file}`);
        if (!res.ok) throw new Error(`Font missing: ${HEADLINE_FONTS[id].file}`);
        otFonts.set(id, opentype.parse(await res.arrayBuffer()));
      }),
    );
    await Promise.all(
      Object.values(TEXT_FONTS).map(async (t) => {
        const face = new FontFace(t.family, `url(${BASE}fonts/${t.file})`, { weight: String(t.weight) });
        await face.load();
        document.fonts.add(face);
      }),
    );
  })();
  return loading;
}
