/** Cluster layout: groups on a grid below the title, each a sunflower disc of dots. Pure. */
import { groupBy } from "@/lib/tmsc/stats";
import type { Respondent } from "@/lib/tmsc/survey";

export type Cluster = { label: string; count: number; members: number[]; cx: number; cy: number; r: number; row: number; labelY: number };
export type Layout = { clusters: Cluster[]; tx: Float32Array; ty: Float32Array; labelSize: number; cellW: number };
export type Frame = { w: number; h: number; top: number; bottom: number; pad: number };

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Distance between neighbouring dot centers for a dot radius. */
export const dotPitch = (dotSize: number) => dotSize * 2.5;

/** The free area under the title and above the footer. */
export function frameFor(w: number, h: number): Frame {
  const pad = Math.round(Math.min(w, h) * 0.05);
  const wide = w / h > 1.2;
  return { w, h, pad, top: h * (wide ? 0.3 : 0.24), bottom: h - pad * 1.6 };
}

export function layoutClusters(
  people: readonly Respondent[],
  key: (r: Respondent) => string,
  order: readonly string[],
  f: Frame,
  dotSize: number,
  spacing: number,
): Layout {
  const idx = people.map((_, i) => i);
  const groups = [...groupBy(idx, (i) => key(people[i]), order)];
  const k = Math.max(1, groups.length);
  const areaW = f.w - f.pad * 2;
  const areaH = f.bottom - f.top;
  let cols = 1;
  let best = 0;
  for (let c = 1; c <= k; c++) {
    const cell = Math.min(areaW / c, areaH / Math.ceil(k / c));
    if (cell > best) [best, cols] = [cell, c];
  }
  const rows = Math.ceil(k / cols);
  const cellW = areaW / cols;
  const cellH = areaH / rows;
  const labelSize = Math.max(18, Math.min(cellW * 0.1, cellH * 0.13, 56));
  const pitch = dotPitch(dotSize);
  // shrink the pitch if the biggest group wouldn't fit its cell
  const maxCount = Math.max(...groups.map(([, m]) => m.length));
  const room = Math.min(cellW, cellH - labelSize * 2.6) * 0.5 * 0.92;
  const c0 = Math.min(pitch / Math.sqrt(Math.PI) * 1.05, room / Math.sqrt(maxCount));
  const midX = f.w / 2;
  const midY = (f.top + f.bottom) / 2;
  const tx = new Float32Array(people.length);
  const ty = new Float32Array(people.length);
  const clusters: Cluster[] = groups.map(([label, members], g) => {
    const row = Math.floor(g / cols);
    const inRow = row === rows - 1 ? k - row * cols : cols;
    const col = g - row * cols + (cols - inRow) / 2;
    const gx = f.pad + (col + 0.5) * cellW;
    const gy = f.top + row * cellH + labelSize * 2.4 + (cellH - labelSize * 2.4) / 2;
    const cx = midX + (gx - midX) * spacing;
    const cy = midY + (gy - midY) * spacing;
    members.forEach((m, i) => {
      const rr = c0 * Math.sqrt(i + 0.5);
      tx[m] = cx + Math.cos(i * GOLDEN) * rr;
      ty[m] = cy + Math.sin(i * GOLDEN) * rr;
    });
    return { label, count: members.length, members, cx, cy, r: c0 * Math.sqrt(members.length), row, labelY: 0 };
  });
  // labels of one row share a baseline above the row's biggest disc
  for (let row = 0; row < rows; row++) {
    const inRow = clusters.filter((c) => c.row === row);
    const top = Math.min(...inRow.map((c) => c.cy - c.r));
    inRow.forEach((c) => (c.labelY = top - labelSize * 0.9));
  }
  return { clusters, tx, ty, labelSize, cellW: cellW * spacing };
}

/** Index of the cluster under a world point (disc plus its label), or -1. */
export function hitCluster(l: Layout, x: number, y: number): number {
  return l.clusters.findIndex((c) => {
    const dx = x - c.cx;
    const top = c.labelY - l.labelSize * 1.2;
    return Math.abs(dx) <= c.r + l.labelSize * 0.5 && y >= top && y <= c.cy + c.r + l.labelSize * 0.5;
  });
}
