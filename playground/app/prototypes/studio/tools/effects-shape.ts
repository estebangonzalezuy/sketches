import { invert3, squareToQuad, type Pt, type Rect } from "../engine/geometry";
import { runShader } from "../engine/gl";
import { pixelShape } from "../engine/pixel-shape";
import { cornerPin as pinPaths, radialWarp as warpPaths } from "../engine/shape-effects";
import type { Value } from "../model/types";
import type { EffectDef, Handle } from "./types";

const PINS = ["tl", "tr", "br", "bl"] as const;
const pinHandle = (param: string): Handle => ({
  param,
  toLayer: (v, b) => [b.x + (v as Pt)[0] * b.w, b.y + (v as Pt)[1] * b.h],
  fromLayer: ([x, y], b) => [(x - b.x) / Math.max(1e-6, b.w), (y - b.y) / Math.max(1e-6, b.h)] as Value,
});

const PIN_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform mat3 u_inv;
uniform vec4 u_out;  // output rect in layer px: x, y, w, h
uniform vec4 u_src;  // source rect in layer px
out vec4 o;
void main() {
  vec2 p = u_out.xy + vec2(v_uv.x, 1.0 - v_uv.y) * u_out.zw;
  vec3 q = u_inv * vec3(p, 1.0);
  vec2 uv = q.xy / q.z;           // 0..1 inside the source box
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) { o = vec4(0.0); return; }
  o = texture(u_tex, vec2(uv.x, 1.0 - uv.y));
}`;

/** Corner pin: four pins in box units. Bends contours on vector layers, warps the bitmap in GL on raster ones. */
export const cornerPin: EffectDef = {
  id: "corner-pin",
  name: "Corner Pin",
  params: {
    tl: { kind: "vec2", label: "Top left", default: [0, 0], step: 0.01 },
    tr: { kind: "vec2", label: "Top right", default: [1, 0], step: 0.01 },
    br: { kind: "vec2", label: "Bottom right", default: [1, 1], step: 0.01 },
    bl: { kind: "vec2", label: "Bottom left", default: [0, 1], step: 0.01 },
  },
  handles: PINS.map(pinHandle),
  vector: (paths, p) => pinPaths(paths, PINS.map((k) => p[k] as Pt) as [Pt, Pt, Pt, Pt]),
  raster(c, p, ctx) {
    const b = c.rect;
    const quad = PINS.map((k) => pinHandle(k).toLayer(p[k], b)) as [Pt, Pt, Pt, Pt];
    const xs = quad.map((q) => q[0]);
    const ys = quad.map((q) => q[1]);
    const out: Rect = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    // layer px → source box units: inverse of (unit square → quad)
    const inv = invert3(squareToQuad(quad));
    const s = c.canvas.width / b.w;
    const cv = runShader("corner-pin", PIN_FRAG, out.w * s, out.h * s, { u_inv: inv, u_out: [out.x, out.y, out.w, out.h], u_src: [b.x, b.y, b.w, b.h] }, ctx.slot, c.canvas);
    return { kind: "raster", canvas: cv, rect: out };
  },
};

/** Pixel of the shape: cells sampled from the outline, returned as vector squares. */
export const pixel: EffectDef = {
  id: "pixel-shape",
  name: "Pixel (shape)",
  params: { cell: { kind: "number", label: "Cell", default: 12, min: 0, max: 160, step: 1, unit: "px" } },
  vector: (paths, p) => pixelShape(paths, Number(p.cell)),
};

/** Radial warp: the box bent around a centre, letters standing on a ring (x → angle, y → radius). */
export const radial: EffectDef = {
  id: "radial-warp",
  name: "Radial Warp",
  params: {
    amount: { kind: "number", label: "Amount", default: 1, min: 0, max: 1, step: 0.01 },
    center: { kind: "vec2", label: "Centre", default: [0, 600], step: 1 },
    inner: { kind: "number", label: "Inner radius", default: 300, min: 0, max: 4000, step: 1, unit: "px" },
    depth: { kind: "number", label: "Depth", default: 300, min: -2000, max: 2000, step: 1, unit: "px" },
    angle: { kind: "number", label: "Start angle", default: -150, min: -720, max: 720, step: 1, unit: "°" },
    sweep: { kind: "number", label: "Sweep", default: 120, min: -720, max: 720, step: 1, unit: "°" },
  },
  handles: [{ param: "center", toLayer: (v) => v as Pt, fromLayer: (pt) => [Math.round(pt[0]), Math.round(pt[1])] }],
  vector: (paths, p) =>
    warpPaths(paths, {
      amount: Number(p.amount),
      center: p.center as Pt,
      inner: Number(p.inner),
      depth: Number(p.depth),
      angle: Number(p.angle),
      sweep: Number(p.sweep),
    }),
};
