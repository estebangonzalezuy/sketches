import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import * as THREE from "three";
import { RECORD_FORMATS, RECORD_FPS } from "./data";
import type { Driver } from "./driver";
import { fitCamera } from "./stage";
import { recordFrame } from "./timeline";
import type { RecordFormat } from "./types";

/**
 * Record: renders the deterministic sequence frame by frame at the export size, with the same
 * renderer, lights and textures as the live piece, and encodes an MP4 (H.264, VP9-in-MP4 only
 * if the browser has no H.264 encoder). No cursor, no UI, no watermark. Never GIF.
 */
export async function recordMp4(driver: Driver, format: RecordFormat, onProgress: (p: number) => void, signal: { cancel: boolean }): Promise<Blob> {
  if (typeof VideoEncoder === "undefined") throw new Error("This browser has no WebCodecs. Try Chrome, Edge or Safari 17+.");
  const state = driver.three?.();
  if (!state || !driver.apply) throw new Error("The magazine isn't ready yet.");
  const { gl, scene, camera } = state;
  const cam = camera as THREE.PerspectiveCamera;
  const { w, h } = RECORD_FORMATS[format];
  const fps = RECORD_FPS;
  const plan = driver.plan;
  if (!plan) throw new Error("The magazine isn't ready yet.");
  const frames = Math.round(plan.duration * fps);
  const { codec, mux } = await pickCodec(w, h, fps);

  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: mux, width: w, height: h, frameRate: fps }, fastStart: "in-memory" });
  let failure: unknown = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (failure = e) });
  enc.configure({ codec, width: w, height: h, bitrate: 14_000_000, framerate: fps });

  const prevRatio = gl.getPixelRatio();
  const prevSize = gl.getSize(new THREE.Vector2());
  driver.recording = true;
  state.setFrameloop("never");
  gl.setPixelRatio(1);
  gl.setSize(w, h, false);
  fitCamera(cam, w / h);
  gl.domElement.style.objectFit = "contain";
  try {
    for (let i = 0; i < frames; i++) {
      if (signal.cancel) throw new Error("Cancelled");
      if (failure) throw failure;
      const t = i / fps;
      const f = recordFrame(plan, t);
      driver.apply(f.sheets, f.drop, f.shadow, t);
      gl.render(scene, cam);
      const frame = new VideoFrame(gl.domElement, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (enc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 4));
      if (i % 6 === 0) {
        onProgress((i + 1) / frames);
        await new Promise((r) => setTimeout(r, 0)); // let the progress label paint
      }
    }
    await enc.flush();
    if (failure) throw failure;
    muxer.finalize();
    onProgress(1);
    return new Blob([muxer.target.buffer], { type: "video/mp4" });
  } finally {
    if (enc.state !== "closed") enc.close();
    gl.setPixelRatio(prevRatio);
    gl.setSize(prevSize.x, prevSize.y, false);
    fitCamera(cam, prevSize.x / prevSize.y);
    gl.domElement.style.objectFit = "";
    driver.recording = false;
    state.setFrameloop("always");
  }
}

async function pickCodec(width: number, height: number, fps: number): Promise<{ codec: string; mux: "avc" | "vp9" }> {
  const tries: [string, "avc" | "vp9"][] = [
    ["avc1.640032", "avc"],
    ["avc1.64002A", "avc"],
    ["avc1.4D402A", "avc"],
    ["vp09.00.41.08", "vp9"],
  ];
  for (const [codec, mux] of tries) {
    try {
      if ((await VideoEncoder.isConfigSupported({ codec, width, height, framerate: fps, bitrate: 14_000_000 })).supported) return { codec, mux };
    } catch {
      // try the next one
    }
  }
  throw new Error(`This browser can't encode ${width}×${height} video.`);
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
