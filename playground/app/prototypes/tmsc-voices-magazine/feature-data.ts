import { INTERVIEWS } from "./content";
import { SLUG, SPREADS } from "./data";
import curated from "./editorial.json";
import type { Feature, FeatureImage } from "./feature";
import { pageInk } from "./page-inks";
import { headline, originalImage, plain, type Block, type PostData } from "./substack-parse";
import type { PageInk } from "./types";

/** A feature with every blank filled from its post: what the page layouts draw. Pure. */

export type ResolvedImage = { url: string; credit: string };
export type FeatureData = {
  id: string;
  slug: string;
  guest: string;
  title: string;
  subtitle: string;
  series: string;
  date: string;
  url: string;
  quote: string;
  blocks: Block[];
  image: ResolvedImage | null;
  textImages: [ResolvedImage | null, ResolvedImage | null];
  left: PageInk;
  right: PageInk;
};

/** Same-origin URL of a post image (one frame of a GIF), safe to bake into a WebGL texture. */
export const imageUrl = (img: FeatureImage, w?: number) => `/api/${SLUG}/image?src=${encodeURIComponent(img.src)}&frame=${img.frame}${w ? `&w=${w}` : ""}`;

/** The four default interviews keep the Q&A text that was checked by hand. */
const CURATED: Record<string, Block[]> = Object.fromEntries(
  INTERVIEWS.map((it) => [it.url.split("/p/")[1], (curated.interviews as Record<string, Block[]>)[String(it.order)]]),
);

const THEMES = [SPREADS[1], SPREADS[2], SPREADS[3], SPREADS[4]];

export function postImages(post: PostData): FeatureImage[] {
  const list = post.images.map((i) => ({ src: i.src, frame: i.animated ? 3 : 1 }));
  if (!list.length && post.cover) list.push({ src: originalImage(post.cover), frame: 1 });
  return list;
}

export function resolveFeature(f: Feature, post: PostData, index: number): FeatureData {
  const imgs = postImages(post);
  const credit = (img: FeatureImage) => post.images.find((i) => i.src === img.src)?.caption || "From the post";
  const resolve = (img: FeatureImage | null | undefined, fallback: FeatureImage | undefined): ResolvedImage | null => {
    const pick = img === null ? null : (img ?? fallback ?? null);
    return pick ? { url: imageUrl(pick), credit: credit(pick) } : null;
  };
  const intro = f.image === null ? null : (f.image ?? imgs[0]);
  const rest = imgs.filter((i) => i.src !== intro?.src);
  const theme = THEMES[index % THEMES.length];
  return {
    id: f.id,
    slug: post.slug,
    guest: plain(f.guest?.trim() || post.guest),
    title: headline(post.title),
    subtitle: plain(post.subtitle),
    series: post.series,
    date: post.date,
    url: post.url,
    quote: f.quote ?? post.quotes[0] ?? plain(post.subtitle),
    blocks: CURATED[post.slug] ?? post.blocks,
    image: resolve(f.image, intro ?? undefined),
    textImages: [resolve(f.textImages?.[0], rest[0]), resolve(f.textImages?.[1], rest[1])],
    left: pageInk(f.left, theme.left),
    right: pageInk(f.right, theme.right),
  };
}
