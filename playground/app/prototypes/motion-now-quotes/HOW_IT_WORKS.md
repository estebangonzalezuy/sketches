# Motion, Now · Quote Wall — How It Works

## What It Does

Anonymous (example) survey quotes appear one at a time, typed like a live chat, filling a
masonry wall. Each shows only role and years ("Freelance, 8 yrs"), never a name. One
keyword per quote can be highlighted. Modes: live typing feed, static wall, and one quote
per card with big condensed type.

## Architecture

```
quotes JSON (persisted) ─▶ feedAt(quotes, t, ms/char, max)   which quotes, how much typed (pure)
                                  │
                                  ▼
                 wall.ts  masonry into the shortest column; drop oldest until it fits
                          WallMotion: blocks glide on reflow, removed blocks fade out
                                  │
                 block.ts layout words (cached per font metrics), keyword block, cursor
                                  │
card.ts  one quote, fitted big type ── same block renderer
```

## Frontend

- **Feed**: 10–80 ms per character (default 32), 0.8 s pause, then the next quote; cycles.
- **Static wall**: as many quotes as fit (up to "Max quotes"), appearing 0.12 s apart.
- **Cards**: prev/next buttons under the stage; Record types the current card;
  "Export all cards" zips every card as PNG.
- **Highlight**: the keyword sits in a flat accent block with the text knocked out.
- **Exports**: PNG of the current frame; Record renders frame by frame (feed: the first
  "max" quotes, 8–30 s; wall: the build-up; card: typing + hold).
- **Reduced motion**: the feed is replaced by the complete static wall; cards show finished.
- **Responsive**: stage on top, controls in the bottom sheet under `lg`.

## API

None.

## Key Dependencies

`lib/tmsc` (palettes, fonts, easing, video, zip), `components/tmsc`.

## Component Tree

```
Page
└── QuoteWall
    └── ControlsLayout
        ├── header: PngButton · RenderVideoButton · CardsZipButton (cards)
        ├── Stage (drawWall / drawQuoteCard) + card nav
        └── footer: DataEditor (quotes JSON)
```

## Error Handling

- Pasted quotes are validated (`parseQuotes`: text, role, years required); errors inline.
- Layout cache keys include font metrics, so the web font loading late can't leave
  stale spacing.

## File Structure

```
motion-now-quotes/
├── page.tsx, metadata.json, HOW_IT_WORKS.md
├── types.ts              Quote, LiveQuote
├── data.ts               controls, timings, EXAMPLE_QUOTES
├── quotes.ts             parsing, attribution, feed timeline (pure) + quotes.test.ts
├── block.ts              one quote block
├── wall.ts               masonry feed / wall
├── card.ts               4:5 card
├── cards-zip-button.tsx  export all cards
└── quote-wall.tsx        client root
```
