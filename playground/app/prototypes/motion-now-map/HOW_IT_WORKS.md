# Motion, Now · Respondent Map — How It Works

## What It Does

The hero piece: every one of ~300 (example) survey respondents is a dot. Pick a grouping
(role, experience, work mode, region) and the dots spring into labeled clusters. Hover a
cluster to dim the rest; click to zoom in and see three key numbers for that group.

## Architecture

```
useRespondents (example data / pasted JSON) ─┐
useControls (group, dot size, drift, …) ─────┤
                                             ▼
                                MapScene.configure()  ── relayout only when needed
                                  │  clusters.ts  grid of sunflower discs (pure)
                                  │  dots.ts      spring from old slot to new, 1 ms stagger
                                  │  camera.ts    view tween, power3.inOut, 1 s
                                  ▼
             Stage rAF ─▶ scene.tick(dt, now) ─▶ drawMap(ctx, scene)  (preview + live recording)
             pointer  ─▶ scene.pointer()  hover / click zoom / click empty = zoom out
             Escape   ─▶ scene.setFocus(-1)
```

## Frontend

- **Grouping change**: every dot re-targets from where it is; starts are 1 ms apart
  (left → right), each move takes 900 ms on a damped spring with a soft overshoot.
- **Drift**: each dot wanders on smooth value noise; "Drift strength" scales it.
- **Hover**: other clusters fade to 25%. **Click**: the camera zooms on the cluster (log-space
  scale tween, 1 s, power3.inOut); the title swaps to the group name and three numbers
  (median day rate, % using AI weekly+, mean mood) rise in. Esc, clicking empty space or
  the same cluster zooms out.
- **Formats**: 16:9 (1920×1080) or 4:5 (1080×1350); the layout is recomputed per format.
- **Exports**: PNG of the current frame; "Record" captures a live take (MediaRecorder; MP4
  where the browser offers it, otherwise WebM, labeled on the button).
- **Reduced motion**: no drift, regroup and zoom are instant.
- **Responsive**: stage on top, controls in the bottom sheet under `lg`; tap = click.

## API

None.

## Key Dependencies

`lib/tmsc` (survey example data, stats, palettes, easing, fonts, video), `components/tmsc`
(`Stage`, export buttons, `RespondentsEditor`).

## Component Tree

```
Page
└── RespondentMap
    └── ControlsLayout
        ├── header: PngButton · LiveRecordButton
        ├── Stage (MapScene, drawMap)
        └── footer: RespondentsEditor
```

## Error Handling

- Respondents JSON is validated field by field (`parseRespondents`); errors show inline.
- A recording is stopped and saved if the format changes mid-take.

## File Structure

```
motion-now-map/
├── page.tsx, metadata.json, HOW_IT_WORKS.md
├── data.ts            controls, groupings, timings
├── clusters.ts        cluster layout + hit test (pure) + clusters.test.ts
├── dots.ts            spring/stagger dot motion, drift
├── camera.ts          view math and tween
├── group-stats.ts     the three key numbers
├── scene.ts           state + interaction
├── draw.ts            canvas drawing
└── respondent-map.tsx client root
```
