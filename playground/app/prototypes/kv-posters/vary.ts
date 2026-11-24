import { fitSize, type Measure } from "./elements";
import type { Frame } from "./layouts";
import type { Rng } from "./random";
import type { Element, Headline } from "./types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The layouts are starting points; this makes every seed its own poster: motifs move, grow,
 * turn and change petal counts, and the headline often gets a new split, size and place.
 */
export function vary(els: Element[], r: Rng, f: Frame, m: Measure): Element[] {
  return els.map((e) => {
    if (e.kind === "flower" || e.kind === "spiral") {
      const rad = clamp(e.r * r.range(0.78, 1.3), f.U * 0.12, f.U * 0.45);
      const base = {
        ...e,
        r: rad,
        cx: clamp(e.cx + r.range(-0.14, 0.14) * f.W, f.x + rad * 0.4, f.x + f.w - rad * 0.4),
        cy: clamp(e.cy + r.range(-0.12, 0.12) * f.H, f.y + rad * 0.4, f.y + f.h - rad * 0.4),
        rot: r.range(-Math.PI, Math.PI),
      };
      if (e.kind === "spiral") return { ...base, rings: clamp(e.rings + r.int(-1, 1), 2, 6), perRing: clamp(e.perRing + r.int(-2, 3), 5, 12) } as Element;
      return { ...base, petals: clamp(e.petals + r.int(-2, 3), e.style === "scallop" ? 10 : 5, 18), ticks: r.chance(0.8) } as Element;
    }
    if (e.kind === "headline" && r.chance(0.6)) return headlineVariant(e, r, f, m);
    return e;
  });
}

/** A new split, size and spot for the headline, always inside the frame and clear of the bottom row. */
export function headlineVariant(h: Headline, r: Rng, f: Frame, m: Measure): Headline {
  const vertical = f.H > f.W * 1.1 && r.chance(0.18);
  const text = r.pick(["Motion,\nNow", "Motion, Now", "Motion,\nNow"]);
  const safeH = f.h * 0.78;
  if (vertical) {
    const size = fitSize(m, text, f.w * r.range(0.16, 0.26), safeH * r.range(0.7, 1), true);
    const b = m(text, size);
    const left = r.chance(0.5);
    return { ...h, text, size, vertical, x: left ? f.x + f.W * 0.012 : f.x + f.w - b.h - f.W * 0.012, y: f.y + f.h * 0.015 };
  }
  const size = fitSize(m, text, f.w * r.range(0.5, 0.97), f.h * r.range(0.14, text.includes("\n") ? 0.32 : 0.16));
  const b = m(text, size);
  const x = f.x + f.W * 0.012 + r() * Math.max(0, f.w - b.w - f.W * 0.024);
  const y = r.chance(0.65) ? f.y + f.h * r.range(0.01, 0.06) : f.y + r() * Math.max(0, safeH - b.h);
  return { ...h, text, size, vertical: false, x, y };
}
