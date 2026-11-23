import { invert3, squareToQuad } from "@/lib/studio/engine/geometry";
import type { Quad } from "./types";
import type { WordTexture } from "./word-textures";

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

// Every pixel asks: where in the word's unit square do I land? (inverse homography)
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform mat3 u_inv;
uniform vec2 u_res;
uniform vec3 u_ink;
out vec4 o;
void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec3 q = u_inv * vec3(p, 1.0);
  vec2 uv = q.xy / q.z;
  if (q.z <= 0.0 || uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard;
  float a = texture(u_tex, uv).a;
  o = vec4(u_ink * a, a);
}`;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

/**
 * Draws each word as a quad warped by its four corners: a projective (homography) map, not
 * an affine one, so the perspective reads. One full-screen pass per word, flat two colours.
 */
export class PinRenderer {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private textures = new Map<string, WebGLTexture>();

  constructor(readonly canvas: HTMLCanvasElement | OffscreenCanvas) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true }) as WebGL2RenderingContext | null;
    if (!gl) throw new Error("This browser has no WebGL2.");
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    this.prog = gl.createProgram()!;
    gl.attachShader(this.prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(this.prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(this.prog, 0, "a");
    gl.linkProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  private texture(w: WordTexture): WebGLTexture {
    const gl = this.gl;
    let t = this.textures.get(w.word);
    if (t) return t;
    t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // row 0 = top, like canvas px
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, w.canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures.set(w.word, t);
    return t;
  }

  render(words: WordTexture[], quads: Quad[], ink: string, ground: string) {
    const gl = this.gl;
    const W = this.canvas.width;
    const H = this.canvas.height;
    gl.viewport(0, 0, W, H);
    const [r, g, b] = rgb(ground);
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2f(gl.getUniformLocation(this.prog, "u_res"), W, H);
    gl.uniform3f(gl.getUniformLocation(this.prog, "u_ink"), ...rgb(ink));
    words.forEach((w, i) => {
      if (!quads[i]) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture(w));
      gl.uniform1i(gl.getUniformLocation(this.prog, "u_tex"), 0);
      gl.uniformMatrix3fv(gl.getUniformLocation(this.prog, "u_inv"), true, invert3(squareToQuad(quads[i])));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  dispose() {
    this.textures.forEach((t) => this.gl.deleteTexture(t));
    this.textures.clear();
  }
}
