/**
 * Video and GIF sources for media layers.
 *
 * Blobs live in memory (and in IndexedDB so a reload keeps them); layers only hold a `mediaId`.
 * Preview draws playing <video> elements as they are; export seeks every source to the exact
 * frame time, so the MP4 is deterministic.
 */

export type MediaKind = 'video' | 'gif';

interface GifFrames {
  frames: ImageBitmap[];
  /** cumulative end time of each frame, seconds */
  ends: number[];
  total: number;
}

export interface MediaEntry {
  id: string;
  kind: MediaKind;
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  duration: number;
  video?: HTMLVideoElement;
  gif?: GifFrames;
  /** first frame only, when the browser cannot decode GIF frames */
  still?: HTMLImageElement;
}

const registry = new Map<string, MediaEntry>();
const pending = new Map<string, Promise<MediaEntry | null>>();
let onChange: (() => void) | null = null;
export const setMediaListener = (fn: () => void) => (onChange = fn);

export const getMedia = (id: string) => registry.get(id) ?? null;
export const mediaList = () => [...registry.values()];

// ---------------------------------------------------------------- IndexedDB (best effort)

const DB = 'kv-editor-media';
function db(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('blobs');
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
}
async function idbPut(id: string, value: { blob: Blob; kind: MediaKind; name: string }) {
  const d = await db();
  if (!d) return;
  try {
    d.transaction('blobs', 'readwrite').objectStore('blobs').put(value, id);
  } catch {
    /* quota or private mode: media just won't survive a reload */
  }
}
async function idbGet(id: string): Promise<{ blob: Blob; kind: MediaKind; name: string } | null> {
  const d = await db();
  if (!d) return null;
  return new Promise((res) => {
    try {
      const r = d.transaction('blobs').objectStore('blobs').get(id);
      r.onsuccess = () => res(r.result ?? null);
      r.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
}

// ---------------------------------------------------------------- loading

export function kindOf(file: Blob & { name?: string }): MediaKind | null {
  if (file.type === 'image/gif' || /\.gif$/i.test(file.name ?? '')) return 'gif';
  if (file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name ?? '')) return 'video';
  return null;
}

export async function addMedia(id: string, blob: Blob, kind: MediaKind, name: string, persist = true): Promise<MediaEntry> {
  const entry = await decode(id, blob, kind, name);
  registry.set(id, entry);
  if (persist) void idbPut(id, { blob, kind, name });
  onChange?.();
  return entry;
}

/** Make sure a media id referenced by a layer is loaded (from IndexedDB after a reload). */
export function ensureMedia(id: string): Promise<MediaEntry | null> {
  const hit = registry.get(id);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(id);
  if (!p) {
    p = idbGet(id).then((v) => (v ? addMedia(id, v.blob, v.kind, v.name, false) : null));
    pending.set(id, p);
  }
  return p;
}

async function decode(id: string, blob: Blob, kind: MediaKind, name: string): Promise<MediaEntry> {
  const url = URL.createObjectURL(blob);
  if (kind === 'video') {
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.src = url;
    await new Promise<void>((res, rej) => {
      v.onloadeddata = () => res();
      v.onerror = () => rej(new Error(`No se pudo leer el video ${name}`));
    });
    void v.play().catch(() => {});
    return { id, kind, name, blob, url, width: v.videoWidth, height: v.videoHeight, duration: isFinite(v.duration) ? v.duration : 0, video: v };
  }
  // GIF: decode every frame when the browser has ImageDecoder (Chrome, Edge, Firefox)
  const ID = (window as unknown as { ImageDecoder?: ImageDecoderCtor }).ImageDecoder;
  if (ID) {
    try {
      const dec = new ID({ data: await blob.arrayBuffer(), type: 'image/gif' });
      await dec.tracks.ready;
      const count = dec.tracks.selectedTrack?.frameCount ?? 1;
      const frames: ImageBitmap[] = [];
      const ends: number[] = [];
      let t = 0;
      for (let i = 0; i < count; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        frames.push(await createImageBitmap(image));
        t += Math.max(0.02, (image.duration ?? 100000) / 1e6);
        ends.push(t);
        image.close();
      }
      dec.close();
      return { id, kind, name, blob, url, width: frames[0].width, height: frames[0].height, duration: t, gif: { frames, ends, total: t } };
    } catch {
      /* fall through to a still */
    }
  }
  const im = new Image();
  im.src = url;
  await im.decode();
  return { id, kind, name, blob, url, width: im.naturalWidth, height: im.naturalHeight, duration: 0, still: im };
}

interface ImageDecoderCtor {
  new (init: { data: ArrayBuffer; type: string }): {
    tracks: { ready: Promise<void>; selectedTrack?: { frameCount: number } };
    decode(o: { frameIndex: number }): Promise<{ image: VideoFrame }>;
    close(): void;
  };
}

// ---------------------------------------------------------------- frames

/** The drawable for a media id at time t (seconds). Video returns its element in its current state. */
export function mediaSource(id: string, t: number): CanvasImageSource | null {
  const m = registry.get(id);
  if (!m) {
    void ensureMedia(id);
    return null;
  }
  if (m.video) return m.video.readyState >= 2 ? m.video : null;
  if (m.gif) {
    const g = m.gif;
    const tt = ((t % g.total) + g.total) % g.total;
    let i = 0;
    while (i < g.ends.length - 1 && g.ends[i] <= tt) i++;
    return g.frames[i];
  }
  return m.still ?? null;
}

/** Export: pause every video and seek it to the frame time. */
export async function seekAll(ids: Iterable<{ id: string; offset: number }>, t: number) {
  const jobs: Promise<void>[] = [];
  for (const { id, offset } of ids) {
    const v = registry.get(id)?.video;
    if (!v) continue;
    v.pause();
    const d = v.duration || 1;
    const target = (((t + offset) % d) + d) % d;
    if (Math.abs(v.currentTime - target) < 1e-4 && v.readyState >= 2) continue;
    jobs.push(
      new Promise<void>((res) => {
        const done = () => {
          v.removeEventListener('seeked', done);
          res();
        };
        v.addEventListener('seeked', done);
        v.currentTime = target;
        setTimeout(done, 2000);
      }),
    );
  }
  await Promise.all(jobs);
}

export function playAll(playing: boolean) {
  for (const m of registry.values()) {
    if (!m.video) continue;
    if (playing) void m.video.play().catch(() => {});
    else m.video.pause();
  }
}

export async function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}
