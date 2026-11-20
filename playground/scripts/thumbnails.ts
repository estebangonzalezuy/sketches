/**
 * Captures gallery thumbnails: public/thumbnails/<slug>-light.jpg and -dark.jpg (640×400).
 *
 *   npm run thumbnails                       every prototype
 *   npm run thumbnails -- flow-field         one
 *   npm run thumbnails -- a b  |  --slug a,b several
 *   npm run thumbnails -- --missing          only prototypes without both files
 *   add --no-build to reuse the current .next build
 *
 * Captures the prototype at a 1280×800 desktop viewport, half scale, with the prototype
 * bar and control panel hidden (see CAPTURE_CSS in scripts/lib/server.ts).
 * Look at the images before committing them.
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { discoverPrototypes, ROOT } from "./discover";
import { parseArgs } from "./lib/args";
import { build, hideChrome, settle, startSession } from "./lib/server";

const OUT = join(ROOT, "public", "thumbnails");
const THEMES = ["light", "dark"] as const;

async function main() {
  const args = parseArgs(process.argv.slice(2), 3123);
  const all = discoverPrototypes();
  const known = new Set(all.map((p) => p.slug));
  for (const s of args.slugs) if (!known.has(s)) throw new Error(`unknown prototype "${s}"`);

  let targets = args.slugs.length ? args.slugs : all.map((p) => p.slug);
  if (args.missing) {
    targets = targets.filter((s) => THEMES.some((t) => !existsSync(join(OUT, `${s}-${t}.jpg`))));
  }
  if (!targets.length) {
    console.log("thumbnails: nothing to capture");
    return;
  }

  if (args.build) build();
  mkdirSync(OUT, { recursive: true });
  const session = await startSession(args.port);
  try {
    for (const theme of THEMES) {
      const ctx = await session.context({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 0.5,
        colorScheme: theme,
        reducedMotion: "no-preference",
      });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {}
      }, theme);
      await hideChrome(ctx);
      const page = await ctx.newPage();
      for (const slug of targets) {
        await page.goto(`${session.origin}/prototypes/${slug}`);
        await settle(page);
        const file = join(OUT, `${slug}-${theme}.jpg`);
        await page.screenshot({ path: file, type: "jpeg", quality: 82 });
        console.log(`✓ ${slug} (${theme})`);
      }
      await ctx.close();
    }
  } finally {
    await session.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
