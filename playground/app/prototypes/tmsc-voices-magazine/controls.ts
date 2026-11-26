import { defineControls, type ControlValues } from "@/components/controls";
import { BACK_COVER, COVER } from "./data";
import { DEFAULT_CAMERA, DRIFTS, INTROS } from "./camera";
import { EASE_NAMES } from "./easing";
import { DEFAULT_PAPER, PAPER_FINISHES, PAPER_WEIGHTS } from "./paper";
import { TEXTURES } from "./textures";
import { DEFAULT_TIMING } from "./timing";

/**
 * The panel: settings for the whole magazine (images, Q&A pages, cover, timing, textures,
 * paper, background, export). What goes in each feature is set in the Features editor.
 */

/** The cover can show an upload or the intro image of one of the first features. */
export const COVER_SOURCES = ["Uploaded", ...Array.from({ length: 8 }, (_, i) => `Feature ${i + 1}`)];

export const controls = defineControls({
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
  coverImage: { type: "select", label: "Cover image", options: COVER_SOURCES, default: "Uploaded" },
  coverBg: { type: "color", label: "Cover color", default: COVER.bg },
  coverImageSize: { type: "number", label: "Cover image size %", min: 30, max: 100, step: 5, default: 100 },
  coverInk: { type: "select", label: "Cover type", options: ["Black", "White"], default: "Black" },
  backColor: { type: "color", label: "Back cover color", default: BACK_COVER.bg },
  stageColor: { type: "color", label: "Background", default: "#EAEAEA" },
  stageTexture: { type: "select", label: "Background texture", options: ["None", ...TEXTURES], default: "Newsprint" },
  stageTextureStrength: { type: "number", label: "Background texture %", min: 0, max: 200, step: 5, default: 100 },
  stageGrid: { type: "boolean", label: "Grid", default: false },
  cameraTilt: { type: "number", label: "Camera tilt °", min: 0, max: 70, step: 1, default: DEFAULT_CAMERA.tilt },
  cameraYaw: { type: "number", label: "Camera turn °", min: -60, max: 60, step: 1, default: DEFAULT_CAMERA.yaw },
  cameraZoom: { type: "number", label: "Camera zoom %", min: 50, max: 250, step: 5, default: DEFAULT_CAMERA.zoom * 100 },
  cameraIntro: { type: "select", label: "Record opening", options: INTROS, default: DEFAULT_CAMERA.intro },
  cameraIntroDuration: { type: "number", label: "Opening s", min: 0.3, max: 10, step: 0.1, default: DEFAULT_CAMERA.introDur },
  cameraDrift: { type: "select", label: "Record drift", options: DRIFTS, default: DEFAULT_CAMERA.drift },
  cameraDriftAmount: { type: "number", label: "Drift %", min: 0, max: 200, step: 5, default: DEFAULT_CAMERA.driftAmount * 100 },
  format: { type: "select", label: "Export", options: ["1:1", "4:5", "9:16"], default: "1:1", randomize: false },
});

export type Values = ControlValues<typeof controls>;
