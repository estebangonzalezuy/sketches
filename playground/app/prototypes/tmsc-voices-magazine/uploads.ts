"use client";

import { useSyncExternalStore } from "react";
import { readStorage, removeStorage, storageKey, writeStorage } from "@/lib/storage";
import { SLUG } from "./data";

/**
 * Images you upload (a cover, a paper texture). Each is downscaled to a JPEG data URL and kept
 * in this browser's storage, so it survives a reload and goes into Record. Never sent anywhere.
 */

function upload(name: string, maxSide: number) {
  const key = storageKey(SLUG, name);
  const listeners = new Set<() => void>();
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  const read = () => readStorage<string>(key) ?? null;
  return {
    use: () => useSyncExternalStore(subscribe, read, () => null),
    async save(file: File) {
      const bitmap = await createImageBitmap(file);
      const s = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * s);
      canvas.height = Math.round(bitmap.height * s);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const url = canvas.toDataURL("image/jpeg", 0.86);
      writeStorage(key, url);
      if (read() !== url) throw new Error("That image is too large to keep in this browser. Try a smaller one.");
      listeners.forEach((l) => l());
    },
    clear() {
      removeStorage(key);
      listeners.forEach((l) => l());
    },
  };
}

export const coverUpload = upload("cover-image", 1600);
export const textureUpload = upload("texture-image", 1024);

/** Loads a data URL into an image element (null while loading or when there is none). */
export function loadDataImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
