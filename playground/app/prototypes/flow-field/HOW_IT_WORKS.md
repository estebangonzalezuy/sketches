# Flow Field — How It Works

## What It Does

Thousands of particles follow the angle of a slowly changing Perlin noise field and leave
fading trails on a canvas. Every parameter is tunable from the control panel.

## Architecture

```
metadata.json ─▶ page.tsx (server, sets <title>)
                    │
                    ▼
               flow-field.tsx (client)
                    │  useControls("flow-field", controls)  ◀─▶  localStorage
                    │                                              playground:flow-field:controls
          ┌─────────┴──────────┐
          ▼                    ▼
  ControlsLayout         FlowFieldCanvas
  (side panel ≥ lg,       │ settingsRef ← values (no loop restart)
   bottom sheet < lg)     │ requestAnimationFrame
                          ▼
              simulation.step(particles, noise, …)  ◀── noise.createNoise(seed)
                          │
                          ▼
                 canvas 2D: fade rect + one stroked path per frame
```

## Frontend

- **State**: control values come from the shared `useControls` hook and persist per
  prototype. Particle positions live in typed arrays inside the canvas effect, never in
  React state.
- **Loop**: one `requestAnimationFrame` loop. Each frame paints the background at
  `1 − Trail` opacity, steps every particle and strokes all segments in one path.
- **Colors**: "theme" ink reads `--foreground` / `--background` from CSS, and the loop
  restarts when `resolvedTheme` changes. "tint" uses the Tint control.
- **Responsive**: the canvas is square and fills the centered `max-w-2xl` column. A
  `ResizeObserver` resizes the backing store (capped at 2× DPR) and respawns particles.
- **Reduced motion**: no animation. The canvas shows a still made of 160 simulated frames
  and redraws it when a control changes.
- **Shortcuts**: none.

## API

None.

## Key Dependencies

- `components/controls` (shared): schema, panel, persistence, Reset, Randomize.
- `next-themes` for `resolvedTheme`.

## Component Tree

```
Page (page.tsx)
└── FlowField
    └── ControlsLayout
        ├── FlowFieldCanvas
        ├── <aside> ControlPanel          (≥ lg)
        └── Drawer ▸ ControlPanel         (< lg)
```

## Error Handling

- No 2D context → the effect returns early and the canvas stays blank.
- Stored control values are sanitized against the schema (clamped, unknown keys dropped),
  so a corrupt or outdated entry falls back to defaults.

## File Structure

```
flow-field/
├── page.tsx               thin server entry
├── metadata.json
├── HOW_IT_WORKS.md
├── types.ts               Settings, Particles, Size
├── data.ts                control schema and constants
├── noise.ts               seeded PRNG + Perlin noise (pure)
├── simulation.ts          particle spawn/step (pure)
├── simulation.test.ts     vitest
├── canvas-colors.ts       reads design tokens for the canvas
├── use-reduced-motion.ts
├── flow-field.tsx         client root: controls + layout
└── flow-field-canvas.tsx  canvas and animation loop
```
