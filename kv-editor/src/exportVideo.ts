import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { playAll, seekAll } from './media';
import type { Composition } from './model';
import { render } from './render/render';

/**
 * MP4 (H.264) from the same render() as the preview and the PNG: every frame seeks the video
 * sources to their exact time, renders the composition, and encodes it with WebCodecs.
 * Silent: audio from the sources is not carried over.
 */
export async function exportMP4(c: Composition, onProgress: (p: number) => void, signal: { cancel: boolean }): Promise<Blob> {
  if (typeof VideoEncoder === 'undefined') throw new Error('Este navegador no tiene WebCodecs (VideoEncoder). Probá con Chrome, Edge o Safari 17+.');
  const fps = c.video?.fps ?? 30;
  const duration = Math.max(0.5, c.video?.duration ?? 6);
  const frames = Math.round(duration * fps);
  const width = c.width;
  const height = c.height;

  const { codec, mux } = await pickCodec(width, height, fps);
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: mux, width, height, frameRate: fps }, fastStart: 'in-memory' });
  let failure: unknown = null;
  const enc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (failure = e),
  });
  enc.configure({ codec, width, height, bitrate: Math.round(width * height * fps * 0.18), framerate: fps });

  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext('2d', { willReadFrequently: false })!;
  const sources = c.layers.flatMap((l) => (l.type === 'media' && l.visible ? [{ id: l.mediaId, offset: l.offset }] : []));

  playAll(false);
  try {
    for (let i = 0; i < frames; i++) {
      if (signal.cancel) throw new Error('cancelado');
      if (failure) throw failure;
      const t = i / fps;
      await seekAll(sources, t);
      render(ctx, c, { scale: 1, time: t });
      const frame = new VideoFrame(cv, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4));
      onProgress((i + 1) / frames);
    }
    await enc.flush();
    if (failure) throw failure;
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  } finally {
    if (enc.state !== 'closed') enc.close();
    playAll(true);
  }
}

async function pickCodec(width: number, height: number, fps: number): Promise<{ codec: string; mux: 'avc' | 'vp9' }> {
  // H.264 High, levels 4.0 → 5.1 first (what Instagram & co. expect); VP9 in MP4 as a fallback
  const tries: [string, 'avc' | 'vp9'][] = [
    ['avc1.640028', 'avc'],
    ['avc1.640032', 'avc'],
    ['avc1.640033', 'avc'],
    ['avc1.4d0028', 'avc'],
    ['avc1.42e028', 'avc'],
    ['vp09.00.40.08', 'vp9'],
  ];
  for (const [codec, mux] of tries) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec, width, height, framerate: fps, bitrate: 8e6 });
      if (r.supported) return { codec, mux };
    } catch {
      /* try next */
    }
  }
  throw new Error(`Este navegador no puede codificar video ${width}×${height}.`);
}
