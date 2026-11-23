import { describe, expect, it } from "vitest";
import { valueAt } from "../model/tracks";
import { moveKeys, setValue, toggleStopwatch, deleteKeys, allKeys } from "../model/ops";
import { emptyProject, newLayer } from "../model/project";
import type { Project } from "../model/types";
import { layerContent } from "./pipeline";
import { bboxOf } from "./geometry";
import { applyMatrix, invertMatrix, layerMatrix } from "./evaluate";

const project = (): Project => {
  const p = emptyProject();
  return { ...p, layers: [newLayer(p, "rect", { params: { size: [200, 100] } })] };
};
const pos = (id: string) => ({ layer: id, group: "transform" as const, param: "position" as const });

describe("stopwatch and keys", () => {
  it("keys at the playhead once the stopwatch is on", () => {
    let p = project();
    const id = p.layers[0].id;
    p = toggleStopwatch(p, pos(id), 0);
    p = setValue(p, pos(id), [100, 100], 2);
    const tr = p.layers[0].transform.position;
    expect("keys" in tr && tr.keys).toHaveLength(2);
    expect(valueAt(tr, 1)).not.toEqual(valueAt(tr, 2));
  });
  it("moves and deletes keys, snapping to frames", () => {
    let p = project();
    const id = p.layers[0].id;
    p = toggleStopwatch(p, pos(id), 0);
    p = setValue(p, pos(id), [0, 0], 2);
    const all = [...allKeys(p).values()];
    const last = all[1].key;
    p = moveKeys(p, new Set([last.id]), 0.511, new Map([[last.id, last.t]]));
    expect([...allKeys(p).values()][1].key.t).toBeCloseTo(Math.round(2.511 * 30) / 30);
    p = deleteKeys(p, new Set(all.map((x) => x.key.id)));
    expect("value" in p.layers[0].transform.position).toBe(true);
  });
});

describe("pipeline", () => {
  it("generates a centred rect", () => {
    const p = project();
    const r = layerContent(p, p.layers[0], 0, 1);
    expect(r.content.kind).toBe("vector");
    if (r.content.kind === "vector") expect(bboxOf(r.content.paths)).toEqual({ x: -100, y: -50, w: 200, h: 100 });
  });
  it("maps layer space to comp space and back", () => {
    const m = layerMatrix({ position: [960, 540], anchor: [10, 0], scale: 2, rotation: 90, opacity: 1 });
    const q = applyMatrix(m, [10, 0]);
    expect(q[0]).toBeCloseTo(960);
    expect(q[1]).toBeCloseTo(540);
    const back = applyMatrix(invertMatrix(m), [960, 560]);
    expect(back[0]).toBeCloseTo(20);
  });
});
