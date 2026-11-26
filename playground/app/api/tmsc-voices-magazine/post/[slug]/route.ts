import { NextResponse } from "next/server";
import { getPost } from "../../substack";

/** GET /post/<slug> → PostData (paragraphs, quotes, images, guest). */
export async function GET(_req: Request, ctx: RouteContext<"/api/tmsc-voices-magazine/post/[slug]">) {
  try {
    const { slug } = await ctx.params;
    if (!/^[a-z0-9-]{1,200}$/.test(slug)) return NextResponse.json({ error: "Bad slug." }, { status: 400 });
    return NextResponse.json(await getPost(slug), { headers: { "cache-control": "public, max-age=300, s-maxage=3600" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't read that post." }, { status: 502 });
  }
}
