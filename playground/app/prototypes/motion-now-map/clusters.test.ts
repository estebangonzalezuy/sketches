import { describe, expect, it } from "vitest";
import { EXAMPLE_RESPONDENTS } from "@/lib/tmsc/survey";
import { GROUPINGS } from "./data";
import { frameFor, hitCluster, layoutClusters } from "./clusters";

describe("cluster layout", () => {
  const f = frameFor(1920, 1080);
  const g = GROUPINGS.Role;
  const l = layoutClusters(EXAMPLE_RESPONDENTS, g.key, g.order, f, 7, 1);

  it("places every respondent once, inside the frame", () => {
    expect(l.clusters.reduce((s, c) => s + c.count, 0)).toBe(EXAMPLE_RESPONDENTS.length);
    for (let i = 0; i < l.tx.length; i++) {
      expect(l.tx[i]).toBeGreaterThan(0);
      expect(l.tx[i]).toBeLessThan(1920);
      expect(l.ty[i]).toBeGreaterThan(f.top);
      expect(l.ty[i]).toBeLessThan(1080);
    }
  });
  it("keeps the survey order of groups", () => {
    expect(l.clusters.map((c) => c.label)).toEqual([...g.order]);
  });
  it("hit-tests a cluster center", () => {
    const c = l.clusters[2];
    expect(hitCluster(l, c.cx, c.cy)).toBe(2);
    expect(hitCluster(l, 5, 5)).toBe(-1);
  });
});
