import { capHeight, getFont } from '../fonts';
import type { TypeStyle } from '../model';
import { RasterCache, type Rect } from './ink';
import { area, bboxOf, flatPieces, octilinear, roundDot, toPieces } from './outline';

export type Pt = [number, number];

export interface TypeGeometry {
  /** closed contours, comp px relative to the layer anchor (x, baseline) */
  contours: Pt[][];
  /** keyhole cuts, relative to the anchor */
  notches: Rect[];
  /** ink bounds relative to the anchor */
  bbox: Rect;
  lineCount: number;
  capPx: number;
}

type GeoKey = Pick<
  TypeStyle,
  'font' | 'size' | 'scaleX' | 'tracking' | 'leading' | 'align' | 'chamfer' | 'notches' | 'notchW' | 'notchD' | 'treatment' | 'roundDots'
> & { text: string };

const geoCache = new RasterCache<TypeGeometry>(120);


export function typeGeometry(l: GeoKey): TypeGeometry {
  const key = JSON.stringify([l.text, l.font, l.size, l.scaleX, l.tracking, l.leading, l.align, l.chamfer, l.notches, l.notchW, l.notchD, l.treatment, l.roundDots]);
  return geoCache.get(key, () => buildGeometry(l));
}

function buildGeometry(l: GeoKey): TypeGeometry {
  const font = getFont(l.font);
  const size = l.size;
  const em = size / font.unitsPerEm;
  const steps = Math.max(6, Math.min(24, Math.round(size / 30)));
  const lines = l.text.split('\n');
  const contours: Pt[][] = [];
  const notches: Rect[] = [];
  lines.forEach((line, li) => {
    const base = li * l.leading * size;
    // measure
    const glyphs = [...line].map((ch) => font.charToGlyph(ch));
    const pens: number[] = [];
    let pen = 0;
    glyphs.forEach((g, i) => {
      if (i > 0) pen += font.getKerningValue(glyphs[i - 1], g) * em * l.scaleX;
      pens.push(pen);
      pen += (g.advanceWidth ?? 0) * em * l.scaleX + l.tracking * size;
    });
    const width = pen - (glyphs.length ? l.tracking * size : 0);
    const off = l.align === 'center' ? -width / 2 : l.align === 'right' ? -width : 0;
    glyphs.forEach((g, i) => {
      const p = g.getPath(0, 0, size);
      const ox = off + pens[i];
      const pieces = toPieces(p.commands, steps, (x, y) => [ox + x * l.scaleX, base + y]);
      if (!pieces.length) return;
      let cts = pieces.map((pc) => (l.treatment === 'kv' ? octilinear(pc, l.chamfer, size) : flatPieces(pc))).filter((c) => c.length >= 3);
      if (!cts.length) return;
      if (l.treatment === 'kv' && l.roundDots && cts.length > 1) cts = cts.map((ct) => roundDot(ct, cts, size));
      contours.push(...cts);
      if (l.treatment !== 'kv' || l.notches === 'off') return;
      const areas = cts.map(area);
      let outerIdx = 0;
      areas.forEach((a, i) => {
        if (Math.abs(a) > Math.abs(areas[outerIdx])) outerIdx = i;
      });
      const outerSign = Math.sign(areas[outerIdx]);
      const gb = bboxOf(cts);
      cts.forEach((ct, i) => {
        if (Math.sign(areas[i]) === outerSign) return;
        const hb = bboxOf([ct]);
        if (hb.w < 2 || hb.h < 2) return;
        if (l.notches === 'tall' && hb.h < hb.w * 1.25) return;
        const nw = hb.w * l.notchW;
        const above = hb.y - gb.y;
        const below = gb.y + gb.h - (hb.y + hb.h);
        const dTop = Math.min(hb.w * l.notchD, above * 0.55);
        const dBot = Math.min(hb.w * l.notchD, below * 0.55);
        const cx = hb.x + hb.w / 2;
        const inset = Math.min(hb.h * 0.2, hb.w * 0.5);
        if (dTop > 1) notches.push({ x: cx - nw / 2, y: hb.y - dTop, w: nw, h: dTop + inset });
        if (dBot > 1) notches.push({ x: cx - nw / 2, y: hb.y + hb.h - inset, w: nw, h: dBot + inset });
      });
    });
  });
  const font0 = getFont(l.font);
  return { contours, notches, bbox: bboxOf(contours), lineCount: lines.length, capPx: capHeight(font0) * size };
}

export function tracePath(ctx: CanvasRenderingContext2D | Path2D, cts: Pt[][], dx = 0, dy = 0) {
  for (const ct of cts) {
    ctx.moveTo(ct[0][0] + dx, ct[0][1] + dy);
    for (let i = 1; i < ct.length; i++) ctx.lineTo(ct[i][0] + dx, ct[i][1] + dy);
    ctx.closePath();
  }
}