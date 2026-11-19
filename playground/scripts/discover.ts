/**
 * Finds every prototype folder and reads its metadata. Used by the registry generator and
 * the capture scripts. A prototype is a folder in app/prototypes/ with a page.tsx; folders
 * whose name starts with "[" or "_" are routing helpers, not prototypes.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseMetadata, SLUG_PATTERN, type PrototypeMetadata } from "../lib/metadata-schema";

export const ROOT = resolve(import.meta.dirname, "..");
export const PROTOTYPES_DIR = join(ROOT, "app", "prototypes");

export type Discovered = { slug: string; meta: PrototypeMetadata };

export function discoverPrototypes(): Discovered[] {
  const out: Discovered[] = [];
  for (const entry of readdirSync(PROTOTYPES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || /^[[_(]/.test(entry.name)) continue;
    const dir = join(PROTOTYPES_DIR, entry.name);
    if (!existsSync(join(dir, "page.tsx"))) continue;
    const slug = entry.name;
    if (!SLUG_PATTERN.test(slug)) throw new Error(`app/prototypes/${slug}: folder name must be kebab-case`);
    for (const f of ["metadata.json", "HOW_IT_WORKS.md"]) {
      if (!existsSync(join(dir, f))) throw new Error(`app/prototypes/${slug}: missing ${f}`);
    }
    const where = `app/prototypes/${slug}/metadata.json`;
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf8"));
    } catch (e) {
      throw new Error(`${where}: invalid JSON (${(e as Error).message})`);
    }
    out.push({ slug, meta: parseMetadata(raw, where) });
  }
  return out.sort((a, b) => Date.parse(b.meta.updatedAt) - Date.parse(a.meta.updatedAt));
}
