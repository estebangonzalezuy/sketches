import { describe, expect, it } from "vitest";
import { EXAMPLE_QUOTES, PAUSE } from "./data";
import { attribution, feedAt, parseQuotes, typingTime } from "./quotes";

const q = (text: string) => ({ text, role: "Freelance", years: 8 });

describe("quotes", () => {
  it("attributes by role and years only", () => {
    expect(attribution(q("x"))).toBe("Freelance, 8 yrs");
  });
  it("validates pasted JSON", () => {
    expect(parseQuotes(JSON.stringify(EXAMPLE_QUOTES)).ok).toBe(true);
    expect(parseQuotes('[{"text":"hi"}]').ok).toBe(false);
  });
  it("types one quote at a time and cycles", () => {
    const list = [q("abcd"), q("ef")];
    const ms = 100;
    expect(feedAt(list, 0.25, ms, 5)).toEqual([{ key: 0, quote: list[0], typed: 2, start: 0 }]);
    const second = typingTime(list[0], ms) + PAUSE;
    const f = feedAt(list, second + 0.1, ms, 5);
    expect(f.map((x) => [x.key, x.typed])).toEqual([[0, 4], [1, 1]]);
    const cycle = second + typingTime(list[1], ms) + PAUSE;
    const later = feedAt(list, cycle * 3 + 0.05, ms, 2);
    expect(later.map((x) => x.key)).toEqual([5, 6]);
    expect(later[1].quote).toBe(list[0]);
  });
});
