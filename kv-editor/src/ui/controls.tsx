import { useEffect, useState, type ReactNode } from 'react';
import { TOKENS, type Palette, type Token } from '../model';

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="sec">
      <header>
        <span>{title}</span>
        {right}
      </header>
      <div className="sec-body">{children}</div>
    </section>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="row">
      <span className="row-label">{label}</span>
      <span className="row-ctl">{children}</span>
    </label>
  );
}

export function Num({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  slider = true,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  slider?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(Math.round(value / step) * step === value ? value : +value.toFixed(3));
  return (
    <Row label={label}>
      {slider && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          onChange={(e) => onChange(+e.target.value)}
        />
      )}
      <input
        className="num"
        type="text"
        inputMode="decimal"
        value={shown}
        onFocus={() => setDraft(String(+value.toFixed(3)))}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
            const v = +(value + d).toFixed(4);
            onChange(v);
            setDraft(String(v));
          }
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
    </Row>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <Row label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Row>
  );
}

export function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <Row label={label}>
      <span className="seg">
        {options.map(([v, l]) => (
          <button key={v} type="button" className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </span>
    </Row>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </Row>
  );
}

export function Swatches({
  label,
  value,
  palette,
  onChange,
  allowNone,
}: {
  label: string;
  value: Token | null;
  palette: Palette;
  onChange: (t: Token | null) => void;
  allowNone?: boolean;
}) {
  return (
    <Row label={label}>
      <span className="swatches">
        {allowNone && (
          <button type="button" title="original" className={`sw none ${value === null ? 'on' : ''}`} onClick={() => onChange(null)}>
            ∅
          </button>
        )}
        {TOKENS.map((t) => (
          <button
            key={t}
            type="button"
            title={t}
            className={`sw ${value === t ? 'on' : ''}`}
            style={{ background: palette[t] }}
            onClick={() => onChange(t)}
          />
        ))}
      </span>
    </Row>
  );
}

export function TextBox({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <Row label={label}>
      <textarea
        rows={rows}
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          onChange(e.target.value);
        }}
      />
    </Row>
  );
}

export function Btn({ children, onClick, title, on }: { children: ReactNode; onClick: () => void; title?: string; on?: boolean }) {
  return (
    <button type="button" className={`btn ${on ? 'on' : ''}`} title={title} onClick={onClick}>
      {children}
    </button>
  );
}
