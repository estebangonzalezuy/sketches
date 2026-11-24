import { frameOf } from "./generate";
import { rng } from "./random";
import type { Palette, Poster } from "./types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

let tile: HTMLCanvasElement | null = null;
function grainTile() {
  if (tile) return tile;
  tile = document.createElement("canvas");
  tile.width = tile.height = 256;
  const g = tile.getContext("2d")!;
  const img = g.createImageData(256, 256);
  const r = rng(11);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + r() * 36;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tile;
}

export function drawPaper(ctx: CanvasRenderingContext2D, p: Poster, pal: Palette, grain: number) {
  ctx.fillStyle = pal.paper;
  ctx.fillRect(0, 0, p.width, p.height);
  if (grain <= 0) return;
  ctx.save();
  ctx.globalAlpha = grain * 0.35;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = ctx.createPattern(grainTile(), "repeat")!;
  ctx.fillRect(0, 0, p.width, p.height);
  ctx.restore();
}

/** Hairline construction grid inside the frame. `t` draws it on (0 → 1). */
export function drawGrid(ctx: CanvasRenderingContext2D, p: Poster, pal: Palette, t = 1) {
  const f = frameOf(p.width, p.height);
  const lw = Math.max(1, p.width / 900);
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = lw;
  ctx.beginPath();
  p.grid.xs.forEach((x, i) => {
    const k = clamp01(t * 1.6 - (i / p.grid.xs.length) * 0.6);
    if (k <= 0) return;
    ctx.moveTo(f.x + x * f.w, f.y);
    ctx.lineTo(f.x + x * f.w, f.y + f.h * k);
  });
  p.grid.ys.forEach((y, i) => {
    const k = clamp01(t * 1.6 - (i / p.grid.ys.length) * 0.6);
    if (k <= 0) return;
    ctx.moveTo(f.x, f.y + y * f.h);
    ctx.lineTo(f.x + f.w * k, f.y + y * f.h);
  });
  ctx.stroke();
  ctx.restore();
}

/** Outer rules, corner crop marks and registration crosses. */
export function drawFrame(ctx: CanvasRenderingContext2D, p: Poster, pal: Palette, t = 1) {
  if (t <= 0) return;
  const { W, H, m } = frameOf(p.width, p.height);
  const lw = Math.max(1, W / 700);
  const s = m * 0.28;
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = lw;
  ctx.globalAlpha = clamp01(t * 2);
  ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.beginPath();
  for (const [x, y, dx, dy] of [[m, m, -1, -1], [W - m, m, 1, -1], [m, H - m, -1, 1], [W - m, H - m, 1, 1]]) {
    ctx.moveTo(x + dx * s * 0.4, y + dy * s * 2.2);
    ctx.lineTo(x + dx * s * 0.4, y + dy * s * 0.9);
    ctx.moveTo(x + dx * s * 2.2, y + dy * s * 0.4);
    ctx.lineTo(x + dx * s * 0.9, y + dy * s * 0.4);
  }
  const cross = (x: number, y: number) => {
    ctx.moveTo(x - s, y);
    ctx.lineTo(x + s, y);
    ctx.moveTo(x, y - s);
    ctx.lineTo(x, y + s);
  };
  for (const fx of [0.27, 0.5, 0.73]) {
    cross(W * fx, m * 0.5);
    cross(W * fx, H - m * 0.5);
  }
  const rows = Math.round(H / W * 4);
  for (let i = 1; i < rows; i++) {
    cross(m * 0.5, (H * i) / rows);
    cross(W - m * 0.5, (H * i) / rows);
  }
  ctx.stroke();
  ctx.restore();
}
