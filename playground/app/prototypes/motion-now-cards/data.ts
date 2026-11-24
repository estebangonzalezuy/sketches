import { defineControls } from "@/components/controls";
import type { Finding } from "./types";

export const SLUG = "motion-now-cards";

export const controls = defineControls({
  background: { type: "select", label: "Background", options: ["Chapter color", "Dark"], default: "Chapter color" },
  format: { type: "select", label: "Format", options: ["4:5 · 1080×1350", "16:9 · 1920×1080"], default: "4:5 · 1080×1350", randomize: false },
  tag: { type: "boolean", label: "“Example data” tag", default: true, randomize: false },
});

/** Seconds. The number counts up over COUNT_DUR while the chart draws in. */
export const COUNT_DUR = 1.2;
export const CHART_START = 0.15;
export const VIDEO_DURATION = 4;

/** EXAMPLE DATA: invented findings from the fake survey. */
export const EXAMPLE_FINDINGS: Finding[] = [
  { number: "62", unit: "%", sentence: "of motion designers use AI tools at least once a month.", chart: "dot grid", data: [62], chapter: "Human + Tool", n: 300 },
  { number: "355", unit: "$", sentence: "is the median day rate, worldwide.", chart: "bar", data: [32, 71, 88, 54, 31, 14, 10], chapter: "Money", n: 300 },
  { number: "2.1", unit: "×", sentence: "Rates more than double between year one and year twelve.", chart: "line", data: [180, 230, 290, 330, 360, 410, 470], chapter: "Money", n: 300 },
  { number: "36", unit: "%", sentence: "feel excited about what's coming. 30% feel worried.", chart: "donut", data: [36], chapter: "What’s Next", n: 300 },
  { number: "+18", unit: "%", sentence: "more freelancers than in 2024 say they set their own rates.", chart: "before/after", data: [41, 59], chapter: "What’s Next", n: 300 },
  { number: "1", unit: "in 9", sentence: "use AI every single day. Most of them write code.", chart: "bar", data: [29, 73, 90, 75, 33], chapter: "Human + Tool", n: 300 },
];

export const DEFAULT_FINDING: Finding = EXAMPLE_FINDINGS[0];
