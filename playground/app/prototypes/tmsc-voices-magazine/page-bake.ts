import type { PageSetup } from "./setup";
import { ASSET_BASE, FONT_FAMILY, FONT_URL, PAGE_PX } from "./data";
import { SLAB_FAMILY } from "./layout-cover-orbit";
import type { Book } from "./faces";
import { drawBackCover, drawCover } from "./layout-covers";
import { drawEditorialLeft, drawEditorialRight, layoutEditorial, type EditorialImage, type EditorialLayout } from "./layout-editorial";
import { drawInterviewLeft, drawInterviewRight } from "./layout-interview";
import type { MediaChoice } from "./media";
import { applyTexture } from "./textures";

/**
 * Bakes every printed side to its own canvas after Archivo Narrow and the chosen images load.
 * The sheets map these as textures, so type curves with the paper. Re-run when the setup
 * changes; images are cached, so a re-bake only waits for images it hasn't seen.
 */

let fontReady: Promise<void> | null = null;
function loadFont(): Promise<void> {
  fontReady ??= Promise.all([
    new FontFace(FONT_FAMILY, `url(${FONT_URL})`, { weight: "400 700" }).load(),
    // Bitter (OFL), the slab serif of the dotted cover title
    new FontFace(SLAB_FAMILY, `url(${ASSET_BASE}/fonts/bitter-latin-800-normal.woff2)`, { weight: "800" }).load(),
  ]).then((faces) => faces.forEach((f) => document.fonts.add(f)));
  return fontReady;
}

const images = new Map<string, Promise<HTMLImageElement | null>>();
function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
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

const ORDERS = [1, 2, 3, 4] as const;

async function withImage(choice: MediaChoice): Promise<EditorialImage> {
  const img = await loadImage(choice?.url);
  return img && choice ? { img, choice } : null;
}

export async function bakePages(
  size: { w: number; h: number },
  book: Book,
  setup: PageSetup,
  uploaded: string | null,
  textureImage: HTMLImageElement | null,
): Promise<Map<string, HTMLCanvasElement>> {
  const { cover, editorial } = setup;
  const coverUrl = cover.style === "type" || cover.style === "orbit" ? null : cover.source === "upload" ? uploaded : setup.media[cover.source]?.url;
  const [, coverImg, intro, textImages] = await Promise.all([
    loadFont(),
    loadImage(coverUrl),
    Promise.all(ORDERS.map((o) => loadImage(setup.media[o]?.url))),
    Promise.all(ORDERS.map((o) => Promise.all(editorial.images[o].map(withImage)))),
  ]);

  const out = new Map<string, HTMLCanvasElement>();
  const layouts = new Map<number, EditorialLayout>();
  for (const face of book.faces) {
    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(size.w / PAGE_PX.w, size.h / PAGE_PX.h);
    ctx.textBaseline = "alphabetic";
    const o = face.interviewOrder!;
    switch (face.layout) {
      case "cover":
        drawCover(ctx, cover, coverImg);
        break;
      case "back-cover":
        drawBackCover(ctx, setup.inks.back);
        break;
      case "interview-left": {
        const img = intro[o - 1];
        const choice = setup.media[o];
        drawInterviewLeft(ctx, o, setup.inks.spreads[o].left, img && choice ? { img, credit: choice.asset.credit, fill: setup.fill, scale: setup.imageScale } : null, face.folio);
        break;
      }
      case "interview-right":
        drawInterviewRight(ctx, o, setup.inks.spreads[o].right, face.folio);
        break;
      case "editorial-left":
      case "editorial-right": {
        const [a, b] = textImages[o - 1];
        // one layout for both pages, so the text runs on from left to right
        if (!layouts.has(o)) layouts.set(o, layoutEditorial(ctx, o, editorial, a, b));
        const L = layouts.get(o)!;
        if (face.layout === "editorial-left") drawEditorialLeft(ctx, o, editorial, L, b, face.folio);
        else drawEditorialRight(ctx, o, editorial, L, a, face.folio);
        break;
      }
    }
    if (setup.texture.kind !== "None") applyTexture(ctx, size.w, size.h, size.w / PAGE_PX.w, { kind: setup.texture.kind, strength: setup.texture.strength, image: textureImage });
    out.set(face.id, canvas);
  }
  return out;
}
