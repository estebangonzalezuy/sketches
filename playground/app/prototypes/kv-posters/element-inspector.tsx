"use client";

import { NumberField, SwatchField, SwitchField, TextField } from "./fields";
import type { Element, Palette } from "./types";

/** Settings for the selected element. `set` merges a partial update (one undo step per gesture). */
export function ElementInspector({ el, palette, width, set }: { el: Element; palette: Palette; width: number; set: (patch: Partial<Element>) => void }) {
  const W = width;
  switch (el.kind) {
    case "headline":
      return (
        <>
          <TextField label="Text" value={el.text} onChange={(text) => set({ text })} />
          <NumberField label="Size" value={el.size} min={40} max={W * 0.4} onChange={(size) => set({ size })} />
          <SwitchField label="Box" value={el.box} onChange={(box) => set({ box })} />
          {el.box && <SwitchField label="Box outline" value={el.boxLine !== false} onChange={(boxLine) => set({ boxLine })} />}
          <SwitchField label="Vertical" value={el.vertical} onChange={(vertical) => set({ vertical })} />
          <SwitchField label="Outline only" value={!!el.outline} onChange={(outline) => set({ outline })} />
          <SwatchField label={el.outline ? "Outline colour" : "Colour"} palette={palette} value={[el.fill ?? "ink"]} onChange={([fill]) => set({ fill })} />
        </>
      );
    case "lockup":
      return (
        <>
          <TextField label="Text" value={el.text} onChange={(text) => set({ text })} />
          <NumberField label="Size" value={el.size} min={20} max={W * 0.15} onChange={(size) => set({ size })} />
          <SwitchField label="Box" value={el.box} onChange={(box) => set({ box })} />
          {el.box && <SwitchField label="Box outline" value={el.boxLine !== false} onChange={(boxLine) => set({ boxLine })} />}
          <SwitchField label="Outline only" value={!!el.outline} onChange={(outline) => set({ outline })} />
          <SwatchField label={el.outline ? "Outline colour" : "Colour"} palette={palette} value={[el.fill ?? "ink"]} onChange={([fill]) => set({ fill })} />
        </>
      );
    case "flower":
      return (
        <>
          <NumberField label="Size" value={el.r} min={W * 0.05} max={W * 0.6} onChange={(r) => set({ r })} />
          <NumberField label="Petals" value={el.petals} min={4} max={18} onChange={(petals) => set({ petals })} />
          <NumberField label="Rotation" value={el.rot} min={-Math.PI} max={Math.PI} step={0.01} onChange={(rot) => set({ rot })} />
          <SwitchField label="Scalloped" value={el.style === "scallop"} onChange={(v) => set({ style: v ? "scallop" : "petal" })} />
          <SwitchField label="Ticks" value={el.ticks} onChange={(ticks) => set({ ticks })} />
          <SwatchField multi label="Petals" palette={palette} value={el.fills} onChange={(fills) => set({ fills })} />
          <SwatchField label="Centre" palette={palette} value={[el.disc]} onChange={([disc]) => set({ disc })} />
          <SwatchField label="Dots" palette={palette} value={[el.dots]} onChange={([dots]) => set({ dots })} />
        </>
      );
    case "spiral":
      return (
        <>
          <NumberField label="Size" value={el.r} min={W * 0.08} max={W * 0.6} onChange={(r) => set({ r })} />
          <NumberField label="Rings" value={el.rings} min={2} max={7} onChange={(rings) => set({ rings })} />
          <NumberField label="Per ring" value={el.perRing} min={4} max={14} onChange={(perRing) => set({ perRing })} />
          <NumberField label="Rotation" value={el.rot} min={-Math.PI} max={Math.PI} step={0.01} onChange={(rot) => set({ rot })} />
          <SwatchField multi label="Colours" palette={palette} value={el.fills} onChange={(fills) => set({ fills })} />
        </>
      );
    case "bands":
      return (
        <>
          <NumberField label="Band" value={el.band} min={W * 0.01} max={W * 0.08} onChange={(band) => set({ band })} />
          <SwatchField multi label="Frames" palette={palette} value={el.fills} onChange={(fills) => set({ fills })} />
        </>
      );
    case "block":
      return (
        <>
          <NumberField label="Width" value={el.w} min={10} max={W} onChange={(w) => set({ w })} />
          <NumberField label="Height" value={el.h} min={10} max={W * 1.8} onChange={(h) => set({ h })} />
          <SwatchField label="Colour" palette={palette} value={[el.fill]} onChange={([fill]) => set({ fill })} />
        </>
      );
    case "mark":
      return (
        <>
          <NumberField label="Size" value={el.size} min={20} max={W * 0.3} onChange={(size) => set({ size })} />
          <NumberField label="Roundness" value={el.round ?? 1} min={0} max={1} step={0.01} onChange={(round) => set({ round })} />
          <SwitchField label="Box" value={el.box} onChange={(box) => set({ box })} />
          {el.box && <SwitchField label="Box outline" value={el.boxLine !== false} onChange={(boxLine) => set({ boxLine })} />}
          <SwatchField label="Colour" palette={palette} value={[el.fill]} onChange={([fill]) => set({ fill })} />
        </>
      );
  }
}
