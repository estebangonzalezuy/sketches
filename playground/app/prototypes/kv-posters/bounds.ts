import { headlineBox, lockupBox } from "./draw-type";
import type { Element } from "./types";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function bounds(e: Element): Rect {
  switch (e.kind) {
    case "block":
    case "bands":
      return { x: e.x, y: e.y, w: e.w, h: e.h };
    case "arc": {
      const R = e.r + e.band * e.fills.length;
      return { x: e.cx - R, y: e.cy - R, w: 2 * R, h: 2 * R };
    }
    case "flower":
    case "spiral":
      return { x: e.cx - e.r, y: e.cy - e.r, w: 2 * e.r, h: 2 * e.r };
    case "mark":
      return { x: e.cx - e.size * 1.05, y: e.cy - e.size * 1.05, w: e.size * 2.1, h: e.size * 2.1 };
    case "headline": {
      const b = headlineBox(e.text, e.size);
      return e.vertical ? { x: e.x, y: e.y, w: b.h, h: b.w } : { x: e.x, y: e.y, ...b };
    }
    case "lockup":
      return { x: e.x, y: e.y, ...lockupBox(e) };
  }
}

/** Front-most element under a point. Background kinds lose to anything drawn over them. */
export function hit(els: Element[], x: number, y: number): Element | null {
  const inside = (e: Element) => {
    const b = bounds(e);
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  };
  const front = [...els].reverse();
  return front.find((e) => e.kind !== "block" && e.kind !== "bands" && inside(e)) ?? front.find(inside) ?? null;
}

/** Move an element by dx, dy (centre- or corner-anchored alike). */
export function moved<E extends Element>(e: E, dx: number, dy: number): E {
  if ("cx" in e) return { ...e, cx: e.cx + dx, cy: e.cy + dy };
  return { ...e, x: e.x + dx, y: e.y + dy };
}
