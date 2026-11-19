/**
 * localStorage that never throws (private mode, blocked storage, quota, SSR).
 * Keys are always namespaced: `playground:<prototype-slug>:<key>`.
 */
export function storageKey(slug: string, key: string): string {
  return `playground:${slug}:${key}`;
}

export function readStorage<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function writeStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the value just isn't remembered.
  }
}

export function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
