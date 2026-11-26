import { INTERVIEWS } from "./content";

/**
 * A magazine is an ordered list of features; a feature is one Substack post turned into four
 * pages (intro + hero quote, then the article in columns). Only your choices are stored;
 * anything left undefined is filled from the post when the pages are made. Pure.
 */

export type FeatureImage = { src: string; frame: number };

export type Feature = {
  id: string;
  slug: string;
  /** Name printed as the feature's subject and the quote's attribution. */
  guest?: string;
  /** Verbatim hero quote, picked from the post. */
  quote?: string;
  /** null = no image; undefined = the post's first image. */
  image?: FeatureImage | null;
  textImages?: [FeatureImage | null | undefined, FeatureImage | null | undefined];
  left?: string;
  right?: string;
};

export type Magazine = { features: Feature[] };

let counter = 0;
export const newId = () => `f${Date.now().toString(36)}${(counter++).toString(36)}`;

const media = (id: string, frame = 1): FeatureImage => ({ src: `https://substack-post-media.s3.amazonaws.com/public/images/${id}`, frame });

/** The four latest interviews, as they were set before the editor existed. */
export const DEFAULT_MAGAZINE: Magazine = {
  features: [
    { slug: "be-ready-when-the-opportunity-arrives", image: media("c4fea09a-5714-4237-a40f-71c7516c5bb7_600x364.gif", 1), textImages: [media("9e0156dd-c8bf-4641-ba5b-e7a0b8167a06_900x546.gif", 4), media("27386614-7ce0-45bf-b9a0-480ee65f1b41_900x546.gif", 3)] },
    { slug: "from-one-google-search-to-motion", image: media("7dabe0ac-a7c9-4ece-9d79-79d914ce136e_900x546.gif", 3), textImages: [media("7e28e6ec-5d01-426f-9739-0453b7c15d47_900x546.gif", 3), media("b02fd1bc-ae34-4236-88bb-790f0bea78e7_900x546.gif", 3)] },
    { slug: "personal-work-gets-you-jobs-wdoug", image: media("8380b23a-949a-4621-acb3-385d806e1cb9_600x337.gif", 3), textImages: [media("e1a3a60d-462e-42f7-81e4-2ce2e7a6f9be_600x337.gif", 3), media("aace1fbd-b87f-43b7-9bd0-fcf55bb9bee5_600x337.gif", 3)] },
    { slug: "motion-got-harder-to-browse-frameratetv", image: media("964d6d21-133a-45b8-b57d-861410cc5eba_800x450.webp"), textImages: [media("b65a3ee0-858c-4a14-9f49-99867bdc2b55_800x450.gif", 3), media("de175c49-c1de-45d2-9570-1e426ec8e0ad_1280x719.png")] },
  ].map((f, i) => {
    const it = INTERVIEWS[i];
    const hero = [0, 0, 1, 2][i];
    return { id: `default-${i + 1}`, ...f, guest: it.guest, quote: it.quotes[hero].text } as Feature;
  }),
};

export function addFeature(m: Magazine, slug: string): Magazine {
  return { features: [...m.features, { id: newId(), slug }] };
}

export function removeFeature(m: Magazine, id: string): Magazine {
  return { features: m.features.filter((f) => f.id !== id) };
}

export function moveFeature(m: Magazine, from: number, to: number): Magazine {
  const f = [...m.features];
  if (from < 0 || from >= f.length || to < 0 || to >= f.length) return m;
  const [x] = f.splice(from, 1);
  f.splice(to, 0, x);
  return { features: f };
}

/** Changing the post clears every choice that belonged to the old one. */
export function updateFeature(m: Magazine, id: string, patch: Partial<Feature>): Magazine {
  return {
    features: m.features.map((f) => {
      if (f.id !== id) return f;
      if (patch.slug && patch.slug !== f.slug) return { id: f.id, slug: patch.slug, left: f.left, right: f.right };
      return { ...f, ...patch };
    }),
  };
}

/** Stored data from an older version or a hand edit: keep only well-formed features. */
export function sanitizeMagazine(raw: unknown): Magazine | null {
  const list = (raw as Magazine | null)?.features;
  if (!Array.isArray(list)) return null;
  const features = list.filter((f): f is Feature => !!f && typeof f.id === "string" && typeof f.slug === "string" && /^[a-z0-9-]+$/.test(f.slug));
  return { features };
}
