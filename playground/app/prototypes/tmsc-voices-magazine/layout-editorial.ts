import { font, right, wrap, type Ctx } from "./canvas-type";
import { displayDate, interview, PUBLICATION_URL, seriesLabel } from "./content";
import type { EditorialSetup } from "./controls";
import { PAGE_PX } from "./data";
import { columns, EDITORIAL, flow, wrapWords, type Frame, type Line } from "./editorial-flow";
import type { MediaChoice } from "./media";

/** The Q&A spread after each intro spread: the conversation in columns, with up to two images. */

const W = PAGE_PX.w;
const H = PAGE_PX.h;
const M = 92;
const GUTTER = 44;
const TEXT_SIZE = { Small: 28, Medium: 34, Large: 42 } as const;
const pad2 = (n: number) => String(n).padStart(2, "0");

export type EditorialImage = { img: HTMLImageElement; choice: NonNullable<MediaChoice> } | null;

type Placed = { x: number; y: number; w: number; h: number };
export type EditorialLayout = { left: Line[]; right: Line[]; size: number; standfirst: string[]; top: Placed | null; bottom: Placed | null; tail: Line[] };

/** Image box anchored at its top-left, as large as `maxW × maxH` allows at its own ratio. */
function placeImage(img: HTMLImageElement, x: number, y: number, maxW: number, maxH: number): Placed {
  const s = Math.min(maxW / img.width, maxH / img.height);
  return { x, y, w: img.width * s, h: img.height * s };
}

/** Lays out both pages at once, so text continues from the left page onto the right. */
export function layoutEditorial(ctx: Ctx, order: 1 | 2 | 3 | 4, setup: EditorialSetup, a: EditorialImage, b: EditorialImage): EditorialLayout {
  const size = TEXT_SIZE[setup.textSize];
  const lead = Math.round(size * 1.34);
  const it = interview(order);

  font(ctx, 600, 64, -0.015);
  const standfirst = wrap(ctx, it.subtitle ?? "", W - 2 * M);
  const textTop = M + 150 + standfirst.length * 74 + 60;
  const colH = (h: number) => Math.max(0, h);
  const bottomEdge = H - M - 70;

  // image 2 sits at the foot of the left page, image 1 at the head of the right page
  const bottom = b ? placeImage(b.img, M, 0, (W - 2 * M) * setup.imageScale, H * 0.3 * setup.imageScale) : null;
  if (bottom) bottom.y = bottomEdge - bottom.h;
  const top = a ? placeImage(a.img, M, M + 90, (W - 2 * M) * setup.imageScale, H * 0.36 * setup.imageScale) : null;

  const leftEnd = bottom ? bottom.y - 90 : bottomEdge;
  const rightStart = top ? top.y + top.h + 110 : M + 90;
  const frames: Frame[] = [
    ...columns(0, M, textTop, W - 2 * M, colH(leftEnd - textTop), setup.columns, GUTTER),
    ...columns(1, M, rightStart, W - 2 * M, colH(bottomEdge - rightStart), setup.columns, GUTTER),
  ];
  const measure = (s: string, bold: boolean) => {
    font(ctx, bold ? 700 : 400, size);
    return ctx.measureText(s).width;
  };
  const { lines } = flow(EDITORIAL[String(order) as "1"], frames, lead, Math.round(lead * 0.5), measure);
  // "read the rest" under the last paragraph, wrapped to its column, only if it all fits
  const last = lines[lines.length - 1];
  const tailFrame = frames.find((f) => last && f.page === last.page && f.x === last.x);
  let tail: Line[] = [];
  if (last && tailFrame) {
    const words = wrapWords(`Read the full conversation at ${PUBLICATION_URL}`, tailFrame.w, (s) => measure(s, true));
    const y0 = last.y + lead * 1.6;
    if (y0 + words.length * lead <= tailFrame.y + tailFrame.h) tail = words.map((text, i) => ({ page: last.page, x: last.x, y: y0 + i * lead, text, bold: true }));
  }
  return { left: lines.filter((l) => l.page === 0), right: lines.filter((l) => l.page === 1), size, standfirst, top, bottom, tail };
}

function drawLines(ctx: Ctx, lines: Line[], size: number) {
  for (const l of lines) {
    font(ctx, l.bold ? 700 : 400, size);
    ctx.fillText(l.text, l.x, l.y + size);
  }
}

function drawImage(ctx: Ctx, img: EditorialImage, box: Placed | null) {
  if (!img || !box) return;
  const ink = ctx.fillStyle;
  ctx.drawImage(img.img, box.x, box.y, box.w, box.h);
  ctx.fillStyle = ink;
  font(ctx, 400, 30);
  right(ctx, img.choice.asset.credit, box.x + box.w, box.y + box.h + 42);
}

function drawTail(ctx: Ctx, L: EditorialLayout, page: 0 | 1) {
  drawLines(ctx, L.tail.filter((l) => l.page === page), L.size);
}

export function drawEditorialLeft(ctx: Ctx, order: 1 | 2 | 3 | 4, setup: EditorialSetup, L: EditorialLayout, b: EditorialImage, folio: number) {
  const it = interview(order);
  ctx.fillStyle = setup.ink.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = setup.ink.ink;
  font(ctx, 500, 40);
  ctx.fillText(`${seriesLabel(it)} · ${it.guest}`, M, M + 34);
  right(ctx, displayDate(it.post_date), W - M, M + 34);
  font(ctx, 600, 64, -0.015);
  L.standfirst.forEach((s, i) => ctx.fillText(s, M, M + 150 + i * 74));
  drawLines(ctx, L.left, L.size);
  drawTail(ctx, L, 0);
  drawImage(ctx, b, L.bottom);
  font(ctx, 500, 42);
  ctx.fillText(pad2(folio), M, H - M + 8);
}

export function drawEditorialRight(ctx: Ctx, order: 1 | 2 | 3 | 4, setup: EditorialSetup, L: EditorialLayout, a: EditorialImage, folio: number) {
  ctx.fillStyle = setup.ink.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = setup.ink.ink;
  font(ctx, 500, 40);
  right(ctx, interview(order).guest, W - M, M + 34);
  drawImage(ctx, a, L.top);
  drawLines(ctx, L.right, L.size);
  drawTail(ctx, L, 1);
  font(ctx, 500, 42);
  right(ctx, pad2(folio), W - M, H - M + 8);
}
