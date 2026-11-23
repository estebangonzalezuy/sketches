# Motion, Now · Chapter Morph — How It Works

## What It Does

The same ~300 respondent dots start as a loose cloud and, as you scroll, drag or scrub,
travel into the chart of a report chapter: "Plata" (day-rate histogram), "Lo que viene"
(1–5 mood bars) or "Human + Tool" (AI-use dot matrix). The chapter color wipes up from the
bottom and a giant chapter title slides up into place.

## Architecture

```
progress (control 0..1) ◀── wheel over stage · vertical drag · Play
        │
        ▼
MorphController.tick ── smoothed p (exponential approach), Play clock, chapter switch blend
        │
        ▼
drawMorph(ctx, w, h, state)      pure function of p (and time for the cloud's wobble)
   ├─ slots.ts   chapterSlots(): per-respondent target + labels, travel order (pure)
   ├─ local(p, rank, n, stagger) per-dot delayed progress → easing (power2 / expo / back)
   ├─ wipe       chapter color rises; each dot takes the color of the side it is on
   └─ title      "01 Plata" slides up inside a clip
```

## Frontend

- **Scrubbing**: everything is a function of p, so it plays identically forwards and
  backwards; the displayed p eases toward the target for smoothness.
- **Stagger**: share of the timeline spent staggering; dots leave in a sweep across the chart.
- **Duration**: seconds for Play (0 → 1). Record renders 0.5 s still + Play + 1.5 s hold,
  frame by frame (WebCodecs H.264 MP4).
- **Chapter switch**: positions blend from the old chart to the new one over 0.9 s.
- **Formats**: 16:9 or 4:5; chart and title re-lay out per format.
- **Reduced motion**: p follows the slider directly; no wobble smoothing.
- **Responsive**: drag on the stage scrubs on touch screens; controls in the bottom sheet.

## API

None.

## Key Dependencies

`lib/tmsc` (survey, stats, easing, palettes, fonts, video), `components/tmsc`.

## Component Tree

```
Page
└── ChapterMorph
    └── ControlsLayout
        ├── header: Play · PngButton · RenderVideoButton
        ├── Stage (MorphController, drawMorph)
        └── footer: RespondentsEditor
```

## Error Handling

- Respondents JSON is validated; errors show inline. Exports report failures as toasts.

## File Structure

```
motion-now-morph/
├── page.tsx, metadata.json, HOW_IT_WORKS.md
├── data.ts          controls, rate bins, timeline marks
├── slots.ts         chart slots per chapter (pure) + slots.test.ts
├── morph.ts         geometry, cloud, drawMorph
├── controller.ts    smoothed progress, Play, chapter blend
└── chapter-morph.tsx client root
```
