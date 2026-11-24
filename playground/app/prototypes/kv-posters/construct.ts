import { bounds } from "./bounds";
import type { Pen } from "./draw-shapes";
import { notesFor } from "./notes";
import { outlinesOf, type Stroke } from "./outlines";
import type { Element } from "./types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Brand-reveal construction for one element at progress k (0 → 1):
 *   0.00–0.20  a dashed bounding box with corner ticks and its size label
 *   0.05–0.70  the outlines draw on, anchor points and bezier handles riding along
 *   0.55–0.585 the finished element fills in, nearly instantly
 *   0.70–1.00  the technical marks fade away
 */
export function drawConstruct(ctx: CanvasRenderingContext2D, e: Element, k: number, pen: Pen, drawFinished: () => void) {
  if (k <= 0) return;
  // the finished element arrives almost at once (a tenth of the old 35% fade)
  const fill = clamp01((k - 0.55) / 0.035);
  if (fill > 0) {
    ctx.save();
    ctx.globalAlpha *= fill;
    drawFinished();
    ctx.restore();
  }
  const tech = k < 0.7 ? 1 : clamp01(1 - (k - 0.7) / 0.3);
  if (tech <= 0) return;
  const lw = pen.lw * 0.55;
  const ink = pen.pal.ink;
  ctx.save();
  ctx.globalAlpha *= tech;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  guide(ctx, e, clamp01(k / 0.2), lw, pen);
  // with notes, the box is written in first and the outline waits for it
  if (pen.notes) notes(ctx, e, k, pen);
  const draw = pen.notes ? clamp01((k - 0.2) / 0.55) : clamp01((k - 0.05) / 0.65);
  const strokes = outlinesOf(e);
  strokes.forEach((s, i) => {
    // strokes start a little after one another, all finish together
    const local = clamp01(draw * 1.25 - (i / Math.max(1, strokes.length)) * 0.25);
    if (local > 0) partial(ctx, s, local, lw * 1.6, pen);
  });
  ctx.restore();
}

/** Notes typed into the box (0.03–0.25), held, then wiped out as the outline arrives (0.28–0.45). */
function notes(ctx: CanvasRenderingContext2D, e: Element, k: number, pen: Pen) {
  const type = clamp01((k - 0.03) / 0.22);
  const out = clamp01((k - 0.28) / 0.17);
  if (type <= 0 || out >= 1) return;
  const b = bounds(e);
  const lines = pen.lines?.get(e.id) ?? notesFor(e, pen.pal);
  const size = Math.max(9, Math.min(pen.lw * 8, b.h / (lines.length * 1.6 + 0.8), b.w / 12));
  let left = 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(b.x, b.y, b.w, b.h);
  ctx.clip();
  ctx.globalAlpha *= 1 - out;
  ctx.fillStyle = pen.pal.ink;
  ctx.textBaseline = "top";
  // wrap to the box: the first line is the title, the rest flow as body text
  const maxW = b.w - size * 1.2;
  const rows: { text: string; title: boolean }[] = [];
  lines.forEach((line, i) => {
    ctx.font = `${i === 0 ? 600 : 500} ${i === 0 ? size * 1.15 : size}px "KV Inter"`;
    let cur = "";
    for (const word of line.split(" ")) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && ctx.measureText(next).width > maxW) {
        rows.push({ text: cur, title: i === 0 });
        cur = word;
      } else cur = next;
    }
    rows.push({ text: cur, title: i === 0 });
  });
  left = Math.floor(rows.reduce((n, r) => n + r.text.length, 0) * type);
  rows.forEach((row, i) => {
    if (left <= 0) return;
    const shown = row.text.slice(0, left);
    left -= row.text.length;
    ctx.font = `${row.title ? 600 : 500} ${row.title ? size * 1.15 : size}px "KV Inter"`;
    const y = b.y + size * 0.6 + i * size * 1.45 + (i > 0 ? size * 0.2 : 0);
    ctx.fillText(shown, b.x + size * 0.6, y);
    // caret on the line being typed
    if (left < 0 && type < 1) ctx.fillRect(b.x + size * 0.6 + ctx.measureText(shown).width + 2, y, Math.max(1, size * 0.08), size);
  });
  ctx.restore();
}

/** Bounding box, dashed, with corner ticks, a centre cross and a size label. */
function guide(ctx: CanvasRenderingContext2D, e: Element, g: number, lw: number, pen: Pen) {
  const b = bounds(e);
  const t = Math.min(b.w, b.h) * 0.08 + 6;
  ctx.save();
  ctx.lineWidth = lw;
  ctx.globalAlpha *= 0.55 * g;
  ctx.setLineDash([lw * 6, lw * 5]);
  ctx.strokeRect(b.x, b.y, b.w * g, b.h * g);
  ctx.setLineDash([]);
  ctx.beginPath();
  for (const [x, y, dx, dy] of [[b.x, b.y, 1, 1], [b.x + b.w, b.y, -1, 1], [b.x, b.y + b.h, 1, -1], [b.x + b.w, b.y + b.h, -1, -1]]) {
    ctx.moveTo(x - dx * t * 0.4, y);
    ctx.lineTo(x + dx * t, y);
    ctx.moveTo(x, y - dy * t * 0.4);
    ctx.lineTo(x, y + dy * t);
  }
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.moveTo(cx - t, cy);
  ctx.lineTo(cx + t, cy);
  ctx.moveTo(cx, cy - t);
  ctx.lineTo(cx, cy + t);
  ctx.stroke();
  ctx.globalAlpha /= 0.55;
  ctx.font = `500 ${Math.max(10, pen.lw * 4.5)}px "KV Inter"`;
  ctx.textBaseline = "bottom";
  ctx.fillText(`${Math.round(b.w)} × ${Math.round(b.h)}`, b.x, b.y - pen.lw * 1.5);
  ctx.restore();
}

/** The first `f` of a stroke's length, its anchors and handles so far, and a pen tip at the head. */
function partial(ctx: CanvasRenderingContext2D, s: Stroke, f: number, lw: number, pen: Pen) {
  const p = s.pts;
  let total = 0;
  const seg: number[] = [];
  for (let i = 1; i < p.length; i++) seg.push((total += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])));
  const upto = total * f;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  let head = p[0];
  for (let i = 1; i < p.length; i++) {
    if (seg[i - 1] <= upto) {
      ctx.lineTo(p[i][0], p[i][1]);
      head = p[i];
    } else {
      const prev = i > 1 ? seg[i - 2] : 0;
      const t = (upto - prev) / Math.max(1e-6, seg[i - 1] - prev);
      head = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t];
      ctx.lineTo(head[0], head[1]);
      break;
    }
  }
  ctx.stroke();
  const a = pen.lw * 1.6;
  const shown = Math.ceil(s.anchors.length * Math.min(1, f * 1.05));
  for (const an of s.anchors.slice(0, shown)) {
    if (an.hx !== undefined && an.hy !== undefined) {
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      ctx.moveTo(an.x - an.hx, an.y - an.hy);
      ctx.lineTo(an.x + an.hx, an.y + an.hy);
      ctx.stroke();
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(an.x + sgn * an.hx, an.y + sgn * an.hy, a * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = pen.pal.paper;
    ctx.fillRect(an.x - a / 2, an.y - a / 2, a, a);
    ctx.lineWidth = lw * 0.6;
    ctx.strokeRect(an.x - a / 2, an.y - a / 2, a, a);
    ctx.fillStyle = pen.pal.ink;
  }
  if (f < 1) {
    ctx.beginPath();
    ctx.arc(head[0], head[1], a * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
