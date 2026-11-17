import { useCallback, useEffect, useRef, useState } from 'react';
import { loadFonts } from './fonts';
import { clone, DEFAULT_TYPE, FORMATS, uid, validate, type Composition, type FormatId, type Layer, type ShapeKind } from './model';
import { adaptTo, asterisk, block, bracket, fitHeadline, generateGrid, gridLayer, headline, lockup, masterKV, presetFor, scaleComposition } from './presets';
import { layerBounds, render } from './render/render';
import { DocInspector, LayerInspector, typeLabel, type ViewState } from './ui/Inspector';
import { Stage } from './ui/Stage';

const STORE = 'kv-editor:doc:v1';
const HISTORY_MAX = 120;

function loadStored(): Composition | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? validate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadFonts()
      .then(() => setReady(true))
      .catch((e: Error) => setError(e.message));
  }, []);
  if (error) return <div className="boot">No se pudieron cargar las fuentes: {error}</div>;
  if (!ready) return <div className="boot">Cargando fuentes…</div>;
  return <Editor />;
}

function Editor() {
  const [doc, setDocState] = useState<Composition>(() => loadStored() ?? masterKV());
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [view, setViewState] = useState<ViewState>({ snap: false, unit: 8, smart: true, ref: false, refOpacity: 0.5, refDiff: false });
  const [askFormat, setAskFormat] = useState<FormatId | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const past = useRef<Composition[]>([]);
  const future = useRef<Composition[]>([]);
  const lastKey = useRef<{ key: string; t: number } | null>(null);
  const docRef = useRef(doc);
  docRef.current = doc;
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [, force] = useState(0);

  // autosave
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORE, JSON.stringify(doc));
      } catch {
        /* storage full or blocked: the editor works without it */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [doc]);

  const pushHistory = useCallback((snap: Composition) => {
    past.current.push(snap);
    if (past.current.length > HISTORY_MAX) past.current.shift();
    future.current = [];
    force((n) => n + 1);
  }, []);

  /** Mutating update with history. Same `key` within 600 ms coalesces (sliders, typing). */
  const setDoc = useCallback(
    (fn: (d: Composition) => void, key?: string) => {
      const now = performance.now();
      const coalesce = key && lastKey.current && lastKey.current.key === key && now - lastKey.current.t < 600;
      if (!coalesce) pushHistory(docRef.current);
      lastKey.current = key ? { key, t: now } : null;
      const next = clone(docRef.current);
      fn(next);
      docRef.current = next;
      setDocState(next);
    },
    [pushHistory],
  );

  const replaceDoc = useCallback(
    (next: Composition) => {
      pushHistory(docRef.current);
      lastKey.current = null;
      docRef.current = next;
      setDocState(next);
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(docRef.current);
    docRef.current = prev;
    setDocState(prev);
    lastKey.current = null;
  }, []);
  const redo = useCallback(() => {
    const nx = future.current.pop();
    if (!nx) return;
    past.current.push(docRef.current);
    docRef.current = nx;
    setDocState(nx);
    lastKey.current = null;
  }, []);

  const patchLayer = (id: string) => (fn: (l: Layer) => void, key?: string) =>
    setDoc((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l) fn(l);
    }, key);

  const sel = doc.layers.find((l) => l.id === selected) ?? null;

  // ---------------------------------------------------------------- actions

  const addLayer = (l: Layer) => {
    setDoc((d) => d.layers.push(l));
    setSelected(l.id);
    setAddOpen(false);
  };
  const cx = doc.width / 2;
  const cy = doc.height / 2;
  const S = Math.min(doc.width, doc.height) / 1080;
  const add = {
    headline: () => {
      const h = headline('Survey open', undefined, { ...DEFAULT_TYPE, scaleX: masterScaleX(doc) });
      fitHeadline(h, { left: Math.round(doc.width * 0.08), top: cy - 110 * S, baseline: cy + 110 * S });
      addLayer(h);
    },
    glyph: (ch: string) => {
      const h = headline(ch, undefined, { scaleX: masterScaleX(doc), notches: 'all' });
      fitHeadline(h, { left: cx - 120 * S, top: cy - 160 * S, baseline: cy + 160 * S });
      h.name = `Carácter ${ch}`;
      addLayer(h);
    },
    text: () =>
      addLayer({ id: uid('t'), type: 'text', name: 'Texto', visible: true, locked: false, text: '23 preguntas · 5 minutos', x: Math.round(doc.width * 0.08), y: Math.round(cy), font: 'inter500', size: Math.round(36 * S), tracking: -0.01, leading: 1.15, align: 'left', fill: 'ink' }),
    block: () => addLayer(block(Math.round(cx - 200 * S), Math.round(cy - 150 * S), Math.round(400 * S), Math.round(300 * S), 'pink', 'Bloque')),
    bracket: () => addLayer(bracket(Math.round(cx), Math.round(cy - 250 * S), Math.round(400 * S), Math.round(420 * S), Math.round(90 * S), Math.round(110 * S), '')),
    grid: () => {
      const g = gridLayer(Math.round(doc.width * 0.05), Math.round(doc.height * 0.1), Math.round(doc.width * 0.9), Math.round(doc.height * 0.8), generateGrid(8, 6, 3, 0.5), '');
      g.gen = { cols: 8, rows: 6, seed: 3, irr: 0.5 };
      addLayer(g);
    },
    shape: (shape: ShapeKind) => {
      const s = asterisk(Math.round(cx), Math.round(cy), Math.round(140 * S), '');
      s.shape = shape;
      s.name = { asterisk: 'Asterisco', circle: 'Círculo', semicircle: 'Semicírculo', arrow: 'Flecha', plus: 'Cruz', ghost: 'Fantasma', badge: 'Marca M' }[shape];
      if (shape !== 'asterisk') s.thickness = shape === 'ghost' ? 0.2 : 0.34;
      if (shape === 'ghost' || shape === 'badge') s.fill = 'ink';
      addLayer(s);
    },
    lockup: () => addLayer({ ...lockup(Math.round(doc.width * 0.08), Math.round(doc.height * 0.85), Math.round(80 * S)), role: undefined }),
    image: () => imgRef.current?.click(),
  };

  const onImageFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      const src = String(r.result);
      const im = new Image();
      im.onload = () => {
        const h = Math.round(doc.height * 0.4);
        const w = Math.round((h * im.naturalWidth) / im.naturalHeight);
        addLayer({ id: uid('i'), type: 'image', name: f.name.replace(/\.[^.]+$/, ''), visible: true, locked: false, x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h, src, tint: null, pixel: 0 });
      };
      im.src = src;
    };
    r.readAsDataURL(f);
  };

  const duplicate = () => {
    if (!sel) return;
    const n = clone(sel);
    n.id = uid('d');
    n.role = undefined;
    n.name = `${sel.name} copia`;
    n.x += 20;
    n.y += 20;
    setDoc((d) => d.layers.splice(d.layers.findIndex((l) => l.id === sel.id) + 1, 0, n));
    setSelected(n.id);
  };
  const remove = () => {
    if (!sel) return;
    setDoc((d) => (d.layers = d.layers.filter((l) => l.id !== sel.id)));
    setSelected(null);
  };
  const move = (dir: 1 | -1) => {
    if (!sel) return;
    setDoc((d) => {
      const i = d.layers.findIndex((l) => l.id === sel.id);
      const j = Math.max(0, Math.min(d.layers.length - 1, i + dir));
      const [l] = d.layers.splice(i, 1);
      d.layers.splice(j, 0, l);
    });
  };
  const fitToBlock = () => {
    if (!sel || sel.type !== 'headline') return;
    const b = layerBounds(sel);
    const cxh = b.x + b.w / 2;
    const cyh = b.y + b.h / 2;
    const under = [...doc.layers]
      .slice(0, doc.layers.indexOf(sel))
      .reverse()
      .find((l) => l.type === 'block' && l.visible && cxh >= l.x && cxh <= l.x + l.w && cyh >= l.y && cyh <= l.y + l.h);
    if (!under || under.type !== 'block') return;
    const m = under.w * 0.06;
    patchLayer(sel.id)((l) => {
      if (l.type !== 'headline') return;
      const k = (under.w - m * 2) / b.w;
      l.size *= k;
      const nb = layerBounds(l);
      l.x += under.x + m - nb.x;
      l.y += cyh - (nb.y + nb.h / 2);
    });
  };

  const exportPNG = (scale: number) => {
    const cv = document.createElement('canvas');
    cv.width = doc.width * scale;
    cv.height = doc.height * scale;
    render(cv.getContext('2d')!, doc, { scale });
    cv.toBlob((b) => b && download(b, `${slug(doc.name)}${scale > 1 ? `@${scale}x` : ''}.png`), 'image/png');
  };
  const saveJSON = () => download(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }), `${slug(doc.name)}.json`);
  const openJSON = (f: File) =>
    f.text().then((t) => {
      try {
        replaceDoc(validate(JSON.parse(t)));
        setSelected(null);
      } catch (e) {
        alert((e as Error).message);
      }
    });

  const switchFormat = (f: FormatId, mode: 'adapt' | 'preset' | 'scale') => {
    const next = mode === 'adapt' ? adaptTo(doc, f) : mode === 'scale' ? scaleComposition(doc, f) : presetFor(f);
    replaceDoc(next);
    setSelected(null);
    setAskFormat(null);
  };

  // ---------------------------------------------------------------- keyboard

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable]')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicate();
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveJSON();
      } else if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportPNG(e.shiftKey ? 2 : 1);
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && sel) {
        e.preventDefault();
        remove();
      } else if (e.key === 'Escape') {
        setSelected(null);
        setAddOpen(false);
      } else if (e.key === 'Enter' && sel && (sel.type === 'headline' || sel.type === 'text' || sel.type === 'lockup')) {
        e.preventDefault();
        setEditing(sel.id);
      } else if (e.key === ']' && sel) move(1);
      else if (e.key === '[' && sel) move(-1);
      else if (e.key.startsWith('Arrow') && sel && !sel.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        patchLayer(sel.id)((l) => {
          l.x += dx;
          l.y += dy;
        }, `${sel.id}.nudge`);
      } else if (!mod && /^[1-5]$/.test(e.key)) {
        const f = (Object.keys(FORMATS) as FormatId[])[+e.key - 1];
        if (f !== doc.format) setAskFormat(f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------------------------------------------------------------- layout

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <b>KV Editor</b>
          <span>Motion, Now</span>
        </div>
        <nav className="formats">
          {(Object.keys(FORMATS) as FormatId[]).map((f, i) => (
            <button key={f} type="button" className={doc.format === f ? 'on' : ''} title={`${FORMATS[f].width}×${FORMATS[f].height} (${i + 1})`} onClick={() => f !== doc.format && setAskFormat(f)}>
              {FORMATS[f].label}
            </button>
          ))}
        </nav>
        <div className="actions">
          <button type="button" onClick={undo} disabled={!past.current.length} title="Deshacer (⌘Z)">↶</button>
          <button type="button" onClick={redo} disabled={!future.current.length} title="Rehacer (⇧⌘Z)">↷</button>
          <span className="sep" />
          <button type="button" onClick={() => { if (confirm('¿Volver al KV master? Se reemplaza la composición actual (⌘Z la recupera).')) { replaceDoc(masterKV()); setSelected(null); } }}>KV master</button>
          <button type="button" onClick={() => fileRef.current?.click()}>Abrir</button>
          <button type="button" onClick={saveJSON} title="⌘S">Guardar JSON</button>
          <button type="button" className="primary" onClick={() => exportPNG(1)} title="⌘E">PNG</button>
          <button type="button" className="primary" onClick={() => exportPNG(2)} title="⇧⌘E">PNG @2x</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && openJSON(e.target.files[0])} />
          <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) onImageFile(e.target.files[0]); e.target.value = ''; }} />
        </div>
      </header>

      <aside className="left">
        <div className="add">
          <button type="button" className="add-btn" onClick={() => setAddOpen((o) => !o)}>
            + Agregar
          </button>
          {addOpen && (
            <div className="add-menu">
              <div className="add-group">
                <span>Tipo</span>
                <button type="button" onClick={add.headline}>Titular KV</button>
                <button type="button" onClick={add.text}>Texto</button>
              </div>
              <div className="add-group">
                <span>Carácter</span>
                <div className="chars">
                  {['&', '?', '!', '*', '@', '%', '+', '23', '→'].map((c) => (
                    <button type="button" key={c} onClick={() => add.glyph(c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="add-group">
                <span>Estructura</span>
                <button type="button" onClick={add.block}>Bloque</button>
                <button type="button" onClick={add.bracket}>Escuadra</button>
                <button type="button" onClick={add.grid}>Grilla</button>
              </div>
              <div className="add-group">
                <span>Elementos</span>
                <button type="button" onClick={() => add.shape('asterisk')}>Asterisco</button>
                <button type="button" onClick={() => add.shape('circle')}>Círculo</button>
                <button type="button" onClick={() => add.shape('semicircle')}>Semicírculo</button>
                <button type="button" onClick={() => add.shape('arrow')}>Flecha</button>
                <button type="button" onClick={() => add.shape('plus')}>Cruz</button>
                <button type="button" onClick={() => add.shape('ghost')}>Fantasma</button>
                <button type="button" onClick={() => add.shape('badge')}>Marca M</button>
                <button type="button" onClick={add.lockup}>Lockup</button>
                <button type="button" onClick={add.image}>Imagen / personaje…</button>
              </div>
            </div>
          )}
        </div>
        <div className="layers">
          {[...doc.layers].reverse().map((l) => (
            <div
              key={l.id}
              className={`layer ${l.id === selected ? 'on' : ''} ${l.visible ? '' : 'hidden'}`}
              onClick={() => setSelected(l.id)}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', l.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (!id || id === l.id) return;
                setDoc((d) => {
                  const from = d.layers.findIndex((x) => x.id === id);
                  const [m] = d.layers.splice(from, 1);
                  const to = d.layers.findIndex((x) => x.id === l.id);
                  d.layers.splice(to + 1, 0, m);
                });
              }}
            >
              <button type="button" className="ico" title="Visible" onClick={(e) => { e.stopPropagation(); patchLayer(l.id)((x) => (x.visible = !x.visible)); }}>
                {l.visible ? '●' : '○'}
              </button>
              <span className="lname">{l.name}</span>
              <span className="ltype">{typeLabel(l)}</span>
              <button type="button" className="ico" title="Bloquear" onClick={(e) => { e.stopPropagation(); patchLayer(l.id)((x) => (x.locked = !x.locked)); }}>
                {l.locked ? '🔒' : '·'}
              </button>
            </div>
          ))}
        </div>
        <p className="keys">
          Doble click o Enter: editar texto · Flechas: mover (⇧ ×10) · ⌥ arrastrar: sin guías · ⇧ esquina: proporción · [ ]: orden · ⌘D duplicar · ⌘Z deshacer · 1–5 formatos · ⌘/Ctrl + rueda: zoom
        </p>
      </aside>

      <main className="center">
        <Stage
          doc={doc}
          selected={selected}
          view={view}
          onSelect={(id) => {
            setSelected(id);
            setAddOpen(false);
          }}
          onLive={(id, l) => {
            const next = { ...docRef.current, layers: docRef.current.layers.map((x) => (x.id === id ? l : x)) };
            docRef.current = next;
            setDocState(next);
          }}
          onCommit={() => {
            pushHistory(docRef.current);
            lastKey.current = null;
          }}
          editing={editing}
          setEditing={setEditing}
        />
      </main>

      <aside className="right">
        {sel ? (
          <LayerInspector
            key={sel.id}
            layer={sel}
            doc={doc}
            patch={patchLayer(sel.id)}
            actions={{ duplicate, remove, forward: () => move(1), backward: () => move(-1), fitToBlock }}
          />
        ) : (
          <DocInspector doc={doc} setDoc={setDoc} view={view} setView={(v) => setViewState((s) => ({ ...s, ...v }))} />
        )}
      </aside>

      {askFormat && (
        <div className="modal" onClick={() => setAskFormat(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Pasar a {FORMATS[askFormat].label}</h3>
            <p>{FORMATS[askFormat].width}×{FORMATS[askFormat].height}. ¿Cómo?</p>
            <button type="button" className="primary" onClick={() => switchFormat(askFormat, 'adapt')}>
              <b>Adaptar</b>
              <span>Layout diseñado para ese formato, con tu copy, colores y tratamiento. Lo extra se escala sin deformar.</span>
            </button>
            <button type="button" onClick={() => switchFormat(askFormat, 'preset')}>
              <b>Layout de partida</b>
              <span>El preset del formato tal cual, “Motion, Now”.</span>
            </button>
            <button type="button" onClick={() => switchFormat(askFormat, 'scale')}>
              <b>Escalar lo actual</b>
              <span>Misma composición, escalada uniforme y centrada.</span>
            </button>
            <button type="button" className="ghost" onClick={() => setAskFormat(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function masterScaleX(doc: Composition) {
  const h = doc.layers.find((l) => l.type === 'headline');
  return h && h.type === 'headline' ? h.scaleX : 1;
}

function download(b: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'kv';
