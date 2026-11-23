/** Draws the respondent map: title, clusters (through the camera), key numbers, footer. */
import { font } from "@/lib/tmsc/fonts";
import { alpha, palette } from "@/lib/tmsc/palettes";
import { dotPitch } from "./clusters";
import { drift } from "./dots";
import type { MapScene } from "./scene";

type Ctx = CanvasRenderingContext2D;

function fitText(ctx: Ctx, text: string, size: number, weight: number, maxW: number): number {
  ctx.font = font(size, weight);
  const w = ctx.measureText(text).width;
  return w > maxW ? size * (maxW / w) : size;
}

function drawClusters(ctx: Ctx, sc: MapScene, fg: string, dot: string) {
  const { layout, dots, s, now } = sc;
  const amount = s.reduced ? 0 : s.drift * dotPitch(s.dotSize) * 1.4;
  const r = s.dotSize;
  ctx.save();
  ctx.translate(sc.view.tx, sc.view.ty);
  ctx.scale(sc.view.s, sc.view.s);
  layout.clusters.forEach((c, ci) => {
    ctx.fillStyle = alpha(dot, sc.dim[ci]);
    ctx.beginPath();
    for (const m of c.members) {
      const [dx, dy] = drift(m, now, amount);
      const x = dots.x[m] + dx;
      const y = dots.y[m] + dy;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    // label + count, centered over the disc; fades while zoomed (the title takes over)
    const a = sc.dim[ci] * (1 - sc.zoom);
    if (a < 0.01) return;
    const name = c.label;
    const count = ` ${c.count}`;
    let size = layout.labelSize;
    ctx.font = font(size, 600);
    const total = ctx.measureText(name).width + ctx.measureText(count).width;
    if (total > layout.cellW * 0.94) size *= (layout.cellW * 0.94) / total;
    ctx.font = font(size, 600);
    const nw = ctx.measureText(name).width;
    ctx.font = font(size, 400);
    const cw = ctx.measureText(count).width;
    const x0 = c.cx - (nw + cw) / 2;
    const y = c.labelY;
    ctx.fillStyle = alpha(fg, a);
    ctx.font = font(size, 600);
    ctx.fillText(name, x0, y);
    ctx.fillStyle = alpha(fg, a * 0.55);
    ctx.font = font(size, 400);
    ctx.fillText(count, x0 + nw, y);
  });
  ctx.restore();
}

function drawKeyNumbers(ctx: Ctx, sc: MapScene, fg: string, accent: string) {
  const a = Math.max(0, (sc.zoom - 0.5) * 2);
  if (a <= 0 || sc.focus < 0) return;
  const { w, h, frame } = sc;
  const wide = w / h > 1.2;
  const size = Math.min(w, h) * (wide ? 0.11 : 0.085);
  const cap = size * 0.3;
  sc.stats.forEach((k, i) => {
    const x = wide ? w * 0.58 : frame.pad + i * ((w - frame.pad * 2) / 3);
    const y = wide ? frame.top + size * 0.9 + i * size * 1.45 : h * 0.78;
    const rise = (1 - a) * size * 0.3;
    ctx.fillStyle = alpha(accent, a);
    ctx.font = font(size, 700);
    ctx.fillText(k.value, x, y + rise);
    ctx.fillStyle = alpha(fg, a);
    ctx.font = font(cap, 500);
    ctx.fillText(k.caption, x, y + cap * 1.4 + rise);
  });
}

export function drawMap(ctx: Ctx, sc: MapScene) {
  const { w, h, frame } = sc;
  const pal = palette(sc.s.palette);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);

  drawClusters(ctx, sc, pal.fg, pal.accent);

  // title: "Motion, Now", swapping to the zoomed group's name
  const wide = w / h > 1.2;
  const big = Math.min(w, h) * (wide ? 0.17 : 0.16);
  const tY = frame.pad + big * 0.78;
  const titleA = 1 - sc.zoom;
  if (titleA > 0.01) {
    ctx.fillStyle = alpha(pal.fg, titleA);
    ctx.font = font(big, 700);
    ctx.fillText("Motion, Now", frame.pad - big * 0.03, tY);
  }
  if (sc.focus >= 0 && sc.zoom > 0.01) {
    const c = sc.layout.clusters[sc.focus];
    const size = fitText(ctx, c.label, big, 700, w - frame.pad * 2);
    ctx.fillStyle = alpha(pal.fg, sc.zoom);
    ctx.font = font(size, 700);
    ctx.fillText(c.label, frame.pad - size * 0.03, frame.pad + size * 0.78);
    ctx.fillStyle = alpha(pal.fg, sc.zoom * 0.55);
    ctx.font = font(size * 0.3, 500);
    ctx.fillText(`${c.count} of ${sc.people.length} respondents`, frame.pad, frame.pad + size * 0.78 + size * 0.36);
  }
  drawKeyNumbers(ctx, sc, pal.fg, pal.accent);

  // footer
  const fs = Math.min(w, h) * 0.022;
  ctx.font = font(fs, 500);
  ctx.fillStyle = alpha(pal.fg, 0.75);
  ctx.fillText(`tMSC: Motion, Now 2026 · n=${sc.people.length} · Example data`, frame.pad, h - frame.pad * 0.7);
  ctx.textAlign = "right";
  ctx.fillText(`Grouped by ${sc.s.group.toLowerCase()}`, w - frame.pad, h - frame.pad * 0.7);
  ctx.textAlign = "left";
}
