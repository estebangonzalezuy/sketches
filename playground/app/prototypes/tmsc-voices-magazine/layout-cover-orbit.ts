import { font, right, type Ctx } from "./canvas-type";
import { displayDate, INTERVIEWS } from "./content";
import { PAGE_PX } from "./data";
import { dotType } from "./dot-type";
import type { CoverSetup } from "./setup";

/**
 * The typographic cover: "the Motion Social Club" as a pre-title, "Voices" built from dots in
 * a heavy slab serif, an orbit line spiralling around it with the club's letters in rings,
 * then the four guests and their dates. Same copy as the plain cover.
 */

export const SLAB_FAMILY = "tMSC Voices Slab";
const W = PAGE_PX.w;
const H = PAGE_PX.h;
const M = 92;
const ROW_H = 150;
const ORBIT_LETTERS = "MOTIONSOCIALCLUB";

/** A point on the orbit: an ellipse-ish spiral opening outwards from the title's middle. */
function orbitPoint(cx: number, cy: number, rx: number, ry: number, u: number): [number, number] {
  const a = -0.6 + u * Math.PI * 2 * 1.55;
  const grow = 0.42 + 0.58 * u;
  return [cx + Math.cos(a) * rx * grow, cy + Math.sin(a) * ry * grow];
}

export function drawOrbitCover(ctx: Ctx, cover: CoverSetup) {
  ctx.fillStyle = cover.color;
  ctx.fillRect(0, 0, W, H);
  const ink = cover.ink;
  ctx.fillStyle = ink;

  font(ctx, 500, 46);
  right(ctx, "tMSC", W - M, M + 40);

  const cx = W / 2;
  const cy = 800;
  const rx = 580;
  const ry = 360;

  // the orbit line goes under everything
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i <= 400; i++) {
    const [x, y] = orbitPoint(cx, cy, rx, ry, i / 400);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // pre-title above the orbit, then the dotted title
  font(ctx, 600, 58, -0.005);
  ctx.textAlign = "center";
  ctx.fillText("the Motion Social Club", cx, cy - ry - 90);
  ctx.textAlign = "left";
  const size = 360;
  dotType(ctx, "Voices", `800 ${size}px "${SLAB_FAMILY}"`, cx, cy + size * 0.33, { step: 14, ink });

  // the club's letters in rings along the outer turns
  const n = ORBIT_LETTERS.length;
  for (let i = 0; i < n; i++) {
    const [x, y] = orbitPoint(cx, cy, rx, ry, 0.34 + (0.66 * (i + 0.5)) / n);
    ctx.beginPath();
    ctx.arc(x, y, 44, 0, Math.PI * 2);
    ctx.fillStyle = cover.color;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, -0.2, 1, 0, 0); // an oblique, like the italic in the reference
    ctx.fillStyle = ink;
    font(ctx, 400, 52);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ORBIT_LETTERS[i], 0, 2);
    ctx.restore();
  }

  ctx.fillStyle = ink;
  font(ctx, 500, 60, -0.01);
  ctx.textAlign = "center";
  ctx.fillText("Four conversations", cx, cy + ry + 140);
  ctx.textAlign = "left";

  const top = H - M - ROW_H * (INTERVIEWS.length - 1);
  INTERVIEWS.forEach((it, i) => {
    const y = top + i * ROW_H;
    font(ctx, 700, 118, -0.02);
    ctx.fillText(it.guest, M, y);
    font(ctx, 500, 54);
    right(ctx, displayDate(it.post_date), W - M, y);
  });
}
