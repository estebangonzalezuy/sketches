import { NextResponse, type NextRequest } from "next/server";
import { gateEnabled, isValidSession, SESSION_COOKIE } from "@/lib/auth";
import publicSlugs from "@/lib/generated/public-slugs.json";

/**
 * Optional password gate for the whole site. Off unless PLAYGROUND_PASSWORD is set
 * (and always off in `npm run dev`).
 *
 * Reachable without a session:
 *   /login, /api/auth             the gate itself
 *   /p/<slug>                     public prototypes (the page 404s for anything else)
 *   /og/<slug>.*                  social previews of public prototypes
 *   /api/<slug>/*                 API routes of public prototypes
 *   /prototype-assets/<slug>/*    static files of public prototypes
 *
 * For a non-public slug those paths answer 404, never a login redirect, so private
 * names do not leak.
 */
const PUBLIC = new Set<string>(publicSlugs);

function notFound() {
  return new NextResponse("Not found", { status: 404 });
}

export async function proxy(request: NextRequest) {
  if (!gateEnabled()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/auth")) return NextResponse.next();

  const [, first, second] = pathname.split("/");
  const slug = (second ?? "").replace(/\.[a-z0-9]+$/i, "");
  if (first === "p" || first === "og") {
    return PUBLIC.has(slug) ? NextResponse.next() : notFound();
  }

  const authed = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (authed) return NextResponse.next();

  if ((first === "api" || first === "prototype-assets") && PUBLIC.has(second ?? "")) {
    return NextResponse.next();
  }
  if (first === "api") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    // Everything except Next's build output and the favicon.
    "/((?!_next/static|_next/webpack-hmr|favicon.ico).*)",
  ],
};
