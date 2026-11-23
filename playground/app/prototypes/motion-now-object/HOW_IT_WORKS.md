# Motion, Now · tMSC Object — How It Works

## What It Does

An absurd, shareable brand object: a "Certified Motion Designer" medal generated from your
answers (handle, role, years, favorite easing). It turns slowly, spins with inertia when
dragged, and is orbited by curved type and technical joke labels. Exports a PNG and a
seamless 6 s loop.

## Architecture

```
answers (persisted) ──▶ answers.ts  joke labels, bezier text/curve (pure)
controls ─────────────▶ render.ts   drawObject(ctx, w, h, frame)
                          ├─ orbit.ts  back halves of two tilted text rings
                          ├─ medal.ts  faux-3D seal: ribbon tails, stacked edge slices, face
                          └─ orbit.ts  front halves (drawn over the medal)
Spin (drag → velocity → eases back to base speed) ─▶ live θ / orbit phase
loopAt(t) ─▶ whole turns in 6 s ─▶ RenderVideoButton (frame-exact MP4 loop)
```

## Frontend

- **Faux 3D, flat colors**: the medal turns on its vertical axis by scaling x by cos θ; the
  edge is the silhouette stacked across the thickness; the visible face is front (cos θ ≥ 0)
  or back. Front: "Certified Motion Designer", handle, role and years. Back: tMSC, the
  favorite easing plotted, its `cubic-bezier()`.
- **Rings**: letters are placed on tilted circles; reading direction foreshortens at the
  sides and mirrors on the far side; far letters are drawn behind the medal at 45%.
- **Drag**: horizontal drag turns the medal; release keeps the velocity, which eases back to
  the base speed.
- **Loop export**: max(1, round(speed)) medal turns and one ring turn in 6 s, so it repeats.
- **Reduced motion**: no automatic rotation; dragging still works.

## API

None.

## Key Dependencies

`lib/tmsc` (palettes, fonts, easing, video), `components/tmsc`.

## Component Tree

```
Page
└── TmscObject
    └── ControlsLayout
        ├── header: AnswersForm · PngButton · RenderVideoButton
        └── Stage (Spin, drawObject)
```

## Error Handling

- Stored answers are sanitized (`sanitizeAnswers`); unknown roles/easings fall back.

## File Structure

```
motion-now-object/
├── page.tsx, metadata.json, HOW_IT_WORKS.md
├── data.ts           controls, easings, defaults
├── answers.ts        labels, bezier helpers (pure) + answers.test.ts
├── medal.ts          the medal
├── orbit.ts          curved ring text
├── render.ts         composition
├── spin.ts           drag inertia + loop timing
├── answers-form.tsx  inputs
└── tmsc-object.tsx   client root
```
