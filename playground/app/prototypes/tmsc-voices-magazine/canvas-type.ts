import { FONT_FAMILY } from "./data";

/** Small typesetting helpers for baking pages with canvas 2D. Sizes are in page pixels. */

export type Ctx = CanvasRenderingContext2D;

export function font(ctx: Ctx, weight: number, size: number, tracking = 0) {
  ctx.font = `${weight} ${size}px "${FONT_FAMILY}"`;
  ctx.letterSpacing = `${tracking * size}px`;
}

/** Greedy line breaking on spaces. */
export function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Largest size (stepping down) at which `text` fits the box. */
export function fit(
  ctx: Ctx,
  text: string,
  o: { weight: number; maxWidth: number; maxHeight: number; leading: number; max: number; min: number; tracking?: number },
): { size: number; lines: string[] } {
  for (let size = o.max; size >= o.min; size -= 2) {
    font(ctx, o.weight, size, o.tracking);
    const lines = wrap(ctx, text, o.maxWidth);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * size * o.leading <= o.maxHeight && widest <= o.maxWidth) return { size, lines };
  }
  font(ctx, o.weight, o.min, o.tracking);
  return { size: o.min, lines: wrap(ctx, text, o.maxWidth) };
}

/** Draws lines with the first baseline at y; returns the y of the last baseline. */
export function lines(ctx: Ctx, ls: string[], x: number, y: number, lineHeight: number): number {
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + (ls.length - 1) * lineHeight;
}

/** Text right-aligned to x. */
export function right(ctx: Ctx, text: string, x: number, y: number) {
  ctx.textAlign = "right";
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

/** Draws an image as large as fits in the box, anchored to the box's bottom-left. Returns its rect. */
export function imageFit(ctx: Ctx, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  const dy = y + h - dh;
  ctx.drawImage(img, x, dy, dw, dh);
  return { x, y: dy, w: dw, h: dh };
}

/** Draws an image covering the whole box (center crop). Returns the box. */
export function imageFill(ctx: Ctx, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
  return { x, y, w, h };
}

let grainTile: HTMLCanvasElement | null = null;

/** A light paper grain, multiplied in so it darkens paper a touch and leaves ink alone. */
export function grain(ctx: Ctx, w: number, h: number) {
  if (!grainTile) {
    grainTile = document.createElement("canvas");
    grainTile.width = grainTile.height = 256;
    const g = grainTile.getContext("2d")!;
    const data = g.createImageData(256, 256);
    // deterministic noise: the same grain on every bake and every export
    let seed = 1234567;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = 236 + ((seed >>> 24) % 20);
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = ctx.createPattern(grainTile, "repeat")!;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
