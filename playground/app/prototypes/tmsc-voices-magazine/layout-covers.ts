import { fit, font, lines, right, type Ctx } from "./canvas-type";
import { displayDate, INTERVIEWS, PUBLICATION_URL } from "./content";
import { BACK_COVER, COVER, PAGE_PX } from "./data";

/** Cover and back cover, drawn at the design size (PAGE_PX). */

const W = PAGE_PX.w;
const H = PAGE_PX.h;
const M = 92;

export function drawCover(ctx: Ctx) {
  ctx.fillStyle = COVER.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COVER.ink;

  font(ctx, 600, 54);
  ctx.fillText("the Motion Social Club", M, M + 46);
  right(ctx, "tMSC", W - M, M + 46);

  // the title, as wide as the page allows
  const title = fit(ctx, "Voices", { weight: 700, maxWidth: W - 2 * M + 20, maxHeight: 700, leading: 1, max: 720, min: 300, tracking: -0.045 });
  font(ctx, 700, title.size, -0.045);
  ctx.fillText("Voices", M - 14, 300 + title.size * 0.74);

  font(ctx, 500, 64, -0.01);
  ctx.fillText("Four conversations", M, 300 + title.size * 0.74 + 120);

  // the four guests, newest first, each with the day it went out
  const rowH = 150;
  const top = H - M - rowH * (INTERVIEWS.length - 1);
  INTERVIEWS.forEach((it, i) => {
    const y = top + i * rowH;
    font(ctx, 700, 118, -0.02);
    ctx.fillText(it.guest, M, y);
    font(ctx, 500, 54);
    right(ctx, displayDate(it.post_date), W - M, y);
  });
}

export function drawBackCover(ctx: Ctx) {
  ctx.fillStyle = BACK_COVER.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = BACK_COVER.ink;

  const name = fit(ctx, "the Motion Social Club", { weight: 700, maxWidth: W - 2 * M, maxHeight: 900, leading: 0.92, max: 300, min: 120, tracking: -0.035 });
  font(ctx, 700, name.size, -0.035);
  lines(ctx, name.lines, M - 6, M + name.size * 0.8, name.size * 0.92);

  font(ctx, 500, 60, -0.01);
  ctx.fillText("Read the conversations", M, H - M - 150);
  ctx.fillStyle = BACK_COVER.accent;
  const url = fit(ctx, PUBLICATION_URL, { weight: 600, maxWidth: W - 2 * M, maxHeight: 120, leading: 1, max: 96, min: 48, tracking: -0.01 });
  font(ctx, 600, url.size, -0.01);
  ctx.fillText(PUBLICATION_URL, M, H - M - 30);
}
