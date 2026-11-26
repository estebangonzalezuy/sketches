# tMSC Voices

## What It Does

A small 3D zine of the last four tMSC interviews (cover, one spread per guest, back cover) that you page through with a paper curl: drag, click, arrow keys. A control panel picks which image from each post goes on each spread (and which frame of a GIF), so you choose how each feature is put together. The cover can be type only (white, black), a full-bleed image, or an image on a color you pick; the image is your upload or one of the spreads' images. Record renders a fixed 18 s sequence and downloads an MP4 (1:1 or 4:5).

## Editorial (Q&A) spreads

With **Q&A pages** on (default), every interview gets a second spread after its intro spread:
the conversation set in columns, as in a printed magazine.

- Text: `editorial.json`, verbatim questions (Esteban, bold) and answers (the guest), taken
  from the published posts. Esteban's intro, the "Transcript" label, pull-quote repeats, the
  site announcement in Justin's post, the embedded-post reference and the closing links were
  left out (picked by paragraph index from the post HTML).
- `editorial-flow.ts` (pure) flows the blocks through column frames on both pages. Whole
  paragraphs only; the last answer may stop at the end of a sentence to fill the space, and
  a question never ends the text without its answer. A "Read the full conversation at
  themotionsocialclub.substack.com" line follows if it fits.
- `layout-editorial.ts` lays both pages out at once: standfirst (the post subtitle), image 2
  at the foot of the left page, image 1 at the head of the right page, then columns.
- Panel: Q&A pages on/off, columns 1/2/3, text Small/Medium/Large (28/34/42 px at 1440),
  Q&A image size %, Q&A page color (readable ink picked automatically), and per guest
  Q&A image 1 and 2 (any image from their post, or None).
- The page order (`faces.ts`) and sheet count follow the toggle: 5 sheets without Q&A pages,
  9 with them. A new count starts the magazine again at the cover. Record follows the same
  order (`recordPlan`): about 18 s without Q&A spreads, about 29 s with them.

## Timing, easing and the timeline

- `easing.ts`: page-turn easings as cubic-bézier curves (Hand, Ease in-out, Ease out, Ease in,
  Snappy, Soft, Linear), with a bézier solver and an SVG path of each curve.
- `timing.ts`: the panel's **Turn duration**, **Turn easing**, **Hold on spreads**, **Hold on
  Q&A**, **Flip-through gap / sheet**, plus per-segment overrides (turn or hold duration, a
  turn's own easing) keyed by sheet (-1 = cover hold). Live clicks, keys and Home / End use
  the same duration and easing; a released drag still eases out from where it is.
- `timeline.ts` turns book + timing into the Record plan and its segments (cover hold, turn,
  hold, …, flip-through, end hold). Durations follow, so the export length changes with them.
- **Timeline** button opens `timeline-panel.tsx` above the row: Play previews the sequence in
  the scene exactly as it will export (the render loop shows `recordFrame(plan, t)` while
  `driver.preview` is set); the ruler scrubs; blocks are to scale, turns show their easing
  curve; drag a block's right edge to stretch it, or click it to type a duration and pick
  that turn's easing ("Use default" clears it). Edited blocks are outlined; **Reset edits**
  clears them all. Edits persist in this browser (`timing-store.ts`). Touching the magazine,
  a key, prev / next or Record leaves the preview on the spread it was showing.

## Cover

**Cover layout** (renamed from Cover so earlier stored choices don't hide the new default):
**Human + Motion** (default) is the supplied artwork, used as-is from
`public/prototype-assets/<slug>/cover/human-motion.png` (not redrawn), cropped to the drawing
and set on its own background colour (#FCFCFC), with only the four guests' names below
(`layout-cover-artwork.ts`). **Orbit** is the dotted cover described next.


**Type** (default) is the dotted orbit cover (`layout-cover-orbit.ts`): "the Motion Social
Club" as a pre-title, "Voices" in solid Archivo Narrow bold, over a light dotted "Voices" in
Bitter 800 (OFL, `public/prototype-assets/<slug>/fonts/`, built from dots by `dot-type.ts`), a thin spiral orbit with the letters of MOTION SOCIAL CLUB in rings, then
"tMSC", "Four conversations" and the four guests with their dates: the same copy as before.
**Plain** keeps the first typographic cover; **Full image** and **Image on color** as before.

**Cover dots** (`cover-dots.ts`, on by default, switch in the panel): outlined dots (rings, no fill) printed
under everything on every cover layout. Grid, Halftone (offset rows, largest at the head of
the page, gone before the names) or Scatter (seeded, so exports repeat), with size, spacing
and colour (palette swatches). On the Human + Motion cover the artwork is drawn with
multiply, so its near-white ground lets the dots through and its black stays black.

## Paper (3D material)

`paper.ts` (pure) + `magazine.tsx` / `curl-material.ts`:

- **Paper finish**: Matte (Lambert, no specular, the default), Uncoated, Satin, Gloss
  (MeshStandardMaterial at roughness 0.85 / 0.5 / 0.22). The curl patch works on both.
- **Paper relief** (0–200 %): the page texture's tile becomes a bump map, repeated at print
  scale, so grain, fibres or weave catch the light as a sheet turns. None with Smooth.
- **Paper weight**: Light / Regular / Heavy scales the bend of every turn (1.3 / 1 / 0.65)
  and the sheet spacing in the stacks (thin to thick). The edge still never passes π.
- **Paper waviness** (0–200 %): the idle lift of the outer edge plus a gentle cockle across
  each sheet, the same shape on every sheet so stacked pages never cross.

Page textures are uploaded once per bake; changing finish or relief only rebuilds materials.

## Palette

Every colour picker offers the tMSC palette as swatches (`TMSC_PALETTE` in `data.ts`:
Periwinkle, Verde, Marrón, Ink, Amarillo, Acid, Magenta, Blanco, Naranja, Lila, Verde osc.)
next to the free picker: the two page colours in each feature card, and the panel's cover,
back cover, Q&A page and background colours. The swatches come from the shared
`ColorSwatches` in `components/controls` (a colour control with `swatches` shows them, and
Randomize picks among them). Type stays readable by luminance whatever is picked.

## Camera

`camera.ts` (pure): a view is tilt (° from straight down), turn / yaw (° around the
magazine) and zoom (1 = the spread fits). The panel sets the base view, which the live
piece uses too, so you see the angle before recording. Record adds an **opening**
(None, Zoom in, Zoom out, Swing, Rise, Top-down: from a start view into the base view over
**Opening s**, ease in-out) and a **drift** for the rest (Slow push, Orbit, Float, at
**Drift %**); the drift starts from zero where the opening ends, so they join without a
jump. `viewAt(camera, t, duration)` is deterministic; the render loop, the timeline preview,
Record and the debug hook all frame through `fitCamera(camera, aspect, view)`. "Up" on screen
is the magazine's top edge turned by the yaw, so a straight-down view works. The timeline
shows a camera lane (the opening as a block you can stretch, the drift as a bar).

Export formats: 1:1 (1080×1080), 4:5 (1080×1350), 9:16 (1080×1920).

## Textures

`textures.ts` bakes one of seven paper finishes into every page and, separately, the table:
Newsprint, Recycled (heavier fibres, a few coloured ones), Laid (laid and chain lines),
Linen (woven), Riso grain, Smooth (none), or **Uploaded** (your image, tiled and brightness-
normalised so it adds texture without a cast). Each has a strength (0–200 %). Upload a paper
texture from the **Upload** menu; it is downscaled to 1024 px and kept in browser storage
(`uploads.ts`, shared with the cover upload). All built-in tiles are deterministic.

## Background

The table under the magazine uses the picked **Background** color (default `#EAEAEA`), a
**Background texture** (any of the paper finishes, Newsprint by default, with its own
strength) and an optional **Grid** with crop marks (off by default). Grid lines are a shade off the field: darker on
light colors, lighter on dark ones. The stage no longer follows the light / dark theme.

## Features (the magazine editor)

A magazine is an ordered list of **features**; a feature is one post from the Substack
(humanandmotion.substack.com) turned into four pages: the intro spread (subject, title,
subtitle, image | hero quote) and, with Q&A pages on, the article in columns.

- **Features** button opens the editor (left panel on desktop, bottom sheet on phones):
  drag cards by the grip to reorder (dnd-kit: pointer, touch and keyboard) or use the
  arrows; **Add feature** appends the newest free post not in the magazine; open a card to
  choose its **post** (every post, newest first), **name** (defaults to the guest parsed
  from "w/Name" or "ft. Name", else the byline), **quote** (verbatim candidates: the post's
  own pull quotes first, then sentences from the answers), **image** (thumbnails of the
  post's images; GIFs pick one of six frames), **Q&A images 1 / 2** (Auto, None, or any
  image), and the two **page colours**. Reset goes back to the four latest interviews.
  Choices persist in this browser (`magazine-store.ts`); blanks are filled from the post.
- Data: `app/api/tmsc-voices-magazine/` reads Substack's public API on the server
  (cached an hour): `posts` (the whole archive via its cursor), `post/<slug>` (parsed),
  `image?src&frame&w` (same-origin JPEG for WebGL; only Substack hosts; GIF frame via sharp;
  a white "Work by …" strip at the bottom is cropped when found).
- `substack-parse.ts` (pure): paragraphs with questions (bold or headings); an interview
  starts at its first question ending in "?", otherwise the post is an essay and goes in
  whole; pull quotes (paragraphs repeated inside longer ones) become quote candidates and
  leave the article; "Transcript" labels and link-only lines are dropped; a paragraph split
  after its first letter in the source is joined back; section dividers aren't images.
- `feature-data.ts` resolves a feature + post into what the layouts print. The four
  default interviews keep the hand-checked Q&A text (`editorial.json`) and hero quotes.
- Covers list the features' names (and dates) in magazine order; "Four conversations"
  counts them. Pages, Record, the timeline and the flip-through follow the number of
  features (cover + 2 sheets per feature + back).

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
- Page colors: a color control per page (`<guest>Left`, `<guest>Right`, `coverBg`, `backColor`;
  user data). `page-inks.ts` keeps a page's designed ink while it stays on its designed color,
  and otherwise sets black or white type by the background's luminance (crossover ≈ 0.18), so
  type stays readable whatever color is picked.
- Cover: `coverStyle` Type / Full image / Image on color, `coverImage` Uploaded or a guest's
  picked image, `coverBg` (the cover color, white by default, used by every cover style), `coverImageSize` (30–100 %, Image on color only), `coverInk` black or white. The
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
- Theme: the playground UI follows light / dark; the table and the pages use colors picked in
  the panel (data), so an export looks the same in either theme.
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
  uploads.ts             uploaded cover / texture images: downscale, browser storage, hooks
  textures.ts            paper finishes (built-in tiles and uploaded) baked into pages and table
  easing.ts, timing.ts   bézier easings, durations, per-segment overrides (pure)
  timing-store.ts        timeline edits in browser storage
  timeline-panel.tsx, timeline-track.tsx   the timeline UI
  setup.ts               panel values → page / stage setup
  use-magazine-keys.ts   keyboard
  faces.ts               page order and sheet count (with or without Q&A spreads)
  editorial.json         verbatim Q&A from the posts
  editorial-flow.ts      column text flow (pure)
  layout-editorial.ts    Q&A spread layout and drawing
  page-inks.ts           picked page colors → background + readable ink
  content.ts, data.ts, types.ts, driver.ts, debug-hook.ts, use-reduced-motion.ts
  magazine.test.ts
public/prototype-assets/tmsc-voices-magazine/media/    post images, 6 frames per GIF (credited on the page)
```
