import { TEXTURE_SIZE } from "./data";

/** Archivo Narrow (OFL) from the playground's shared fonts, loaded once under its own family name. */
const FAMILY = "Kinetic Pin Narrow";
let ready: Promise<void> | null = null;
export function loadFont(): Promise<void> {
  ready ??= new FontFace(FAMILY, "url(/shared/fonts/mb/archivo-narrow-latin-wght-normal.woff2)", { weight: "400 700" })
    .load()
    .then((f) => void document.fonts.add(f));
  return ready;
}

export type WordTexture = { word: string; canvas: HTMLCanvasElement; /** h / w of the glyphs */ aspect: number };

const cache = new Map<string, WordTexture>();

/**
 * A word drawn white on transparent, cropped tightly to its glyph bounds (no padding):
 * the canvas is exactly the ink box the font reports, so the quad's corners are the ink's.
 */
export function wordTexture(word: string): WordTexture {
  let t = cache.get(word);
  if (t) return t;
  const m = document.createElement("canvas").getContext("2d")!;
  m.font = `700 ${TEXTURE_SIZE}px "${FAMILY}"`;
  const box = m.measureText(word);
  const left = Math.ceil(box.actualBoundingBoxLeft);
  const w = Math.max(1, left + Math.ceil(box.actualBoundingBoxRight));
  const h = Math.max(1, Math.ceil(box.actualBoundingBoxAscent) + Math.ceil(box.actualBoundingBoxDescent));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  g.font = m.font;
  g.fillStyle = "#fff";
  g.textBaseline = "alphabetic";
  g.fillText(word, left, Math.ceil(box.actualBoundingBoxAscent));
  t = { word, canvas, aspect: h / w };
  cache.set(word, t);
  return t;
}
