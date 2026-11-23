"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Parse<T> = (text: string) => { ok: true; value: T } | { ok: false; error: string };

/** One array item per line: readable, and diff-friendly when pasted elsewhere. */
export function formatJSON(value: unknown): string {
  if (!Array.isArray(value)) return JSON.stringify(value, null, 2);
  return `[\n${value.map((v) => `  ${JSON.stringify(v)}`).join(",\n")}\n]`;
}

/** JSON textarea for a tool's data. Edits apply on "Apply"; errors are shown, never thrown. */
export function DataEditor<T>({
  label,
  value,
  isExample,
  parse,
  onApply,
  onRestore,
}: {
  label: string;
  value: T;
  isExample: boolean;
  parse: Parse<T>;
  onApply: (v: T) => void;
  onRestore: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const text = draft ?? formatJSON(value);

  const apply = () => {
    const r = parse(text);
    if (!r.ok) return setError(r.error);
    setError(null);
    setDraft(null);
    onApply(r.value);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {isExample && <Badge variant="outline">Example data</Badge>}
      </div>
      <Textarea
        id={id}
        value={text}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        className="h-44 resize-y font-mono text-xs [field-sizing:fixed] md:text-xs"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={apply} disabled={draft === null}>
          Apply
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setDraft(null);
            setError(null);
            onRestore();
          }}
          disabled={isExample && draft === null}
        >
          Use example
        </Button>
      </div>
    </div>
  );
}
