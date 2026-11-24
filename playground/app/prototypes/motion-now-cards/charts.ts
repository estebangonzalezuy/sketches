/** The mini charts that back a finding. Each is a pure function of time t (seconds since Play). */
import { expoOut, power3Out, segment } from "@/lib/tmsc/ease";
import { font } from "@/lib/tmsc/fonts";
import { alpha } from "@/lib/tmsc/palettes";
import { mulberry32, shuffled } from "@/lib/tmsc/random";
import { CHART_START } from "./data";
import type { Box, CardColors } from "./types";

type Ctx = CanvasRenderingContext2D;
const BAR_STAGGER = 0.04;

/** Bars grow from the baseline, 40ms apart. The tallest bar takes the accent. */
export function drawBars(ctx: Ctx, b: Box, data: number[], t: number, c: CardColors) {
  const vals = data.length ? data : [1];
  const max = Math.max(...vals, 1e-9);
  const gap = Math.min(24, (b.w / vals.length) * 0.18);
  const bw = (b.w - gap * (vals.length - 1)) / vals.length;
  const top = Math.max(...vals);
  const labelSize = Math.min(34, bw * 0.42);
  vals.forEach((v, i) => {
    const p = power3Out(segment(t, CHART_START + i * BAR_STAGGER, 0.7));
    const h = Math.max(0, (v / max) * (b.h - labelSize * 1.6)) * p;
    const x = b.x + i * (bw + gap);
    ctx.fillStyle = v === top ? c.accent : alpha(c.fg, 0.3);
    ctx.fillRect(x, b.y + b.h - h, bw, h);
    if (p > 0.6 && labelSize > 12) {
      ctx.globalAlpha = (p - 0.6) / 0.4;
      ctx.fillStyle = c.fg;
      ctx.font = font(labelSize, 500);
      ctx.textAlign = "center";
      ctx.fillText(String(v), x + bw / 2, b.y + b.h - h - labelSize * 0.45);
      ctx.globalAlpha = 1;
    }
  });
  ctx.textAlign = "left";
}

/** 100 dots, `share` of them filled in random order. */
export function drawDotGrid(ctx: Ctx, b: Box, share: number, t: number, c: CardColors) {
  // 10×10 in squarish space, 20×5 in a wide strip
  const cols = b.w / b.h > 1.8 ? 20 : 10;
  const rows = 100 / cols;
  const cell = Math.min(b.w / cols, b.h / rows);
  const r = cell * 0.36;
  const x0 = b.x;
  const y0 = b.y + b.h - cell * rows;
  const order = shuffled(Array.from({ length: 100 }, (_, i) => i), mulberry32(7));
  const filled = Math.round(share);
  for (let i = 0; i < 100; i++) {
    const cx = x0 + (i % cols) * cell + cell / 2;
    const cy = y0 + Math.floor(i / cols) * cell + cell / 2;
    const rank = order.indexOf(i);
    const on = rank < filled;
    const p = on ? power3Out(segment(t, CHART_START + (rank / Math.max(1, filled)) * 0.9, 0.25)) : 0;
    ctx.fillStyle = alpha(c.fg, 0.2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    if (p > 0) {
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, r * p, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A line drawn left to right, ending on a dot. */
export function drawLine(ctx: Ctx, b: Box, data: number[], t: number, c: CardColors) {
  const vals = data.length > 1 ? data : [0, ...(data.length ? data : [1])];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pad = 24;
  const pts = vals.map((v, i) => ({
    x: b.x + pad + (i / (vals.length - 1)) * (b.w - pad * 2),
    y: b.y + pad + (1 - (v - min) / span) * (b.h - pad * 2),
  }));
  ctx.fillStyle = alpha(c.fg, 0.3);
  ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
  const p = power3Out(segment(t, CHART_START, 1.1));
  const reach = p * (pts.length - 1);
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = Math.max(4, b.h * 0.035);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  let end = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const f = Math.min(1, reach - (i - 1));
    if (f <= 0) break;
    end = { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
    ctx.lineTo(end.x, end.y);
  }
  ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.arc(end.x, end.y, ctx.lineWidth * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

/** A ring that sweeps to `share` percent. */
export function drawDonut(ctx: Ctx, b: Box, share: number, t: number, c: CardColors) {
  const r = Math.min(b.w, b.h) / 2;
  const cx = b.x + r;
  const cy = b.y + b.h / 2;
  const thick = r * 0.34;
  ctx.lineWidth = thick;
  ctx.lineCap = "butt";
  ctx.strokeStyle = alpha(c.fg, 0.2);
  ctx.beginPath();
  ctx.arc(cx, cy, r - thick / 2, 0, Math.PI * 2);
  ctx.stroke();
  const p = expoOut(segment(t, CHART_START, 1.2));
  ctx.strokeStyle = c.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, r - thick / 2, -Math.PI / 2, -Math.PI / 2 + (share / 100) * Math.PI * 2 * p);
  ctx.stroke();
}

/** Two bars, before and after. */
export function drawPair(ctx: Ctx, b: Box, data: number[], t: number, c: CardColors) {
  const [before = 0, after = 0] = data;
  const max = Math.max(before, after, 1e-9);
  const rowH = b.h / 2;
  const label = Math.min(40, rowH * 0.3);
  [["Before", before], ["After", after]].forEach(([name, v], i) => {
    const p = power3Out(segment(t, CHART_START + i * 0.25, 0.8));
    const y = b.y + i * rowH;
    ctx.fillStyle = c.fg;
    ctx.font = font(label, 500);
    ctx.fillText(`${name}  ${v}`, b.x, y + label);
    const barY = y + label * 1.45;
    const barH = rowH - label * 1.45 - rowH * 0.18;
    ctx.fillStyle = i === 0 ? alpha(c.fg, 0.3) : c.accent;
    ctx.fillRect(b.x, barY, b.w * ((v as number) / max) * p, barH);
  });
}
