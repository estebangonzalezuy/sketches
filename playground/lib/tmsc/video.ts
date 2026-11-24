/**
 * Video export.
 *  - renderVideo: frame-exact MP4 (H.264 via WebCodecs + mp4-muxer) for scenes that are a pure
 *    function of time. Falls back to a real-time MediaRecorder take (WebM where MP4 isn't
 *    offered) when WebCodecs is missing.
 *  - LiveRecorder: records whatever the tool draws while the user interacts (MediaRecorder).
 */
import { ArrayBufferTarget, Muxer } from "mp4-muxer";

export type DrawAt = (ctx: CanvasRenderingContext2D, t: number) => void;
export type VideoResult = { blob: Blob; ext: "mp4" | "webm" };

const RECORDER_TYPES = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];

/** Best MediaRecorder container this browser offers. */
export function recorderType(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const mime = RECORDER_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
  return mime ? { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" } : null;
}

/** What an offline export will produce here: "MP4", or "WebM" when only the fallback works. */
export function videoLabel(): "MP4" | "WebM" {
  if (typeof window === "undefined") return "MP4";
  if (typeof VideoEncoder !== "undefined") return "MP4";
  return recorderType()?.ext === "mp4" ? "MP4" : "WebM";
}

/** H.264 first; VP9 (still in an .mp4) where the browser ships no H.264 encoder. */
async function pickCodec(width: number, height: number, fps: number): Promise<{ codec: string; mux: "avc" | "vp9" } | null> {
  const tries: [string, "avc" | "vp9"][] = [["avc1.640028", "avc"], ["avc1.640032", "avc"], ["avc1.640033", "avc"], ["avc1.4d0028", "avc"], ["vp09.00.40.08", "vp9"]];
  for (const [codec, mux] of tries) {
    try {
      if ((await VideoEncoder.isConfigSupported({ codec, width, height, framerate: fps, bitrate: 8e6 })).supported) return { codec, mux };
    } catch {
      // try the next one
    }
  }
  return null;
}

export async function renderVideo(opts: {
  width: number;
  height: number;
  duration: number;
  fps?: number;
  draw: DrawAt;
  onProgress?: (p: number) => void;
}): Promise<VideoResult> {
  const { width, height, duration, draw, onProgress } = opts;
  const fps = opts.fps ?? 30;
  const cv = document.createElement("canvas");
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  const picked = typeof VideoEncoder !== "undefined" ? await pickCodec(width, height, fps) : null;
  if (!picked) return realtime(cv, ctx, duration, draw, onProgress);
  const { codec, mux } = picked;

  const frames = Math.max(1, Math.round(duration * fps));
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: mux, width, height, frameRate: fps }, fastStart: "in-memory" });
  let failure: unknown = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (failure = e) });
  enc.configure({ codec, width, height, bitrate: Math.round(width * height * fps * 0.2), framerate: fps });
  try {
    for (let i = 0; i < frames; i++) {
      if (failure) throw failure;
      draw(ctx, i / fps);
      const frame = new VideoFrame(cv, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (enc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 2));
      onProgress?.((i + 1) / frames);
    }
    await enc.flush();
    if (failure) throw failure;
    muxer.finalize();
    return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), ext: "mp4" };
  } finally {
    if (enc.state !== "closed") enc.close();
  }
}

/** Real-time fallback: plays the scene once into a MediaRecorder. */
function realtime(cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D, duration: number, draw: DrawAt, onProgress?: (p: number) => void): Promise<VideoResult> {
  const type = recorderType();
  if (!type) return Promise.reject(new Error("This browser can't record video."));
  const rec = new MediaRecorder(cv.captureStream(30), { mimeType: type.mime, videoBitsPerSecond: 12e6 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  return new Promise((resolve) => {
    rec.onstop = () => resolve({ blob: new Blob(chunks, { type: type.mime }), ext: type.ext });
    draw(ctx, 0);
    rec.start(250);
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      draw(ctx, Math.min(t, duration));
      onProgress?.(Math.min(1, t / duration));
      if (t < duration) requestAnimationFrame(tick);
      else rec.stop();
    };
    requestAnimationFrame(tick);
  });
}

/** Records an offscreen canvas that the tool redraws at export size every frame. */
export class LiveRecorder {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private rec: MediaRecorder;
  private chunks: Blob[] = [];
  readonly ext: "mp4" | "webm";

  constructor(width: number, height: number) {
    const type = recorderType();
    if (!type) throw new Error("This browser can't record video.");
    this.ext = type.ext;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable.");
    this.ctx = ctx;
    this.rec = new MediaRecorder(this.canvas.captureStream(30), { mimeType: type.mime, videoBitsPerSecond: 12e6 });
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start(250);
  }

  stop(): Promise<VideoResult> {
    return new Promise((resolve) => {
      this.rec.onstop = () => resolve({ blob: new Blob(this.chunks, { type: this.rec.mimeType }), ext: this.ext });
      this.rec.stop();
    });
  }
}
