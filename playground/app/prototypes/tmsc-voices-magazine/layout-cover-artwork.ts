import type { Ctx } from "./canvas-type";
import { drawGuestStack, type CoverGuest } from "./cover-guests";
import { ASSET_BASE, PAGE_PX } from "./data";

/**
 * The Human + Motion cover: the artwork exactly as supplied (pixels, not redrawn), on its own
 * paper colour, with the four guests set below it. Nothing else on the page.
 */

export const ARTWORK_URL = `${ASSET_BASE}/cover/human-motion.png`;
/** The artwork's background (sampled from the file), so the page and the image meet seamlessly. */
const ARTWORK_BG = "#FCFCFC";
const ARTWORK_INK = "#0C0C0C";
/** The drawing inside the 1080×1350 file, with a little air around it. */
const CROP = { x: 207, y: 368, w: 666, h: 614 };

const W = PAGE_PX.w;
const H = PAGE_PX.h;

export function drawArtworkCover(ctx: Ctx, art: HTMLImageElement | null, guests: CoverGuest[]) {
  ctx.fillStyle = ARTWORK_BG;
  ctx.fillRect(0, 0, W, H);
  const w = 1000;
  const h = (CROP.h / CROP.w) * w;
  const top = 300; // artwork + names centred on the page as one group
  if (art) {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(art, CROP.x, CROP.y, CROP.w, CROP.h, (W - w) / 2, top, w, h);
  }
  // the creators, centred under the artwork
  ctx.fillStyle = ARTWORK_INK;
  drawGuestStack(ctx, guests, W / 2, top + h + 190);
}
