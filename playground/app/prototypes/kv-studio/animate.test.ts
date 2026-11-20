import { describe, expect, it } from "vitest";
import type { Composition, Layer } from "@/lib/kv/model";
import { animate, layerKeys } from "./animate";
import { autoMix } from "./auto-mix";
import { localProgress } from "./behaviors";
import { ease } from "./easing";
import { evaluateTrack, upsertKey } from "./tracks";
import type { Anim } from "./types";

const block = (id: string, role?: string): Layer => ({ id, role, type: "block", name: id, visible: true, locked: false, x: 100, y: 100, w: 400, h: 300, fill: "pink" });
const comp = (layers: Layer[]): Composition =>
  ({ version: 1, name: "t", format: "16x9", width: 1920, height: 1080, layers }) as unknown as Composition;
const boundsOf = (l: Layer) => ({ x: (l as { x: number }).x, y: (l as { y: number }).y, w: 400, h: 300 });
let n = 0;
const id = () => `k${n++}`;

describe("easing", () => {
  it("hits both ends", () => {
    for (const e of ["out", "in-out", "in", "linear"] as const) {
      expect(ease(e, 0)).toBe(0);
      expect(ease(e, 1)).toBe(1);
    }
  });
});

describe("tracks", () => {
  it("holds outside the keys and interpolates between", () => {
    const keys = [
      { id: "a", t: 1, v: 0, ease: "linear" as const },
      { id: "b", t: 3, v: 10, ease: "linear" as const },
    ];
    expect(evaluateTrack(keys, 0, 5)).toBe(0);
    expect(evaluateTrack(keys, 2, 5)).toBeCloseTo(5);
    expect(evaluateTrack(keys, 9, 5)).toBe(10);
    expect(evaluateTrack([], 2, 5)).toBe(5);
  });
  it("replaces a key at the same time", () => {
    let tr = upsertKey([], "a", "dx", { id: "1", t: 1, v: 1, ease: "out" }, 0.01);
    tr = upsertKey(tr, "a", "dx", { id: "2", t: 1, v: 2, ease: "out" }, 0.01);
    expect(tr[0].keys).toHaveLength(1);
    expect(tr[0].keys[0].v).toBe(2);
  });
});

describe("animate", () => {
  const c = comp([block("b1", "blockA"), block("b2", "blockB"), block("b3")]);
  const anim: Anim = { version: 1, tracks: [], mix: autoMix(c, id) };

  it("is the static poster at the end of the mix", () => {
    expect(animate(c, anim, 6, 6, boundsOf).size).toBe(0);
  });
  it("hides blocks that haven't wiped in at the start", () => {
    const fx = animate(c, anim, 0, 6, boundsOf);
    expect(fx.get("b1")?.clip?.h).toBe(0);
  });
  it("is deterministic and leaves the composition alone", () => {
    const before = JSON.stringify(c);
    const a = animate(c, anim, 1.3, 6, boundsOf);
    const b = animate(c, anim, 1.3, 6, boundsOf);
    expect([...a]).toEqual([...b]);
    expect(JSON.stringify(c)).toBe(before);
  });
  it("adds keyframes and mix on the same layer", () => {
    const both: Anim = {
      version: 1,
      tracks: [{ layer: "blockA", prop: "dx", keys: [{ id: "x", t: 0, v: 50, ease: "linear" }] }],
      mix: [{ id: "m", layer: "blockA", kind: "slide", dir: "left", amount: 1, start: 0, end: 1 }],
    };
    const fx = animate(c, both, 0, 6, boundsOf).get("b1")!;
    expect(fx.dx).toBeCloseTo(50 + 0.5 * 1920);
  });
  it("addresses layers by unique role, else by id", () => {
    expect(layerKeys(c).get("b1")).toBe("blockA");
    expect(layerKeys(c).get("b3")).toBe("b3");
  });
  it("windows behaviors inside Progress", () => {
    expect(localProgress({ start: 0.2, end: 0.6 }, 0.4)).toBeCloseTo(0.5);
    expect(localProgress({ start: 0.2, end: 0.6 }, 0.1)).toBe(0);
  });
});
