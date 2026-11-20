import type { Project } from "../model/types";
import { isActive, layerMatrix, transformAt } from "./evaluate";
import { layerContent } from "./pipeline";
import { tracePaths } from "./raster";

/**
 * The one render: preview and every exported frame. Layers are composited back to front with
 * their blend and opacity; vector content is filled through the layer transform, so it's sharp
 * at any size.
 */
export function renderFrame(ctx: CanvasRenderingContext2D, project: Project, t: number, scale: number) {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = project.background;
  ctx.fillRect(0, 0, project.width, project.height);
  for (const l of project.layers) {
    if (!isActive(l, t)) continue;
    const tv = transformAt(l, t);
    if (tv.opacity <= 0.001 || tv.scale === 0) continue;
    const { content } = layerContent(project, l, t, scale);
    const m = layerMatrix(tv);
    ctx.save();
    ctx.globalCompositeOperation = l.blend;
    ctx.globalAlpha = Math.min(1, tv.opacity);
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    if (content.kind === "vector") tracePaths(ctx, content.paths);
    else ctx.drawImage(content.canvas, content.rect.x, content.rect.y, content.rect.w, content.rect.h);
    ctx.restore();
  }
  ctx.restore();
}
