/** The medal: a scalloped seal with ribbon tails, faux-3D turning on its vertical axis. Flat colors only. */
import { font } from "@/lib/tmsc/fonts";
import type { Palette } from "@/lib/tmsc/palettes";
import { bezierPoint, bezierText, yearsOf } from "./answers";
import type { Answers } from "./data";

type Ctx = CanvasRenderingContext2D;
const SCALLOPS = 24;

function seal(ctx: Ctx, R: number) {
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const r = R * (1 + 0.055 * Math.cos(a * SCALLOPS));
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function tails(ctx: Ctx, R: number) {
  ctx.beginPath();
  for (const s of [-1, 1]) {
    ctx.moveTo(s * 0.12 * R, 0.55 * R);
    ctx.lineTo(s * 0.52 * R, 0.55 * R);
    ctx.lineTo(s * 0.62 * R, 1.62 * R);
    ctx.lineTo(s * 0.44 * R, 1.46 * R);
    ctx.lineTo(s * 0.26 * R, 1.62 * R);
    ctx.closePath();
  }
}

function centered(ctx: Ctx, text: string, y: number, size: number, weight: number, maxW: number) {
  ctx.font = font(size, weight);
  const w = ctx.measureText(text).width;
  if (w > maxW) ctx.font = font(size * (maxW / w), weight);
  ctx.fillText(text, 0, y);
}

function front(ctx: Ctx, R: number, a: Answers, ink: string) {
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  const max = R * 1.45;
  centered(ctx, "Certified", -R * 0.46, R * 0.15, 500, max);
  centered(ctx, "Motion", -R * 0.12, R * 0.4, 700, max);
  centered(ctx, "Designer", R * 0.24, R * 0.4, 700, max);
  centered(ctx, a.handle || "@anonymous", R * 0.48, R * 0.13, 600, R * 1.2);
  centered(ctx, `${a.role}, ${yearsOf(a)} yrs`, R * 0.66, R * 0.1, 500, R * 1.0);
}

function back(ctx: Ctx, R: number, a: Answers, ink: string) {
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  centered(ctx, "tMSC", -R * 0.5, R * 0.22, 700, R);
  // the favorite easing, plotted
  const s = R * 0.62;
  const x0 = -s / 2;
  const y0 = R * 0.28;
  ctx.strokeStyle = ink;
  ctx.lineWidth = R * 0.045;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const [px, py] = bezierPoint(a.easing, i / 48);
    const x = x0 + px * s;
    const y = y0 - py * s * 0.9;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  centered(ctx, bezierText(a.easing), R * 0.52, R * 0.1, 500, R * 1.3);
  centered(ctx, "Motion, Now 2026", R * 0.68, R * 0.1, 600, R);
}

/** θ = turn angle around the vertical axis. Faces are discs at z = ±T/2; the edge is stacked slices. */
export function drawMedal(ctx: Ctx, cx: number, cy: number, R: number, theta: number, pal: Palette, a: Answers) {
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  const sx = Math.max(0.015, Math.abs(c));
  const T = R * 0.16;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.save();
  ctx.scale(sx, 1);
  ctx.fillStyle = pal.fg;
  tails(ctx, R);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = pal.fg;
  const slices = 14;
  for (let k = 0; k <= slices; k++) {
    const z = (k / slices - 0.5) * T;
    ctx.save();
    ctx.translate(z * sn, 0);
    ctx.scale(sx, 1);
    seal(ctx, R);
    ctx.fill();
    ctx.restore();
  }

  const facing = c >= 0 ? 1 : -1;
  ctx.translate(facing * (T / 2) * sn, 0);
  ctx.scale(sx, 1);
  ctx.fillStyle = pal.accent === pal.fg ? pal.bg : pal.accent;
  seal(ctx, R);
  ctx.fill();
  const ink = pal.accent === pal.fg ? pal.fg : pal.bg;
  ctx.textBaseline = "alphabetic";
  if (facing > 0) front(ctx, R, a, ink);
  else back(ctx, R, a, ink);
  ctx.restore();
  ctx.textAlign = "left";
}
