import { describe, expect, it } from "vitest";
import { generate } from "./generate";
import { assignQuestions } from "./questions";

const poster = generate({ template: "stack", seed: 4, format: "3x4", density: 0.5, paint: "squares" });

describe("assignQuestions", () => {
  it("gives the headline the lead question and numbers the rest", () => {
    const m = assignQuestions(poster, { lead: "What now?", list: ["One?", "Two?"] });
    const head = poster.elements.find((e) => e.kind === "headline")!;
    expect(m.get(head.id)).toEqual(["Q00", "What now?"]);
    const others = poster.elements.filter((e) => e.kind !== "headline").map((e) => m.get(e.id)!);
    expect(others.every((l) => /^Q0[12] \/ 02$/.test(l[0]))).toBe(true);
    expect(others.some((l) => l[1] === "Two?")).toBe(true);
  });

  it("skips blank lines and works with no questions", () => {
    expect(assignQuestions(poster, { lead: "", list: ["", "  "] }).size).toBe(0);
  });
});
