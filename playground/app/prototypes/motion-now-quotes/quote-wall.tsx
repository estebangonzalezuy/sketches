"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlsLayout, useControls } from "@/components/controls";
import { DataEditor } from "@/components/tmsc/data-editor";
import { Actions, PngButton, RenderVideoButton } from "@/components/tmsc/export-actions";
import { Stage, StageArea } from "@/components/tmsc/stage";
import { usePersistent } from "@/components/tmsc/use-persistent";
import { useReducedMotion } from "@/components/tmsc/use-reduced-motion";
import { slugify } from "@/lib/tmsc/download";
import { format } from "@/lib/tmsc/formats";
import { cardDuration, drawQuoteCard } from "./card";
import { CardsZipButton } from "./cards-zip-button";
import { controls, EXAMPLE_QUOTES, PAUSE, SLUG, WALL_STAGGER } from "./data";
import { parseQuotes, sanitizeQuotes, typingTime } from "./quotes";
import { drawWall, WallMotion } from "./wall";

const DONE = 1e4;

export function QuoteWall() {
  const c = useControls(SLUG, controls);
  const v = c.values;
  const [quotes, setQuotes, resetQuotes] = usePersistent(SLUG, "quotes", EXAMPLE_QUOTES, sanitizeQuotes);
  const isExample = useMemo(() => JSON.stringify(quotes) === JSON.stringify(EXAMPLE_QUOTES), [quotes]);
  const reduced = useReducedMotion();
  const size = format(v.format);
  const [card, setCard] = useState(0);
  const time = useRef(0);
  const restartKey = useRef("");
  const motion = useRef<WallMotion>(null);
  const video = useRef({ motion: new WallMotion(), last: 0 });
  const index = Math.min(card, quotes.length - 1);
  const quote = quotes[index];
  // reduced motion: no typing feed, the wall is shown complete
  const mode = reduced && v.mode === "Live feed" ? "Static wall" : v.mode;
  const wallOpts = { ...v, mode };
  const cardOpts = { palette: v.palette, speed: v.speed, highlight: v.highlight, fontSize: v.fontSize };

  const drawAt = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number, m: WallMotion) =>
    mode === "Cards" ? drawQuoteCard(ctx, w, h, quote, t, cardOpts, index, quotes.length) : drawWall(ctx, w, h, quotes, t, dt, wallOpts, m);

  const videoLength =
    mode === "Cards"
      ? cardDuration(quote, v.speed)
      : mode === "Static wall"
        ? Math.min(quotes.length, v.max) * WALL_STAGGER + 2.5
        : Math.min(30, Math.max(8, quotes.slice(0, v.max).reduce((s, q) => s + typingTime(q, v.speed) + PAUSE, 0)));

  const header = (
    <Actions>
      <PngButton size={size} name={`${SLUG}-${slugify(mode)}`} draw={(ctx, w, h) => drawAt(ctx, w, h, mode === "Live feed" ? time.current : DONE, 0, new WallMotion())} />
      <RenderVideoButton
        size={size}
        name={`${SLUG}-${slugify(mode)}`}
        duration={Math.round(videoLength * 10) / 10}
        drawAt={(ctx, t) => {
          const r = video.current;
          if (t === 0) r.motion = new WallMotion();
          drawAt(ctx, size.w, size.h, t, t - r.last, r.motion);
          r.last = t;
        }}
      />
      {mode === "Cards" && <CardsZipButton quotes={quotes} size={size} options={cardOpts} />}
    </Actions>
  );

  return (
    <ControlsLayout
      controls={c}
      header={header}
      footer={<DataEditor label={`Quotes (${quotes.length}, JSON)`} value={quotes} isExample={isExample} parse={parseQuotes} onApply={setQuotes} onRestore={resetQuotes} />}
    >
      <StageArea>
        <Stage
          width={size.w}
          height={size.h}
          label={mode === "Cards" ? `Quote card: ${quote.text}` : "Wall of anonymous survey quotes"}
          tick={(dt) => {
            const key = `${mode}|${v.speed}|${index}|${quotes.length}|${size.w}`;
            if (key !== restartKey.current) {
              restartKey.current = key;
              time.current = reduced ? DONE : 0;
              motion.current = new WallMotion();
            }
            time.current += dt;
          }}
          draw={(ctx, w, h) => drawAt(ctx, w, h, reduced && mode === "Cards" ? DONE : time.current, 1 / 60, (motion.current ??= new WallMotion()))}
        />
        {mode === "Cards" && (
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous quote" onClick={() => setCard((index - 1 + quotes.length) % quotes.length)}>
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-14 text-center text-sm text-muted-foreground tabular-nums">
              {index + 1} / {quotes.length}
            </span>
            <Button variant="outline" size="icon" aria-label="Next quote" onClick={() => setCard((index + 1) % quotes.length)}>
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </StageArea>
    </ControlsLayout>
  );
}
