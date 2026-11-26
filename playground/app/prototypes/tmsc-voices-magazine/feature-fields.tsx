"use client";

import { cn } from "cn";
import { ColorSwatches } from "@/components/controls";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { displayDate } from "./content";
import { TMSC_PALETTE } from "./data";
import type { Feature, FeatureImage } from "./feature";
import { imageUrl, postImages, type FeatureData } from "./feature-data";
import type { PostData, PostSummary } from "./substack-parse";

type Props = {
  feature: Feature;
  data: FeatureData;
  post: PostData;
  posts: PostSummary[];
  onChange: (patch: Partial<Feature>) => void;
};

const label = "text-xs text-muted-foreground";
const short = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Everything you can set on one feature. Choices come from its post; blanks fall back to it. */
export function FeatureFields({ feature, data, post, posts, onChange }: Props) {
  const imgs = postImages(post);
  const intro = feature.image === null ? null : (feature.image ?? imgs[0] ?? null);
  const pick = (img: FeatureImage | null) => onChange({ image: img });
  const textValue = (i: 0 | 1) => {
    const v = feature.textImages?.[i];
    if (v === undefined) return "auto";
    if (v === null) return "none";
    return String(imgs.findIndex((x) => x.src === v.src));
  };
  const setText = (i: 0 | 1, value: string) => {
    const next: [FeatureImage | null | undefined, FeatureImage | null | undefined] = [feature.textImages?.[0], feature.textImages?.[1]];
    next[i] = value === "auto" ? undefined : value === "none" ? null : imgs[Number(value)];
    onChange({ textImages: next });
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <label className="flex flex-col gap-1">
        <span className={label}>Post</span>
        <NativeSelect value={feature.slug} onChange={(e) => onChange({ slug: e.target.value })}>
          {!posts.some((p) => p.slug === feature.slug) && <NativeSelectOption value={feature.slug}>{post.title}</NativeSelectOption>}
          {posts.map((p) => (
            <NativeSelectOption key={p.slug} value={p.slug}>
              {short(`${displayDate(p.date)} · ${p.title}`, 70)}
              {p.paid ? " (paid)" : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>

      <label className="flex flex-col gap-1">
        <span className={label}>Name</span>
        <Input value={feature.guest ?? data.guest} onChange={(e) => onChange({ guest: e.target.value })} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={label}>Quote</span>
        <NativeSelect value={data.quote} onChange={(e) => onChange({ quote: e.target.value })}>
          {!post.quotes.includes(data.quote) && <NativeSelectOption value={data.quote}>{short(data.quote)}</NativeSelectOption>}
          {post.quotes.map((q) => (
            <NativeSelectOption key={q} value={q}>
              {short(q)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <span className="text-xs leading-snug text-muted-foreground">“{data.quote}”</span>
      </label>

      <div className="flex flex-col gap-1">
        <span className={label}>Image</span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => pick(null)} className={cn("size-11 rounded-md border border-border text-xs text-muted-foreground", intro === null && "ring-2 ring-ring")}>
            None
          </button>
          {imgs.map((img) => (
            <button
              key={img.src}
              type="button"
              onClick={() => pick({ src: img.src, frame: intro?.src === img.src ? intro.frame : img.frame })}
              className={cn("size-11 overflow-hidden rounded-md border border-border", intro?.src === img.src && "ring-2 ring-ring")}
              aria-label="Use this image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- same-origin proxy thumbnails, not a Next image */}
              <img src={imageUrl(img, 120)} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
        {intro && /\.gif$/i.test(intro.src) && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Frame
            <NativeSelect size="sm" className="w-20" value={String(intro.frame)} onChange={(e) => pick({ ...intro, frame: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <NativeSelectOption key={n} value={String(n)}>
                  {n}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {([0, 1] as const).map((i) => (
          <label key={i} className="flex flex-col gap-1">
            <span className={label}>Q&A image {i + 1}</span>
            <NativeSelect value={textValue(i)} onChange={(e) => setText(i, e.target.value)}>
              <NativeSelectOption value="auto">Auto</NativeSelectOption>
              <NativeSelectOption value="none">None</NativeSelectOption>
              {imgs.map((_, n) => (
                <NativeSelectOption key={n} value={String(n)}>
                  Image {n + 1}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        ))}
      </div>

      {(["left", "right"] as const).map((side) => (
        <div key={side} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={label}>{side === "left" ? "Left page" : "Quote page"}</span>
            {/* any other colour, beyond the palette */}
            <input
              type="color"
              aria-label={`${side === "left" ? "Left page" : "Quote page"} custom colour`}
              className="size-11 cursor-pointer rounded-md border border-border bg-transparent p-1 sm:size-8"
              value={data[side].bg.toLowerCase()}
              onChange={(e) => onChange({ [side]: e.target.value })}
            />
          </div>
          <ColorSwatches swatches={TMSC_PALETTE} value={data[side].bg} onChange={(hex) => onChange({ [side]: hex })} />
        </div>
      ))}
    </div>
  );
}
