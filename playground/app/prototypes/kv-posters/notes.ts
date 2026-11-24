import type { Element, Palette } from "./types";

const px = (v: number) => `${Math.round(v)}`;

/** The technical notes typed into an element's box before it is constructed: a title and spec lines. */
export function notesFor(e: Element, pal: Palette): string[] {
  switch (e.kind) {
    case "headline":
      return [`“${e.text.replace(/\n/g, " ")}”`, `Archivo Narrow Bold · ${px(e.size)} px`, e.vertical ? "Set vertical · KV cut" : "KV cut · facets · notches"];
    case "lockup":
      return ["Lockup", e.text.replace(/\n/g, " "), `Inter SemiBold · ${px(e.size)} px`];
    case "flower":
      return [e.style === "scallop" ? "Rosette, scalloped" : "Rosette", `${e.petals} petals · Ø ${px(e.r * 2)}`, `rot ${Math.round((e.rot * 180) / Math.PI)}°`];
    case "spiral":
      return ["Spiral", `${e.rings} rings × ${e.perRing}`, `Ø ${px(e.r * 2)}`];
    case "block":
      return ["Block", `${px(e.w)} × ${px(e.h)}`, `${e.fill} ${pal[e.fill]}`];
    case "bands":
      return ["Frames", `${e.fills.length} bands · ${px(e.band)} px`];
    case "mark":
      return ["Asterisk", `6 arms · ${px(e.size * 2)} px`, `round ${Math.round((e.round ?? 1) * 100)}%`];
  }
}
