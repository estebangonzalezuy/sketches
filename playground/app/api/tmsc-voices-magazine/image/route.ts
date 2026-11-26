import { NextResponse } from "next/server";
import sharp from "sharp";

/**
 * GET ?src=<image url>&frame=1..6[&w=px] → a JPEG the page can bake into a WebGL texture (same origin,
 * so the canvas isn't tainted). Only Substack's own image hosts are fetched. GIFs give one of
 * six evenly spaced frames; a white caption strip at the bottom ("Work by …") is cropped off
 * when found, since the page prints its own credit.
 */

const HOSTS = new Set(["substack-post-media.s3.amazonaws.com", "substackcdn.com"]);
const MAX_SIDE = 1400;

/** Bottom rows that are mostly white with a little text = a caption band; returns the height to keep. */
function captionCut(data: Buffer, w: number, h: number, channels: number): number {
  const rowInk = (y: number) => {
    let n = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * channels;
      if (data[i] + data[i + 1] + data[i + 2] < 700) n++;
    }
    return n / w;
  };
  // walk up from the bottom through the band (white with sparse ink) to the picture (dense)
  let y = h - 1;
  let sawWhite = false;
  while (y > h * 0.75) {
    const ink = rowInk(y);
    if (ink < 0.02) sawWhite = true;
    if (ink > 0.6) break;
    y--;
  }
  return sawWhite && y < h - 4 && y > h * 0.75 ? y + 1 : h;
}

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const src = params.get("src") ?? "";
    const frame = Math.min(6, Math.max(1, Number(params.get("frame")) || 1));
    // thumbnails for the editor ask for a small size
    const side = Math.min(MAX_SIDE, Math.max(64, Number(params.get("w")) || MAX_SIDE));
    let url: URL;
    try {
      url = new URL(src);
    } catch {
      return NextResponse.json({ error: "Bad image URL." }, { status: 400 });
    }
    if (url.protocol !== "https:" || !HOSTS.has(url.hostname)) return NextResponse.json({ error: "Only Substack images." }, { status: 400 });

    // originals can be 10 MB GIFs: too big for the data cache; the JPEG we return is cached instead
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: `Image host answered ${res.status}.` }, { status: 502 });
    const input = Buffer.from(await res.arrayBuffer());
    const pages = (await sharp(input).metadata()).pages ?? 1;
    const page = pages > 1 ? Math.round(((frame - 1) / 5) * (pages - 1)) : 0;
    const img = sharp(input, { page }).flatten({ background: "#ffffff" });
    const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
    const keep = captionCut(data, info.width, info.height, info.channels);
    const out = await img
      .extract({ left: 0, top: 0, width: info.width, height: keep })
      .resize({ width: side, height: side, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 86 })
      .toBuffer();
    return new NextResponse(new Uint8Array(out), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400, s-maxage=604800" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't prepare that image." }, { status: 502 });
  }
}
