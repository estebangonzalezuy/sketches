import { fit, font, imageFill, imageFit, lines, right, wrap, type Ctx } from "./canvas-type";
import { displayDate, heroQuote, interview, pageTitle, roleLabel, seriesLabel } from "./content";
import { PAGE_PX, SPREADS } from "./data";

/** The two pages of one interview spread, drawn at the design size (PAGE_PX). */

const W = PAGE_PX.w;
const H = PAGE_PX.h;
const M = 92;
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Left page: who, what, and one image from the post (credited), as picked in the panel. */
export type LeftImage = { img: HTMLImageElement; credit: string; fill: boolean } | null;

export function drawInterviewLeft(ctx: Ctx, order: 1 | 2 | 3 | 4, image: LeftImage) {
  const it = interview(order);
  const { bg, ink } = SPREADS[order].left;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ink;

  font(ctx, 500, 50);
  ctx.fillText(seriesLabel(it), M, M + 40);
  right(ctx, displayDate(it.post_date), W - M, M + 40);

  // name, one word per line, as large as the width allows
  const words = it.guest.split(" ");
  const name = fit(ctx, words.reduce((a, b) => (a.length > b.length ? a : b)), {
    weight: 700, maxWidth: W - 2 * M, maxHeight: 400, leading: 1, max: 300, min: 120, tracking: -0.04,
  });
  font(ctx, 700, name.size, -0.04);
  const nameBase = lines(ctx, words, M - 8, 210 + name.size * 0.76, name.size * 0.9);

  font(ctx, 500, 70, -0.015);
  const title = wrap(ctx, pageTitle(it), W - 2 * M);
  const titleBase = lines(ctx, title, M, nameBase + 150, 78);

  font(ctx, 400, 48);
  const role = wrap(ctx, roleLabel(it), W - 2 * M);
  const roleBase = lines(ctx, role, M, titleBase + 90, 58);

  if (image) {
    const top = roleBase + 90;
    const place = image.fill ? imageFill : imageFit;
    const box = place(ctx, image.img, M, top, W - 2 * M, H - M - 90 - top);
    font(ctx, 400, 38);
    right(ctx, image.credit, box.x + box.w, box.y + box.h + 52);
  }

  font(ctx, 500, 42);
  ctx.fillText(pad2(order * 2), M, H - M + 8);
}

/** Right page: the hero quote, verbatim, and who said it. */
export function drawInterviewRight(ctx: Ctx, order: 1 | 2 | 3 | 4) {
  const it = interview(order);
  const { bg, ink } = SPREADS[order].right;
  const q = heroQuote(it, SPREADS[order].heroQuote);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ink;

  font(ctx, 500, 50);
  ctx.fillText(it.guest, M, M + 40);
  right(ctx, `${pad2(order)} / 04`, W - M, M + 40);

  const text = `“${q.text}”`;
  const top = 300;
  const bottom = H - M - 260;
  const quote = fit(ctx, text, { weight: 700, maxWidth: W - 2 * M, maxHeight: bottom - top, leading: 1.02, max: 190, min: 64, tracking: -0.025 });
  font(ctx, 700, quote.size, -0.025);
  // hanging open quote: the first line starts the width of “ further left
  const hang = ctx.measureText("“").width;
  ctx.fillText(quote.lines[0], M - hang, top + quote.size * 0.8);
  const last = lines(ctx, quote.lines.slice(1), M, top + quote.size * 0.8 + quote.size * 1.02, quote.size * 1.02);

  font(ctx, 500, 66, -0.01);
  ctx.fillText(`— ${q.attribution}`, M, Math.max(last, top + quote.size * 0.8) + 150);

  font(ctx, 500, 42);
  right(ctx, pad2(order * 2 + 1), W - M, H - M + 8);
}
