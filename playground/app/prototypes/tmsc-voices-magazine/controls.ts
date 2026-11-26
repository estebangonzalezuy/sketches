import { defineControls, type ControlValues } from "@/components/controls";
import { BACK_COVER, COVER, SPREADS } from "./data";
import { coverOption, mediaOptions } from "./media";
import { EASE_NAMES } from "./easing";
import { DEFAULT_PAPER, PAPER_FINISHES, PAPER_WEIGHTS } from "./paper";
import { TEXTURES } from "./textures";
import { DEFAULT_TIMING } from "./timing";

/** The panel: how each spread is put together, the cover, Q&A pages, timing, textures, background. */

const DEFAULT_FRAME = { 1: 1, 2: 3, 3: 3, 4: 1 } as const;
/** Default Q&A images (indices into the post's images): two that aren't the cover. */
const EDITORIAL_IMAGES = { 1: [1, 2], 2: [0, 1], 3: [0, 1], 4: [4, 1] } as const;

const spread = (order: 1 | 2 | 3 | 4, name: string) =>
  ({
    [`${name}Image`]: { type: "select", label: `${cap(name)} image`, options: mediaOptions(order), default: coverOption(order) },
    [`${name}Frame`]: { type: "number", label: `${cap(name)} frame`, min: 1, max: 6, step: 1, default: DEFAULT_FRAME[order] },
    [`${name}Left`]: { type: "color", label: `${cap(name)} left page`, default: SPREADS[order].left.bg },
    [`${name}Right`]: { type: "color", label: `${cap(name)} right page`, default: SPREADS[order].right.bg },
    [`${name}TextImage1`]: { type: "select", label: `${cap(name)} Q&A image 1`, options: mediaOptions(order), default: mediaOptions(order)[EDITORIAL_IMAGES[order][0]] },
    [`${name}TextImage2`]: { type: "select", label: `${cap(name)} Q&A image 2`, options: mediaOptions(order), default: mediaOptions(order)[EDITORIAL_IMAGES[order][1]] },
  }) as const;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const controls = defineControls({
  ...spread(1, "victor"),
  ...spread(2, "thais"),
  ...spread(3, "doug"),
  ...spread(4, "justin"),
  imageFit: { type: "select", label: "Image", options: ["Fit", "Fill"], default: "Fit" },
  imageSize: { type: "number", label: "Image size %", min: 30, max: 100, step: 5, default: 100 },
  turnDuration: { type: "number", label: "Turn duration s", min: 0.3, max: 4, step: 0.05, default: DEFAULT_TIMING.turn, randomize: false },
  turnEase: { type: "select", label: "Turn easing", options: EASE_NAMES, default: DEFAULT_TIMING.ease },
  holdIntro: { type: "number", label: "Hold on spreads s", min: 0.2, max: 8, step: 0.1, default: DEFAULT_TIMING.holdIntro, randomize: false },
  holdText: { type: "number", label: "Hold on Q&A s", min: 0.2, max: 8, step: 0.1, default: DEFAULT_TIMING.holdText, randomize: false },
  flipStagger: { type: "number", label: "Flip-through gap s", min: 0.05, max: 1, step: 0.01, default: DEFAULT_TIMING.stagger, randomize: false },
  flipDuration: { type: "number", label: "Flip-through sheet s", min: 0.3, max: 3, step: 0.05, default: DEFAULT_TIMING.cascade, randomize: false },
  pageTexture: { type: "select", label: "Page texture", options: TEXTURES, default: "Newsprint" },
  pageTextureStrength: { type: "number", label: "Page texture %", min: 0, max: 200, step: 5, default: 100 },
  paperFinish: { type: "select", label: "Paper finish", options: PAPER_FINISHES, default: DEFAULT_PAPER.finish },
  paperRelief: { type: "number", label: "Paper relief %", min: 0, max: 200, step: 5, default: DEFAULT_PAPER.relief * 100 },
  paperWeight: { type: "select", label: "Paper weight", options: PAPER_WEIGHTS, default: DEFAULT_PAPER.weight },
  paperWaviness: { type: "number", label: "Paper waviness %", min: 0, max: 200, step: 5, default: DEFAULT_PAPER.waviness * 100 },
  editorial: { type: "boolean", label: "Q&A pages", default: true },
  textColumns: { type: "select", label: "Q&A columns", options: ["1", "2", "3"], default: "2" },
  textSize: { type: "select", label: "Q&A text", options: ["Small", "Medium", "Large"], default: "Medium" },
  textImageSize: { type: "number", label: "Q&A image size %", min: 30, max: 100, step: 5, default: 100 },
  textPage: { type: "color", label: "Q&A page color", default: "#FFFFFF" },
  coverLayout: { type: "select", label: "Cover layout", options: ["Human + Motion", "Orbit", "Plain", "Full image", "Image on color"], default: "Human + Motion" },
  coverImage: { type: "select", label: "Cover image", options: ["Uploaded", "Victor", "Thais", "Doug", "Justin"], default: "Uploaded" },
  coverBg: { type: "color", label: "Cover color", default: COVER.bg },
  coverImageSize: { type: "number", label: "Cover image size %", min: 30, max: 100, step: 5, default: 100 },
  coverInk: { type: "select", label: "Cover type", options: ["Black", "White"], default: "Black" },
  backColor: { type: "color", label: "Back cover color", default: BACK_COVER.bg },
  stageColor: { type: "color", label: "Background", default: "#EAEAEA" },
  stageTexture: { type: "select", label: "Background texture", options: ["None", ...TEXTURES], default: "Newsprint" },
  stageTextureStrength: { type: "number", label: "Background texture %", min: 0, max: 200, step: 5, default: 100 },
  stageGrid: { type: "boolean", label: "Grid", default: false },
  format: { type: "select", label: "Export", options: ["1:1", "4:5"], default: "1:1", randomize: false },
});

export type Values = ControlValues<typeof controls>;
