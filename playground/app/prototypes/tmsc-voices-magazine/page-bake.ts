import { grain } from "./canvas-type";
import { ASSET_BASE, FACES, FONT_FAMILY, FONT_URL, PAGE_PX, SPREADS } from "./data";
import { drawBackCover, drawCover } from "./layout-covers";
import { drawInterviewLeft, drawInterviewRight } from "./layout-interview";

/**
 * Bakes every printed side to its own canvas, once, after Archivo Narrow and the stills load.
 * The sheets map these as textures, so type curves with the paper.
 */

let fontReady: Promise<void> | null = null;
function loadFont(): Promise<void> {
  fontReady ??= new FontFace(FONT_FAMILY, `url(${FONT_URL})`, { weight: "400 700" })
    .load()
    .then((f) => void document.fonts.add(f));
  return fontReady;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // a missing still leaves the page typographic
    img.src = src;
  });
}

export async function bakePages(size: { w: number; h: number }): Promise<Map<string, HTMLCanvasElement>> {
  const orders = [1, 2, 3, 4] as const;
  const [, ...stills] = await Promise.all([loadFont(), ...orders.map((o) => loadImage(`${ASSET_BASE}/stills/${SPREADS[o].still}`))]);
  const out = new Map<string, HTMLCanvasElement>();
  for (const face of FACES) {
    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(size.w / PAGE_PX.w, size.h / PAGE_PX.h);
    ctx.textBaseline = "alphabetic";
    if (face.layout === "cover") drawCover(ctx);
    else if (face.layout === "back-cover") drawBackCover(ctx);
    else if (face.layout === "interview-left") drawInterviewLeft(ctx, face.interviewOrder!, stills[face.interviewOrder! - 1]);
    else drawInterviewRight(ctx, face.interviewOrder!);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    grain(ctx, size.w, size.h);
    out.set(face.id, canvas);
  }
  return out;
}
