# Motion, Now · Where Do You Land — How It Works

## What It Does

You enter your day rate (in your currency) or years of experience. A distribution of the
(example) survey for people like you animates in, a marker drops onto your position, and a
sentence appears: "You charge more than 58% of freelance 3D artists." Exports a 1200×630
share image.

## Architecture

```
input (rate / years, persisted) ─┐
controls (metric, role, years, ──┼─▶ land()  filter → < 20 answers? → "Not enough answers…"
  mode, currency, palette)       │            else bins, median, q25, q75, percentile (pure)
respondents ─────────────────────┘     │
                                       ▼
                         LandScene.update/tick   bars, median counter, band, axis max ease
                                       │         marker drop (bounce) restarts on change
                                       ▼
                         drawLand(ctx, w, h, scene, view)
```

## Frontend

- **Filters**: role, years band, work mode (the years filter is ignored when the metric is
  years). Groups under 20 answers show "Not enough answers for this group yet".
- **Chart**: solid bars; the median line is knocked out of the bars and labeled; the 25–75
  percentile band is a flat strip under the axis.
- **Motion**: bars and band ease to new values; the median number tweens like a live counter;
  the marker drops with a bounce whenever your value or the group changes; the sentence fades
  up once it lands.
- **Currency**: example exchange rates convert the USD survey data (`data.ts`).
- **Formats**: 1200×630 (default), 1080×1350, 1920×1080. "Record" captures a live take.
- **Reduced motion**: values snap, no drop animation.
- **Responsive**: on phones the value input also sits under the stage, outside the sheet.

## API

None.

## Key Dependencies

`lib/tmsc` (survey, stats, palettes, easing, fonts, video), `components/tmsc`.

## Component Tree

```
Page
└── WhereYouLand
    └── ControlsLayout
        ├── header: value TextField · PngButton · LiveRecordButton
        ├── Stage (LandScene, drawLand) + mobile TextField
        └── footer: RespondentsEditor
```

## Error Handling

- Non-numeric input shows the neutral "Where do you land?" state.
- Respondents JSON is validated; errors show inline.

## File Structure

```
motion-now-land/
├── page.tsx, metadata.json, HOW_IT_WORKS.md
├── data.ts            controls, currencies, constants
├── land.ts            filtering, distribution, percentile, sentence (pure) + land.test.ts
├── scene.ts           animated state
├── draw.ts            canvas drawing
└── where-you-land.tsx client root
```
