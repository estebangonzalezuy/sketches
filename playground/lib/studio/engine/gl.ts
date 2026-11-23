/**
 * The WebGL2 side of the studio: one shared context runs fragment shaders over a layer's
 * bitmap (effects) or over nothing (generators). Each call copies its result into a 2D canvas
 * owned by `slot`, so the shared GL canvas can be reused straight away.
 */
type Uniform = number | [number, number] | [number, number, number] | number[];

let gl: WebGL2RenderingContext | null = null;
let glCanvas: HTMLCanvasElement | null = null;
const programs = new Map<string, WebGLProgram>();
const slots = new Map<string, HTMLCanvasElement>();
let tex: WebGLTexture | null = null;

const VERT = `#version 300 es
in vec2 a;
out vec2 v_uv;
void main() { v_uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

function context(): WebGL2RenderingContext {
  if (gl) return gl;
  glCanvas = document.createElement("canvas");
  const g = glCanvas.getContext("webgl2", { premultipliedAlpha: true, preserveDrawingBuffer: true });
  if (!g) throw new Error("This browser has no WebGL2.");
  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  tex = g.createTexture();
  gl = g;
  return g;
}

function program(g: WebGL2RenderingContext, name: string, frag: string): WebGLProgram {
  let p = programs.get(name);
  if (p) return p;
  const sh = (type: number, src: string) => {
    const s = g.createShader(type)!;
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(`${name}: ${g.getShaderInfoLog(s)}`);
    return s;
  };
  p = g.createProgram()!;
  g.attachShader(p, sh(g.VERTEX_SHADER, VERT));
  g.attachShader(p, sh(g.FRAGMENT_SHADER, frag));
  g.bindAttribLocation(p, 0, "a");
  g.linkProgram(p);
  if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(`${name}: ${g.getProgramInfoLog(p)}`);
  programs.set(name, p);
  return p;
}

/** Runs `frag` at w×h px. `input` (premultiplied) is bound as u_tex. Returns the slot's canvas. */
export function runShader(
  name: string,
  frag: string,
  w: number,
  h: number,
  uniforms: Record<string, Uniform>,
  slot: string,
  input?: TexImageSource,
): HTMLCanvasElement {
  const g = context();
  const W = Math.max(1, Math.min(4096, Math.round(w)));
  const H = Math.max(1, Math.min(4096, Math.round(h)));
  glCanvas!.width = W;
  glCanvas!.height = H;
  g.viewport(0, 0, W, H);
  const p = program(g, name, frag);
  g.useProgram(p);
  g.enableVertexAttribArray(0);
  g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  if (input) {
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, tex);
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, input);
    for (const [k, v] of [[g.TEXTURE_MIN_FILTER, g.LINEAR], [g.TEXTURE_MAG_FILTER, g.LINEAR], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]])
      g.texParameteri(g.TEXTURE_2D, k, v);
    g.uniform1i(g.getUniformLocation(p, "u_tex"), 0);
  }
  g.uniform2f(g.getUniformLocation(p, "u_res"), W, H);
  for (const [k, v] of Object.entries(uniforms)) {
    const loc = g.getUniformLocation(p, k);
    if (!loc) continue;
    if (typeof v === "number") g.uniform1f(loc, v);
    else if (v.length === 2) g.uniform2f(loc, v[0], v[1]);
    else if (v.length === 3) g.uniform3f(loc, v[0], v[1], v[2]);
    else g.uniformMatrix3fv(loc, true, v);
  }
  g.clearColor(0, 0, 0, 0);
  g.clear(g.COLOR_BUFFER_BIT);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  let out = slots.get(slot);
  if (!out) slots.set(slot, (out = document.createElement("canvas")));
  out.width = W;
  out.height = H;
  const o = out.getContext("2d")!;
  o.clearRect(0, 0, W, H);
  o.drawImage(glCanvas!, 0, 0);
  return out;
}

export const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
