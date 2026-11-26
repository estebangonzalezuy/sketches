import type { Ctx } from "./canvas-type";

/**
 * Type built from dots: the word is rasterised to a mask and a grid of overlapping filled
 * circles covers the inside. The same dots, drawn as thin outlines and dropped a little down
 * and to the left, sit behind it like a printed shadow.
 * Deterministic. Returns the word's box on the page.
 */
export function dotType(ctx: Ctx, text: string, fontCss: string, cx: number, baseline: number, o: { step: number; ink: string }) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const m = document.createElement("canvas");
  m.width = W;
  m.height = H;
  const g = m.getContext("2d", { willReadFrequently: true })!;
  // same transform as the page, so the mask lines up with what we draw
  g.setTransform(ctx.getTransform());
  g.font = fontCss;
  g.textAlign = "center";
  g.fillText(text, cx, baseline);
  const box = g.measureText(text);
  const alpha = g.getImageData(0, 0, W, H).data;
  const t = ctx.getTransform();
  const inside = (x: number, y: number) => {
    const px = Math.round(t.a * x + t.c * y + t.e);
    const py = Math.round(t.b * x + t.d * y + t.f);
    return px >= 0 && py >= 0 && px < W && py < H && alpha[(py * W + px) * 4 + 3] > 120;
  };

  const s = o.step;
  const r = s * 0.7;
  const x0 = cx - box.actualBoundingBoxLeft - s * 2;
  const x1 = cx + box.actualBoundingBoxRight + s * 2;
  const y0 = baseline - box.actualBoundingBoxAscent - s * 2;
  const y1 = baseline + box.actualBoundingBoxDescent + s * 2;
  const fills: [number, number][] = [];
  for (let y = y0; y <= y1; y += s) for (let x = x0; x <= x1; x += s) if (inside(x, y)) fills.push([x, y]);
  const rings = fills.map(([x, y]) => [x - s * 0.8, y + s * 1.7] as [number, number]);
  ctx.save();
  ctx.lineWidth = Math.max(1, s * 0.09);
  ctx.strokeStyle = o.ink;
  // the halo: outlines only, so neighbouring rings cross like in a print proof
  for (const [x, y] of rings) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = o.ink;
  for (const [x, y] of fills) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return { left: cx - box.actualBoundingBoxLeft, right: cx + box.actualBoundingBoxRight, top: baseline - box.actualBoundingBoxAscent, bottom: baseline + box.actualBoundingBoxDescent };
}
