import { describe, expect, it } from "vitest";
import { bezierPoint, bezierText, jokeLabels, sanitizeAnswers } from "./answers";
import { DEFAULT_ANSWERS } from "./data";

describe("answers", () => {
  it("writes short CSS bezier strings", () => {
    expect(bezierText("cubic-bezier(.7,0,.3,1)")).toBe("cubic-bezier(.7,0,.3,1)");
    expect(bezierText("back.out")).toBe("cubic-bezier(.34,1.56,.64,1)");
  });
  it("is deterministic per answer set", () => {
    expect(jokeLabels(DEFAULT_ANSWERS)).toEqual(jokeLabels({ ...DEFAULT_ANSWERS }));
    expect(jokeLabels(DEFAULT_ANSWERS)[0]).toMatch(/^keyframes: [\d,]+$/);
  });
  it("bezier runs from 0,0 to 1,1", () => {
    expect(bezierPoint("expo.out", 0)).toEqual([0, 0]);
    expect(bezierPoint("expo.out", 1)).toEqual([1, 1]);
  });
  it("sanitizes stored answers", () => {
    expect(sanitizeAnswers({ handle: "x", role: "Wizard", years: "3", easing: "nope" })).toEqual({ ...DEFAULT_ANSWERS, handle: "x", years: "3" });
    expect(sanitizeAnswers(null)).toBeUndefined();
  });
});
