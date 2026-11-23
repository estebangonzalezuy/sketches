"use client";

import { useSyncExternalStore } from "react";
import { loadFonts } from "@/lib/kv/fonts";

/** Fonts every studio prototype shares, served from public/shared (reachable even by public prototypes). */
export const SHARED_FONTS = "/shared/fonts/";

let state: "loading" | "ready" | "error" = "loading";
const listeners = new Set<() => void>();
let started = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!started) {
    started = true;
    Promise.all([loadFonts(), loadMbFonts()])
      .then(() => (state = "ready"), () => (state = "error"))
      .finally(() => listeners.forEach((l) => l()));
  }
  return () => void listeners.delete(cb);
}

/** The free families Motion Builder tools ask for by name (KMR Apparat is commercial and stays out). */
function loadMbFonts() {
  const base = `${SHARED_FONTS}mb/`;
  const faces = [
    new FontFace("Geist Mono", `url(${base}GeistMono-VariableFont_wght.ttf)`, { weight: "100 900" }),
    new FontFace("Archivo Narrow", `url(${base}archivo-narrow-latin-wght-normal.woff2)`, { weight: "400 700" }),
    new FontFace("IBM Plex Mono", `url(${base}ibm-plex-mono-latin-400-normal.woff2)`, { weight: "400" }),
  ];
  return Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))));
}

/** The KV and Motion Builder fonts load once, before the first paint; exports never fall back to a system face. */
export const useFonts = () => useSyncExternalStore(subscribe, () => state, () => "loading" as const);
