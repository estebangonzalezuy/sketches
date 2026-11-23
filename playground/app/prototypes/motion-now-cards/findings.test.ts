import { describe, expect, it } from "vitest";
import { EXAMPLE_FINDINGS } from "./data";
import { displayNumber, parseFindings, parseList, shareOf } from "./findings";

describe("findings", () => {
  it("parses comma lists leniently", () => {
    expect(parseList("12, 40 ,x, 7")).toEqual([12, 40, 7]);
  });
  it("counts up keeping decimals and unit placement", () => {
    expect(displayNumber({ number: "62", unit: "%" }, 1)).toBe("62%");
    expect(displayNumber({ number: "62", unit: "%" }, 0.5)).toBe("31%");
    expect(displayNumber({ number: "2.1", unit: "×" }, 1)).toBe("2.1×");
    expect(displayNumber({ number: "1200", unit: "$" }, 1)).toBe("$1,200");
    expect(displayNumber({ number: "1", unit: "in 9" }, 1)).toBe("1 in 9");
  });
  it("round-trips the examples and rejects bad ones", () => {
    const r = parseFindings(JSON.stringify(EXAMPLE_FINDINGS));
    expect(r.ok && r.value).toEqual(EXAMPLE_FINDINGS);
    expect(parseFindings('[{"number":"1","sentence":"x","chart":"pie"}]').ok).toBe(false);
  });
  it("picks the share for round charts", () => {
    expect(shareOf(EXAMPLE_FINDINGS[0])).toBe(62);
    expect(shareOf({ ...EXAMPLE_FINDINGS[0], unit: "", data: [140] })).toBe(100);
  });
});
