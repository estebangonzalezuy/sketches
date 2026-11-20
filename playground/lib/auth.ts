/**
 * Password gate. Runs in proxy.ts, the auth route and the capture scripts, so it only uses
 * Web Crypto (no Node-only APIs).
 *
 * The session cookie holds HMAC-SHA256(password, "playground-session"). Changing
 * PLAYGROUND_PASSWORD signs everybody out.
 */
export const SESSION_COOKIE = "playground_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/**
 * The gate is optional: it is on only in production builds (`next start`, Vercel
 * production and previews) AND when PLAYGROUND_PASSWORD is set. No password, no gate.
 */
export function gateEnabled(): boolean {
  return process.env.NODE_ENV === "production" && configuredPassword() !== null;
}

export function configuredPassword(): string | null {
  const p = process.env.PLAYGROUND_PASSWORD;
  return p && p.length > 0 ? p : null;
}

export async function sessionToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("playground-session"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(cookie: string | undefined): Promise<boolean> {
  const password = configuredPassword();
  if (!password || !cookie) return false;
  return safeEqual(cookie, await sessionToken(password));
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
