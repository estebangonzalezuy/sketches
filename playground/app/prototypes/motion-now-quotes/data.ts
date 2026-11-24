import { defineControls } from "@/components/controls";
import { PALETTE_NAMES } from "@/lib/tmsc/palettes";
import type { Quote } from "./types";

export const SLUG = "motion-now-quotes";

export const MODES = ["Live feed", "Static wall", "Cards"] as const;
export type QuoteMode = (typeof MODES)[number];

export const controls = defineControls({
  mode: { type: "select", label: "Mode", options: MODES, default: "Live feed", randomize: false },
  speed: { type: "number", label: "Typing speed (ms per character)", min: 10, max: 80, step: 1, default: 32 },
  max: { type: "number", label: "Max quotes on screen", min: 2, max: 16, step: 1, default: 8 },
  fontSize: { type: "number", label: "Font size", min: 0.6, max: 1.6, step: 0.05, default: 1 },
  highlight: { type: "boolean", label: "Highlight keyword", default: true },
  palette: { type: "select", label: "Palette", options: PALETTE_NAMES, default: "Magenta on green" },
  format: { type: "select", label: "Format", options: ["16:9 · 1920×1080", "4:5 · 1080×1350"], default: "16:9 · 1920×1080", randomize: false },
});

/** Seconds between one quote finishing and the next starting. */
export const PAUSE = 0.8;
/** Seconds between quotes appearing on the static wall. */
export const WALL_STAGGER = 0.12;

/** EXAMPLE DATA: invented, anonymous answers. Only role and years are ever shown. */
export const EXAMPLE_QUOTES: Quote[] = [
  { text: "I spend more time naming layers than animating them.", role: "Freelance", years: 8, keyword: "naming" },
  { text: "AI gives me ten starting points. None of them is the one, but I get there faster.", role: "Studio art director", years: 14, keyword: "faster" },
  { text: "Clients want 'more energy'. I have never once known what that means.", role: "Freelance", years: 5, keyword: "energy" },
  { text: "The graph editor is where I actually think.", role: "In-house motion designer", years: 11, keyword: "think" },
  { text: "My rate hasn't gone up in three years. My rent has.", role: "Freelance", years: 6, keyword: "rate" },
  { text: "Rendering overnight is still my favorite kind of hope.", role: "3D artist", years: 9, keyword: "hope" },
  { text: "I learned code because I got tired of keyframing the same bounce.", role: "Creative coder", years: 7, keyword: "code" },
  { text: "Junior roles are disappearing. Nobody tells you where the ladder went.", role: "Studio animator", years: 3, keyword: "ladder" },
  { text: "Easing is the whole job. Everything else is moving rectangles.", role: "Freelance", years: 16, keyword: "Easing" },
  { text: "I charge for the idea now, not the hours.", role: "Freelance", years: 12, keyword: "idea" },
  { text: "Every brand wants to feel 'human' and every brief is written by a committee.", role: "In-house", years: 4, keyword: "human" },
  { text: "What's next scares me a little and excites me a lot.", role: "Motion designer", years: 10, keyword: "excites" },
  { text: "My best work is a loader nobody will notice for more than a second.", role: "Product motion", years: 6, keyword: "loader" },
  { text: "Twelve principles, one deadline.", role: "2D animator", years: 19, keyword: "deadline" },
  { text: "The tools change every year. Timing never does.", role: "Studio director", years: 22, keyword: "Timing" },
  { text: "I use AI for the boring parts and I'm still deciding which parts are boring.", role: "Freelance", years: 2, keyword: "boring" },
];
