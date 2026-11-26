import { NextResponse } from "next/server";
import { listPosts } from "../substack";

/** GET → { posts: PostSummary[] }, newest first. */
export async function GET() {
  try {
    return NextResponse.json({ posts: await listPosts() }, { headers: { "cache-control": "public, max-age=300, s-maxage=3600" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't read the Substack archive." }, { status: 502 });
  }
}
