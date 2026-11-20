import "server-only";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMetadata, type PrototypeMetadata } from "./metadata-schema";

export type { PrototypeMetadata };

export type Prototype = PrototypeMetadata & {
  slug: string;
  /** Static screenshots in public/thumbnails/, or null when not captured yet. */
  thumbnail: { light: string; dark: string } | null;
  /** Social preview assets in public/og/ (public prototypes only). */
  og: { image: string | null; video: string | null };
};

const PROTOTYPES_DIR = join(process.cwd(), "app", "prototypes");
const PUBLIC_DIR = join(process.cwd(), "public");

function asset(path: string): string | null {
  return existsSync(join(PUBLIC_DIR, path)) ? `/${path}` : null;
}

/** Every prototype, most recently updated first. Read at build time. */
export function listPrototypes(): Prototype[] {
  const out: Prototype[] = [];
  for (const entry of readdirSync(PROTOTYPES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || /^[[_(]/.test(entry.name)) continue;
    const metaPath = join(PROTOTYPES_DIR, entry.name, "metadata.json");
    if (!existsSync(metaPath)) continue;
    const slug = entry.name;
    const meta = parseMetadata(
      JSON.parse(readFileSync(metaPath, "utf8")),
      `app/prototypes/${slug}/metadata.json`,
    );
    const light = asset(`thumbnails/${slug}-light.jpg`);
    const dark = asset(`thumbnails/${slug}-dark.jpg`);
    out.push({
      ...meta,
      slug,
      thumbnail: light && dark ? { light, dark } : null,
      og: { image: asset(`og/${slug}.png`), video: asset(`og/${slug}.mp4`) },
    });
  }
  return out.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getPrototype(slug: string): Prototype | null {
  return listPrototypes().find((p) => p.slug === slug) ?? null;
}
