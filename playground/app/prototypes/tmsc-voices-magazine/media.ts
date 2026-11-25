import { ASSET_BASE } from "./data";

/**
 * Every image from the four published posts (section dividers left out), in the order they
 * appear in each post. GIFs were sampled to 6 evenly spaced frames, and the "Work by …" strip
 * burned into them was cropped off; the page prints its own credit line instead.
 * Files: public/prototype-assets/<slug>/media/<id>-<frame>.jpg (frame 0-based).
 */

export type MediaAsset = {
  id: string;
  frames: number;
  /** Printed under the image on the page. Taken from the post (burned-in credit or caption). */
  credit: string;
  /** The post's cover image. */
  cover?: boolean;
};

const FROM_POST = "From the post";

export const MEDIA: Record<1 | 2 | 3 | 4, MediaAsset[]> = {
  1: [
    { id: "e0c71002", frames: 1, credit: FROM_POST },
    { id: "9e0156dd", frames: 6, credit: "Work by Victor Verdugo" },
    { id: "27386614", frames: 6, credit: "Work by Victor Verdugo" },
    { id: "c4fea09a", frames: 6, credit: "Work by Victor Verdugo", cover: true },
    { id: "fc6c43c0", frames: 6, credit: "Work by Victor Verdugo" },
  ],
  2: [
    { id: "7e28e6ec", frames: 6, credit: "Work by Thais Macedo" },
    { id: "b02fd1bc", frames: 6, credit: "Work by Thais Macedo" },
    { id: "7dabe0ac", frames: 6, credit: "Work by Thais Macedo", cover: true },
    { id: "8a41be07", frames: 6, credit: "Work by Thais Macedo" },
  ],
  3: [
    { id: "e1a3a60d", frames: 6, credit: "Work by Doug Alberts / Noodle" },
    { id: "aace1fbd", frames: 6, credit: "Work by Doug Alberts / Noodle" },
    { id: "8380b23a", frames: 6, credit: "Work by Doug Alberts / Noodle", cover: true },
    { id: "5bb57d53", frames: 6, credit: "Work by Doug Alberts / Noodle" },
  ],
  4: [
    { id: "79fa6f80", frames: 6, credit: FROM_POST },
    { id: "de175c49", frames: 1, credit: "Vimeo’s old days" },
    { id: "964d6d21", frames: 1, credit: "FrameRate.tv Manifesto x the Furrow", cover: true },
    { id: "f5c53d5b", frames: 1, credit: FROM_POST },
    { id: "b65a3ee0", frames: 6, credit: "FrameRate.tv Manifesto x the Furrow" },
  ],
};

export const NO_IMAGE = "None";

/** Labels for the picker: "Image 1" … in post order, the cover marked. */
export function mediaOptions(order: 1 | 2 | 3 | 4): string[] {
  return [...MEDIA[order].map((m, i) => `Image ${i + 1}${m.cover ? " (cover)" : ""}`), NO_IMAGE];
}

export function coverOption(order: 1 | 2 | 3 | 4): string {
  const i = MEDIA[order].findIndex((m) => m.cover);
  return mediaOptions(order)[i];
}

export type MediaChoice = { asset: MediaAsset; frame: number; url: string } | null;

/** Resolves a picker label and a 1-based frame to a file. Frames past a still's count use its only frame. */
export function resolveMedia(order: 1 | 2 | 3 | 4, label: string, frame: number): MediaChoice {
  const i = mediaOptions(order).indexOf(label);
  const asset = MEDIA[order][i];
  if (!asset) return null;
  const f = Math.min(Math.max(1, Math.round(frame)), asset.frames) - 1;
  return { asset, frame: f, url: `${ASSET_BASE}/media/${asset.id}-${f}.jpg` };
}
