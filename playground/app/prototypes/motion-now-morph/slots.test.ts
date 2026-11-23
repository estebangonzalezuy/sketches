import { describe, expect, it } from "vitest";
import { EXAMPLE_RESPONDENTS } from "@/lib/tmsc/survey";
import { local } from "./morph";
import { chapterSlots } from "./slots";

const box = { x: 100, y: 100, w: 1700, h: 500 };

describe("chapter slots", () => {
  it.each(["Plata", "Lo que viene", "Human + Tool"] as const)("%s keeps every dot inside the chart and distinct", (ch) => {
    const s = chapterSlots(ch, EXAMPLE_RESPONDENTS, box);
    const seen = new Set<string>();
    for (let i = 0; i < EXAMPLE_RESPONDENTS.length; i++) {
      expect(s.x[i]).toBeGreaterThanOrEqual(box.x);
      expect(s.x[i]).toBeLessThanOrEqual(box.x + box.w);
      expect(s.y[i]).toBeGreaterThanOrEqual(box.y);
      expect(s.y[i]).toBeLessThanOrEqual(box.y + box.h);
      seen.add(`${s.x[i].toFixed(2)},${s.y[i].toFixed(2)}`);
    }
    expect(seen.size).toBe(EXAMPLE_RESPONDENTS.length);
    expect(new Set(s.order).size).toBe(EXAMPLE_RESPONDENTS.length);
  });

  it("staggers per dot and reaches 1 for everyone at p = 1", () => {
    expect(local(0.5, 0, 300, 0.4)).toBeGreaterThan(local(0.5, 299, 300, 0.4));
    expect(local(1, 299, 300, 0.4)).toBe(1);
    expect(local(0, 0, 300, 0.4)).toBe(0);
  });
});
