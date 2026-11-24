"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob, renderPNG } from "@/lib/tmsc/download";
import { ensureFont } from "@/lib/tmsc/fonts";
import { zip, type ZipEntry } from "@/lib/tmsc/zip";
import { drawQuoteCard, type CardOptions } from "./card";
import { SLUG } from "./data";
import type { Quote } from "./types";

/** Every quote as its own card PNG, in one .zip. */
export function CardsZipButton({ quotes, size, options }: { quotes: readonly Quote[]; size: { w: number; h: number }; options: CardOptions }) {
  const [busy, setBusy] = useState<number | null>(null);
  const run = async () => {
    try {
      await ensureFont();
      const entries: ZipEntry[] = [];
      for (let i = 0; i < quotes.length; i++) {
        setBusy(i + 1);
        const blob = await renderPNG(size.w, size.h, (ctx) => drawQuoteCard(ctx, size.w, size.h, quotes[i], 1e4, options, i, quotes.length));
        entries.push({ name: `${SLUG}-${String(i + 1).padStart(2, "0")}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
      }
      const out = zip(entries) as Uint8Array<ArrayBuffer>;
      downloadBlob(new Blob([out], { type: "application/zip" }), `${SLUG}-cards-${size.w}x${size.h}.zip`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <Button variant="outline" onClick={run} disabled={busy !== null}>
      {busy === null ? "Export all cards (.zip)" : `Card ${busy} of ${quotes.length}`}
    </Button>
  );
}
