/**
 * Builds the app, starts `next start` with a throwaway password and hands back a browser
 * context that is already signed in. Shared by thumbnails.ts and og.ts.
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { chromium, type Browser, type BrowserContextOptions } from "playwright";
import { SESSION_COOKIE, sessionToken } from "../../lib/auth";
import { ROOT } from "../discover";

const PASSWORD = "capture-" + Math.random().toString(36).slice(2);

export function build() {
  console.log("› next build");
  const r = spawnSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit", env: process.env });
  if (r.status !== 0) throw new Error("build failed");
}

async function waitFor(url: string, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server did not start at ${url}`);
}

export type Session = {
  origin: string;
  browser: Browser;
  context: (opts?: BrowserContextOptions) => Promise<import("playwright").BrowserContext>;
  close: () => Promise<void>;
};

export async function startSession(port: number): Promise<Session> {
  const origin = `http://localhost:${port}`;
  const server: ChildProcess = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: ROOT,
    env: { ...process.env, PLAYGROUND_PASSWORD: PASSWORD, NODE_ENV: "production" },
    stdio: ["ignore", "ignore", "inherit"],
    detached: true,
  });
  const kill = () => {
    try {
      if (server.pid) process.kill(-server.pid, "SIGTERM");
    } catch {
      // already gone
    }
  };
  process.on("exit", kill);
  await waitFor(`${origin}/login`);

  const token = await sessionToken(PASSWORD);
  const browser = await chromium.launch();
  return {
    origin,
    browser,
    async context(opts) {
      const ctx = await browser.newContext(opts);
      await ctx.addCookies([{ name: SESSION_COOKIE, value: token, url: origin }]);
      return ctx;
    },
    async close() {
      await browser.close();
      kill();
    },
  };
}

/**
 * CSS injected into every capture: hides the prototype bar and anything marked
 * `data-capture-hide` (control panels), and drops the room reserved for the panel.
 */
export const CAPTURE_CSS = `
  body > header, header.sticky, [data-capture-hide] { display: none !important; }
  [data-capture-content] { padding-right: 0 !important; }
`;

export async function hideChrome(ctx: import("playwright").BrowserContext) {
  await ctx.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
    });
  }, CAPTURE_CSS);
}

/** Lets canvases, fonts and entrance animations settle before a capture. */
export async function settle(page: import("playwright").Page, ms = 1500) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}
