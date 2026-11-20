import { NextResponse } from "next/server";
import {
  configuredPassword,
  safeEqual,
  safeNext,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionToken,
} from "@/lib/auth";

/** POST: sign in with { password }. DELETE: sign out. */
export async function POST(request: Request) {
  try {
    const password = configuredPassword();
    if (!password) {
      return NextResponse.json(
        { error: "PLAYGROUND_PASSWORD is not set on this deployment." },
        { status: 503 },
      );
    }
    const body = (await request.json().catch(() => null)) as { password?: unknown; next?: unknown } | null;
    const given = typeof body?.password === "string" ? body.password : "";
    if (!safeEqual(await sessionToken(given), await sessionToken(password))) {
      return NextResponse.json({ error: "Wrong password." }, { status: 401 });
    }
    const res = NextResponse.json({ next: safeNext(typeof body?.next === "string" ? body.next : null) });
    res.cookies.set(SESSION_COOKIE, await sessionToken(password), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (error) {
    console.error("auth: sign-in failed", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
