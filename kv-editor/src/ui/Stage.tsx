import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Composition, Layer } from '../model';
import type { Rect } from '../render/ink';
import { layerBounds, render, setImageLoadListener } from '../render/render';
import { TEXT_FONTS } from '../fonts';
import type { ViewState } from './Inspector';

const BASE = import.meta.env.BASE_URL;

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const PROPORTIONAL = new Set<Layer['type']>(['headline', 'text', 'shape', 'lockup']);

interface Drag {
  kind: 'move' | 'resize';
  handle?: Handle;
  start: { x: number; y: number };
  orig: Layer;
  bounds: Rect;
  moved: boolean;
}

export function Stage({
  doc,
  selected,
  view,
  onSelect,
  onLive,
  onCommit,
  editing,
  setEditing,
}: {
  doc: Composition;
  selected: string | null;
  view: ViewState;
  onSelect: (id: string | null) => void;
  /** live edit without a history entry */
  onLive: (id: string, l: Layer) => void;
  /** push the pre-gesture state to history */
  onCommit: (before: Layer) => void;
  editing: string | null;
  setEditing: (id: string | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [tick, setTick] = useState(0);
  const drag = useRef<Drag | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => setImageLoadListener(() => setTick((t) => t + 1)), []);

  const pad = 32;
  const fit = Math.min((box.w - pad * 2) / doc.width, (box.h - pad * 2) / doc.height);
  const k = Math.max(0.05, fit * zoom);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cw = Math.round(doc.width * k);
  const ch = Math.round(doc.height * k);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = Math.round(cw * dpr);
    cv.height = Math.round(ch * dpr);
    const ctx = cv.getContext('2d')!;
    const raf = requestAnimationFrame(() => {
      render(ctx, doc, { scale: (cw * dpr) / doc.width, hide: editing ? new Set([editing]) : undefined });
    });
    return () => cancelAnimationFrame(raf);
  }, [doc, cw, ch, dpr, editing, tick]);

  const toComp = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * doc.width, y: ((e.clientY - r.top) / r.height) * doc.height };
  };

  const hit = (p: { x: number; y: number }): Layer | null => {
    const order = [...doc.layers].reverse().filter((l) => l.visible);
    const inside = (l: Layer) => {
      const b = layerBounds(l);
      return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    };
    if (l_sel && inside(l_sel) && l_sel.type !== 'grid') return l_sel;
    return order.find((l) => l.type !== 'grid' && inside(l)) ?? order.find((l) => l.type === 'grid' && inside(l)) ?? null;
  };

  const l_sel = doc.layers.find((l) => l.id === selected) ?? null;
  const selBounds = l_sel ? layerBounds(l_sel) : null;

  // ------------------------------------------------------------ snapping

  const snapMove = (b: Rect, self: string, disableSmart: boolean) => {
    let dx = 0;
    let dy = 0;
    const gx: number[] = [];
    const gy: number[] = [];
    let sx = false;
    let sy = false;
    if (view.smart && !disableSmart) {
      const th = 6 / k;
      const tx = [0, doc.width / 2, doc.width];
      const ty = [0, doc.height / 2, doc.height];
      for (const l of doc.layers) {
        if (l.id === self || !l.visible) continue;
        const o = layerBounds(l);
        tx.push(o.x, o.x + o.w / 2, o.x + o.w);
        ty.push(o.y, o.y + o.h / 2, o.y + o.h);
      }
      let best = th;
      for (const c of [b.x, b.x + b.w / 2, b.x + b.w])
        for (const t of tx)
          if (Math.abs(t - c) < best) {
            best = Math.abs(t - c);
            dx = t - c;
            gx.length = 0;
            gx.push(t);
            sx = true;
          }
      best = th;
      for (const c of [b.y, b.y + b.h / 2, b.y + b.h])
        for (const t of ty)
          if (Math.abs(t - c) < best) {
            best = Math.abs(t - c);
            dy = t - c;
            gy.length = 0;
            gy.push(t);
            sy = true;
          }
    }
    if (view.snap && view.unit > 1) {
      if (!sx) dx = Math.round(b.x / view.unit) * view.unit - b.x;
      if (!sy) dy = Math.round(b.y / view.unit) * view.unit - b.y;
    }
    return { dx, dy, gx, gy };
  };

  const snapVal = (v: number) => (view.snap && view.unit > 1 ? Math.round(v / view.unit) * view.unit : Math.round(v));

  // ------------------------------------------------------------ pointer

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    const p = toComp(e);
    const handle = (e.target as HTMLElement).dataset.handle as Handle | undefined;
    if (handle && l_sel && selBounds) {
      drag.current = { kind: 'resize', handle, start: p, orig: structuredClone(l_sel), bounds: selBounds, moved: false };
    } else {
      const h = hit(p);
      onSelect(h?.id ?? null);
      if (h && !h.locked) drag.current = { kind: 'move', start: p, orig: structuredClone(h), bounds: layerBounds(h), moved: false };
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toComp(e);
    let ddx = p.x - d.start.x;
    let ddy = p.y - d.start.y;
    if (!d.moved && Math.hypot(ddx, ddy) * k < 2) return;
    if (!d.moved) {
      d.moved = true;
      onCommit(d.orig);
    }
    const l = structuredClone(d.orig);
    if (d.kind === 'move') {
      if (e.shiftKey) {
        if (Math.abs(ddx) > Math.abs(ddy)) ddy = 0;
        else ddx = 0;
      }
      const nb = { ...d.bounds, x: d.bounds.x + ddx, y: d.bounds.y + ddy };
      const s = snapMove(nb, l.id, e.altKey);
      l.x = d.orig.x + ddx + s.dx;
      l.y = d.orig.y + ddy + s.dy;
      setGuides({ x: s.gx, y: s.gy });
    } else {
      resize(l, d, ddx, ddy, e.shiftKey);
    }
    onLive(l.id, l);
  };

  const resize = (l: Layer, d: Drag, ddx: number, ddy: number, keepRatio: boolean) => {
    const h = d.handle!;
    const b = d.bounds;
    let x0 = b.x;
    let y0 = b.y;
    let x1 = b.x + b.w;
    let y1 = b.y + b.h;
    if (h.includes('w')) x0 = snapVal(x0 + ddx);
    if (h.includes('e')) x1 = snapVal(x1 + ddx);
    if (h.includes('n')) y0 = snapVal(y0 + ddy);
    if (h.includes('s')) y1 = snapVal(y1 + ddy);
    if (PROPORTIONAL.has(l.type) || keepRatio) {
      // uniform scale about the opposite corner
      const fx = (x1 - x0) / b.w;
      const fy = (y1 - y0) / b.h;
      const f = Math.max(0.05, h.length === 2 ? (Math.abs(fx - 1) > Math.abs(fy - 1) ? fx : fy) : h === 'e' || h === 'w' ? fx : fy);
      const ax = h.includes('w') ? b.x + b.w : h.includes('e') ? b.x : b.x + b.w / 2;
      const ay = h.includes('n') ? b.y + b.h : h.includes('s') ? b.y : b.y + b.h / 2;
      const o = d.orig;
      l.x = ax + (o.x - ax) * f;
      l.y = ay + (o.y - ay) * f;
      switch (l.type) {
        case 'headline':
        case 'text':
          l.size = Math.max(4, (o as typeof l).size * f);
          break;
        case 'shape':
          l.size = Math.max(2, (o as typeof l).size * f);
          break;
        case 'lockup':
          l.h = Math.max(8, (o as typeof l).h * f);
          break;
        default:
          if ('w' in l && 'w' in o) {
            l.w = Math.max(2, o.w * f);
            l.h = Math.max(2, o.h * f);
          }
      }
      return;
    }
    if ('w' in l) {
      if (x1 - x0 < 2) x1 = x0 + 2;
      if (y1 - y0 < 2) y1 = y0 + 2;
      l.x = x0;
      l.y = y0;
      l.w = x1 - x0;
      l.h = y1 - y0;
    }
  };

  const onPointerUp = () => {
    drag.current = null;
    setGuides({ x: [], y: [] });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const h = hit(toComp(e));
    if (h && (h.type === 'headline' || h.type === 'text' || h.type === 'lockup')) {
      onSelect(h.id);
      setEditing(h.id);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    setZoom((z) => Math.min(6, Math.max(0.25, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))));
  };

  const handles: Handle[] =
    l_sel && PROPORTIONAL.has(l_sel.type) ? ['nw', 'ne', 'se', 'sw'] : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  const editingLayer = doc.layers.find((l) => l.id === editing) ?? null;

  return (
    <div className="stage" ref={wrapRef} onWheel={onWheel}>
      <div className="artboard" style={{ width: cw, height: ch }}>
        <canvas ref={canvasRef} style={{ width: cw, height: ch }} />
        {view.ref && doc.format === '16x9' && (
          <img
            className="ref"
            src={`${BASE}refs/kv-master.jpg`}
            alt=""
            style={{ opacity: view.refOpacity, mixBlendMode: view.refDiff ? 'difference' : 'normal' }}
          />
        )}
        <div
          className="overlay"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
        >
          {selBounds && !editing && (
            <div
              className={`sel ${l_sel?.locked ? 'locked' : ''}`}
              style={{ left: selBounds.x * k, top: selBounds.y * k, width: selBounds.w * k, height: selBounds.h * k }}
            >
              {!l_sel?.locked && handles.map((h) => <span key={h} className={`hd hd-${h}`} data-handle={h} />)}
            </div>
          )}
          {guides.x.map((x, i) => (
            <div key={`gx${i}`} className="guide gv" style={{ left: x * k }} />
          ))}
          {guides.y.map((y, i) => (
            <div key={`gy${i}`} className="guide gh" style={{ top: y * k }} />
          ))}
        </div>
        {editingLayer && <InlineEditor layer={editingLayer} k={k} onDone={(text) => {
          if (text !== null) {
            onCommit(structuredClone(editingLayer));
            const n = structuredClone(editingLayer);
            (n as { text: string }).text = text;
            if (n.type === 'headline') n.name = text.replace(/\n/g, ' ') || n.name;
            onLive(n.id, n);
          }
          setEditing(null);
        }} />}
      </div>
      <div className="zoom">
        <button type="button" onClick={() => setZoom((z) => Math.max(0.25, z / 1.25))}>−</button>
        <button type="button" onClick={() => setZoom(1)}>{Math.round(k * 100)}%</button>
        <button type="button" onClick={() => setZoom((z) => Math.min(6, z * 1.25))}>+</button>
      </div>
    </div>
  );
}

function InlineEditor({ layer, k, onDone }: { layer: Layer; k: number; onDone: (t: string | null) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const b = layerBounds(layer);
  const text = (layer as { text: string }).text;
  const [v, setV] = useState(text);
  const done = useRef(false);
  const finish = (t: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(t);
  };
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  let style: React.CSSProperties = {};
  if (layer.type === 'headline') {
    style = { fontFamily: '"KV Saira"', fontWeight: 900, fontSize: layer.size * k, lineHeight: layer.leading, letterSpacing: `${layer.tracking}em` };
  } else if (layer.type === 'text') {
    const f = TEXT_FONTS[layer.font];
    style = { fontFamily: `"${f.family}"`, fontWeight: f.weight, fontSize: layer.size * k, lineHeight: layer.leading };
  } else {
    style = { fontFamily: '"KV Inter"', fontWeight: 500, fontSize: Math.max(12, layer.type === 'lockup' ? layer.h * 0.75 * k : 16) };
  }
  return (
    <textarea
      ref={ref}
      className="inline-edit"
      value={v}
      style={{ left: b.x * k - 6, top: b.y * k - 6, minWidth: Math.max(160, b.w * k + 12), minHeight: b.h * k + 12, ...style }}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => finish(v)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') finish(null);
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          finish(v);
        }
      }}
    />
  );
}
