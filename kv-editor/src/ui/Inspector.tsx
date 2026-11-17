import { HEADLINE_FONTS, TEXT_FONTS } from '../fonts';
import { FORMATS, PALETTES, TOKENS, type Composition, type FontId, type Layer, type ShapeKind, type TextFontId, type Token } from '../model';
import { generateGrid } from '../presets';
import { Btn, Num, Row, Section, Seg, Select, Swatches, TextBox, Toggle } from './controls';

type Patch = (fn: (l: Layer) => void, key?: string) => void;

const fontOpts = (Object.keys(HEADLINE_FONTS) as FontId[]).map((k) => [k, HEADLINE_FONTS[k].label] as [FontId, string]);
const textFontOpts = (Object.keys(TEXT_FONTS) as TextFontId[]).map((k) => [k, TEXT_FONTS[k].label] as [TextFontId, string]);
const shapeOpts: [ShapeKind, string][] = [
  ['asterisk', 'Asterisco'],
  ['circle', 'Círculo'],
  ['semicircle', 'Semicírculo'],
  ['arrow', 'Flecha'],
  ['plus', 'Cruz'],
  ['ghost', 'Fantasma'],
  ['badge', 'Marca M'],
];

export function LayerInspector({
  layer,
  doc,
  patch,
  actions,
}: {
  layer: Layer;
  doc: Composition;
  patch: Patch;
  actions: { duplicate: () => void; remove: () => void; forward: () => void; backward: () => void; fitToBlock: () => void };
}) {
  const P = <K extends string>(k: K) => (v: unknown) => patch((l) => ((l as unknown as Record<string, unknown>)[k] = v), `${layer.id}.${k}`);
  const pal = doc.palette;
  return (
    <>
      <Section
        title={typeLabel(layer)}
        right={
          <span className="sec-actions">
            <Btn title="Traer adelante (])" onClick={actions.forward}>↑</Btn>
            <Btn title="Mandar atrás ([)" onClick={actions.backward}>↓</Btn>
            <Btn title="Duplicar (⌘D)" onClick={actions.duplicate}>⧉</Btn>
            <Btn title="Borrar (⌫)" onClick={actions.remove}>✕</Btn>
          </span>
        }
      >
        <Row label="Nombre">
          <input type="text" value={layer.name} onChange={(e) => P('name')(e.target.value)} />
        </Row>
        {'x' in layer && <Num label="X" value={round(layer.x)} min={-500} max={doc.width + 500} onChange={P('x')} slider={false} />}
        {'y' in layer && <Num label={layer.type === 'headline' ? 'Y (base)' : 'Y'} value={round(layer.y)} min={-500} max={doc.height + 500} onChange={P('y')} slider={false} />}
        {'w' in layer && <Num label="Ancho" value={round(layer.w)} min={1} max={doc.width * 1.5} onChange={P('w')} slider={false} />}
        {'h' in layer && layer.type !== 'lockup' && <Num label="Alto" value={round(layer.h)} min={1} max={doc.height * 1.5} onChange={P('h')} slider={false} />}
      </Section>

      {layer.type === 'headline' && (
        <>
          <Section title="Texto">
            <TextBox label="Copy" value={layer.text} onChange={(v) => patch((l) => ((l as typeof layer).text = v), `${layer.id}.text`)} rows={3} />
            <Select label="Fuente" value={layer.font} options={fontOpts} onChange={P('font')} />
            <Num label="Cuerpo" value={layer.size} min={20} max={1600} onChange={P('size')} />
            <Num label="Ancho X" value={layer.scaleX} min={0.4} max={1.8} step={0.005} onChange={P('scaleX')} />
            <Num label="Tracking" value={layer.tracking} min={-0.15} max={0.3} step={0.001} onChange={P('tracking')} />
            <Num label="Interlínea" value={layer.leading} min={0.6} max={1.6} step={0.01} onChange={P('leading')} />
            <Seg label="Alinear" value={layer.align} options={[['left', 'Izq'], ['center', 'Centro'], ['right', 'Der']]} onChange={P('align')} />
            <Swatches label="Color" value={layer.fill} palette={pal} onChange={(t) => t && P('fill')(t)} />
            <Row label="">
              <Btn onClick={actions.fitToBlock} title="Escala el titular al ancho del bloque que tiene debajo">Ajustar al bloque</Btn>
            </Row>
          </Section>
          <Section title="Tratamiento">
            <Seg label="Tipo" value={layer.treatment} options={[['kv', 'KV'], ['pixel', 'Pixel'], ['clean', 'Limpio']]} onChange={P('treatment')} />
            {layer.treatment === 'kv' && (
              <>
                <Num label="Facetas" value={layer.chamfer} min={0} max={1.5} step={0.01} onChange={P('chamfer')} />
                <Seg label="Muescas" value={layer.notches} options={[['off', 'No'], ['tall', 'Altas'], ['all', 'Todas']]} onChange={P('notches')} />
                {layer.notches !== 'off' && (
                  <>
                    <Num label="Muesca ancho" value={layer.notchW} min={0.1} max={0.9} step={0.01} onChange={P('notchW')} />
                    <Num label="Muesca prof." value={layer.notchD} min={0.05} max={1} step={0.01} onChange={P('notchD')} />
                  </>
                )}
                <Num label="Tinta irregular" value={layer.rough} min={0} max={1.5} step={0.01} onChange={P('rough')} />
                <Num label="Esquinas suaves" value={layer.soft} min={0} max={1.5} step={0.01} onChange={P('soft')} />
              </>
            )}
            {layer.treatment === 'pixel' && <Num label="Celda @1080" value={layer.cell} min={2} max={30} step={1} onChange={P('cell')} />}
          </Section>
        </>
      )}

      {layer.type === 'text' && (
        <Section title="Texto">
          <TextBox label="Copy" value={layer.text} onChange={(v) => patch((l) => ((l as typeof layer).text = v), `${layer.id}.text`)} rows={3} />
          <Select label="Fuente" value={layer.font} options={textFontOpts} onChange={P('font')} />
          <Num label="Cuerpo" value={layer.size} min={6} max={600} onChange={P('size')} />
          <Num label="Tracking" value={layer.tracking} min={-0.1} max={0.4} step={0.001} onChange={P('tracking')} />
          <Num label="Interlínea" value={layer.leading} min={0.7} max={2} step={0.01} onChange={P('leading')} />
          <Seg label="Alinear" value={layer.align} options={[['left', 'Izq'], ['center', 'Centro'], ['right', 'Der']]} onChange={P('align')} />
          <Swatches label="Color" value={layer.fill} palette={pal} onChange={(t) => t && P('fill')(t)} />
        </Section>
      )}

      {layer.type === 'block' && (
        <Section title="Bloque">
          <Swatches label="Color" value={layer.fill} palette={pal} onChange={(t) => t && P('fill')(t)} />
        </Section>
      )}

      {layer.type === 'bracket' && (
        <Section title="Escuadra">
          <Num label="Barra" value={round(layer.barH)} min={4} max={600} onChange={P('barH')} />
          <Num label="Pata" value={round(layer.legW)} min={4} max={600} onChange={P('legW')} />
          <Seg label="Esquina" value={layer.corner} options={[['nw', '┌'], ['ne', '┐'], ['sw', '└'], ['se', '┘']]} onChange={P('corner')} />
          <Swatches label="Color" value={layer.fill} palette={pal} onChange={(t) => t && P('fill')(t)} />
        </Section>
      )}

      {layer.type === 'grid' && <GridSection layer={layer} doc={doc} patch={patch} />}

      {layer.type === 'shape' && (
        <Section title="Forma">
          <Select label="Forma" value={layer.shape} options={shapeOpts} onChange={P('shape')} />
          <Num label="Tamaño" value={round(layer.size)} min={4} max={1200} onChange={P('size')} />
          <Num label="Rotación" value={layer.rotation} min={-180} max={180} step={0.5} onChange={P('rotation')} />
          {layer.shape === 'asterisk' && (
            <>
              <Num label="Brazos" value={layer.arms} min={3} max={12} onChange={P('arms')} />
              <Num label="Punta / raíz" value={layer.flare} min={0.4} max={2.5} step={0.01} onChange={P('flare')} />
            </>
          )}
          {['asterisk', 'arrow', 'plus', 'ghost'].includes(layer.shape) && (
            <Num label="Grosor" value={layer.thickness} min={0.05} max={0.8} step={0.01} onChange={P('thickness')} />
          )}
          {!['ghost', 'badge'].includes(layer.shape) && (
            <>
              <Num label="Tinta irregular" value={layer.rough} min={0} max={1.5} step={0.01} onChange={P('rough')} />
              <Num label="Esquinas suaves" value={layer.soft} min={0} max={1.5} step={0.01} onChange={P('soft')} />
            </>
          )}
          <Swatches label="Color" value={layer.fill} palette={pal} onChange={(t) => t && P('fill')(t)} />
        </Section>
      )}

      {layer.type === 'lockup' && (
        <Section title="Lockup">
          <Row label="Wordmark">
            <input type="text" value={layer.text} onChange={(e) => P('text')(e.target.value)} />
          </Row>
          <Num label="Alto" value={round(layer.h)} min={16} max={400} onChange={P('h')} />
          <Swatches label="Módulo 1" value={layer.c1} palette={pal} onChange={(t) => t && P('c1')(t)} />
          <Swatches label="Módulo 2" value={layer.c2} palette={pal} onChange={(t) => t && P('c2')(t)} />
          <Swatches label="Módulo 3" value={layer.c3} palette={pal} onChange={(t) => t && P('c3')(t)} />
        </Section>
      )}

      {layer.type === 'image' && (
        <Section title="Imagen">
          <Swatches label="Silueta" value={layer.tint} palette={pal} allowNone onChange={(t) => P('tint')(t)} />
          <Num label="Pixel @1080" value={layer.pixel} min={0} max={30} onChange={P('pixel')} />
          <Row label="">
            <Btn
              onClick={() =>
                patch((l) => {
                  if (l.type !== 'image') return;
                  const im = new Image();
                  im.src = l.src;
                  if (im.naturalWidth) l.h = (l.w * im.naturalHeight) / im.naturalWidth;
                })
              }
            >
              Proporción original
            </Btn>
          </Row>
        </Section>
      )}
    </>
  );
}

function GridSection({ layer, doc, patch }: { layer: Extract<Layer, { type: 'grid' }>; doc: Composition; patch: Patch }) {
  const g = layer.gen ?? { cols: 8, rows: 8, seed: 1, irr: 0.5 };
  const regen = (over: Partial<typeof g>) =>
    patch((l) => {
      if (l.type !== 'grid') return;
      const n = { ...g, ...over };
      l.gen = n;
      l.lines = generateGrid(n.cols, n.rows, n.seed, n.irr);
    }, `${layer.id}.gen`);
  return (
    <Section title="Grilla">
      <Num label="Trazo" value={layer.weight} min={0.5} max={6} step={0.1} onChange={(v) => patch((l) => l.type === 'grid' && (l.weight = v), `${layer.id}.w`)} />
      <Swatches label="Color" value={layer.stroke} palette={doc.palette} onChange={(t) => t && patch((l) => l.type === 'grid' && (l.stroke = t))} />
      <Num label="Columnas" value={g.cols} min={1} max={40} onChange={(v) => regen({ cols: v })} />
      <Num label="Filas" value={g.rows} min={1} max={40} onChange={(v) => regen({ rows: v })} />
      <Num label="Irregular" value={g.irr} min={0} max={1} step={0.01} onChange={(v) => regen({ irr: v })} />
      <Row label="">
        <Btn onClick={() => regen({ seed: g.seed + 1 })}>Otra variante</Btn>
      </Row>
      <p className="hint">{layer.lines.length} segmentos. Columnas / filas regeneran la grilla (la del master se pierde; ⌘Z la vuelve).</p>
    </Section>
  );
}

export function DocInspector({
  doc,
  setDoc,
  view,
  setView,
}: {
  doc: Composition;
  setDoc: (fn: (d: Composition) => void, key?: string) => void;
  view: ViewState;
  setView: (v: Partial<ViewState>) => void;
}) {
  return (
    <>
      <Section title="Composición">
        <Row label="Nombre">
          <input type="text" value={doc.name} onChange={(e) => setDoc((d) => (d.name = e.target.value), 'name')} />
        </Row>
        <p className="hint">
          {FORMATS[doc.format].label} · {doc.width}×{doc.height}px · {doc.layers.length} capas
        </p>
      </Section>
      <Section title="Paleta">
        <Row label="Preset">
          <select value="" onChange={(e) => e.target.value && setDoc((d) => (d.palette = { ...PALETTES[e.target.value] }))}>
            <option value="">Elegir…</option>
            {Object.keys(PALETTES).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Row>
        {TOKENS.map((t: Token) => (
          <Row key={t} label={t}>
            <span className="hex">
              <input type="color" value={doc.palette[t]} onChange={(e) => setDoc((d) => (d.palette[t] = e.target.value.toUpperCase()), `pal.${t}`)} />
              <code>{doc.palette[t]}</code>
            </span>
          </Row>
        ))}
      </Section>
      <Section title="Papel">
        <Num label="Grano" value={doc.paper.grain} min={0} max={1.5} step={0.01} onChange={(v) => setDoc((d) => (d.paper.grain = v), 'grain')} />
        <Num label="Manchas" value={doc.paper.mottle} min={0} max={1.5} step={0.01} onChange={(v) => setDoc((d) => (d.paper.mottle = v), 'mottle')} />
        <Num label="Semilla" value={doc.paper.seed} min={1} max={999} onChange={(v) => setDoc((d) => (d.paper.seed = Math.round(v)), 'seed')} />
      </Section>
      <Section title="Cruces de registro">
        <Toggle label="Visibles" value={doc.crosses.visible} onChange={(v) => setDoc((d) => (d.crosses.visible = v))} />
        <Seg label="Dónde" value={doc.crosses.mode} options={[['perimeter', 'Borde'], ['all', 'Todas']]} onChange={(v) => setDoc((d) => (d.crosses.mode = v))} />
        <Num label="Tamaño" value={doc.crosses.size} min={2} max={60} onChange={(v) => setDoc((d) => (d.crosses.size = v), 'csize')} />
        <Num label="Trazo" value={doc.crosses.weight} min={0.5} max={6} step={0.1} onChange={(v) => setDoc((d) => (d.crosses.weight = v), 'cweight')} />
      </Section>
      <Section title="Vista">
        <Toggle label="Snap" value={view.snap} onChange={(v) => setView({ snap: v })} />
        <Num label="Unidad" value={view.unit} min={1} max={120} onChange={(v) => setView({ unit: Math.max(1, Math.round(v)) })} />
        <Toggle label="Guías inteligentes" value={view.smart} onChange={(v) => setView({ smart: v })} />
        {doc.format === '16x9' && (
          <>
            <Toggle label="Ver KV original" value={view.ref} onChange={(v) => setView({ ref: v })} />
            {view.ref && (
              <>
                <Num label="Opacidad" value={view.refOpacity} min={0} max={1} step={0.01} onChange={(v) => setView({ refOpacity: v })} />
                <Toggle label="Diferencia" value={view.refDiff} onChange={(v) => setView({ refDiff: v })} />
              </>
            )}
          </>
        )}
      </Section>
    </>
  );
}

export interface ViewState {
  snap: boolean;
  unit: number;
  smart: boolean;
  ref: boolean;
  refOpacity: number;
  refDiff: boolean;
}

const round = (v: number) => Math.round(v * 10) / 10;

export function typeLabel(l: Layer) {
  return (
    {
      block: 'Bloque',
      bracket: 'Escuadra',
      grid: 'Grilla',
      headline: 'Titular',
      text: 'Texto',
      shape: 'Forma',
      lockup: 'Lockup',
      image: 'Imagen',
    } as const
  )[l.type];
}
