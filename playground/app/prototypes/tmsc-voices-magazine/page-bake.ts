import { grain } from "./canvas-type";
import type { PageSetup } from "./controls";
import { FACES, FONT_FAMILY, FONT_URL, PAGE_PX } from "./data";
import { drawBackCover, drawCover } from "./layout-covers";
import { drawInterviewLeft, drawInterviewRight } from "./layout-interview";

/**
 * Bakes every printed side to its own canvas after Archivo Narrow and the chosen images load.
 * The sheets map these as textures, so type curves with the paper. Re-run when the setup
 * changes; images are cached, so a re-bake only waits for images it hasn't seen.
 */

let fontReady: Promise<void> | null = null;
function loadFont(): Promise<void> {
  fontReady ??= new FontFace(FONT_FAMILY, `url(${FONT_URL})`, { weight: "400 700" })
    .load()
    .then((f) => void document.fonts.add(f));
  return fontReady;
}

const images = new Map<string, Promise<HTMLImageElement | null>>();
function loadImage(src: string): Promise<HTMLImageElement | null> {
  let p = images.get(src);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // a missing image leaves the page typographic
      img.src = src;
    });
    images.set(src, p);
  }
  return p;
}

export async function bakePages(size: { w: number; h: number }, setup: PageSetup): Promise<Map<string, HTMLCanvasElement>> {
  const orders = [1, 2, 3, 4] as const;
  const [, ...imgs] = await Promise.all([loadFont(), ...orders.map((o) => (setup.media[o] ? loadImage(setup.media[o]!.url) : null))]);
  const out = new Map<string, HTMLCanvasElement>();
  for (const face of FACES) {
    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(size.w / PAGE_PX.w, size.h / PAGE_PX.h);
    ctx.textBaseline = "alphabetic";
    const order = face.interviewOrder;
    if (face.layout === "cover") drawCover(ctx);
    else if (face.layout === "back-cover") drawBackCover(ctx);
    else if (face.layout === "interview-left") {
      const img = imgs[order! - 1];
      const choice = setup.media[order!];
      drawInterviewLeft(ctx, order!, img && choice ? { img, credit: choice.asset.credit, fill: setup.fill } : null);
    } else drawInterviewRight(ctx, order!);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    grain(ctx, size.w, size.h);
    out.set(face.id, canvas);
  }
  return out;
}
