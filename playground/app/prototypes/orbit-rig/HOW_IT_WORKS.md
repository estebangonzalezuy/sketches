# Orbit Rig — How It Works

## What It Does

A debug rig for an orbital card animation, modeled on the tools from Design Engineering
Night 9. Cards fly from a stack onto a sphere, driven by one master timeline `t`, with the
hidden structure (sphere, axis, anchors, paths) drawn on top and every parameter tunable,
including squash curves that change over `t`.

## Architecture

```
 Play ─┐   Rest/Orbit or tap stage ─┐   Timeline slider ─┐
       ▼                            ▼                    ▼
                  useTimeline  (one rAF loop)
       play: t += dt/duration   seek: t eases toward 0|1   scrub: t = value
       spinDeg += spin·dt
                         │ t, spinDeg
         ┌───────────────┼─────────────────────┐
         ▼               ▼                     ▼
  curves (useCurves) → squash(t) = evalCurve(keys, t)   controls (useControls)
         │                       │                     │ orb size, offsets, delay…
         └──────────────┬────────┴─────────────────────┘
                        ▼
      rig.ts  cardPoses(params, squash, t, spin)          (pure)
        card i: p = easeInOut(stagger(t, i, delay))
                pos = lerp(stack_i, anchor_i, p)   anchor = fibonacci point → squash
                scale = lerp(1, orbCardsSize, p)           → size → rotateY → orb center
                        │
                        ▼  project(): CSS-style perspective, world → px
        Stage: cards sorted far→near   DebugOverlay: sphere rings, axis, anchors, paths
```

## Frontend

- **Master control**: `t` (0–1). Play runs 0→1 over Duration (Pause then Play resumes).
  Rest/Orbit, or tapping the stage, eases `t` toward 0 or 1 with an exponential approach:
  a new target mid-flight just changes direction, so fast or repeated input never stacks
  animations. Scrubbing writes `t` and stops both. The page opens at t = 0.62.
- **Per-card mapping**: each card has its own window of `t` (Orb delay staggers them),
  eased with cubic in-out, interpolating position (x, y, z) and scale from its stack slot
  to its anchor on the orb.
- **Curves**: X/Y/Z squash are values over `t`, edited as graphs. Drag a point; tap empty
  space to add one; Remove point (or Delete) removes the selected inner point; endpoints
  stay at t = 0 and 1. Interpolation is monotone cubic, so it never overshoots. The
  vertical line is the playhead. Curves persist in `playground:orbit-rig:curves`.
- **Panel** (shared controls: persistence, Reset, Randomize): Debug sphere, Paths, Hide
  front card, Duration, Orb delay, Spin, Main rotate, Main X/Z offset, Orb size, Orb Z
  offset, Orb cards size, Slice (how much of the sphere the cards cover), Cards, Tint.
- **Rendering**: no WebGL. Positions are projected in JS with the same falloff as CSS
  perspective; cards are absolutely positioned billboards with `z-index` by depth. The
  scene scales with the stage width (760 world units across).
- **Responsive**: single column; stage on top. At 375px the transport wraps the timeline to
  its own line and icon-only buttons replace labels.
- **Reduced motion**: no spin; Play and state changes jump instead of animating.

## API

None.

## Key Dependencies

- `components/controls`, `components/motion/collapse`, `components/ui` (Button, Slider).
- `lucide-react` icons.

## Component Tree

```
Page (page.tsx)
└── OrbitRig
    └── ControlsLayout (panel: side ≥ lg, bottom sheet < lg)
        ├── Stage
        │   ├── OrbitCard ×n
        │   └── DebugOverlay   sphere rings, axis, anchors, paths
        ├── Transport          Play, Rest/Orbit, timeline
        └── CurveRow ×3        → Collapse → CurveEditor
```

## Error Handling

- Stored curves go through `sanitizeKeys`: non-numbers fall back to the defaults, values
  clamp to range, keys are sorted and endpoints pinned to 0 and 1.
- Control values are sanitized by the shared controls library.

## File Structure

```
orbit-rig/
├── page.tsx              thin server entry
├── metadata.json
├── HOW_IT_WORKS.md
├── types.ts
├── data.ts               control schema, curve defaults, sizes
├── curve.ts              monotone cubic eval, add/move/remove keys (pure)
├── rig.ts                stagger, sphere points, poses, projection, wireframe (pure)
├── rig.test.ts           vitest
├── use-timeline.ts       t, play/seek/scrub, spin
├── use-curves.ts         persisted curves
├── use-size.ts           ResizeObserver
├── use-reduced-motion.ts
├── orbit-rig.tsx         client root
├── stage.tsx             scene + tap to toggle
├── orbit-card.tsx
├── debug-overlay.tsx
├── transport.tsx
├── curve-row.tsx         collapsible parameter row
└── curve-editor.tsx      draggable graph
```
