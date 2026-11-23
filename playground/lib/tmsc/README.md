# lib/tmsc

Shared brand layer for the six "tMSC: Motion, Now 2026" report tools
(`app/prototypes/motion-now-*`). React parts live in `components/tmsc/`.

| File | What |
| --- | --- |
| `palettes.ts` | Brand colors and palette pairs (bg / fg / accent), chapter → palette |
| `survey.ts` | EXAMPLE DATA: seeded fake survey of 300 respondents, JSON validation |
| `stats.ts` | quantile, median, percentile rank, groupBy, bins |
| `ease.ts` | power2/3, expo, back, spring, bounce; segment / approach helpers |
| `random.ts` | seeded PRNG, gaussian, smooth wobble noise |
| `fonts.ts` | Archivo Narrow (self-hosted in `public/shared/fonts/tmsc`) for canvas |
| `text.ts` | canvas word wrap and fit-to-lines |
| `formats.ts` | export sizes (1080×1350, 1920×1080, 1200×630) |
| `download.ts` | PNG rendering and downloads |
| `video.ts` | frame-exact MP4 (WebCodecs + mp4-muxer) and live MediaRecorder takes |
| `zip.ts` | stored-only zip writer for batch exports |

Rules for the pieces: flat backgrounds, no gradients/shadows/outlines, at most two brand
colors plus black or white, never #0000FF / #3D3DEB / #FF0000.
