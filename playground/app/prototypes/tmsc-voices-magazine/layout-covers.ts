import { fit, font, imageFill, imageFit, lines, right, type Ctx } from "./canvas-type";
import { displayDate, INTERVIEWS, PUBLICATION_URL } from "./content";
import type { CoverSetup } from "./setup";
import { PAGE_PX } from "./data";
import type { PageInk } from "./types";
import { drawOrbitCover } from "./layout-cover-orbit";
import { drawArtworkCover } from "./layout-cover-artwork";

/** Cover and back cover, drawn at the design size (PAGE_PX). */

const W = PAGE_PX.w;
const H = PAGE_PX.h;
const M = 92;
const ROW_H = 150;

/**
 * Three covers: type only on the cover color (white by default), a full-bleed image under the type, or an image set
 * into a color field. The type layout is the same in all three, so the masthead never moves.
 */
export function drawCover(ctx: Ctx, cover: CoverSetup, img: HTMLImageElement | null) {
  if (cover.style === "artwork") return drawArtworkCover(ctx, img);
  if (cover.style === "orbit") return drawOrbitCover(ctx, cover);
  const style = img ? cover.style : cover.style === "full" ? "on-color" : cover.style;
  ctx.fillStyle = cover.color;
  ctx.fillRect(0, 0, W, H);
  if (img && style === "full") imageFill(ctx, img, 0, 0, W, H);
  ctx.fillStyle = cover.ink;

  font(ctx, 600, 54);
  ctx.fillText("the Motion Social Club", M, M + 46);
  right(ctx, "tMSC", W - M, M + 46);

  // the title, as wide as the page allows
  const title = fit(ctx, "Voices", { weight: 700, maxWidth: W - 2 * M + 20, maxHeight: 700, leading: 1, max: 720, min: 300, tracking: -0.045 });
  font(ctx, 700, title.size, -0.045);
  const titleBase = 300 + title.size * 0.74;
  ctx.fillText("Voices", M - 14, titleBase);

  font(ctx, 500, 64, -0.01);
  ctx.fillText("Four conversations", M, titleBase + 120);

  // the four guests, newest first, each with the day it went out
  const top = H - M - ROW_H * (INTERVIEWS.length - 1);
  if (img && style === "on-color") {
    const boxTop = titleBase + 200;
    const ink = ctx.fillStyle;
    // the size slider shrinks the image's box around its middle, left edge on the margin
    const aw = W - 2 * M;
    const ah = top - 150 - boxTop;
    const bh = ah * cover.scale;
    imageFit(ctx, img, M, boxTop + (ah - bh) / 2, aw * cover.scale, bh);
    ctx.fillStyle = ink;
  }
  INTERVIEWS.forEach((it, i) => {
    const y = top + i * ROW_H;
    font(ctx, 700, 118, -0.02);
    ctx.fillText(it.guest, M, y);
    font(ctx, 500, 54);
    right(ctx, displayDate(it.post_date), W - M, y);
  });
}

export function drawBackCover(ctx: Ctx, page: PageInk) {
  ctx.fillStyle = page.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = page.ink;

  const name = fit(ctx, "the Motion Social Club", { weight: 700, maxWidth: W - 2 * M, maxHeight: 900, leading: 0.92, max: 300, min: 120, tracking: -0.035 });
  font(ctx, 700, name.size, -0.035);
  lines(ctx, name.lines, M - 6, M + name.size * 0.8, name.size * 0.92);

  font(ctx, 500, 60, -0.01);
  ctx.fillText("Read the conversations", M, H - M - 150);
  const url = fit(ctx, PUBLICATION_URL, { weight: 600, maxWidth: W - 2 * M, maxHeight: 120, leading: 1, max: 96, min: 48, tracking: -0.01 });
  font(ctx, 600, url.size, -0.01);
  ctx.fillText(PUBLICATION_URL, M, H - M - 30);
}
