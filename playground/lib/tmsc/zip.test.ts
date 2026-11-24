import { describe, expect, it } from "vitest";
import { crc32, zip } from "./zip";

describe("zip", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
  it("writes local headers, central directory and end record", () => {
    const out = zip([{ name: "a.txt", data: new TextEncoder().encode("hi") }]);
    const v = new DataView(out.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(out.length - 22, true)).toBe(0x06054b50);
    expect(v.getUint16(out.length - 22 + 10, true)).toBe(1);
  });
});
