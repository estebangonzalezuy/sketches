# tMSC Voices

## What It Does

A small 3D zine of the last four tMSC interviews (cover, one spread per guest, back cover) that you page through with a paper curl: drag, click, arrow keys. A control panel picks which image from each post goes on each spread (and which frame of a GIF), so you choose how each feature is put together. The cover can be type only (white, black), a full-bleed image, or an image on a color you pick; the image is your upload or one of the spreads' images. Record renders a fixed 18 s sequence and downloads an MP4 (1:1 or 4:5).

## Architecture

```
content.json ──► content.ts (typed, dates without year, verbatim quotes)
media.ts (every post image) ─► controls.ts (panel: image, frame, Fit/Fill, export) ─► PageSetup
                      │
data.ts (sheets, inks) ┼─► layout-*.ts ──► page-bake.ts ──► 10 canvases (one per printed side)
                      │                                         │ CanvasTexture, mipmaps, anisotropy
pointer / keys ──► FlipController (pure) ─┐                      ▼
                                          ├─► SheetPose[] ──► Magazine (R3F) ──► curl-material.ts
Record ──► timeline.ts recordFrame(t) ────┘    driver.apply()      uniforms        vertex shader:
              │                                                                    fold + spine turn
              └─► recorder.ts: render at 1080×N, VideoFrame → VideoEncoder → mp4-muxer → .mp4
```

- **Sheets.** Five double-sided sheets, saddle-stitched. Spread k = back of sheet k−1 (left) +
  front of sheet k (right), so each interview owns a clean spread.
- **Curl (pose.ts + curl-material.ts).** The sheet is held by its free edge; `p` is that edge's
  angle around the spine (0…π). The part near the spine lags by a bend angle that is 0 on both
  stacks and largest mid-turn; beyond a fold line (tilted toward the grabbed corner) the paper
  wraps around a cylinder, which keeps its length. Then the whole sheet rotates on the spine.
  Normals come from finite differences of the same function, and the shadow depth material uses
  the same function, so light and shadow follow the paper.
- **Stacking.** Every sheet has a resting height on each stack (cover on top on the right, last
  turned on top on the left) and the bend can never push the edge past π, so sheets don't cut
  through each other. Closed, the magazine slides sideways so the cover (or back cover) sits
  centered.

## Frontend

- `FlipController` state: per sheet `p`, `sign`, `bend`, `phi`, an animation and a hover amount;
  `turned` = the spread shown. Pure, unit tested.
- Drag right page → left turns forward, left page → right turns back. The grab point maps to the
  edge, so dragging it to its mirror position completes the turn. Release past half (or a fling)
  commits, otherwise the sheet settles back. A click turns the page. Hover near an outer edge
  lifts the corner (mouse only). The drag never moves the camera.
- Keys: ← →, Home (flip-through back to the cover), End.
- Buttons: previous / next, current spread, Record (shows % and cancels).
- Control panel (`components/controls`, persisted, Reset / Randomize): for each guest an
  image picker (every image of their post in post order, the cover marked, or None) and a
  frame slider (GIFs were sampled to 6 frames; stills have one), plus Image Fit / Fill, Image size % (30–100, shrinks the image box toward the bottom-left corner, credit follows) and the
  export format. A change re-bakes the pages; the old pages stay up until the new ones are
  ready, and the page you're on stays open. Images are cached after the first load.
- Cover: `coverStyle` Type / Full image / Image on color, `coverImage` Uploaded or a guest's
  picked image, `coverColor` (a color control: user data), `coverImageSize` (30–100 %, Image on color only), `coverInk` black or white. The
  **Cover** button (image icon) uploads a file: it is downscaled to ≤ 1600 px JPEG and kept
  in this browser (`playground:<slug>:cover-image` via `lib/storage`), never sent anywhere;
  uploading switches the cover to that image and flips back to the cover. Back cover: white,
  black type, the publication URL.
- Paper: `paper-texture.ts` bakes a light newsprint finish into every page (soft pulp
  mottling, grain, short fibers, a slight warm tint, pale specks that lift solid ink a hair).
  Deterministic, so exports repeat exactly.
- Media: `public/prototype-assets/<slug>/media/<id>-<frame>.jpg`, downloaded from the posts'
  `substack-post-media` originals. The section-divider images were left out, and the
  "Work by …" strip burned into the GIFs was cropped off. The page prints the credit from the
  post instead ("Work by …", or the post's caption, or "From the post").
- Responsive: the camera refits on resize; narrow frames crop closer at the sides, and tall
  phone frames sit the magazine in the upper half, clear of the controls sheet. Phones bake
  pages at 1008×1400 instead of 1440×2000. `touch-action: none` on the canvas so drags work.
- Theme: the table (field, grid, crop marks) reads `--background`, `--border`,
  `--muted-foreground` and follows light / dark. The printed pages use the tMSC palette (content).
- Reduced motion: turns land immediately, no idle paper movement, no hover lift.
- `?debug=1` exposes `window.__tmsc.frame(t, w, h)` (exact Record frame as PNG) for stills.

## Key Dependencies

`three`, `@react-three/fiber` (Canvas, frame loop), `mp4-muxer` + WebCodecs (export), Archivo
Narrow variable from `public/shared/fonts/mb/`.

## Component Tree

```
TmscMagazine (keys, bake, record state, useControls)
├── ControlsLayout (side panel ≥ lg, bottom sheet below)
├── MagazineScene (R3F Canvas, theme colors)
│   ├── Bridge (camera fit, hands three state to the driver)
│   ├── Stage (lights, grid floor, shadow catcher, crop marks)
│   ├── Magazine (5 sheet meshes + contact shadows, useFrame)
│   └── PointerInput (raycast to the table plane → FlipController)
└── MagazineControls (prev / spread / next, format, Record)
```

## Error Handling

- Upload too large for browser storage: a readable message, the previous cover stays.
- Font or stills fail: a missing still leaves its page typographic; a failed bake shows a message.
- No WebCodecs or no encoder for the size: Record shows the browser error. H.264 first, VP9 in
  MP4 only as a fallback. Cancel stops between frames and restores the live view.

## File Structure

```
tmsc-voices-magazine/
  page.tsx, metadata.json, HOW_IT_WORKS.md, README.md, ideas.md, content.json
  tmsc-magazine.tsx      client root
  magazine-scene.tsx     Canvas + bridge
  magazine.tsx           sheets, contact shadow, poses → uniforms
  stage.tsx              lights, floor, crop marks, fitCamera
  pointer-input.tsx      pointer → page coordinates
  magazine-controls.tsx  the small UI row
  curl-material.ts       shader patch (Lambert + depth)
  pose.ts                curl / stack / drag math (pure)
  flip-controller.ts     interactive state (pure)
  timeline.ts            Record sequence (pure, deterministic)
  recorder.ts            WebCodecs → MP4
  page-bake.ts, canvas-type.ts, layout-covers.ts, layout-interview.ts   page textures
  media.ts               every post image, labels, credits, frame lookup
  controls.ts            panel schema → PageSetup (spreads + cover) / export format
  cover-upload.ts        uploaded cover image: downscale, browser storage, hook
  paper-texture.ts       newsprint finish baked into the pages
  content.ts, data.ts, types.ts, driver.ts, stage-colors.ts, debug-hook.ts, use-reduced-motion.ts
  magazine.test.ts
public/prototype-assets/tmsc-voices-magazine/media/    post images, 6 frames per GIF (credited on the page)
```
