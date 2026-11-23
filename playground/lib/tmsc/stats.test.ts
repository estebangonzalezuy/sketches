import { describe, expect, it } from "vitest";
import { binIndex, groupBy, median, percentileRank, quantile, sorted } from "./stats";
import { EXAMPLE_RESPONDENTS, generateRespondents, parseRespondents } from "./survey";

describe("stats", () => {
  it("quantiles interpolate", () => {
    const a = sorted([4, 1, 3, 2]);
    expect(median(a)).toBe(2.5);
    expect(quantile(a, 0)).toBe(1);
    expect(quantile(a, 1)).toBe(4);
    expect(quantile([], 0.5)).toBeNaN();
  });
  it("percentile rank counts ties as half", () => {
    expect(percentileRank([1, 2, 3, 4], 3)).toBe(62.5);
    expect(percentileRank([1, 2, 3, 4], 10)).toBe(100);
  });
  it("groups keep the given order and drop empty groups", () => {
    const g = groupBy(["b", "a", "b"], (x) => x, ["a", "b", "c"]);
    expect([...g.keys()]).toEqual(["a", "b"]);
    expect(g.get("b")).toHaveLength(2);
  });
  it("bins are open-ended", () => {
    expect(binIndex([0, 100, 200], 50)).toBe(0);
    expect(binIndex([0, 100, 200], 999)).toBe(2);
  });
});

describe("example survey", () => {
  it("is deterministic and ~300 strong", () => {
    expect(EXAMPLE_RESPONDENTS).toHaveLength(300);
    expect(generateRespondents()).toEqual(EXAMPLE_RESPONDENTS);
  });
  it("round-trips through the JSON parser", () => {
    const r = parseRespondents(JSON.stringify(EXAMPLE_RESPONDENTS));
    expect(r.ok && r.value).toEqual(EXAMPLE_RESPONDENTS);
  });
  it("rejects bad input readably", () => {
    expect(parseRespondents("{").ok).toBe(false);
    const bad = parseRespondents(JSON.stringify([{ role: "Wizard" }]));
    expect(!bad.ok && bad.error).toMatch(/role/);
  });
});
