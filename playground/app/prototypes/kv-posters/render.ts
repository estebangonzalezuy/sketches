import type { AnimFrame } from "./animate";
import { withEffect } from "./effects";
import { drawFlower } from "./draw-flower";
import { drawFrame, drawGrain, drawGrid, drawPaper } from "./draw-frame";
import { drawBands, drawBlock, drawMark, type Pen } from "./draw-shapes";
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
  const pen: Pen = { pal, lw: Math.max(1.5, p.width * 0.0027), line: p.line, scale: o.scale, cut: p.paint === "squares" };
  drawPaper(ctx, p, pal);
  const st = (e: Element) => o.anim?.els.get(e.id) ?? { p: 1, spin: 0, effect: "build" as const };
  const paint = (c: CanvasRenderingContext2D, e: Element) => withEffect(c, e, st(e), p, (k) => draw(c, e, pen, k, st(e).spin));
  for (const e of p.elements) if (BACK.has(e.kind)) paint(ctx, e);
  drawGrid(ctx, p, pal, o.anim?.frame ?? 1);
  drawFrame(ctx, p, pal, o.anim?.frame ?? 1);
  for (const e of p.elements) {
    if (BACK.has(e.kind)) continue;
    if (pen.cut && (e.kind === "flower" || e.kind === "spiral")) onLayer(ctx, (l) => paint(l, e));
    else paint(ctx, e);
  }
  drawGrain(ctx, o.grain);
  ctx.restore();
}

let layer: HTMLCanvasElement | null = null;

/** Draw on a transparent layer (so cut-outs erase only the motif itself), then composite it. */
function onLayer(ctx: CanvasRenderingContext2D, fn: (l: CanvasRenderingContext2D) => void) {
  layer ??= document.createElement("canvas");
  if (layer.width !== ctx.canvas.width || layer.height !== ctx.canvas.height) {
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;
  }
  const l = layer.getContext("2d")!;
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.clearRect(0, 0, layer.width, layer.height);
  l.setTransform(ctx.getTransform());
  fn(l);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, e: Element, pen: Pen, p: number, spin: number) {
  switch (e.kind) {
    case "block":
      return drawBlock(ctx, e, pen, p);
    case "bands":
      return drawBands(ctx, e, pen, p);
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
