import { rgb, runShader } from "../engine/gl";
import type { EffectDef, GeneratorDef } from "./types";

const FIELD_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform vec2 u_res;
uniform float u_time, u_scale, u_bands, u_warp;
uniform vec3 u_a, u_b;
out vec4 o;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 p = v_uv * vec2(u_res.x / u_res.y, 1.0) * u_scale;
  float w = n(p + u_time * 0.3) * u_warp;
  float v = fract((p.y + w + n(p * 0.5 - u_time * 0.2)) * u_bands * 0.5);
  o = vec4(mix(u_a, u_b, step(0.5, v)), 1.0);
}`;

/** A GL generator: hard-edged bands of two colours, pushed around by animated noise. */
export const shaderField: GeneratorDef = {
  id: "shader-field",
  name: "Shader Field (GL)",
  engine: "gl",
  params: {
    size: { kind: "vec2", label: "Size", default: [1920, 1080], step: 1 },
    a: { kind: "color", label: "Colour A", default: "#f5e85a" },
    b: { kind: "color", label: "Colour B", default: "#fb81bc" },
    scale: { kind: "number", label: "Scale", default: 3, min: 0.2, max: 20, step: 0.1 },
    bands: { kind: "number", label: "Bands", default: 6, min: 1, max: 40, step: 0.5 },
    warp: { kind: "number", label: "Warp", default: 1.2, min: 0, max: 6, step: 0.05 },
    speed: { kind: "number", label: "Speed", default: 0.6, min: 0, max: 5, step: 0.05 },
  },
  generate(p, ctx) {
    const [w, h] = p.size as [number, number];
    const k = Math.min(ctx.scale, 1);
    const cv = runShader("field", FIELD_FRAG, w * k, h * k, { u_time: ctx.local * Number(p.speed), u_scale: Number(p.scale), u_bands: Number(p.bands), u_warp: Number(p.warp), u_a: rgb(String(p.a)), u_b: rgb(String(p.b)) }, ctx.slot);
    return { kind: "raster", canvas: cv, rect: { x: -w / 2, y: -h / 2, w, h } };
  },
};

const WAVE_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_amp, u_freq, u_phase, u_angle, u_pad;
out vec4 o;
void main() {
  vec2 px = v_uv * u_res;
  vec2 dir = vec2(cos(u_angle), sin(u_angle));
  vec2 nrm = vec2(-dir.y, dir.x);
  float s = sin(dot(px, dir) * u_freq + u_phase) * u_amp;
  vec2 src = (px + nrm * s - u_pad) / (u_res - 2.0 * u_pad);
  if (src.x < 0.0 || src.y < 0.0 || src.x > 1.0 || src.y > 1.0) { o = vec4(0.0); return; }
  o = texture(u_tex, src);
}`;

/** A GL effect: the layer's bitmap displaced by a travelling sine wave. */
export const wave: EffectDef = {
  id: "wave",
  name: "Wave (GL)",
  params: {
    amplitude: { kind: "number", label: "Amplitude", default: 24, min: 0, max: 400, step: 1, unit: "px" },
    wavelength: { kind: "number", label: "Wavelength", default: 260, min: 10, max: 3000, step: 1, unit: "px" },
    speed: { kind: "number", label: "Speed", default: 1, min: -10, max: 10, step: 0.05 },
    angle: { kind: "number", label: "Direction", default: 0, min: -180, max: 180, step: 1, unit: "°" },
  },
  raster(c, p, ctx) {
    const s = c.canvas.width / c.rect.w;
    const amp = Number(p.amplitude);
    const out = { x: c.rect.x - amp, y: c.rect.y - amp, w: c.rect.w + 2 * amp, h: c.rect.h + 2 * amp };
    const cv = runShader(
      "wave",
      WAVE_FRAG,
      out.w * s,
      out.h * s,
      { u_amp: amp * s, u_freq: (2 * Math.PI) / (Number(p.wavelength) * s), u_phase: ctx.local * Number(p.speed) * 2 * Math.PI, u_angle: (Number(p.angle) * Math.PI) / 180, u_pad: amp * s },
      ctx.slot,
      c.canvas,
    );
    return { kind: "raster", canvas: cv, rect: out };
  },
};
