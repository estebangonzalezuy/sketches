import * as THREE from "three";
import type { Params as MbParams, RenderContext, ToolDefinition, ToolInstance } from "@/lib/motion-builder/core/tool";

/**
 * Runs Motion Builder tools (three.js) inside the studio. One shared renderer; one live
 * instance per layer/effect slot. Each tool renders into its own target exactly as in Motion
 * Builder (design unit = short side / 1080, premultiplied sRGB, blit), then the result is
 * copied to a 2D canvas the studio composites like any other bitmap.
 *
 * prepare() is async (fonts, rebuilds): it starts on first use and whenever a non-frame
 * param changes; until it resolves the previous state renders (or nothing, the first time),
 * and listeners are told to redraw once it lands. The exporter waits with `mbIdle()`.
 */
type Live = { def: ToolDefinition; instance: ToolInstance; prepared: string | null; pending: Promise<void> | null; target: THREE.WebGLRenderTarget | null; out: HTMLCanvasElement };

let renderer: THREE.WebGLRenderer | null = null;
let blitter: { draw(tex: THREE.Texture, target: THREE.WebGLRenderTarget | null): void } | null = null;
const live = new Map<string, Live>();
const listeners = new Set<() => void>();
const inputs = new Map<string, THREE.CanvasTexture>();

export const onMbReady = (cb: () => void) => (listeners.add(cb), () => void listeners.delete(cb));
export const mbBusy = () => [...live.values()].some((l) => l.pending);
export async function mbIdle() {
  while (mbBusy()) await Promise.all([...live.values()].map((l) => l.pending));
}

function setup() {
  if (renderer) return renderer;
  const canvas = document.createElement("canvas");
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const material = new THREE.ShaderMaterial({
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: "uniform sampler2D uTex; varying vec2 vUv; void main() { gl_FragColor = texture2D(uTex, vUv); }",
    uniforms: { uTex: { value: null } },
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  blitter = {
    draw(tex, target) {
      material.uniforms.uTex.value = tex;
      renderer!.setRenderTarget(target);
      renderer!.render(scene, camera);
    },
  };
  return renderer;
}

function slotOf(slot: string, def: ToolDefinition): Live {
  let l = live.get(slot);
  if (l && l.def.id !== def.id) {
    l.instance.dispose();
    l = undefined;
  }
  if (!l) live.set(slot, (l = { def, instance: def.create(), prepared: null, pending: null, target: null, out: document.createElement("canvas") }));
  return l;
}

export type MbRun = {
  slot: string;
  width: number;
  height: number;
  /** seconds since the layer's in point */
  time: number;
  fps: number;
  duration: number;
  seed: number;
  integral: (param: string) => number;
  /** bitmap fed to the tool's first input (effects), drawn top-down */
  input?: HTMLCanvasElement | OffscreenCanvas;
};

/** Renders one frame of an MB tool. Returns its canvas, or null while it's still preparing for the first time. */
export function runMb(def: ToolDefinition, params: MbParams, run: MbRun): HTMLCanvasElement | null {
  const r = setup();
  const W = Math.max(2, Math.min(4096, Math.round(run.width)));
  const H = Math.max(2, Math.min(4096, Math.round(run.height)));
  const l = slotOf(run.slot, def);
  if (!l.target || l.target.width !== W || l.target.height !== H) {
    l.target?.dispose();
    l.target = new THREE.WebGLRenderTarget(W, H, { format: THREE.RGBAFormat, type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, generateMipmaps: false });
  }
  const target = l.target;
  const ins: Record<string, THREE.Texture | null> = {};
  if (run.input && def.inputs[0]) {
    let tex = inputs.get(run.slot);
    if (!tex || tex.image !== run.input) {
      tex?.dispose();
      tex = new THREE.CanvasTexture(run.input as HTMLCanvasElement);
      tex.premultiplyAlpha = true;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      inputs.set(run.slot, tex);
    }
    tex.needsUpdate = true;
    ins[def.inputs[0].id] = tex;
  }
  const frame = Math.round(run.time * run.fps);
  const ctx: RenderContext = {
    renderer: r,
    target,
    width: W,
    height: H,
    aspect: W / H,
    unit: Math.min(W, H) / 1080,
    frame,
    fps: run.fps,
    time: frame / run.fps,
    durationFrames: Math.max(1, Math.round(run.duration * run.fps)),
    seed: run.seed,
    loop: null,
    inputs: ins,
    integral: run.integral,
    blit: (texture) => blitter!.draw(texture, target),
  };
  const key = JSON.stringify(Object.entries(def.params).filter(([, s]) => s.animate !== "frame").map(([k]) => params[k]));
  if (key !== l.prepared && !l.pending) {
    const p = Promise.resolve(l.instance.prepare?.(params, ctx)).then(
      () => {
        l.prepared = key;
        l.pending = null;
        listeners.forEach((cb) => cb());
      },
      (e) => {
        console.error(`${def.name}: ${e instanceof Error ? e.message : e}`);
        l.prepared = key;
        l.pending = null;
      },
    );
    l.pending = p;
  }
  if (l.prepared === null) return null;
  r.setRenderTarget(target);
  r.setClearColor(0x000000, 0);
  r.clear();
  l.instance.render(params, ctx);
  // target → the renderer's canvas → a 2D canvas owned by this slot
  r.setSize(W, H, false);
  blitter!.draw(target.texture, null);
  const out = l.out;
  if (out.width !== W || out.height !== H) {
    out.width = W;
    out.height = H;
  }
  const g = out.getContext("2d")!;
  g.clearRect(0, 0, W, H);
  g.drawImage(r.domElement, 0, 0);
  return out;
}
