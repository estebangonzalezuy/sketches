/** Deterministic building blocks for the paper tiles: seeded random, wrapping value noise, fibres, specks. */

export const TILE = 1024;

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Smooth value noise that wraps at the tile edge. */
export function valueNoise(cells: number, rand: () => number) {
  const g = Array.from({ length: cells * cells }, rand);
  const at = (x: number, y: number) => g[(((y % cells) + cells) % cells) * cells + (((x % cells) + cells) % cells)];
  return (u: number, v: number) => {
    const x = u * cells;
    const y = v * cells;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

export function canvas() {
  const c = document.createElement("canvas");
  c.width = c.height = TILE;
  return c;
}

/** Fills the tile pixel by pixel: `k` darkens (1 = paper white), `tint` warms. */
export function field(k: (x: number, y: number) => number, tint: [number, number, number]) {
  const c = canvas();
  const g = c.getContext("2d")!;
  const img = g.createImageData(TILE, TILE);
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      const v = k(x, y);
      const i = (y * TILE + x) * 4;
      img.data[i] = tint[0] * v;
      img.data[i + 1] = tint[1] * v;
      img.data[i + 2] = tint[2] * v;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}

export function fibers(c: HTMLCanvasElement, rand: () => number, count: number, alpha: [number, number], color = "90, 80, 64") {
  const g = c.getContext("2d")!;
  g.lineCap = "round";
  for (let n = 0; n < count; n++) {
    const x = rand() * TILE;
    const y = rand() * TILE;
    const len = 8 + rand() * 34;
    const a = rand() * Math.PI * 2;
    const bend = (rand() - 0.5) * 10;
    g.strokeStyle = `rgba(${color}, ${alpha[0] + rand() * (alpha[1] - alpha[0])})`;
    g.lineWidth = 0.8 + rand() * 0.9;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 - Math.sin(a) * bend, y + Math.sin(a) * len * 0.5 + Math.cos(a) * bend, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
}

export function specks(rand: () => number, count: number) {
  const c = canvas();
  const s = c.getContext("2d")!;
  for (let n = 0; n < count; n++) {
    s.fillStyle = `rgba(255, 250, 240, ${0.04 + rand() * 0.1})`;
    const r = 0.5 + rand() * 1.4;
    s.fillRect(rand() * TILE, rand() * TILE, r, r);
  }
  return c;
}
