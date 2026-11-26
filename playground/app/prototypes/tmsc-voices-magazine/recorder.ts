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
export type Recording = { blob: Blob; w: number; h: number; /** true when the browser couldn't encode the full size */ reduced: boolean };

export async function recordMp4(driver: Driver, format: RecordFormat, onProgress: (p: number) => void, signal: { cancel: boolean }): Promise<Recording> {
  if (typeof VideoEncoder === "undefined") throw new Error("This browser has no WebCodecs. Try Chrome, Edge or Safari 17+.");
  const state = driver.three?.();
  if (!state || !driver.apply) throw new Error("The magazine isn't ready yet.");
  const { gl, scene, camera } = state;
  const cam = camera as THREE.PerspectiveCamera;
  const full = RECORD_FORMATS[format];
  const fps = RECORD_FPS;
  const plan = driver.plan;
  if (!plan) throw new Error("The magazine isn't ready yet.");
  const frames = Math.round(plan.duration * fps);
  // the full (2×) size when the browser can encode it, otherwise half of it (the 1080 sizes)
  const pick = (await pickCodec(full.w, full.h, fps)) ?? (await pickCodec(full.w / 2, full.h / 2, fps));
  if (!pick) throw new Error(`This browser can't encode ${full.w / 2}×${full.h / 2} video.`);
  const { codec, mux, w, h } = pick;
  const bitrate = Math.round(w * h * fps * 0.16);

  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: mux, width: w, height: h, frameRate: fps }, fastStart: "in-memory" });
  let failure: unknown = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (failure = e) });
  enc.configure({ codec, width: w, height: h, bitrate, framerate: fps });

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
      fitCamera(cam, w / h, driver.view(t));
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
    return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), w, h, reduced: w < full.w };
  } finally {
    if (enc.state !== "closed") enc.close();
    gl.setPixelRatio(prevRatio);
    gl.setSize(prevSize.x, prevSize.y, false);
    fitCamera(cam, prevSize.x / prevSize.y, driver.view(null), true);
    gl.domElement.style.objectFit = "";
    driver.recording = false;
    state.setFrameloop("always");
  }
}

async function pickCodec(w: number, h: number, fps: number): Promise<{ codec: string; mux: "avc" | "vp9"; w: number; h: number } | null> {
  // High profile up to level 5.2 (2160×3840 at 60 fps), then main, then VP9 inside MP4
  const tries: [string, "avc" | "vp9"][] = [
    ["avc1.640034", "avc"],
    ["avc1.640033", "avc"],
    ["avc1.640032", "avc"],
    ["avc1.64002A", "avc"],
    ["avc1.4D402A", "avc"],
    ["vp09.00.51.08", "vp9"],
    ["vp09.00.41.08", "vp9"],
  ];
  for (const [codec, mux] of tries) {
    try {
      if ((await VideoEncoder.isConfigSupported({ codec, width: w, height: h, framerate: fps, bitrate: Math.round(w * h * fps * 0.16) })).supported) return { codec, mux, w, h };
    } catch {
      // try the next one
    }
  }
  return null;
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
