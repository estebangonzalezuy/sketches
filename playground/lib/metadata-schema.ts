/**
 * The shape of app/prototypes/<slug>/metadata.json, and its validation. Shared by
 * lib/prototypes.ts (server) and scripts/ (Node), so it stays free of Next and fs imports.
 */
export type PrototypeMetadata = {
  title: string;
  description: string;
  tags: string[];
  /** YYYY-MM-DD */
  createdAt: string;
  /** ISO timestamp. Bump on every edit: the gallery sorts by it. */
  updatedAt: string;
  /** Hidden from the gallery unless "Show hidden" is on. Still reachable by URL. */
  hidden: boolean;
  /** Served without login at /p/<slug>. Only when the owner asked for this prototype. */
  public: boolean;
};

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Throws a readable error naming the file and the field. */
export function parseMetadata(raw: unknown, where: string): PrototypeMetadata {
  const fail = (msg: string): never => {
    throw new Error(`${where}: ${msg}`);
  };
  if (!raw || typeof raw !== "object") fail("must be a JSON object");
  const m = raw as Record<string, unknown>;
  const str = (k: string) => {
    if (typeof m[k] !== "string" || !(m[k] as string).trim()) fail(`"${k}" must be a non-empty string`);
    return m[k] as string;
  };
  const bool = (k: string) => {
    if (m[k] === undefined) return false;
    if (typeof m[k] !== "boolean") fail(`"${k}" must be true or false`);
    return m[k] as boolean;
  };
  const tags = m.tags ?? [];
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) fail(`"tags" must be an array of strings`);
  const createdAt = str("createdAt");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) fail(`"createdAt" must be YYYY-MM-DD`);
  const updatedAt = str("updatedAt");
  if (Number.isNaN(Date.parse(updatedAt))) fail(`"updatedAt" must be an ISO timestamp`);
  return {
    title: str("title"),
    description: str("description"),
    tags: tags as string[],
    createdAt,
    updatedAt,
    hidden: bool("hidden"),
    public: bool("public"),
  };
}
