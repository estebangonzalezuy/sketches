/** Poster model. Coordinates are poster pixels (origin top-left). Colors are swatch names. */

export type Swatch = "paper" | "ink" | "blue" | "pink" | "lilac" | "mint" | "green" | "orange" | "yellow" | "brown" | "cream";
export type Palette = Record<Swatch, string>;

export type Template = "stack" | "cascade" | "overlap" | "vertical" | "line";
export type Paint = "squares" | "fills";
export type FormatId = "3x4" | "4x5" | "9x16" | "1x1";

interface Base {
  id: string;
}

export interface Block extends Base {
  kind: "block";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: Swatch;
}

/** Nested rectangle frames, outer to inner. */
export interface Bands extends Base {
  kind: "bands";
  x: number;
  y: number;
  w: number;
  h: number;
  fills: Swatch[];
  band: number;
}

export interface Flower extends Base {
  kind: "flower";
  cx: number;
  cy: number;
  r: number;
  rot: number;
  petals: number;
  style: "petal" | "scallop";
  fills: Swatch[];
  disc: Swatch;
  dots: Swatch;
  ticks: boolean;
}

/** Rings of overlapping discs that twist toward the centre. */
export interface Spiral extends Base {
  kind: "spiral";
  cx: number;
  cy: number;
  r: number;
  rot: number;
  rings: number;
  perRing: number;
  fills: Swatch[];
}

export interface Headline extends Base {
  kind: "headline";
  x: number;
  y: number;
  /** font size, px */
  size: number;
  text: string;
  vertical: boolean;
  box: boolean;
  /** outlined letters, no fill */
  outline?: boolean;
  /** letter colour (default ink) */
  fill?: Swatch;
}

export interface Lockup extends Base {
  kind: "lockup";
  x: number;
  y: number;
  size: number;
  text: string;
  box: boolean;
  /** outlined letters, no fill */
  outline?: boolean;
  /** text colour (default ink) */
  fill?: Swatch;
}

export interface Mark extends Base {
  kind: "mark";
  cx: number;
  cy: number;
  size: number;
  fill: Swatch;
  box: boolean;
  /** arm ends: 0 = sharp, 1 = fully round */
  round: number;
}

export type Element = Block | Bands | Flower | Spiral | Headline | Lockup | Mark;
export type Kind = Element["kind"];

export interface Poster {
  version: 1;
  format: FormatId;
  width: number;
  height: number;
  /** outline-only drawing (the line-art reference) */
  line: boolean;
  /** "squares": motifs are outlines and the colour is painted squares behind them; "fills": motifs are coloured */
  paint: Paint;
  /** construction grid, as fractions of the inner frame */
  grid: { xs: number[]; ys: number[] };
  elements: Element[];
}

export type AnimStyle = "build" | "loop" | "build + loop" | "in + out";

/** Per-element animation state at one instant. */
export interface ElState {
  /** build progress 0 → 1 (1 = at rest) */
  p: number;
  /** continuous spin, radians */
  spin: number;
}
