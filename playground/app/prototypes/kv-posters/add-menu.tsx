"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { arc, flower, headline, mark, spiral } from "./elements";
import { uid } from "./random";
import type { Element, Poster } from "./types";

const ITEMS: [string, (p: Poster) => Element][] = [
  ["Flower", (p) => flower(p.width / 2, p.height / 2, p.width * 0.22, ["pink", "lilac"])],
  ["Scalloped flower", (p) => flower(p.width / 2, p.height / 2, p.width * 0.25, ["cream"], { style: "scallop", petals: 14 })],
  ["Spiral", (p) => spiral(p.width / 2, p.height / 2, p.width * 0.25, ["blue", "pink", "mint", "yellow", "cream"])],
  ["Arc", (p) => arc(p.width / 2, p.height / 2, p.width * 0.15, p.width * 0.045, ["pink", "orange", "cream"], Math.PI, Math.PI * 2)],
  ["Block", (p) => ({ id: uid("b"), kind: "block", x: p.width * 0.35, y: p.height * 0.4, w: p.width * 0.3, h: p.height * 0.15, fill: "blue" })],
  ["Asterisk", (p) => mark(p.width / 2, p.height / 2, p.width * 0.07)],
  ["Text", (p) => headline(p.width * 0.1, p.height * 0.4, p.width * 0.12, "Survey open")],
];

export function AddMenu({ poster, onAdd }: { poster: Poster; onAdd: (e: Element) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Add element" className="size-11 sm:w-auto sm:px-3">
          <PlusIcon />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ITEMS.map(([label, make]) => (
          <DropdownMenuItem key={label} className="min-h-11" onSelect={() => onAdd(make(poster))}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
