"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SLUG } from "./data";
import type { PostData, PostSummary } from "./substack-parse";

/**
 * Posts from the publication, through this prototype's API routes. Each is fetched once per
 * page load and shared; components subscribe and re-render when one arrives.
 */

type Entry = { status: "loading" } | { status: "ready"; post: PostData } | { status: "error"; error: string };
type ListEntry = { status: "loading" } | { status: "ready"; posts: PostSummary[] } | { status: "error"; error: string };

const posts = new Map<string, Entry>();
let list: ListEntry = { status: "loading" };
let listStarted = false;
let version = 0;
const listeners = new Set<() => void>();
const bump = () => {
  version++;
  listeners.forEach((l) => l());
};

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

export function loadPost(slug: string) {
  if (posts.has(slug)) return;
  posts.set(slug, { status: "loading" });
  json<PostData>(`/api/${SLUG}/post/${slug}`)
    .then((post) => posts.set(slug, { status: "ready", post }))
    .catch((e: Error) => posts.set(slug, { status: "error", error: e.message }))
    .finally(bump);
}

function loadList() {
  if (listStarted) return;
  listStarted = true;
  json<{ posts: PostSummary[] }>(`/api/${SLUG}/posts`)
    .then((r) => (list = { status: "ready", posts: r.posts }))
    .catch((e: Error) => (list = { status: "error", error: e.message }))
    .finally(bump);
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Re-renders whenever any post or the list arrives; read entries with `postEntry`. */
export function usePosts(slugs: string[]): number {
  const key = slugs.join(",");
  useEffect(() => {
    key.split(",").filter(Boolean).forEach(loadPost);
  }, [key]);
  return useSyncExternalStore(subscribe, () => version, () => 0);
}

export const postEntry = (slug: string): Entry => posts.get(slug) ?? { status: "loading" };

export function usePostList(): ListEntry {
  useEffect(loadList, []);
  useSyncExternalStore(subscribe, () => version, () => 0);
  return list;
}
