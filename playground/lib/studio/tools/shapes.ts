import type { Pt } from "../engine/geometry";
import type { GeneratorDef } from "./types";

/** A filled rectangle centred on the layer origin. */
export const rect: GeneratorDef = {
  id: "rect",
  name: "Rectangle",
  engine: "vector",
  params: {
    size: { kind: "vec2", label: "Size", default: [400, 300], step: 1 },
    fill: { kind: "color", label: "Fill", default: "#fb81bc" },
  },
  generate(p) {
    const [w, h] = p.size as [number, number];
    return { kind: "vector", paths: [{ fill: String(p.fill), contours: [[[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]] }] };
  },
};

/** Fixed contours (e.g. the KV bracket), stored as JSON in a hidden param. */
export const polygon: GeneratorDef = {
  id: "polygon",
  name: "Shape",
  engine: "vector",
  params: {
    contours: { kind: "text", label: "Contours", default: "[]", hidden: true },
    fill: { kind: "color", label: "Fill", default: "#064517" },
  },
  generate(p) {
    let contours: Pt[][] = [];
    try {
      contours = JSON.parse(String(p.contours));
    } catch {
      // an unreadable shape draws nothing
    }
    return { kind: "vector", paths: [{ fill: String(p.fill), contours }] };
  },
};
