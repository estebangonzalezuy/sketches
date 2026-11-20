"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TagFilter } from "./tag-filter";

type Props = {
  query: string;
  onQuery: (q: string) => void;
  tags: string[];
  selected: string[];
  onToggleTag: (tag: string) => void;
  hiddenCount: number;
  showHidden: boolean;
  onShowHidden: (v: boolean) => void;
};

export function GalleryToolbar(props: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            aria-label="Search prototypes"
            value={props.query}
            onChange={(e) => props.onQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && props.onQuery("")}
            className="pl-8"
          />
        </div>
        {props.hiddenCount > 0 && (
          <Label className="flex min-h-11 shrink-0 items-center gap-2 text-sm font-normal text-muted-foreground sm:min-h-0">
            <Switch checked={props.showHidden} onCheckedChange={props.onShowHidden} />
            Hidden
          </Label>
        )}
      </div>
      {props.tags.length > 0 && (
        <TagFilter tags={props.tags} selected={props.selected} onToggle={props.onToggleTag} />
      )}
    </div>
  );
}
