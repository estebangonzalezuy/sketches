/** Composes the object scene: back rings, medal, front rings, joke labels, footer. */
import { font } from "@/lib/tmsc/fonts";
import { alpha, palette } from "@/lib/tmsc/palettes";
import { jokeLabels, yearsOf } from "./answers";
import type { Answers } from "./data";
import { drawMedal } from "./medal";
import { drawRing, type Ring } from "./orbit";

export type ObjectFrame = { theta: number; orbit: number; orbitScale: number; palette: string; answers: Answers };

export function drawObject(ctx: CanvasRenderingContext2D, w: number, h: number, f: ObjectFrame) {
  const pal = palette(f.palette);
  const base = Math.min(w, h);
  const pad = base * 0.06;
  const wide = w / h > 1.2;
  const R = base * (wide ? 0.22 : 0.23);
  const cx = w / 2;
  const cy = h * (wide ? 0.47 : 0.47);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);

  const a = f.answers;
  // two steep rings, like an atom: the front of one passes under the medal, the other over it
  const Ro = R * 1.55 * f.orbitScale;
  const rings: Ring[] = [
    { radius: Ro, tilt: 0.6, phase: f.orbit, text: `MOTION, NOW · EASE IN · EASE OUT · ${a.role.toUpperCase()} · `, size: R * 0.15, weight: 700 },
    { radius: Ro * 1.1, tilt: -0.78, phase: -f.orbit + 1, text: `${a.handle || "@anonymous"} · ${yearsOf(a)} yrs · ${a.easing} · `, size: R * 0.11, weight: 500 },
  ];
  for (const r of rings) drawRing(ctx, cx, cy, r, pal.fg, "back");
  drawMedal(ctx, cx, cy, R, f.theta, pal, a);
  for (const r of rings) drawRing(ctx, cx, cy, r, pal.fg, "front");

  // technical joke labels with leader lines toward the object
  const labels = jokeLabels(a);
  const size = base * 0.026;
  ctx.font = font(size, 500);
  labels.forEach((text, i) => {
    const right = i % 2 === 1;
    const row = Math.floor(i / 2);
    const y = h * (wide ? [0.16, 0.5, 0.84][row] : [0.09, 0.15, 0.88][row]);
    const x = right ? w - pad : pad;
    ctx.fillStyle = pal.fg;
    ctx.textAlign = right ? "right" : "left";
    ctx.fillText(text, x, y);
    const tw = ctx.measureText(text).width;
    const lx = right ? x - tw - size * 0.6 : x + tw + size * 0.6;
    const ang = Math.atan2(y - size * 0.35 - cy, lx - cx);
    const ex = cx + Math.cos(ang) * R * 1.12;
    const ey = cy + Math.sin(ang) * R * 1.12;
    if (Math.abs(lx - cx) > Math.abs(ex - cx) + size) {
      ctx.fillStyle = alpha(pal.fg, 0.5);
      ctx.save();
      ctx.translate(lx, y - size * 0.35);
      ctx.rotate(Math.atan2(ey - (y - size * 0.35), ex - lx));
      ctx.fillRect(0, -1, Math.hypot(ex - lx, ey - (y - size * 0.35)), 2);
      ctx.restore();
    }
  });
  ctx.textAlign = "left";

  ctx.font = font(size, 600);
  ctx.fillStyle = pal.fg;
  ctx.fillText("tMSC: Motion, Now 2026", pad, h - pad * 0.8);
  ctx.textAlign = "right";
  ctx.fillText("Certificate of motion, not a real one", w - pad, h - pad * 0.8);
  ctx.textAlign = "left";
}
