"use client";

import { useSyncExternalStore } from "react";
import { readStorage, removeStorage, storageKey, writeStorage } from "@/lib/storage";
import { SLUG } from "./data";

/**
 * The cover image you upload. Downscaled to a JPEG data URL (long side ≤ 1600 px) and kept in
 * this browser's storage, so it survives a reload and goes into Record. Never uploaded anywhere.
 */

const KEY = storageKey(SLUG, "cover-image");
const MAX_SIDE = 1600;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const read = () => readStorage<string>(KEY) ?? null;

export function useUploadedCover(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export async function saveUploadedCover(file: File): Promise<void> {
  const bitmap = await createImageBitmap(file);
  const s = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * s);
  canvas.height = Math.round(bitmap.height * s);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", 0.86);
  writeStorage(KEY, url);
  if (read() !== url) throw new Error("That image is too large to keep in this browser. Try a smaller one.");
  listeners.forEach((l) => l());
}

export function clearUploadedCover() {
  removeStorage(KEY);
  listeners.forEach((l) => l());
}
