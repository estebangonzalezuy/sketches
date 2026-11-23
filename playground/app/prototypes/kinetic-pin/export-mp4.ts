import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { FORMATS, type FormatId } from "./data";
import { drawFrame } from "./frame";
import { PinRenderer } from "./renderer";
import type { Settings } from "./types";

/**
 * MP4 (H.264, VP9 fallback) of whole loops, so it repeats seamlessly. Frames come from the same
 * drawFrame() as the preview, at the format's full size, one exact time per frame. Never GIF.
 */
export async function exportMP4(s: Settings, text: string, onProgress: (p: number) => void, signal: { cancel: boolean }): Promise<Blob> {
  if (typeof VideoEncoder === "undefined") throw new Error("This browser has no WebCodecs. Try Chrome, Edge or Safari 17+.");
  const [width, height] = FORMATS[s.format as FormatId];
  const fps = Number(s.fps);
  const frames = Math.max(1, Math.round(s.loop * s.loops * fps));
  const { codec, mux } = await pickCodec(width, height, fps);
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: mux, width, height, frameRate: fps }, fastStart: "in-memory" });
  let failure: unknown = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (failure = e) });
  enc.configure({ codec, width, height, bitrate: Math.round(width * height * fps * 0.12), framerate: fps });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const r = new PinRenderer(canvas);
  try {
    for (let i = 0; i < frames; i++) {
      if (signal.cancel) throw new Error("Cancelled");
      if (failure) throw failure;
      drawFrame(r, s, text, i / fps);
      const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (enc.encodeQueueSize > 8) await new Promise((res) => setTimeout(res, 4));
      onProgress((i + 1) / frames);
    }
    await enc.flush();
    if (failure) throw failure;
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: "video/mp4" });
  } finally {
    if (enc.state !== "closed") enc.close();
    r.dispose();
  }
}

async function pickCodec(width: number, height: number, fps: number): Promise<{ codec: string; mux: "avc" | "vp9" }> {
  const tries: [string, "avc" | "vp9"][] = [["avc1.640032", "avc"], ["avc1.640033", "avc"], ["avc1.640028", "avc"], ["vp09.00.40.08", "vp9"]];
  for (const [codec, mux] of tries) {
    try {
      if ((await VideoEncoder.isConfigSupported({ codec, width, height, framerate: fps, bitrate: 8e6 })).supported) return { codec, mux };
    } catch {
      // next
    }
  }
  throw new Error(`This browser can't encode ${width}×${height} video.`);
}
