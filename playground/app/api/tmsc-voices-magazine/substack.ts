import "server-only";
import { parsePost, plain, type PostData, type PostSummary } from "@/app/prototypes/tmsc-voices-magazine/substack-parse";

/** Server-side reads of the publication's public Substack API, cached for an hour. */

export const PUBLICATION = "https://humanandmotion.substack.com";
const REVALIDATE = 3600;

type RawPost = {
  slug: string;
  title: string;
  subtitle?: string | null;
  post_date: string;
  cover_image?: string | null;
  audience?: string;
  canonical_url?: string;
  body_html?: string | null;
  publishedBylines?: { name?: string }[];
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${PUBLICATION}${path}`, { next: { revalidate: REVALIDATE }, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Substack answered ${res.status} for ${path}`);
  return (await res.json()) as T;
}

const summary = (p: RawPost): PostSummary => ({
  slug: p.slug,
  title: p.title,
  subtitle: p.subtitle ?? "",
  date: p.post_date,
  cover: p.cover_image ?? null,
  paid: p.audience === "only_paid",
});

/** Every post, newest first, following the archive's cursor (at most `pages` × 12). */
export async function listPosts(pages = 10): Promise<PostSummary[]> {
  const out: PostSummary[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < pages; i++) {
    const q: string = `/api/v1/archive?sort=new&limit=12${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const page = await get<{ posts: RawPost[]; nextCursor?: string | null }>(q);
    out.push(...page.posts.map(summary));
    cursor = page.nextCursor ?? null;
    if (!cursor || page.posts.length === 0) break;
  }
  return out.filter((p, i) => out.findIndex((o) => o.slug === p.slug) === i);
}

export async function getPost(slug: string): Promise<PostData> {
  const p = await get<RawPost>(`/api/v1/posts/${encodeURIComponent(slug)}`);
  const byline = plain(p.publishedBylines?.[0]?.name ?? "");
  return parsePost(summary(p), p.body_html ?? "", byline, p.canonical_url ?? `${PUBLICATION}/p/${p.slug}`);
}
