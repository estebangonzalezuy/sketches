import { describe, expect, it } from "vitest";
import { EXAMPLE_RESPONDENTS } from "@/lib/tmsc/survey";
import { land, sentence, who } from "./land";

const all = { role: "All", years: "All", mode: "All" };

describe("where you land", () => {
  it("bins every respondent and places the user", () => {
    const l = land(EXAMPLE_RESPONDENTS, all, "Day rate", "USD", 450);
    expect(l.enough).toBe(true);
    if (!l.enough) return;
    expect(l.bins.reduce((s, n) => s + n, 0)).toBe(EXAMPLE_RESPONDENTS.length);
    expect(l.q25).toBeLessThanOrEqual(l.median);
    expect(l.median).toBeLessThanOrEqual(l.q75);
    expect(l.percentile).toBeGreaterThan(50);
  });
  it("converts currency without changing the percentile", () => {
    const usd = land(EXAMPLE_RESPONDENTS, all, "Day rate", "USD", 400);
    const eur = land(EXAMPLE_RESPONDENTS, all, "Day rate", "EUR", 400 * 0.92);
    expect(usd.enough && eur.enough && usd.percentile === eur.percentile).toBe(true);
  });
  it("refuses groups under 20 answers", () => {
    const l = land(EXAMPLE_RESPONDENTS, { role: "Creative coder", years: "16+ yrs", mode: "In-house" }, "Day rate", "USD", 400);
    expect(l).toEqual({ enough: false, n: expect.any(Number) });
  });
  it("writes the sentence", () => {
    const f = { role: "3D artist", years: "6–10 yrs", mode: "Freelance" };
    expect(who(f, "Day rate")).toBe("freelance 3D artists with 6–10 yrs of experience");
    expect(who(f, "Years of experience")).toBe("freelance 3D artists");
    const l = land(EXAMPLE_RESPONDENTS, all, "Day rate", "USD", 450);
    expect(sentence(l, all, "Day rate")).toMatch(/^You charge more than \d+% of motion designers\.$/);
  });
});
