import {
  DEFAULT_TYPE,
  FORMATS,
  PALETTE_KV,
  uid,
  type BlockLayer,
  type BracketLayer,
  type Composition,
  type FormatId,
  type GridLayer,
  type HeadlineLayer,
  type Layer,
  type LockupLayer,
  type ShapeLayer,
} from './model';
import { mulberry32 } from './render/noise';
import { typeGeometry } from './render/type';
import { capHeight, getFont } from './fonts';

/* Layer builders shared by the format presets. */
// ---------------------------------------------------------------- builders

export function block(x: number, y: number, w: number, h: number, fill: BlockLayer['fill'], name: string, role?: string): BlockLayer {
  return { id: uid('b'), type: 'block', name, visible: true, locked: false, x, y, w, h, fill, role };
}

export function bracket(x: number, y: number, w: number, h: number, barH: number, legW: number, role = 'bracket'): BracketLayer {
  return { id: uid('k'), type: 'bracket', name: 'Escuadra', visible: true, locked: false, x, y, w, h, barH, legW, corner: 'ne', fill: 'green', role };
}

export function asterisk(x: number, y: number, size: number, role = 'asterisk'): ShapeLayer {
  return {
    id: uid('s'),
    type: 'shape',
    shape: 'asterisk',
    name: 'Asterisco',
    visible: true,
    locked: false,
    x,
    y,
    size,
    rotation: 0,
    fill: 'brown',
    arms: 6,
    flare: 1.55,
    thickness: 0.27,
    rough: 0.3,
    soft: 0.15,
    role,
  };
}

export function lockup(x: number, y: number, h: number): LockupLayer {
  return { id: uid('m'), type: 'lockup', name: 'Lockup', visible: true, locked: false, x, y, h, text: 'Motion Social Club', c1: 'white', c2: 'lilac', c3: 'pink', role: 'lockup' };
}

export function headline(text: string, role?: string, over: Partial<HeadlineLayer> = {}): HeadlineLayer {
  return { id: uid('h'), type: 'headline', name: text.replace(/\n/g, ' ') || 'Titular', visible: true, locked: false, text, x: 0, y: 0, ...DEFAULT_TYPE, role, ...over };
}

/** Sets size / scaleX / x / y so the ink lands on a target box (left, cap top, right, baseline). */
export function fitHeadline(l: HeadlineLayer, box: { left: number; top: number; right?: number; baseline: number }) {
  const cap = capHeight(getFont(l.font));
  l.size = Math.round(((box.baseline - box.top) / cap) * 10) / 10;
  if (box.right !== undefined) {
    for (let i = 0; i < 3; i++) {
      const g = typeGeometry(l);
      l.scaleX = Math.round(l.scaleX * ((box.right - box.left) / g.bbox.w) * 1000) / 1000;
    }
  }
  const g = typeGeometry(l);
  l.x = Math.round((box.left - g.bbox.x) * 10) / 10;
  l.y = box.baseline;
  return l;
}

export function gridLayer(x: number, y: number, w: number, h: number, lines: GridLayer['lines'], role = 'grid'): GridLayer {
  return { id: uid('g'), type: 'grid', name: 'Grilla', visible: true, locked: false, x, y, w, h, lines, weight: 1.3, stroke: 'grid', role };
}

/** Absolute segments → layer-normalized. */
export function gridFromAbs(x: number, y: number, w: number, h: number, segs: number[][]) {
  return gridLayer(
    x,
    y,
    w,
    h,
    segs.map(([a, b, c, d]) => [(a - x) / w, (b - y) / h, (c - x) / w, (d - y) / h] as [number, number, number, number]),
  );
}

/**
 * Irregular construction grid: uneven columns and rows, some segments dropped,
 * like a spreadsheet that was cut and re-pasted. Deterministic per seed.
 */
export function generateGrid(cols: number, rows: number, seed: number, irregular = 0.5): GridLayer['lines'] {
  const r = mulberry32(seed);
  const cuts = (n: number) => {
    const ws = Array.from({ length: n }, () => 1 + (r() - 0.5) * 2 * irregular * 0.8);
    const sum = ws.reduce((a, b) => a + b, 0);
    let acc = 0;
    return [0, ...ws.map((w) => (acc += w / sum))];
  };
  const xs = cuts(cols);
  const ys = cuts(rows);
  const lines: GridLayer['lines'] = [];
  const pushSegs = (fixed: number, stops: number[], vertical: boolean, edge: boolean) => {
    let start: number | null = null;
    for (let i = 0; i < stops.length - 1; i++) {
      const keep = edge || r() > irregular * 0.35;
      if (keep && start === null) start = stops[i];
      if (!keep && start !== null) {
        lines.push(vertical ? [fixed, start, fixed, stops[i]] : [start, fixed, stops[i], fixed]);
        start = null;
      }
    }
    if (start !== null) lines.push(vertical ? [fixed, start, fixed, 1] : [start, fixed, 1, fixed]);
  };
  xs.forEach((x, i) => pushSegs(x, ys, true, i === 0 || i === xs.length - 1));
  ys.forEach((y, i) => pushSegs(y, xs, false, i === 0 || i === ys.length - 1));
  // a few extra split rows across part of the width
  const extra = Math.round(rows * irregular * 0.6);
  for (let k = 0; k < extra; k++) {
    const yi = Math.floor(r() * (ys.length - 1));
    const y = ys[yi] + (ys[yi + 1] - ys[yi]) * (0.3 + r() * 0.4);
    const a = xs[Math.floor(r() * (xs.length - 1))];
    const b = Math.min(1, a + 0.15 + r() * 0.4);
    lines.push([a, y, b, y]);
  }
  return lines;
}

export function base(format: FormatId, layers: Layer[], crosses: { xs: number[]; ys: number[] }): Composition {
  const f = FORMATS[format];
  return {
    version: 1,
    name: `Motion, Now — ${f.label}`,
    format,
    width: f.width,
    height: f.height,
    palette: { ...PALETTE_KV },
    paper: { fill: 'paper', grain: 0.35, mottle: 0.3, seed: 7 },
    crosses: { visible: true, xs: crosses.xs, ys: crosses.ys, size: 11, weight: 1.3, mode: 'perimeter', stroke: 'grid' },
    layers,
  };
}

// ---------------------------------------------------------------- the master, measured on refs/kv-main.png at 1920

