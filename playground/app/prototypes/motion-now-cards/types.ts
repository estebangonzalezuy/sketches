import type { ChapterName } from "@/lib/tmsc/palettes";

export const CHART_TYPES = ["bar", "dot grid", "line", "donut", "before/after"] as const;
export type ChartType = (typeof CHART_TYPES)[number];

/** One report finding. `number` stays a string so "3.4" keeps its decimal. */
export type Finding = {
  number: string;
  unit: string;
  sentence: string;
  chart: ChartType;
  data: number[];
  chapter: ChapterName;
  n: number;
};

export type CardColors = { bg: string; fg: string; accent: string };
export type Box = { x: number; y: number; w: number; h: number };
