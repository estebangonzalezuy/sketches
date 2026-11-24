import { bounds } from "./bounds";
import { headlineContours } from "./draw-type";
import type { Element } from "./types";

export type Pt = [number, number];

/** A bezier anchor and, for curves, its tangent handle (drawn both ways). */
export interface Anchor {
  x: number;
  y: number;
  hx?: number;
  hy?: number;
}

/** One outline to draw on: a polyline (closed loops repeat their first point) with its anchors. */
export interface Stroke {
  pts: Pt[];
  anchors: Anchor[];
}

const KAPPA = 0.5523;

/** Ellipse as a polyline plus its four bezier anchors with handles, like a vector app draws it. */
function ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0, start = 0): Stroke {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const at = (x: number, y: number): Pt => [cx + x * c - y * s, cy + x * s + y * c];
  const pts: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = start + (i / 48) * Math.PI * 2;
    pts.push(at(Math.cos(a) * rx, Math.sin(a) * ry));
  }
  const anchors: Anchor[] = [0, 1, 2, 3].map((q) => {
    const a = start + (q * Math.PI) / 2;
    const [x, y] = at(Math.cos(a) * rx, Math.sin(a) * ry);
    // tangent, scaled to the bezier handle length
    const tx = -Math.sin(a) * rx * KAPPA;
    const ty = Math.cos(a) * ry * KAPPA;
    return { x, y, hx: tx * c - ty * s, hy: tx * s + ty * c };
  });
  return { pts, anchors };
}

const rect = (x: number, y: number, w: number, h: number): Stroke => {
  const pts: Pt[] = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  return { pts, anchors: pts.slice(0, 4).map(([px, py]) => ({ x: px, y: py })) };
};

/** Type contours: every vertex is on the outline; a few become visible anchors with short handles. */
function contour(ct: Pt[], size: number): Stroke {
  const pts = [...ct, ct[0]];
  const every = Math.max(1, Math.floor(ct.length / 6));
  const anchors: Anchor[] = [];
  for (let i = 0; i < ct.length; i += every) {
    const [x, y] = ct[i];
    const [nx, ny] = ct[(i + 1) % ct.length];
    const d = Math.hypot(nx - x, ny - y) || 1;
    const h = Math.min(d * 0.5, size * 0.05);
    anchors.push({ x, y, hx: ((nx - x) / d) * h, hy: ((ny - y) / d) * h });
  }
  return { pts, anchors };
}

/** The outlines an element is built from, in poster coordinates (at rest). */
export function outlinesOf(e: Element): Stroke[] {
  switch (e.kind) {
    case "block":
      return [rect(e.x, e.y, e.w, e.h)];
    case "bands":
      return e.fills.map((_, i) => rect(e.x + i * e.band, e.y + i * e.band, e.w - 2 * i * e.band, e.h - 2 * i * e.band)).filter((s) => s.pts[1][0] > s.pts[0][0]);
    case "flower": {
      const out: Stroke[] = [];
      const n = e.petals;
      for (let i = 0; i < n; i++) {
        const a = e.rot + (i * Math.PI * 2) / n;
        if (e.style === "scallop") {
          const b = e.r * Math.sin(Math.PI / n) * 1.15;
          out.push(ellipse(e.cx + Math.cos(a) * (e.r - b), e.cy + Math.sin(a) * (e.r - b), b, b, a));
        } else {
          const pr = e.r * 0.32;
          const d = e.r - pr;
          out.push(ellipse(e.cx + Math.sin(a) * d, e.cy - Math.cos(a) * d, pr * 1.05, pr * 1.12, a));
        }
      }
      out.push(ellipse(e.cx, e.cy, e.r * 0.5, e.r * 0.5, e.rot));
      const dr = e.r * 0.135;
      for (let i = 0; i < 7; i++) {
        const a = e.rot + (i - 1) * (Math.PI / 3);
        const [x, y] = i === 0 ? [e.cx, e.cy] : [e.cx + Math.cos(a) * dr * 2.05, e.cy + Math.sin(a) * dr * 2.05];
        out.push(ellipse(x, y, dr, dr, a));
      }
      return out;
    }
    case "spiral": {
      const out: Stroke[] = [];
      for (let k = e.rings - 1; k >= 0; k--) {
        const rr = e.r * (0.3 + (0.7 * (k + 1)) / e.rings);
        const cr = rr * 0.42;
        for (let j = 0; j < e.perRing; j++) {
          const a = e.rot + k * 0.5 + (j * Math.PI * 2) / e.perRing;
          out.push(ellipse(e.cx + Math.cos(a) * (rr - cr), e.cy + Math.sin(a) * (rr - cr), cr, cr, a));
        }
      }
      out.push(ellipse(e.cx, e.cy, e.r * 0.2, e.r * 0.2));
      return out;
    }
    case "headline":
      return headlineContours(e).filter((c) => c.length > 2).map((c) => contour(c, e.size));
    case "lockup": {
      const b = bounds(e);
      return [rect(b.x, b.y, b.w, b.h)];
    }
    case "mark": {
      const s = e.size;
      const w = s * 0.34;
      const L = s * 0.9;
      const arms: Stroke[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const at = (x: number, y: number): Pt => [e.cx + x * c - y * sn, e.cy + x * sn + y * c];
        const pts = [at(-w / 2, 0), at(-w / 2, -L), at(w / 2, -L), at(w / 2, 0)];
        arms.push({ pts, anchors: [pts[1], pts[2]].map(([x, y]) => ({ x, y })) });
      }
      return e.box ? [rect(e.cx - s * 1.05, e.cy - s * 1.05, s * 2.1, s * 2.1), ...arms] : arms;
    }
  }
}
