import type { Metadata } from "next";

/** `export const metadata = prototypeMetadata(meta)` in a prototype's page.tsx. */
export function prototypeMetadata(meta: { title: string; description: string }): Metadata {
  return { title: meta.title, description: meta.description };
}
