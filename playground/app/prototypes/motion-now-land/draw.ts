/** Draws the landing card at any size (1200×630 share image by default). */
import { bounceOut, segment, power3Out } from "@/lib/tmsc/ease";
import { font } from "@/lib/tmsc/fonts";
import { alpha, palette } from "@/lib/tmsc/palettes";
import { fitSize, wrap } from "@/lib/tmsc/text";
import { DROP_DUR, MIN_GROUP, type Currency, type Metric } from "./data";
import { formatValue } from "./land";
import type { LandScene } from "./scene";

type Ctx = CanvasRenderingContext2D;
export type LandView = { palette: string; metric: Metric; currency: Currency; n: number };

function heading(ctx: Ctx, text: string, x: number, y: number, maxW: number, maxSize: number, color: string, lines = 2) {
  const size = fitSize(ctx, text, maxW, lines, maxSize, maxSize * 0.4, (s) => font(s, 700));
  ctx.font = font(size, 700);
  ctx.fillStyle = color;
  wrap(ctx, text, maxW).forEach((line, i) => ctx.fillText(line, x, y + size * 0.82 + i * size * 0.98));
}

export function drawLand(ctx: Ctx, w: number, h: number, sc: LandScene, v: LandView) {
  const pal = palette(v.palette);
  const pad = Math.round(Math.min(w, h) * 0.07);
  const tall = h > w;
  const l = sc.landing;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);

  const headH = h * (tall ? 0.3 : 0.32);
  const chart = { x: pad, y: pad + headH, w: w - pad * 2, h: h - pad * 3.4 - headH };
  const big = Math.min(w * 0.075, h * (tall ? 0.07 : 0.1));
  const landed = segment(sc.now, sc.dropAt + DROP_DUR * 0.85, 0.35);

  if (!l.enough) {
    heading(ctx, "Not enough answers for this group yet", pad, pad, w - pad * 2, big, pal.fg);
    ctx.font = font(big * 0.32, 500);
    ctx.fillStyle = alpha(pal.fg, 0.7);
    ctx.fillText(`${l.n} answers · needs ${MIN_GROUP}`, pad, pad + headH * 0.92);
  } else if (sc.sentence) {
    ctx.globalAlpha = landed;
    ctx.save();
    ctx.translate(0, (1 - power3Out(landed)) * big * 0.4);
    heading(ctx, sc.sentence, pad, pad, w - pad * 2, big, pal.fg);
    ctx.restore();
    ctx.globalAlpha = 1;
  } else heading(ctx, "Where do you land?", pad, pad, w - pad * 2, big, pal.fg);

  const pres = sc.presence;
  const x = (val: number) => chart.x + (Math.min(val, sc.max) / Math.max(1e-9, sc.max)) * chart.w;
  const base = chart.y + chart.h;
  const small = Math.max(12, Math.min(w, h) * 0.028);

  if (pres > 0.01 && sc.bars.length) {
    // solid bars; the median line is knocked out of them and continues above in ink
    const bw = chart.w / sc.bars.length;
    const barH = (b: number) => b * chart.h * 0.82;
    ctx.fillStyle = alpha(pal.fg, pres);
    sc.bars.forEach((b, i) => ctx.fillRect(chart.x + i * bw + bw * 0.06, base - barH(b), bw * 0.88, barH(b)));
    const mx = x(sc.median);
    const under = barH(sc.bars[Math.min(sc.bars.length - 1, Math.floor((sc.median / sc.max) * sc.bars.length))] ?? 0);
    ctx.fillRect(mx - 2, chart.y, 4, chart.h - under);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(mx - 2, base - under, 4, under);
    ctx.fillStyle = alpha(pal.fg, pres);
    ctx.font = font(small * 1.25, 700);
    const label = `Median ${formatValue(sc.median, v.metric, v.currency)}`;
    const left = l.enough && l.you !== null && sc.youX > sc.median;
    ctx.textAlign = left ? "right" : "left";
    ctx.fillText(label, mx + (left ? -small * 0.5 : small * 0.5), chart.y + small * 1.1);
    ctx.textAlign = "left";
    // axis, then the 25–75 band as a flat strip under it
    ctx.fillRect(chart.x, base, chart.w, 2);
    const bandY = base + small * 0.6;
    ctx.fillRect(x(sc.q25), bandY, x(sc.q75) - x(sc.q25), small * 0.5);
    ctx.font = font(small, 500);
    ctx.fillText("Middle 50%", x(sc.q75) + small * 0.5, bandY + small * 0.55);
    if (l.enough) {
      const every = Math.ceil(l.edges.length / (tall ? 4 : 7));
      ctx.fillStyle = alpha(pal.fg, 0.7 * pres);
      l.edges.forEach((e, i) => i % every === 0 && ctx.fillText(formatValue(e * (sc.max / l.max), v.metric, v.currency), chart.x + (i / l.edges.length) * chart.w, bandY + small * 2.1));
    }
  }

  // the marker drops onto the user's position
  if (l.enough && l.you !== null && pres > 0.5) {
    const t = segment(sc.now, sc.dropAt, DROP_DUR);
    const r = Math.min(w, h) * 0.028;
    const mx = x(sc.youX);
    const bin = Math.min(sc.bars.length - 1, Math.floor((Math.min(sc.youX, sc.max - 1e-9) / sc.max) * sc.bars.length));
    const barTop = base - (sc.bars[bin] ?? 0) * chart.h * 0.82;
    const rest = Math.min(barTop, base - chart.h * 0.08) - r * 1.6;
    const y = chart.y - r * 6 + (rest - (chart.y - r * 6)) * bounceOut(t);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(mx - 1.5, y, 3, barTop - y);
    ctx.fillStyle = pal.accent === pal.fg ? pal.bg : pal.accent;
    ctx.fillRect(mx - 1.5, barTop, 3, base - barTop);
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.arc(mx, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = font(r * 1.2, 700);
    ctx.textAlign = "center";
    ctx.fillText("You", mx, y - r * 1.5);
    ctx.textAlign = "left";
  }

  ctx.font = font(small, 500);
  ctx.fillStyle = alpha(pal.fg, 0.8);
  ctx.fillText(`tMSC: Motion, Now 2026 · n=${v.n} · Example data`, pad, h - pad * 0.55);
}
