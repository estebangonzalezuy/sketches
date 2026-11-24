import { bounds } from "./bounds";
import type { Element, ElState, Poster } from "./types";

/**
 * Applies an element's entrance effect around its drawing. "build" hands progress to the
 * element's own KV build; the others draw the finished element and move, fade or scale it.
 */
export function withEffect(ctx: CanvasRenderingContext2D, e: Element, st: ElState, p: Poster, draw: (progress: number) => void) {
  const fx = st.effect ?? "build";
  if (fx === "build") return draw(st.p);
  const k = st.p;
  if (k <= 0) return;
  ctx.save();
  const b = bounds(e);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const fade = Math.min(1, k * 1.6);
  switch (fx) {
    case "fade":
      ctx.globalAlpha *= k;
      break;
    case "rise":
      ctx.translate(0, (1 - k) * p.height * 0.12);
      ctx.globalAlpha *= fade;
      break;
    case "drop":
      ctx.translate(0, -(1 - k) * p.height * 0.12);
      ctx.globalAlpha *= fade;
      break;
    case "slide":
      ctx.translate(-(1 - k) * p.width * 0.18, 0);
      ctx.globalAlpha *= fade;
      break;
    case "scale":
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.001, k), Math.max(0.001, k));
      ctx.translate(-cx, -cy);
      break;
    case "spin":
      ctx.translate(cx, cy);
      ctx.rotate((1 - k) * -Math.PI);
      ctx.scale(0.3 + 0.7 * k, 0.3 + 0.7 * k);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha *= fade;
      break;
  }
  draw(1);
  ctx.restore();
}
