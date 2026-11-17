import {
  clone,
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
function gridFromAbs(x: number, y: number, w: number, h: number, segs: number[][]) {
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

function base(format: FormatId, layers: Layer[], crosses: { xs: number[]; ys: number[] }): Composition {
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

/** Ink targets of the two headline words in the master (1920×1080). */
export const MASTER_TYPE = {
  line1: { left: 138, top: 408, right: 1113, baseline: 747 },
  line2: { left: 1178, top: 377, right: 1781, baseline: 684 },
};

export function masterKV(): Composition {
  const l1 = fitHeadline(headline('Motion,', 'line1'), MASTER_TYPE.line1);
  const l2 = fitHeadline(headline('Now', 'line2'), MASTER_TYPE.line2);
  const grid = gridFromAbs(96, 167, 1728, 745, [
    // verticals
    [96, 276, 96, 831],
    [144, 276, 144, 831],
    [416, 276, 416, 831],
    [588, 276, 588, 831],
    [691, 276, 691, 826],
    [816, 276, 816, 826],
    [953, 276, 953, 826],
    [1040, 276, 1040, 470],
    [1081, 276, 1081, 334],
    [1179, 276, 1179, 333],
    [1321, 276, 1321, 333],
    [1321, 714, 1321, 912],
    [1514, 276, 1514, 444],
    [1514, 637, 1514, 912],
    [1690, 684, 1690, 912],
    [1824, 714, 1824, 912],
    // over the green bracket
    [1473, 167, 1473, 276],
    [1549, 167, 1549, 276],
    [1671, 167, 1671, 276],
    [1733, 276, 1733, 312],
    // horizontals
    [96, 276, 1824, 276],
    [1081, 334, 1690, 334],
    [96, 366, 640, 366],
    [1150, 372, 1690, 372],
    [96, 406, 1150, 406],
    [1150, 421, 1824, 421],
    [1690, 396, 1824, 396],
    [1316, 225, 1824, 225],
    [1747, 604, 1824, 604],
    [96, 470, 1150, 470],
    [1514, 637, 1824, 637],
    [1150, 684, 1690, 684],
    [1150, 714, 1824, 714],
    [96, 746, 1150, 746],
    [96, 776, 1150, 776],
    [1150, 912, 1824, 912],
  ]);
  return base(
    '16x9',
    [
      block(96, 308, 544, 523, 'pink', 'Bloque rosa', 'blockA'),
      block(590, 373, 560, 542, 'lilac', 'Bloque lila', 'blockB'),
      bracket(1315, 167, 509, 518, 110, 134),
      grid,
      asterisk(1655, 809, 140),
      l1,
      l2,
      lockup(610, 828, 87),
    ],
    { xs: [77, 519, 959, 1402, 1843].map((v) => v / 1920), ys: [62, 386, 693, 1018].map((v) => v / 1080) },
  );
}

// ---------------------------------------------------------------- other formats, same family

/** Headline with the master's proportions (scaleX/tracking) at a new cap height. */
function wordLike(text: string, role: string, master: HeadlineLayer, left: number, capTop: number, baseline: number) {
  const l = headline(text, role, { font: master.font, scaleX: master.scaleX, tracking: master.tracking });
  return fitHeadline(l, { left, top: capTop, baseline });
}

let masterCache: Composition | null = null;
function masterWords() {
  masterCache ??= masterKV();
  const hs = masterCache.layers.filter((l): l is HeadlineLayer => l.type === 'headline');
  return { m1: hs[0], m2: hs[1] };
}

export function presetFor(format: FormatId): Composition {
  if (format === '16x9') return masterKV();
  const { m1, m2 } = masterWords();
  const W = FORMATS[format].width;
  const H = FORMATS[format].height;
  const g = (x: number, y: number, w: number, h: number, cols: number, rows: number, seed: number) => ({
    ...gridLayer(x, y, w, h, generateGrid(cols, rows, seed, 0.55)),
    gen: { cols, rows, seed, irr: 0.55 },
  });
  switch (format) {
    case '9x16':
      return base(
        format,
        [
          block(60, 330, 560, 420, 'pink', 'Bloque rosa', 'blockA'),
          block(60, 790, 960, 740, 'lilac', 'Bloque lila', 'blockB'),
          bracket(680, 150, 340, 520, 92, 112),
          g(60, 150, 960, 1560, 6, 14, 11),
          asterisk(890, 1660, 140),
          wordLike('Motion,', 'line1', m1, 92, 430, 680),
          wordLike('Now', 'line2', m2, 92, 860, 1330),
          lockup(60, 1460, 70),
        ],
        { xs: [0.07, 0.5, 0.93], ys: [0.035, 0.27, 0.5, 0.73, 0.965] },
      );
    case '4x5':
      return base(
        format,
        [
          block(60, 250, 560, 420, 'pink', 'Bloque rosa', 'blockA'),
          block(300, 600, 720, 500, 'lilac', 'Bloque lila', 'blockB'),
          bracket(640, 80, 380, 440, 88, 104),
          g(60, 80, 960, 1150, 6, 10, 23),
          asterisk(165, 1185, 115),
          wordLike('Motion,', 'line1', m1, 90, 345, 590),
          wordLike('Now', 'line2', m2, 330, 690, 1010),
          lockup(300, 1030, 70),
        ],
        { xs: [0.07, 0.5, 0.93], ys: [0.045, 0.36, 0.68, 0.955] },
      );
    case '1x1':
      return base(
        format,
        [
          block(60, 230, 520, 350, 'pink', 'Bloque rosa', 'blockA'),
          block(290, 500, 620, 440, 'lilac', 'Bloque lila', 'blockB'),
          bracket(700, 70, 320, 370, 78, 92),
          g(60, 70, 960, 920, 6, 9, 5),
          asterisk(978, 992, 82),
          wordLike('Motion,', 'line1', m1, 88, 300, 505),
          wordLike('Now', 'line2', m2, 316, 575, 845),
          lockup(290, 882, 58),
        ],
        { xs: [0.06, 0.5, 0.94], ys: [0.06, 0.5, 0.94] },
      );
    case 'banner':
      return base(
        format,
        [
          block(60, 140, 470, 360, 'pink', 'Bloque rosa', 'blockA'),
          block(470, 190, 540, 390, 'lilac', 'Bloque lila', 'blockB'),
          bracket(1420, 50, 440, 360, 74, 100),
          g(60, 110, 1800, 470, 14, 6, 31),
          asterisk(1650, 470, 100),
          wordLike('Motion,', 'line1', m1, 92, 222, 452),
          wordLike('Now', 'line2', m2, 1060, 196, 410),
          lockup(420, 522, 58),
        ],
        { xs: [0.03, 0.27, 0.5, 0.73, 0.97], ys: [0.08, 0.92] },
      );
  }
  return masterKV();
}

/**
 * Re-layout for another format: take that format's layout and carry over the copy, palette,
 * paper, type treatment and colours by role. Layers without a matching role are scaled
 * uniformly into the new frame (never stretched).
 */
export function adaptTo(cur: Composition, format: FormatId): Composition {
  const next = presetFor(format);
  next.palette = { ...cur.palette };
  next.paper = { ...cur.paper };
  next.crosses = { ...next.crosses, visible: cur.crosses.visible, mode: cur.crosses.mode, size: cur.crosses.size, weight: cur.crosses.weight, stroke: cur.crosses.stroke };
  next.name = cur.name.replace(/—.*$/, `— ${FORMATS[format].label}`);
  const used = new Set<string>();
  const byRole = new Map(cur.layers.filter((l) => l.role).map((l) => [l.role!, l]));
  next.layers = next.layers.flatMap((nl) => {
    const old = nl.role ? byRole.get(nl.role) : undefined;
    if (!old || old.type !== nl.type) return [nl];
    used.add(old.id);
    if (!old.visible) return [];
    if (nl.type === 'headline' && old.type === 'headline') {
      const fitted = clone(nl);
      Object.assign(fitted, {
        text: old.text,
        name: old.name,
        font: old.font,
        fill: old.fill,
        treatment: old.treatment,
        chamfer: old.chamfer,
        notches: old.notches,
        notchW: old.notchW,
        notchD: old.notchD,
        rough: old.rough,
        soft: old.soft,
        cell: old.cell,
        tracking: old.tracking,
        leading: old.leading,
      });
      // keep the preset's cap height for one line; shrink for extra lines
      const lines = old.text.split('\n').length;
      if (lines > 1) fitted.size = Math.round(fitted.size / (1 + (lines - 1) * old.leading * 0.9));
      // longer copy than the preset word: shrink until it fits inside the frame margin
      const margin = next.width * 0.05;
      for (let i = 0; i < 3; i++) {
        const g = typeGeometry(fitted);
        const room = next.width - margin - (fitted.x + g.bbox.x);
        if (g.bbox.w <= room || g.bbox.w <= 0) break;
        fitted.size = Math.floor(fitted.size * (room / g.bbox.w) * 1000) / 1000;
      }
      return [fitted];
    }
    if (nl.type === 'lockup' && old.type === 'lockup') return [{ ...nl, text: old.text, c1: old.c1, c2: old.c2, c3: old.c3 }];
    if (nl.type === 'block' && old.type === 'block') return [{ ...nl, fill: old.fill }];
    if (nl.type === 'bracket' && old.type === 'bracket') return [{ ...nl, fill: old.fill, corner: old.corner }];
    if (nl.type === 'shape' && old.type === 'shape')
      return [{ ...nl, shape: old.shape, fill: old.fill, rotation: old.rotation, arms: old.arms, flare: old.flare, thickness: old.thickness, rough: old.rough, soft: old.soft }];
    return [nl];
  });
  const k = Math.min(next.width / cur.width, next.height / cur.height);
  const ox = (next.width - cur.width * k) / 2;
  const oy = (next.height - cur.height * k) / 2;
  for (const l of cur.layers) {
    if (used.has(l.id) || (l.role && next.layers.some((n) => n.role === l.role))) continue;
    next.layers.push(scaleLayer(clone(l), k, ox, oy));
  }
  return next;
}

/** Uniform scale + offset. Never stretches type, the lockup or shapes. */
export function scaleLayer(l: Layer, k: number, ox: number, oy: number): Layer {
  l.x = l.x * k + ox;
  l.y = l.y * k + oy;
  switch (l.type) {
    case 'block':
    case 'grid':
    case 'image':
    case 'media':
      l.w *= k;
      l.h *= k;
      if (l.type === 'grid') l.weight = Math.max(1, l.weight);
      break;
    case 'bracket':
      l.w *= k;
      l.h *= k;
      l.barH *= k;
      l.legW *= k;
      break;
    case 'headline':
    case 'text':
      l.size *= k;
      break;
    case 'shape':
      l.size *= k;
      break;
    case 'lockup':
      l.h *= k;
      break;
  }
  return l;
}

export function scaleComposition(cur: Composition, format: FormatId): Composition {
  const f = FORMATS[format];
  const k = Math.min(f.width / cur.width, f.height / cur.height);
  const ox = (f.width - cur.width * k) / 2;
  const oy = (f.height - cur.height * k) / 2;
  const next = clone(cur);
  next.format = format;
  next.width = f.width;
  next.height = f.height;
  next.name = cur.name.replace(/—.*$/, `— ${f.label}`);
  next.layers = next.layers.map((l) => scaleLayer(l, k, ox, oy));
  return next;
}
