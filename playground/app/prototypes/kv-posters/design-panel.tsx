"use client";

import { ArrowDownIcon, ArrowUpIcon, CopyIcon, DicesIcon, Redo2Icon, Trash2Icon, Undo2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddMenu } from "./add-menu";
import { ElementInspector } from "./element-inspector";
import { uid } from "./random";
import { NAMES } from "./data";
import type { Element, Palette, Poster } from "./types";


export interface DesignActions {
  newPoster: () => void;
  edit: (fn: (p: Poster) => Poster, group?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  select: (id: string | null) => void;
}

const Icon = ({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <Button variant="outline" size="icon" aria-label={label} disabled={disabled} onClick={onClick}>
    {children}
  </Button>
);

export function DesignPanel({ poster, palette, selected, a }: { poster: Poster; palette: Palette; selected: string | null; a: DesignActions }) {
  const el = poster.elements.find((e) => e.id === selected);
  const update = (fn: (els: Element[]) => Element[], group?: string) => a.edit((p) => ({ ...p, elements: fn(p.elements) }), group);
  const move = (dir: 1 | -1) =>
    update((els) => {
      const i = els.findIndex((e) => e.id === selected);
      const j = Math.max(0, Math.min(els.length - 1, i + dir));
      const next = [...els];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={a.newPoster} aria-label="New poster" className="size-11 sm:w-auto sm:px-3">
          <DicesIcon />
          <span className="hidden sm:inline">New poster</span>
        </Button>
        <AddMenu poster={poster} onAdd={(e) => (update((els) => [...els, e]), a.select(e.id))} />
        <Icon label="Undo" onClick={a.undo} disabled={!a.canUndo}><Undo2Icon /></Icon>
        <Icon label="Redo" onClick={a.redo} disabled={!a.canRedo}><Redo2Icon /></Icon>
      </div>
      {el ? (
        <section className="grid gap-4 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{NAMES[el.kind]}</h2>
            <div className="flex gap-1">
              <Icon label="Bring forward" onClick={() => move(1)}><ArrowUpIcon /></Icon>
              <Icon label="Send backward" onClick={() => move(-1)}><ArrowDownIcon /></Icon>
              <Icon label="Duplicate" onClick={() => { const d = { ...el, id: uid("d") }; update((els) => [...els, "cx" in d ? { ...d, cx: d.cx + 30, cy: d.cy + 30 } : { ...d, x: d.x + 30, y: d.y + 30 }] as Element[]); a.select(d.id); }}><CopyIcon /></Icon>
              <Icon label="Delete" onClick={() => { update((els) => els.filter((e) => e.id !== el.id)); a.select(null); }}><Trash2Icon /></Icon>
            </div>
          </div>
          <ElementInspector el={el} palette={palette} width={poster.width} set={(patch) => update((els) => els.map((e) => (e.id === el.id ? ({ ...e, ...patch } as Element) : e)), `${el.id}`)} />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">Tap something on the poster to edit it. Drag to move it.</p>
      )}
    </div>
  );
}
