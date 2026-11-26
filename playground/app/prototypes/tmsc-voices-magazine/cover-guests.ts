import { font, right, type Ctx } from "./canvas-type";
import { displayDate } from "./content";

/** The magazine's guests as listed on the covers: name and the day the post went out. */
export type CoverGuest = { name: string; date: string };

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** "Four conversations", "One conversation", "13 conversations". */
export function countLabel(n: number): string {
  return `${WORDS[n] ?? n} conversation${n === 1 ? "" : "s"}`;
}

/** Row height for n names so the list never climbs past `room` px (150 px rows for four). */
export const rowHeight = (n: number, room = 560) => Math.min(150, room / Math.max(1, n - 1));

/** Names left, dates right, the last row's baseline on `bottom`. Returns the first baseline. */
export function drawGuestRows(ctx: Ctx, guests: CoverGuest[], left: number, rightEdge: number, bottom: number): number {
  const rh = rowHeight(guests.length);
  const top = bottom - rh * (guests.length - 1);
  guests.forEach((g, i) => {
    const y = top + i * rh;
    font(ctx, 700, rh * 0.79, -0.02);
    ctx.fillText(g.name, left, y);
    font(ctx, 500, Math.min(54, rh * 0.36));
    right(ctx, displayDate(g.date), rightEdge, y);
  });
  return top;
}

/** The same names centred and stacked, for the artwork cover. Returns the last baseline. */
export function drawGuestStack(ctx: Ctx, guests: CoverGuest[], cx: number, first: number, room = 520): number {
  const lh = Math.min(98, room / Math.max(1, guests.length));
  ctx.textAlign = "center";
  font(ctx, 600, lh * 0.71, -0.01);
  guests.forEach((g, i) => ctx.fillText(g.name, cx, first + i * lh));
  ctx.textAlign = "left";
  return first + (guests.length - 1) * lh;
}
