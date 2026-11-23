import { beforeAll, describe, expect, it } from "vitest";
import { emptyProject } from "./model/project";

const mem = new Map<string, string>();
beforeAll(() => {
  // lib/storage reads window.localStorage
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) },
  };
});

describe("workspace", () => {
  it("keeps one isolated workspace per slug", async () => {
    const { workspace } = await import("./workspace");
    const a = workspace("tool-a");
    const b = workspace("tool-b");
    a.openTab({ ...emptyProject(), name: "A" });
    expect(a.project()?.name).toBe("A");
    expect(b.project()).toBeNull();
    expect(workspace("tool-a")).toBe(a);
  });
  it("undoes per tab", async () => {
    const { workspace } = await import("./workspace");
    const w = workspace("tool-c");
    w.openTab({ ...emptyProject(), name: "one" });
    w.setProject({ ...w.project()!, name: "two" });
    w.undo();
    expect(w.project()?.name).toBe("one");
  });
  it("hands a project to a stored, unloaded workspace as its active tab", async () => {
    const { appendToStored } = await import("./workspace");
    appendToStored("studio-x", { ...emptyProject(), name: "From a mini tool" });
    const saved = JSON.parse(mem.get("playground:studio-x:workspace")!);
    expect(saved.tabs).toHaveLength(1);
    expect(saved.active).toBe(saved.tabs[0].id);
    expect(saved.tabs[0].project.name).toBe("From a mini tool");
  });
});
