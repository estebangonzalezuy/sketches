import type { AnimFrame } from "./animate";
import { drawFlower } from "./draw-flower";
import { drawFrame, drawGrid, drawPaper } from "./draw-frame";
import { drawArc, drawBands, drawBlock, drawMark, type Pen } from "./draw-shapes";
import { drawSpiral } from "./draw-spiral";
import { drawHeadline, drawLockup } from "./draw-type";
import type { Element, Palette, Poster } from "./types";

export interface RenderOpts {
  scale: number;
  grain: number;
  anim?: AnimFrame;
}

const BACK = new Set(["block", "bands"]);

/** The one render: preview, PNG and every MP4 frame. */
export function render(ctx: CanvasRenderingContext2D, p: Poster, pal: Palette, o: RenderOpts) {
  ctx.save();
  ctx.setTransform(o.scale, 0, 0, o.scale, 0, 0);
  const pen: Pen = { pal, lw: Math.max(1.5, p.width * 0.0027), line: p.line };
  drawPaper(ctx, p, pal, o.grain);
  const st = (e: Element) => o.anim?.els.get(e.id) ?? { p: 1, spin: 0 };
  for (const e of p.elements) if (BACK.has(e.kind)) draw(ctx, e, pen, st(e).p, st(e).spin);
  drawGrid(ctx, p, pal, o.anim?.frame ?? 1);
  drawFrame(ctx, p, pal, o.anim?.frame ?? 1);
  for (const e of p.elements) if (!BACK.has(e.kind)) draw(ctx, e, pen, st(e).p, st(e).spin);
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, e: Element, pen: Pen, p: number, spin: number) {
  switch (e.kind) {
    case "block":
      return drawBlock(ctx, e, pen, p);
    case "bands":
      return drawBands(ctx, e, pen, p);
    case "arc":
      return drawArc(ctx, e, pen, p);
    case "flower":
      return drawFlower(ctx, e, pen, p, spin);
    case "spiral":
      return drawSpiral(ctx, e, pen, p, spin);
    case "headline":
      return drawHeadline(ctx, e, pen, p);
    case "lockup":
      return drawLockup(ctx, e, pen, p);
    case "mark":
      return drawMark(ctx, e, pen, p, spin);
  }
}
