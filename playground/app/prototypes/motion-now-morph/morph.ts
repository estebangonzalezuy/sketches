/** The morph as a pure function of progress p (0 = cloud, 1 = chart). Scrubs both ways. */
import { EASES, clamp01, lerp, power3InOut, segment } from "@/lib/tmsc/ease";
import { font } from "@/lib/tmsc/fonts";
import { alpha, CHAPTERS, palette, type ChapterName } from "@/lib/tmsc/palettes";
import { gaussian, mulberry32, wobble } from "@/lib/tmsc/random";
import { fitSize } from "@/lib/tmsc/text";
import { MARKS } from "./data";
import type { Box, Slots } from "./slots";

export type Geometry = { chart: Box; pad: number; wide: boolean };

export function geometry(w: number, h: number): Geometry {
  const wide = w / h > 1.2;
  const pad = Math.round(Math.min(w, h) * 0.06);
  const top = pad * 1.4;
  return { pad, wide, chart: { x: pad, y: top, w: w - pad * 2, h: h * (wide ? 0.58 : 0.6) - top } };
}

export function cloud(n: number, w: number, h: number): { x: Float32Array; y: Float32Array } {
  const rng = mulberry32(42);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = w / 2 + Math.max(-2.2, Math.min(2.2, gaussian(rng))) * w * 0.17;
    y[i] = h * 0.46 + Math.max(-2.2, Math.min(2.2, gaussian(rng))) * h * 0.15;
  }
  return { x, y };
}

/** Each dot's local 0..1, delayed by its rank so dots leave in a sweep. */
export function local(p: number, rank: number, n: number, stagger: number): number {
  const delay = n > 1 ? (rank / (n - 1)) * stagger : 0;
  return clamp01((p - delay) / Math.max(1e-6, 1 - stagger));
}

export type MorphState = {
  chapter: ChapterName;
  p: number;
  now: number;
  easing: keyof typeof EASES;
  stagger: number;
  cloud: { x: Float32Array; y: Float32Array };
  slots: Slots;
  /** The previous chapter's slots and how far (0..1) the switch to `slots` has gone. */
  prev: Slots | null;
  blend: number;
  n: number;
};

export function drawMorph(ctx: CanvasRenderingContext2D, w: number, h: number, s: MorphState) {
  const ch = CHAPTERS[s.chapter];
  const dark = palette(ch.dark);
  const color = palette(ch.color);
  const g = geometry(w, h);
  const ease = EASES[s.easing];
  ctx.textBaseline = "alphabetic";

  // flat background, then the chapter color wiping up from the bottom
  ctx.fillStyle = dark.bg;
  ctx.fillRect(0, 0, w, h);
  const wipeTop = h * (1 - power3InOut(segment(s.p, MARKS.wipe[0], MARKS.wipe[1])));
  ctx.fillStyle = color.bg;
  ctx.fillRect(0, wipeTop, w, h - wipeTop);

  // dots: one color above the wipe line, the other below it
  const r = lerp(Math.min(w, h) * 0.006, s.slots.r, ease(s.p));
  const b = power3InOut(s.blend);
  const paths = [new Path2D(), new Path2D()];
  for (let i = 0; i < s.n; i++) {
    const t = ease(local(s.p, s.slots.order[i], s.n, s.stagger));
    let tx = s.slots.x[i];
    let ty = s.slots.y[i];
    if (s.prev && b < 1) {
      tx = lerp(s.prev.x[i], tx, b);
      ty = lerp(s.prev.y[i], ty, b);
    }
    const loose = (1 - t) * Math.min(w, h) * 0.012;
    const x = lerp(s.cloud.x[i], tx, t) + wobble(i * 0.37, s.now * 0.5) * loose;
    const y = lerp(s.cloud.y[i], ty, t) + wobble(i * 0.37 + 5, s.now * 0.45) * loose;
    const path = paths[y > wipeTop ? 1 : 0];
    path.moveTo(x + r, y);
    path.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fillStyle = dark.accent;
  ctx.fill(paths[0]);
  ctx.fillStyle = color.fg;
  ctx.fill(paths[1]);

  // chart labels
  const la = segment(s.p, MARKS.labels[0], MARKS.labels[1]) * (s.prev ? b : 1);
  if (la > 0) {
    for (const l of s.slots.labels) {
      ctx.font = font(s.slots.labelSize * (l.strong ? 1 : 0.9), l.strong ? 700 : 500);
      ctx.fillStyle = alpha(color.fg, la);
      ctx.textAlign = l.align;
      ctx.fillText(l.text, l.x, l.y);
    }
    ctx.textAlign = "left";
  }

  // giant chapter title sliding up from below
  const title = `${ch.number} ${s.chapter}`;
  const size = fitSize(ctx, title, w - g.pad * 2, 1, h * (g.wide ? 0.28 : 0.22), 40, (z) => font(z, 700));
  const restY = h - g.pad * 1.5;
  const tp = power3InOut(segment(s.p, MARKS.title[0], MARKS.title[1]));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, restY - size, w, size * 1.2);
  ctx.clip();
  ctx.font = font(size, 700);
  ctx.fillStyle = color.fg;
  ctx.fillText(title, g.pad - size * 0.03, restY + (1 - tp) * size * 1.2);
  ctx.restore();

  // footer
  const fs = Math.min(w, h) * 0.022;
  const footY = h - g.pad * 0.55;
  ctx.font = font(fs, 500);
  ctx.fillStyle = wipeTop < footY - fs ? color.fg : dark.fg;
  ctx.fillText(`tMSC: Motion, Now 2026 · n=${s.n} · Example data`, g.pad, footY);
}
