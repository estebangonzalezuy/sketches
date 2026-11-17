/**
 * Composition model. Coordinates are format pixels (origin top-left, y down).
 * Colors are palette token names; the palette lives in the composition so a variant
 * can be re-coloured as a whole without touching layers.
 */

export type FormatId = '16x9' | '4x5' | '9x16' | '1x1' | 'banner';

export const FORMATS: Record<FormatId, { label: string; width: number; height: number }> = {
  '16x9': { label: '16:9', width: 1920, height: 1080 },
  '4x5': { label: '4:5', width: 1080, height: 1350 },
  '9x16': { label: '9:16', width: 1080, height: 1920 },
  '1x1': { label: '1:1', width: 1080, height: 1080 },
  banner: { label: 'Banner', width: 1920, height: 640 },
};

export type Token = 'paper' | 'pink' | 'lilac' | 'green' | 'brown' | 'ink' | 'white' | 'grid';
export const TOKENS: Token[] = ['paper', 'pink', 'lilac', 'green', 'brown', 'ink', 'white', 'grid'];
export type Palette = Record<Token, string>;

/** Sampled from the master KV (median over flat areas, 1920 px). The default. */
export const PALETTE_KV: Palette = {
  paper: '#F5E85A',
  pink: '#FB81BC',
  lilac: '#BFA1EF',
  green: '#064517',
  brown: '#3D2A14',
  ink: '#141313',
  white: '#FEFEFD',
  grid: '#7F6F14',
};

/** Official campaign tokens from the brief. */
export const PALETTE_OFFICIAL: Palette = {
  paper: '#F6E95B',
  pink: '#F06CCC',
  lilac: '#CC84FC',
  green: '#0C540C',
  brown: '#3C240C',
  ink: '#0C0C0C',
  white: '#FFFFFF',
  grid: '#8A7A28',
};

export const PALETTES: Record<string, Palette> = {
  'KV master (muestreado)': PALETTE_KV,
  'Tokens oficiales': PALETTE_OFFICIAL,
  'Noche': {
    paper: '#141313',
    pink: '#FB81BC',
    lilac: '#BFA1EF',
    green: '#F5E85A',
    brown: '#FB81BC',
    ink: '#F5E85A',
    white: '#FEFEFD',
    grid: '#5B5A4C',
  },
  'Verde': {
    paper: '#064517',
    pink: '#FB81BC',
    lilac: '#BFA1EF',
    green: '#F5E85A',
    brown: '#F5E85A',
    ink: '#141313',
    white: '#FEFEFD',
    grid: '#2E6B3A',
  },
  'Rosa': {
    paper: '#FB81BC',
    pink: '#F5E85A',
    lilac: '#BFA1EF',
    green: '#064517',
    brown: '#3D2A14',
    ink: '#141313',
    white: '#FEFEFD',
    grid: '#A3466F',
  },
};

export type FontId = 'barlow800' | 'barlow700' | 'saira' | 'saira800' | 'barlow' | 'sofia' | 'shoulders' | 'archivo' | 'narrow';
export type TextFontId = 'inter400' | 'inter500' | 'inter600' | 'narrow' | 'saira';

export type Treatment = 'kv' | 'pixel' | 'clean';
export type Align = 'left' | 'center' | 'right';

interface Base {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  /** Stable slot used to carry copy and colour across format layouts ("line1", "lockup"…). */
  role?: string;
}

export interface BlockLayer extends Base {
  type: 'block';
  x: number;
  y: number;
  w: number;
  h: number;
  fill: Token;
}

export interface BracketLayer extends Base {
  type: 'bracket';
  x: number;
  y: number;
  w: number;
  h: number;
  /** Thickness of the horizontal bar and of the vertical leg. */
  barH: number;
  legW: number;
  corner: 'ne' | 'nw' | 'se' | 'sw';
  fill: Token;
}

/** Construction grid: explicit hairline segments, stored normalized to the layer box. */
export interface GridLayer extends Base {
  type: 'grid';
  x: number;
  y: number;
  w: number;
  h: number;
  lines: [number, number, number, number][];
  weight: number;
  stroke: Token;
  /** generator settings, when the lines came from generateGrid */
  gen?: { cols: number; rows: number; seed: number; irr: number };
}

export interface TypeStyle {
  font: FontId;
  /** Font size in px (em). */
  size: number;
  scaleX: number;
  /** em */
  tracking: number;
  /** multiple of size */
  leading: number;
  align: Align;
  fill: Token;
  treatment: Treatment;
  /** KV treatment: 0–1, how hard curves are cut into flat facets. */
  chamfer: number;
  /** KV treatment: keyhole notches in tall counters. */
  notches: 'off' | 'tall' | 'all';
  notchW: number;
  notchD: number;
  /** KV treatment: small dot-like contours (i, j, ., :) drawn as true circles. */
  roundDots: boolean;
  /** KV treatment: printed-ink edge wobble 0–1 and corner softening 0–1. */
  rough: number;
  soft: number;
  /** Pixel treatment: cell size at 1080 px wide. */
  cell: number;
}

export interface HeadlineLayer extends Base, TypeStyle {
  type: 'headline';
  text: string;
  /** x: line origin (pen start); y: baseline of the first line. */
  x: number;
  y: number;
}

export interface TextLayer extends Base {
  type: 'text';
  text: string;
  x: number;
  /** top of the first line */
  y: number;
  font: TextFontId;
  size: number;
  tracking: number;
  leading: number;
  align: Align;
  fill: Token;
}

export type ShapeKind = 'asterisk' | 'circle' | 'arrow' | 'ghost' | 'badge' | 'plus' | 'semicircle';

export interface ShapeLayer extends Base {
  type: 'shape';
  shape: ShapeKind;
  /** center */
  x: number;
  y: number;
  /** half-height of the box (radius) */
  size: number;
  rotation: number;
  fill: Token;
  /** asterisk: number of arms; others ignore. */
  arms: number;
  /** asterisk: tip width vs. root width, arm thickness (fraction of size). */
  flare: number;
  thickness: number;
  rough: number;
  soft: number;
}

export interface LockupLayer extends Base {
  type: 'lockup';
  x: number;
  y: number;
  h: number;
  text: string;
  /** colours of the three modules */
  c1: Token;
  c2: Token;
  c3: Token;
  /** side modules: the "M" mark square and the icon square (undefined = shown, as in the master) */
  badge?: boolean;
  icon?: boolean;
}

export interface ImageLayer extends Base {
  type: 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  /** null = original colours; a token = one-colour silhouette from alpha */
  tint: Token | null;
  /** pixel cell at 1080 (0 = off) */
  pixel: number;
}

/** Video or GIF placed in a box. Drawn per frame; time comes from render(). */
export interface MediaLayer extends Base {
  type: 'media';
  mediaId: string;
  kind: 'video' | 'gif';
  x: number;
  y: number;
  w: number;
  h: number;
  fit: 'cover' | 'contain';
  /** focal point for cover crop, 0–1 */
  fx: number;
  fy: number;
  /** pixel cell at 1080 (0 = off) */
  pixel: number;
  /** seconds the source is shifted against the composition clock */
  offset: number;
}

export type Layer =
  | MediaLayer
  | BlockLayer
  | BracketLayer
  | GridLayer
  | HeadlineLayer
  | TextLayer
  | ShapeLayer
  | LockupLayer
  | ImageLayer;

export type LayerType = Layer['type'];

export interface Composition {
  version: 1;
  name: string;
  format: FormatId;
  width: number;
  height: number;
  palette: Palette;
  paper: { fill: Token; grain: number; mottle: number; seed: number };
  crosses: {
    visible: boolean;
    xs: number[];
    ys: number[];
    size: number;
    weight: number;
    mode: 'perimeter' | 'all';
    stroke: Token;
  };
  layers: Layer[];
  /** MP4 export length (seconds) and frame rate */
  video?: { duration: number; fps: number };
}

let counter = 0;
export const uid = (p = 'l') =>
  `${p}${Date.now().toString(36).slice(-4)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export const DEFAULT_TYPE: TypeStyle = {
  font: 'barlow700',
  size: 300,
  scaleX: 1,
  tracking: -0.02,
  leading: 0.9,
  align: 'left',
  fill: 'ink',
  treatment: 'kv',
  chamfer: 0.9,
  notches: 'tall',
  notchW: 0.5,
  notchD: 0.42,
  roundDots: true,
  rough: 0.45,
  soft: 0.35,
  cell: 6,
};

export function validate(raw: unknown): Composition {
  const c = raw as Composition;
  if (!c || typeof c !== 'object') throw new Error('No es un JSON de composición.');
  if (c.version !== 1) throw new Error(`Versión ${String(c.version)} no soportada (se espera 1).`);
  if (!FORMATS[c.format]) throw new Error(`Formato desconocido: ${String(c.format)}`);
  if (!Array.isArray(c.layers)) throw new Error('Faltan las capas.');
  const f = FORMATS[c.format];
  return { ...c, width: f.width, height: f.height, palette: { ...PALETTE_KV, ...c.palette } };
}
