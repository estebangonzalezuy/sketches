import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import type { Composition } from "@/lib/kv/model";
import { layerBounds, render } from "@/lib/kv/render/render";
import { animate } from "./animate";
import type { Anim } from "./types";

/**
 * MP4 (H.264) from the same render() and animate() as the preview: every frame is
 * evaluated at its exact time and encoded with WebCodecs. Ported from the KV Editor.
 */
export async function exportMP4(
  c: Composition,
  anim: Anim,
  duration: number,
  fps: number,
  onProgress: (p: number) => void,
  signal: { cancel: boolean },
): Promise<Blob> {
  if (typeof VideoEncoder === "undefined") throw new Error("This browser has no WebCodecs. Try Chrome, Edge or Safari 17+.");
  const frames = Math.max(1, Math.round(duration * fps));
  const { width, height } = c;
  const { codec, mux } = await pickCodec(width, height, fps);
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: mux, width, height, frameRate: fps }, fastStart: "in-memory" });
  let failure: unknown = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (failure = e) });
  enc.configure({ codec, width, height, bitrate: Math.round(width * height * fps * 0.18), framerate: fps });

  const cv = document.createElement("canvas");
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext("2d")!;
  try {
    for (let i = 0; i < frames; i++) {
      if (signal.cancel) throw new Error("Cancelled");
      if (failure) throw failure;
      const t = i / fps;
      render(ctx, c, { scale: 1, fx: animate(c, anim, t, duration, layerBounds) });
      const frame = new VideoFrame(cv, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4));
      onProgress((i + 1) / frames);
    }
    await enc.flush();
    if (failure) throw failure;
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: "video/mp4" });
  } finally {
    if (enc.state !== "closed") enc.close();
  }
}

async function pickCodec(width: number, height: number, fps: number): Promise<{ codec: string; mux: "avc" | "vp9" }> {
  // H.264 High, levels 4.0 → 5.1 first (what social platforms expect); VP9 in MP4 as a fallback
  const tries: [string, "avc" | "vp9"][] = [
    ["avc1.640028", "avc"],
    ["avc1.640032", "avc"],
    ["avc1.640033", "avc"],
    ["avc1.4d0028", "avc"],
    ["avc1.42e028", "avc"],
    ["vp09.00.40.08", "vp9"],
  ];
  for (const [codec, mux] of tries) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec, width, height, framerate: fps, bitrate: 8e6 });
      if (r.supported) return { codec, mux };
    } catch {
      // try the next one
    }
  }
  throw new Error(`This browser can't encode ${width}×${height} video.`);
}
