/** Tiny argv parser: positional slugs, `--slug a,b`, `--missing`, `--no-build`, `--port 1234`. */
export type CaptureArgs = { slugs: string[]; missing: boolean; build: boolean; port: number };

export function parseArgs(argv: string[], defaultPort: number): CaptureArgs {
  const out: CaptureArgs = { slugs: [], missing: false, build: true, port: defaultPort };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--missing") out.missing = true;
    else if (a === "--no-build") out.build = false;
    else if (a === "--port") out.port = Number(argv[++i]);
    else if (a === "--slug" || a === "--slugs") out.slugs.push(...argv[++i].split(","));
    else if (a.startsWith("--slug=")) out.slugs.push(...a.slice(7).split(","));
    else if (a === "--help" || a === "-h") {
      console.log(
        "usage: [slug ...] [--slug a,b] [--missing] [--no-build] [--port N]\n" +
          "  no slugs      every prototype\n" +
          "  --missing     only prototypes without the output files\n" +
          "  --no-build    reuse the existing .next build",
      );
      process.exit(0);
    } else if (a.startsWith("-")) throw new Error(`unknown flag ${a}`);
    else out.slugs.push(...a.split(","));
  }
  out.slugs = out.slugs.map((s) => s.trim()).filter(Boolean);
  return out;
}
