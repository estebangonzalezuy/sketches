/**
 * Social previews for PUBLIC prototypes: public/og/<slug>.png (1200×630, og:image) and
 * public/og/<slug>.mp4 (1200×630, ~6 s, H.264, og:video). Needs ffmpeg on PATH.
 *
 *   npm run og -- <slug> [more slugs]   (or --slug a,b, --missing, --no-build)
 *   npm run og                          every public prototype
 *
 * Captures /p/<slug> in dark mode with the prototype bar and control panel hidden.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, renameSync } from "node:fs";
import { join } from "node:path";
import { discoverPrototypes, ROOT } from "./discover";
import { parseArgs } from "./lib/args";
import { build, hideChrome, settle, startSession } from "./lib/server";

const OUT = join(ROOT, "public", "og");
const TMP = join(ROOT, ".capture");
const SIZE = { width: 1200, height: 630 };
const SECONDS = 6;

async function main() {
  const args = parseArgs(process.argv.slice(2), 3124);
  const pub = discoverPrototypes().filter((p) => p.meta.public).map((p) => p.slug);
  for (const s of args.slugs) {
    if (!pub.includes(s)) throw new Error(`"${s}" is not public. Set "public": true first.`);
  }
  let targets = args.slugs.length ? args.slugs : pub;
  if (args.missing) {
    targets = targets.filter(
      (s) => !existsSync(join(OUT, `${s}.png`)) || !existsSync(join(OUT, `${s}.mp4`)),
    );
  }
  if (!targets.length) {
    console.log("og: nothing to capture");
    return;
  }
  if (spawnSync("ffmpeg", ["-version"]).status !== 0) throw new Error("ffmpeg not found on PATH");

  if (args.build) build();
  mkdirSync(OUT, { recursive: true });
  const session = await startSession(args.port);
  try {
    for (const slug of targets) {
      rmSync(TMP, { recursive: true, force: true });
      mkdirSync(TMP, { recursive: true });
      const ctx = await session.context({
        viewport: SIZE,
        colorScheme: "dark",
        recordVideo: { dir: TMP, size: SIZE },
      });
      await ctx.addInitScript(() => {
        try {
          localStorage.setItem("theme", "dark");
        } catch {}
      });
      await hideChrome(ctx);
      const page = await ctx.newPage();
      const started = Date.now();
      await page.goto(`${session.origin}/p/${slug}`);
      await settle(page, 1000);
      const lead = (Date.now() - started) / 1000;
      await page.screenshot({ path: join(OUT, `${slug}.png`) });
      await page.waitForTimeout(SECONDS * 1000);
      await ctx.close();

      const webm = readdirSync(TMP).find((f) => f.endsWith(".webm"));
      if (!webm) throw new Error("no video recorded");
      const mp4 = join(TMP, `${slug}.mp4`);
      const r = spawnSync(
        "ffmpeg",
        [
          "-y", "-loglevel", "error",
          "-ss", lead.toFixed(2), "-i", join(TMP, webm), "-t", String(SECONDS),
          "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "26",
          "-movflags", "+faststart", mp4,
        ],
        { stdio: "inherit" },
      );
      if (r.status !== 0) throw new Error("ffmpeg failed");
      renameSync(mp4, join(OUT, `${slug}.mp4`));
      console.log(`✓ ${slug}: og/${slug}.png, og/${slug}.mp4`);
    }
  } finally {
    rmSync(TMP, { recursive: true, force: true });
    await session.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
