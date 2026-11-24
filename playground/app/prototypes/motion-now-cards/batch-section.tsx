"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataEditor } from "@/components/tmsc/data-editor";
import { downloadBlob, renderPNG, slugify } from "@/lib/tmsc/download";
import { ensureFont } from "@/lib/tmsc/fonts";
import { renderVideo } from "@/lib/tmsc/video";
import { zip, type ZipEntry } from "@/lib/tmsc/zip";
import { drawCard, type CardOptions } from "./card-render";
import { EXAMPLE_FINDINGS, SLUG, VIDEO_DURATION } from "./data";
import { parseFindings } from "./findings";
import type { Finding } from "./types";

const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

/** Batch mode: a JSON array of findings, exported as one .zip of PNGs or videos. */
export function BatchSection({
  findings,
  onApply,
  onRestore,
  onLoad,
  size,
  options,
}: {
  findings: Finding[];
  onApply: (f: Finding[]) => void;
  onRestore: () => void;
  onLoad: (f: Finding) => void;
  size: { w: number; h: number };
  options: CardOptions;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const isExample = useMemo(() => JSON.stringify(findings) === JSON.stringify(EXAMPLE_FINDINGS), [findings]);
  const name = (f: Finding, i: number) => `${String(i + 1).padStart(2, "0")}-${slugify(`${f.number}${f.unit} ${f.sentence}`)}`;

  const exportAll = async (kind: "png" | "video") => {
    if (busy) return;
    try {
      await ensureFont();
      const entries: ZipEntry[] = [];
      for (let i = 0; i < findings.length; i++) {
        const f = findings[i];
        setBusy(`${kind === "png" ? "PNG" : "Video"} ${i + 1} of ${findings.length}`);
        if (kind === "png") {
          const blob = await renderPNG(size.w, size.h, (ctx) => drawCard(ctx, size.w, size.h, f, 99, options));
          entries.push({ name: `${name(f, i)}.png`, data: await bytes(blob) });
        } else {
          const { blob, ext } = await renderVideo({ width: size.w, height: size.h, duration: VIDEO_DURATION, draw: (ctx, t) => drawCard(ctx, size.w, size.h, f, t, options) });
          entries.push({ name: `${name(f, i)}.${ext}`, data: await bytes(blob) });
        }
      }
      const out = zip(entries) as Uint8Array<ArrayBuffer>;
      downloadBlob(new Blob([out], { type: "application/zip" }), `${SLUG}-${kind}-${size.w}x${size.h}.zip`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <DataEditor label="Batch findings (JSON)" value={findings} isExample={isExample} parse={parseFindings} onApply={onApply} onRestore={onRestore} />
      <div className="flex flex-wrap gap-2" aria-label="Load a finding into the editor">
        {findings.map((f, i) => (
          <Button key={i} variant="outline" size="icon" onClick={() => onLoad(f)} aria-label={`Edit finding ${i + 1}`}>
            {i + 1}
          </Button>
        ))}
      </div>
      <div className="grid gap-2">
        <Button variant="outline" disabled={!!busy} onClick={() => exportAll("png")}>
          {busy?.startsWith("PNG") ? busy : `Export all PNGs (.zip)`}
        </Button>
        <Button variant="outline" disabled={!!busy} onClick={() => exportAll("video")}>
          {busy?.startsWith("Video") ? busy : `Export all videos (.zip)`}
        </Button>
      </div>
    </div>
  );
}
