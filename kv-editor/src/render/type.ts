import { capHeight, getFont, type OTCommand } from '../fonts';
import type { HeadlineLayer, TypeStyle } from '../model';
import { inkify, RasterCache, type InkResult, type Rect } from './ink';
import { hashStr } from './noise';

export type Pt = [number, number];

export interface TypeGeometry {
  /** closed contours, comp px relative to the layer anchor (x, baseline) */
  contours: Pt[][];
  /** keyhole cuts, relative to the anchor */
  notches: Rect[];
  /** ink bounds relative to the anchor */
  bbox: Rect;
  lineCount: number;
  capPx: number;
}

type GeoKey = Pick<
  TypeStyle,
  'font' | 'size' | 'scaleX' | 'tracking' | 'leading' | 'align' | 'chamfer' | 'notches' | 'notchW' | 'notchD' | 'treatment' | 'roundDots'
> & { text: string };

const geoCache = new RasterCache<TypeGeometry>(120);

type Piece = { kind: 'L' | 'C'; pts: Pt[] };

/** Path commands → contours made of pieces (straight segments vs. flattened curves). */
function toPieces(cmds: OTCommand[], steps: number, tx: (x: number, y: number) => Pt): Piece[][] {
  const out: Piece[][] = [];
  let cur: Piece[] = [];
  let p: Pt = [0, 0];
  let start: Pt = [0, 0];
  let rawP: [number, number] = [0, 0];
  const close = () => {
    if (Math.hypot(p[0] - start[0], p[1] - start[1]) > 1e-6) cur.push({ kind: 'L', pts: [p, start] });
    if (cur.length) out.push(cur);
    cur = [];
  };
  for (const c of cmds) {
    if (c.type === 'M') {
      if (cur.length) close();
      p = start = tx(c.x, c.y);
      rawP = [c.x, c.y];
    } else if (c.type === 'L') {
      const q = tx(c.x, c.y);
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) cur.push({ kind: 'L', pts: [p, q] });
      p = q;
      rawP = [c.x, c.y];
    } else if (c.type === 'Q' || c.type === 'C') {
      const pts: Pt[] = [p];
      const [px, py] = rawP;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        if (c.type === 'Q') pts.push(tx(mt * mt * px + 2 * mt * t * c.x1 + t * t * c.x, mt * mt * py + 2 * mt * t * c.y1 + t * t * c.y));
        else
          pts.push(
            tx(
              mt * mt * mt * px + 3 * mt * mt * t * c.x1 + 3 * mt * t * t * c.x2 + t * t * t * c.x,
              mt * mt * mt * py + 3 * mt * mt * t * c.y1 + 3 * mt * t * t * c.y2 + t * t * t * c.y,
            ),
          );
      }
      cur.push({ kind: 'C', pts });
      p = pts[pts.length - 1];
      rawP = [c.x, c.y];
    } else if (c.type === 'Z') {
      close();
    }
  }
  if (cur.length) close();
  return out;
}

const flatPieces = (cs: Piece[]): Pt[] => cs.flatMap((pc) => pc.pts.slice(0, -1));

interface Edge {
  p: Pt;
  d: Pt;
  len: number;
  fixed: boolean;
  a: Pt;
  b: Pt;
}

const DEG = Math.PI / 180;

/** Quantize a direction to the 8 octilinear directions; delta = half-width of the 45° sector. */
function quantize(dx: number, dy: number, delta: number): number {
  const th = Math.atan2(dy, dx) / DEG;
  const k = Math.floor(th / 90);
  const a = th - k * 90;
  if (a < 45 - delta) return k * 90;
  if (a > 45 + delta) return (k + 1) * 90;
  return k * 90 + 45;
}

/**
 * KV faceting: straight strokes stay exact; curves are rebuilt from flat edges at 0/45/90°,
 * so bowls become the octagons of the master. `chamfer` widens the 45° sector (bigger cuts).
 */
function octilinear(contour: Piece[], chamfer: number, size: number): Pt[] {
  const delta = Math.max(0, Math.min(44, chamfer * 30));
  const minLen = size * 0.004;
  let edges: Edge[] = [];
  for (const pc of contour) {
    if (pc.kind === 'L') {
      const [a, b] = pc.pts;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 1e-6) continue;
      edges.push({ p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d: [(b[0] - a[0]) / len, (b[1] - a[1]) / len], len, fixed: true, a, b });
      continue;
    }
    let group: Pt[] = [pc.pts[0]];
    let gdir: number | null = null;
    const flush = () => {
      if (group.length < 2 || gdir === null) return;
      let len = 0;
      let sx = 0;
      let sy = 0;
      for (let i = 1; i < group.length; i++) {
        const l = Math.hypot(group[i][0] - group[i - 1][0], group[i][1] - group[i - 1][1]);
        len += l;
        sx += ((group[i][0] + group[i - 1][0]) / 2) * l;
        sy += ((group[i][1] + group[i - 1][1]) / 2) * l;
      }
      if (len < 1e-6) return;
      edges.push({ p: [sx / len, sy / len], d: [Math.cos(gdir * DEG), Math.sin(gdir * DEG)], len, fixed: false, a: group[0], b: group[group.length - 1] });
    };
    for (let i = 1; i < pc.pts.length; i++) {
      const a = pc.pts[i - 1];
      const b = pc.pts[i];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      if (Math.hypot(dx, dy) < 1e-9) continue;
      const q = quantize(dx, dy, delta);
      if (gdir !== null && q !== gdir) {
        flush();
        group = [a];
      }
      gdir = q;
      group.push(b);
    }
    flush();
  }
  if (edges.length < 3) return flatPieces(contour);
  // merge near-parallel neighbours (stem continuing into a curve, split curve groups)
  const ang = (e: Edge) => Math.atan2(e.d[1], e.d[0]);
  const angDiff = (a: Edge, b: Edge) => {
    let d = Math.abs(ang(a) - ang(b));
    if (d > Math.PI) d = 2 * Math.PI - d;
    return d;
  };
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    const out: Edge[] = [];
    for (const e of edges) {
      const last = out[out.length - 1];
      if (last && angDiff(last, e) < 9 * DEG) {
        const keep = last.fixed !== e.fixed ? (last.fixed ? last : e) : last.len >= e.len ? last : e;
        out[out.length - 1] = { ...keep, len: last.len + e.len, a: last.a, b: e.b };
        changed = true;
      } else out.push(e);
    }
    if (out.length > 2 && angDiff(out[0], out[out.length - 1]) < 9 * DEG) {
      const f = out[0];
      const l = out.pop()!;
      const keep = f.fixed !== l.fixed ? (f.fixed ? f : l) : f.len >= l.len ? f : l;
      out[0] = { ...keep, len: f.len + l.len, a: l.a, b: f.b };
      changed = true;
    }
    // drop slivers left between two real edges
    edges = out.filter((e) => e.fixed || e.len >= minLen || out.length <= 4);
    if (!changed) break;
  }
  if (edges.length < 3) return flatPieces(contour);
  const pts: Pt[] = [];
  for (let i = 0; i < edges.length; i++) {
    const e0 = edges[(i - 1 + edges.length) % edges.length];
    const e1 = edges[i];
    const cross = e0.d[0] * e1.d[1] - e0.d[1] * e1.d[0];
    const join: Pt = [(e0.b[0] + e1.a[0]) / 2, (e0.b[1] + e1.a[1]) / 2];
    if (Math.abs(cross) < 0.05) {
      pts.push(join);
      continue;
    }
    const t = ((e1.p[0] - e0.p[0]) * e1.d[1] - (e1.p[1] - e0.p[1]) * e1.d[0]) / cross;
    const v: Pt = [e0.p[0] + e0.d[0] * t, e0.p[1] + e0.d[1] * t];
    // a far-away intersection means the fit failed locally: fall back to the real joint
    pts.push(Math.hypot(v[0] - join[0], v[1] - join[1]) > size * 0.12 ? join : v);
  }
  return pts;
}

/** A small, squarish, hole-free contour in a multi-part glyph (the i dot, a period) → a circle. */
function roundDot(ct: Pt[], all: Pt[][], size: number): Pt[] {
  const b = bboxOf([ct]);
  if (b.h > size * 0.22 || b.w > size * 0.22) return ct;
  const ratio = b.w / b.h;
  if (ratio < 0.7 || ratio > 1.45) return ct;
  // skip if anything sits inside it (it is an outer with a hole) or it is a hole itself
  const inside = all.some((o) => o !== ct && bboxOf([o]).x >= b.x && bboxOf([o]).x + bboxOf([o]).w <= b.x + b.w && bboxOf([o]).y >= b.y && bboxOf([o]).y + bboxOf([o]).h <= b.y + b.h);
  const container = all.some((o) => o !== ct && (() => { const ob = bboxOf([o]); return ob.x <= b.x && ob.x + ob.w >= b.x + b.w && ob.y <= b.y && ob.y + ob.h >= b.y + b.h; })());
  if (inside || container) return ct;
  const r = Math.sqrt(Math.abs(area(ct)) / Math.PI) * 1.04;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const n = 48;
  const dir = Math.sign(area(ct)) || 1;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 * dir;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
}

function area(ct: Pt[]): number {
  let s = 0;
  for (let i = 0, j = ct.length - 1; i < ct.length; j = i++) s += (ct[j][0] - ct[i][0]) * (ct[j][1] + ct[i][1]);
  return s / 2;
}

function bboxOf(cts: Pt[][]): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const ct of cts)
    for (const [x, y] of ct) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  if (!isFinite(x0)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function typeGeometry(l: GeoKey): TypeGeometry {
  const key = JSON.stringify([l.text, l.font, l.size, l.scaleX, l.tracking, l.leading, l.align, l.chamfer, l.notches, l.notchW, l.notchD, l.treatment, l.roundDots]);
  return geoCache.get(key, () => buildGeometry(l));
}

function buildGeometry(l: GeoKey): TypeGeometry {
  const font = getFont(l.font);
  const size = l.size;
  const em = size / font.unitsPerEm;
  const steps = Math.max(6, Math.min(24, Math.round(size / 30)));
  const lines = l.text.split('\n');
  const contours: Pt[][] = [];
  const notches: Rect[] = [];
  lines.forEach((line, li) => {
    const base = li * l.leading * size;
    // measure
    const glyphs = [...line].map((ch) => font.charToGlyph(ch));
    const pens: number[] = [];
    let pen = 0;
    glyphs.forEach((g, i) => {
      if (i > 0) pen += font.getKerningValue(glyphs[i - 1], g) * em * l.scaleX;
      pens.push(pen);
      pen += (g.advanceWidth ?? 0) * em * l.scaleX + l.tracking * size;
    });
    const width = pen - (glyphs.length ? l.tracking * size : 0);
    const off = l.align === 'center' ? -width / 2 : l.align === 'right' ? -width : 0;
    glyphs.forEach((g, i) => {
      const p = g.getPath(0, 0, size);
      const ox = off + pens[i];
      const pieces = toPieces(p.commands, steps, (x, y) => [ox + x * l.scaleX, base + y]);
      if (!pieces.length) return;
      let cts = pieces.map((pc) => (l.treatment === 'kv' ? octilinear(pc, l.chamfer, size) : flatPieces(pc))).filter((c) => c.length >= 3);
      if (!cts.length) return;
      if (l.treatment === 'kv' && l.roundDots && cts.length > 1) cts = cts.map((ct) => roundDot(ct, cts, size));
      contours.push(...cts);
      if (l.treatment !== 'kv' || l.notches === 'off') return;
      const areas = cts.map(area);
      let outerIdx = 0;
      areas.forEach((a, i) => {
        if (Math.abs(a) > Math.abs(areas[outerIdx])) outerIdx = i;
      });
      const outerSign = Math.sign(areas[outerIdx]);
      const gb = bboxOf(cts);
      cts.forEach((ct, i) => {
        if (Math.sign(areas[i]) === outerSign) return;
        const hb = bboxOf([ct]);
        if (hb.w < 2 || hb.h < 2) return;
        if (l.notches === 'tall' && hb.h < hb.w * 1.25) return;
        const nw = hb.w * l.notchW;
        const above = hb.y - gb.y;
        const below = gb.y + gb.h - (hb.y + hb.h);
        const dTop = Math.min(hb.w * l.notchD, above * 0.55);
        const dBot = Math.min(hb.w * l.notchD, below * 0.55);
        const cx = hb.x + hb.w / 2;
        const inset = Math.min(hb.h * 0.2, hb.w * 0.5);
        if (dTop > 1) notches.push({ x: cx - nw / 2, y: hb.y - dTop, w: nw, h: dTop + inset });
        if (dBot > 1) notches.push({ x: cx - nw / 2, y: hb.y + hb.h - inset, w: nw, h: dBot + inset });
      });
    });
  });
  const font0 = getFont(l.font);
  return { contours, notches, bbox: bboxOf(contours), lineCount: lines.length, capPx: capHeight(font0) * size };
}

export function tracePath(ctx: CanvasRenderingContext2D | Path2D, cts: Pt[][], dx = 0, dy = 0) {
  for (const ct of cts) {
    ctx.moveTo(ct[0][0] + dx, ct[0][1] + dy);
    for (let i = 1; i < ct.length; i++) ctx.lineTo(ct[i][0] + dx, ct[i][1] + dy);
    ctx.closePath();
  }
}

const rasterCache = new RasterCache<InkResult>(80);

export interface DrawCtx {
  scale: number;
  compWidth: number;
  color: (t: TypeStyle['fill']) => string;
}

export function headlineBounds(l: HeadlineLayer): Rect {
  const g = typeGeometry(l);
  return { x: l.x + g.bbox.x, y: l.y + g.bbox.y, w: g.bbox.w, h: g.bbox.h };
}

export function drawHeadline(ctx: CanvasRenderingContext2D, l: HeadlineLayer, dc: DrawCtx) {
  const g = typeGeometry(l);
  if (!g.contours.length) return;
  const color = dc.color(l.fill);
  if (l.treatment === 'clean') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    tracePath(ctx, g.contours, l.x, l.y);
    ctx.fill('nonzero');
    ctx.restore();
    return;
  }
  const b = headlineBounds(l);
  if (l.treatment === 'pixel') {
    const key = JSON.stringify(['px', l.text, l.font, l.size, l.scaleX, l.tracking, l.leading, l.align, l.cell, l.x, l.y, dc.compWidth, dc.scale, color]);
    const res = rasterCache.get(key, () => pixelate(g, l, b, dc, color));
    ctx.drawImage(res.canvas, res.x, res.y, res.w, res.h);
    return;
  }
  // KV treatment. Cache is keyed on the fractional position so the noise stays glued to the type
  // when it moves by whole pixels and the draw stays pixel-aligned.
  const fx = l.x - Math.floor(l.x);
  const fy = l.y - Math.floor(l.y);
  const key = JSON.stringify(['kv', l.id, l.text, l.font, l.size, l.scaleX, l.tracking, l.leading, l.align, l.chamfer, l.notches, l.notchW, l.notchD, l.rough, l.soft, fx, fy, dc.scale, color]);
  const res = rasterCache.get(key, () =>
    inkify(
      { x: fx + g.bbox.x, y: fy + g.bbox.y, w: g.bbox.w, h: g.bbox.h },
      (c) => {
        c.beginPath();
        tracePath(c, g.contours, fx, fy);
        c.fill('nonzero');
        if (g.notches.length) {
          c.globalCompositeOperation = 'destination-out';
          for (const n of g.notches) c.fillRect(n.x + fx, n.y + fy, n.w, n.h);
          c.globalCompositeOperation = 'source-over';
        }
      },
      {
        scale: dc.scale,
        softPx: l.soft * l.size * 0.016,
        rough: l.rough,
        roughScale: Math.max(2, l.size * 0.012),
        seed: hashStr(l.id),
        color,
      },
    ),
  );
  ctx.drawImage(res.canvas, Math.floor(l.x) + res.x, Math.floor(l.y) + res.y, res.w, res.h);
}

/** tMSC level-2 pixel: raster, sample cell centres on the global grid, hard squares. */
function pixelate(g: TypeGeometry, l: HeadlineLayer, b: Rect, dc: DrawCtx, color: string): InkResult {
  const cell = Math.max(2, Math.round((l.cell * dc.compWidth) / 1080));
  const s = dc.scale;
  const x0 = Math.floor((b.x - cell) / cell) * cell;
  const y0 = Math.floor((b.y - cell) / cell) * cell;
  const x1 = Math.ceil((b.x + b.w + cell) / cell) * cell;
  const y1 = Math.ceil((b.y + b.h + cell) / cell) * cell;
  const cols = (x1 - x0) / cell;
  const rows = (y1 - y0) / cell;
  // mask at 1 px per comp px is enough to read cell centres
  const hi = document.createElement('canvas');
  hi.width = x1 - x0;
  hi.height = y1 - y0;
  const hc = hi.getContext('2d', { willReadFrequently: true })!;
  hc.translate(-x0, -y0);
  hc.beginPath();
  tracePath(hc, g.contours, l.x, l.y);
  hc.fill('nonzero');
  const data = hc.getImageData(0, 0, hi.width, hi.height).data;
  const out = document.createElement('canvas');
  out.width = Math.ceil((x1 - x0) * s);
  out.height = Math.ceil((y1 - y0) * s);
  const oc = out.getContext('2d')!;
  oc.fillStyle = color;
  const cs = cell * s;
  for (let j = 0; j < rows; j++) {
    const sy = Math.min(hi.height - 1, Math.floor(j * cell + cell / 2));
    for (let i = 0; i < cols; i++) {
      const sx = Math.min(hi.width - 1, Math.floor(i * cell + cell / 2));
      if (data[(sy * hi.width + sx) * 4 + 3] >= 128) oc.fillRect(Math.round(i * cs), Math.round(j * cs), Math.ceil(cs), Math.ceil(cs));
    }
  }
  return { canvas: out, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
