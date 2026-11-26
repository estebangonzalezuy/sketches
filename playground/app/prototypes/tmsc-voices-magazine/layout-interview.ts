import { fit, font, imageFill, imageFit, lines, right, wrap, type Ctx } from "./canvas-type";
import { displayDate } from "./content";
import { PAGE_PX } from "./data";
import type { FeatureData } from "./feature-data";

/** The intro spread of a feature, drawn at the design size (PAGE_PX). */

const W = PAGE_PX.w;
const H = PAGE_PX.h;
const M = 92;
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Left page: who, what, and one image from the post (credited), as picked in the editor. */
export type LeftImage = { img: HTMLImageElement; credit: string; fill: boolean; scale: number } | null;

export function drawInterviewLeft(ctx: Ctx, f: FeatureData, image: LeftImage, folio: number) {
  const { bg, ink } = f.left;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ink;

  font(ctx, 500, 50);
  ctx.fillText(f.series, M, M + 40);
  right(ctx, displayDate(f.date), W - M, M + 40);

  // name, one word per line, as large as the width allows
  const words = f.guest.split(" ");
  const name = fit(ctx, words.reduce((a, b) => (a.length > b.length ? a : b)), {
    weight: 700, maxWidth: W - 2 * M, maxHeight: 400, leading: 1, max: 300, min: 120, tracking: -0.04,
  });
  font(ctx, 700, name.size, -0.04);
  const nameBase = lines(ctx, words, M - 8, 210 + name.size * 0.76, name.size * 0.9);

  font(ctx, 500, 70, -0.015);
  const title = wrap(ctx, f.title, W - 2 * M).slice(0, 3);
  const titleBase = lines(ctx, title, M, nameBase + 150, 78);

  // the post's subtitle, where the guest's role used to be (at most three lines)
  font(ctx, 400, 44);
  const sub = wrap(ctx, f.subtitle, W - 2 * M).slice(0, 3);
  const roleBase = sub.length ? lines(ctx, sub, M, titleBase + 90, 54) : titleBase;

  if (image) {
    const top = roleBase + 90;
    const place = image.fill ? imageFill : imageFit;
    // the size slider shrinks the image's box, keeping it on the bottom-left corner
    const bw = (W - 2 * M) * image.scale;
    const bh = (H - M - 90 - top) * image.scale;
    const box = place(ctx, image.img, M, H - M - 90 - bh, bw, bh);
    font(ctx, 400, 38);
    right(ctx, image.credit, box.x + box.w, box.y + box.h + 52);
  }

  font(ctx, 500, 42);
  ctx.fillText(pad2(folio), M, H - M + 8);
}

/** Right page: the hero quote, verbatim, and who said it. */
export function drawInterviewRight(ctx: Ctx, f: FeatureData, n: number, total: number, folio: number) {
  const { bg, ink } = f.right;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ink;

  font(ctx, 500, 50);
  ctx.fillText(f.guest, M, M + 40);
  right(ctx, `${pad2(n)} / ${pad2(total)}`, W - M, M + 40);

  const text = `“${f.quote}”`;
  const top = 300;
  const bottom = H - M - 260;
  const quote = fit(ctx, text, { weight: 700, maxWidth: W - 2 * M, maxHeight: bottom - top, leading: 1.02, max: 190, min: 64, tracking: -0.025 });
  font(ctx, 700, quote.size, -0.025);
  // hanging open quote: the first line starts the width of “ further left
  const hang = ctx.measureText("“").width;
  ctx.fillText(quote.lines[0], M - hang, top + quote.size * 0.8);
  const last = lines(ctx, quote.lines.slice(1), M, top + quote.size * 0.8 + quote.size * 1.02, quote.size * 1.02);

  font(ctx, 500, 66, -0.01);
  ctx.fillText(`— ${f.guest}`, M, Math.max(last, top + quote.size * 0.8) + 150);

  font(ctx, 500, 42);
  right(ctx, pad2(folio), W - M, H - M + 8);
}
