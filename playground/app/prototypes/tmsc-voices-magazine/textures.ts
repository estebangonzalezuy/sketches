/**
 * Paper finishes baked into the pages (and the table): each is a seamless 1024 px tile that is
 * multiplied over the art, so it sits under the ink and goes through the mipmaps. All
 * deterministic, so exports repeat exactly. "Uploaded" tiles your own image, normalised so its
 * average is near white and it only adds texture, not a cast.
 */

import { canvas, fibers, field, rng, specks, TILE, valueNoise } from "./texture-noise";

export const TEXTURES = ["Newsprint", "Recycled", "Laid", "Linen", "Riso grain", "Smooth", "Uploaded"] as const;
export type TextureKind = (typeof TEXTURES)[number];
export type TextureSetup = { kind: TextureKind; strength: number; image: HTMLImageElement | null };


const tiles = new Map<string, { tile: HTMLCanvasElement; specks: HTMLCanvasElement | null }>();

function build(kind: TextureKind, image: HTMLImageElement | null) {
  const rand = rng(20261125);
  const cloud = valueNoise(8, rand);
  const fleck = valueNoise(48, rand);
  const U = (x: number) => x / TILE;
  switch (kind) {
    case "Newsprint": {
      const t = field((x, y) => 1 - 0.016 * cloud(U(x), U(y)) - 0.012 * fleck(U(x), U(y)) - 0.022 * rand(), [255, 254, 250]);
      fibers(t, rand, 420, [0.025, 0.075]);
      return { tile: t, specks: specks(rand, 2600) };
    }
    case "Recycled": {
      const t = field((x, y) => 1 - 0.04 * cloud(U(x), U(y)) - 0.03 * fleck(U(x), U(y)) - 0.035 * rand(), [255, 250, 238]);
      fibers(t, rand, 1100, [0.05, 0.12]);
      fibers(t, rand, 90, [0.15, 0.3], "70, 90, 150"); // stray coloured fibres
      fibers(t, rand, 60, [0.15, 0.3], "160, 70, 60");
      return { tile: t, specks: specks(rand, 3600) };
    }
    case "Laid": {
      // fine laid lines across, chain lines down, as in a mould-made sheet
      const t = field((x, y) => {
        const laid = y % 11 < 2 ? 0.018 : 0;
        const chain = x % 256 < 3 ? 0.03 : 0;
        return 1 - laid - chain - 0.012 * cloud(U(x), U(y)) - 0.012 * rand();
      }, [255, 253, 246]);
      return { tile: t, specks: null };
    }
    case "Linen": {
      const t = field((x, y) => {
        // threads every 8 px both ways, thickness wandering a little along each thread
        const warp = Math.abs(Math.sin((x * Math.PI) / 8)) ** 2 * (0.5 + 0.5 * fleck(U(x), U(y * 0.2)));
        const weft = Math.abs(Math.sin((y * Math.PI) / 8)) ** 2 * (0.5 + 0.5 * fleck(U(x * 0.2), U(y)));
        return 1 - 0.05 * warp - 0.05 * weft - 0.012 * rand();
      }, [255, 254, 249]);
      return { tile: t, specks: null };
    }
    case "Riso grain": {
      const t = field(() => 1 - 0.09 * rand() ** 3, [255, 255, 255]);
      return { tile: t, specks: specks(rand, 5000) };
    }
    case "Uploaded":
      return image ? { tile: fromImage(image), specks: null } : null;
    default:
      return null;
  }
}

/** Your image as a tile: covers 1024², brightness normalised so its mean is ~96 % white. */
function fromImage(img: HTMLImageElement) {
  const c = canvas();
  const g = c.getContext("2d", { willReadFrequently: true })!;
  const s = Math.max(TILE / img.width, TILE / img.height);
  g.drawImage(img, (TILE - img.width * s) / 2, (TILE - img.height * s) / 2, img.width * s, img.height * s);
  const data = g.getImageData(0, 0, TILE, TILE);
  let sum = 0;
  for (let i = 0; i < data.data.length; i += 4) sum += 0.2126 * data.data[i] + 0.7152 * data.data[i + 1] + 0.0722 * data.data[i + 2];
  const gain = (0.96 * 255) / Math.max(1, sum / (TILE * TILE));
  for (let i = 0; i < data.data.length; i += 4) for (let j = 0; j < 3; j++) data.data[i + j] = Math.min(255, data.data[i + j] * gain);
  g.putImageData(data, 0, 0);
  return c;
}

function tilesFor(t: TextureSetup) {
  const key = t.kind === "Uploaded" ? `up:${t.image?.src.length ?? 0}:${t.image?.src.slice(-64)}` : t.kind;
  if (!tiles.has(key)) {
    const built = build(t.kind, t.image);
    if (!built) return null;
    tiles.set(key, built);
  }
  return tiles.get(key)!;
}

/** Multiplies the chosen paper into what's drawn. `scale` maps tile pixels to canvas pixels. */
export function applyTexture(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, t: TextureSetup) {
  if (t.strength <= 0) return;
  const tl = tilesFor(t);
  if (!tl) return;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = ctx.createPattern(tl.tile, "repeat")!;
  // strengths above 100 % lay the tile down a second time
  for (let left = t.strength; left > 0; left -= 1) {
    ctx.globalAlpha = Math.min(1, left);
    ctx.fillRect(0, 0, w / scale, h / scale);
  }
  if (tl.specks) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.4 * Math.min(1, t.strength);
    ctx.fillStyle = ctx.createPattern(tl.specks, "repeat")!;
    ctx.fillRect(0, 0, w / scale, h / scale);
  }
  ctx.restore();
}
