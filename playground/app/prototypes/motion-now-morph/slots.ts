/** Where each respondent sits in a chapter chart, plus the chart's labels. Pure. */
import { AI_USE, type Respondent } from "@/lib/tmsc/survey";
import { binIndex } from "@/lib/tmsc/stats";
import type { ChapterName } from "@/lib/tmsc/palettes";
import { RATE_EDGES } from "./data";

export type Box = { x: number; y: number; w: number; h: number };
export type ChartLabel = { text: string; x: number; y: number; align: "left" | "center" | "right"; strong?: boolean };
export type Slots = { x: Float32Array; y: Float32Array; r: number; order: Int32Array; labels: ChartLabel[]; labelSize: number };

/** Categories as columns of stacked dots (histogram, mood bars). */
function columns(cats: number[], count: number, names: string[], b: Box): Slots {
  const counts = names.map((_, k) => cats.filter((c) => c === k).length);
  const max = Math.max(1, ...counts);
  const colW = b.w / names.length;
  const labelSize = Math.min(colW * 0.32, b.h * 0.07, 40);
  const h = b.h - labelSize * 2.2;
  let pitch = 0;
  let per = 1;
  for (let k = 1; k <= 8; k++) {
    const p = Math.min((colW * 0.86) / k, h / Math.ceil(max / k));
    if (p > pitch) [pitch, per] = [p, k];
  }
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const filled = names.map(() => 0);
  const base = b.y + h;
  cats.forEach((k, i) => {
    const j = filled[k]++;
    const cx = b.x + colW * (k + 0.5) + (((j % per) - (per - 1) / 2) * pitch);
    x[i] = cx;
    y[i] = base - pitch * (Math.floor(j / per) + 0.5);
  });
  const labels: ChartLabel[] = names.map((text, k) => ({ text, x: b.x + colW * (k + 0.5), y: base + labelSize * 1.5, align: "center" }));
  counts.forEach((n, k) => labels.push({ text: String(n), x: b.x + colW * (k + 0.5), y: base - pitch * Math.ceil(n / per) - labelSize * 0.5, align: "center", strong: true }));
  return { x, y, r: pitch * 0.36, order: rank(x, y, 1, 0.05), labels, labelSize };
}

/** Categories as rows of dots (dot matrix), label on the left, share on the right. */
function rows(cats: number[], count: number, names: string[], b: Box): Slots {
  const counts = names.map((_, k) => cats.filter((c) => c === k).length);
  const labelW = b.w * 0.16;
  const shareW = b.w * 0.1;
  const w = b.w - labelW - shareW;
  let pitch = 0;
  let per = 1;
  for (let k = 10; k <= 120; k++) {
    const lines = counts.reduce((s, n) => s + Math.max(1, Math.ceil(n / k)), 0) + names.length * 0.6;
    const p = Math.min(w / k, b.h / lines);
    if (p > pitch) [pitch, per] = [p, k];
  }
  const labelSize = Math.min(pitch * 1.6, 40);
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const rowTop: number[] = [];
  let top = b.y;
  for (const n of counts) {
    rowTop.push(top);
    top += (Math.max(1, Math.ceil(n / per)) + 0.6) * pitch;
  }
  const offset = (b.y + b.h - top) / 2;
  const filled = names.map(() => 0);
  cats.forEach((k, i) => {
    const j = filled[k]++;
    x[i] = b.x + labelW + pitch * ((j % per) + 0.5);
    y[i] = offset + rowTop[k] + pitch * (Math.floor(j / per) + 0.5);
  });
  const labels: ChartLabel[] = [];
  names.forEach((text, k) => {
    const ly = offset + rowTop[k] + pitch * 0.5 + labelSize * 0.35;
    labels.push({ text, x: b.x, y: ly, align: "left" });
    labels.push({ text: `${Math.round((counts[k] / Math.max(1, count)) * 100)}%`, x: b.x + b.w, y: ly, align: "right", strong: true });
  });
  return { x, y, r: pitch * 0.36, order: rank(x, y, 0.05, 1), labels, labelSize };
}

/** Travel order: sweep across the chart (weights pick the axis). */
function rank(x: Float32Array, y: Float32Array, wx: number, wy: number): Int32Array {
  const idx = Array.from(x, (_, i) => i).sort((a, b) => x[a] * wx + y[a] * wy - (x[b] * wx + y[b] * wy));
  const out = new Int32Array(x.length);
  idx.forEach((i, k) => (out[i] = k));
  return out;
}

const rateName = (e: number, i: number) => (i === RATE_EDGES.length - 1 ? "$1k+" : `$${e}`);

export function chapterSlots(chapter: ChapterName, people: readonly Respondent[], b: Box): Slots {
  if (chapter === "Money")
    return columns(people.map((p) => binIndex(RATE_EDGES, p.dayRate)), people.length, RATE_EDGES.map(rateName), b);
  if (chapter === "What’s Next")
    return columns(people.map((p) => p.mood - 1), people.length, ["1 · worried", "2", "3", "4", "5 · excited"], b);
  return rows(people.map((p) => AI_USE.indexOf(p.ai)), people.length, [...AI_USE], b);
}
