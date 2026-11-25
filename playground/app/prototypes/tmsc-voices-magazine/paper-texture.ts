/**
 * A light newsprint finish, baked into every page so it sits under the ink and goes through
 * the mipmaps (no shimmer while turning). Deterministic: the same paper on every bake and
 * every export. Sizes are in baked-texture pixels at the design size (1440 wide).
 */

const TILE = 1024;
let tile: HTMLCanvasElement | null = null;
let specks: HTMLCanvasElement | null = null;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Smooth value noise that wraps at the tile edge. */
function valueNoise(cells: number, rand: () => number) {
  const g = Array.from({ length: cells * cells }, rand);
  const at = (x: number, y: number) => g[((y % cells) * cells + (x % cells)) | 0];
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

function buildTiles() {
  const rand = rng(20261125);
  tile = document.createElement("canvas");
  tile.width = tile.height = TILE;
  const g = tile.getContext("2d")!;
  const img = g.createImageData(TILE, TILE);
  const cloud = valueNoise(8, rand); // soft mottling of the pulp
  const fleck = valueNoise(48, rand); // smaller unevenness
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      const u = x / TILE;
      const v = y / TILE;
      const k = 1 - 0.016 * cloud(u, v) - 0.012 * fleck(u, v) - 0.022 * rand();
      const i = (y * TILE + x) * 4;
      // newsprint leans a touch warm
      img.data[i] = 255 * k;
      img.data[i + 1] = 254 * k;
      img.data[i + 2] = 250 * k;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  // short fibers, a few darker, a few lighter
  g.lineCap = "round";
  for (let n = 0; n < 420; n++) {
    const x = rand() * TILE;
    const y = rand() * TILE;
    const len = 8 + rand() * 34;
    const a = rand() * Math.PI * 2;
    const bend = (rand() - 0.5) * 10;
    g.strokeStyle = `rgba(90, 80, 64, ${0.025 + rand() * 0.05})`;
    g.lineWidth = 0.8 + rand() * 0.9;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 - Math.sin(a) * bend, y + Math.sin(a) * len * 0.5 + Math.cos(a) * bend, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  // pale specks that show the paper through solid ink
  specks = document.createElement("canvas");
  specks.width = specks.height = TILE;
  const s = specks.getContext("2d")!;
  for (let n = 0; n < 2600; n++) {
    s.fillStyle = `rgba(255, 250, 240, ${0.04 + rand() * 0.1})`;
    const r = 0.5 + rand() * 1.4;
    s.fillRect(rand() * TILE, rand() * TILE, r, r);
  }
}

/** Multiplies the paper into the page, then lifts solid ink a hair with the specks. */
export function newsprint(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  if (!tile || !specks) buildTiles();
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = ctx.createPattern(tile!, "repeat")!;
  ctx.fillRect(0, 0, w / scale, h / scale);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = ctx.createPattern(specks!, "repeat")!;
  ctx.fillRect(0, 0, w / scale, h / scale);
  ctx.restore();
}
