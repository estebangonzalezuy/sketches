# Motion, Now · Finding Cards — How It Works

## What It Does

Makes 4:5 report cards for tMSC: Motion, Now 2026: a huge number, one sentence and a mini
chart that backs it. "Play" counts the number up while the chart draws in. Batch mode
exports a whole JSON list of findings as PNGs or MP4s in one .zip.

## Architecture

```
FindingForm ─┐                          usePersistent  ⇄ localStorage
             ├─▶ finding ─┐             (finding, batch, controls)
BatchSection ┘            ▼
                drawCard(ctx, w, h, finding, t, options)   ◀── pure function of t
                 │   ├─ displayNumber()  count-up, unit placement
                 │   └─ charts.ts        bar · dot grid · line · donut · before/after
       ┌─────────┼───────────────┬───────────────────────────┐
       ▼         ▼               ▼                           ▼
  Stage (rAF)  PngButton   RenderVideoButton            BatchSection
  preview      renderPNG   renderVideo (WebCodecs        PNG/MP4 per finding
                           H.264 → mp4-muxer)            → zip() → download
```

## Frontend

- **State**: the current finding and the batch list persist in localStorage via
  `usePersistent`; controls (background, format, example tag) via `useControls`.
- **Timeline** (seconds since Play): number counts up 0 → 1.2 s with `expo.out`; the chart
  starts at 0.15 s. Bars grow 40 ms apart; the dot grid fills in a seeded random order; the
  line draws along its length; the donut sweeps. Videos are 4 s (animation + hold).
- **Palette**: the chapter picks the palette pair (`lib/tmsc/palettes.ts`); "Background"
  chooses the chapter color or its dark side.
- **Formats**: 1080×1350 (4:5) stacks number, sentence, chart; 1920×1080 puts the chart on
  the right. The stage always previews the chosen format.
- **Batch**: paste a JSON array (`number`, `unit`, `sentence`, `chart`, `data`, `chapter`,
  `n`); number buttons load one into the editor.
- **Reduced motion**: the card is shown finished; Play has no visible effect.
- **Responsive**: stage on top, controls in the bottom sheet under `lg`.

## API

None.

## Key Dependencies

- `lib/tmsc` (shared brand layer): palettes, Archivo Narrow loader, easing, video export
  (`mp4-muxer`), PNG export, zip writer.
- `components/tmsc`: `Stage`, export buttons, `DataEditor`, `usePersistent`.

## Component Tree

```
Page
└── FindingCards
    └── ControlsLayout
        ├── header: Play · PngButton · RenderVideoButton · FindingForm
        ├── Stage
        └── footer: BatchSection (DataEditor, load buttons, zip exports)
```

## Error Handling

- Pasted JSON is parsed and validated (`parseFindings`); errors show under the textarea.
- Export failures (no WebCodecs and no MediaRecorder, canvas errors) show a toast.
- Stored values that no longer validate fall back to the examples.

## File Structure

```
motion-now-cards/
├── page.tsx, metadata.json, HOW_IT_WORKS.md
├── types.ts            Finding, ChartType, Box
├── data.ts             controls, timings, EXAMPLE_FINDINGS
├── findings.ts         parsing, count-up formatting (pure) + findings.test.ts
├── charts.ts           the five mini charts (canvas)
├── card-render.ts      card layout for any size
├── finding-form.tsx    inputs for one finding
├── batch-section.tsx   batch JSON + zip export
└── finding-cards.tsx   client root
```
